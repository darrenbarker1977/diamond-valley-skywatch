import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as A from 'astronomy-engine';
import {catalogue} from '../prototype/catalogue.js';
import {position,project,matches} from '../prototype/positions.js';
const fixtures=JSON.parse(readFileSync(new URL('./reference.json',import.meta.url)));
for(const row of fixtures)test(`${row.id} vs independent Astropy at ${row.time}`,()=>{
 const p=position(A,catalogue.find(o=>o.id===row.id),new Date(row.time));
 assert.ok(Math.abs(p.alt-row.alt)<row.tolerance,`altitude ${p.alt} vs ${row.alt}`);
 const diff=Math.abs(((p.az-row.az+540)%360)-180);
 assert.ok(diff<row.tolerance,`azimuth ${p.az} vs ${row.az}`);
});
test('search handles aliases, spaces, punctuation and no matches',()=>{
 assert.ok(matches(catalogue.find(o=>o.id==='M31'),'m 31'));
 assert.ok(matches(catalogue.find(o=>o.id==='NGC869'),'ngc 884'));
 assert.ok(matches(catalogue.find(o=>o.id==='M81'),'bodes'));
 assert.equal(catalogue.filter(o=>matches(o,'nonsense')).length,0);
});
test('map north, east, zenith and wraparound',()=>{
 assert.deepEqual(project({alt:90,az:0}),{x:200,y:200});
 assert.deepEqual(project({alt:0,az:0}),{x:200,y:34});
 assert.ok(Math.abs(project({alt:0,az:90}).x-366)<1e-10);
 assert.ok(Math.abs(project({alt:10,az:0}).x-project({alt:10,az:360}).x)<1e-10);
});
test('invalid time is rejected',()=>assert.throws(()=>position(A,catalogue[0],new Date('bad'))));
test('forecast source retains original Git blob identity',()=>{
 const data=readFileSync(new URL('../forecast.html',import.meta.url));
 const blob=createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex');
 assert.equal(blob,'b1c3ee54aad313c84e1e958bbc577851f61e5be2');
});
