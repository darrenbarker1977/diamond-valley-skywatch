# Live target window and routes

Home now offers Find a target directly. Find target contains the actual sky
viewport, not only textual directions beneath other panels. The shared atlas
stage moves into the finder and returns to its original map on exit; there is
one catalogue renderer and one canvas, using the same real positions. The live
viewport is deliberately locked to the aligned phone rather than letting a drag
silently disable follow. Full-map exploration remains available separately.

The target name, crosshair, directional arrow, left/right and raise/lower amounts,
current guard/status and primary next action stay in one window. Its expand and
close buttons are visible at the top. No arrow or measured reticle appears until
the existing real-sample, alignment, freshness and sky guards allow guidance.
An unaligned map is labelled a calculated preview; a stale aligned map is labelled
paused. The arrow indicates motion toward the target, not an identified object
in a video frame. Inside 3 degrees, it instructs the observer to confirm in the
finder. Phone estimates remain coarse and are not telescope encoders.

Optional Rear camera is available only for handheld pointing, whose axis is the
rear camera. It is requested by a user tap, stays local, and uploads/records
nothing. Mounted mode uses the phone top edge along the tube, so camera overlay
is disabled with an explanation. Denied/unavailable/lost camera returns to the
sky viewport and reports the error without discarding sensor alignment. Leaving
Find target, hiding the app, stopping sensors or switching mode stops the video;
a late permission result cannot reopen it. Camera permissions and motion-sensor
permissions remain separate. No image recognition or plate solving is performed.

## Routes

- Home Find a target -> live window -> choose target -> primary setup action.
- Object Find this object, forecast Find now and mission Find now -> same window.
- Window setup action -> the actual missing location, placement, sensor or
  one-object alignment control. The planned destination stays visible in setup.
- Back to target window -> original destination, without stopping working sensors.
- First recorded object -> same live window, with map-follow, safe arrows and
  preferred vibration. Second/third calibration objects remain optional.
- Current target unsuitable -> choose a visible target while retaining alignment.
- Brief sample gap -> waiting status and Resume sensor readings, without forced
  alignment. Actual continuity loss/background/reload retains existing guards.
- Window X -> full sky map; Home/Forecast -> retained valid foreground session.

## Checks

Browser coverage exercises these routes in desktop and Pixel 8-sized layouts,
asserts there is one canvas, moves injected test-only orientation events through
the actual pipeline, checks overlaid arrows and pause states, and covers camera
permission denial, stream loss, navigation cleanup and late permission results.
The existing pointing, forecast, location, mission, compass, equipment, screen-hold
and full-site regression checks continue alongside it. Hardware accuracy and
camera visibility of actual stars still need outdoor testing.
