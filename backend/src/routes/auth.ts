import { createHash, randomBytes } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";
import type { Repositories } from "../db/repositories.ts";
import type { UserRow } from "../db/schema.ts";
import { isAllowedEmail } from "../lib/allowlist.ts";
import { SESSION_COOKIE, sessionCookieOptions, type SessionSigner } from "../lib/session.ts";
import type { GoogleOAuth } from "../services/google.ts";

export interface AuthDeps {
  repos: Repositories;
  signer: SessionSigner;
  secret: string;
  publicOrigin: string;
  secureCookies: boolean;
  adminEmails: string[];
  google?: GoogleOAuth;
  trustCloudflare?: boolean;
}

/** The only accounts are administrators: visitors keep their trips on their device. */
export const publicUser = (u: UserRow) => ({
  id: u.id,
  email: u.email,
  username: u.username,
  locale: u.locale,
  isAdmin: true,
  createdAt: u.createdAt.toISOString(),
});

const OAUTH_COOKIE = "ert_oauth";
const OAUTH_PATH = "/api/auth/google";
const LANG = z.enum(["fr", "en"]).catch("fr");

/** Same-site relative paths only (no open redirect after login). */
export function safeNext(value: unknown): string | null {
  return typeof value === "string" && /^\/(fr|en)(\/|$)/.test(value) && !value.startsWith("//") && !value.includes("\\") && value.length < 600 ? value : null;
}

const base64url = (buffer: Buffer) => buffer.toString("base64url");

// Behind Cloudflare the real client address is in CF-Connecting-IP; IPv6 is grouped per /56.
const clientKey = (trustCloudflare: boolean) => (req: Request) =>
  ipKeyGenerator((trustCloudflare ? req.get("cf-connecting-ip") : undefined) ?? req.ip ?? "0.0.0.0");

/**
 * Administrator sign-in: Google OAuth 2.0 authorization code + PKCE, with a signed single-use state
 * cookie. Only verified addresses listed in ADMIN_EMAILS get an account and a session.
 */
export function authRouter(deps: AuthDeps): Router {
  const { repos, signer, secureCookies, publicOrigin, adminEmails, google } = deps;
  const router = Router();
  const oauthKey = new TextEncoder().encode(`${deps.secret}:oauth`);
  const redirectUri = `${publicOrigin}${OAUTH_PATH}/callback`;
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: clientKey(deps.trustCloudflare ?? false),
    handler: (_req, res) => res.status(429).json({ error: "too_many_attempts" }),
  });
  const loginPath = (lang: "fr" | "en") => `/${lang}/${lang === "fr" ? "connexion" : "login"}`;

  const clearSession = (res: Response) => res.clearCookie(SESSION_COOKIE, { ...sessionCookieOptions(secureCookies), maxAge: undefined });

  router.get("/me", (req, res) => {
    res.json({ user: req.user ? publicUser(req.user) : null });
  });

  router.get("/google/start", limiter, async (req, res) => {
    const lang = LANG.parse(req.query.lang);
    if (!google) {
      res.redirect(303, `${loginPath(lang)}?error=google_disabled`);
      return;
    }
    const state = base64url(randomBytes(24));
    const codeVerifier = base64url(randomBytes(48));
    const codeChallenge = base64url(createHash("sha256").update(codeVerifier).digest());
    const ticket = await new SignJWT({ state, codeVerifier, next: safeNext(req.query.next), lang })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("10m")
      .sign(oauthKey);
    res.cookie(OAUTH_COOKIE, ticket, { httpOnly: true, secure: secureCookies, sameSite: "lax", path: OAUTH_PATH, maxAge: 600_000 });
    res.redirect(303, google.authUrl({ state, codeChallenge, redirectUri }));
  });

  router.get("/google/callback", limiter, async (req, res) => {
    let lang: "fr" | "en" = "fr";
    const fail = (code: string) => res.redirect(303, `${loginPath(lang)}?error=${code}`);
    res.clearCookie(OAUTH_COOKIE, { path: OAUTH_PATH, httpOnly: true, secure: secureCookies, sameSite: "lax" });
    if (!google) return fail("google_disabled");

    let ticket: { state: string; codeVerifier: string; next: string | null; lang: "fr" | "en" };
    try {
      const { payload } = await jwtVerify(String(req.cookies?.[OAUTH_COOKIE] ?? ""), oauthKey, { algorithms: ["HS256"] });
      ticket = payload as unknown as typeof ticket;
      lang = LANG.parse(ticket.lang);
    } catch {
      return fail("session_expired");
    }
    if (typeof req.query.error === "string") return fail("google_cancelled");
    if (typeof req.query.state !== "string" || req.query.state !== ticket.state || typeof req.query.code !== "string") return fail("state_mismatch");

    const identity = await google.exchange({ code: req.query.code, codeVerifier: ticket.codeVerifier, redirectUri });
    if (!identity || !identity.emailVerified) return fail("google_failed");
    // Not an administrator: nothing is stored about this person.
    if (!isAllowedEmail(identity.email, adminEmails)) return fail("not_admin");

    let user = (await repos.users.byGoogleSub(identity.sub)) ?? (await repos.users.byEmail(identity.email));
    if (user && user.googleSub !== identity.sub) {
      await repos.users.update(user.id, { googleSub: identity.sub, tokenVersion: user.tokenVersion + 1 });
      user = await repos.users.byId(user.id);
    }
    if (!user) {
      const name = (identity.name ?? identity.email.split("@")[0] ?? "Admin").slice(0, 40);
      user = await repos.users.create({ email: identity.email, username: name, googleSub: identity.sub, locale: lang });
    }
    const token = await signer.sign({ userId: user.id, version: user.tokenVersion });
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions(secureCookies));
    res.redirect(303, ticket.next ?? `/${user.locale === "en" ? "en" : "fr"}/admin`);
  });

  router.post("/logout", (_req, res) => {
    clearSession(res);
    res.status(204).end();
  });

  return router;
}
