import {json2satrec,propagate,gstime,eciToEcf,ecfToLookAngles} from './vendor/satellite/index.js';
const D=Math.PI/180;
export const separation=(a,b)=>Math.acos(Math.max(-1,Math.min(1,Math.sin(a.alt*D)*Math.sin(b.alt*D)+Math.cos(a.alt*D)*Math.cos(b.alt*D)*Math.cos((a.az-b.az)*D))))/D;
export const bearing=az=>['N','NE','E','SE','S','SW','W','NW'][Math.round(((az%360)+360)%360/45)%8];
export function hopRoute(catalogue,positions,targetId){
 const target=positions.get(targetId),sun=positions.get('Sun');if(!target||target.alt<10||targetId==='Sun'||!sun||sun.alt>-6||separation(target,sun)<35)return [];
 const safe=catalogue.filter(o=>['Star','Double star'].includes(o.type)&&o.id!==targetId&&positions.get(o.id)?.alt>=15&&separation(positions.get(o.id),sun)>35);
 const starters=safe.filter(o=>(o.magnitude??9)<=2.5&&separation(positions.get(o.id),target)<=45&&separation(positions.get(o.id),target)>2).sort((a,b)=>((a.magnitude??2)*3+separation(positions.get(a.id),target))-((b.magnitude??2)*3+separation(positions.get(b.id),target)));
 for(const start of starters){
  const route=[start.id],used=new Set(route);let current=positions.get(start.id);
  while(separation(current,target)>12&&route.length<4){const remaining=separation(current,target),next=safe.filter(o=>!used.has(o.id)&&(o.magnitude??9)<4.5&&separation(current,positions.get(o.id))>=1&&separation(current,positions.get(o.id))<=15&&separation(positions.get(o.id),target)<remaining-2).sort((a,b)=>separation(positions.get(a.id),target)-separation(positions.get(b.id),target))[0];if(!next)break;route.push(next.id);used.add(next.id);current=positions.get(next.id);}
  if(separation(current,target)<=15)return [...route,targetId];
 }
 return [];
}
export function solarDetails(A,site,date){
 const phase=A.MoonPhase(date),fraction=A.Illumination('Moon',date).phase_fraction,observer=new A.Observer(site.latitude,site.longitude,site.height||0);
 const phaseName=['New Moon','Waxing crescent','First quarter','Waxing gibbous','Full Moon','Waning gibbous','Last quarter','Waning crescent'][Math.round(phase/45)%8];
 const vector=A.GeoVector('Jupiter',date,true),distance=Math.hypot(vector.x,vector.y,vector.z),retarded=new Date(date.getTime()-distance/A.C_AUDAY*86400000),moons=A.JupiterMoons(retarded),u=[vector.x/distance,vector.y/distance,vector.z/distance],east=[-u[1],u[0],0],length=Math.hypot(...east);east[0]/=length;east[1]/=length;
 const north=[u[1]*east[2]-u[2]*east[1],u[2]*east[0]-u[0]*east[2],u[0]*east[1]-u[1]*east[0]],r=71492/149597870.7,dot=(v,a)=>v.x*a[0]+v.y*a[1]+v.z*a[2];
 return {phase,fraction,phaseName,rise:A.SearchRiseSet('Moon',observer,1,date,2)?.date||null,set:A.SearchRiseSet('Moon',observer,-1,date,2)?.date||null,moons:Object.entries(moons).map(([name,v])=>({name:name[0].toUpperCase()+name.slice(1),x:dot(v,east)/r,y:dot(v,north)/r,behind:dot(v,u)>0&&Math.hypot(dot(v,east),dot(v,north))<r}))};
}
export function dewRisk(row){
 const t=row?.temperature_2m,d=row?.dew_point_2m;if(!Number.isFinite(t)||!Number.isFinite(d))return {level:'Unknown',text:'No temperature/dew-point forecast for this hour.'};
 const spread=t-d;return {level:spread<=2?'High':spread<=4?'Watch':'Lower',text:`Forecast air ${t.toFixed(0)}°C · dew point ${d.toFixed(0)}°C · spread ${spread.toFixed(1)}°C. Optics can cool below air temperature; this is a condensation-risk estimate.`};
}
export function auroraAt(data,site,now=Date.now()){
 const observed=Date.parse(data?.['Observation Time']),forecast=Date.parse(data?.['Forecast Time']);if(!Number.isFinite(observed)||!Number.isFinite(forecast)||Math.abs(now-observed)>2*3600000||forecast<now-90*60000||forecast>now+3*3600000)throw Error('Aurora forecast is dated or unavailable.');
 if(!Array.isArray(data.coordinates)||data.coordinates.length<100)throw Error('Aurora grid is unavailable.');let best=null,distance=Infinity;
 for(const cell of data.coordinates){if(!Array.isArray(cell)||cell.length<3||!cell.every(Number.isFinite)||cell[2]<0||cell[2]>100)continue;const dl=Math.abs(((cell[0]-site.longitude+540)%360)-180),dist=dl*dl*Math.cos(site.latitude*D)**2+(cell[1]-site.latitude)**2;if(dist<distance){best=cell;distance=dist;}}
 if(!best||distance>4)throw Error('No aurora grid cell covers this location.');return {probability:best[2],forecast,observed};
}
export function validateOrbit(data,now=Date.now()){
 const o=Array.isArray(data)?data.find(o=>Number(o.NORAD_CAT_ID)===25544):data;
 if(!o||Number(o.NORAD_CAT_ID)!==25544)throw Error('ISS orbit record missing.');const epoch=Date.parse(o.EPOCH?.endsWith('Z')?o.EPOCH:o.EPOCH+'Z');
 if(!Number.isFinite(epoch)||epoch>now+3*3600000||now-epoch>72*3600000)throw Error('ISS orbit is too old; reconnect for a fresh prediction.');
 for(const key of ['MEAN_MOTION','ECCENTRICITY','INCLINATION','RA_OF_ASC_NODE','ARG_OF_PERICENTER','MEAN_ANOMALY','BSTAR','MEAN_MOTION_DOT','MEAN_MOTION_DDOT'])if(!Number.isFinite(o[key]))throw Error('ISS orbit fields are incomplete.');
 if(o.MEAN_MOTION<12||o.MEAN_MOTION>18||o.ECCENTRICITY<0||o.ECCENTRICITY>=1||o.INCLINATION<0||o.INCLINATION>180)throw Error('ISS orbit is invalid.');return {record:o,epoch};
}
export function issPasses(A,data,site,start=new Date(),hours=36){
 const {record,epoch}=validateOrbit(data),sat=json2satrec(record),observer={latitude:site.latitude*D,longitude:site.longitude*D,height:(site.height||0)/1000},end=Math.min(start.getTime()+hours*3600000,epoch+72*3600000),passes=[];let current=null;
 if(start.getTime()<epoch-3*3600000||start.getTime()>=end)return [];
 for(let t=start.getTime();t<=end;t+=20000){const date=new Date(t),pv=propagate(sat,date);if(!pv?.position)throw Error('ISS orbit propagation failed.');const p=pv.position,look=ecfToLookAngles(observer,eciToEcf(p,gstime(date))),sun=A.GeoVector('Sun',date,true),sv=A.RotateVector(A.Rotation_EQJ_EQD(date),sun),sn=Math.hypot(sv.x,sv.y,sv.z),projection=(p.x*sv.x+p.y*sv.y+p.z*sv.z)/sn,shadow=projection<0&&Math.sqrt(Math.max(0,p.x*p.x+p.y*p.y+p.z*p.z-projection*projection))<6378.137+projection*.00465;
  const eq=A.EquatorFromVector(sv),sunAlt=A.Horizon(date,new A.Observer(site.latitude,site.longitude,site.height||0),eq.ra,eq.dec).altitude,alt=look.elevation/D,az=look.azimuth/D;
  if(alt>=10&&sunAlt<=-6&&!shadow){if(!current)current={start:date,end:date,from:az,to:az,max:alt,peak:date,track:[]};current.track.push({alt,az,time:t});current.end=date;current.to=az;if(alt>current.max){current.max=alt;current.peak=date;}}
  else if(current){if(current.end-current.start>=20000)passes.push(current);current=null;if(passes.length>=4)break;}
 }
 if(current&&current.end-current.start>=20000&&passes.length<4)passes.push(current);return passes;
}
