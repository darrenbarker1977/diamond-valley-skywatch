# Skywatch Navigator implementation proposal

## Inspection and entry-file decision

Inspected main at 53267c02f621024f9176ca86aa4936370a210544 on 2026-10-26.
The complete repository tree contains README.md and index.html; there is no
index-1.html, AGENTS.md, build configuration, test suite, or checked-in workflow.
index.html already exists (162,732 bytes; Git blob
b1c3ee54aad313c84e1e958bbc577851f61e5be2). No restoration is necessary.
The forecast implementation is present; this inspection does not constitute
an end-to-end live API or Pixel hardware test.

This proposal changes documentation only. Preserve index.html byte for byte
in this PR. Do not merge, deploy, change Pages settings, enable auto-merge,
change domains, add redirects, or replace the existing home-screen shortcut.
The existing GitHub Pages URL and entry point must stay the same.

## Existing behavior to preserve

The single HTML file contains embedded styles, images, markup, and JavaScript.
It uses latitude 50.68, longitude -114.25 and America/Edmonton.
Open-Meteo requests six forecast days to display five local evenings,
6 PM through midnight, using hourly temperature, humidity, dew point,
total/low/mid/high cloud, wind, gusts, precipitation probability, snowfall,
visibility and weather code. Preserve the current verdicts, observing windows,
five selectable day cards, all weather tiles, hourly chart, target suggestions,
Moon information, dated events, explanatory notices, images and visual styling.

Preserve manual refresh, initial load, 30-minute refresh, day rollover,
visibility/pageshow/focus/online refresh paths, request timeout, concurrency
guard, 12-hour cached fallback, stale/error reporting, and selected-date retention.
Keep all NASA, Stellarium, Environment Canada, Open-Meteo and ISS links,
including dynamically selected event links. Keep the existing approximate
astronomy calculations unchanged for the weather page.

## Incremental development

1. Establish a baseline before UI work: capture desktop and Pixel-width
   screenshots, existing link destinations, DOM behavior and weather results
   using deterministic Open-Meteo fixtures. Record success, incomplete response,
   timeout, offline/cache, manual refresh, return-to-app and date rollover cases.
   Do not change the live entry file to establish the baseline.
2. Build the Navigator on a separate feature branch, initially in an isolated
   preview entry point with its own assets. Preview locally or on a separately
   approved non-production host; do not publish experimental files to Pages.
   Use scoped CSS and module state with a dv-nav prefix. Never intercept or
   replace weather globals, storage keys, listeners, timers or rendering.
   Load failure must leave the forecast usable.
3. Add a polished floating telescope button and expandable panel: compact
   bottom sheet on Pixel 8, expanded sky view, clear search, target details,
   mode selector, sensor status and close control. Respect safe areas, keyboard,
   touch target sizes, focus management, Escape, reduced motion and screen
   reader labels. Place the button so it does not cover existing controls/links.
4. Deliver object search and independently validated sky positions first.
   Then implement handheld sensing and calibration, followed by mounted
   guidance. Each stage gets its own reviewable commit/PR and validation.
5. Integrate into the permanent index.html only after baseline comparisons
   demonstrate preservation. Seek explicit approval before merge/deployment.
   Keep the Pages path and Chrome shortcut target unchanged. Rollback is a
   revert of the integration commit.

## Astronomical positions and search

Use a vetted, pinned, locally served astronomy library (evaluate Astronomy
Engine and its license) for topocentric Sun/Moon/planet positions and time
handling. Use a documented, licensed star/deep-sky catalogue with stable IDs,
aliases, RA/Dec epochs and proper motion where available. Support common
names and Messier/NGC aliases. Do not present the current eight-item STARS
array as a complete catalogue or repurpose approximate forecast calculations
as precision telescope guidance.

Default to the existing Diamond Valley coordinates, visibly labelled; allow
an observing-site override or opt-in geolocation without changing the forecast
location. Show observer location, calculation time, altitude, true-north
azimuth, horizon visibility and units. Use UTC internally and America/Edmonton
for local display. Document precession, topocentric corrections, refraction
assumptions and near-horizon limitations. Search may include below-horizon
objects but must label them and suppress misleading observing guidance.
Validate against independent trusted ephemerides (for example JPL Horizons)
and Stellarium for multiple dates, horizons, quadrants, DST transitions and
azimuth wraparound. Set and document tolerances before acceptance; distinguish
calculation accuracy from much poorer phone pointing accuracy.

