# CLAUDE.md

## What this is
Unpacked Chromium (MV3) extension that replaces the Brave new tab page with an
iOS-style app grid, search bar, clock, weather, solar countdown and battery readout.
No build step, no dependencies, no framework.

Target environment: Fedora KDE, Brave (native, not flatpak), 1920x1200 display.

See DECISIONS.md for why things are the way they are before changing them.

## Files
- `manifest.json` — MV3. `chrome_url_overrides.newtab` → `newtab.html`.
  Permissions: `favicon`, `downloads`. Host access is `optional_host_permissions`
  (`https://*/*`, `http://*/*`), not granted at install: it is requested from the setup
  wizard and from Settings → General, and `resolve()` skips its two network sources
  when `hostOK` is false. `chrome.permissions.request` must be called straight out of a
  click — an `await` before it loses the user gesture and the prompt never appears.
  The description field carries the repo path.
- `newtab.html` — all CSS inline in a `<style>` block, plus the inline SVG `#glass`
  filter used by the tile backdrop.
- `newtab.js` — all logic. Loaded via `<script src>`; inline scripts are blocked by
  extension CSP, so never inline JS into the HTML.
- `bglist.js` — generated array of wallpaper filenames. Must be regenerated whenever
  files in `bg/` change (see Testing).
- `bg/*.jpg` — wallpapers, one picked at random per tab load.
- `icon.svg` — the mark: a browser tab whose page is a home screen grid, on a slate
  badge. `icon128.png` and `icon48.png` render from it.
- `icon-small.svg` — the same mark redrawn for 16px: heavier stroke, four larger
  tiles. `icon16.png` renders from this one, not from `icon.svg`, whose strokes fall
  below a pixel at that size. Re-render both after editing either:
  `rsvg-convert -w 128 -h 128 icon.svg -o icon128.png` (and 48; 16 from the small one).

## Data model (localStorage, plus one IndexedDB entry)
- `tiles` — `[{n, u, ic?}, ...]` or folders `{n, f:[...]}`. Name, URL, optional icon
  (data URL or remote URL).
- `ic:<url>` — cached icon data URLs.
- `wxloc` — `{lat, lon, name, cc}` weather location; `cc` is the ISO country code from
  the geocoder and selects the unit — `US` asks Open-Meteo for Fahrenheit, everything
  else gets Celsius. A `wxloc` saved before this has no `cc` and stays Celsius.
- `wx` — cached forecast incl. sunrise/sunset, 30-minute TTL.
- `engine` — selected search engine `{n, u, h}`.
- `llm` — selected chat model for the bottom bar `{n, u, h}`.
- `profname` — last saved profile name, without the `.json`.
- `plabel` — optional label drawn bottom-left, set under Settings → General. No API
  exposes the *browser* profile's name, but `localStorage` is already per-browser-
  profile, so a label set in each one identifies it. Hidden in edit mode, where `#wp`
  occupies that corner.
- IndexedDB `hs` → store `kv`: keys `prof:<name>` are the saved profiles,
  `{v:2, tiles, engine, llm, feat, wxloc}` each — the whole configuration, not just the
  grid. `v:1` files (tiles only) and bare arrays still load; missing fields are left
  alone. `snapshot()` and `applyProfile()` are the single writer and reader, so Save and
  Export cannot drift apart. Profiles live here, not on disk — no folder to configure, and no
  ~5 MB `localStorage` ceiling to hit once icons are embedded.
- `feat` — `{llm, wx, sol, bat}` 0/1 flags from the setup wizard and the edit-mode panel. Its absence is what makes
  the wizard run, so deleting the key re-runs it on the next new tab.

## Icon resolution order (newtab.js)
1. custom `t.ic` if set
2. `https://<host>/apple-touch-icon.png`
3. `https://icons.duckduckgo.com/ip3/<host>.ico`
4. Chrome favicon cache (`chrome-extension://<id>/_favicon/`)
5. first letter of the name

Loads are cached as data URLs via `fetch()` + FileReader. Never set `img.crossOrigin`
— DDG sends no CORS headers and it breaks rendering. Uploaded custom icons are
auto-trimmed and normalised to a 512px square by `autotrim()` before storage.

