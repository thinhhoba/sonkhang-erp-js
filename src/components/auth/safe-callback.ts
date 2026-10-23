const DEFAULT_CALLBACK = "/dashboard";
const AUTH_LOOP_PATHS = new Set([
  "/auth/signin",
  "/auth/signout",
  "/auth/error",
  "/auth/access-denied",
]);

/**
 * Accept only same-origin absolute paths. This prevents OAuth callback values
 * from becoming open redirects while preserving query strings and hashes.
 */
export function safeInternalCallback(
  value: unknown,
  fallback = DEFAULT_CALLBACK
): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  if (/\\|[\u0000-\u001f\u007f]/.test(value)) {
    return fallback;
  }

  try {
    const base = new URL("https://erp.sonkhang.local");
    const target = new URL(value, base);

    if (target.origin !== base.origin || AUTH_LOOP_PATHS.has(target.pathname)) {
      return fallback;
    }

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallback;
  }
}
