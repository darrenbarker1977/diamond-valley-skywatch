# Sky atlas and finding view

The permanent Home, Forecast and Navigator screens retain one actual shared
header. Navigator's four local sections are Sky & objects, Find it, Pointing
and Eyepieces. A location-aware atlas replaces the former concentric-circle
diagram as the main sky view. The original all-sky perspective is available
through the All sky control.

The atlas plots 2,851 real stars through magnitude 5.5, alongside the 237-object
observing catalogue. It does not generate random stars. J2000 coordinates are
precessed with Astronomy Engine and converted to the geometric local horizon.
Both hemispheres use the selected site's coordinates and the current UTC
instant. Data are updated every ten seconds while Navigator is open; there is
no permanent animation loop. High-DPI rendering is capped at 2×. Phone-follow
redraws only when valid aligned direction updates are available.

Drag or use arrow keys to look around; pinch, wheel, plus and minus change the
field from 20° to 105°. N/E/S/W reset the view toward a compass bearing. My target
centres an above-horizon selection. Below-horizon targets do not move the view
underground. Tapping a plotted catalogue object selects it. Names, constellation
outlines and an all-sky projection can be toggled. The horizon is mathematical,
not a model of local terrain. Stars are shown for planning during daylight;
this does not imply they are visible to the eye.

The dense star and constellation datasets derive from Olaf Frohn's D3-Celestial:

- https://github.com/ofrohn/d3-celestial/blob/master/data/stars.6.json
- https://github.com/ofrohn/d3-celestial/blob/master/data/constellations.lines.json
- https://github.com/ofrohn/d3-celestial/blob/master/data/constellations.json

The existing BSD-3-Clause notice is retained in
prototype/vendor/d3-celestial-LICENSE.txt. Catalogue positions and line vertices
are bundled in prototype/atlas-data.js. Star colours are an approximate display
based on the source B−V colour index. Proper motion, atmospheric refraction and
terrain are not modelled. Outlines represent conventional patterns, not physical
connections between stars. Failure to load this optional dataset leaves object
search, observing positions and Forecast usable with a clear map error.

Find it separates calculated target position from measured pointing. Arrows and
phone-follow remain locked until the existing two-object alignment and independent
third-object check pass. The same checks for fresh/stable absolute sensor events,
physical presence, dusk, Sun separation, overhead ambiguity, session expiry and
interruptions apply. The view never substitutes a simulated direction. Synthetic
orientation appears only in development tests. A map that the user drags manually
is labelled as an explored view rather than a telescope pointing measurement.

Object cards contain an eyepiece plan, difficulty guidance and realistic visual
expectations. Seven objects have bundled NASA images; others have labelled type
illustrations. Photo source identifiers and exact downloaded URLs are recorded in
docs/object-images.json. Cards link to the NASA image's full record. NASA images
can use enhanced colour and non-visible wavelengths, and are not representations
of the view through an eyepiece. Files are stored unedited at the archive's small
image size, individually below 100 KB, with no runtime third-party image requests.

Optional sections are native details/summary controls. Home folds offline tips;
Forecast folds the atmospheric grid, events and reference material; Navigator
folds catalogue browsing, the selected-object card, map controls, object notes,
eyepiece steps and mounting tips. Search opens the catalogue, and selecting an
object opens its viewing card. Explicitly opened object sub-sections stay open
through the ten-second position refresh. Weather refresh listeners, saved kit,
location persistence and the permanent Pages address are retained.
