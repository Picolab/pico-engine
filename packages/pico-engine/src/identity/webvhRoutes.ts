import { Express, Request, Response } from "express";
import { IdentityService } from "./IdentityService";
import { resolveLocalWebvhLog } from "./webvh";
import { IdentityError } from "./errors";

export function registerWebvhRoutes(
  app: Express,
  identity: IdentityService
): void {
  app.get("/identity/resolve", async (req: Request, res: Response) => {
    try {
      const did = String(req.query.did || "").trim();
      if (!did) {
        res.status(400).json({ error: "Missing did query parameter" });
        return;
      }
      const doc = await identity.resolveDid("", did);
      res.json({ did, didDocument: doc });
    } catch (err) {
      sendIdentityError(res, err);
    }
  });

  app.get("/picos/:picoId/did.jsonl", async (req: Request, res: Response) => {
    try {
      const picoId = decodeURIComponent(req.params.picoId);
      const jsonl = await identity.getWebvhLogJsonl(picoId);
      if (!jsonl) {
        res.status(404).send("Not found");
        return;
      }
      const log = jsonl
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line));
      await resolveLocalWebvhLog(log);
      res.type("application/jsonld+json").send(jsonl);
    } catch (err) {
      sendIdentityError(res, err);
    }
  });

  app.get("/picos/:picoId/did.json", async (req: Request, res: Response) => {
    try {
      const picoId = decodeURIComponent(req.params.picoId);
      const doc = await identity.getParallelWebDoc(picoId);
      if (!doc) {
        res.status(404).send("Not found");
        return;
      }
      res.json(doc);
    } catch (err) {
      sendIdentityError(res, err);
    }
  });
}

function sendIdentityError(res: Response, err: unknown): void {
  if (err instanceof IdentityError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: (err as Error).message || "Internal error" });
}
