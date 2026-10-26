# Skywatch Navigator — isolated prototype

This directory is a standalone, unmerged prototype. It does not inject scripts,
styles, sensors or controls into the permanent forecast. Root `index.html` must
retain Git blob `b1c3ee54aad313c84e1e958bbc577851f61e5be2`.
Do not merge or deploy this branch to GitHub Pages without the owner's approval.
The existing Pages URL and Chrome shortcut remain unchanged.

## Preview locally

From the repository root, run `python3 -m http.server 8000`, then open
http://localhost:8000/prototype/ and tap **Sky Navigator**. No build, CDN or API
key is needed to run the prototype. Serve over HTTP; ES modules will not work
reliably when opening the HTML directly as a file. No preview hosting is created
by this PR. The forecast link opens the unchanged root page, which still uses
Open-Meteo normally.

The modal offers a compact/expanded layout, an accessible telescope launcher,
search by names and aliases, an above-horizon filter, a geometric sky map,
live target coordinates and an on/off red theme. The map is fixed north-up,
east-right: it is a horizon diagram, not an overhead planetarium projection,
phone camera or orientation view. Selected objects below the horizon remain
in the detail card with a clear label and are omitted from the map.

The catalogue contains 21 curated objects, not all astronomical objects.
The current clock drives calculations every ten seconds while the panel is
open and visible. Reopening/resuming recalculates immediately. Close stops
the timer. Night mode applies to this preview only and resets on reload.
Browser chrome, Android dialogs and physical screen brightness are not
controlled by the web page; lower device brightness manually.

## Position calculations and provenance

- Astronomy Engine **2.1.19** is pinned and vendored from its npm package as
  `vendor/astronomy.browser.min.js`. Its embedded MIT license is retained.
  Upstream: https://github.com/cosinekitty/astronomy . This is the same code
  installed as a development dependency for tests. No runtime network request
  is required for astronomical calculations.
- Solar-system targets use topocentric equatorial coordinates of date,
  including aberration, then geometric altitude and true-north azimuth.
- Fixed objects use rounded J2000 RA/Dec, rotated for precession/nutation to
  the observation date. Proper motion and annual stellar aberration are not
  applied. These are exploration coordinates, not alignment standards.
- The small fixed-object list uses commonly published catalogue centres and
  SIMBAD J2000 coordinates, rounded in `catalogue.js`. Reference lookup:
  https://simbad.cds.unistra.fr/simbad/sim-fid . Extended clusters do not have
  a uniquely useful eyepiece centre; Double Cluster is plotted at NGC 869.
  This is a hand-curated subset, not an imported SIMBAD database dump.
- Observer: **50.68 N, -114.25 E, 0 m**, matching the forecast's rounded
  Diamond Valley coordinates. Height is an explicit placeholder, not a
  measured local elevation. There is no geolocation request or location
  override in this stage. Display time is America/Edmonton; calculations
  use JavaScript UTC instants. Results are rounded to 0.1 degree.
- Atmospheric refraction, terrain, obstructions and daylight visibility are
  not modelled. “Above horizon” alone does not mean an object is observable.
  Clock accuracy and catalogue rounding limit practical accuracy. No claim
  of eyepiece-centering precision is made.

## Honest sensor boundary

No orientation/motion listeners, geolocation, sensor permissions, pointing
readings, motor commands or telescope arrows are implemented. “Sensors off”
is deliberate, not a calibration result. A stock 250P has no telemetry.
Mounted estimates require a rigid phone mount, measured multi-star alignment,
true/magnetic-north handling, stale-reading rejection and independent-star
validation on the actual Pixel 8 and telescope. Those stages remain pending.
Do not turn catalogue positions into apparent telescope readings.

## Validation

Development requires Node 20+; run `npm ci`, then `npm test`.
For browser checks: `npx playwright install chromium`, then `npx playwright test`.
Browser installation may require the normal Playwright Linux prerequisites.

The 36 Node checks include 32 independent Astropy reference cases for the Sun,
Moon, Mars, Jupiter, Saturn, M31, Polaris and Sirius across four times including
Edmonton DST transition dates and summer/winter conditions. Acceptable angular
component differences are 0.15 degrees for solar-system bodies and 0.05 degrees
for fixed objects. These are prototype regression tolerances, not a guaranteed
accuracy specification. Fixtures use Astropy 8.0.2 / ERFA and the built-in
solar-system ephemeris, zero atmospheric pressure, and IERS data packaged
2026-10-19. Regenerate with `python tests/reference.py > tests/reference.json`
after installing Astropy separately; Astropy is not a runtime dependency.
Independent JPL Horizons comparison and precision catalogue validation remain
future work before telescope guidance.

Browser checks run at 1440×1000 and a 412×915 touch viewport approximating
Pixel 8 logical dimensions. They cover open/close, search, aliases, selection,
empty results, horizon filtering, expansion, red toggle, keyboard handling,
refresh focus retention and a missing astronomy-library error. Screenshots
are illustrative browser renders; they do not certify physical Pixel sensor
accuracy, actual Chrome shortcut behavior or night-vision performance.

The permanent weather entry is checked by Git blob identity, so its features,
visuals, links and refresh code have no changes. No new forecast integration
is proposed here. Live Open-Meteo behavior was not re-certified in this stage.
