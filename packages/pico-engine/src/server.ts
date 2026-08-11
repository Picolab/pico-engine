import * as bodyParser from "body-parser";
import * as express from "express";
import { Express, Request, Response } from "express";
import helmet from "helmet";
import * as _ from "lodash";
import * as path from "path";
import { PicoEngineCore } from "pico-engine-core";
import { PicoFramework } from "pico-framework";
import { AuthError, AuthService } from "./auth";
import { OAuthError, OAuthService, parseApproveBody, parseAuthorizeQuery, renderConsentHtml } from "./oauth";
import { uiECIForRoot } from "./provisionRoot";
import { IdentityService } from "./identity/IdentityService";
import { registerWebvhRoutes } from "./identity/webvhRoutes";
import { registerDidcommIngressRoutes } from "./identity/didcommIngressRoutes";

const engineVersion = require("../package.json").version;

const SESSION_COOKIE = "pico-session";
const CEREMONY_COOKIE = "pico-ceremony";

function localhostChannelBypassEnabled(): boolean {
  return process.env.PICO_ENGINE_ALLOW_LOCALHOST_C !== "0";
}

function mergeGetPost(req: Request) {
  // give preference to post body params
  return _.assign({}, req.query, req.body, { _headers: req.headers });
}

function parseCookies(req: Request): { [name: string]: string } {
  const header = req.headers.cookie;
  const out: { [name: string]: string } = {};
  if (typeof header !== "string") {
    return out;
  }
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) {
      continue;
    }
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (name) {
      out[name] = decodeURIComponent(value);
    }
  }
  return out;
}

function isLocalhostAddress(addr: string | undefined): boolean {
  if (!addr) {
    return false;
  }
  const normalized = addr.replace(/^::ffff:/, "");
  return normalized === "127.0.0.1" || normalized === "::1";
}

