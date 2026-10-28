# Adaptive Night Mission and time planner

Home opens Barker's Night Mission inside Navigator. Forecast can hand its
selected evening to the mission. The same header, weather iframe, Open-Meteo
request, cached forecasts and refresh functions are retained.

The mission offers one to five distinct stops, scaled to the available time
and sky. A 15-minute tour has one stop; a 30-minute tour has up to two. Separate
scroll-snap Hours and Minutes wheels support any whole-minute duration from
one minute through 11 hours 59 minutes, keyboard arrows/Page/Home/End, and
optional numeric entry. A valid duration is remembered on this browser. Once a live session
starts, its deadline and total-stop budget stay fixed while upcoming choices
adapt. Changing the duration explicitly adjusts that deadline from the original
start; ending the session allows a fresh route.
Each stop has a local time, direction, altitude, available weather advice,
and saved-kit eyepiece recommendations. Appearance descriptions respect the
existing surprise setting; reference photos remain available. A bright, recognisable object is
favoured first. Subsequent stops respect object variety, altitude, twilight,
Sun separation and Moon interference using the shared Astronomy Engine ranking.

Weather is advice, not a requirement for route generation or target selection.
The scheduler compares three times within each stop’s allotted slot and uses
weather penalties to prefer clearer/calmer times when possible. It never moves
a stop outside its session budget. Weather warnings follow the existing thresholds: cloud cover at most 55%,
precipitation probability at most 30%, snowfall at most 0.09 cm and gusts at most
42 km/h when those fields are available. Missing cloud data never becomes clear
weather. Wind/rain fields that are absent are reported as incomplete. Forecast
values are hourly model output, not a sky camera, seeing or transparency data.
No weather values are interpolated or fabricated. Repeated local clock hours
without unambiguous forecast timestamps are left unverified.

Upcoming stops are recalculated every minute while the app is visible, whenever
a new forecast arrives, when the location or planning time changes, and when the
eyepiece kit changes. The selected current stop stays pinned across forecast
changes, with an explicit warning if it is no longer suitable. Next stop actions
recheck current sky eligibility. Poor or unknown forecast conditions are shown
as advice and do not assert that a target is actually visible through cloud. Current/previous stop IDs exist only in memory
for the active session: there is no observing journal or saved observation log.
Changing the observing site or choosing a different night clears that session.

Mission weather is supplied by the existing same-origin forecast iframe. Messages
are accepted only from that exact frame and origin and only for matching observer
coordinates. Snapshots validate time, timezone, timestamp and numeric cloud data.
Saved weather uses the existing coordinate-specific keys. Forecast refreshes
remain automatic every 30 minutes and on return/manual refresh. Offline mode
displays the downloaded forecast's timestamp, age and stale status; a location or
date without downloaded hours still gets a sky-based route with weather
explicitly unavailable. A mismatched-location snapshot is never reused.

Now displays the actual sky and a mission for the remaining/upcoming evening.
Plan a night selects an evening date and a 15-minute slider from 4 PM through
6 AM the next calendar day, in the selected site's timezone. The planner permits
sky exploration and tours beyond the forecast horizon, with weather
unavailable there. Before dusk the live tour starts at the next sampled dark
time (five-minute search intervals); a planned window retains its selected
time and explains if it is too bright. Polar daylight can still leave no route. Clock-change gaps are rejected; repeated local times use the
earlier occurrence. Dates and times are converted independently of the device's
timezone, including half-hour offsets such as Alice Springs.

Planning suspends sensors, camera and alignment. The atlas, clock and object
cards show the chosen planned epoch, but Finder and the pointing engine use
separate live positions. Entering Finder or Pointing returns to Now. Neither
switching back nor selecting a mission target restores old alignment. Arrows
still require fresh absolute readings and at least one identified alignment
object, alongside the existing safety and physical-presence checks. A second
object refines the fit; the independent third-object check is optional.
Successful alignment restores the user's intended observing target.

## Handheld and telescope use

Finder offers On telescope and Handheld choices. A mode change clears alignment;
the original rear-camera axis and strapped top-edge axis are unchanged. Telescope
setup remains the primary shortcut, and handheld use remains fully available.

Scope view is an explicit, optional focused overlay. It gives the target, large
direction cues, eyepiece, Stop guidance and Next mission stop prominent space.
Full site and Escape leave the overlay. Portrait and landscape layouts, keyboard
focus containment, and dim red colours are supported. These are UI improvements,
not a claim that phone sensors have telescope-encoder accuracy.

Screen hold now uses one foreground-only Screen Wake Lock shared across all
app views, rather than ending when Scope view closes. It is requested by default,
with shared controls in the main app, Scope, camera and compass. Explicit off is
remembered. Holds release while hidden and are requested again on return; late
or cancelled grants are released. Unsupported/denied/system-released holds report
their actual status and never claim to prevent timeout. See screen-awake.md.
No photographs, sensor recordings or observations
are uploaded or saved by these features. Physical Pixel 8 / Dobsonian performance
still requires an outdoor field check; automated orientation exists only in tests.
