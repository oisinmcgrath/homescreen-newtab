# Home Screen

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**A browser new tab page laid out like a phone home screen — an app grid you arrange yourself, with real site icons, weather, a sunrise countdown, and a bar that sends a question straight to an AI assistant.** No build step, no dependencies, no framework: three files and a folder of wallpapers.

<p align="center">
  <img src="icon128.png" alt="Home Screen logo" width="120" />
</p>

## Why

The default new tab page is a grid of whatever you happened to visit most last week. It rearranges itself without being asked, shows sites you would rather it didn't, and offers no way to say *these nine things, in this order, permanently*.

A phone home screen has been solving that for fifteen years: you put things where you want them, and they stay there. This is that, in a browser tab.

### A grid you arrange yourself

Tiles are added by hand and stay put. Drag one onto another to make a folder, drag into a folder to fill it. Nothing is ranked by visit count and nothing moves on its own.

Icons are the part that usually goes wrong — most new tab replacements give you a coloured square with a letter in it. This one works down a chain:

1. A custom icon, if you uploaded one
2. The site's own `/apple-touch-icon.png`
3. DuckDuckGo's icon service
4. The browser's own favicon cache
5. The first letter of the name

Whatever it finds is cached locally as a data URL, so each site is looked up once and never again. Uploaded icons are trimmed automatically: transparent margins are scanned away with a noise floor, then the artwork is scaled into a square. That noise floor exists because several downloaded logos turned out to carry faint opaque speckles across the whole canvas, which defeats an ordinary trim.

### Weather, sun and battery — optional

A weather block, a countdown to the next sunrise or sunset, and a battery readout sit around the grid. A setup wizard asks which you want the first time you open a tab, and each can be toggled later from edit mode. Turning one off removes it rather than hiding it — the forecast is not fetched at all if nothing needs it.

Weather comes from [Open-Meteo](https://open-meteo.com): no key, no signup, cached for thirty minutes. The location is chosen by name from a search box, never by asking the browser where you are — behind a VPN that answer is wrong, and it is a permission worth not requesting.

### A second bar for asking a question

The bar along the bottom takes a question and opens it in Claude, ChatGPT, Google AI Mode, Grok or Perplexity — or anything else you give a URL for. Click its icon to change where it goes, the same way the search bar works.

One deliberate limitation, because it looks like a bug: your question is placed in the assistant's composer and you press enter once more to send it. Anthropic's site shows a warning when a prompt arrives from outside the chat box and requires that confirmation, because a link can otherwise put words in your mouth and have an assistant act on them. Defeating that guard would save one keystroke and cost a real protection, so this leaves it alone.

## Install

Not on any store — load it unpacked.

1. Clone this repository.
2. Open `chrome://extensions`, or `brave://extensions` in Brave.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the repository folder.
5. Open a new tab. A setup wizard runs on first use.

Works on Chromium browsers on Linux, macOS and Windows — Brave, Chrome, Edge, Vivaldi. Firefox and Safari are not supported; it uses `chrome_url_overrides` and Chromium extension APIs.

> Loading the extension from a different folder changes its ID and clears its storage. Export your profile before moving it.

## Using it

- **+** adds a shortcut. Leave the address blank to create a folder instead.
- **Pencil** toggles edit mode: delete tiles, rename them, change a URL or icon, and switch the weather, countdown and assistant bar on or off.
- Drag one tile onto another to make a folder.
- Click either search bar's icon to change the search engine or assistant. Both accept a custom URL with the query at the end.
- **Hamburger** holds profiles and settings.

## Profiles

A profile is the whole configuration — tiles, icons, search engine, assistant, widget choices and weather location — saved under a name and switched from the menu. Profiles live in the browser, so there is no folder to choose and nothing to set up before the first save. **Settings → Profiles → Export** writes one out as JSON, which is how you back one up or move it to another machine.

## Privacy

No account, no telemetry, no server. Everything is stored locally in the browser. Three parties are contacted, all directly by your browser and only when there is something to fetch:

| Who | When | What they receive |
|---|---|---|
| The site itself | A tile has no icon cached | A request for its `apple-touch-icon.png` |
| `icons.duckduckgo.com` | That request failed | The hostname of that site |
| `open-meteo.com` | Weather is switched on | The coordinates you chose |

Icons are cached after the first fetch, so the lookups do not repeat; weather is cached for thirty minutes. Clear the icon cache under **Settings → General**.

DuckDuckGo was chosen over Google's equivalent icon service on privacy grounds, accepting lower-resolution icons in exchange. Both would learn the same hostnames; only one is in the advertising business.

### Permissions

| Permission | Why |
|---|---|
| `favicon` | Read the browser's own favicon cache — the last resort for a tile icon |
| `downloads` | Write an exported profile without the browser prompting for a folder |
| `https://*/*`, `http://*/*` | Fetch and cache icons from any site you add, including LAN services on plain HTTP |

The host permissions are broad because a tile can point anywhere. They are used only to fetch icons.

## Wallpapers

`bg/` ships with 63 photographs from [Lorem Picsum](https://picsum.photos), served under the [Unsplash License](https://unsplash.com/license). Every one is credited to its photographer in [CREDITS.md](CREDITS.md).

To use your own, replace the contents of `bg/` — one image is chosen at random per tab — and regenerate the list of filenames:

```sh
ls bg | sed 's/.*/"&"/' | paste -sd, - | sed 's/^/const BG=[/; s/$/];/' > bglist.js
```

A stale or empty `bglist.js` renders a black page.

## How it is built

A new tab is opened dozens of times a day, so it has to paint immediately — which rules out a startup cost of any kind. There is no framework, no bundler and no package manager; what is in the repo is what runs.

```
manifest.json    MV3 manifest
newtab.html      markup and all the CSS
newtab.js        all the logic
bglist.js        generated list of wallpaper filenames
bg/              wallpapers
```

Editing is: change a file, hit reload on `chrome://extensions`, open a new tab. Errors appear in DevTools on the new tab page. Only `manifest.json` changes need that reload — HTML, CSS and JS are picked up by opening a tab. There is no test suite.

[`DECISIONS.md`](DECISIONS.md) records why things are the way they are, including several constraints that look arbitrary and are not — why inline `<script>` is impossible here, why `img.crossOrigin` must never be set, why layout is derived from the search bar's geometry rather than fixed pixels. Read it before changing them.

## Contributing

Issues and pull requests are welcome — this started as a personal tool and is shared in case it is useful to someone else.

## License

MIT. See [`LICENSE`](LICENSE).

The MIT licence covers the code. The wallpapers in `bg/` are Unsplash-licensed photographs, credited individually in [CREDITS.md](CREDITS.md). Product names and logos belong to their owners; none is bundled here — they are fetched from the sites themselves at runtime and cached locally.
