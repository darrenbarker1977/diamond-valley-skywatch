# Live guidance without the setup loop

A valid foreground pointing session now survives Home and Forecast navigation
inside this app. These views close the camera, but no longer stop the orientation
listener or discard alignment. Home shows a small session card with Continue and
Stop actions only while a session exists. No alignment is stored across reloads.

Sensor permission and alignment are separate steps. Pointing supplies a Next
action for physical presence, mounted placement, sensors, daylight planning or
recording one positively identified bright object. Recording succeeds only with
the existing stable-sample and sky eligibility checks. Success publishes the
alignment first, then opens Find it automatically, enables map-follow and starts
vibration when supported and allowed by the saved preference. A previous target
is retained if suitable now; otherwise the recorded object becomes the current
destination with an explanation and a visible-target picker. Second/third objects
remain optional refinements, not prerequisites.

Finder distinguishes sensors-only from alignment retained but temporarily paused.
Below-horizon targets, unsafe Sun separation, overhead directions, stale readings,
noise and missing alignment have separate messages. Arrows and haptics share a
smooth-motion check on actual fresh samples (at least three within 400 ms,
segments at most 90 degrees/second, zigzag excess at most 2 degrees). Capturing
alignment still needs a steady one-second hold. No position is extrapolated from
missing samples. Map-follow can use a fresh measured aligned pose while arrows
pause; manual map exploration can still stop follow.

Vibration off is saved as dvsky:vibration:auto:v1 and respected on target changes,
internal navigation and subsequent alignments. It never implies saved calibration.
Unsupported/refused vibration reports that state. Backgrounding, pagehide, screen
rotation, location/mode/placement changes, continuity failures and the existing
20-minute expiry still invalidate alignment. Stop remains explicit on Home and
in Pointing/Find it. Compass heading alone never unlocks guidance.

## Regression coverage

The pointing browser suite covers foreground Home/Forecast continuity in handheld
and mounted modes, permission without alignment, automatic first-target guidance,
unsuitable destination replacement, retained-alignment pause messages, smooth
movement, camera-to-guidance handoff, saved vibration-off and actual background
invalidation. Existing weather, location, equipment, map, readiness, compass,
mission, help and screen-awake suites run alongside it.

Development fixtures emit synthetic sensor/camera events only in tests. Physical
Pixel 8 accuracy, browser permission prompts and tube interference still require
an outdoor check; tests do not certify telescope pointing accuracy.
