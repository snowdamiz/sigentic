# Sigentic Labs — website

The marketing site for **Sigentic Labs LLC**: a hand-built static site with no framework and no build step. It's served from Cloudflare (see "Deploy").

```
index.html          Landing page (hero, manifesto, products, lab, approach, principles, contact)
privacy.html        Privacy policy (template — see "Before you launch")
terms.html          Terms of use (template)
404.html            Not-found page (uses absolute /assets paths)
assets/css/         styles.css — the whole design system
assets/js/          main.js — interactions · sigil.js — the hero particle glyphs
assets/img/         logo, favicons, app icons, social share image (og.png)
tools/              Templates used to render og.png and the PNG icons
site.webmanifest, robots.txt, sitemap.xml
wrangler.jsonc      Cloudflare Worker config · worker.js — www redirect · .assetsignore — files kept out of the site
.github/workflows/  deploy.yml — deploys on pushes to the release branch
```

## Preview locally

```bash
python3 -m http.server 4321
```

Then open http://localhost:4321.

## Before you launch

1. **Domain.** Find and replace `sigenticlabs.com` across the project with your real domain. It appears in canonical URLs, Open Graph tags, the sitemap and the email addresses.
2. **Email.** Every contact link is `mailto:hello@…` with a pre-filled subject, so you need only one inbox. Change the address in the same find and replace.
3. **Products.** The products section is a catalog of five chapters, one `<article class="product">` per project in `index.html` (`<!-- Savorly -->`, `<!-- Morse -->` and so on). Each has a rule with its number, field and status, the name and copy, and a stage with the real product: Savorly's phone screenshot, the Morse desktop capture, a Mesh program, Incant's game window with its agent panel, and an example Mixer app on an Android phone. Stage colours are `--stage-1` and `--stage-2` on `.product--savorly` and the others in `styles.css`. Links like `#mesh` scroll to that chapter. Copy, statuses and links come from each repo's README and live site as of October 2026. Update them when something ships. The status is `state` (green, live or released) or `state state--dev` (amber, in development).
4. **The Lab.** The rows under `id="lab"` show where each piece of work stands. Each row's stage track lists Spark, Prototype, Beta and Shipped: give the reached steps `is-done` and the current one `is-now`, and update the row's `aria-label`. Move a row along as it progresses.
5. **Legal and operations pages.** These are templates, **not legal advice**. Fill in `[State]`, `[County, State]` and `[Mailing address]`, and have an attorney review them.
   - `privacy.html` covers this site, morseapp.io (including the Morse waitlist), meshlang.dev, the Incant site, and email. It points to Savorly's own policy. Publish a full Morse privacy policy before Morse's public release. Publish one for Mixer's hosted release service before it launches.
   - `terms.html` covers the same sites, plus product licenses, pre-release software and copyright (DMCA) notices.
   - `support.html` is the **Support URL** for App Store Connect and Google Play listings. It links each product's help, privacy and account-deletion pages. Savorly's own `/privacy` and `/account-deletion` are the URLs to give the stores for Savorly.
   - `security.html` and `/.well-known/security.txt` set out the vulnerability disclosure policy. `security.txt` has an `Expires` date (2027-10-20), so update it before then.
   - No cookie banner is needed: the site sets no cookies and has no analytics. Revisit this if you add analytics.
6. **Social links.** The footer's "Elsewhere" column lists GitHub. Add other profiles there as you create them.

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

## Customizing the hero

The hero headline cycles through the fields Sigentic builds for, and the particle glyph morphs to match. Each step is one entry in `SCENES` at the top of `assets/js/sigil.js`, and the product it shows is lit in the row along the bottom of the hero (`data-scene-link`, numbered in the same order):

```js
{
  word: 'the kitchen.',           // headline word
  field: 'Cooking',               // label above the glyph
  product: 'Savorly',             // label below the glyph
  a: [255, 190, 104], b: [255, 92, 60],   // gradient colours (RGB)
  stroke: 6.5,                    // line weight on the 100×100 grid
  paths: ['M22 48H78…', …],       // SVG path data, drawn as strokes
  fills: [ … ],                   // optional filled shapes
}
```

