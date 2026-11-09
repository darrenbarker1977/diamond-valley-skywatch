import {localParts,localInstant,addDays,nightDate} from './observing-time.js?v=abt-1';
const base='https://api.weather.gc.ca/collections/citypageweather-realtime/items';
const zones=new Set('Edmonton Vancouver Winnipeg Toronto Halifax Moncton Regina Swift_Current St_Johns Whitehorse Dawson Dawson_Creek Fort_Nelson Cambridge_Bay Inuvik Iqaluit Rankin_Inlet Resolute Yellowknife Atikokan Blanc-Sablon Creston Glace_Bay Goose_Bay Pangnirtung Rainy_River Thunder_Bay Nipigon Montreal'.split(' ').map(z=>'America/'+z));
export const canadianZone=zone=>zones.has(zone)||/^Canada\//.test(zone||'');
export function distanceKm(a,b){const r=Math.PI/180,p=(b.latitude-a.latitude)*r,l=(b.longitude-a.longitude)*r,x=Math.sin(p/2)**2+Math.cos(a.latitude*r)*Math.cos(b.latitude*r)*Math.sin(l/2)**2;return 12742*Math.asin(Math.sqrt(Math.min(1,x)));}
const en=v=>v?.en;
const number=(v,min,max)=>Number.isFinite(en(v))&&en(v)>=min&&en(v)<=max?en(v):null;
const measure=(v,unit,min,max)=>en(v?.units)===unit?number(v?.value,min,max):null;
const text=v=>typeof en(v)==='string'?en(v).slice(0,1600):'';
const fresh=(stamp,now,age)=>Number.isFinite(Date.parse(stamp))&&Date.parse(stamp)<=now+300000&&now-Date.parse(stamp)<=age;
export function conditionClass(condition){
 const s=(condition||'').toLowerCase();
 if(/rain|snow|flurr|shower|drizz|thunder|freezing|fog|smoke|haze|overcast/.test(s))return 'poor';
 if(/becoming|increasing|clearing|periods|partly|mix of|chance/.test(s))return 'mixed';
 if(/mainly cloudy|cloudy/.test(s))return 'poor';
 if(/clear|sunny|few clouds/.test(s))return 'good';
 return 'unknown';
}
function values(h){return {cloud_cover:null,temperature_2m:measure(h.temperature,'C',-150,80),wind_speed_10m:measure(h.wind?.speed,'km/h',0,500),wind_gusts_10m:measure(h.wind?.gust,'km/h',0,500),precipitation_probability:measure(h.lop,'%',0,100),snowfall:null,relative_humidity_2m:null,dew_point_2m:null};}
export function normalizeOfficial(feature,site,zone,now=Date.now()){
 const p=feature?.properties,c=feature?.geometry?.coordinates,area={latitude:c?.[1],longitude:c?.[0],name:text(p?.name),kind:p?.coordinateForecast?'coordinate':'city'};
 if(!canadianZone(zone)||!Number.isFinite(area.latitude)||!Number.isFinite(area.longitude)||Math.abs(area.latitude)>90||Math.abs(area.longitude)>180||!area.name||distanceKm(site,area)>2.5)throw Error('No suitable nearby Canadian forecast area.');
 const hours=[],nights=[],hourIssued=en(p.hourlyForecastGroup?.timestamp),dailyIssued=en(p.forecastGroup?.timestamp);
 if(fresh(hourIssued,now,18*3600000))for(const h of p.hourlyForecastGroup?.hourlyForecasts||[]){
  if(!fresh(h.timestamp,now,2*86400000)&&Date.parse(h.timestamp)<now)continue;
  if(!Number.isFinite(Date.parse(h.timestamp))||Math.abs(Date.parse(h.timestamp)-now)>3*86400000)continue;
  const q=localParts(h.timestamp,zone),time=q.date+'T'+String(q.hour).padStart(2,'0')+':'+String(q.minute).padStart(2,'0'),condition=text(h.condition);if(!condition)continue;
  hours.push({time,instant:new Date(h.timestamp).toISOString(),condition,issuedAt:new Date(hourIssued).toISOString(),granularity:'hour',...values(h)});
 }
 if(fresh(dailyIssued,now,36*3600000)){
  const start=localParts(dailyIssued,zone);let cursor=start.date;
  for(const f of p.forecastGroup?.forecasts||[]){
   const period=text(f.period?.value)||text(f.period?.textForecastName),night=/night|tonight/i.test(period),day=period.match(/Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday/i)?.[0];
   if(!day)continue;
   if(!nights.length&&night&&start.hour<6&&new Date(addDays(start.date,-1)+'T12:00Z').toLocaleDateString('en',{weekday:'long',timeZone:'UTC'}).toLowerCase()===day.toLowerCase())cursor=addDays(start.date,-1);
   for(let i=0;i<7&&new Date(cursor+'T12:00Z').toLocaleDateString('en',{weekday:'long',timeZone:'UTC'}).toLowerCase()!==day.toLowerCase();i++)cursor=addDays(cursor,1);
   if(!night)continue;
   const condition=text(f.abbreviatedForecast?.textSummary),summary=text(f.textSummary),cloudText=text(f.cloudPrecip)||condition;
   if(condition)nights.push({date:cursor,condition,summary,cloudText,issuedAt:new Date(dailyIssued).toISOString(),granularity:'night',low:number(f.temperatures?.temperature?.find(t=>en(t.class)==='low')?.value,-150,80),windGust:Math.max(0,...(f.winds?.periods||[]).map(w=>number(w.gust?.value,0,500)||0))||null});
  }
 }
 if(!hours.length&&!nights.length)throw Error('The nearby official forecast is missing or too old.');
 return {version:1,latitude:site.latitude,longitude:site.longitude,zone,area,distanceKm:distanceKm(site,area),downloadedAt:new Date(now).toISOString(),hours,nights};
}
export function checkedOfficial(value,site,zone,now=Date.now()){
 try{
  if(!value||!Number.isFinite(value.latitude)||!Number.isFinite(value.longitude)||value.version!==1||value.zone!==zone||!canadianZone(zone)||Math.abs(value.latitude-site.latitude)>.00001||Math.abs(value.longitude-site.longitude)>.00001||!fresh(value.downloadedAt,now,7*86400000)||typeof value.area?.name!=='string'||value.area.name.length>120||!Number.isFinite(value.area.latitude)||!Number.isFinite(value.area.longitude)||distanceKm(site,value.area)>2.5||!Array.isArray(value.hours)||value.hours.length>72||!Array.isArray(value.nights)||value.nights.length>10)return null;
  const hours=value.hours.filter(h=>typeof h.time==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(h.time)&&typeof h.condition==='string'&&h.condition.length<=1600&&['temperature_2m','wind_speed_10m','wind_gusts_10m','precipitation_probability','snowfall','relative_humidity_2m','dew_point_2m'].every(k=>h[k]===null||Number.isFinite(h[k]))&&fresh(h.issuedAt,now,18*3600000)&&Number.isFinite(Date.parse(h.instant))&&(()=>{const p=localParts(h.instant,zone);return h.time===`${p.date}T${String(p.hour).padStart(2,'0')}:${String(p.minute).padStart(2,'0')}`;})()).map(h=>({...h,granularity:'hour',cloud_cover:null}));
  const nights=value.nights.filter(n=>/^\d{4}-\d{2}-\d{2}$/.test(n.date)&&['condition','summary','cloudText'].every(k=>typeof n[k]==='string'&&n[k].length<=1600)&&fresh(n.issuedAt,now,36*3600000));
  return hours.length||nights.length?{...value,hours,nights}:null;
 }catch{return null;}
}
export function officialAt(official,time,zone,now=Date.now()){
 if(!official)return null;const p=localParts(time,zone),hour=p.date+'T'+String(p.hour).padStart(2,'0');
 const h=official.hours.find(h=>h.time.slice(0,13)===hour&&Math.abs(new Date(time)-new Date(h.instant))<3600000&&new Date(h.instant)<=new Date(time)&&fresh(h.issuedAt,now,18*3600000));
 if(h)return {...h,source:'Environment Canada',area:official.area};
 const n=official.nights.find(n=>n.date===nightDate(time,zone)&&fresh(n.issuedAt,now,36*3600000));
 if(n&&(p.hour>=18||p.hour<6))return {...values({}),time:p.date+'T'+String(p.hour).padStart(2,'0')+':00',condition:n.cloudText,summary:n.summary,source:'Environment Canada',area:official.area,issuedAt:n.issuedAt,granularity:'night',wind_gusts_10m:n.windGust};
 return null;
}
export function officialAssessment(row){
 if(row?.source!=='Environment Canada')return null;
 const kind=conditionClass(row.condition),label='Environment Canada'+(row.granularity==='night'?' · night-wide outlook':'')+': '+row.condition;
 if(kind==='unknown')return {known:false,usable:false,reason:label+' · check the official forecast.'};
 if(row.precipitation_probability>30||row.wind_gusts_10m>42||row.wind_speed_10m>35)return {known:true,usable:false,reason:label+' · precipitation or wind caution.'};
 return {known:true,usable:kind==='good'||kind==='mixed',reason:label+(kind==='mixed'?' · variable cloud; check for openings.':kind==='poor'?' · poor observing outlook.':' · check actual skies.')};
}
export async function fetchOfficial(site,zone,{signal,fetcher=fetch,now=Date.now()}={}){
 if(!canadianZone(zone))return {data:null,note:'Worldwide forecast · Open-Meteo'};
 if(distanceKm(site,{latitude:50.68,longitude:-114.25})<=2.5){
  try{const r=await fetcher(new URL('../data/weather-diamond-valley.json',import.meta.url),{cache:'no-store',signal});if(r.ok){const saved=await r.json();if(saved.version===1&&fresh(saved.fetchedAt,now,3*3600000)&&Math.abs(saved.requested?.latitude-50.68)<.00001&&Math.abs(saved.requested?.longitude+114.25)<.00001){const data=normalizeOfficial(saved.feature,site,zone,now);data.cacheFetchedAt=saved.fetchedAt;return {data,note:''};}}}catch{}
 }
 const dy=.023,dx=dy/Math.max(.2,Math.cos(site.latitude*Math.PI/180)),u=new URL(base);u.search=new URLSearchParams({f:'json',lang:'en',limit:'50',bbox:[site.longitude-dx,site.latitude-dy,site.longitude+dx,site.latitude+dy].join(',')});
 const resp=await fetcher(u,{cache:'no-store',signal});if(!resp.ok)throw Error('Environment Canada HTTP '+resp.status);
 const body=await resp.json();if(!Array.isArray(body.features)||body.features.length>50||body.numberMatched>50)throw Error('Official forecast-area lookup was incomplete.');
 const candidates=body.features.map(f=>{const c=f.geometry?.coordinates;return {f,d:distanceKm(site,{latitude:c?.[1],longitude:c?.[0]})};}).filter(x=>Number.isFinite(x.d)&&x.d<=2.5).sort((a,b)=>a.d-b.d);
 if(!candidates.length)throw Error('No official Canadian forecast area within 2.5 km.');
 // Never silently substitute a farther area's forecast if the nearest area is stale.
 return {data:normalizeOfficial(candidates[0].f,site,zone,now),note:''};
}
export function officialEvening(date,official,zone,now=Date.now()){
 if(!official)return null;
 const rows=Array.from({length:6},(_,i)=>officialAt(official,localInstant(date,(18+i)*60,zone),zone,now)),hourly=rows.every(r=>r?.granularity==='hour');
 const night=official.nights.find(n=>n.date===date&&fresh(n.issuedAt,now,36*3600000));if(!hourly&&!night)return null;
 const condition=hourly?[...new Set(rows.map(r=>r.condition))].join(' → '):night.cloudText,kind=conditionClass(condition);
 let best=null;if(hourly){let run=[];for(let i=0;i<rows.length;i++){if(officialAssessment(rows[i]).usable){run.push(i);if(run.length>=2&&(!best||run.length>best.length))best=[...run];}else run=[];}}
 const cautioned=hourly?rows.some(r=>r.precipitation_probability>30||r.wind_gusts_10m>42||r.wind_speed_10m>35):night.windGust>42;
 const outlook=kind==='unknown'?'PENDING':kind==='poor'||cautioned?'SKIP':kind==='good'?'GREEN LIGHT':'MAYBE';
 return {rows:hourly?rows:null,night,condition,kind,best,outlook,issuedAt:hourly?rows[0].issuedAt:night.issuedAt,summary:night?.summary||condition,area:official.area,distanceKm:official.distanceKm};
}
