const DEFAULT_RETURN_PATH = "/";

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function getSafeReturnPath(
  value: string | string[] | undefined | null,
  fallback = DEFAULT_RETURN_PATH,
): string {
  const rawValue = firstValue(value ?? undefined)?.trim();
  if (!rawValue) return fallback;
  if (!rawValue.startsWith("/") || rawValue.startsWith("//")) return fallback;
  if (rawValue.includes("\\")) return fallback;
  if (rawValue === "/login" || rawValue.startsWith("/login?")) return fallback;
  if (rawValue === "/api" || rawValue.startsWith("/api/")) return fallback;

  return rawValue;
}

export function buildLoginPath(
  returnPath: string | string[] | undefined | null,
  reason?: "expired",
): string {
  const safeReturnPath = getSafeReturnPath(returnPath);
  const params = new URLSearchParams();
  if (safeReturnPath !== DEFAULT_RETURN_PATH) params.set("next", safeReturnPath);
  if (reason) params.set("reason", reason);

  const query = params.toString();
  return query ? `/login?${query}` : "/login";
}