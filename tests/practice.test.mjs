import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findDarkTime} from '../prototype/practice.js';
test('dark time search prefers deeper darkness, uses twilight fallback and reports polar daylight honestly',()=>{
 const start=new Date('2026-10-31T12:00:00Z');
 assert.equal(findDarkTime(start,t=>(t-start)/60000>=60?-15:0).toISOString(),'2026-10-31T13:00:00.000Z');
 assert.equal(findDarkTime(start,()=>-7).toISOString(),start.toISOString());
 assert.equal(findDarkTime(start,()=>20),null);
});