function isLocalhostRequest(req: Request): boolean {
  if (isLocalhostAddress(req.ip)) {
    return true;
  }
  if (isLocalhostAddress(req.socket?.remoteAddress)) {
    return true;
  }
  const host = req.headers.host || "";
  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

export function server(
  core: PicoEngineCore,
  uiECI: string | null,
  auth?: AuthService,
  oauth?: OAuthService,
  identity?: IdentityService
): Express {
  const pf = core.picoFramework;
  const app = express();

  app.use(function(req, res, next) {
    // /auth routes need a specific credentialed CORS origin (below), not "*".
    if (req.path.indexOf("/auth") === 0) {
      return next();
    }
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
  });
  app.use('*',(req,res,next) =>{
    if (req.path.indexOf("/auth") === 0) {
      return next();
    }
    if (req.method == "OPTIONS") {
      res.header("Allow", "POST, GET, OPTIONS");
      res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
      res.status(200);
      res.send();
    }else{
      next();
    }
  });
  // Helmet 7+ CSP defaults include upgrade-insecure-requests, which breaks the
  // UI on plain HTTP (browser upgrades /api/* to https and TLS fails).
  // OAuth consent pages must not use form-action 'self' — after Allow, the
  // browser follows a redirect to the app's redirect_uri (external origin).
  const defaultHelmet = helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "upgrade-insecure-requests": null,
      },
    },
  });
  app.use(function (req, res, next) {
    if (req.path === "/oauth/authorize" || req.path === "/oauth/approve") {
      return helmet({ contentSecurityPolicy: false })(req, res, next);
    }
    return defaultHelmet(req, res, next);
  });
  app.use(express.static(path.resolve(__dirname, "..", "public")));

  if (identity) {
    registerWebvhRoutes(app, identity);
  }

  app.use(
    bodyParser.json({
      type: [
        "application/json",
        "application/octet-stream",
        "application/ssi-agent-wire",
        "application/didcomm-encrypted+json",
      ],
    })
  );
  app.use(
    bodyParser.urlencoded({
      limit: "512mb",
      type: "application/x-www-form-urlencoded",
      extended: false,
    })
  );

  if (identity) {
    registerDidcommIngressRoutes(app, identity);
  }

  if (auth) {
    registerAuthRoutes(app, auth);
  }

  function isEciInRootTree(rootPicoId: string, eci: string): boolean {
    try {
      let pico = pf.getPico(eci);
      while (pico) {
        if (pico.id === rootPicoId) {
          return true;
        }
        if (!pico.parent) {
          return false;
        }
        pico = pf.getPico(pico.parent);
      }
    } catch (_e) {
      return false;
    }
    return false;
  }

  function requireAuthSession(
    req: Request,
    res: Response,
    next: express.NextFunction
  ) {
    if (!auth) {
      next();
      return;
    }
    const token = parseCookies(req)[SESSION_COOKIE] || "";
    auth
      .getSession(token)
      .then((session) => {
        if (!session) {
          res.status(401).json({ error: "Not authenticated" });
          return;
        }
        const eci = req.params.eci;
        if (eci && !isEciInRootTree(session.rootPicoId, eci)) {
          res.status(403).json({ error: "Not authorized for this pico" });
          return;
        }
        (req as any).picoSession = session;
        next();
      })
      .catch(next);
  }

  /** `/c/*` is internal: passkey session, or localhost for in-engine HTTP loops. */
  function requireChannelSession(
    req: Request,
    res: Response,
    next: express.NextFunction
  ) {
    if (!auth) {
      next();
      return;
    }
    if (localhostChannelBypassEnabled() && isLocalhostRequest(req)) {
      next();
      return;
    }
    requireAuthSession(req, res, next);
  }

  /** External Sky API: Bearer when channel is oauth-webhook or mesh has OAuth ruleset. */
  function requireSkyBearerIfOAuth(
    req: Request,
    res: Response,
    next: express.NextFunction
  ) {
    if (!oauth) {
      next();
      return;
    }
    const eci = req.params.eci;
    if (!eci) {
      next();
      return;
    }
    oauth
      .skyRequiresBearer(eci)
      .then((required) => {
        if (!required) {
          next();
          return;
        }
        const header = req.headers.authorization;
        if (typeof header !== "string" || !header.startsWith("Bearer ")) {
          res.status(401).json({ error: "Bearer token required" });
          return;
        }
        const token = header.slice("Bearer ".length).trim();
        return oauth.validateSkyBearerToken(token, eci).then((valid) => {
          if (!valid) {
            res.status(401).json({ error: "Invalid or expired token" });
            return;
          }
          next();
        });
      })
      .catch(next);
  }

  if (oauth) {
    registerOAuthRoutes(app, oauth, auth, requireAuthSession, parseCookies);
  }

  app.get("/api/mesh-context", function (req, res, next) {
    if (!oauth) {
      res.status(503).json({ error: "OAuth not enabled" });
      return;
    }
    const header = req.headers.authorization;
    if (typeof header !== "string" || !header.startsWith("Bearer ")) {
      res.status(401).json({ error: "Bearer token required" });
      return;
    }
    const token = header.slice("Bearer ".length).trim();
    oauth
      .resolveMeshBearerToken(token)
      .then((ctx) => {
        if (!ctx) {
          res.status(401).json({ error: "Invalid or expired token" });
          return;
        }
        const rootUiEci = uiECIForRoot(pf, ctx.rootPicoId);
        if (!rootUiEci) {
          res.status(503).json({ error: "Mesh UI channel not found" });
          return;
        }
        let baseUrl = core.base_url;
        if (!baseUrl) {
          baseUrl = `${req.protocol}://${req.get("host") || "localhost"}`;
        }
        baseUrl = baseUrl.replace(/\/$/, "");
        res.json({
          baseUrl,
          rootUiEci,
          oauth: {
            authorize: `${baseUrl}/oauth/authorize`,
            token: `${baseUrl}/oauth/token`,
          },
          scope: ctx.scope,
        });
      })
      .catch(next);
  });

  app.get("/api/ui-context", function (req, res, next) {
    const hasRoots = pf.rootPicos().length > 0;
    const base: any = {
      version: engineVersion,
      hasRoots,
      allowSelfSignup: auth ? auth.allowSelfSignup() : false,
    };
    if (!auth) {
      base.eci = uiECI;
      res.json(base);
      return;
    }
    const token = parseCookies(req)[SESSION_COOKIE] || "";
    auth
      .needsAuthMigration()
      .then((needsAuthMigration) => {
        base.needsAuthMigration = needsAuthMigration;
        return auth.whoami(token);
      })
      .then((who) => {
        base.session = who;
        if (who.authenticated && who.uiECI) {
          base.eci = who.uiECI;
        }
        res.json(base);
      })
      .catch(next);
  });

  app.all("/api/flush", requireAuthSession, function (req, res, next) {
    const attrs = mergeGetPost(req);
    const url = attrs["url"];
    if (typeof url !== "string") {
      next(new TypeError("Expected `url`"));
    } else {
      core.rsRegistry
        .flush(url)
        .then((rs) => {
          res.json({
            url: rs.url,
            rid: rs.rid,
            hash: rs.hash,
            flushed: rs.flushed,
            compiler: rs.compiler,
          });
        })
        .catch(next);
    }
  });

  app.all("/c/:eci/event/:domain/:name", requireChannelSession, function (req, res, next) {
    core
      .event({
        eci: req.params.eci,
        domain: req.params.domain,
        name: req.params.name,
        data: { attrs: mergeGetPost(req) },
        time: 0, // TODO remove this typescript requirement
      })
      .then((eid) => {
        res.json(eid);
      })
      .catch(next);
  });

  app.all("/c/:eci/event-wait/:domain/:name", requireChannelSession, function (req, res, next) {
    core
      .eventWait({
        eci: req.params.eci,
        domain: req.params.domain,
        name: req.params.name,
        data: { attrs: mergeGetPost(req) },
        time: 0, // TODO remove this typescript requirement
      })
      .then((data) => {
        res.json(data);
      })
      .catch(next);
  });

  app.all("/sky/event/:eci/:eid/:domain/:type", requireSkyBearerIfOAuth, function (req, res, next) {
    const attrs = mergeGetPost(req);
    if (req.params.eid !== "none" && !attrs.hasOwnProperty("__eid")) {
      attrs.__eid = req.params.eid;
    }
    core
      .eventWait({
        eci: req.params.eci,
        domain: req.params.domain,
        name: req.params["type"],
        data: { attrs },
        time: 0, // TODO remove this typescript requirement
      })
      .then((data) => {
        if (data.directives) {
          var _res = _.filter(data.directives, { name: "_cookie" });
          if (_res) {
            _.forEach(_res, function(v) {
              if (v.options && v.options.cookie) {
                res.append("Set-Cookie", v.options.cookie);
              }
            });
          }
          var _res = _.filter(data.directives, { name: "_redirect" });
          if (_res) {
            _.forEach(_res, function(v) {
              if (v.options && v.options.url) {
                return res.redirect(v.options.url);
              }
            });
          }
        }
        res.json(data);
      })
      .catch(next);
  });

  app.all(
    "/c/:eci/event/:domain/:name/query/:rid/:qname",
    requireChannelSession,
    function (req, res, next) {
      const attrs = mergeGetPost(req);
      core
        .eventQuery(
          {
            eci: req.params.eci,
            domain: req.params.domain,
            name: req.params.name,
            data: { attrs },
            time: 0, // TODO remove this typescript requirement
          },
          {
            eci: req.params.eci,
            rid: req.params.rid,
            name: req.params.qname,
            args: attrs,
          }
        )
        .then((data) => {
          res.json(data);
        })
        .catch(next);
    }
  );

  function handleSkyQuery(req: Request, res: Response, next: express.NextFunction) {
    const funcPart = req.params["function"].split(".");
    core
      .query({
        eci: req.params.eci,
        rid: req.params.rid,
        name: funcPart[0],
        args: mergeGetPost(req),
      })
      .then((data: any) => {
        if (funcPart[1] === "html") {
          res.header("Content-Type", "text/html");
          res.end(data);
        } else if (funcPart[1] === "txt") {
          res.header("Content-Type", "text/plain");
          res.end(data);
        } else {
          res.json(data);
        }
      })
      .catch(next);
  }

  app.all("/c/:eci/query/:rid/:name", requireChannelSession, function (req, res, next) {
    const funcPart = req.params.name.split(".");
    core
      .query({
        eci: req.params.eci,
        rid: req.params.rid,
        name: funcPart[0],
        args: mergeGetPost(req),
      })
      .then((data: any) => {
        if (funcPart[1] === "html") {
          res.header("Content-Type", "text/html");
          res.end(data);
        } else if (funcPart[1] === "txt") {
          res.header("Content-Type", "text/plain");
          res.end(data);
        } else {
          res.json(data);
        }
      })
      .catch(next);
  });

  app.all("/sky/query/:eci/:rid/:function", requireSkyBearerIfOAuth, handleSkyQuery);
  // Legacy alias; prefer /sky/query/ per Sky Query API docs.
  app.all("/sky/cloud/:eci/:rid/:function", requireSkyBearerIfOAuth, handleSkyQuery);

  app.use(function (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    if (err instanceof OAuthError) {
      res.status(err.statusCode).json({ error: err.oauthError, error_description: err.message });
      return;
    }
    let message = err + "";
    console.error(err);
    if (err?.krl_compiler?.loc?.start) {
      message +=
        " [at line " +
        err.krl_compiler.loc.start.line +
        " col " +
        err.krl_compiler.loc.start.column;
      if (
        err.krl_compiler.loc.end &&
        err.krl_compiler.loc.end.line !== err.krl_compiler.loc.start.line
      ) {
        message +=
          " to line " +
          err.krl_compiler.loc.end.line +
          " col " +
          err.krl_compiler.loc.end.column;
      }
      message += "]";
    } else if (err?.where?.filename) {
      message += ` [at line ${err.where.line} col ${err.where.col}]`;
    }
    res.json({ error: message });
  });

  return app;
}

