import test from 'node:test';
import assert from 'node:assert/strict';
import * as A from 'astronomy-engine';
import {localInstant,localParts,nightDate} from '../prototype/observing-time.js';
import {weatherSnapshot,weatherAt,assessWeather} from '../prototype/mission-weather.js';
import {buildMission,targetAssessment} from '../prototype/mission-engine.js';
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
test('clock changes reject missing times and consistently choose an earlier repeated time',()=>{
 assert.throws(()=>localInstant('2026-03-07',1590,'America/Edmonton'),/skipped/);
 assert.equal(localInstant('2026-10-31',1530,'America/Edmonton').toISOString(),'2026-11-01T07:30:00.000Z');
 assert.throws(()=>localInstant('2026-02-30',1260,'UTC'),/valid/);
});
test('a repeated forecast clock hour is left unverified rather than assigned guessed weather',()=>{
 const snap=weatherSnapshot({latitude:north.latitude,longitude:north.longitude,stamp:Date.parse('2026-10-31T20:00Z'),data:{timezone:'America/Edmonton',hourly:{time:['2026-11-01T01:00','2026-11-01T01:00','2026-11-01T02:00'],cloud_cover:[10,90,20]}}},north,Date.parse('2026-10-31T20:00Z'));
 assert.equal(weatherAt(snap,new Date('2026-11-01T07:30Z')),null);assert.equal(weatherAt(snap,new Date('2026-11-01T08:30Z')),null);assert.equal(weatherAt(snap,new Date('2026-11-01T09:30Z')).cloud_cover,20);
});
test('Friday mission differs by hemisphere and follows actual cloud windows',()=>{
 const n=buildMission(A,{site:north,snapshot:forecast(north,north.clockTimezone),night:'2026-10-30',zone:north.clockTimezone,anchor:localInstant('2026-10-30',1260,north.clockTimezone),live:false,minutes:90});
 const s=buildMission(A,{site:south,snapshot:forecast(south,south.clockTimezone),night:'2026-10-30',zone:south.clockTimezone,anchor:localInstant('2026-10-30',1260,south.clockTimezone),live:false,minutes:90});
 assert.ok(n.steps.length>=3&&s.steps.length>=3);assert.notDeepEqual(n.steps.map(t=>t.object.id),s.steps.map(t=>t.object.id));
 assert.ok(!n.steps.some(t=>['NGC104','PGC17223'].includes(t.object.id)));
 assert.ok(s.steps.some(t=>t.object.id==='NGC104'));
 for(const plan of [n,s]){assert.ok(plan.steps.length<=5);assert.equal(new Set(plan.steps.map(t=>t.object.id)).size,plan.steps.length);for(const stop of plan.steps){assert.ok(stop.alt>=20);assert.notEqual(stop.object.id,'Sun');}}
 const cloudy=buildMission(A,{site:north,snapshot:forecast(north,north.clockTimezone,95),night:'2026-10-30',zone:north.clockTimezone,anchor:localInstant('2026-10-30',1260,north.clockTimezone),live:false,minutes:90});assert.equal(cloudy.steps.length,0);
});
test('unknown weather, wrong locations and uncovered future nights never become invented missions',()=>{
 const snapshot=forecast(north,north.clockTimezone),base={site:north,night:'2026-10-30',zone:north.clockTimezone,anchor:localInstant('2026-10-30',1260,north.clockTimezone),live:false,minutes:90};
 assert.equal(buildMission(A,{...base,snapshot:null}).steps.length,0);
 assert.equal(buildMission(A,{...base,snapshot:forecast(south,south.clockTimezone)}).steps.length,0);
 assert.equal(buildMission(A,{...base,night:'2026-12-10',anchor:localInstant('2026-12-10',1260,north.clockTimezone),snapshot}).covered,false);
 assert.equal(assessWeather(null).usable,false);assert.equal(assessWeather({cloud_cover:null}).usable,false);
 assert.throws(()=>weatherSnapshot({latitude:-23.7,longitude:133.88,stamp:Date.now(),data:{}},north),/location/);
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
