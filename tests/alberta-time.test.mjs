import {test} from 'node:test';import assert from 'node:assert/strict';
import {localParts,localInstant,localLabel} from '../prototype/observing-time.js';
import {weatherSnapshot,weatherAt} from '../prototype/mission-weather.js';
const zone='America/Edmonton';
test('Alberta stays UTC-6 after Nov 1 2026, including 8:34 pm and local midnight',()=>{
 assert.deepEqual(localParts(new Date('2026-11-02T02:34:00Z'),zone),{date:'2026-11-01',hour:20,minute:34});assert.match(localLabel(new Date('2026-11-02T02:34:00Z'),zone),/8:34.*ABT/);assert.equal(localInstant('2026-11-01',1234,zone).toISOString(),'2026-11-02T02:34:00.000Z');
 assert.deepEqual(localParts(new Date('2026-11-02T05:59:00Z'),zone),{date:'2026-11-01',hour:23,minute:59});assert.deepEqual(localParts(new Date('2026-11-02T06:00:00Z'),zone),{date:'2026-11-02',hour:0,minute:0});
 assert.equal(localInstant('2026-12-01',1260,zone).toISOString(),'2026-12-02T03:00:00.000Z');assert.equal(localInstant('2027-03-14',150,zone).toISOString(),'2027-03-14T08:30:00.000Z');
});
test('old Alberta DST history and other world locations keep their own rules',()=>{
 assert.equal(localInstant('2025-11-01',1530,zone).toISOString(),'2025-11-02T07:30:00.000Z');assert.throws(()=>localInstant('2025-03-09',150,zone),/skipped/);assert.equal(localInstant('2026-10-31',1260,zone).toISOString(),'2026-11-01T03:00:00.000Z');
 assert.deepEqual(localParts(new Date('2026-11-02T02:34:00Z'),'Australia/Darwin'),{date:'2026-11-02',hour:12,minute:4});assert.deepEqual(localParts(new Date('2026-11-02T02:34:00Z'),'America/Denver'),{date:'2026-11-01',hour:19,minute:34});
});
test('Alberta fixed-zone requests do not double-shift current data and stale clock forecasts remain unverified',()=>{
 const T=globalThis.DVSkyTime,time=new Date('2026-11-02T02:34:00Z');assert.equal(T.requestZone(zone,time),'Etc/GMT+6');assert.equal(T.requestZone('Australia/Darwin',time),'Australia/Darwin');assert.equal(T.requestZone(zone,new Date('2026-10-31T02:34Z')),zone);
 const site={latitude:50.68,longitude:-114.25,clockTimezone:zone},data={timezone:zone,hourly:{time:['2026-11-01T19:00','2026-11-01T20:00'],cloud_cover:[91,7]}};
 const before=weatherSnapshot({latitude:site.latitude,longitude:site.longitude,stamp:time.getTime(),data},site,time.getTime());assert.equal(weatherAt(before,time),null);
 const current=weatherSnapshot({latitude:site.latitude,longitude:site.longitude,stamp:time.getTime(),data:{...data,clock_rule:T.RULE}},site,time.getTime());assert.equal(weatherAt(current,time).cloud_cover,7);assert.notEqual(before.dataSignature,current.dataSignature);assert.equal(T.formatter('en-CA',{timeZone:T.FIXED,hour:'numeric',minute:'2-digit'}).format(time).includes('8:34'),true);
});
