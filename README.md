# Sigentic Labs website

The marketing site for **Sigentic Labs LLC**: a hand-built static site with no framework and no build step. It's served from Cloudflare (see "Deploy").

```
index.html          Home: hero with the app blocks, the work cards, our approach, what we care about, lately, about and contact
support.html        Support page, and the Support URL for the app stores
privacy.html        Privacy policy (a template, see "Before you launch")
terms.html          Terms of use (a template)
security.html       Vulnerability disclosure policy
404.html            Not-found page (uses absolute / paths, because the Worker serves it at any missing URL)
assets/css/         site.css: tokens, components and the home page · doc.css: the text pages and the 404 page
assets/js/          site.js: motion preference, scroll reveals, nav state and the hero tilt
assets/fonts/       Figtree, self-hosted (see LICENSE.txt)
assets/img/         the Seed logo, favicons, manifest icons, og.png, and the app icons in apps/
tools/              shoot.mjs (screenshots), sync-chrome.mjs (nav and footer), sync-brand.mjs (Seed artwork), og.html (share image), icons.html (PNG icons), brand/ (social artwork)
site.webmanifest, robots.txt, sitemap.xml
.well-known/        security.txt
wrangler.jsonc      Cloudflare Worker config · worker.js: www redirect · .assetsignore: files kept out of the site
.github/workflows/  deploy.yml: deploys on pushes to the release branch
```

All six pages share one nav and footer, written out in each file. The home page links to its own sections (`#apps`, `#about`). The other pages link back to them (`/#apps`). The footer also links Support, Privacy, Terms and Security. To change the nav or footer, edit `tools/sync-chrome.mjs` and run `node tools/sync-chrome.mjs`, which rewrites both in all six pages.

## Preview locally

```bash
python3 .claude/devserver.py 4321
```

Then open http://localhost:4321. The server turns caching off and serves `404.html` for any missing path. Use it rather than `python3 -m http.server`, whose 5-connection backlog makes macOS reset some of a browser's parallel requests, so images fail at random.

## Before you launch

1. **Domain and email.** `sigenticlabs.com` and `hello@sigenticlabs.com` appear in canonical URLs, Open Graph tags, the sitemap and every contact link. Change them with one find and replace.
2. **Work cards.** Each project is one `<article class="app" id="…" data-app="…">` in `index.html`. A card holds a status pill, the name, one sentence and one link, plus the app's own mark as a large cream shape. `data-app` selects the card's colour from the table at the top of `site.css`. The first card (`app-big`) is Mesh. It spans four of the six grid columns, and the full width below 1180 px. When something ships, update its pill (`pill-live` for usable, `pill-dev` for prototypes) and add a line to Lately.
3. **Lately.** Each entry is a milestone you can point to in the product's own repository: a release, a tag or a commit. Put its exact date in `datetime` and its month in the text, and keep the list newest first.
4. **Legal and operations pages.** These are templates, **not legal advice**. Have an attorney review them. `terms.html` section 9 names the State of New York and Kings County as the governing law and venue, so confirm both.
   - `privacy.html` covers this site, morseapp.io (including the Morse waitlist), meshlang.dev, the Incant site, and email. It points to Savorly's own policy. Publish a full Morse privacy policy before Morse's public release. Publish one for Mixer's hosted release service before it launches.
   - `terms.html` covers the same sites, plus product licenses, pre-release software and copyright (DMCA) notices.
   - `support.html` is the **Support URL** for App Store Connect and Google Play listings. It links each product's help, privacy and account-deletion pages.
   - `security.html` and `/.well-known/security.txt` set out the vulnerability disclosure policy. `security.txt` has an `Expires` date (2027-10-20), so update it before then.
   - When you change a policy, update the effective date under its title.
   - No cookie banner is needed: the site sets no cookies, has no analytics and loads nothing from other domains. Revisit this if you add any.
5. **Page text.** The text pages are generated once from the old pages, so their wording is the reviewed wording. Edit them directly from now on.

## Deploy

The site runs on Cloudflare as a Worker named `sigenticlabs` that serves the files in this folder, at **sigenticlabs.com**. `www.sigenticlabs.com` redirects to it.

- `wrangler.jsonc` configures the Worker and both custom domains. `wrangler deploy` creates their DNS records and certificates.
- `worker.js` does two things: it redirects `www` to the bare domain, and it serves `/` (and any path ending in `/`) as `index.html`. Pages keep their `.html` paths (`/privacy.html`), matching the canonical links and the sitemap.
- `.assetsignore` keeps tooling out of the deployed site: `tools/`, `.claude/`, `.github/`, this README and the Worker files. A missing page serves `404.html`.

**To deploy,** push to the `release` branch:

```bash
git push origin main:release
```

`.github/workflows/deploy.yml` runs on every push to `release`. You can also run it by hand from the Actions tab. It first checks its credentials, then runs `wrangler deploy`, then checks that the live site responds.

**Credentials.** The workflow needs two things in the GitHub repo:

- Repository variable `CLOUDFLARE_ACCOUNT_ID`, already set.
- Repository secret `CLOUDFLARE_API_TOKEN`: a Cloudflare API token with **Account › Workers Scripts › Edit**, **Zone › Workers Routes › Edit** and **Zone › Zone › Read** for sigenticlabs.com. The "Edit Cloudflare Workers" token template plus Zone › Zone › Read covers it. Set it with `gh secret set CLOUDFLARE_API_TOKEN`, which prompts for the value.

