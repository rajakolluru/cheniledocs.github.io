# Chenile website (redesign)

A modern, GitHub Pages–ready Jekyll site for the Chenile framework. It reframes the
project around one narrative arc that the website and the YouTube series share:

1. **Why microservices** — and the hidden tax of duplicated plumbing.
2. **Separate service definition from implementation** — `api` vs `service` modules (DIP).
3. **Service policies** — horizontal concerns as single-responsibility interceptors.
4. **Where policies live** — the API gateway *and* the last mile.
5. **How Chenile helps** — one interceptor abstraction for both, placement by config.

## Structure

```
chenile-site/
├── _config.yml            # Jekyll + GitHub Pages config
├── Gemfile                # github-pages gem
├── index.html             # redesigned landing page (hero, stats, story, repos, reviews, CTA)
├── _layouts/              # default, home, page, concept, episode
├── _includes/             # head, nav, footer
├── _data/
│   ├── stats.yml          # PLACEHOLDER stat figures
│   ├── reviews.yml        # PLACEHOLDER testimonials
│   ├── repos.yml          # the 11 repositories
│   └── nav.yml            # top navigation
├── _concepts/             # the 5-part story (collection → /concepts/...)
├── _episodes/             # 8 YouTube episode scripts (collection → /video-series/...)
├── pages/                 # concepts index, architecture, repositories, get-started, video-series
└── assets/                # css, js, images (Chenile logo reused)
```

## Branding

- **Logo:** the woven amber mark is extracted to `assets/img/chenile-mark.png` (transparent, works on light and dark). The full logo-on-black is `chenile-logo-full.png` (used as the social/OG image).
- **Wordmark:** the nav/footer "CHENILE" lettering is lifted directly from the logo (font **Days**, turbologo.com) as `chenile-wordmark-dark.png` (light backgrounds) and `chenile-wordmark-white.png` (dark). This keeps the exact Days lettering without shipping the font. If you'd rather use live text, install the Days webfont into `assets/fonts/`, uncomment the `@font-face` in `main.css`, and remove `[hidden]` from the fallback `.brand-word` span in `_includes/nav.html`.
- **Colors:** amber `#f89038` / ember `#e0801e` on true black `#0d0d0d`, all driven by CSS variables in `main.css`.
- **Favicons:** full set generated from the mark — `favicon.ico` (16/32/48), `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png`, `apple-touch-icon.png` (180), `android-chrome-192x192.png`, `android-chrome-512x512.png`, `maskable-512x512.png`, plus `site.webmanifest`. All wired in `_includes/head.html`.

## Placeholders to replace before publishing

- `_data/stats.yml` — sample figures marked `# PLACEHOLDER`.
- `_data/reviews.yml` — sample testimonials; swap in real, attributable quotes.
- Any `Placeholder <Company>` values in reviews.

The footer and the reviews/stats sections already carry a visible note that these are illustrative.

## Run locally

```bash
cd chenile-site
bundle install
bundle exec jekyll serve
# open http://127.0.0.1:4000
```

## Deploy on GitHub Pages

- **Project site** (`https://<user>.github.io/chenile-site`): set `baseurl: "/chenile-site"` in `_config.yml`.
- **User/org site or custom domain**: leave `baseurl: ""` and add a `CNAME` file.

Content is derived from the existing `cheniledocs.github.io` documentation and the
Chenile modules overview. The full docs remain linked from the nav and footer.
