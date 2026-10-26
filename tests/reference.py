"""Generate independent offline Astropy/ERFA fixtures (not used by the app)."""
import json
from astropy.coordinates import EarthLocation, AltAz, SkyCoord, get_body
from astropy.time import Time
from astropy.utils import iers
import astropy.units as u
iers.conf.auto_download = False
site=EarthLocation.from_geodetic(-114.25*u.deg,50.68*u.deg,0*u.m)
rows=[]
for stamp in ['2026-10-27T03:00:00Z','2026-03-08T09:00:00Z','2026-11-01T08:00:00Z','2027-06-21T06:00:00Z']:
    t=Time(stamp)
    frame=AltAz(obstime=t,location=site,pressure=0*u.hPa)
    for name in ['Sun','Moon','Mars','Jupiter','Saturn']:
        p=get_body(name.lower(),t,site).transform_to(frame)
        rows.append(dict(time=stamp,id=name,alt=p.alt.deg,az=p.az.deg,tolerance=0.15))
    for name,ra,dec in [('M31',0.71231,41.26917),('Polaris',2.5303,89.2641),('Sirius',6.75248,-16.71612)]:
        p=SkyCoord(ra=ra*u.hourangle,dec=dec*u.deg,frame='icrs').transform_to(frame)
        rows.append(dict(time=stamp,id=name,alt=p.alt.deg,az=p.az.deg,tolerance=0.05))
print(json.dumps(rows,indent=2))
