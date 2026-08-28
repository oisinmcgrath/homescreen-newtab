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

## Claude bar

**A second search bar at the bottom posts to `https://claude.ai/new?q=`.** Same
`min(560px,46vw)` centred geometry as the DDG bar (the `#sb` rule now covers both as
`#sb,#cb`; only `top`/`bottom` differ), baseline-aligned with the button row at
`bottom:16px`. The icon reuses `resolve()` with `u:'https://claude.ai'` so it shares the
`ic:https://claude.ai` cache entry with the Claude tile instead of creating a second one.

**`?q=` prefills the composer but does not submit — this is deliberate, not a bug.**
claude.ai shows a red "Use caution before running this prompt" interstitial for any
prompt arriving from outside the chat box and requires a human click on send, because an
external caller (a link, an extension) could otherwise get Claude to execute text the
user never reviewed. Verified 2026-08-28. Do not go looking for a different query
parameter that auto-sends; there isn't one, and the one-click confirmation is the point.
Pressing Enter a second time on the loaded page completes the send.

**Bar tints are brand colours applied through a `--tint` custom property** — a 6%
`color-mix` wash into the white pill, a 25% inset hairline, and the caret. The top bar's
tint follows the *selected engine* (the icon and placeholder already do), so it is looked
up in `ENGINES` by host at paint time rather than stored on `SE` — a colour persisted in
`localStorage` would mean existing saved engines render untinted until reselected.
Custom engines fall back to neutral `#8b93a1`; DDG is `#e2913f`, pulled toward amber
because true DDG `#de5833` read too red.

**The Claude bar overrides `background` outright rather than mixing its tint in.** It uses
a softened form of Claude's UI bone (`#f6f4ed`, between `#f0eee6` and white) instead of
the logo clay `#d97757`, and a pale beige is invisible at a 6% wash on white — so the mix is bypassed
and `--tint` stays a warm taupe `#9b8b74` purely to keep the inset hairline and the caret
visible against the cream. Anything paler than that taupe makes the caret vanish.

**The Claude bar became a model switcher, mirroring `ENGINES`/`SE`.** `LLMS`/`LM`,
persisted under `llm`, with the same by-host colour lookup and a `Custom...` option.
Two differences from the search bar: the icon goes through `resolve()` rather than the
DDG ip3 service, so it gets `apple-touch-icon` quality and shares `ic:https://<host>`
with any matching tile; and an entry may carry `b` (a full background) for services
whose brand is a pale neutral the 6% tint wash cannot express — Claude's bone is the
only one, applied from JS so switching away clears it.

**Only Claude's URL behaviour is verified.** `claude.ai/new?q=` prefills without sending
(confirmed 2026-08-28). The other four are the widely used custom-search-engine patterns
but were not tested here, and they differ in kind: Perplexity runs the query outright,
ChatGPT and Grok are believed to submit, and Gemini is the doubtful one — it has no
documented prefill parameter and may ignore `?q=` entirely, landing on an empty composer.
Each is one string in `LLMS`; fix them as they are found wrong rather than assuming the
mechanism is broken.

## Setup wizard and profile saving

**Feature flags live in `feat` (`{llm, wx, sol}`), and its absence is the first-run
signal.** No separate "seen the wizard" key — one key means the two can never disagree.
`applyFeat()` toggles `display` inline, so clearing the inline value hands the element
back to its CSS rule (`#sol:empty{display:none}` keeps working). Dismissing a wizard step
leaves that feature on: the default is the behaviour that existed before the wizard.

**`weather()` returns early only when weather *and* the solar countdown are both off.**
One fetch feeds both — sunrise/sunset arrive in the forecast call — so turning off the
weather widget alone must not stop the countdown getting its data.

**Save uses `chrome.downloads` with `saveAs:false`; Save as passes `saveAs:true`.** The
old `<a download>` could not suppress Brave's "Ask where to save each file" setting, so
plain Save opened a file browser. `chrome.downloads.download` overrides that per call,
which is what the `downloads` permission is for. Save now prompts for a name only
(defaulting to `profname`) and writes to the download directory; `.json` is appended if
the user leaves it off, since the prompt asks for a profile name rather than a filename.

