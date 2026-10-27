import {site} from './location.js?v=location-1';
import {positionFor} from './sky-position.js?v=catalogue-1';
export {site};
export function position(A, object, date) {
  return positionFor(A,object,date,site);
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
