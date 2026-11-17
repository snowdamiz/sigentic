# Sigentic Labs website

The marketing site for **Sigentic Labs LLC**: a hand-built static site with no framework and no build step. It's served from Cloudflare (see "Deploy").

```
index.html          Landing page (hero, five product stages, lab log, about, newsletter and contact)
privacy.html        Privacy policy (a template, see "Before you launch")
terms.html          Terms of use (a template)
support.html        Support page, and the Support URL for the app stores
security.html       Vulnerability disclosure policy
404.html            Not-found page (uses absolute /assets paths)
assets/css/         styles.css: the tokens, the components and every page's rules
assets/js/          main.js: nav, menu, reveals, copy buttons, newsletter form · sigil.js: the hero figure, its picker and its headline word
assets/img/         logo, favicons, app icons, social share image (og.png), product captures in work/
tools/              shoot.mjs (screenshots), contrast.mjs (AA check), sync-brand.mjs, and the templates for og.png and the PNG icons
site.webmanifest, robots.txt, sitemap.xml
.well-known/        security.txt
wrangler.jsonc      Cloudflare Worker config · worker.js: www redirect · .assetsignore: files kept out of the site
.github/workflows/  deploy.yml: deploys on pushes to the release branch
```

All six pages share one nav, menu and footer, written out in each file. The homepage links to its own sections (`#savorly`, `#about`). The other five pages link back to them (`/#savorly`, `/#about`). When you change one copy, change all six.

## Preview, a candidate redesign

`preview/` holds a second, complete design of the site, so the two can be compared. Serve the repo as below and open http://localhost:4321/preview/ beside the current home page. It is a dark design with Geist type (self-hosted, see `preview/assets/fonts/LICENSE.txt`). It keeps the Seed logo in its brand lime and shows each product's real app icon and captures.

```
preview/index.html                 Hero with the Seed and a dock of the five app icons, one showcase per product, lab log, about, contact
preview/{support,security,privacy,terms,404}.html   The root pages' text in the new design
preview/assets/css/                site.css: tokens and the home page · doc.css: the text pages
preview/assets/js/site.js          Nav glass, scroll reveals, dock magnification, card spotlight, copy buttons
preview/assets/img/products/       App icons and real captures (see below)
tools/preview-og.html              Source of preview/assets/img/og.png and touch-icon.png
```

The product images are real. Most come from `assets/img/work/` (see "Product images"). Three come from the product repos. `mixer-pixel.jpg` is `native/android/verification/device-toggled.png` in the Mixer repo, a Swift app running on a physical Pixel. `savorly-souschef.jpg` is `docs/recipe-studio-mobile.png` in the Savorly repo. `mesh-reroute.jpg` is a still from the Mesh film, `brag-output/work/stills/s1.0.png` in the Mesh repo.

To redraw the share image and the touch icon after a design change, serve the repo and run:

```bash
node tools/shoot.mjs http://localhost:4321/tools/preview-og.html preview/assets/img/og.png --width 1200 --height 630
node tools/shoot.mjs "http://localhost:4321/tools/preview-og.html#icon" preview/assets/img/touch-icon.png --width 180 --height 180
```

The pages carry `noindex` while they are a candidate. Share the link with its trailing slash, `/preview/`. The Worker only maps paths that end in `/` to `index.html`, so `/preview` gets the root 404 page, and so does any missing `/preview/...` URL.

To adopt the design:

1. Move `preview/` to the root in place of the old pages and `assets/`.
2. Remove the `noindex` lines and point `og:image` at the root path.
3. Give `404.html` absolute `/assets` paths, because the Worker serves it for every missing URL.
4. Update the privacy policy. It says the site loads fonts from Google Fonts, and the preview serves its own.

## Preview locally

```bash
python3 -m http.server 4321
```

Then open http://localhost:4321.

To see `404.html` locally, serve with `python3 .claude/devserver.py 4321` instead. It turns caching off and serves the 404 page for any missing path.

## Before you launch

