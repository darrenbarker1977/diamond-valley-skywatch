# Optional field readiness and same-eyepiece discovery

Home is a launch screen: a folded location picker and Ready check, Night Mission,
Forecast, Explore the sky, Skywatch and a folded preferences/install section.
Equipment and pointing controls live in Navigator. All three main views retain
the same header, artwork, compass, URL and main menu.

The single Ready check moves between Home and Navigator without recreating its
controls or forcing it open. Browsing/planning is the default purpose. Choosing
handheld or telescope mode displays actionable checks; it does not enable any
sensors, request location, start alignment or prevent exploration. The selected
purpose saves locally. Live readiness uses pointing's measured sample freshness,
sensor state, calibration stage, physical presence, live/planned time, dusk,
selected pointing mode and mount confirmation. A basic alignment is explicitly
unverified. Forecast age/coverage and the actual granted screen-hold state are
reported separately; passing checks never promises visibility or centring.

## Actionable checks

Every Ready check row links to a relevant control. The location action opens the
saved-site picker or focuses the explicit physical-presence confirmation. Sensor
controls preserve browsing mode; a labelled Enable/Retry sensors action requests
permission directly when the site and pointing mode are ready. Alignment links
focus the missing step: presence, placement, sensors, or the available target
search. A calibrated phone links straight to Find it without clearing alignment.
Daylight offers alignment help and Plan tonight; planned time offers Return to
Now. No shortcut confirms presence, phone placement or an astronomical object
for the user, and daylight alignment stays disabled.

Forecast opens current conditions or requests a refresh for missing/stale/offline
weather. Screen settings opens the existing wake-lock controls when a hold is
already granted; it does not issue a duplicate request or release the hold.
Destinations unfold the actual controls and focus/scroll them into view so users
do not have to hunt for the relevant step below an expanded readiness box.

## Vibration

Find it starts vibration automatically after a successful alignment when supported.
Its toggle is next to the guidance, and an explicit off choice is saved locally
and respected on target changes, later visits and reloads. A setup checkbox can
change this preference too. No saved preference restores an alignment.
It works for handheld and mounted pointing in browsers supporting Vibration API.
Only a fresh, safe aligned haptic pose can trigger a pulse; the compass alone
cannot. Sensor noise/staleness, daylight, invalid alignment, Sun separation,
overhead/below-horizon restrictions and remote/planning contexts retain their
existing guidance guards. Leaving Find it, hiding the app or turning the toggle
off cancels vibration. Arrows and haptics share the smooth-motion guard;
alignment capture retains its separate one-second steady hold. The guidance path needs at least three
fresh samples, no segment faster than 90°/second, and no more than 2° of
zigzag excess over direct displacement. No timer extrapolates missing measurements.

Distance bands are above 30°, 15–30°, 7–15°, 3–7°, and within the coarse 3°
estimate. Pulses get faster through the first four bands. A gentle double pulse
near the target means check the finder; it is never labelled a lock or a centred
object. Browser refusal turns vibration off with an explicit message. Physical
phone vibration and sensor interference must still be checked outdoors.

## Show me another

Users explicitly select the eyepiece currently fitted, including an arbitrary
valid zoom setting. It saves locally and stays independent of recommendations.
Find it also has a folded, searchable target picker. Choosing a current target
keeps alignment, pointing mode and vibration preference; it stops the previous
pulse before recalculating the new destination. The handheld hint names the
rear-camera direction explicitly, while the mounted hint names the top edge.
Every request recalculates the current sky at the selected site using the shared
catalogue/ranking guards (darkness, altitude, Sun separation, Moon interference).
Suggested starting magnification ranges favour matches to this exact setting.
No field of view is invented: eyepiece apparent field and atmospheric seeing are
not measured. Weather adds qualified advice and age; it does not hide the route.
Cloud and local obstructions remain unconfirmed. No good match produces a clear
explanation rather than changing eyepieces silently. After all other matches
have been shown, a subsequent tap can start another round. Disabled/removed
eyepieces and invalid zoom settings disable the action until corrected.

## Moon phase imagery

Skywatch's Moon clock and Forecast's Moon illumination tile share NASA/JPL
Galileo's photographic composite PIA00405, already bundled in the app. Calculated
phase clipping replaces the flat Moon graphic. The selected time drives the
Skywatch panel; Forecast uses 9 PM in the selected location's timezone. The
southern reference rotates 180° (south up). This is explicitly a photographic
phase reference, not a live photograph or an exact horizon/eyepiece orientation;
it does not model lunar libration or crater shadows at the terminator. Image
source and limitations are in folded disclosures. Text survives image failure.
The archive `forecast-original.html` remains untouched.

## Verification

Unit checks cover same-eyepiece eligibility in both hemispheres, daylight,
disabled equipment and continuous zoom settings; Moon phase area and side;
and haptic bands. Browser checks cover collapsed and shared readiness, browsing
without sensors, daytime tours, actual screen-hold state, retained eyepieces,
new target selection, invalid kit changes, photo phase/date/hemisphere, and real
pointing-pipeline vibration with simulated test-only orientation events.
Existing weather-refresh, tour, camera, phone-follow, sensor permission,
alignment, red mode, offline-cache, Scope and shared-header checks are retained.
