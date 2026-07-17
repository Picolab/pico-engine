import test from "ava";
import * as path from "path";
import { AuthError } from "../src/auth";
import { WebAuthnAdapter } from "../src/auth/webauthn";
import { toFileUrl } from "../src/utils/toFileUrl";
import { startIsolatedEngine } from "./helpers/isolatedEngine";

/**
 * A deterministic stand-in for a real authenticator. It never does crypto: it
 * simply "verifies" whatever it is handed and echoes back the credential id from
 * the ceremony response. This lets us exercise the full store + provisioning +
 * session wiring without a device.
 */
function fakeAuthenticator(): WebAuthnAdapter {
  let n = 0;
  return {
    async generateRegistrationOptions(req) {
      n += 1;
      return {
        challenge: `reg-challenge-${n}`,
        excludeCredentials: req.excludeCredentials?.map((c) => ({
          id: c.id,
          type: "public-key",
        })),
        user: {
          id: req.userID,
          name: req.userName,
          displayName: req.userDisplayName,
        },
      } as any;
    },
    async verifyRegistration({ response }) {
      const id = (response as any).id as string;
      return {
        verified: true,
        credential: {
          id,
          publicKey: new Uint8Array([1, 2, 3, 4]),
          counter: 0,
          transports: ["internal"],
        },
      };
    },
    async generateAuthenticationOptions() {
      n += 1;
      return { challenge: `auth-challenge-${n}` } as any;
    },
    async verifyAuthentication() {
      return { verified: true, newCounter: 1 };
    },
  };
}

test("registration provisions a new root, stores account+credential, session reflects it", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
  });

  // fresh boot has zero roots until registration
  const rootsBefore = pe.pf.rootPicos().length;
  t.is(rootsBefore, 0);

  const reg = await pe.auth.registerNewAccountOptions({ displayName: "Alice" });
  t.truthy(reg.options.challenge);
  t.truthy(reg.ceremonyId);

  const verified = await pe.auth.registerNewAccountVerify({
    ceremonyId: reg.ceremonyId,
    response: { id: "cred-alice-1" } as any,
  });

  // registration mints the first root
  t.is(pe.pf.rootPicos().length, rootsBefore + 1);
  t.truthy(verified.account.rootPicoId);
  t.truthy(verified.uiECI);
  t.is(verified.account.displayName, "Alice");

  // account + credential persisted
  const account = await pe.auth.getAccount(verified.account.accountId);
  t.truthy(account);
  t.is(account!.rootPicoId, verified.account.rootPicoId);
  const creds = await pe.auth.listCredentials(verified.account.accountId);
  t.is(creds.length, 1);
  t.is(creds[0].credentialID, "cred-alice-1");

  // whoami reflects the session
  const who = await pe.auth.whoami(verified.session.token);
  t.true(who.authenticated);
  t.is(who.accountId, verified.account.accountId);
  t.is(who.rootPicoId, verified.account.rootPicoId);
  t.is((who.credentials || []).length, 1);
  t.is(who.uiECI, verified.uiECI);
});

test("usernameless login verifies against the stored credential", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
  });

  const reg = await pe.auth.registerNewAccountOptions({ displayName: "Bob" });
  const acct = await pe.auth.registerNewAccountVerify({
    ceremonyId: reg.ceremonyId,
    response: { id: "cred-bob-1" } as any,
  });

  const login = await pe.auth.loginOptions();
  const loggedIn = await pe.auth.loginVerify({
    ceremonyId: login.ceremonyId,
    response: { id: "cred-bob-1" } as any,
  });

  t.is(loggedIn.account.accountId, acct.account.accountId);
  t.not(loggedIn.session.token, acct.session.token);

  const who = await pe.auth.whoami(loggedIn.session.token);
  t.true(who.authenticated);
});

test("adding a passkey reuses the account and does NOT create a root", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
  });

  const reg = await pe.auth.registerNewAccountOptions({ displayName: "Carol" });
  const acct = await pe.auth.registerNewAccountVerify({
    ceremonyId: reg.ceremonyId,
    response: { id: "cred-carol-1" } as any,
  });
  const rootsAfterReg = pe.pf.rootPicos().length;

  const add = await pe.auth.addCredentialOptions({
    accountId: acct.account.accountId,
  });
  t.is(add.options.excludeCredentials?.length, 1);
  t.is(add.options.excludeCredentials?.[0]?.id, "cred-carol-1");
  await pe.auth.addCredentialVerify({
    ceremonyId: add.ceremonyId,
    accountId: acct.account.accountId,
    response: { id: "cred-carol-2" } as any,
    label: "phone",
  });

  const creds = await pe.auth.listCredentials(acct.account.accountId);
  t.is(creds.length, 2);
  // root-per-account, not per-credential
  t.is(pe.pf.rootPicos().length, rootsAfterReg);
});

