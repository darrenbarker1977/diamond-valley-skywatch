import test from 'node:test';
import assert from 'node:assert/strict';
import {weatherSnapshot,coordinateKey} from '../prototype/mission-weather.js';
import {captureSightingWeather,validateSightingWeather,describeSightingWeather} from '../prototype/sighting-weather.js';
import {createSightingsStore,parseSightings,SIGHTINGS_FORMAT} from '../prototype/sightings-store.js';
const site={latitude:50.68,longitude:-114.25,clockTimezone:'America/Edmonton'},time=new Date('2026-11-04T03:35:00Z');
function forecast(){return weatherSnapshot({latitude:site.latitude,longitude:site.longitude,stamp:time.getTime()-20*60000,data:{timezone:'Etc/GMT+6',hourly:{time:['2026-11-03T21:00'],cloud_cover:[18],temperature_2m:[-4.5],dew_point_2m:[-5.5],relative_humidity_2m:[92],wind_speed_10m:[8],wind_gusts_10m:[14],precipitation_probability:[5]}}},site,time.getTime());}
const observation=()=>({id:'weather-test',objectId:'Saturn',observedAt:time.toISOString(),zone:'America/Edmonton',site:{...site,label:'My site',confirmed:true},eyepiece:{id:'wide20',name:'20 mm',mm:20,power:60}});
test('a matching hourly snapshot retains actual values and provenance in Alberta permanent UTC-6',()=>{
 const w=captureSightingWeather(forecast(),site,time);assert.equal(w.temperatureC,-4.5);assert.equal(w.windSpeedKmh,8);assert.equal(w.validLocalTime,'2026-11-03T21:00');assert.equal(w.source,'Open-Meteo');assert.equal(w.kind,'forecast');const text=describeSightingWeather(w,time);assert.match(text.summary,/18% cloud/);assert.match(text.summary,/elevated forecast dew risk/);assert.match(text.detail,/20 min old/);assert.match(text.detail,/not measured/);assert.match(text.detail,/9:00/);
});
test('wrong location/hour, ambiguous hours, unsafe Alberta winter clocks and future/expired runs never supply a snapshot',()=>{
 const f=forecast();for(const bad of [{...f,coordinateKey:coordinateKey({latitude:-23.7,longitude:133.88})},{...f,stamp:time.getTime()+600000},{...f,stamp:time.getTime()-8*86400000},{...f,zone:'America/Edmonton',clockRule:null},{...f,ambiguousHours:new Set(['2026-11-03T21'])}])assert.equal(captureSightingWeather(bad,site,time),null);
 assert.equal(captureSightingWeather(f,site,new Date('2026-11-04T04:35Z')),null);assert.equal(captureSightingWeather(null,site,time),null);
});
test('missing and invalid weather values stay absent; offline and old source age remain explicit',()=>{
 const f=forecast(),row=[...f.rows.values()][0];row.wind_speed_10m=-1;row.cloud_cover=null;row.temperature_2m=null;f.offline=true;f.cached=true;f.stamp=time.getTime()-4*3600000;const w=captureSightingWeather(f,site,time);assert.equal(w.windSpeedKmh,null);assert.equal(w.temperatureC,null);assert.equal(w.cloudCoverPct,null);const d=describeSightingWeather(w,time);assert.doesNotMatch(d.summary,/0% cloud/);assert.match(d.detail,/4.0 hours old/);assert.match(d.detail,/saved offline/);assert.match(d.detail,/older forecast/);
});
test('weather stays immutable through store snapshots, Undo-style removal, exports and mixed legacy imports',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},allowedIds=new Set(['Saturn']),store=createSightingsStore({storage,allowedIds});const r={...observation(),weather:captureSightingWeather(forecast(),site,time)};store.add(r);r.weather.temperatureC=20;assert.equal(store.snapshot().records[0].weather.temperatureC,-4.5);const copy=store.snapshot();copy.records[0].weather.temperatureC=30;assert.equal(store.snapshot().records[0].weather.temperatureC,-4.5);const backup=store.export().text;assert.equal(JSON.parse(backup).version,2);const removed=store.remove(r.id);store.add(removed);assert.deepEqual(parseSightings(backup,allowedIds),store.snapshot().records);const old={...observation(),id:'legacy'};store.restore(JSON.stringify({format:SIGHTINGS_FORMAT,version:1,records:[old]}));assert.ok(!Object.hasOwn(store.snapshot().records.find(x=>x.id==='legacy'),'weather'));assert.match(describeSightingWeather(undefined,time).summary,/older sighting/);assert.match(describeSightingWeather(null,time).summary,/No matching forecast/);
});
test('malformed or mismatched imported weather is rejected instead of corrupting history',()=>{
 const w=captureSightingWeather(forecast(),site,time);for(const bad of [{...w,source:'Invented'},{...w,cloudCoverPct:200},{...w,latitude:0},{...w,validLocalTime:'2026-11-03T22:00'},{...w,downloadedAt:'tomorrow'}])assert.throws(()=>validateSightingWeather(bad,time.toISOString(),site),/weather snapshot/);
});
test('hour matching also works with half-hour observing timezones',()=>{
 const s={latitude:-23.7,longitude:133.88,clockTimezone:'Australia/Darwin'},f=weatherSnapshot({latitude:s.latitude,longitude:s.longitude,stamp:time.getTime(),data:{timezone:'Australia/Darwin',hourly:{time:['2026-11-04T13:00'],cloud_cover:[10]}}},s,time.getTime());const w=captureSightingWeather(f,s,time);assert.equal(w.validLocalTime,'2026-11-04T13:00');assert.match(describeSightingWeather(w,time).detail,/1:00/);
});
