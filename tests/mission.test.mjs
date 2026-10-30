import test from 'node:test';
import assert from 'node:assert/strict';
import * as A from 'astronomy-engine';
import {localInstant,localParts,nightDate} from '../prototype/observing-time.js';
import {weatherSnapshot,weatherAt,assessWeather} from '../prototype/mission-weather.js';
import {buildMission,targetAssessment,missionStopCount} from '../prototype/mission-engine.js';
const north={latitude:50.68,longitude:-114.25,height:0,clockTimezone:'America/Edmonton'},south={latitude:-23.7,longitude:133.88,height:545,clockTimezone:'Australia/Darwin'};
function forecast(site,zone,cloud=10){
 const time=[];for(let day=26;day<=31;day++)for(let h=0;h<24;h++)time.push(`2026-10-${day}T${String(h).padStart(2,'0')}:00`);
 const hourly={time,cloud_cover:time.map(()=>cloud),precipitation_probability:time.map(()=>0),snowfall:time.map(()=>0),wind_gusts_10m:time.map(()=>10)};
 return weatherSnapshot({latitude:site.latitude,longitude:site.longitude,stamp:Date.parse('2026-10-27T03:00Z'),data:{timezone:zone,hourly}},site,Date.parse('2026-10-27T03:00Z'));
}
test('worldwide local nights respect UTC offsets and midnight',()=>{
 assert.equal(localInstant('2026-10-30',1260,'America/Edmonton').toISOString(),'2026-10-31T03:00:00.000Z');
 assert.equal(localInstant('2026-10-30',1260,'Australia/Darwin').toISOString(),'2026-10-30T11:30:00.000Z');
 assert.equal(localInstant('2026-10-30',1530,'Australia/Darwin').toISOString(),'2026-10-30T16:00:00.000Z');
 assert.equal(nightDate(new Date('2026-10-31T16:00Z'),'Australia/Darwin'),'2026-10-31');
 assert.deepEqual(localParts(localInstant('2026-10-30',1530,'Australia/Darwin'),'Australia/Darwin'),{date:'2026-10-31',hour:1,minute:30});
});
// Historical transitions keep this regression independent of future timezone-law updates.
test('clock changes reject missing times and consistently choose an earlier repeated time',()=>{
 assert.throws(()=>localInstant('2025-03-08',1590,'America/Edmonton'),/skipped/);
 assert.equal(localInstant('2025-11-01',1530,'America/Edmonton').toISOString(),'2025-11-02T07:30:00.000Z');
 assert.throws(()=>localInstant('2026-02-30',1260,'UTC'),/valid/);
});
test('a repeated forecast clock hour is left unverified rather than assigned guessed weather',()=>{
 const snap=weatherSnapshot({latitude:north.latitude,longitude:north.longitude,stamp:Date.parse('2025-11-01T20:00Z'),data:{timezone:'America/Edmonton',hourly:{time:['2025-11-02T01:00','2025-11-02T01:00','2025-11-02T02:00'],cloud_cover:[10,90,20]}}},north,Date.parse('2025-11-01T20:00Z'));
 assert.equal(weatherAt(snap,new Date('2025-11-02T07:30Z')),null);assert.equal(weatherAt(snap,new Date('2025-11-02T08:30Z')),null);assert.equal(weatherAt(snap,new Date('2025-11-02T09:30Z')).cloud_cover,20);
});
test('Friday mission differs by hemisphere and follows actual cloud windows',()=>{
 const n=buildMission(A,{site:north,snapshot:forecast(north,north.clockTimezone),night:'2026-10-30',zone:north.clockTimezone,anchor:localInstant('2026-10-30',1260,north.clockTimezone),live:false,minutes:90});
 const s=buildMission(A,{site:south,snapshot:forecast(south,south.clockTimezone),night:'2026-10-30',zone:south.clockTimezone,anchor:localInstant('2026-10-30',1260,south.clockTimezone),live:false,minutes:90});
 assert.ok(n.steps.length>=3&&s.steps.length>=3);assert.notDeepEqual(n.steps.map(t=>t.object.id),s.steps.map(t=>t.object.id));
 assert.ok(!n.steps.some(t=>['NGC104','PGC17223'].includes(t.object.id)));
 assert.ok(s.steps.some(t=>t.object.id==='NGC104'));
 for(const plan of [n,s]){assert.ok(plan.steps.length<=5);assert.equal(new Set(plan.steps.map(t=>t.object.id)).size,plan.steps.length);for(const stop of plan.steps){assert.ok(stop.alt>=20);assert.notEqual(stop.object.id,'Sun');}}
 const cloudy=buildMission(A,{site:north,snapshot:forecast(north,north.clockTimezone,95),night:'2026-10-30',zone:north.clockTimezone,anchor:localInstant('2026-10-30',1260,north.clockTimezone),live:false,minutes:90});assert.ok(cloudy.steps.length>=3);assert.equal(cloudy.weatherCaution,true);assert.ok(cloudy.steps.every(s=>s.weather.cloud_cover===95));
});
test('unknown weather, wrong locations and uncovered nights keep real sky tours without invented conditions',()=>{
 const snapshot=forecast(north,north.clockTimezone),base={site:north,night:'2026-10-30',zone:north.clockTimezone,anchor:localInstant('2026-10-30',1260,north.clockTimezone),live:false,minutes:90};
 for(const snapshot of [null,forecast(south,south.clockTimezone)]){const tour=buildMission(A,{...base,snapshot});assert.ok(tour.steps.length>=3);assert.ok(tour.steps.every(s=>s.weather===null));assert.match(tour.weatherNotice,/unavailable/);}
 assert.equal(buildMission(A,{...base,night:'2026-12-10',anchor:localInstant('2026-12-10',1260,north.clockTimezone),snapshot}).covered,false);
 assert.equal(assessWeather(null).usable,false);assert.equal(assessWeather({cloud_cover:null}).usable,false);
 assert.throws(()=>weatherSnapshot({latitude:-23.7,longitude:133.88,stamp:Date.now(),data:{}},north),/location/);
});

