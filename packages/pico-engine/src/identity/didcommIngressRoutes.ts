import { Express, Request, Response } from "express";
import { IdentityService } from "./IdentityService";
import { IdentityError } from "./errors";

export function registerDidcommIngressRoutes(
  app: Express,
  identity: IdentityService
): void {
  app.post(
    "/sky/event/:eci/none/dido/didcomm_message",
    async (req: Request, res: Response) => {
      try {
        const jwe = extractJweBody(req);
        const result = await identity.handleDidcommIngress(
          req.params.eci,
          jwe
        );
        res.status(200).json(result);
      } catch (err) {
        sendIngressError(res, err);
      }
    }
  );
}

function extractJweBody(req: Request): string {
  const body = req.body;
  if (typeof body === "string") {
    return body;
  }
  if (body && typeof body === "object") {
    const obj = body as Record<string, unknown>;
    if (typeof obj.protected === "string" || typeof obj.ciphertext === "string") {
      return JSON.stringify(body);
    }
    for (const key of ["jwe", "message", "payload"]) {
      if (typeof obj[key] === "string") {
        return obj[key] as string;
      }
    }
    if (typeof obj.body === "string") {
      return obj.body;
    }
  }
  throw new IdentityError("Request body must be a DIDComm JWE", 400);
}

function sendIngressError(res: Response, err: unknown): void {
  if (err instanceof IdentityError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: (err as Error).message || "Internal error" });
}