## UI
- **+** add a tile; leave the URL blank to create a folder. Then choose Default or
  Custom icon.
- **pencil** (inline SVG, not a glyph) toggles edit mode: red minus badges delete,
  clicking a tile opens a menu (rename / change URL / change icon). Edit mode also shows
  `#wp` bottom-left, a chip per widget (Weather, Sunrise/sunset, AI search bar, Battery)
  toggling it on or off live. Clicking the background exits edit mode.
- **hamburger**: four entries only — Save profile (in-page name dialog, writes into the
  profiles folder), Select profile (dropdown of the `.json` in that folder, plus a Browse
  button for one kept anywhere else), Create a new profile, Settings.
- **Settings** is a tabbed dialog holding everything configurable, so the menu stays
  short: *Profiles* (profiles folder, export), *Weather* (location, refresh forecast),
  *General* (clear icon cache). New options belong on a tab here, not in the menu.
- Select profile lists the stored profiles in a dropdown, with Delete, and a Browse
  button for loading a `.json` from anywhere.
- **setup wizard** runs on first load and from Create a new profile: search engine,
  whether to include the AI assistant bar and which assistant, whether to show weather,
  the solar countdown and the battery, then the location picker. Everything defaults to on if a step
  is dismissed. Create a new profile confirms first, offers to save the current profile,
  then clears tiles, `feat`, `wxloc`, `wx` and `profname`.
- Dragging a tile onto the **middle** of another creates a folder (or adds to one, if the
  target already is a folder); dragging onto its **left or right quarter** inserts the
  tile at that position instead, and dropping on empty grid space moves it to the end.
  A blue bar in the gap or a ring on the icon shows which will happen. Dragging a folder
  always reorders, since folders cannot nest. Back arrow
  (top left) leaves a folder. To get a tile back out, drag it onto the back arrow, or
  use "Move out of folder" in its edit-mode menu; either empties and removes the folder
  if it was the last one in it.
- Clicking the search-bar icon switches search engine (built-in list or custom URL).
- A second bar at the bottom sends the typed question to a chat model. Clicking its
  icon switches model (Claude, ChatGPT, Gemini, Grok, Perplexity, or custom URL), the
  same way the search-bar icon switches engine. Whether a given service prefills or
  auto-runs the prompt is per-service — see DECISIONS.md.

## Conventions
- Vanilla JS, no libraries, no bundler. Keep it small and fast.
- No `chrome.storage`; `localStorage` is intentional.
- Edits are surgical `sed`/`python3` string replacements against exact lines. Verify
  the replacement actually matched — several silent no-ops have happened.
- Layout positions derive from the search bar's geometry (`min(560px,46vw)`, centred),
  not hardcoded pixels. Measure with getBoundingClientRect before adjusting.
- The tile-label rule is scoped `#g span`; a global `span` rule will truncate the
  weather and solar text.

## Testing
No test suite. Reload at `brave://extensions` (circular arrow), open a new tab.
Errors surface in DevTools on the new tab page.

Regenerate the wallpaper list after adding/deleting files in `bg/`:
`ls bg | sed 's/.*/"&"/' | paste -sd, - | sed 's/^/const BG=[/; s/$/];/' > bglist.js`
A stale list renders black pages.

Clear icon cache from the hamburger menu, or:
`Object.keys(localStorage).filter(k=>k.startsWith('ic:')).forEach(k=>localStorage.removeItem(k))`

## Gotchas
- Brave shows a "Customise Brave" footer on extension new tabs; right-click it and
  choose hide. Not controllable from the extension.
- Brave's own NTP wallpapers are unavailable; the remote component stops downloading
  once an extension overrides the new tab.
- Loading the extension from a different directory changes its ID and resets
  `localStorage`. Export the profile first.
- Brave restricts the Battery Status API and returns the spec's "no information"
  constants — level 1, charging true, chargingTime 0, dischargingTime Infinity. `batt()`
  treats that exact signature as "no battery" and renders nothing, because displaying it
  reads as a confident 100% on a laptop running on battery. Elsewhere the API works and
  charging state is polled every 20s.