**Widget toggles are a panel (`#wp`), not minus badges on the widgets themselves.**
`#wx` and `#sol` are repainted by replacing their `innerHTML`, so any badge appended
inside them is destroyed on the next weather or countdown tick; keeping badges alive
would mean re-appending from inside both paint functions. A single edit-mode panel
bottom-left avoids that entirely and stays readable. `#wp` is in the `closest()` list of
the body handler so clicking it does not exit edit mode.

**Save as passes no filename prompt.** `chrome.downloads.download` with `saveAs:true`
opens the browser's own save dialog — the system file chooser, so Dolphin on KDE and the
native equivalent elsewhere — which already collects the name and the directory. Asking
for a name first would have meant two dialogs for one action. Plain Save keeps its
in-page `ask()` dialog and never browses.

**The edit pencil is drawn as inline SVG.** `&#9998;` (✎) renders as a detailed, hard to
read mark at 38px button size, and varies by installed font. A two-path stroked SVG using
`currentColor` reads clearly and matches the other controls.

## Profiles folder

**Save writes through the File System Access API, not `chrome.downloads`.** An extension
can only ever write inside the browser's download directory via `chrome.downloads` —
absolute paths and `..` are rejected — so "save into the repo" is unreachable that way.
`showDirectoryPicker()` gets a real directory handle; the user picks the folder once and
every later Save writes into it silently. The handle is kept in IndexedDB (`hs`/`kv`/`dir`)
because handles are structured-cloneable but not JSON-serialisable, so `localStorage`
cannot hold one. Permission is re-checked on each use with `queryPermission` and
re-requested if the browser dropped it between sessions — that prompt is a small
permission bar, not a file browser.

**Export is the only write-anywhere path, and Save as is gone.** The two did the same
thing — `chrome.downloads` with `saveAs:true`, opening the OS file browser — so one of
them was redundant. Export survived and now opens the browser (it used to write silently
to the download directory); it remains the escape hatch for an external drive or another
machine's share, which the directory handle deliberately does not cover.

**Select profile is a `<select>`, and Import is a button inside it.** The folder listing
is the fast path for the profiles the user actually keeps; loading one from anywhere else
is the rare case, so it became a Browse button in that dialog instead of a menu entry of
its own. A `dlg()` button row was the wrong shape here — it grows horizontally with the
number of profiles, which a dropdown does not.

**`gemini.google.com` has no URL prefill parameter** — confirmed 2026-08-28, it ignores
`?q=` and lands on an empty composer. The `LLMS` entry now points at Google's AI Mode
(`google.com/search?udm=50&q=`), which is Gemini-backed and does take a query. There is
no URL-only way to prefill the Gemini web app; doing it would need a content script.

**Configuration moved out of the hamburger menu into a tabbed Settings dialog.** The menu
had grown to ten entries by mixing frequent actions with one-off configuration. It now
holds only the four things done regularly — save, select, new, settings — and everything
else lives on a Settings tab (Profiles, Weather, General). Anything new that is configured
once belongs on a tab, not in the menu; that is the rule that keeps the menu short.
Settings rows are built by `srow(title, subtitle, button, fn)` so a new row is one call.

**Profiles are stored in IndexedDB (`prof:<name>`), not in a folder on disk.** There is no
reliable per-OS default directory an extension can preset: a `FileSystemDirectoryHandle`
can only come from the user picking a folder, and no API exposes `%APPDATA%`, `~/.config`
or any XDG path. `chrome.downloads` does resolve the OS download directory without
configuration, but it is write-only — an extension cannot list or read what it wrote —
so Save would work and Select profile would not. IndexedDB needs no configuration, works
identically on every OS, lists instantly, and survives browser restarts without a
permission re-grant. It is used rather than `localStorage` because a profile with icons
embedded runs to ~800 KB and `localStorage` caps near 5 MB.

**The mirror-to-a-folder feature was removed: Brave disables the File System Access API.**
`brave://flags/#file-system-access-api` ships as *Default (Disabled)*, so
`window.showDirectoryPicker` is undefined and no directory handle can ever be obtained.
Requiring users to flip a browser flag is not a shippable dependency, and the flag is off
for a reason — it grants every site the ability to ask for folder access.

