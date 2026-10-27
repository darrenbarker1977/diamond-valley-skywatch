# Shared sky catalogue

Forecast and Navigator share 237 objects: all 110 Messier objects, additional
NGC/IC and wide-field highlights, 91 named bright-star entries, familiar double
stars and Solar System bodies. Overlaps are merged by ID. This is a practical
observing catalogue, not every known astronomical object. A catalogue entry
does not promise visibility through a particular telescope or local sky.

Static data were adapted on 2026-10-27 from Olaf Frohn's D3-Celestial:

- https://github.com/ofrohn/d3-celestial/blob/master/data/messier.json
- https://github.com/ofrohn/d3-celestial/blob/master/data/dsos.bright.json
- https://github.com/ofrohn/d3-celestial/blob/master/data/dsos.6.json
- https://github.com/ofrohn/d3-celestial/blob/master/data/stars.6.json
- https://github.com/ofrohn/d3-celestial/blob/master/data/starnames.json

The full BSD-3-Clause redistribution notice is retained in
prototype/vendor/d3-celestial-LICENSE.txt. The compact derived records ship in
prototype/catalogue-data.js; no external catalogue requests occur at runtime.
Coordinates are J2000, converted from the source's longitude in degrees to RA
in hours, preserving declination. Named stars brighter than magnitude 2.5 and
selected additional highlights are included. M24 is a star cloud; M40 is a
double star; M73 is an asterism. Existing familiar-object coordinates and notes
are retained from the original rounded SIMBAD-based catalogue.

Positions use the already vendored MIT-licensed Astronomy Engine. Fixed-object
coordinates are precessed to the observation date; Solar System coordinates
are calculated topocentrically. Proper motion is not applied to static stars.
The horizon is geometric; atmospheric refraction, terrain and extinction are
not modelled. Rounded coordinates are for visual exploration, not precision
astrometry or telescope encoder readings.

Forecast samples each half hour in the selected weather window, using that
location's local date and timezone. It recommends up to six targets above 20°,
with the Sun below −6° (−12° for deep-sky objects), at least 30° from the Sun.
Altitude, object type, integrated magnitude, bright-Moon interference when the
Moon is above the horizon and a small set of popular highlights affect ranking.
There is a two-per-type limit to keep the shortlist varied. This is a heuristic,
not a guarantee of detection. The Sun is never a forecast telescope target.

Each forecast card labels its own local viewing time. Navigator always shows
the current sky. Both use the same validated eyepiece settings saved on the
device. Forecast failures leave weather usable and never substitute directions.
