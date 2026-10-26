# Diamond Valley Skywatch

Permanent site: https://darrenbarker1977.github.io/diamond-valley-skywatch/

The root index.html is the compact Home / Forecast / Navigator interface.
The original self-contained weather page is preserved byte-for-byte as
forecast.html (Git blob b1c3ee54aad313c84e1e958bbc577851f61e5be2).
Navigator assets are in prototype/ and the permanent entry loads those shared
modules. The Forecast view retains its frame across menu changes so selected
nights, refresh listeners and weather state persist. No Pages URL or existing
root shortcut changes are needed.

Run python3 -m http.server 8000 to preview locally; open / for the permanent
entry, or /prototype/ for the separate development entry. Sensors need HTTPS
on the phone, or localhost on the machine serving the site. See
prototype/README.md and docs/pixel-8-field-check.md for equipment, alignment
and test details. Phone-derived guidance remains experimental and must be
checked on the real Pixel 8 / Sky-Watcher 250P; it is not encoder telemetry.

The owner authorized permanent publication and ongoing live updates on
2026-10-26. Continue using branches and pull requests for reviewable changes.
The private test Site remains a separate staging environment.