Note that this does *not* affect Export, which is often confused with it: Export uses
`chrome.downloads.download({saveAs:true})`, the extension downloads API, which opens the
native save dialog (Dolphin on KDE) for a single file. That is a one-shot hand-off and
works fine. Only the persistent handle needed to write into a folder repeatedly without a
dialog depends on the disabled API. Export remains the way to get a file out on demand. The standing caveat is unchanged — extension storage is
keyed to the extension ID, so loading the extension from a different directory loses the
stored profiles, and Export is the mitigation.

**A profile is the whole configuration, not just the tiles.** It carries `engine`, `llm`,
`feat` and `wxloc` alongside `tiles`, because switching profiles that restored the grid
but left the search engine, AI assistant, widget flags and weather location untouched was
only half a switch — and the new-profile dialog had been promising "tiles and settings"
that Save never actually preserved. Bumped to `v:2`; `v:1` files and bare arrays still
load, with absent fields left as they are, so old exports keep working.

Every writer goes through `snapshot()` and every reader through `applyProfile()` — the
IndexedDB copy and Export cannot drift apart, and `dirty()` compares a
fresh snapshot against the stored one so a settings change counts as unsaved work just as
a moved tile does. The icon cache is deliberately excluded: it is large and rebuilds
itself on demand.

## Dialogs

**No native `prompt()`/`alert()` anywhere in the flows the user sees.** Chromium prefixes
them with "The extension iOS Home Screen New Tab says", which reads as a browser warning
rather than part of the page, and they cannot be worded or styled. `ask()` and `dlg()`
replace them. The + button now says what it is for — "Add a website shortcut to your home
page" — in the dialog and in its `title`, because a bare `+` gave no clue.

**`ask()` returns `null` for cancelled and `''` for deliberately blank.** The add-a-tile
flow needs the difference: leaving the address blank is how a folder is made, so it
cannot be conflated with dismissing the dialog. Existing callers reject both with a
falsy test, so the change was safe.

**`dlg(msg, btns, sel, spot)` cuts a lit hole in the scrim.** `spot` is an element id;
the hole is a `position:fixed` div sized to that element's rect with
`box-shadow: 0 0 0 3px accent, 0 0 0 9999px rgba(0,0,0,.56)` — the huge spread paints the
scrim everywhere except the hole, so no mask or clip-path is needed and the dialog still
centres normally. The wizard uses it to point at the thing each question is about. A
zero-size rect falls back to the plain scrim.

The rect is read inside `requestAnimationFrame`, not while the dialog is being built. The
wizard's first question is created during initial script execution, before layout has
settled, and measuring there put the hole in the wrong place — later questions were
correct because several `await`s had passed by then. The same callback is bound to
`resize`, and unbound when the dialog closes.

`spot` is a CSS selector rather than an element id, because the countdown's id is the
full-width strip `#sol`, not the pill: `#sol .solbox` is the thing worth lighting up.

The dialog needs `position:relative;z-index:1` and the hole `z-index:0`, or the dialog
renders *under* the scrim: a positioned element paints above a static one whatever the DOM
order, and `.dlg` is static inside the flex overlay while `.hole` is `position:fixed`.

**The widget questions paint demo readings when there is no forecast yet.** On a fresh
profile `wxloc` is cleared, so `#wx` would be a bare "Set location" button and `#sol`
empty — nothing to spotlight and nothing to judge the question by. `demoWx()` supplies
plausible values with `ts:0`, which reads as stale so the real fetch still happens, and
they are cleared the moment both questions are answered.

## Publishing

**The wallpapers are Unsplash-licensed and now individually credited.** They came from
Lorem Picsum, whose filenames are the Picsum image ids, so provenance was recoverable
after the fact: `https://picsum.photos/id/<id>/info` returns the photographer and the
original Unsplash URL for each one. `CREDITS.md` is generated from that. Attribution is
not required by the Unsplash License, but a redistributed collection that cannot name
its photographers is not defensible, and stripped EXIF had left no other trail.

`bg/86.jpg` was deleted: Picsum has retired that id and returns "Image does not exist",
so it was the one file whose origin could not be established. Regenerate `bglist.js`
after any such change or the page renders black.

The licence excludes compiling Unsplash photos to replicate a competing service. A
wallpaper set inside a home-screen extension is not that, but it is the clause to
re-read before adding images in bulk.
