import test from 'node:test';import assert from 'node:assert/strict';import * as A from 'astronomy-engine';import fs from 'node:fs';
import {hopRoute,separation,solarDetails,dewRisk,auroraAt,validateOrbit,issPasses} from '../prototype/field-math.js';
import {CompassSession} from '../prototype/compass-session.js';
import {singleAlignment,alignedDirection,skyVector} from '../prototype/alignment.js';
test('one-target offsets map real measured heading/tilt to the identified star without claiming a full rotation',()=>{
 const m=singleAlignment({measured:skyVector({alt:48,az:355}),target:skyVector({alt:51,az:1})});assert.equal(m.kind,'single');assert.equal(m.residual,null);const p=alignedDirection(m,skyVector({alt:48,az:355}));assert.ok(Math.abs(p.alt-51)<1e-8);assert.ok(Math.abs(p.az-1)<1e-8);const next=alignedDirection(m,skyVector({alt:40,az:80}));assert.ok(Math.abs(next.alt-43)<1e-8);assert.ok(Math.abs(next.az-86)<1e-8);
});
test('compass keeps listening through quiet intervals, invalid samples and reconnects',async()=>{
 let time=0;const handlers=new Map(),env={isSecureContext:true,DeviceOrientationEvent:class{},performance:{now:()=>time},addEventListener:(n,f)=>handlers.set(n,f),removeEventListener:n=>handlers.delete(n),setInterval:()=>1,clearInterval:()=>{}},s=new CompassSession(env,()=>{});await s.start();s.handle({absolute:true,alpha:270,beta:0,gamma:0});assert.equal(s.status,'receiving');time=12000;s.tick();assert.equal(s.active,true);assert.equal(s.status,'waiting');assert.equal(handlers.size,2);s.handle({absolute:true,alpha:null,beta:0,gamma:0});assert.equal(s.history.length,0);s.handle({absolute:true,alpha:180,beta:0,gamma:0});assert.equal(s.status,'receiving');s.stop();assert.equal(handlers.size,0);
});
test('chart routes stay above the horizon, after dusk, and away from the Sun',()=>{
 const c=[{id:'a',type:'Star',magnitude:1},{id:'b',type:'Star',magnitude:3},{id:'x',type:'Galaxy'}],p=new Map([['Sun',{alt:-30,az:280}],['a',{alt:40,az:70}],['b',{alt:40,az:85}],['x',{alt:40,az:100}]]),route=hopRoute(c,p,'x');assert.deepEqual(route,['a','b','x']);for(let i=1;i<route.length;i++)assert.ok(separation(p.get(route[i-1]),p.get(route[i]))<=15);p.get('Sun').alt=5;assert.deepEqual(hopRoute(c,p,'x'),[]);p.get('Sun').alt=-30;p.get('x').alt=-1;assert.deepEqual(hopRoute(c,p,'x'),[]);
});
test('Moon phase and light-time-corrected Jovian positions vary with date',()=>{
 const site={latitude:50.68,longitude:-114.25,height:0},date=new Date('2026-10-27T03:00Z'),a=solarDetails(A,site,date),b=solarDetails(A,site,new Date('2026-10-28T03:00Z'));assert.equal(a.moons.length,4);assert.ok(a.fraction>=0&&a.fraction<=1);assert.notEqual(a.fraction,b.fraction);assert.notEqual(a.moons[0].x,b.moons[0].x);assert.ok(a.rise instanceof Date);assert.ok(a.moons.every(m=>Number.isFinite(m.x)&&Number.isFinite(m.y)));
});
test('dew risk never substitutes missing model values',()=>{assert.equal(dewRisk({temperature_2m:4,dew_point_2m:3}).level,'High');assert.equal(dewRisk({temperature_2m:8,dew_point_2m:2}).level,'Lower');assert.equal(dewRisk({temperature_2m:4,dew_point_2m:null}).level,'Unknown');});
test('aurora uses nearby timestamped model cells, with longitude wrapping and expiry',()=>{
 const now=Date.parse('2026-10-27T03:00Z'),data={'Observation Time':new Date(now-600000).toISOString(),'Forecast Time':new Date(now+1800000).toISOString(),coordinates:Array.from({length:100},()=>[245,51,37])};assert.equal(auroraAt(data,{latitude:51,longitude:-115},now).probability,37);assert.throws(()=>auroraAt(data,{latitude:51,longitude:-115},now+3*3600000));assert.throws(()=>auroraAt(data,{latitude:-23,longitude:133},now));
});
test('ISS uses real fixture elements, filters darkness, and suppresses stale orbits',()=>{
 const data=JSON.parse(fs.readFileSync(new URL('./fixtures/iss-20261027.json',import.meta.url))),now=Date.parse('2026-10-27T21:00Z'),original=Date.now;Date.now=()=>now;
 try{validateOrbit(data);const site={latitude:50.68,longitude:-114.25,height:0},passes=issPasses(A,data,site,new Date(now));assert.ok(passes.length>0);for(const p of passes){assert.ok(p.max>=10);assert.ok(p.track.length>=2&&p.track.every(q=>Number.isFinite(q.alt)&&Number.isFinite(q.az)&&q.alt>=10));const eq=A.Equator('Sun',p.peak,new A.Observer(site.latitude,site.longitude,0),true,true);assert.ok(A.Horizon(p.peak,new A.Observer(site.latitude,site.longitude,0),eq.ra,eq.dec).altitude<=-6);}assert.deepEqual(issPasses(A,data,{latitude:89,longitude:0,height:0},new Date(now),12),[]);assert.throws(()=>validateOrbit(data,now+4*86400000));}finally{Date.now=original;}
});
