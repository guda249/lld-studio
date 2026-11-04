# Deploying

The website build (`npm run build` → `dist/`) uses clean addresses like `/patterns/strategy` and is made for
**Cloudflare Pages** (free). The double-click build (`npm run build:standalone`) keeps `#/` addresses because
a file opened from disk can't use clean ones.

## Cloudflare Pages (free)
1. Workers & Pages → Create → Pages → connect the GitHub repository (or "Upload assets" and drop the `dist/` folder).
2. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variables: `NODE_VERSION` = `22`, and `SITE_URL` = the final address with no trailing slash,
     e.g. `https://lldstudio.pages.dev` or your own domain.
3. The site appears at `https://<project>.pages.dev` (custom domain optional, free).

What the build sets up for Cloudflare:
- **Deep links**: there is no `404.html`, so Cloudflare answers any unknown path with `index.html` and the app
  shows the right page (or its own "Page not found"). Don't add a `404.html`; it would switch this off.
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
