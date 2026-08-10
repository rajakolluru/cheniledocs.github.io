# Deploying chenile.org (GitHub Pages)

The site is served at **https://chenile.org** (apex domain) from the
`rajakolluru/cheniledocs.github.io` repository via GitHub Pages.

- `CNAME` contains a single line: `chenile.org` (the apex — **not** `www`).
- `_config.yml` has `url: "https://chenile.org"` and `baseurl: ""`.

## DNS records (set these at your domain registrar)

**Apex `chenile.org` → GitHub Pages** (four A records + IPv6 AAAA):

| Type | Host | Value            |
|------|------|------------------|
| A    | @    | 185.199.108.153  |
| A    | @    | 185.199.109.153  |
| A    | @    | 185.199.110.153  |
| A    | @    | 185.199.111.153  |
| AAAA | @    | 2606:50c0:8000::153 |
| AAAA | @    | 2606:50c0:8001::153 |
| AAAA | @    | 2606:50c0:8002::153 |
| AAAA | @    | 2606:50c0:8003::153 |

**`www.chenile.org` → the Pages host** (this is what enables the www redirect):

| Type  | Host | Value                      |
|-------|------|----------------------------|
| CNAME | www  | rajakolluru.github.io.     |

## The www → apex redirect

Once the `www` CNAME above exists **and** the custom domain is set in the repo,
GitHub Pages automatically redirects `https://www.chenile.org` →
`https://chenile.org` (and serves HTTPS for both). No redirect file is needed in
the repo — adding one would risk a redirect loop, so we intentionally don't.

## GitHub settings (Settings → Pages)

1. **Custom domain:** `chenile.org` → Save. GitHub writes/verifies the `CNAME`.
2. Wait for the DNS check to pass (green check).
3. Enable **Enforce HTTPS** (available after the certificate is issued).
4. Optionally add the domain under **Settings → Pages → Verified domains** at the
   account level to prevent takeovers.

## Verify

```bash
dig +short chenile.org        # should list the four 185.199.108-111.153 A records
dig +short www.chenile.org    # should CNAME to rajakolluru.github.io
curl -sI https://www.chenile.org | grep -i location   # -> https://chenile.org/
```
