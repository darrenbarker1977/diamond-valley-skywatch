# Compact panels

Home, Forecast and Navigator use native details/summary controls. Summaries can
be operated with touch, Enter or Space, without custom tap handlers. Existing
colours, borders, artwork and the shared header are retained.

- Home location controls can fold while the selected location stays visible in
  the summary. Viewing preferences and installation help start closed.
- The sky map's existing decorative title is its folding handle. Search and
  target selection remain available while the map is closed. Show on sky map,
  Preview this sky, star-hop map actions and Back to the sky reopen it explicitly.
  Ordinary target changes and periodic sky refreshes respect a closed map.
- Tour duration can fold while the selected hours/minutes stay in its summary.
  Reopening uses the same duration and does not restart the observing session.
- Telescope settings/kit notes and Add an eyepiece start closed. Owned eyepieces,
  saved status and errors remain outside those secondary panels.
- Pointing accuracy notes and compass startup help can fold. Daylight notices,
  current sensor status, measured readings, recording confirmation, permission
  errors, Stop controls in the active finder and direction arrows remain visible.
  Phone setup no longer reopens on every routine paint when sensors are off.
  An explicit interruption/Stop can expose setup once so the next step is clear.
- Forecast's hourly cloud outlook can fold independently, alongside its existing
  atmosphere, targets, events and reference panels. Refresh and night changes do
  not rebuild the disclosure or discard its open/closed state.

New disclosure states remain in the existing DOM during refreshes and navigation;
this does not add cross-reload storage. Camera preview retains its explicit
stop-on-close behaviour. Closing a visual/reference panel does not stop the live
compass or invalidate telescope alignment. Existing source/model restrictions
and one-target/optional-refinement calibration are unchanged.

Forecast changes are confined to the hourly chart's HTML wrapper: all script
blocks are byte-for-byte unchanged. forecast-original.html remains untouched.
