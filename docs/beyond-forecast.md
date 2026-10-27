# Beyond the forecast — 2026-10-27

The owner selected guided star hopping, Moon/planet details, a richer atlas,
aurora, haze/dew and ISS passes. Eyepiece simulation and camera plate solving
are excluded. Reference photos and useful short facts remain; appearance
descriptions are hidden by default and can be revealed from Home. Existing
eyepiece recommendations, global locations, Forecast refresh and Night Mission
continue to use the same site and equipment settings.

## Compass and pointing are separate sessions

CompassSession owns only the live phone compass. It starts on capable HTTPS
browsers without user-agent filtering, subject to the visible auto setting.
The first ordinary site gesture reattaches its listeners once, and opening the
compass also reconnects. A quiet or incomplete stream hides the current heading
but leaves listeners enabled; it can reconnect every ten seconds. New valid
absolute samples recover without a checkbox toggle. Menu, modal and Scope-view
visibility no longer turn the compass off. Background/pagehide pauses it;
return resumes if wanted. Permission APIs that require a gesture are invoked
only from an explicit control. Stop pauses this visit; only the auto checkbox
persists an off choice (dvsky:compass:auto:v2). No heading is persisted.

The telescope OrientationSession remains separate. It never uses compass UI
values. Fresh absolute samples and stable capture are required, plus physical
presence, mounting confirmation when applicable, valid astronomy and safe Sun /
horizon geometry. A stale stream pauses arrows without detaching its listeners;
fresh stable samples can resume the existing model. Invalid samples, jumps,
mode/mount/site changes, hiding the app or exceeding twenty minutes invalidate
the calibration. The compass is not telescope encoder telemetry.

## Progressive alignment

One identified object starts **basic** guidance, including Polaris when its
actual altitude and Sun separation satisfy the existing easy-target filters.
The model applies measured heading and tilt offsets from that recorded object.
One vector does not determine a general 3D rotation; the UI explicitly labels
accuracy as unverified and recommends nearby realignment if directions disagree.
It does not claim a numerical pointing accuracy.

A second object 30–140 degrees away fits the original 3D two-vector model, with
the existing angular-separation consistency rejection. This provides refined
guidance immediately. An independent third object is optional; its original
three-degree rejection remains. A failed second fit or third check clears the
model. A successful check is a local check, not a whole-sky accuracy guarantee.
The three-degree arrival zone is an aiming cue, not centring confirmation.
Planned skies cannot enable or restore live calibration. Desired observing
targets are restored after each successful alignment stage.

## Skywatch panels

Home's Beyond the forecast button and Navigator's Skywatch tab open the same
collapsible view. Moon illumination, rise/set and Jovian positions use the
existing Astronomy Engine and selected time/location. Jovian vectors include
light travel time and are projected celestial north up/east left. The optional
diagram is not an eyepiece simulation or an eclipse/visibility prediction.

Aurora uses NOAA's OVATION grid: a nearby cell, issued/forecast timestamps,
two-hour observation-age limit and no five-day extrapolation. It is explicitly
overhead model probability for now, with local live darkness/cloud context;
it is not guaranteed visibility or a horizon-viewline calculation.

Haze uses Open-Meteo CAMS Global aerosol optical depth, PM2.5 and dust at the
selected coordinate/hour. Coordinate mismatch, missing hours and downloads
older than twelve hours are rejected. AOD bands are UI heuristics, not measured
transparency. Dew uses temperature minus dew point from the existing Forecast
snapshot; no duplicate weather client is added. Neither measures seeing.

ISS uses Satellite.js 7.1.0 (MIT), fresh CelesTrak OMM for NORAD 25544, SGP4
propagation, observer look angles, an approximate conical Earth shadow and
geometric local Sun altitude. Predictions show only sunlit segments above ten
degrees with the Sun below minus six degrees, sampled every twenty seconds.
The displayed maximum prediction window is 36 hours, shortened to the orbit's
72-hour validity boundary. Missing/malformed/old elements and dates outside
that boundary do not generate substitute passes. Visibility also depends on
cloud, actual brightness and obstructions. This is an eyes-up side activity,
not telescope tracking or a background notification service.

Feeds load when their panels open. In-flight requests are shared. Aurora cache
TTL is five minutes, air one hour, ISS two hours (CelesTrak policy). Browser
cache fallbacks are labelled and remain subject to data-age/coverage checks.
Location/time changes invalidate results in flight. Source outages never stop
the original weather screen. JSON endpoints were checked with the site's
Origin header for CORS; live availability still depends on their operators.

## Rich sky and finding

The existing 2,851 bright stars remain the base layer. D3-Celestial adds 22,872
real J2000 stars from magnitude >5.5 through 7.5, rendered when zoomed, plus
decimated Milky Way contour rings. These are catalogue/contour visualizations,
not a prediction of naked-eye visibility. The BSD license is retained. Failure
of the optional deeper data leaves the original atlas and search working.

Star-hop routes use available named bright stars after dusk, above the usable
horizon and away from the Sun. Intermediate steps reduce target separation;
the final gap is at most fifteen degrees. A dashed route is a chart aid, never
a measured direction or automatic identification. No suitable route is reported
honestly. Optional haptics require a successful independent alignment check,
fresh safe pose and browser support. They only cue crossing coarse approach
thresholds and do not certify centring.

All static modules, catalogue data and vendored propagation modules are in the
offline shell. New external forecasts/orbits require connectivity; old data
cannot masquerade as current. Physical Pixel 8 / 250P tests remain necessary
to assess field accuracy and local magnetic interference.

## Sources

- https://github.com/ofrohn/d3-celestial (data/stars.8.json, data/milkyway.json;
  BSD-3-Clause; copied source license in prototype/vendor/)
- https://github.com/cosinekitty/astronomy (already vendored; MIT)
- https://github.com/shashwatak/satellite-js (7.1.0 dependency closure;
  prototype/vendor/satellite/LICENSE.md and ORIGINAL-PKG-INFO)
- https://celestrak.org/NORAD/documentation/gp-data-formats.php
- https://celestrak.org/usage-policy.php
- https://www.swpc.noaa.gov/products/aurora-30-minute-forecast
- https://open-meteo.com/en/docs/air-quality-api (CAMS / Open-Meteo attribution
  shown in the panel)

AstroHopper and Stellarium informed the research. Their code was not copied.
No new commercial service, API credential or server is required.
