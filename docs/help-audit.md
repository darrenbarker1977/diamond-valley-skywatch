# Help and recovery audit

Reviewed the active Home, Forecast and Navigator pages, their location, catalogue,
map, Finder, pointing/camera, telescope kit, tour and Skywatch panels, plus the
outdoor and installation guides. Static internal file links on all five active
HTML pages resolve inside the repository. The archived original forecast remains
unchanged.

## Corrected gaps

- The outdoor guide returned to the GitHub account root and described an obsolete
  three-object requirement. It now returns to this site, links into actual
  Navigator sections and explains one-target basic alignment, optional refinement,
  handheld rear-camera aiming, mounted top-edge aiming, permissions and offline use.
- Finder and star-hop panels had separate vibration owners. The chart control now
  opens the shared vibration settings; it cannot cancel or contradict one-target
  guidance. Charts still require user identification of their named markers.
- Empty searches can clear filters or open the planning controls. Unavailable live
  targets, empty target pickers, missing/invalid fitted eyepieces, invalid telescope
  settings and empty tours have compact routes to their real controls.
- GPS and place-search failures link to coordinate entry without replacing the
  previous site or requesting permission implicitly. Sensor/camera help is folded;
  camera-free aiming remains available. A missing map or sky calculation offers
  reload, catalogue and forecast routes without substituting sky/pointing data.
- Skywatch feed failures offer an explicit retry and time/date controls. Explicit
  retries bypass freshness TTLs but preserve honest cached/offline fallback and
  the existing freshness/validation rules. Automatic refreshes still deduplicate
  requests and use valid cache entries. Explicit Refresh open panels intentionally
  requests new data for the open feeds.
- Forecast help routes to the original refresh control or the app's site/catalogue
  controls. Embedded messages require the same origin and actual forecast-frame
  source, and only whitelisted help actions are accepted.
- A failed lunar photograph hides its SVG and displays the existing unavailable
  label. Failed solar-system calculations clear the previous phase/rise/set display.

## Kept intact

The shared header, brand art, main menu, permanent URL, forecast fetch/refresh code,
location persistence, telescope inventory, target ranking, astronomical positions,
pointing measurements and alignment guards are preserved. No recovery action
confirms presence, strap placement or target identity for the user. Daylight,
invalid/stale sensors, Sun separation and calibration loss still block guidance.
Reference photographs stay available and eyepiece appearance hints remain optional.
Longer help uses native folded disclosures; no onboarding wizard blocks browsing.

## Verification

Browser regressions exercise actual destinations and focus, empty-result recovery,
invalid kit and duration controls, GPS denial fallback, guide deep links, the single
vibration owner, explicit feed retry after a cached invalid result, map-download
failure and the embedded forecast bridge. The CI gate also covers the existing
pointing, camera, compass, atlas, equipment, tour, weather, screen-hold and shared
navigation suites on desktop and Pixel-sized layouts. Hardware sensor accuracy
and external providers' ongoing availability are not established by browser tests.