To add a field, draw an icon on a 100×100 grid and paste its path data into a new scene. A scene can also take `image: 'path/to/art.webp'` instead of paths, for a product whose mark only exists as raster art (Mixer's fox): the particles fill the image's opaque pixels and leave its dark features (eyes, nose) empty. Use art on a transparent background.

## Design system

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#060708` | Page background |
| `--text` / `--text-2` / `--text-3` | `#f4f5f7` / `#a5aab3` / `#7b818a` | Primary, secondary, tertiary text |
| `--signal` | `#bdf75f` | Brand accent: Seed logo, status dots, focus rings |
| `--savorly-a/b` | `#ffb45c` → `#ff6a3d` | Savorly panel glow and hero glyph |
| `--morse-a/b` | `#5b9dff` → `#2f63e0` | Morse panel, chat bubbles |
| `--mesh-a/b` | `#4fdba6` → `#1fa572` | Mesh panel, code keywords |
| `--incant-a/b` | `#9d86ff` → `#5a37d6` | Incant panel |

Type: **Geist** (UI and display), **Instrument Serif** italic (emphasis), **Geist Mono** (labels). All three load from Google Fonts. If you want zero third-party requests, self-host the font files and update the `<link>` tags. The privacy policy mentions Google Fonts, so edit that paragraph if you do.

The **Seed** logo is three soft, asymmetric forms growing around an open center. The approved artwork lives in `assets/img/logo.svg`; it uses solid lime (`#bdf75f`) on dark backgrounds and can be rendered in one color. Keep the three shapes together and preserve their spacing. `logo-tile.svg` / `favicon.svg` is the icon version, on a flat charcoal tile.

After editing the source SVG, run `node tools/sync-brand.mjs` to update the four page sprites and SVG icon tiles. The animated hero reads its paths from the page sprite; both image templates load the source SVG directly. The brand preview at `tools/brand/preview.html` shows the mark at navigation and favicon sizes.

## Regenerating brand images

`og.png` (the 1200×630 link preview) and the PNG icons are rendered from `tools/` with headless Chrome. With a local server running on port 4321:

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,630 \
  --virtual-time-budget=6000 --screenshot=assets/img/og.png http://127.0.0.1:4321/tools/og.html
```

`tools/icons.html` writes base64 PNGs into the page after the SVG loads. Capture them with `--dump-dom --virtual-time-budget=3000` and decode them into `assets/img/`. Keep the manifest icons inside the central maskable safe zone.

## Accessibility & performance

- Respects `prefers-reduced-motion`: the hero renders a still glyph, the marquee stops, and reveals appear instantly.
- Semantic landmarks, a skip link, visible focus rings, labelled controls, and an accessible name for the animated headline.
- The particle canvas pauses when the hero is off-screen or the tab is hidden, and uses fewer particles on small screens.
- No frameworks or trackers. The JavaScript is about 32 KB unminified.

## Product images

Everything in `assets/img/work/` is a real capture of the product, except Mixer's screen:

- `savorly-discover.jpg`: Savorly's Discover screen, captured from staging.savorly.cooking at iPhone size (375×812 at 3×).
- `morse-desktop.jpg`: the Morse desktop app UI, built from `mesh-private-messenger/apps/mobile` as a development web build (`EXPO_PUBLIC_DESKTOP_DEVELOPMENT=true`). It shows the app's own sample content (Settings, then Development, then "Sample content"). The bottom edge is cropped off: it held the composer's "Sample preview · read-only" label and the stand-in profile used to get past sign-up.
- `incant-native-game.jpg`: a macOS capture of Incant's native game window running the core sample. It's `handoffs/0060-core-sample-presentation/screenshots/window-en-start.png` in the Incant repo.
- `incant-agent.png`: the agent panel cropped from the real editor UI, running the repo's own `approval` test scenario (`handoffs/0045-native-agent-chat`).
- The Mesh code sample is typeset in HTML from the counter example in the Mesh README.
- `mixer-app.jpg`: an illustration, not a capture. Mixer has no public app yet, so this is an example of the kind of app it builds (a habit tracker), designed for this site in `tools/mixer-app.html`. Replace it with a real capture once there's a Mixer app worth showing. To re-render it with the local server running on port 4321:

  ```bash
  "$CHROME" --headless=new --hide-scrollbars --force-device-scale-factor=2.4 --window-size=360,800 \
    --virtual-time-budget=6000 --screenshot=mixer-app.png http://127.0.0.1:4321/tools/mixer-app.html
  sips -s format jpeg -s formatOptions 84 mixer-app.png --out assets/img/work/mixer-app.jpg
  ```

  `mixer-icon.png` is Mixer's app icon (`website/public/assets/icon-512.png`), and `mixer-flick.webp` is its fox, Flick, on a transparent background, which the hero samples for its particle glyph.
