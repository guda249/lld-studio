# Deploying

The website build (`npm run build` → `dist/`) uses clean addresses like `/patterns/strategy` and is made for
**Cloudflare Workers static assets** (free). The double-click build (`npm run build:standalone`) keeps `#/` addresses because
a file opened from disk can't use clean ones.

## Cloudflare Workers (free)
Cloudflare now creates new projects as Workers ("applications"); Pages projects can no longer be created in the
dashboard. `wrangler.jsonc` tells Cloudflare to serve `dist/` as a static site with single-page-app routing.

1. Workers & Pages → Create → Import a repository → `guda249/lld-studio`.
2. Build command: `npm run build`. Deploy command: `npx wrangler deploy` (the default).
3. Settings → Build → Variables: `NODE_VERSION` = `22`, `SITE_URL` = the live address (no trailing slash).
4. The site appears at `https://lld-studio.<account-subdomain>.workers.dev`. To change the account part
   (e.g. to hide your name): Workers & Pages → **Change** next to "Your subdomain". Then update `SITE_URL` and
   redeploy. A custom domain is the cleanest address but costs money for the domain.

What the build sets up for Cloudflare:
- **Deep links**: `wrangler.jsonc` sets `not_found_handling: single-page-application`, so any unknown path gets
  `index.html` and the app shows the right page (or its own "Page not found").
- **`_headers`** (from `public/_headers`): a Content-Security-Policy that only allows the site's own files plus
  sending feedback to the Google Form, and other safety headers; files in `/assets/` are cached for a year
  (their names change when their content does). If you ever add something from another site (for example
  Cloudflare Web Analytics), add that site to the policy, or browsers will block it.
- **`SITE_URL`** makes the link-preview tags (WhatsApp, LinkedIn, Slack) and the canonical link absolute, and
  writes `sitemap.xml` (and its line in `robots.txt`). Without it the site still works; previews may lack the image.
- **AI crawlers**: `robots.txt` asks AI-training and AI-answer crawlers (GPTBot, ClaudeBot, CCBot, Google-Extended,
  PerplexityBot, Bytespider and others) to stay away, while search engines stay allowed. Bots that ignore
  `robots.txt` are only stopped by Cloudflare: in the dashboard for your domain or Pages project, turn on
  **Security → Bots → "Block AI bots"** (free plan). A page that browsers can show can never be fully protected
  from copying; the content licence (CC BY-NC-SA 4.0) is what forbids commercial reuse.

Check it locally the way Cloudflare will serve it (headers, deep links):
`npm run build`, then `node devtools/csp-check.mjs` (cloud dev tools) or `npm run preview`.

## GitHub Pages
GitHub Pages has no "unknown path → index.html" rule and ignores `_headers`. Clean addresses only work there with
a custom domain and a copy of `index.html` saved as `404.html`. Cloudflare Pages is the recommended host.

## Before real learners arrive
Choose the final address. Learners' saved progress belongs to the web address; moving to a different one later
means they must export and import their data.
