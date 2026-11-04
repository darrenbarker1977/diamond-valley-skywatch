# Pixel Back and browser navigation

The app previously changed visible screens without browser-history entries, so Android Back left the installed website immediately. App screens now use same-document history while keeping the permanent URL and shared header unchanged.

Back traverses visited Home/Forecast/Navigator screens and Navigator sections, including the real setup stages. Related programmatic steps are batched into one visible navigation. Scope, the live compass, the camera, the sightings list and screen-hold help close before the underlying screen changes. Closing a modal with its X or Escape consumes its panel entry too. Camera capture that advances setup consumes the camera entry rather than leaving a redundant stop behind it.

Forward and reload restore screen metadata only. History never stores or restores sensor samples, alignment models, physical-presence assertions, eyepiece ownership, locations or observation records. A camera stream is stopped on Back and is never requested automatically by Forward/reload. Restored setup stages still pass through the existing checks for missing requirements. In-document Back between tools preserves an active alignment; leaving or hiding the actual app still follows the existing sensor safety policy.

There is no exit guard or history trap at the initial Home entry. Back can leave the app after its screens have been unwound. Reload does not add another stack, and public target links have Home behind their first screen. Unknown or malformed browser state is ignored. Forecast iframe loads/location changes replace the frame document instead of adding hidden navigation steps.

Automated tests cover browser Back/Forward, leaving to an earlier document, setup stages, modal Escape/X, camera track cleanup, no camera restart, screen restoration on reload and preservation of live calibrated guidance in the existing handheld/mounted fixture journeys. Orientation/camera fixtures are development-only. The physical Android system button should also be checked on the Pixel after refreshing the installed app.
