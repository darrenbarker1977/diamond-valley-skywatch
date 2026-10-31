# Shared screen hold

A single Screen Wake Lock owner now covers the visible Home, Forecast and
Navigator app, including camera, compass and Scope view. It requests a hold on
load by default. A first trusted tap retries once if the browser initially
withheld it; same-origin Forecast frame taps use the same owner. There are no
video/audio tricks, background wake locks or changes to phone security settings.

The floating Screen awake control uses the existing colours and spacing without
changing the main header. Scope, camera and compass have controls for the same
hold. Leaving Scope or switching pages no longer releases it. The info panel
shows actual status, describes browser/phone limits and offers an automatic
request preference that can be turned off even when the API is unavailable.
Explicit off is remembered on this browser. Screen awake: on and aria-pressed
true are shown only after a non-released WakeLockSentinel is granted.

Document hiding and pagehide release the hold and invalidate pending requests.
Returning to a visible app requests a new hold if still wanted. Late grants are
released rather than replacing a newer hold or restarting a cancelled one. A
system release while visible gets one automatic recovery attempt, then a visible
retry state instead of a request loop. Denied, unsupported and released holds do
not claim that the screen is protected. Android Battery Saver or browser policy
can prevent a hold; the app reports the actual failure and provides the normal
screen-timeout setting as a fallback. Manual phone locking is not overridden.

This feature does not resume old telescope calibration on return: the existing
visibility/placement/sensor validity safeguards remain unchanged. Both forecast
files and the permanent Pages URL remain unchanged.

The help popup has a 44 px close button. Closing it, pressing Escape or clicking
outside dismisses only the popup and preserves the wake-lock request/preference.
Escape closes the help before the underlying Navigator. Outside clicks remain
available to page controls, including the same-origin Forecast frame. Popup
content scrolls on short screens while the close header stays visible.
