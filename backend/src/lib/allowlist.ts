/** Parse "alice@gmail.com, @mbonnici.fr bob@x.org" into normalised entries. */
export function parseAllowlist(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[\s,;]+/)
        .map((entry) => entry.trim().toLowerCase())
        .filter((entry) => /^[^\s@]*@[^\s@]+\.[^\s@]+$/.test(entry)),
    ),
  ];
}

/** Exact e-mail match, or "@domain" entries matching the whole domain. Deny by default. */
export function isAllowedEmail(email: string, allowlist: readonly string[]): boolean {
  const normalised = email.trim().toLowerCase();
  const at = normalised.lastIndexOf("@");
  if (at < 1) return false;
  const domain = normalised.slice(at);
  return allowlist.some((entry) => (entry.startsWith("@") ? entry === domain : entry === normalised));
}
