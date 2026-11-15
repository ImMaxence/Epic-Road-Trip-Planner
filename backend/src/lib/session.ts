import type { CookieOptions } from "express";
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "ert_session";
const MAX_AGE_S = 30 * 24 * 3600;

/** Sessions exist for administrators only (Google sign-in). */
export interface SessionClaims {
  userId: number;
  version: number;
}

export class SessionSigner {
  readonly #key: Uint8Array;

  constructor(secret: string) {
    this.#key = new TextEncoder().encode(secret);
  }

  sign(claims: SessionClaims): Promise<string> {
    return new SignJWT({ ver: claims.version })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(String(claims.userId))
      .setIssuedAt()
      .setExpirationTime(`${MAX_AGE_S}s`)
      .setIssuer("epic-road-trip")
      .sign(this.#key);
  }

  async verify(token: string): Promise<SessionClaims | null> {
    try {
      const { payload } = await jwtVerify(token, this.#key, { issuer: "epic-road-trip", algorithms: ["HS256"] });
      const userId = Number(payload.sub);
      const version = Number(payload.ver);
      if (!Number.isInteger(userId) || !Number.isInteger(version)) return null;
      return { userId, version };
    } catch {
      return null;
    }
  }
}

export function sessionCookieOptions(secure: boolean): CookieOptions {
  return { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: MAX_AGE_S * 1000 };
}