1. **Domain.** Find and replace `sigenticlabs.com` across the project with your real domain. It appears in canonical URLs, Open Graph tags, the sitemap and the email addresses.
2. **Email.** Every contact link is `mailto:hello@…` with a pre-filled subject, so you need only one inbox. Change the address in the same find and replace.
3. **Products.** Each product is one `<section class="stage" id="…" data-product="…">` in `index.html` (`<!-- Savorly -->`, `<!-- Morse -->` and so on). Every stage has the same three parts:
   - `stage__head`: the app icon, the name, the tagline, a description and the links. The first link is the product button (`btn btn--product`), the second the Source link.
   - `stage__media`: the product itself. Those are Savorly's phone screen, the Morse desktop window, the Mesh program with its install command, Incant's game window with its agent panel, and an example Mixer app on an Android phone.
   - `stage__foot`: four features (`feats`), then the availability line (`avail`). The line holds the field, the status, the stage meter and a sentence on where the product runs today and what is not out yet.

   Stages alternate white and grey, so keep `stage--alt` on every other one. The status dot is `dot` (filled: live or released) or `dot dot--ring` (hollow: in development). The meter's `data-step` is the stage on a four-step scale (1 Spark, 2 Prototype, 3 Beta, 4 Shipped), and the word after it names the same stage. Colours come from the product's row in the token table at the top of `styles.css`, which `data-product` selects. Copy, statuses and links come from each repo's README and live site as of October 2026. When something ships, update its status, meter and availability line, and add it to the lab log. A product also appears in the hero picker, the nav, the menu and the footer of all six pages.
4. **Placeholders.** Some homepage content is invented so the design reads as finished. Replace or remove each item before launch. To find one, search `index.html` for the text in code font.
   - Lab log dates: `datetime="2026-`. The months are guesses. The events are real milestones.
   - Studio facts: `spec__grid--facts`. "Founded 2025", "Based in New York" and "Independent and self-funded" are placeholders. "5, all developed in public" is real.
   - Founder card: `Founder name`. The name, the `FN` initials, the role and the one-line bio are all placeholders.
   - Press kit link: `Press kit`. It points to `#`.
   - Newsletter form: `data-signup`. The form has no backend. Submitting a valid address only clears the field and shows the toast "Thanks. We'll write when something ships." Nothing is sent or stored. Connect it to a mailing service or remove it. If you connect one, add it to the privacy policy.
5. **Legal and operations pages.** These are templates, **not legal advice**. Have an attorney review them. `terms.html` section 9 names the State of New York and Kings County as the governing law and venue, so confirm both.
   - `privacy.html` covers this site, morseapp.io (including the Morse waitlist), meshlang.dev, the Incant site, and email. It points to Savorly's own policy. Publish a full Morse privacy policy before Morse's public release. Publish one for Mixer's hosted release service before it launches.
   - `terms.html` covers the same sites, plus product licenses, pre-release software and copyright (DMCA) notices.
   - `support.html` is the **Support URL** for App Store Connect and Google Play listings. It links each product's help, privacy and account-deletion pages. Savorly's own `/privacy` and `/account-deletion` are the URLs to give the stores for Savorly.
   - `security.html` and `/.well-known/security.txt` set out the vulnerability disclosure policy. `security.txt` has an `Expires` date (2027-10-20), so update it before then.
   - No cookie banner is needed: the site sets no cookies and has no analytics. Revisit this if you add analytics.
6. **Social links.** The footer's Company column links GitHub. Add other profiles there as you create them.

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

The hero is an ink stipple figure drawn on a canvas. It morphs between the Seed mark and each product's mark. The headline's last word changes with it. Below the figure sits the picker, one link per product. Everything that changes with a scene comes from one entry in `SCENES` at the top of `assets/js/sigil.js`:

```js
{
  product: 'savorly',          // the scene's row in the stylesheet's token table, and its picker link's data-scene
  word: 'the kitchen.',        // the headline's last word
  box: [7, 0, 280],            // the square of the drawing the figure uses: x, y, size
  layers: [                    // the drawing: fills, and cuts that knock holes in them
    ['fill', 'M 85.8 20.9 …'],
    ['cut', 'M 194 154 …'],
  ],
}
```

