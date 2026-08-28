# Home Screen New Tab

A Chromium new tab page laid out like a phone home screen: an app grid with real
site icons, a search bar, a clock, weather, a sunrise/sunset countdown, and a second
search bar that sends a question straight to an AI assistant.

No build step, no dependencies, no framework. Three files do the work.

## Install

Not on any store yet — load it unpacked.

1. Clone this repository.
2. Open `chrome://extensions` (`brave://extensions` in Brave).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the repository folder.
5. Open a new tab. A setup wizard runs on first use.

Works on Chromium-based browsers on Linux, macOS and Windows: Brave, Chrome,
Edge, Vivaldi. Firefox and Safari are not supported — it uses `chrome_url_overrides`
and Chromium extension APIs.

> Loading the extension from a different folder changes its ID and resets its
> storage. Export your profile before moving it.

## Wallpapers

`bg/` ships with 63 photographs from [Lorem Picsum](https://picsum.photos), served
under the [Unsplash License](https://unsplash.com/license). Every one is credited to
its photographer in [CREDITS.md](CREDITS.md).

To use your own instead, replace the contents of `bg/` — one image is chosen at
random per tab — and regenerate the list of filenames:

```sh
ls bg | sed 's/.*/"&"/' | paste -sd, - | sed 's/^/const BG=[/; s/$/];/' > bglist.js
```

A stale or empty `bglist.js` renders a black page.

## Using it

- **+** adds a shortcut; leave the address blank to create a folder instead.
- **Pencil** toggles edit mode: delete tiles, rename them, change their URL or icon,
  and switch the weather, countdown and AI bar on or off.
- Drag one tile onto another to make a folder.
- Click either search bar's icon to change the search engine or AI assistant.
  Both accept a custom URL with the query at the end.
- **Hamburger** holds profiles and settings.

## Profiles

A profile is the whole configuration — tiles, search engine, AI assistant, widget
choices and weather location. Profiles are stored in the browser (IndexedDB), so
there is no folder to configure. **Settings → Profiles → Export** writes one out as
JSON, which is also how you move a profile between machines or back it up.

## Privacy

Everything is stored locally. There is no account, no telemetry and no server of
ours. Three third parties are contacted, all directly by your browser:

| Who | When | What they receive |
|---|---|---|
| `icons.duckduckgo.com` | A tile has no icon cached | The hostname of that site |
| The sites themselves | Icon lookup | A request for `/apple-touch-icon.png` |
| `open-meteo.com` | Weather is enabled | The coordinates you chose |

Icons are cached after the first fetch, so the lookups do not repeat. Weather is
cached for 30 minutes. Clear the icon cache under **Settings → General**.

Your location is set explicitly by name — the extension never asks the browser for
your position.

### Permissions

| Permission | Why |
|---|---|
| `favicon` | Read the browser's own favicon cache, the last resort for a tile icon |
| `downloads` | Write an exported profile without the browser prompting for a folder |
| `https://*/*`, `http://*/*` | Fetch and cache site icons from any site you add, including LAN services on plain HTTP |

The host permissions are broad because a tile can point anywhere. They are used
only to fetch icons.

## Development

There is no test suite and nothing to build. Edit the files, hit the reload button
on `chrome://extensions`, and open a new tab. Errors appear in DevTools on the new
tab page. `manifest.json` changes need that reload; HTML, CSS and JS changes only
need a new tab.

- `manifest.json` — MV3 manifest.
- `newtab.html` — markup and all CSS.
- `newtab.js` — all logic.
- `bglist.js` — generated list of wallpaper filenames.

`DECISIONS.md` records why things are the way they are, including several
constraints that look arbitrary but are not. Read it before changing them.

## Licence

MIT — see [LICENSE](LICENSE).

The MIT licence covers the code. The wallpapers in `bg/` are not ours and are not
MIT — they are Unsplash-licensed photographs, credited individually in
[CREDITS.md](CREDITS.md). Product names and logos belong to their owners; no
third-party logo is bundled here, they are fetched from the sites themselves at
runtime and cached locally.
