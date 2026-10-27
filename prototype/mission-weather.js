import {localParts} from './observing-time.js';
export const weatherKey=site=>site.source==='default'?'dvsky:weather:v5':`dvsky:weather:v6:${site.latitude.toFixed(5)}:${site.longitude.toFixed(5)}`;
export const coordinateKey=site=>`${site.latitude.toFixed(5)}:${site.longitude.toFixed(5)}`;
const fields=['cloud_cover','precipitation_probability','snowfall','wind_gusts_10m','temperature_2m'];
export function weatherSnapshot(message,site,now=Date.now()){
 if(!message||!Number.isFinite(message.latitude)||!Number.isFinite(message.longitude)||Math.abs(message.latitude-site.latitude)>.00001||Math.abs(message.longitude-site.longitude)>.00001)throw Error('Forecast location does not match the selected site.');
 if(!Number.isFinite(message.stamp)||message.stamp>now+300000||now-message.stamp>7*86400000)throw Error('No recent downloaded forecast is available.');
 const h=message.data?.hourly,zone=message.data?.timezone||site.clockTimezone;
 new Intl.DateTimeFormat('en',{timeZone:zone});
 if(!Array.isArray(h?.time)||!h.time.length||h.time.length>500)throw Error('Hourly forecast is missing or invalid.');
 const rows=new Map(),ambiguousHours=new Set();
 h.time.forEach((time,index)=>{
  if(typeof time!=='string'||!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)||!Number.isFinite(Date.parse(time+'Z'))||new Date(time+'Z').toISOString().slice(0,16)!==time)throw Error('Hourly forecast contains an invalid time.');
  if(rows.has(time)){ambiguousHours.add(time.slice(0,13));return;}
  const row={time};for(const key of fields){const value=h[key]?.[index];row[key]=Number.isFinite(value)?value:null;}
  if(row.cloud_cover!==null&&(row.cloud_cover<0||row.cloud_cover>100))row.cloud_cover=null;
  if(row.precipitation_probability!==null&&(row.precipitation_probability<0||row.precipitation_probability>100))row.precipitation_probability=null;
  if(row.wind_gusts_10m!==null&&row.wind_gusts_10m<0)row.wind_gusts_10m=null;
  if(row.snowfall!==null&&row.snowfall<0)row.snowfall=null;
  rows.set(time,row);
 });
 return {rows,ambiguousHours,zone,stamp:message.stamp,offline:!!message.offline,cached:!!message.cached,error:typeof message.error==='string'?message.error.slice(0,180):'',coordinateKey:coordinateKey(site),dataSignature:JSON.stringify([message.stamp,zone,[...rows.values()],[...ambiguousHours]]),signature:JSON.stringify([message.stamp,!!message.offline,!!message.cached,zone,[...rows.values()],[...ambiguousHours]])};
}
export function savedWeather(site,now=Date.now()){
 try{const saved=JSON.parse(globalThis.localStorage?.getItem(weatherKey(site))||'null');if(saved)return weatherSnapshot({...saved,latitude:site.latitude,longitude:site.longitude,cached:true,offline:globalThis.navigator?.onLine===false},site,now);}catch{}
 return null;
}
export function weatherAt(snapshot,time){
 if(!snapshot)return null;
 const p=localParts(time,snapshot.zone),hour=`${p.date}T${String(p.hour).padStart(2,'0')}`;
 if(snapshot.ambiguousHours?.has(hour))return null;
 let found=null;for(const row of snapshot.rows.values())if(row.time.slice(0,13)===hour&&Number(row.time.slice(14,16))<=p.minute&&(!found||row.time>found.time))found=row;
 return found;
}
export function assessWeather(row){
 if(!row||!Number.isFinite(row.cloud_cover))return {usable:false,known:false,reason:'No verified hourly cloud forecast for this time.'};
 if(row.cloud_cover>55)return {usable:false,known:true,reason:`Cloud forecast ${Math.round(row.cloud_cover)}% — wait for a clearer window.`};
 if(row.precipitation_probability!==null&&row.precipitation_probability>30)return {usable:false,known:true,reason:'Rain or snow probability is too high for this mission window.'};
 if(row.snowfall!==null&&row.snowfall>.09)return {usable:false,known:true,reason:'Snowfall is forecast; protect the telescope and wait.'};
 if(row.wind_gusts_10m!==null&&row.wind_gusts_10m>42)return {usable:false,known:true,reason:'Strong gusts are forecast; wait for calmer conditions.'};
 return {usable:true,known:true,reason:`${Math.round(row.cloud_cover)}% cloud forecast${row.wind_gusts_10m===null||row.precipitation_probability===null?' · some weather fields unavailable':''}`};
}