- **`product`** names a row of `[data-product='…']` in `styles.css`. The script reads that row's `--p-tint` (the flat wash printed slightly off the dots) and `--p-ink` (the colour of the lightest dots), so a scene needs no colour of its own. The script reads each colour back through the canvas, so the figure accepts hex, named colours, `rgb()` and `hsl()`. It cannot read `oklch()`, `lab()`, `color()` or `color-mix()`, which Chrome hands back in their own syntax. Keep the table in six-digit hex anyway, because `tools/contrast.mjs` reads only that form. The headline word and the hero's focus ring wear the same row. The first scene uses `seed`, which is not a product and has no picker link.
- **The shape** is one of three kinds. `paths` are stroked at `stroke` width on a 100 by 100 grid, with optional `fills` for shapes that are filled (Mesh). `layers` are ordered `['fill' | 'cut', pathData]` pairs drawn on the square `box` of `[x, y, size]` (Savorly, Morse, Incant). An `image` is the URL of art whose opaque pixels the dots fill (Mixer's fox). Scene 0 passes only `fills`, read from the Seed paths in the page's `#i-logo` sprite symbol.
- **Image art** should be on a transparent background. Its dark features (eyes, nose) are drawn in the darkest ink, its mid tones in the product ink, and its palest fur gets only the wash.

**The picker** (`[data-picker]`) holds one link per product, `<a href="#mesh" data-scene="mesh" data-product="mesh">Mesh</a>`. A link's `data-scene` must match a scene's `product`. Hovering a link with a mouse, or focusing it with the keyboard, shows its scene and holds it there. Clicking it scrolls to the product's stage. The current link's underline fills over the hold time (`HOLD_MS`, 4.8 seconds), and the scene changes when it is full. The Pause button (`[data-pause]`) stops and restarts the cycle and reports its state in `aria-pressed`. After the page loads and after every jump, the figure keeps drawing for 1.8 seconds of on-screen time (`SETTLE_MS`) so the dots land, paused or not. With `prefers-reduced-motion` the figure draws one still scene and never cycles, and the Pause button is hidden. The picker still switches the still figure.

**To add a scene,** add a `[data-product='…']` row with its three tokens to the stylesheet (if it is a new product), add an entry to `SCENES`, and add its link to the picker.

**Headline size.** `.hero__title` is sized by `--t-hero`, from 40px on phones to 84px. The rotating word never wraps (`.rotor` is `nowrap`), so check a longer word at 390px wide.

## Design system

`assets/css/styles.css` is in five parts, in order: tokens, base, components, sections and motion. Each component and section keeps its own phone rules beside it. The breakpoints are 1000px (grids drop to two columns), 900px (the nav becomes a menu) and 640px (phones).

Colour is a small set of tokens in `:root`. The page is white, the type is near-black ink, and a light grey field marks every other stage, About and the footer.

| Token | Value | Use |
| --- | --- | --- |
| `--bg` / `--bg-2` | `#FFFFFF` / `#F5F5F3` | Page, and the grey field (alternate stages, About, the footer, the legal-page note) |
| `--ink` | `#16171A` | Text, the ink button, the toast |
| `--ink-2` | `#5B5E65` | Secondary text: descriptions, ledes, nav and footer links |
| `--ink-3` | `#6C6F75` | The newsletter placeholder, and the numbers and bullets on the legal pages |
| `--on-ink` | `#FFFFFF` | Text on ink and on product buttons |
| `--rule` / `--rule-2` | ink at 10% / 18% | Hairlines and outlined buttons |
| `--lime` | `#BDF75F` | Text selection |
| `--code-bg`, `--code-bar`, `--code-term` | `#141518`, `#1B1C20`, `#0F1012` | The Mesh code window, its title bar and its install bar |
| `--code-text`, `--code-dim` | `#E4E5E8`, `#9A9CA3` | Code and the window title |
| `--code-key`, `--code-type`, `--code-fn`, `--code-num` | `#FF7AB2`, `#8FD6FF`, `#7EE0B5`, `#F8C77E` | Mesh syntax colours |

Each product has one row in the token table below `:root`, selected by `data-product`. A stage, its links and status, the nav and picker marks, the lab log dots and the hero read only these three tokens.

| `data-product` | `--p-spot` (dots, meter, underline) | `--p-ink` (button, links, hero word, focus ring) | `--p-tint` (the hero figure's wash) |
| --- | --- | --- | --- |
| `seed` | `#BDF75F` | `--ink` | `#BDF75F` |
| `savorly` | `#F26B2A` | `#A63D0C` | `#FFD6BA` |
| `morse` | `#2B50E0` | `#2238B8` | `#CFD8FF` |
| `mesh` | `#0B7A55` | `#0B6E4C` | `#BDEBD5` |
| `incant` | `#6645E8` | `#5332D0` | `#DCD3FF` |
| `mixer` | `#F0503C` | `#A82A18` | `#FFD0C6` |

The rest of the scale is also tokens. The type sizes run `--t-hero` (84px, 40px on phones), `--t-name` (80/52), `--t-h2` (52/34), `--t-h3` (36/28), `--t-tag` (28/22), `--t-lead` (20/18), `--t-body` (17) and `--t-small` (14). Spacing runs on 8px steps, `--s1` (8px) to `--s7` (96px), with `--section` for the padding of each section. `--wrap` (1200px) is the widest column, `--gutter` the page margin and `--nav-h` the nav's height. Pages are built from these components:

- **Buttons and links**: `.btn` (ink), `.btn--product` (the product's ink), and `.more`, a text link with a chevron.
- **Copy button** (`.copy`): any button with `data-copy` puts that text on the clipboard and shows its `data-copy-toast` in the toast. Give it both attributes and a `data-copy-label` element, which reads "Copied" for about two seconds. Inside the code window it turns dark.
- **Status** (`.dot`, `.dot--ring`) and **stage meter** (`.meter` with `data-step`).
- **Section title** (`.section-title`).
- **Devices and windows**: `.device--iphone` and `.device--pixel` frame phone screens. `.window` frames a desktop capture (`.window--morse`) or the code sample (`.window--code`, with `.code` and the install bar `.term`). `.duo` overlaps two images (Incant).
- **Product stage** (`.stage`, grey with `.stage--alt`), **lab log** (`.log`), **About** (`.about`, `.spec`, `.person`) and **newsletter and contact** (`.reach`, `.signup`, `.mail`, `.routes`).
- **Text page** (`.doc`, with `.doc__label`, `.doc__title`, `.doc__meta`, `.doc__lede`, `.doc__note` and the numbered contents `.doc__toc`), used by the four legal and support pages. **Not-found page** (`.lost`).
- **Visually hidden** (`.visually-hidden`): read by screen readers, not drawn.

Type is **Schibsted Grotesk** (weights 400 to 700) for everything, and **JetBrains Mono** for the Mesh code and the install command. Both load from Google Fonts, in one `<link>` on each of the six pages. If you want zero third-party requests, self-host the font files, update the `<link>` tags and keep the `--sans` and `--mono` tokens. The privacy policy mentions Google Fonts, so edit that paragraph if you do.

The **Seed** logo is three soft, asymmetric forms growing around an open center. The approved artwork lives in `assets/img/logo.svg`. On the site the mark takes the text colour (`.brand__mark` uses `currentColor`), so it is ink. The mark can be rendered in one color. Keep the three shapes together and preserve their spacing. `logo-tile.svg` / `favicon.svg` is the icon version, lime on a flat charcoal tile.

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
- Without reduced motion the hero cycles every 4.8 seconds. The Pause button stops it. Hovering or focusing a picker link shows that product and holds it.
- On the homepage the nav's product links stay hidden while the hero's picker is on screen, and appear (dock) once it scrolls under the nav. The other pages show them from the start.
- Without JavaScript the hero shows the still Seed mark and the nav has no menu. At 900px and under, the nav's product links take a second row instead, so every link stays on screen. With JavaScript on, those widths get the menu button.
- Semantic landmarks, a skip link, labelled controls, and an accessible name for the animated headline. The focus ring is a 2px outline in the product's `--p-ink`, or in ink outside a product, and light (`--code-text`) inside the Mesh code window. The stage meter's word is read with a hidden "Stage:" before it, so the bars carry nothing that text does not.
- Anchors and focused content stop below the sticky nav through `scroll-margin-top` on `main` and everything in it. It is not `scroll-padding-top` on `html`, because with that, focusing a link in the sticky nav scrolls the page.
- `node tools/contrast.mjs` checks a hand-kept list of text and background pairs, and the focus ring on each background, against WCAG AA. It reads the colours from `styles.css`, so a token change is rechecked, and it exits 1 if a pair fails. It checks each colour at full strength. It does not find pairs on its own and does not see opacity, so add a row to its `pairs` list when you put a text colour on a new background, and do not fade text below its token. At the time of writing all 47 pairs pass.
- The particle canvas pauses when the hero is off-screen or the tab is hidden. It draws 4,200 particles, or 2,600 under 900 px wide.
- No frameworks or trackers. The JavaScript is about 23 KB unminified (`wc -c assets/js/*.js`).

## Tools

Neither tool needs a package. `shoot.mjs` needs Node 22 or newer.

- **`tools/shoot.mjs`** takes screenshots with headless Chrome, for checking a page at a given width. It scrolls the page first so scroll reveals have run. It exits non-zero when the page cannot be reached, when it does not finish loading within 30 seconds, and on any page error, including a 404 response. A shot of a missing path therefore exits 1 on the 404 page's own status, so read its error list rather than the exit code. It looks for Chrome at the macOS path, or at `$CHROME`. Options include `--width`, `--height`, `--mobile`, `--scale`, `--tiles` (one image per screen height), `--full`, `--selector` and `--eval`.

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
