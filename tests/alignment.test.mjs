import test from 'node:test';
import assert from 'node:assert/strict';
import {skyVector,skyAngles,angle,deviceAxis,solveAlignment,applyRotation,validateAlignment,guidance,stableSample} from '../prototype/alignment.js';
import {easyTargets} from '../prototype/easy-targets.js';
import {OrientationSession} from '../prototype/sensors.js';
import * as A from 'astronomy-engine';
import {catalogue} from '../prototype/catalogue.js';
import {position} from '../prototype/positions.js';
const close=(a,b,t=1e-5)=>assert.ok(Math.abs(a-b)<t,`${a} vs ${b}`);
function sample(id,alt,az){return {id,measured:skyVector({alt,az:az+23}),target:skyVector({alt,az})};}
test('camera and strapped top-edge axes match W3C rotation, including roll and azimuth wrap',()=>{
 for(const az of [0,45,180,359])for(const alt of [-20,0,45,70]){
  close(angle(deviceAxis({alpha:-az,beta:90+alt,gamma:0},'handheld'),skyVector({alt,az})),0);
  close(angle(deviceAxis({alpha:-az,beta:alt,gamma:60},'mounted'),skyVector({alt,az})),0);
 }
 close(skyAngles(deviceAxis({alpha:0,beta:0,gamma:-90},'handheld')).az,90);
 assert.throws(()=>deviceAxis({alpha:null,beta:0,gamma:0},'handheld'));
});
test('two-object full 3D frame alignment generalizes to independent targets',()=>{
 const rot=[[0,-1,0],[0.8660254,0,-0.5],[0.5,0,0.8660254]];
 const first={id:'a',measured:skyVector({alt:30,az:5})},second={id:'b',measured:skyVector({alt:40,az:110})};
 for(const s of [first,second])s.target=applyRotation(rot,s.measured);
 const model=solveAlignment(first,second);
 for(const p of [{alt:50,az:220},{alt:12,az:305}]){const v=skyVector(p);close(angle(applyRotation(model.rotation,v),applyRotation(rot,v)),0);}
});
test('alignment rejects close, opposite or distorted pairs',()=>{
 assert.throws(()=>solveAlignment(sample('a',40,20),sample('b',40,25)),/30°/);
 assert.throws(()=>solveAlignment(sample('a',0,0),sample('b',0,180)),/30°/);
 const b=sample('b',40,130);b.measured=skyVector({alt:40,az:160});
 assert.throws(()=>solveAlignment(sample('a',40,20),b),/disagree/);
});
test('held-out check is distinct and rejects inconsistent estimates',()=>{
 const samples=[sample('a',40,10),sample('b',30,120)],model=solveAlignment(...samples);
 close(validateAlignment(model,samples,sample('c',25,250)),0);
 assert.throws(()=>validateAlignment(model,samples,samples[0]),/different/);
 const wrong=sample('c',25,250);wrong.measured=skyVector({alt:40,az:280});
 assert.throws(()=>validateAlignment(model,samples,wrong),/Guidance remains off/);
});
test('guidance uses shortest azimuth, honest coarse arrival and horizon/zenith guards',()=>{
 assert.match(guidance({alt:30,az:359},{alt:40,az:5}).text,/Turn right.*6.0.*Raise/);
 assert.match(guidance({alt:40,az:5},{alt:30,az:359}).text,/Turn left.*6.0.*Lower/);
 assert.match(guidance({alt:30,az:5},{alt:30,az:6}).text,/does not confirm centering/);
 assert.ok(guidance({alt:30,az:0},{alt:-1,az:0}).blocked);
 assert.ok(guidance({alt:85,az:0},{alt:50,az:0}).blocked);
});
test('captures need sustained, fresh and stable measured samples',()=>{
 const h=Array.from({length:11},(_,i)=>({time:i*100,vector:skyVector({alt:40,az:120})}));
 close(angle(stableSample(h,1000),h[0].vector),0);
 assert.throws(()=>stableSample(h,2000),/Hold still/);
 assert.throws(()=>stableSample(h.slice(0,3),200),/Hold still/);
 h[4].vector=skyVector({alt:40,az:140});assert.throws(()=>stableSample(h,1000),/moving/);
});
test('easy-target planner favors the Moon when placed, excludes Sun, daylight and poor geometry',()=>{
 const date=new Date('2026-10-27T03:00:00Z'),p=new Map(catalogue.map(o=>[o.id,position(A,o,date)]));
 const choices=easyTargets(catalogue,p,[],A.Illumination('Moon',date).phase_fraction);
 assert.equal(choices[0].id,'Moon');assert.ok(!choices.some(o=>o.id==='Sun'));
 const first={id:'Moon',target:skyVector(p.get('Moon'))};
 const second=easyTargets(catalogue,p,[first]);assert.ok(second.length);
 for(const o of second){const a=angle(first.target,skyVector(p.get(o.id)));assert.ok(a>=30&&a<=140);}
 p.set('Sun',{alt:5,az:180});assert.equal(easyTargets(catalogue,p,[]).length,0);
});
function fakeEnv(){let now=0;const listeners=new Map(),timers=new Map();let counter=0;return {isSecureContext:true,DeviceOrientationEvent:class {},performance:{now:()=>now},setNow:n=>now=n,addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name),setInterval:fn=>{timers.set(++counter,fn);return counter;},clearInterval:id=>timers.delete(id),emit:e=>listeners.get(e.type)?.(e),listeners,timers};}
test('sensors never substitute relative, invalid or stale readings',async()=>{
 const env=fakeEnv(),s=new OrientationSession(env,()=>{});await s.start('handheld');
 assert.equal(s.history.length,0);
 env.emit({type:'deviceorientation',absolute:false,alpha:0,beta:90,gamma:0});assert.equal(s.history.length,0);assert.equal(s.status,'unreliable');
 env.emit({type:'deviceorientationabsolute',absolute:true,alpha:0,beta:90,gamma:0});assert.equal(s.history.length,1);
 env.setNow(1600);s.tick();assert.equal(s.status,'stale');assert.equal(env.listeners.size,2);assert.throws(()=>stableSample(s.history,1600),/Hold still/);env.setNow(1700);env.emit({type:'deviceorientationabsolute',absolute:true,alpha:0,beta:90,gamma:0});assert.equal(s.status,'receiving');assert.equal(s.history.at(-1).time,1700);
 await s.start('mounted');env.emit({type:'deviceorientationabsolute',absolute:true,alpha:0,beta:0,gamma:0});env.emit({type:'deviceorientationabsolute',absolute:true,alpha:null,beta:0,gamma:0});assert.equal(s.history.length,0);assert.equal(s.status,'unreliable');
});
test('permission denial, no events, insecure context and canceled prompt are explicit',async()=>{
 const env=fakeEnv(),s=new OrientationSession(env,()=>{});env.DeviceOrientationEvent.requestPermission=async()=> 'denied';
 await s.start('handheld');assert.equal(s.status,'denied');assert.equal(env.listeners.size,0);
 delete env.DeviceOrientationEvent.requestPermission;await s.start('handheld');env.setNow(6100);s.tick();assert.match(s.message,/No usable/);
 env.isSecureContext=false;await s.start('handheld');assert.equal(s.status,'unsupported');
 env.isSecureContext=true;let answer;env.DeviceOrientationEvent.requestPermission=()=>new Promise(r=>answer=r);
 const pending=s.start('handheld');s.stop();answer('granted');await pending;assert.equal(env.listeners.size,0);assert.equal(s.status,'off');
});
test('sudden frame jumps stop the session and stop releases all listeners/timers',async()=>{
 const env=fakeEnv(),s=new OrientationSession(env,()=>{});await s.start('handheld');
 env.emit({type:'deviceorientationabsolute',absolute:true,alpha:0,beta:90,gamma:0});env.setNow(50);
 env.emit({type:'deviceorientationabsolute',absolute:true,alpha:160,beta:90,gamma:0});
 assert.equal(s.status,'unreliable');assert.equal(env.listeners.size,0);assert.equal(env.timers.size,0);
});
test('initial empty event waits for complete values without inventing a direction',async()=>{
 const env=fakeEnv(),s=new OrientationSession(env,()=>{});await s.start('handheld');
 env.emit({type:'deviceorientationabsolute',absolute:true,alpha:null,beta:null,gamma:null});
 assert.equal(s.status,'waiting');assert.equal(s.history.length,0);
 env.emit({type:'deviceorientationabsolute',absolute:true,alpha:0,beta:90,gamma:0});
 assert.equal(s.status,'receiving');assert.equal(s.history.length,1);s.stop();
});
