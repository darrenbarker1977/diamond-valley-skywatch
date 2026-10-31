# Navigator is the guided route to pointing

Home contains basic launch links, a folded site/ready check, and an active-session
resume card only when applicable. Navigator now starts Guided setup; a valid
aligned session can resume the live sky directly. Explore sky, equipment, tours
and the full pointing controls remain explicit tools rather than the default
beginner landing page. The header, forecast, stored kit/location and URL remain.

The route is placement (handheld rear camera or strapped phone top edge), observing
site/presence, fresh absolute sensors, one known alignment object, destination,
and the existing live sky/camera with arrows and optional pulses. Each card has
Back and a meaningful next action. Existing controls are moved into the cards and
restored on exit, retaining their original listeners and controller state. There
is one location chooser, one sensor session and one alignment capture control.
No permission, physical presence, stable sample or pointing direction is inferred.

Centre-and-record messages are buttons leading to the relevant guided card.
Missing prerequisites route to the actual location/placement/sensor requirement.
The alignment card offers camera crosshairs in handheld mode or centring in the
low-power eyepiece when mounted. Record readiness is adjacent to Record and in
the camera dock, reporting daylight, presence, planned time, placement, session,
freshness, available object, steadiness, confirmation and camera readiness.
The existing one-second stable-sample and sky guards still decide capture.

One recorded object starts basic alignment. The guided route then asks for the
destination, retaining any object selected before setup and distinguishing it
from the alignment star. Selecting a target or Find current destination opens
the shared moving sky viewport with arrows. A second/third alignment object is
optional in the full controls. Foreground Home/Forecast transitions keep a valid
session; background/continuity/location/placement guards still apply.

Daylight explains why alignment waits and links to the real mission planner.
Denied sensors show status, permission help and retry in their card. Browsing
without setup is explicitly available. The advanced tools and recovery links
remain available without duplicating hardware owners. Web vibration limitations
remain explicit, including Chrome Android suppression in Silent ringer mode.

Dedicated browser journeys cover default entry, both pointing modes through one
object into live guidance, the screenshot's disabled-Record/link case, preserved
destinations, daylight, permission denial and shared GPS/Home controls. Existing
advanced-tool regressions now explicitly choose Explore sky instead of assuming
it is Navigator's landing page. Tests inject development-only poses; actual phone
accuracy and physical vibration still require outdoor/device checks.