## Handheld Pixel 8 mode

Start sensors only after the user taps Enable sensors in HTTPS context.
Feature-detect available browser APIs; request permissions where required
from a user gesture, and handle denied, unavailable, no-event and insecure
context cases distinctly. Do not assume Chrome exposes a reliable absolute
heading or sensor accuracy field. Prefer a verified Earth-referenced
orientation source; relative orientation alone cannot establish north.

Convert device orientation into an explicit camera/screen pointing axis,
including portrait/landscape rotation. Define true versus magnetic north;
if necessary use a dated geomagnetic model or measured star calibration.
Do not silently interpret magnetic heading as true north. Smooth genuine
measurements without hiding their age. Handle null, invalid and stale values,
screen rotation, suspension/resume and sensor loss. Stop listeners when no
longer needed; invalidate stale alignment after interruption or mount changes.
Object positions may remain available when sensors are disabled, with no
invented pointing values.

## Sky-Watcher 250P Dobsonian mounted mode

A stock manual Dobsonian supplies no electronic pointing telemetry.
Mounted guidance can estimate its optical axis only when the phone is
rigidly attached and a measured alignment establishes the phone-to-tube
transform. A phone held in the hand cannot report the telescope's pointing.
Label all output as phone-derived pointing estimates, never encoder readings
or verified eyepiece centering.

Provide a mount-axis setup and two well-separated known-star alignment:
the user actually centers each identified star in the eyepiece and records
a fresh valid sensor sample at its calculated location/time. Solve a 3D
rotation for the phone-to-optical-axis relation; reject degenerate geometry,
poor residuals and insufficient samples. Validate on an independent third
star and show residual error. Explain level/base stability, rigid attachment,
magnet/steel-tube interference and figure-eight magnetometer calibration.
Treat calibration instructions as a procedure, not proof of success.

Show signed altitude and shortest-path azimuth arrows only after valid
alignment and fresh absolute sensor readings. Address the zenith singularity,
unstable/noisy headings, below-horizon targets and practical mount limits.
Make thresholds and uncertainty explicit; use a neutral within-estimate
state rather than claiming that the target is centered. Recalibrate after
the phone slips, attachment changes, interference or failed validation.
If adequate accuracy cannot be demonstrated on the actual mounted Pixel 8,
report guidance unavailable and retain target coordinates. Investigate actual
Dobsonian encoders as a future alternative rather than fabricate readings.
No motor-control or automatic slewing is proposed.

## Night vision and errors

Provide an explicit red night-vision on/off toggle, scoped to Navigator
initially, with dim red surfaces, labels, arrows and focus indicators.
Avoid bright transitions, bright imagery and uncontrolled error/toast colors.
Offer an independently reviewed page-wide red theme only as an opt-in,
preserving the default forecast appearance. Browser chrome and Android
system brightness remain outside web-page control; explain manual dimming.

Use explicit states: disabled, permission needed, denied, unsupported,
waiting, calibrating, aligned, stale and unreliable. Show actionable errors
and calibration quality separately from weather status. Never substitute
zeros, random values, catalogue coordinates, old samples or a demo animation
for current measured pointing. Synthetic input belongs only in labelled
development tests. Keep location/sensor data local unless a later approved
feature requires otherwise.

## Acceptance and release gates

- Compare baseline forecast screenshots, values, all links and refresh/cache
  behavior before and after integration, including weather failure with the
  Navigator open and Navigator failure while the forecast refreshes.
- Test independent astronomy fixtures and orientation/mount transforms,
  true/magnetic heading, screen rotation, 359-to-0 wrap, near zenith, stale
  samples, invalid data, denial, no events and alignment rejection.
- Test on the actual Pixel 8 in Chrome and through the existing home-screen
  shortcut, both handheld and rigidly mounted to the 250P. Measure alignment
  residuals and third-star errors across the sky; a desktop simulator cannot
  certify sensor performance or steel-tube interference.
- Review accessibility, touch layout, battery/listener lifecycle, red mode,
  offline behavior and no unintended weather requests or global CSS changes.
- Keep experimental work unmerged until the owner approves the concrete PR.
  No production deployment or Pages configuration change is authorized.