**To preview the deployed setup locally** (the Worker, `.assetsignore` and the 404 page), run `npx wrangler dev` and open http://localhost:8787. For editing the design, the plain server in "Preview locally" is enough.

## Design

**Colour.** The page is a warm cream (`--cream`, `#FBF6EC`) with near-black ink (`--ink`, `#1B1813`) and a softer ink for secondary text (`--ink-2`, `#4A443B`). A faint paper grain sits over everything (`body::before`). The accent is orange (`--accent`, `#F26B3A`): arrows, the headline squiggle, underlines on hover. Each app has one colour, chosen to sit well on cream and to echo its icon. `[data-app="…"]` sets it as `--c`, and cards, step numbers and the "what we care about" icons all read `--c`.

| `data-app` | `--c` |
| --- | --- |
| `mesh` | `#7EE0B5` |
| `savorly` | `#FFD27A` |
| `morse` | `#A5BDFF` |
| `mixer` | `#FFA173` |
| `incant` | `#C6B8FF` |

**Type** is Figtree (weights 300 to 900), self-hosted in `assets/fonts/`. Headings use 900 with tight tracking. The hero headline is two lines that never wrap; check a new headline at 360 px and 1728 px wide.

**Blocks.** The design's one idea is the toy block: a rounded shape with a solid, darker edge underneath (`box-shadow: 0 Npx 0 <darker colour>`). The hero's app icons, the work cards, the button, the step numbers, the care icons and the contact card all use it. A block's darker edge is `--side` on the hero blocks and `color-mix(…, #2b1d05 26%)` elsewhere.

**Hero blocks.** Each block is a link to its card, positioned with `--x`, `--y` and `--r` (rotation), with `--side` for its edge and `--i` for its place in the drop-in order. Mixer's block is Flick on the icon's dark background, because the repo's Mixer icon is only 160 px.

**Card marks.** Each card's large cream shape is the app's own mark, drawn from SVG symbols in the page sprite (`#mark-mesh`, `#mark-savorly`, `#mark-morse`, `#mark-incant`). Mixer's is Flick as a CSS mask.

**Motion.** Blocks drop in and float once, the group tilts toward the pointer, the squiggle and step arrows draw in, and sections fade up as they scroll in. All automatic motion ends within 5 seconds (WCAG 2.2.2), so the hero needs no pause control. Keep it that way. An inline script in each page's `<head>` sets `.has-motion` on `<html>` before the first paint, only when motion is welcome, and every motion rule hangs off it. `site.js` keeps the class in step if the preference changes.

**The Seed logo** is three soft, asymmetric forms around an open center. The approved artwork lives in `assets/img/logo.svg`. On the site it takes the text colour (ink), and lime on the contact card. `favicon.svg` / `logo-tile.svg` is the icon version, lime on a charcoal tile. After editing the source SVG, run `node tools/sync-brand.mjs` to update the `#seed` symbol in all six pages and `tools/og.html`, and the SVG tiles.

## Images

- `assets/img/apps/` holds each app's real icon, and `mixer-flick.webp`, Mixer's fox, Flick, on a transparent background.
- `og.png` (the 1200×630 link preview) renders from `tools/og.html`. With a local server on port 4321:

  ```bash
  node tools/shoot.mjs http://localhost:4321/tools/og.html assets/img/og.png --width 1200 --height 630
  ```

- `tools/icons.html` renders the PNG favicons and manifest icons from the Seed. It writes base64 PNGs into the page after the SVG loads. Capture them with headless Chrome's `--dump-dom --virtual-time-budget=3000` and decode them into `assets/img/`. Keep the manifest icons inside the central maskable safe zone.

## Accessibility & performance

- Respects `prefers-reduced-motion`: no drop-in, float, tilt, drawing or reveals. Everything is in place from the start.
- Semantic landmarks, a skip link, one `h1` per page and a visible focus ring (cream on the dark contact card). The nav marks the section in view with `aria-current="location"`, and clears it in sections it has no link for. Each text page marks itself in the footer with `aria-current="page"`.
- A whole work card is clickable through its link, so keyboard and screen-reader users get one link per card.
- Text contrast meets WCAG AA on cream and on every card colour.
- No frameworks, trackers or third-party requests. The JavaScript is under 3 KB.

## Tools

`shoot.mjs` needs Node 22 or newer. No tool needs a package.

- **`tools/shoot.mjs`** takes screenshots with headless Chrome. It scrolls the page first so scroll reveals have run. It exits non-zero when the page cannot be reached, when it does not finish loading within 30 seconds, and on any page error, including a 404 response. It looks for Chrome at the macOS path, or at `$CHROME`. Options include `--width`, `--height`, `--mobile`, `--scale`, `--reduced-motion`, `--tiles` (one image per screen height), `--full`, `--selector` and `--eval`.

  ```bash
  node tools/shoot.mjs http://127.0.0.1:4321/ /tmp/home.png --tiles --width 1440 --height 900
  ```

- **`tools/sync-chrome.mjs`** writes the nav and footer into all six pages from one template. Each page gets its own link prefixes (absolute on the 404 page) and marks its own footer link with `aria-current="page"`. Running it twice changes nothing.
- **`tools/sync-brand.mjs`** copies the Seed artwork from `assets/img/logo.svg` into every page and the icon tiles (see "Design").
