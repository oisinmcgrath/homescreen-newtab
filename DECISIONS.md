# Decision log

Chronological record of why this extension is built the way it is. Read with CLAUDE.md.

## Architecture

**Unpacked MV3 extension, no build step.** Three files do everything: `manifest.json`,
`newtab.html` (all CSS inline), `newtab.js` (all logic). No framework, no bundler.
Rationale: the page must render instantly on every new tab; a build pipeline would add
friction for a single-user tool.

**Inline `<script>` is impossible.** Extension CSP blocks it. All JS must live in
`newtab.js` and load via `<script src>`. This bit us once — the first version rendered
an empty page.

**`localStorage`, not `chrome.storage`.** Synchronous, so tiles paint without a round
trip. Consequence: state is per-extension-ID, so reloading from a new directory
resets tiles. Profile export/import exists to work around this.

## Icons

**Resolution order:** custom `ic` → `/apple-touch-icon.png` → DuckDuckGo `icons.duckduckgo.com/ip3/`
→ Chrome favicon cache → first letter.

**Why DuckDuckGo over Google s2.** Both leak visited domains to a third party. Google's
`s2` returns higher resolution (128px+ vs ~32px) but the user chose DDG on privacy
grounds, accepting slightly blurrier icons.

**Why not Chrome's favicon cache first.** It only holds sites the browser has already
fetched a favicon for; outlook.com was missing despite frequent visits, and Chrome
silently returns a generic globe at full size, so `onerror` never fires. Detecting
that by image dimensions proved unreliable. Network sources go first now.

**Never set `img.crossOrigin`.** DDG sends no CORS headers; setting it makes icons fail
to render entirely. Caching is done with `fetch()` + FileReader under
`host_permissions`, not canvas, for this reason.

**`http://` icons need `host_permissions: ["http://*/*"]`.** LAN services (e.g. a
Python `BaseHTTPServer` on the local network) are plain HTTP, and mixed content is
blocked on the extension page unless fetched through the permission.

**Auto-trim on upload.** Custom icons are normalised in-browser: alpha is scanned by
row/column with a noise floor (~1% of the axis) so stray speckles don't defeat the
crop, then the content is scaled into a 512px square with ~1% padding. This came from
a long detour where ImageMagick `-trim` kept returning the full canvas — several
downloaded logos contain faint opaque speckles across the whole image, and one had a
checkerboard "transparency" pattern baked in as real pixels.

**Uploaded icons are stored as data URLs.** The source file can be moved or deleted
afterwards. Trade-off: re-trimming a source file requires re-picking it.

## Weather

**Open-Meteo.** No API key, no signup, CORS-enabled, free for non-commercial use.
Coordinates are set explicitly via their geocoding endpoint, never via browser
geolocation — the user is behind a VPN that would report the wrong city.

**Location picker is in-page, not `prompt()`.** Needed a live search with multiple
disambiguated results (name, admin1, country), which a native dialog can't do.

**30-minute cache** in `localStorage` under `wx`. Sunrise/sunset arrive in the same
call and drive the solar countdown, so clearing weather also refreshes that.

## Layout

**Positions are computed from the search bar's geometry, not eyeballed.** The bar is
`min(560px, 46vw)` centred, so its left edge is at `50% - min(280px, 23vw)`; the solar
pill spans exactly that gap and centres within it. Earlier attempts used hardcoded
`left:` values and broke at other window widths.

**When layout misbehaves, measure — don't guess.** Run in DevTools on the new tab:
`JSON.stringify(['#sol','.solbox','#sb','#tl','#g'].map(s=>{const e=document.querySelector(s);const r=e.getBoundingClientRect();return[s,{x:r.x,y:r.y,w:r.width,scrollW:e.scrollWidth}]}))`
This found two real bugs a screenshot couldn't: a global `span{max-width:90px}` rule
(meant for tile labels) truncating the solar text, and `calc(50vw - 280px)` collapsing
to zero at narrow window widths. The tile-label rule is now scoped to `#g span`.

**Glass effect.** Tiles use `backdrop-filter: blur() saturate() url(#glass)`, where
`#glass` is an inline SVG `feTurbulence` + `feDisplacementMap` for a water-on-glass
refraction. The displacement is deliberately NOT applied to the solar pill — at that
element's width it smears into visible artefacts.

**Legibility over minimalism.** Every text overlay carries a multi-layer `text-shadow`
and tiles carry an inner white hairline plus outer dark hairline, so content stays
readable against both very light and very dark wallpapers.

## Backgrounds

**Local files only, listed in `bglist.js`.** Brave's own NTP wallpapers are not
reachable: they ship in a remote component that stops downloading once an extension
overrides the new tab page, and the in-repo `backgrounds.ts` now contains a single image.
Wallpapers were pulled from Picsum instead and curated by hand.

**Regenerate the list after deleting any file:**
`ls bg | sed 's/.*/"&"/' | paste -sd, - | sed 's/^/const BG=[/; s/$/];/' > bglist.js`
Stale entries render as a black page — this was the cause of the intermittent
"no background" bug.

## Known limitations

- The Battery Status API is throttled and unreliable on Linux; charging state is
  polled every 20s and may still lag. A page reload is the fallback.
- Brave injects a "Customise Brave" footer on extension new tabs. Not controllable
  from the extension; right-click it and hide.
- Trademarked marks (e.g. the DuckDuckGo duck) are not drawn as SVG; the live favicon
  is used instead.
