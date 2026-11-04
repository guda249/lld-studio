/** Build-time switches. The test runner doesn't define them, so fall back safely. */
export const HASH_ROUTES: boolean = typeof __HASH_ROUTES__ !== "undefined" ? __HASH_ROUTES__ : false;
export const SITE_URL: string = typeof __SITE_URL__ !== "undefined" ? __SITE_URL__ : "";

/** Full link to an in-app path ("/patterns/strategy"), right for both builds. */
export function pageLink(path: string): string {
  if (HASH_ROUTES) return `${location.origin}${location.pathname}#${path}`;
  return `${SITE_URL || location.origin}${path}`;
}
