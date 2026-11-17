# Opening live sky and shared location

Home opens on the same catalogue/star renderer as Navigator. It uses the actual
current instant and the shared observing site, including in daylight and in the
southern hemisphere. Daylight stars are calculated previews, not claims that
those stars are visible. Navigator retains its separate planned/practice clocks.

Above the sky, Phone location requests an explicit high-accuracy browser fix.
Choose a place opens the existing worldwide search and coordinate forms in place.
Ticks reflect the source actually accepted, not an outstanding request. The bar
labels default, chosen, saved and fresh phone locations. A denied/timed-out fix
leaves the previous site intact. Reload restores a saved place, never a fresh-GPS
claim. GPS is optional for browsing; use the actual observing site for guidance.
The fix is not continuously tracked: request another after moving. Weather and
sky share the same site; only cached weather is available offline.

Supported phones begin by listening passively for fresh absolute orientation.
The presence of requestPermission does not itself prevent already-authorized
samples. Explicit Enable phone view / compass controls request permission when
required by the browser. A trusted page tap may reconnect listeners without
requesting permission. Denial, relative-only readings and stale samples never
supply an invented north bearing. The Home view follows the rear-camera axis;
the expanded compass remains a physical top-edge compass. No camera permission
or geolocation request is made just by opening Home.

Unaligned Home motion is labelled approximate because browser north may be
magnetic and affected by local interference. It does not feed telescope arrows,
pulses or an alignment model. Genuine fresh calibrated poses can drive the Home
map instead. No heading or alignment is restored from storage. A quiet sensor
stream pauses the view while keeping listeners attached for recovery.

Phone view ignores map dragging; zoom remains available. Manual map explicitly
switches to drag/direction/keyboard exploration, which is the computer default.
Forecast, catalogue, tours and setup remain accessible in the compact tool dock.
The existing shared header, history routes, readiness controls, equipment,
sightings and installed-app identity remain in place.

Browser checks use synthetic sensor events only in test code. Physical Pixel 8
accuracy and outdoor mounting remain hardware checks, not automated claims.
