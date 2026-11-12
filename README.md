# Sigentic Labs website

The marketing site for **Sigentic Labs LLC**: a hand-built static site with no framework and no build step. It's served from Cloudflare (see "Deploy").

```
index.html          Landing page (hero, manifesto, five product chapters, lab ledger, approach, principles, contact)
privacy.html        Privacy policy (a template, see "Before you launch")
terms.html          Terms of use (a template)
support.html        Support page, and the Support URL for the app stores
security.html       Vulnerability disclosure policy
404.html            Not-found page (uses absolute /assets paths)
assets/css/         styles.css: the tokens, the components and every page's rules
assets/js/          main.js: nav, reveals, copy buttons · sigil.js: the hero figure and its headline word
assets/img/         logo, favicons, app icons, social share image (og.png), product captures in work/
tools/              shoot.mjs (screenshots), contrast.mjs (AA check), sync-brand.mjs, and the templates for og.png and the PNG icons
site.webmanifest, robots.txt, sitemap.xml
.well-known/        security.txt
wrangler.jsonc      Cloudflare Worker config · worker.js: www redirect · .assetsignore: files kept out of the site
.github/workflows/  deploy.yml: deploys on pushes to the release branch
```

## Preview locally

```bash
python3 -m http.server 4321
```

Then open http://localhost:4321.

To see `404.html` locally, serve with `python3 .claude/devserver.py 4321` instead. It turns caching off and serves the 404 page for any missing path.

## Before you launch

1. **Domain.** Find and replace `sigenticlabs.com` across the project with your real domain. It appears in canonical URLs, Open Graph tags, the sitemap and the email addresses.
2. **Email.** Every contact link is `mailto:hello@…` with a pre-filled subject, so you need only one inbox. Change the address in the same find and replace.
3. **Products.** The products section is five chapters, one `<article class="chapter chapter--…" data-product="…">` per project in `index.html` (`<!-- Savorly -->`, `<!-- Morse -->` and so on). Each chapter has a rule with its number, field and status, the name and tagline, a description, its links and, for four of them, a platform line. Beside them sits a plate: a numbered colour field with the real product on it. Those are Savorly's phone screenshot, the Morse desktop capture, a Mesh program, Incant's game window with its agent panel, and an example Mixer app on an Android phone. A plate takes its colours from the product's four tokens (`--p-spot`, `--p-ink`, `--p-tint`, `--p-on`) in the token table at the top of `styles.css`, which `data-product` selects. Links like `#mesh` scroll to that chapter. Copy, statuses and links come from each repo's README and live site as of October 2026. Update them when something ships. The status is `state` (a filled lime dot: live or released) or `state state--dev` (a hollow dot: in development).
4. **The Lab.** The `<li class="ledger__row">` rows under `id="lab"` show where each piece of work stands. Each row's stage track (`<p class="stages" role="img">`) lists Spark, Prototype, Beta and Shipped. Give the reached steps `is-done` and the current one `is-now`, and update the track's `aria-label` (for example `Stage: beta, 3 of 4`). Screen readers announce only that label, so keep it in step with the classes. Move a row along as it progresses.
5. **Legal and operations pages.** These are templates, **not legal advice**. Have an attorney review them. `terms.html` section 9 names the State of New York and Kings County as the governing law and venue, so confirm both.
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

The hero is an ink stipple figure on a dotted notebook page, drawn on a canvas, and it morphs between product marks. The headline's last word changes with it, and so do the caption and the index strip along the bottom of the hero. Everything that changes with a scene comes from one entry in `SCENES` at the top of `assets/js/sigil.js`:

```js
{
  product: 'savorly',          // the scene's row in the stylesheet's token table
  name: 'Savorly',             // the italic name in the caption, and each tick's label
  field: 'Cooking',            // the mono label in the caption
  word: 'the kitchen.',        // the headline's last word
  box: [7, 0, 280],            // the square of the drawing the figure uses: x, y, size
  layers: [                    // the drawing: fills, and cuts that knock holes in them
    ['fill', 'M 85.8 20.9 …'],
    ['cut', 'M 194 154 …'],
  ],
}
```