function registerAuthRoutes(app: Express, auth: AuthService) {
  function setSessionCookie(res: Response, token: string, expiry: number) {
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: auth.isSecure(),
      path: "/",
      expires: new Date(expiry),
    });
  }

  function setCeremonyCookie(res: Response, ceremonyId: string) {
    res.cookie(CEREMONY_COOKIE, ceremonyId, {
      httpOnly: true,
      sameSite: "lax",
      secure: auth.isSecure(),
      path: "/",
      maxAge: 5 * 60 * 1000,
    });
  }

  function clearCeremonyCookie(res: Response) {
    res.clearCookie(CEREMONY_COOKIE, { path: "/" });
  }

  // WebAuthn requires a specific, credentialed origin — never "*".
  app.use("/auth", function (req, res, next) {
    res.header("Access-Control-Allow-Origin", auth.rp().origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header(
      "Access-Control-Allow-Methods",
      "POST, GET, DELETE, OPTIONS"
    );
    res.header("Vary", "Origin");
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });

  function requireSession(req: Request, res: Response, next: express.NextFunction) {
    const token = parseCookies(req)[SESSION_COOKIE] || "";
    auth
      .getSession(token)
      .then((session) => {
        if (!session) {
          res.status(401).json({ error: "Not authenticated" });
          return;
        }
        (req as any).picoSession = session;
        next();
      })
      .catch(next);
  }

  app.post("/auth/register/options", function (req, res, next) {
    auth
      .registerNewAccountOptions({
        displayName: req.body && req.body.displayName,
        invite: req.body && req.body.invite,
      })
      .then(({ options, ceremonyId }) => {
        setCeremonyCookie(res, ceremonyId);
        res.json(options);
      })
      .catch(next);
  });

  app.post("/auth/register/verify", function (req, res, next) {
    const ceremonyId = parseCookies(req)[CEREMONY_COOKIE] || "";
    auth
      .registerNewAccountVerify({ ceremonyId, response: req.body })
      .then(({ account, session, uiECI }) => {
        clearCeremonyCookie(res);
        setSessionCookie(res, session.token, session.expiry);
        res.json({
          verified: true,
          accountId: account.accountId,
          rootPicoId: account.rootPicoId,
          uiECI,
        });
      })
      .catch(next);
  });

  app.post("/auth/claim/options", function (req, res, next) {
    auth
      .claimPrimaryRootOptions({ displayName: req.body && req.body.displayName })
      .then(({ options, ceremonyId }) => {
        setCeremonyCookie(res, ceremonyId);
        res.json(options);
      })
      .catch(next);
  });

  app.post("/auth/claim/verify", function (req, res, next) {
    const ceremonyId = parseCookies(req)[CEREMONY_COOKIE] || "";
    auth
      .claimPrimaryRootVerify({ ceremonyId, response: req.body })
      .then(({ account, session, uiECI }) => {
        clearCeremonyCookie(res);
        setSessionCookie(res, session.token, session.expiry);
        res.json({
          verified: true,
          accountId: account.accountId,
          rootPicoId: account.rootPicoId,
          uiECI,
        });
      })
      .catch(next);
  });

  app.post("/auth/login/options", function (req, res, next) {
    auth
      .loginOptions()
      .then(({ options, ceremonyId }) => {
        setCeremonyCookie(res, ceremonyId);
        res.json(options);
      })
      .catch(next);
  });

  app.post("/auth/login/verify", function (req, res, next) {
    const ceremonyId = parseCookies(req)[CEREMONY_COOKIE] || "";
    auth
      .loginVerify({ ceremonyId, response: req.body })
      .then(({ account, session }) => {
        clearCeremonyCookie(res);
        setSessionCookie(res, session.token, session.expiry);
        res.json({
          verified: true,
          accountId: account.accountId,
          rootPicoId: account.rootPicoId,
        });
      })
      .catch(next);
  });

  app.post("/auth/logout", function (req, res, next) {
    const token = parseCookies(req)[SESSION_COOKIE] || "";
    auth
      .deleteSession(token)
      .then(() => {
        res.clearCookie(SESSION_COOKIE, { path: "/" });
        res.json({ ok: true });
      })
      .catch(next);
  });

  app.get("/auth/session", function (req, res, next) {
    const token = parseCookies(req)[SESSION_COOKIE] || "";
    auth
      .whoami(token)
      .then((who) => res.json(who))
      .catch(next);
  });

  app.post("/auth/credentials/options", requireSession, function (req, res, next) {
    const session = (req as any).picoSession;
    auth
      .addCredentialOptions({ accountId: session.accountId })
      .then(({ options, ceremonyId }) => {
        setCeremonyCookie(res, ceremonyId);
        res.json(options);
      })
      .catch(next);
  });

  app.post("/auth/credentials/verify", requireSession, function (req, res, next) {
    const session = (req as any).picoSession;
    const ceremonyId = parseCookies(req)[CEREMONY_COOKIE] || "";
    auth
      .addCredentialVerify({
        ceremonyId,
        accountId: session.accountId,
        response: req.body,
        label: req.body && req.body.label,
      })
      .then(({ credential }) => {
        clearCeremonyCookie(res);
        res.json({ verified: true, credential });
      })
      .catch(next);
  });

  app.delete("/auth/credentials/:id", requireSession, function (req, res, next) {
    const session = (req as any).picoSession;
    auth
      .deleteCredential(session.accountId, req.params.id)
      .then(() => res.json({ ok: true }))
      .catch(next);
  });

  app.get("/auth/invites/:token", function (req, res, next) {
    auth
      .peekInvite(req.params.token)
      .then((peek) => res.json(peek))
      .catch(next);
  });

  app.post("/auth/invites", requireSession, function (req, res, next) {
    const session = (req as any).picoSession;
    auth
      .createInvite({
        createdByAccountId: session.accountId,
        label: req.body && req.body.label,
        bootstrapUrl: req.body && req.body.bootstrapUrl,
      })
      .then((invite) => res.json(invite))
      .catch(next);
  });
}

