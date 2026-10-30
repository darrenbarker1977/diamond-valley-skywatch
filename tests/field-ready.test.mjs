import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {defaultKit} from '../prototype/eyepieces.js';
import {fittedChoice,fitsEyepiece,nextWithEyepiece} from '../prototype/next-target.js';
import {phaseShape} from '../prototype/moon-photo.js';
import {warmth} from '../prototype/haptic-guide.js';
const A=createRequire(import.meta.url)('astronomy-engine');
test('same-eyepiece candidates use the actual location and time, and exclude large targets at high power',()=>{
 const kit=defaultKit(),wide=fittedChoice(kit,'supplied25',25),zoom=fittedChoice(kit,'sv135',9.5);
 assert.equal(wide.power,48);assert.equal(zoom.mm,9.5);assert.equal(zoom.power,1200/9.5);
 assert.equal(fitsEyepiece({id:'M45',sizeArcmin:110},zoom),false);
 const site={latitude:50.68,longitude:-114.25,height:0};
 const night=nextWithEyepiece(A,site,'2026-10-27T03:00Z',wide,['Moon']);assert.ok(night.length>0);assert.ok(night.every(x=>x.alt>=20&&x.object.id!=='Sun'&&x.object.id!=='Moon'));
 assert.deepEqual(nextWithEyepiece(A,site,'2026-10-27T19:00Z',wide),[]);
 const south=nextWithEyepiece(A,{latitude:-23.7,longitude:133.88,height:0},'2026-10-30T12:00Z',wide);
 assert.ok(south.some(x=>['NGC104','NGC5139','NGC292','PGC17223','Canopus'].includes(x.object.id)));assert.notDeepEqual(south.map(x=>x.object.id),night.map(x=>x.object.id));
 kit.eyepieces[0].enabled=false;assert.equal(fittedChoice(kit,'supplied25',25),null);assert.equal(fittedChoice(kit,'sv135',6),null);assert.equal(fittedChoice(kit,'sv135',NaN),null);
});
test('photographic phase clipping has the correct illuminated area and waxing/waning side',()=>{
 for(const phase of [0,10,45,90,120,180,220,270,320,359]){
  const points=phaseShape(phase).split(' ').map(p=>p.split(',').map(Number));
  const area=Math.abs(points.reduce((sum,a,i)=>{const b=points[(i+1)%points.length];return sum+a[0]*b[1]-b[0]*a[1];},0)/2);
  assert.ok(Math.abs(area/(Math.PI*2500)-(1-Math.cos(phase*Math.PI/180))/2)<.003);
 }
 assert.ok(phaseShape(90).split(' ').every(p=>Number(p.split(',')[0])>=50));
 assert.ok(phaseShape(270).split(' ').every(p=>Number(p.split(',')[0])<=50));
 assert.throws(()=>phaseShape(NaN));
});
test('hotter guidance speeds up toward the target and the near signal never claims a lock',()=>{
 const bands=[40,25,12,5].map(warmth);assert.ok(bands.every((b,i)=>i===0||b.interval<bands[i-1].interval));
 assert.match(warmth(2).label,/not a lock/);assert.deepEqual(warmth(2).pattern,[25,80,25]);assert.equal(warmth(NaN),null);assert.equal(warmth(-1),null);
});