test("cannot delete the last passkey; can delete extras", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
  });

  const reg = await pe.auth.registerNewAccountOptions({ displayName: "Dave" });
  const acct = await pe.auth.registerNewAccountVerify({
    ceremonyId: reg.ceremonyId,
    response: { id: "cred-dave-1" } as any,
  });
  const accountId = acct.account.accountId;

  await t.throwsAsync(
    () => pe.auth.deleteCredential(accountId, "cred-dave-1"),
    { instanceOf: AuthError }
  );

  const add = await pe.auth.addCredentialOptions({ accountId });
  await pe.auth.addCredentialVerify({
    ceremonyId: add.ceremonyId,
    accountId,
    response: { id: "cred-dave-2" } as any,
  });

  await pe.auth.deleteCredential(accountId, "cred-dave-2");
  const creds = await pe.auth.listCredentials(accountId);
  t.is(creds.length, 1);
});

test("logout ends the session", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
  });

  const reg = await pe.auth.registerNewAccountOptions({ displayName: "Erin" });
  const acct = await pe.auth.registerNewAccountVerify({
    ceremonyId: reg.ceremonyId,
    response: { id: "cred-erin-1" } as any,
  });

  t.true((await pe.auth.whoami(acct.session.token)).authenticated);
  await pe.auth.deleteSession(acct.session.token);
  t.false((await pe.auth.whoami(acct.session.token)).authenticated);
});

test("two accounts get two distinct roots", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
    allowSelfSignup: true,
  });
  const before = pe.pf.rootPicos().length;

  const r1 = await pe.auth.registerNewAccountOptions({ displayName: "One" });
  const a1 = await pe.auth.registerNewAccountVerify({
    ceremonyId: r1.ceremonyId,
    response: { id: "cred-one" } as any,
  });
  const r2 = await pe.auth.registerNewAccountOptions({ displayName: "Two" });
  const a2 = await pe.auth.registerNewAccountVerify({
    ceremonyId: r2.ceremonyId,
    response: { id: "cred-two" } as any,
  });

  t.is(pe.pf.rootPicos().length, before + 2);
  t.not(a1.account.rootPicoId, a2.account.rootPicoId);
});

test("allowSelfSignup defaults off: bootstrap allowed, second account blocked", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
  });

  const r1 = await pe.auth.registerNewAccountOptions({ displayName: "First" });
  await pe.auth.registerNewAccountVerify({
    ceremonyId: r1.ceremonyId,
    response: { id: "cred-first-default" } as any,
  });
  t.false(pe.auth.allowSelfSignup());

  await t.throwsAsync(
    () => pe.auth.registerNewAccountOptions({ displayName: "Second" }),
    { instanceOf: AuthError }
  );
});

test("allowSelfSignup:true allows a second account", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
    allowSelfSignup: true,
  });

  const r1 = await pe.auth.registerNewAccountOptions({ displayName: "One" });
  await pe.auth.registerNewAccountVerify({
    ceremonyId: r1.ceremonyId,
    response: { id: "cred-one" } as any,
  });
  const r2 = await pe.auth.registerNewAccountOptions({ displayName: "Two" });
  await pe.auth.registerNewAccountVerify({
    ceremonyId: r2.ceremonyId,
    response: { id: "cred-two" } as any,
  });
  t.is(pe.pf.rootPicos().length, 2);
});

test("allowSelfSignup:false blocks a second account but allows the first", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
    allowSelfSignup: false,
  });

  // first registration always allowed (bootstrap)
  const r1 = await pe.auth.registerNewAccountOptions({ displayName: "First" });
  await pe.auth.registerNewAccountVerify({
    ceremonyId: r1.ceremonyId,
    response: { id: "cred-first" } as any,
  });

  await t.throwsAsync(
    () => pe.auth.registerNewAccountOptions({ displayName: "Second" }),
    { instanceOf: AuthError }
  );
});

test("legacy engine with primary root and no account can be claimed", async (t) => {
  const pe = await startIsolatedEngine({
    autoCreateRootPico: true,
    webauthn: fakeAuthenticator(),
  });

  t.true(await pe.auth.needsAuthMigration());
  const primaryRootId = pe.pf.rootPico.id;
  const rootsBefore = pe.pf.rootPicos().length;

  await t.throwsAsync(
    () => pe.auth.registerNewAccountOptions({ displayName: "Nope" }),
    { instanceOf: AuthError }
  );

  const claim = await pe.auth.claimPrimaryRootOptions({ displayName: "Legacy" });
  const verified = await pe.auth.claimPrimaryRootVerify({
    ceremonyId: claim.ceremonyId,
    response: { id: "cred-legacy-1" } as any,
  });

  t.false(await pe.auth.needsAuthMigration());
  t.is(verified.account.rootPicoId, primaryRootId);
  t.is(pe.pf.rootPicos().length, rootsBefore);
  t.is(verified.account.displayName, "Legacy");
  t.truthy(verified.uiECI);
});

