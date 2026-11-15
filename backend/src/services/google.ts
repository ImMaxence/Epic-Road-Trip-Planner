import { CodeChallengeMethod, OAuth2Client } from "google-auth-library";

export interface GoogleIdentity {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
}

/** Server-side "Sign in with Google": authorization code flow with PKCE, no Google script in our pages. */
export interface GoogleOAuth {
  authUrl(input: { state: string; codeChallenge: string; redirectUri: string; loginHint?: string }): string;
  exchange(input: { code: string; codeVerifier: string; redirectUri: string }): Promise<GoogleIdentity | null>;
}

export function googleOAuth(clientId: string, clientSecret: string): GoogleOAuth {
  const client = new OAuth2Client({ clientId, clientSecret });
  return {
    authUrl({ state, codeChallenge, redirectUri }) {
      return client.generateAuthUrl({
        redirect_uri: redirectUri,
        scope: ["openid", "email", "profile"],
        state,
        code_challenge: codeChallenge,
        code_challenge_method: CodeChallengeMethod.S256,
        prompt: "select_account",
        access_type: "online",
        include_granted_scopes: false,
      });
    },
    async exchange({ code, codeVerifier, redirectUri }) {
      try {
        const { tokens } = await client.getToken({ code, codeVerifier, redirect_uri: redirectUri });
        if (!tokens.id_token) return null;
        const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: clientId });
        const payload = ticket.getPayload();
        if (!payload?.sub || !payload.email) return null;
        return { sub: payload.sub, email: payload.email, emailVerified: payload.email_verified === true, name: payload.name };
      } catch {
        return null;
      }
    },
  };
}
