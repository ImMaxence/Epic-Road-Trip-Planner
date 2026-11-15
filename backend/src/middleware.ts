import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError, type ZodType } from "zod";
import type { Repositories } from "./db/repositories.ts";
import type { UserRow } from "./db/schema.ts";
import { HttpError, forbidden, unauthorized } from "./lib/http-error.ts";
import { isAllowedEmail } from "./lib/allowlist.ts";
import { SESSION_COOKIE, type SessionSigner } from "./lib/session.ts";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Signed-in administrator (the only kind of account). */
      user?: UserRow;
    }
  }
}

/**
 * Resolves the session cookie into req.user. Never fails: an invalid cookie just means anonymous.
 * The address must still be listed in ADMIN_EMAILS: removing it revokes the session at once.
 */
export function loadSession(signer: SessionSigner, repos: Repositories, adminEmails: readonly string[]): RequestHandler {
  return async (req, _res, next) => {
    const token = req.cookies?.[SESSION_COOKIE];
    if (typeof token === "string" && token) {
      const claims = await signer.verify(token);
      const user = claims ? await repos.users.byId(claims.userId) : undefined;
      if (user && user.tokenVersion === claims!.version && isAllowedEmail(user.email, adminEmails)) req.user = user;
    }
    next();
  };
}

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!req.user) return next(unauthorized());
  next();
};

/**
 * Defence in depth against CSRF (the session cookie is already SameSite=Lax):
 * state-changing requests must come from our own origin when the browser says where it comes from.
 */
export function sameOrigin(allowed: string[]): RequestHandler {
  const set = new Set(allowed);
  return (req, _res, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
    const origin = req.get("origin");
    if (origin && !set.has(origin)) return next(forbidden("bad_origin"));
    next();
  };
}

export function parse<T>(schema: ZodType<T>, value: unknown): T {
  return schema.parse(value);
}

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction) => next(new HttpError(404, "not_found"));

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "validation_failed",
      issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.code, ...(err.details ? { details: err.details } : {}) });
    return;
  }
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: "invalid_json" });
    return;
  }
  if (err?.type === "entity.too.large") {
    res.status(413).json({ error: "payload_too_large" });
    return;
  }
  req.log?.error({ err }, "unhandled error");
  res.status(500).json({ error: "internal_error" });
};
