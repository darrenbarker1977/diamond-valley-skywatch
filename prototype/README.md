> Current workflow (2026-10-27): one positively identified target starts basic
> guidance; a second refines it; a third check is optional. Older three-object
> instructions below remain useful for the optional full check. The compass now
> has a separate persistent session. See docs/beyond-forecast.md in the repository
> for the current behavior and limits. No physical field accuracy is implied.

# Skywatch Navigator — isolated prototype

The permanent root entry now loads these shared Navigator assets. The standalone
/prototype/ entry remains useful for development. The owner authorized permanent
publication and ongoing live updates on 2026-10-26. The existing Pages URL and
Chrome root shortcut stay the same. The complete original weather document is
preserved byte-for-byte as forecast-original.html (Git blob
b1c3ee54aad313c84e1e958bbc577851f61e5be2).

## Preview locally

From the repository root, run `python3 -m http.server 8000`, then open
http://localhost:8000/prototype/ and tap **Sky Navigator**. No build, CDN or API
key is needed to run the prototype. Serve over HTTP; ES modules will not work
reliably when opening the HTML directly as a file. The Forecast view opens forecast.html, which retains the original Open-Meteo
implementation. A separate private Sites staging environment is also available.

The modal offers a compact/expanded layout, an accessible telescope launcher,
search by names and aliases, an above-horizon filter, a geometric sky map,
live target coordinates and an on/off red theme. The map is fixed north-up,
east-right: it is a horizon diagram, not an overhead planetarium projection,
phone camera or orientation view. Selected objects below the horizon remain
in the detail card with a clear label and are omitted from the map.

The catalogue contains 27 curated objects, not all astronomical objects.
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

## Beginner alignment and pointing

Open “Point your phone or guide your telescope.” Choose handheld or strapped
250P mode. No sensor or camera permission is requested until you tap its button.
A secure HTTPS preview is required on a phone; localhost works on the machine
serving it, but plain HTTP over a home LAN does not permit these APIs. This PR
does not create hosting or change the permanent Pages site. Test on a separately
approved HTTPS preview before considering live integration.

1. **Set up the phone.** In your hand, aim the rear camera, not the top edge,
   at the sky. An optional local rear-camera crosshair helps centre an object.
   On the 250P, strap the phone tightly along the tube, screen outward, with
   its physical top edge (opposite the charging port) toward the tube opening
   and its long edges parallel to the tube. Confirm placement in the guide.
   Arbitrary phone-to-tube angles are not supported. The app cannot detect
   a loose strap; if it slips, stop and start alignment again.
2. **Enable sensors.** Away from magnetic accessories, gently move the phone
   in a figure eight, then return it to its final position. This may help the
   compass but does not prove accuracy. Chrome must expose absolute orientation;
   relative orientation alone cannot unlock guidance. If permission fails,
   the page explains how to check the browser's motion-sensor settings.
3. **Start with something easy.** Suggestions are recalculated for the current
   time and fixed Diamond Valley site. The guide favors a well-placed Moon,
   bright planets, or recognizable bright stars, including Polaris. Each has
   identification hints. It never promises an object is visible through clouds.
   Objects must be 20°–75° up and at least 30° from the Sun. The Sun must be
   at least 6° below the horizon; the Moon must be at least 15% illuminated.
   Choose another option if you cannot confidently identify the suggestion.
4. **Record two objects.** Confirm the object's identity and centre it in the
   camera crosshair (handheld) or low-power eyepiece (mounted), hold still, and
   record. The second object must be 30°–140° from the first. One object cannot
   unlock arrows. Finish these steps within five minutes or start again.
5. **Check a third object.** Use a different object at least 20° from both
   earlier objects. Centre it and record. A miss over 3° rejects the alignment.
   Only a passing independent check unlocks coarse arrows. Use your finder,
   then a low-power eyepiece to finish locating the target. This is not a
   promise that a target will be in the eyepiece.

The catalogue now adds Capella, Arcturus, Altair, Deneb, Betelgeuse and Rigel
for easier seasonal choices. A lack of suitable suggestions means wait or try
another night; do not guess at faint targets.

### Measurement model and limits

