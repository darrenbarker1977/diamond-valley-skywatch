# Adaptive Night Mission and time planner

Home opens Barker's Night Mission inside Navigator. Forecast can hand its
selected evening to the mission. The same header, weather iframe, Open-Meteo
request, cached forecasts and refresh functions are retained.

The mission offers three to five distinct stops when a sufficiently long,
suitable window exists; fewer stops or an explicit unavailable message are
shown when it does not. Session lengths are 45, 60, 90, 120 or 180 minutes. Once a live session
starts, its deadline and total-stop budget stay fixed while upcoming choices
adapt. Changing the duration explicitly adjusts that deadline from the original
start; ending the session allows a fresh route.
Each stop has a local time, direction, altitude, hourly cloud forecast, saved-kit
eyepiece advice and visual expectations. A bright, recognisable object is
favoured first. Subsequent stops respect object variety, altitude, twilight,
Sun separation and Moon interference using the shared Astronomy Engine ranking.

Forecast suitability follows the existing thresholds: cloud cover at most 55%,
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
recheck actual current conditions. Current/previous stop IDs exist only in memory
for the active session: there is no observing journal or saved observation log.
Changing the observing site or choosing a different night clears that session.

Mission weather is supplied by the existing same-origin forecast iframe. Messages
are accepted only from that exact frame and origin and only for matching observer
coordinates. Snapshots validate time, timezone, timestamp and numeric cloud data.
Saved weather uses the existing coordinate-specific keys. Forecast refreshes
remain automatic every 30 minutes and on return/manual refresh. Offline mode
displays the downloaded forecast's timestamp, age and stale status; a location or
date without downloaded hours does not get an invented mission.

Now displays the actual sky and a mission for the remaining/upcoming evening.
Plan a night selects an evening date and a 15-minute slider from 4 PM through
6 AM the next calendar day, in the selected site's timezone. The planner permits
sky exploration beyond the forecast horizon but labels weather-based missions
unavailable there. Clock-change gaps are rejected; repeated local times use the
earlier occurrence. Dates and times are converted independently of the device's
timezone, including half-hour offsets such as Alice Springs.

Planning suspends sensors, camera and alignment. The atlas, clock and object
cards show the chosen planned epoch, but Finder and the pointing engine use
separate live positions. Entering Finder or Pointing returns to Now. Neither
switching back nor selecting a mission target restores old alignment. Arrows
still require fresh absolute readings, two alignment objects and the independent
third-object check, alongside the existing safety and physical-presence checks.
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

Keep awake requests the browser Screen Wake Lock API only after a user action
in Scope view. A visible status reports success or failure. Locks are released
on exit/page hide and late permission results are released too. An unsupported
browser, power policy or OS interruption is reported; the app does not claim to
override those limitations. No photographs, sensor recordings or observations
are uploaded or saved by these features. Physical Pixel 8 / Dobsonian performance
still requires an outdoor field check; automated orientation exists only in tests.
