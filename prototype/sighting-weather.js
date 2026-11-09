import {coordinateKey,weatherAt} from './mission-weather.js?v=abt-1';
import {localParts} from './observing-time.js?v=abt-1';
const fields={cloudCoverPct:['cloud_cover',0,100],temperatureC:['temperature_2m',-150,80],windSpeedKmh:['wind_speed_10m',0,500],windGustKmh:['wind_gusts_10m',0,500],humidityPct:['relative_humidity_2m',0,100],dewPointC:['dew_point_2m',-150,80],precipitationProbabilityPct:['precipitation_probability',0,100]};
const inRange=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
export function validateSightingWeather(value,observedAt,site){
 if(value===null)return null;
 const fail=()=>{throw Error('Invalid weather snapshot in the sightings file.');};
 if(!value||!['Open-Meteo','Environment Canada','Canadian GEM via Open-Meteo'].includes(value.source)||value.kind!=='forecast'||typeof value.zone!=='string'||value.zone.length>100||typeof value.downloadedAt!=='string'||typeof value.validLocalTime!=='string'||typeof value.offline!=='boolean'||typeof value.cached!=='boolean')return fail();
 const time=new Date(observedAt),stamp=new Date(value.downloadedAt);
 if(!Number.isFinite(stamp.getTime())||stamp.toISOString()!==value.downloadedAt||stamp-time>300000||time-stamp>7*86400000)return fail();
 if(!inRange(value.latitude,-90,90)||!inRange(value.longitude,-180,180)||coordinateKey(value)!==coordinateKey(site))return fail();
 if(!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(value.validLocalTime))return fail();
 let parts;try{parts=localParts(time,value.zone);}catch{return fail();}
 if(value.validLocalTime.slice(0,13)!==`${parts.date}T${String(parts.hour).padStart(2,'0')}`||Number(value.validLocalTime.slice(14,16))>parts.minute)return fail();
 const result={source:value.source,kind:'forecast',downloadedAt:value.downloadedAt,validLocalTime:value.validLocalTime,zone:value.zone,latitude:value.latitude,longitude:value.longitude,offline:value.offline,cached:value.cached};
 for(const [key,[,min,max]]of Object.entries(fields)){const v=value[key];if(v!==null&&!inRange(v,min,max))return fail();result[key]=v;}
 if(value.source==='Environment Canada'){
  if(typeof value.condition!=='string'||!value.condition||value.condition.length>1600||typeof value.forecastArea!=='string'||!value.forecastArea||value.forecastArea.length>120||!['hour','night'].includes(value.granularity)||!Number.isFinite(Date.parse(value.issuedAt))||Date.parse(value.issuedAt)>stamp.getTime()+300000||stamp-Date.parse(value.issuedAt)>36*3600000||value.cloudCoverPct!==null)return fail();
  Object.assign(result,{condition:value.condition,forecastArea:value.forecastArea,issuedAt:new Date(value.issuedAt).toISOString(),granularity:value.granularity});
 }else if(!Object.keys(fields).some(key=>result[key]!==null))return fail();
 return result;
}
export function captureSightingWeather(snapshot,site,time=new Date(),{offline=false}={}){
 try{
  if(!snapshot||snapshot.coordinateKey!==coordinateKey(site))return null;
  const row=weatherAt(snapshot,time);if(!row)return null;
  const result={source:row.source||'Open-Meteo',kind:'forecast',downloadedAt:new Date(snapshot.stamp).toISOString(),validLocalTime:row.time,zone:snapshot.zone,latitude:site.latitude,longitude:site.longitude,offline:!!snapshot.offline||offline,cached:!!snapshot.cached};
  for(const [key,[field,min,max]]of Object.entries(fields))result[key]=inRange(row[field],min,max)?row[field]:null;
  if(row.source==='Environment Canada')Object.assign(result,{condition:row.condition,forecastArea:row.area.name,issuedAt:row.issuedAt,granularity:row.granularity});
  return validateSightingWeather(result,new Date(time).toISOString(),site);
 }catch{return null;}
}
export function describeSightingWeather(value,observedAt){
 if(value===undefined)return {summary:'Weather was not recorded for this older sighting.',detail:''};
 if(value===null)return {summary:'No matching forecast was available when this sighting was saved.',detail:'The observation and selected eyepiece were still recorded. No weather values were invented.'};
 const parts=[];if(value.source==='Environment Canada')parts.push(value.condition+(value.granularity==='night'?' (night-wide outlook)':''));
 if(value.cloudCoverPct!==null)parts.push(Math.round(value.cloudCoverPct)+'% cloud');
 if(value.temperatureC!==null)parts.push(value.temperatureC.toFixed(1).replace(/\.0$/,'')+'°C');
 if(value.windSpeedKmh!==null)parts.push('wind '+Math.round(value.windSpeedKmh)+' km/h');
 if(value.windGustKmh!==null)parts.push('gusts '+Math.round(value.windGustKmh)+' km/h');
 if(value.humidityPct!==null)parts.push('humidity '+Math.round(value.humidityPct)+'%');
 if(value.dewPointC!==null)parts.push('dew point '+value.dewPointC.toFixed(1).replace(/\.0$/,'')+'°C');
 if(value.temperatureC!==null&&value.dewPointC!==null)parts.push(value.temperatureC-value.dewPointC<3?'elevated forecast dew risk':'lower forecast dew risk');
 if(value.precipitationProbabilityPct!==null)parts.push(Math.round(value.precipitationProbabilityPct)+'% rain/snow chance');
 const age=Math.max(0,Math.floor((new Date(observedAt)-new Date(value.downloadedAt))/60000));
 const label=DVSkyTime.formatter('en-CA',{timeZone:value.zone,month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'});
 // The validated source minute belongs to this observing hour, including half-hour timezones.
 const observed=new Date(observedAt),minutes=localParts(observed,value.zone).minute-Number(value.validLocalTime.slice(14,16));
 const validLabel=label.format(new Date(Math.floor(observed.getTime()/60000)*60000-minutes*60000)),ageLabel=age<60?age+' min':age<1440?(age/60).toFixed(1)+' hours':(age/1440).toFixed(1)+' days';
 return {summary:'Forecast · '+parts.join(' · '),detail:`${value.source}${value.forecastArea?' · '+value.forecastArea+' forecast area · issued '+label.format(new Date(value.issuedAt)):''} · forecast ${value.granularity==='night'?'night covering':'hour'} ${validLabel} · downloaded ${label.format(new Date(value.downloadedAt))} · ${ageLabel} old when recorded${value.offline?' · saved offline':value.cached?' · saved forecast':''}${age>=30?' · older forecast; conditions may differ':''}. Model forecast, not measured conditions at the telescope.`};
}
