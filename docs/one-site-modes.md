# One public website, three experiences

The permanent GitHub Pages URL and installed PWA are unchanged. Home now offers Browse & plan, Handheld and Telescope. The same mode selector is available inside Navigator. Browsing is the default for any fresh device; an existing readiness preference is respected. Selection persists locally, independently of location, eyepieces and observations. Shared links contain no personal coordinates or preferences.

Browse opens the sky catalogue/map directly and target links open the selected object without forcing calibration. Forecast, location search, date/time planning, tours, equipment and sightings remain available. Desktop browsing uses the wider existing Navigator layout. All pointing tools remain reachable, with a compact explanation and quick Handheld/Telescope choices rather than a mandatory sensor checklist.

Handheld and Telescope reuse the existing controls and calibration code. Selecting a mode does not enable pointing sensors, request camera/GPS access, assert physical presence or restore an alignment. Placement changes still clear alignment; Telescope requires the mounting confirmation. Explicit pointing actions enter the setup flow. Returning to Browse stops pointing, exits camera/Scope and practice, and returns to manual exploration. The independent phone compass keeps its existing setting.

The readiness purpose, experience selector and physical placement selector stay synchronized. Existing permission handling, one-object alignment, optional extra targets, daylight safety and fresh-reading requirements remain in place. Capabilities are reported as API availability, not proof of hardware or permission. Computers without heading data use north on the map; no synthetic compass or telescope readings are supplied. Camera and vibration are optional and their limitations are explained.

Home preferences contain a Copy website link control with a selectable-link fallback. It works without an account or installation and copies the clean root URL, including when the current page has a private location in its query string.

Validation includes mode persistence, fresh/legacy preferences, browser APIs missing or blocked, deep target/tour links, no automatic pointing activation, synchronization, public sharing and the complete original regression suite. Development sensor fixtures remain restricted to tests; actual Pixel and mounted alignment precision require an outdoor check.
