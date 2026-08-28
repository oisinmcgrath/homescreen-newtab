# Chrome Web Store listing — Home Screen New Tab

Everything below is copy to paste into the Developer Dashboard. Nothing here ships
in the package.

**Account:** oisin.mcgrath.dev@gmail.com — 2-Step Verification must be enabled on it
before publishing, or the dashboard will not let you submit.

**Upload:** `store/homescreen-newtab.zip` (18 MB — the wallpapers are 63 of it).

---

## Name

    Home Screen New Tab

## Short description (132 character limit)

    A new tab page laid out like a phone home screen: an app grid you arrange yourself, with weather, sun times and an assistant bar.

## Category

Workflow & Planning

## Language

English (Australia)

---

## Detailed description

    Home Screen replaces the new tab page with a grid of shortcuts you add yourself,
    over a wallpaper picked at random from the 63 that ship with it.

    Tiles stay where you put them. Nothing is ranked by how often you visit, and
    nothing rearranges itself. Drag one tile onto another to make a folder.

    Each tile shows the site's own icon, taken from the site's apple-touch-icon
    where it has one, and cached after the first fetch so it is never requested
    again. You can upload your own icon instead, and it will be trimmed and squared
    automatically.

    Around the grid: a clock, a weather block, a countdown to the next sunrise or
    sunset, and a battery readout. Each is optional — a short setup wizard asks
    which you want, and you can change your mind later in edit mode.

    A search bar sits at the top and can point at DuckDuckGo, Google, Brave, Bing,
    Startpage, Wikipedia or a custom URL. A second bar at the bottom sends a question
    to Claude, ChatGPT, Google AI Mode, Grok, Perplexity or a custom URL.

    Everything is saved as a profile — tiles, icons, search engine, assistant, widget
    choices and weather location — which you can name, switch between, and export as
    a JSON file.

    No account, no telemetry, no server. Everything is stored in your own browser.
    Weather comes from Open-Meteo using a location you choose by name, so the
    extension never asks where you are. Access to websites is optional and is
    requested only if you want tiles to show real site icons; decline it and the
    extension makes no network requests for icons at all.

    Free and open source under the MIT License:
    https://github.com/oisinmcgrath/homescreen-newtab

---

## Single purpose

    The extension's single purpose is to replace the browser's new tab page with a
    grid of shortcuts the user arranges themselves, together with the clock, weather,
    sunrise/sunset and search widgets shown on that page.

## Permission justifications

**`favicon`**

    Reads the icon the browser has already cached for a site the user has added as a
    tile. It is the final fallback when the site's own icon cannot be retrieved. The
    lookup is entirely local and sends nothing to any server.

**`downloads`**

    Writes the user's exported profile to their download folder without prompting for
    a location on every export. It is used only to save that one JSON file, and never
    reads or modifies existing downloads.

**Host permissions — `https://*/*` and `http://*/*` (optional)**

    Not requested at install. The extension asks for this only if the user agrees,
    from the setup wizard or from its Settings page, and uses it solely to fetch a
    site's apple-touch-icon or favicon so that a tile can display that site's real
    icon. The pattern is broad because a tile may point at any address the user
    chooses, including a device on their own local network served over plain HTTP,
    and the extension cannot know those addresses in advance. If the user declines,
    the extension makes no network requests for icons and falls back to the browser's
    cached favicon, then to a letter. No page content is read, and no content scripts
    are injected into any site.

**Remote code**

    No. All code is contained in the package. The extension loads no external
    scripts and evaluates no remote code.

## Data usage disclosures

Tick **Location**, and nothing else.

Weather sends the coordinates of the city the user picked to open-meteo.com, which
is location data leaving the device to a third party. It is coarse and user-chosen,
but it falls inside Google's definition, and under-disclosing is what gets a listing
rejected. Leave the rest unticked: no personally identifiable information, health,
financial, authentication, personal communications, web history, user activity or
website content.

Certify all three:

- Data is not sold or transferred to third parties, outside of approved use cases
- Data is not used or transferred for purposes unrelated to the item's single purpose
- Data is not used or transferred to determine creditworthiness or for lending purposes

## Privacy policy URL

    https://oisinmcgrath.com/projects/homescreen/privacy

Cloudflare Pages strips `.html`, so the `.html` form 308-redirects here. Give the
store the clean URL above so the policy resolves without a redirect.

## Homepage URL

    https://oisinmcgrath.com/projects/homescreen/

## Support URL

    https://github.com/oisinmcgrath/homescreen-newtab/issues

---

## Graphical assets

| Asset | Requirement | File |
|---|---|---|
| Icon | 128×128 | `icon128.png` |
| Screenshot 1 | 1280×800 | `store/01-home-screen.png` |
| Screenshot 2 | 1280×800 | `store/02-edit-mode.png` |
| Screenshot 3 | 1280×800 | `store/03-wizard.png` |
| Small promo tile | 440×280 | `store/promo-440x280.png` |
| Marquee | 1400×560, optional | not made |

---

## Known review risks

1. **New tab overrides get extra scrutiny.** They are a known abuse category, so
   expect the review to take longer than a trivial extension's. The single-purpose
   statement above is the thing that answers it.
2. **Broad host access, even optional.** Reviewers may still query it. The
   justification above is the answer: it is optional, consent-gated, icon-only, and
   the extension degrades cleanly without it.
3. **Publication limit.** As of 2026 accounts start with a baseline of two extension
   slots. If you hit it, request an increase from the dashboard — responses are
   usually immediate.