The W3C device Z-X-Y rotation maps the rear camera's -Z axis in handheld mode
or the phone's physical +Y/top-edge axis in mounted mode into the browser's
absolute reference frame. This axis choice is independent of the way text is
rotated on screen; a screen-orientation change nevertheless clears alignment
for conservative handling. A two-vector orthonormal basis fit estimates the
rotation between the sensor reference and true astronomical directions. It
can correct a stable reference-heading offset without pretending raw magnetic
heading is true north. It does **not** infer an arbitrary mounting-axis offset
or a time/position-dependent magnetic distortion. The known mounting-axis
requirement and third-object check are essential.

A capture needs at least eight finite absolute samples across at least 600 ms,
within the last 1.2 seconds, with the newest sample no older than 700 ms and
all samples within 1.5° of their mean direction. The two measured object
separations must agree within 3°. The fit residual and independent check error
are displayed. No browser-provided heading accuracy is assumed. A passing
local check does not establish accuracy across the entire sky.

After validation, guidance uses only fresh measured directions and the selected
target's current coordinates. A 3° coarse arrival label does not mean centred.
Left/right wraps across north using the shorter turn; raise/lower uses altitude.
Readings moving more than 4° over the recent 400 ms pause arrows. Guidance is
suppressed below the horizon, above 80° altitude, in daylight, and within 30°
of the Sun. No motors are controlled.

No usable reading in six seconds, invalid readings after acquisition, a >70°
jump within 100 ms, or readings stale for more than 1.5 seconds stops the sensor
session. Initial empty events wait for complete data rather than create zero
coordinates. Closing the modal, changing modes, screen rotation, leaving or
hiding the page releases sensors/camera and clears calibration. Sessions expire
after 20 minutes. Changes in strap placement require a manual restart because
slippage cannot always be detected electronically.

Readings and camera video stay in memory locally, with no recording, upload or
persisted calibration. The optional camera requires its own permission, verifies
a rear-facing camera, and stops tracks on close, suspension or a canceled late
permission response. Night mode dims and tints the preview; browser/OS permission
dialogs remain outside page control.

A stock Dobsonian supplies no encoder telemetry. All post-alignment directions
are labelled phone-derived estimates. The steel tube, magnets, sensor drift,
clock/location errors and imperfect phone placement can defeat this technique.
Actual Pixel 8/Chrome and 250P hardware acceptance is still pending; do not
interpret simulated development tests as real telescope readings.

## Validation

Development requires Node 20+; run `npm ci`, then `npm test`.
For browser checks: `npx playwright install chromium`, then `npx playwright test`.
Browser installation may require the normal Playwright Linux prerequisites.

The original 36 Node checks include 32 independent Astropy reference cases for the Sun,
Moon, Mars, Jupiter, Saturn, M31, Polaris and Sirius across four times including
Edmonton DST transition dates and summer/winter conditions. Acceptable angular
component differences are 0.15 degrees for solar-system bodies and 0.05 degrees
for fixed objects. These are prototype regression tolerances, not a guaranteed
accuracy specification. Fixtures use Astropy 8.0.2 / ERFA and the built-in
solar-system ephemeris, zero atmospheric pressure, and IERS data packaged
2026-10-19. Regenerate with `python tests/reference.py > tests/reference.json`
after installing Astropy separately; Astropy is not a runtime dependency.
Eleven additional Node checks cover orientation transforms, full 3D frame fits,
poor geometry, validation rejection, shortest-turn arrows, stable sample gates,
easy-target planning and sensor lifecycle failures.
Independent JPL Horizons comparison and precision catalogue validation remain
future work before telescope guidance.

Browser checks run at 1440×1000 and a 412×915 touch viewport approximating
Pixel 8 logical dimensions. They cover open/close, search, aliases, selection,
empty results, horizon filtering, expansion, red toggle, keyboard handling,
refresh focus retention and a missing astronomy-library error. Further tests
exercise the complete three-object wizard, rejected third-object checks,
permission denial, missing/relative/invalid/stale data, mode changes, daylight
exclusion and cancellation of a pending camera request. Orientation samples
are synthetic and explicitly confined to the development tests. Screenshots
are illustrative browser renders; they do not certify physical Pixel sensor
accuracy, actual Chrome shortcut behavior or night-vision performance.

