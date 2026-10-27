import test from 'node:test';
import assert from 'node:assert/strict';
import * as A from 'astronomy-engine';
import {catalogue} from '../prototype/catalogue.js';
import {shortlist} from '../prototype/forecast-targets.js';
import {positionFor} from '../prototype/sky-position.js';
import {matches} from '../prototype/positions.js';
import {defaultKit,viewingPlan} from '../prototype/eyepieces.js';

test('catalogue contains every Messier entry and valid unique sky positions',()=>{
 assert.ok(catalogue.length>200);
 assert.equal(new Set(catalogue.map(object=>object.id)).size,catalogue.length);
 for(let i=1;i<=110;i++)assert.ok(catalogue.some(object=>object.id==='M'+i),'Missing M'+i);
 for(const object of catalogue.filter(object=>!object.body)){
  assert.ok(Number.isFinite(object.ra)&&object.ra>=0&&object.ra<24,object.id+' RA');
  assert.ok(Number.isFinite(object.dec)&&Math.abs(object.dec)<=90,object.id+' declination');
  assert.ok(object.note&&object.type&&Array.isArray(object.aliases),object.id);
 }
});
test('southern names and catalogue aliases are searchable',()=>{
 for(const [id,query] of [['NGC104','47 tuc'],['NGC5139','omega centauri'],['PGC17223','LMC'],['NGC292','small magellanic'],['IC2602','southern pleiades'],['M110','ngc 205']])assert.ok(matches(catalogue.find(object=>object.id===id),query),query);
});
test('opposite hemispheres exclude physically inaccessible stars and clusters',()=>{
 const date=new Date('2026-10-30T12:00Z'),north={latitude:50.68,longitude:-114.25},south={latitude:-23.7,longitude:133.88};
 for(const id of ['Canopus','NGC104','NGC292','PGC17223'])assert.ok(positionFor(A,catalogue.find(object=>object.id===id),date,north).alt<0,id);
 assert.ok(positionFor(A,catalogue.find(object=>object.id==='Polaris'),date,south).alt<0);
});
test('Friday shortlists use the supplied local-evening instants and include real planets and southern targets',()=>{
 const northernTimes=Array.from({length:6},(_,i)=>new Date(Date.parse('2026-10-31T03:00Z')+i*1800000));
 const southernTimes=Array.from({length:12},(_,i)=>new Date(Date.parse('2026-10-30T08:30Z')+i*1800000));
 const north=shortlist(A,{latitude:50.68,longitude:-114.25},northernTimes);
 const south=shortlist(A,{latitude:-23.7,longitude:133.88},southernTimes);
 assert.ok(north.length>0&&north.length<=6&&south.length>0&&south.length<=6);
 assert.ok(south.some(target=>target.object.id==='NGC104'),'47 Tuc should be a strong southern choice');
 assert.ok(south.some(target=>target.object.id==='Saturn'));
 assert.notDeepEqual(north.map(target=>target.object.id),south.map(target=>target.object.id));
 for(const [items,times] of [[north,northernTimes],[south,southernTimes]])for(const item of items){
  assert.notEqual(item.object.id,'Sun');assert.ok(item.alt>=20);assert.ok(item.sunAltitude<=-6);
  assert.ok(times.some(time=>time.getTime()===item.date.getTime()));
 }
});
test('daylight gives no telescope targets and calculation failures remain explicit',()=>{
 assert.deepEqual(shortlist(A,{latitude:-23.7,longitude:133.88},[new Date('2026-10-30T03:00Z')]),[]);
 assert.throws(()=>shortlist(null,{latitude:0,longitude:0},[new Date()]),/library/);
 assert.throws(()=>positionFor(A,catalogue[0],new Date('invalid'),{latitude:0,longitude:0}),/Invalid/);
});
test('new southern target types get useful saved-kit plans',()=>{
 for(const id of ['NGC104','NGC4755','NGC3372','M57']){
  const plan=viewingPlan(catalogue.find(object=>object.id===id),defaultKit());
  assert.ok(plan.steps.length>0);assert.ok(plan.steps.every(step=>step.choice.power<=220));
  assert.doesNotMatch(plan.note,/this bright star/);
 }
 const kit=defaultKit();kit.eyepieces.push({id:'wide32',name:'New 32 mm',kind:'fixed',min:32,max:32,enabled:true});
 assert.equal(viewingPlan(catalogue.find(object=>object.id==='NGC104'),kit).steps[0].choice.id,'wide32');
});
