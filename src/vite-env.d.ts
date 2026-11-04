/// <reference types="vite/client" />

/** true in the double-click (file://) build, which needs #/ addresses; false on the website. */
declare const __HASH_ROUTES__: boolean;
/** The published site address from SITE_URL at build time ("" if not set). */
declare const __SITE_URL__: string;

declare module "virtual:licences" {
  const list: { name: string; version: string; license: string; url: string }[];
  export default list;
}
