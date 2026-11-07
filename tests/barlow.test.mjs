import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultKit,validateKit,candidates,viewingPlan,describe,alignmentEyepiece} from '../prototype/eyepieces.js';
import {migrateKit} from '../prototype/kit-store.js';
import {fittedChoice,fitsEyepiece} from '../prototype/next-target.js';
test('the confirmed 2x Barlow is an accessory, with correct single-Barlow powers',()=>{
 const kit=defaultKit();assert.equal(kit.eyepieces.length,3);assert.equal(kit.barlows.length,1);const c=candidates(kit),at=(id,mm)=>c.find(e=>e.id===id&&e.mm===mm&&e.barlow);
 assert.equal(at('wide20',20).power,120);assert.equal(at('wide12_5',12.5).power,192);assert.equal(at('sv135',21).power,1200/21*2);assert.equal(Math.round(at('sv135',7).power),343);assert.equal(c.length,c.filter(e=>!e.barlow).length*2);assert.match(describe(at('wide20',20)),/SVBONY 2× Barlow.*120×/);
});
test('finding stays bare, equal-power native settings are preferred, and high recommendations remain capped',()=>{
 const k=defaultKit();assert.match(alignmentEyepiece(k),/20 mm.*60×/);assert.match(alignmentEyepiece(k),/without a Barlow/);
 for(const o of [{id:'Moon'},{id:'Saturn',type:'Planet'},{id:'Albireo',type:'Double star'}]){const p=viewingPlan(o,k,45);assert.equal(p.steps[0].choice.barlow,undefined);assert.ok(p.steps.every(s=>s.choice.power<=220));assert.ok(p.steps.some(s=>s.choice.barlow));}
 assert.equal(viewingPlan({id:'Saturn',type:'Planet'},k,45).steps[1].choice.barlow,undefined);
 assert.equal(viewingPlan({id:'Saturn',type:'Planet'},k,45).steps.at(-1).choice.power,192);
 assert.equal(viewingPlan({id:'M45',sizeArcmin:110},k,45).steps.length,1);assert.equal(viewingPlan({id:'Moon'},k,10).steps.length,1);assert.equal(viewingPlan({id:'Sun'},k,45).steps.length,0);
});
test('fitted Barlow is explicit, zoom focal length stays physical, and unsupported setups are never silently accepted',()=>{
 const k=defaultKit();assert.equal(fittedChoice(k,'wide20',20).power,60);const setup=fittedChoice(k,'wide20',20,'svbony2x');assert.equal(setup.power,120);assert.equal(setup.mm,20);assert.equal(setup.barlow.factor,2);assert.equal(fittedChoice(k,'sv135',12,'svbony2x').power,200);assert.equal(fitsEyepiece({id:'M45',sizeArcmin:110},setup),false);
 assert.equal(fittedChoice(k,'wide20',20,'missing'),null);k.barlows[0].enabled=false;assert.equal(fittedChoice(k,'wide20',20,'svbony2x'),null);assert.ok(candidates(k).every(e=>!e.barlow));
});
test('saved version 2 kits gain the owned accessory once without changing enabled lenses or focal length',()=>{
 const old=defaultKit();delete old.barlows;old.version=2;old.focalLength=1000;old.eyepieces[0].enabled=false;const k=migrateKit(old);assert.equal(k.barlows[0].factor,2);assert.equal(k.focalLength,1000);assert.equal(k.eyepieces[0].enabled,false);const removed=migrateKit({...k,version:3,barlows:[]});assert.deepEqual(removed.barlows,[]);
});
test('invalid or duplicate accessory multipliers cannot enter recommendations',()=>{
 for(const factor of [0,1,6,NaN]){const k=defaultKit();k.barlows[0].factor=factor;assert.throws(()=>validateKit(k));}const k=defaultKit();k.barlows.push({...k.barlows[0]});assert.throws(()=>validateKit(k));
});