test("fresh engine boots with zero roots until registration", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
  });
  t.is(pe.pf.rootPicos().length, 0);
  t.is(pe.uiECI, null);
});

test("invite allows registration when self-signup is disabled", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
    allowSelfSignup: false,
  });

  const r1 = await pe.auth.registerNewAccountOptions({ displayName: "Owner" });
  const owner = await pe.auth.registerNewAccountVerify({
    ceremonyId: r1.ceremonyId,
    response: { id: "cred-owner" } as any,
  });

  await t.throwsAsync(
    () => pe.auth.registerNewAccountOptions({ displayName: "NoInvite" }),
    { instanceOf: AuthError }
  );

  const invite = await pe.auth.createInvite({
    createdByAccountId: owner.account.accountId,
    label: "Alex",
  });
  const peek = await pe.auth.peekInvite(invite.token);
  t.true(peek.valid);
  t.is(peek.label, "Alex");

  const r2 = await pe.auth.registerNewAccountOptions({
    displayName: "Alex",
    invite: invite.token,
  });
  const guest = await pe.auth.registerNewAccountVerify({
    ceremonyId: r2.ceremonyId,
    response: { id: "cred-alex" } as any,
  });

  t.is(pe.pf.rootPicos().length, 2);
  t.not(guest.account.rootPicoId, owner.account.rootPicoId);

  const peekAfter = await pe.auth.peekInvite(invite.token);
  t.false(peekAfter.valid);

  await t.throwsAsync(
    () =>
      pe.auth.registerNewAccountOptions({
        displayName: "Reuse",
        invite: invite.token,
      }),
    { instanceOf: AuthError }
  );
});

test("invite label defaults to mesh name when display name omitted", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
    allowSelfSignup: false,
  });

  const r1 = await pe.auth.registerNewAccountOptions({ displayName: "Owner" });
  await pe.auth.registerNewAccountVerify({
    ceremonyId: r1.ceremonyId,
    response: { id: "cred-owner" } as any,
  });

  const invite = await pe.auth.createInvite({
    createdByAccountId: (await pe.auth.whoami()).accountId!,
    label: "Skills Mesh",
  });

  const r2 = await pe.auth.registerNewAccountOptions({ invite: invite.token });
  const guest = await pe.auth.registerNewAccountVerify({
    ceremonyId: r2.ceremonyId,
    response: { id: "cred-guest" } as any,
  });

  t.is(guest.account.displayName, "Skills Mesh");

  const rootUi = guest.uiECI;
  const box = await pe.pf.query({
    eci: rootUi,
    rid: "io.picolabs.pico-engine-ui",
    name: "box",
  });
  t.is(box.name, "Skills Mesh");
});

test("invite with bootstrap URL installs ruleset on new root", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
    allowSelfSignup: false,
  });

  const r1 = await pe.auth.registerNewAccountOptions({ displayName: "Owner" });
  const owner = await pe.auth.registerNewAccountVerify({
    ceremonyId: r1.ceremonyId,
    response: { id: "cred-owner" } as any,
  });

  const bootstrapUrl = toFileUrl(
    path.resolve(__dirname, "../../../test-rulesets/hello-world.krl")
  );
  const invite = await pe.auth.createInvite({
    createdByAccountId: owner.account.accountId,
    label: "Bootstrap guest",
    bootstrapUrl,
  });
  t.is(invite.bootstrapRid, "io.picolabs.hello_world");

  const peek = await pe.auth.peekInvite(invite.token);
  t.true(peek.valid);
  t.is(peek.bootstrapRid, "io.picolabs.hello_world");

  const r2 = await pe.auth.registerNewAccountOptions({
    displayName: "Guest",
    invite: invite.token,
  });
  const guest = await pe.auth.registerNewAccountVerify({
    ceremonyId: r2.ceremonyId,
    response: { id: "cred-guest" } as any,
  });

  const guestRoot = pe.pf.rootPicos().find((p) => p.id === guest.account.rootPicoId);
  t.truthy(guestRoot);
  const rids = guestRoot!.toReadOnly().rulesets.map((rs) => rs.rid);
  t.true(rids.includes("io.picolabs.hello_world"));
});

test("invite rejects invalid bootstrap URL at creation", async (t) => {
  const pe = await startIsolatedEngine({
    webauthn: fakeAuthenticator(),
    allowSelfSignup: false,
  });

  const r1 = await pe.auth.registerNewAccountOptions({ displayName: "Owner" });
  const owner = await pe.auth.registerNewAccountVerify({
    ceremonyId: r1.ceremonyId,
    response: { id: "cred-owner" } as any,
  });

  await t.throwsAsync(
    () =>
      pe.auth.createInvite({
        createdByAccountId: owner.account.accountId,
        bootstrapUrl: "file:///no/such/bootstrap.krl",
      }),
    { instanceOf: AuthError, message: /Invalid bootstrap ruleset URL/ }
  );
});