The archived weather document is checked by Git blob identity, so its features,
visuals, links and refresh code have no changes. No new forecast integration
is proposed here. Live Open-Meteo behavior was not re-certified in this stage.

## Personal eyepiece kit

The preview now includes **My eyepieces** and a viewing plan in every target's
card. The initial kit follows the owner's photos: SVBONY SV135 7–21 mm zoom,
plus 25 mm and 10 mm eyepieces listed as supplied with the telescope. Entries
can be disabled or removed when they do not match the actual kit. Telescope
focal length defaults to the standard 250P's 1200 mm and is explicitly editable;
the user should check the tube label. Magnification is telescope focal length
divided by eyepiece focal length, rounded only for display. Apparent/true field
of view is not inferred from the supplied-eyepiece listing.

Users can add fixed or zoom eyepieces directly, with an optional name and focal
length(s). Added entries immediately participate in the lowest-power finding
step and appropriate detail suggestions. Only enabled inventory is used. Wide
objects remain low-power recommendations; low-altitude objects avoid high-power
steps. The beginner recommendations cap detail suggestions at 220×, and do not
claim measured atmospheric seeing. A short-focal-length eyepiece can still be
listed without being recommended at unsuitable power. No ordinary solar viewing
recommendation is issued. The mounted alignment hint also uses the enabled
kit's lowest available magnification.

The equipment list persists in this browser's localStorage under a dedicated
Navigator key, separate from forecast weather cache. It does not automatically
sync between laptop and Pixel, and no equipment data is uploaded. Browser
storage failures fall back to session-only edits with an explicit message.
Future cross-device account storage can be added separately if requested.

The separate private HTTPS test preview is hosted at
https://diamond-valley-skywatch-navigator-preview.amazingstumbles.chatgpt.site .
The GitHub Pages root now presents Home, Forecast and Navigator. The weather
document itself remains unchanged at forecast.html.


## Compact home and tool views

Home now has four direct buttons: Forecast, Find an object, Point my phone /
telescope, and My eyepieces. Navigator sections display one tool at a time.
Each object prominently shows a recommended viewing eyepiece; finding steps,
extra magnifications, object background and sky map are expandable. Phone setup
collapses after good readings arrive, and completed alignment steps hide after
a successful independent check. Switching tools stops the optional camera;
closing the Navigator still stops sensors and clears alignment.

The preview embeds a byte-identical copy of the existing forecast in its Forecast
view, without rewriting its weather code, links or refresh behavior. The frame
is loaded on demand and retained across menu changes, preserving selection and
cache state. Returning uses its existing focus-refresh handler. Local prototype
uses ../forecast.html; the permanent root and separate hosting copy use forecast.html. The original weather
source is retained at forecast.html. The owner approved this unified interface
for permanent publication on 2026-10-26.


## Worldwide location selection and offline use

Home now supports a high-accuracy, user-initiated device fix, worldwide named
place search and direct coordinates for remote sites. The heading and all
observer calculations follow the selection. Sky positions always use UTC
instants; geocoding supplies the named site's clock timezone, and Open-Meteo
resolves weather's timezone automatically. Manual coordinates use a labelled
UTC clock until forecast timezone metadata arrives.

The selected site is stored on this browser and restored on reload. Failed or
canceled location/search requests never replace it. Restored/manual/default
sites require the user's physical-presence confirmation before sensor access;
a fresh device fix establishes the current observing site. Location changes
stop sensors/camera and invalidate alignment. No continuous tracking is used.

The root service worker caches only same-origin app assets. Weather data uses
location-keyed localStorage; cached weather is identified as stale/offline and
remaining dates are shown even when fewer than five nights remain. Fresh
responses still require the complete five-night forecast. Cached weather older
than seven days is not loaded. The original weather source is retained in
forecast-original.html for reference/rollback.

Before leaving service: select the site, wait for offline preparation to finish,
and open Forecast online. Airplane-mode testing is recommended on the actual
Pixel. New forecasts and place-name lookup need a connection. Static sky
calculations and manually entered coordinates remain usable offline, subject
to device time accuracy and browser cache/storage availability.
