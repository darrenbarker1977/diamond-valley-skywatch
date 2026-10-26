import {site} from './location.js?v=location-1';
export {site};
export function position(A, object, date) {
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid calculation time');
  const observer = new A.Observer(site.latitude,site.longitude,site.height);
  let eq;
  if (object.body) eq = A.Equator(object.body,date,observer,true,true);
  else {
    const ra=object.ra*Math.PI/12, dec=object.dec*Math.PI/180;
    const vector = new A.Vector(Math.cos(dec)*Math.cos(ra),Math.cos(dec)*Math.sin(ra),Math.sin(dec),date);
    eq = A.EquatorFromVector(A.RotateVector(A.Rotation_EQJ_EQD(date),vector));
  }
  // No atmospheric refraction: an honest geometric horizon, not predicted visibility.
  const h=A.Horizon(date,observer,eq.ra,eq.dec);
  if (![h.altitude,h.azimuth].every(Number.isFinite)) throw new Error('Non-finite sky position');
  return {alt:h.altitude,az:((h.azimuth%360)+360)%360};
}
export function project({alt,az}) {
  const radius=(90-alt)/90*166, angle=az*Math.PI/180;
  return {x:200+radius*Math.sin(angle), y:200-radius*Math.cos(angle)};
}
export function matches(object,query) {
  const normalize=s=>s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g,'');
  const q=normalize(query);
  return !q || [object.name,object.id,object.type,...object.aliases].some(s=>normalize(s).includes(q));
}
