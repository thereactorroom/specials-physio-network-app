// Allowlist for Fusion host URLs to prevent Server-Side Request Forgery (SSRF).
// Only https origins whose hostname ends with the Fusion domain are permitted.
// When no host is supplied, the default UAT endpoint is returned.

const ALLOWED_SUFFIX = "fusiononq.com";
const DEFAULT_HOST = "https://uat.fusiononq.com";

export function resolveFusionHost(host?: string): string | null {
  if (!host || typeof host !== "string" || host.trim().length === 0) {
    return DEFAULT_HOST;
  }
  let parsed: URL;
  try {
    parsed = new URL(host);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  if (!parsed.hostname.endsWith(ALLOWED_SUFFIX)) return null;
  return parsed.origin;
}