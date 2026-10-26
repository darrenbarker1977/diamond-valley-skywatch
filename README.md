# Barker After Dark

Location-aware stargazing · Good skies. Better nights.

Permanent site: https://darrenbarker1977.github.io/diamond-valley-skywatch/

The root index.html is the compact Home / Forecast / Navigator interface.
The original weather document is preserved byte-for-byte as
forecast-original.html (Git blob b1c3ee54aad313c84e1e958bbc577851f61e5be2).
Navigator assets are in prototype/ and the permanent entry loads those shared
modules. forecast.html now accepts validated location parameters and resolves timezone
through Open-Meteo, while retaining existing weather features. The Forecast view
retains its frame across menu changes so selected
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

## Locations and offline preparation

Home offers a user-initiated high-accuracy browser location fix, worldwide place
search (Open-Meteo geocoding / GeoNames), or latitude/longitude entry for remote
places. Heading, sky observer, alignment suggestions and forecast coordinates
follow the selected site. Weather timezone is resolved by Open-Meteo; named
search sites use the supplied IANA timezone for sky-clock display. Manually
entered coordinates use UTC until a forecast supplies the local timezone.

The last site is saved on that browser, restored without another permission
prompt, and retained if a new request fails. GPS accuracy is reported as given,
not guaranteed. Saved and remotely selected sites require explicit confirmation
of physical presence before sensor guidance. Location changes always clear
alignment and stop camera/sensors. No continuous location tracking is used.

A service worker caches the page and static astronomy assets for offline loading.
Before leaving service, select the destination, wait for offline preparation,
and open Forecast online. Downloaded weather is kept separately for each
coordinate location; offline UI identifies it as cached/stale and only shows
remaining forecast dates. No new weather or new named-place lookups are possible
offline. Manual coordinates and astronomical calculations work offline. Browser
cache eviction, private mode or clearing site data can remove offline readiness.
Equipment and saved sites remain per browser/device rather than account-synced.