- **`product`** names a row of `[data-product='…']` in `styles.css`. The script reads that row's `--p-tint` (the flat hand-tint printed slightly off the ink) and `--p-ink` (the colour of the lightest dots), so a scene needs no colour of its own. The script reads each colour back through the canvas, so the figure accepts hex, named colours, `rgb()` and `hsl()`. It cannot read `oklch()`, `lab()`, `color()` or `color-mix()`, which Chrome hands back in their own syntax. Keep the table in six-digit hex anyway, because `tools/contrast.mjs` reads only that form. The word in the headline wears the same row. The first scene uses `seed`, which is not a product chapter.
- **The shape** is one of three kinds. `paths` are stroked at `stroke` width on a 100 by 100 grid, with optional `fills` for shapes that are filled (Mesh). `layers` are ordered `['fill' | 'cut', pathData]` pairs drawn on the square `box` of `[x, y, size]` (Savorly, Morse, Incant). An `image` is the URL of art whose opaque pixels the dots fill (Mixer's fox). Scene 0 passes only `fills`, read from the Seed paths in the page's `#i-logo` sprite symbol.
- **Image art** should be on a transparent background. Its dark features (eyes, nose) are drawn in the darkest ink, its mid tones in the product ink, and its palest fur gets only the hand-tint.
- **The index strip** matches the scene by `data-product`. Each `<a data-product="…">` in `.index` gets `is-lit` while its product is on screen.

**Figure numbers** count from zero, in `SCENES` order. The Seed is Fig. 00, so each product's figure matches its index entry (Savorly is Fig. 01 and No. 01).

**To add a scene,** add a `[data-product='…']` row with its four tokens to the stylesheet (if it is a new product), then add an entry to `SCENES`. The caption, the ticks and the headline size follow from the list. If the scene is a product, add its link to the index strip, whose layout has five columns.

**Headline size.** `.hero__title` is sized as its column's width divided by its widest line in em (`--fit`), so the longest line fills the column and never wraps. `sigil.js` measures the two fixed lines and every scene's `word` as they are set, once the fonts load, and writes `--fit` on the hero. A longer word needs no CSS change. The default `--fit` in the `.hero` rule is the widest today. It only matters for the first paint, so update it if you add a longer word.

**Ticks and Pause.** The script builds one tick per scene in `[data-stage-ticks]`. Each is a button labelled "Show" and the scene's `name` (for example "Show Savorly") that jumps to its scene and keeps the current play state. The current tick fills over the hold time (`HOLD_MS`, 4.8 seconds) and finished ticks stay filled. The fill and the cycle read one clock, the script's running time, so the tick is full exactly when the scene changes. The Pause button (`[data-stage-pause]`) stops and restarts the cycle and reports its state in `aria-pressed`. After the page loads and after every jump, the figure keeps drawing for 1.8 seconds of on-screen time (`SETTLE_MS`) so the dots land, paused or not. Time spent off-screen or in a hidden tab does not count against it. With `prefers-reduced-motion` the figure draws one still scene, never cycles, and the Pause button is hidden.

## Design system

Colour is a small set of tokens in `:root` at the top of `assets/css/styles.css`. The page is paper and the type is ink. Lime is only ever a highlighter or a dot, because lime text fails AA on paper.

| Token | Value | Use |
| --- | --- | --- |
| `--paper` / `--paper-2` | `#F4F1E9` / `#E9E5D8` | Page, and deeper paper (the lab ledger, the legal-page note) |
| `--ink` | `#14160F` | Text, rules, the footer and principles bands |
| `--ink-2` / `--ink-3` | `#4C5044` / `#5F6255` | Secondary text and mono labels |
| `--rule` / `--rule-2` | ink at 16% / 32% | Hairlines |
| `--lime` | `#BDF75F` | The highlighter, status dots, the contact band, the focus halo |
| `--on-ink` / `-2` / `-3`, `--rule-on-ink` | `#F4F1E9` / `#C9C6BA` / `#8E9182`, paper at 18% | Text and rules on ink |
| `--code-type` / `--code-num` | `#2238B8` / `#A63D0C` | The Mesh code sample |

Each product has one row in the token table below `:root`, selected by `data-product`. A chapter, a plate, a swatch, a ledger row and the hero all read only these four tokens.

| `data-product` | `--p-spot` (plate) | `--p-ink` (text on paper) | `--p-tint` (highlighter) | `--p-on` (text on the spot) |
| --- | --- | --- | --- | --- |
| `seed` | `#BDF75F` | `--ink` | `#BDF75F` | `--ink` |
| `savorly` | `#F26B2A` | `#A63D0C` | `#FFD6BA` | `--ink` |
| `morse` | `#2B50E0` | `#2238B8` | `#CFD8FF` | `--paper` |
| `mesh` | `#0B7A55` | `#0B6E4C` | `#BDEBD5` | `--paper` |
| `incant` | `#6645E8` | `#5332D0` | `#DCD3FF` | `--paper` |
| `mixer` | `#F0503C` | `#A82A18` | `#FFD0C6` | `--ink` |

The rest of the scale is also tokens: type sizes `--t-display` to `--t-label`, spacing `--s-1` to `--s-9` and `--section`, radii `--r-*`, and `--measure` (33rem, the reading column of the text pages, about 68 characters of Geist). Pages are built from components, not one-off rules:

- **Label** (`.label`, `.mono`, `.eyebrow`): small uppercase Geist Mono. `.label__num` is its ink number.
- **Highlighter** (`.hl`): a lime stroke behind ink text.
- **Swatch** (`.swatch`): a small square in the product's spot colour.
- **Buttons and links** (`.btn` with `--ink`, `--lime`, `--ghost` and `--sm`, and `.text-link`).
- **Status** (`.state`, `.state--dev`).
- **Corner marks** (`.marks`): crop marks on a plate or figure.
- **Ruled list** (`.specs`): a numbered list between hairlines. The text pages use it for their contents.
- **Chapter and plate** (`.chapter` with `--portrait`, `--mirror`, `--wide` and `--board`, and `.plate`).
- **Section head** (`.head`), **ledger** (`.ledger`, `.stages`) and **text page** (`.doc`, with `.doc__title`, `.doc__note` and `.doc__toc`).
- **Copy button**: any button with `data-copy` puts that text on the clipboard. Its toast says `data-copy-toast`, or "Copied." without one. The element inside it marked `data-copy-label` reads "Copied" for about two seconds, then returns to its own text.

Type: **Fraunces** for display, headings, numerals and the italic emphasis, **Geist** for body text and interface, and **Geist Mono** for labels, status and counters. All three load from Google Fonts, in one `<link>` on each of the six pages. A `Fraunces Fallback` face in the stylesheet sizes Georgia to Fraunces' metrics so the headline does not jump when the font arrives. If you want zero third-party requests, self-host the font files, update the `<link>` tags and keep the `--serif`, `--sans` and `--mono` tokens. The privacy policy mentions Google Fonts, so edit that paragraph if you do.

The **Seed** logo is three soft, asymmetric forms growing around an open center. The approved artwork lives in `assets/img/logo.svg`. On paper the mark is ink (`.brand__mark` takes `--ink`), and on the ink footer it is lime. Lime is the highlighter on paper, never the mark's colour there. The mark can be rendered in one color. Keep the three shapes together and preserve their spacing. `logo-tile.svg` / `favicon.svg` is the icon version, lime on a flat charcoal tile.

After editing the source SVG, run `node tools/sync-brand.mjs` to update the six page sprites and SVG icon tiles. The animated hero reads its paths from the page sprite; both image templates load the source SVG directly. The brand preview at `tools/brand/preview.html` shows the mark at navigation and favicon sizes.

## Regenerating brand images

`og.png` (the 1200×630 link preview) and the PNG icons are rendered from `tools/` with headless Chrome. With a local server running on port 4321:

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,630 \
  --virtual-time-budget=6000 --screenshot=assets/img/og.png http://127.0.0.1:4321/tools/og.html
```

`tools/icons.html` writes base64 PNGs into the page after the SVG loads. Capture them with `--dump-dom --virtual-time-budget=3000` and decode them into `assets/img/`. Keep the manifest icons inside the central maskable safe zone.

## Accessibility & performance

- Respects `prefers-reduced-motion`: animations and transitions are off, reveals appear at once, the hero draws one still figure and never cycles, and the Pause button is hidden because there is nothing to pause.
- Without reduced motion the hero cycles every 4.8 seconds. The Pause button stops it, and each tick jumps to a scene.
- Without JavaScript the nav has no menu. At 900 px and under it takes two rows, with the brand and "Get in touch" on the first and the four links on the second, and every link stays on screen. With JavaScript on, those widths get the menu button instead.
- Semantic landmarks, a skip link, labelled controls, and an accessible name for the animated headline. The focus ring is an ink outline over a lime halo, so it reads on paper, on ink and on every product colour.
- `node tools/contrast.mjs` checks a hand-kept list of text and background pairs, and the focus ring on each field, against WCAG AA. It reads the colours from `styles.css`, so a token change is rechecked, and it exits 1 if a pair fails. It checks each colour at full strength. It does not find pairs on its own and does not see opacity, so add a row to its `pairs` list when you put a text colour on a new background, and do not fade text below its token. At the time of writing all 40 pairs pass.
- The particle canvas pauses when the hero is off-screen or the tab is hidden. It draws 4,200 particles, or 2,600 under 900 px wide.
- No frameworks or trackers. The JavaScript is about 25 KB unminified (`wc -c assets/js/*.js`).

## Tools

Neither tool needs a package. `shoot.mjs` needs Node 22 or newer.

- **`tools/shoot.mjs`** takes screenshots with headless Chrome, for checking a page at a given width. It scrolls the page first so scroll reveals have run. It exits non-zero when the page cannot be reached, when it does not finish loading within 30 seconds, and on any page error, including a 404 response. It looks for Chrome at the macOS path, or at `$CHROME`. Options include `--width`, `--height`, `--mobile`, `--scale`, `--tiles` (one image per screen height), `--full`, `--selector` and `--eval`.

  ```bash
  node tools/shoot.mjs http://127.0.0.1:4321/ /tmp/home.png --tiles --width 1440 --height 900
  ```

- **`tools/contrast.mjs`** checks its listed colour pairs against WCAG AA (see "Accessibility & performance").

  ```bash
  node tools/contrast.mjs
  ```

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