function registerOAuthRoutes(
  app: Express,
  oauth: OAuthService,
  auth: AuthService | undefined,
  requireAuthSession: (
    req: Request,
    res: Response,
    next: express.NextFunction
  ) => void,
  parseCookiesFn: (req: Request) => { [name: string]: string }
) {
  function requireOAuthSession(
    req: Request,
    res: Response,
    next: express.NextFunction
  ) {
    if (!auth) {
      res.status(503).json({ error: "Authentication is not configured" });
      return;
    }
    const token = parseCookiesFn(req)[SESSION_COOKIE] || "";
    auth
      .getSession(token)
      .then((session) => {
        if (!session) {
          res.status(401).json({ error: "Not authenticated" });
          return;
        }
        (req as any).picoSession = session;
        next();
      })
      .catch(next);
  }

  app.post("/oauth/token", function (req, res, next) {
    // Prefer body, but accept query params too (manual/browser testing).
    const body = _.assign({}, req.query, req.body);
    oauth
      .tokenGrant(body)
      .then((token) => res.json(token))
      .catch(next);
  });

  // Browser-friendly alias for manual token exchange during development.
  app.get("/oauth/token", function (req, res, next) {
    oauth
      .tokenGrant(req.query as Record<string, unknown>)
      .then((token) => res.json(token))
      .catch(next);
  });

  app.get("/oauth/authorize", function (req, res, next) {
    let params;
    try {
      params = parseAuthorizeQuery(req.query as Record<string, unknown>);
    } catch (err) {
      next(err);
      return;
    }
    oauth
      .getAppForAuthorize(params)
      .then(async (appRecord) => {
        if (!auth) {
          res.status(503).send("Authentication is not configured");
          return;
        }
        const token = parseCookiesFn(req)[SESSION_COOKIE] || "";
        const session = await auth.getSession(token);
        if (!session) {
          const returnPath = req.originalUrl || "/oauth/authorize";
          res.redirect(
            "/?oauth_return=" + encodeURIComponent(returnPath)
          );
          return;
        }
        if (session.rootPicoId !== appRecord.rootPicoId) {
          res.status(403).send("Signed in to a different mesh");
          return;
        }
        res.type("html").send(renderConsentHtml(appRecord, params));
      })
      .catch(next);
  });

  app.post("/oauth/approve", function (req, res, next) {
    if (!auth) {
      res.status(503).send("Authentication is not configured");
      return;
    }
    const token = parseCookiesFn(req)[SESSION_COOKIE] || "";
    auth
      .getSession(token)
      .then((session) => {
        if (!session) {
          res.status(401).send("Not authenticated");
          return;
        }
        const params = parseApproveBody(req.body || {});
        return oauth
          .approveAuthorization(session, params)
          .then((redirectUrl) => {
            // 303 See Other: browser must follow with GET (OAuth code in query string).
            res.redirect(303, redirectUrl);
          });
      })
      .catch((err) => {
        if (err instanceof OAuthError) {
          const redirect_uri = String(req.body?.redirect_uri || "").trim();
          if (redirect_uri) {
            try {
              const url = new URL(redirect_uri);
              url.searchParams.set("error", err.oauthError);
              url.searchParams.set("error_description", err.message);
              const state = req.body?.state;
              if (state !== undefined && state !== "") {
                url.searchParams.set("state", String(state));
              }
              res.redirect(303, url.toString());
              return;
            } catch (_e) {
              // fall through to default error handler
            }
          }
        }
        next(err);
      });
  });

  app.get("/oauth/apps", requireOAuthSession, function (req, res, next) {
    const session = (req as any).picoSession;
    oauth
      .listApps(session.rootPicoId)
      .then((apps) => res.json({ apps }))
      .catch(next);
  });

  app.post("/oauth/apps", requireOAuthSession, function (req, res, next) {
    const session = (req as any).picoSession;
    const body = req.body || {};
    oauth
      .registerApp(session.rootPicoId, {
        name: body.name,
        redirect_uris: body.redirect_uris,
        public_client: body.public_client,
      })
      .then((app) => res.json(app))
      .catch(next);
  });

  app.delete("/oauth/apps/:clientId", requireOAuthSession, function (req, res, next) {
    const session = (req as any).picoSession;
    oauth
      .revokeApp(session.rootPicoId, req.params.clientId)
      .then(() => res.json({ ok: true }))
      .catch(next);
  });

  app.get("/oauth/channels/:eci/status", requireAuthSession, function (req, res, next) {
    oauth
      .channelStatusAsync(req.params.eci)
      .then((status) => res.json(status))
      .catch(next);
  });

  app.post("/oauth/channels/:eci/credentials", requireAuthSession, function (req, res, next) {
    oauth
      .createChannelSecret(req.params.eci)
      .then((creds) => res.json(creds))
      .catch(next);
  });

  app.delete("/oauth/channels/:eci/credentials", requireAuthSession, function (req, res, next) {
    oauth
      .revokeChannelSecret(req.params.eci)
      .then(() => res.json({ ok: true }))
      .catch(next);
  });

  app.delete("/oauth/channels/:eci/tokens", requireAuthSession, function (req, res, next) {
    oauth
      .revokeTokens(req.params.eci)
      .then(() => res.json({ ok: true }))
      .catch(next);
  });
}
