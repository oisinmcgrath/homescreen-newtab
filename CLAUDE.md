# CLAUDE.md

## What this is
Unpacked Chromium (MV3) extension that replaces the Brave new tab page with an
iOS-style app grid. No build step, no dependencies, no framework.

Target environment: Fedora KDE, Brave (native, not flatpak), 1920x1200 display.

## Files
- `manifest.json` — MV3. `chrome_url_overrides.newtab` points at `newtab.html`.
  Permissions: `favicon` (Chrome favicon cache), `host_permissions https://*/*`
  (needed for `fetch()` icon caching). Description contains the repo path.
- `newtab.html` — all CSS inline in a `<style>` block. Grid, tile, clock, button styles.
- `newtab.js` — all logic. Loaded via `<script src>`; inline scripts are blocked by
  extension CSP, so never inline JS into the HTML.
- `bg/1.jpg`..`12.jpg` — wallpapers, one picked at random per tab load.
- `icon.svg`, `icon16/48/128.png` — extension + tab favicon (house outline).

## Data model
Tiles live in `localStorage` under key `tiles`: `[{n, u, ic?}, ...]`
(name, url, optional custom icon URL). Icon data URLs are cached under `ic:<url>`.

## Icon resolution order (newtab.js)
1. custom `t.ic` if set
2. `https://<host>/apple-touch-icon.png`
3. `https://icons.duckduckgo.com/ip3/<host>.ico`
4. Chrome favicon cache (`chrome-extension://<id>/_favicon/`)
5. first letter of the name

Successful loads are cached as data URLs via `fetch()` + FileReader. Do NOT set
`img.crossOrigin` — DDG sends no CORS headers and it breaks rendering.

## Conventions
- Vanilla JS, no libraries, no bundler. Keep it small and fast.
- No `chrome.storage`; `localStorage` is intentional.
- Edits are usually surgical `sed`/`python3` string replacements against exact lines.
- The `edit` (pencil) button toggles wobble mode: click a tile to rename/retarget/
  set a custom icon, blank name deletes. Drag reorders.

## Testing
No test suite. To verify: reload at `brave://extensions` (circular arrow), open a
new tab. Errors surface in DevTools on the new tab page. To clear icon cache:
`Object.keys(localStorage).filter(k=>k.startsWith('ic:')).forEach(k=>localStorage.removeItem(k))`

## Gotchas
- Brave shows a "Customise Brave" footer on extension new tabs; right-click it and
  choose hide. Not controllable from the extension.
- Background images from Brave's own NTP are not available; they ship in a remote
  component that stops downloading once an extension overrides the new tab.