test('arbitrary short and long sessions stay inside their exact time budget',()=>{
 const anchor=localInstant('2026-10-30',1267,north.clockTimezone),base={site:north,snapshot:null,night:'2026-10-30',zone:north.clockTimezone,anchor,live:false};
 for(const minutes of [1,7,15,30,97,180,719]){const tour=buildMission(A,{...base,minutes});assert.ok(tour.steps.length>0);assert.ok(tour.steps.length<=missionStopCount(minutes));assert.ok(tour.end<=new Date(anchor.getTime()+minutes*60000));assert.ok(tour.steps.every(s=>s.date>=anchor&&s.date<tour.end));}
 assert.equal(missionStopCount(15),1);assert.equal(missionStopCount(30),2);for(const minutes of [0,-1,1.5,720,NaN])assert.throws(()=>buildMission(A,{...base,minutes}),/duration/);
});

test('daylight live tours show a real after-dusk start even with full cloud; no daytime guidance',()=>{
 const anchor=localInstant('2026-10-27',1050,north.clockTimezone),snapshot=forecast(north,north.clockTimezone,100),base={site:north,snapshot,night:'2026-10-27',zone:north.clockTimezone,anchor,minutes:15};
 const live=buildMission(A,{...base,live:true});assert.equal(live.steps.length,1);assert.ok(live.start>anchor);assert.match(live.reason,/after dusk/);assert.equal(targetAssessment(A,north,snapshot,live.steps[0].object.id,anchor).usable,false);
 const planned=buildMission(A,{...base,live:false});assert.equal(planned.steps.length,0);assert.match(planned.reason,/too bright/);
});
test('live missions discard elapsed stops and keep excluded current or previous targets out of upcoming stops',()=>{
 const snapshot=forecast(north,north.clockTimezone),time=localInstant('2026-10-30',1260,north.clockTimezone),base={site:north,snapshot,night:'2026-10-30',zone:north.clockTimezone,anchor:time,live:true,minutes:90};
 const first=buildMission(A,base),current=first.steps[0].object.id,next=buildMission(A,{...base,anchor:new Date(time.getTime()+31*60000),excluded:[current]});
 assert.ok(next.steps.every(t=>t.date.getTime()>=time.getTime()+31*60000));assert.ok(!next.steps.some(t=>t.object.id===current));
 assert.ok(targetAssessment(A,north,snapshot,current,time).position);
 assert.equal(weatherAt(snapshot,time).cloud_cover,10);
});
test('a started session retains its deadline and remaining stop budget as live recommendations update',()=>{
 const time=localInstant('2026-10-30',1260,north.clockTimezone),endAt=new Date(time.getTime()+60*60000),base={site:north,snapshot:forecast(north,north.clockTimezone),night:'2026-10-30',zone:north.clockTimezone,live:true,minutes:90,endAt,maxStops:2};
 const route=buildMission(A,{...base,anchor:new Date(time.getTime()+20*60000)});assert.ok(route.steps.length<=2);assert.ok(route.steps.every(step=>step.date<endAt));
 const ended=buildMission(A,{...base,anchor:new Date(endAt.getTime()+60000)});assert.equal(ended.steps.length,0);assert.match(ended.reason,/session time has finished/);
 assert.match(buildMission(A,{...base,anchor:time,maxStops:0}).reason,/route is complete/);
});

test('a clearer hour is preferred within the first stop slot without changing the session',()=>{
 const snapshot=forecast(north,north.clockTimezone,95);for(const row of snapshot.rows.values())if(row.time==='2026-10-30T22:00')row.cloud_cover=10;
 const anchor=localInstant('2026-10-30',1305,north.clockTimezone),tour=buildMission(A,{site:north,snapshot,night:'2026-10-30',zone:north.clockTimezone,anchor,live:false,minutes:90});
 assert.equal(tour.steps[0].weather.cloud_cover,10);assert.ok(tour.steps.every(s=>s.date>=anchor&&s.date<tour.end));assert.equal(tour.end.getTime()-anchor.getTime(),90*60000);
});
