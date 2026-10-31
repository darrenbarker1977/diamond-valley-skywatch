// Component fixtures do not supply production sensor or hardware fallbacks.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHapticGuide} from '../prototype/haptic-guide.js';
function fixture({off=false,supported=true}={}){
 let time=0,nextTimer=1,response=true;const timers=new Map(),calls=[],saved=new Map(off?[['dvsky:vibration:auto:v1','off']]:[]),events=new Map(),docEvents=new Map();
 const ids=['finder-vibration','finder-vibration-quick','vibration-status','vibration-window-status','finder-vibration-test','vibration-test-status','guidance-vibration-auto','vibration-phone-checks','vibration-help'];
 const elements=new Map(ids.map(id=>[id,{id,textContent:'',disabled:false,hidden:false,attrs:{},listeners:{},setAttribute(key,value){this.attrs[key]=value;},addEventListener(name,fn){this.listeners[name]=fn;},fire(name='click'){this.listeners[name]?.();},scrollIntoView(){},querySelector(){return {focus(){}};}}]));
 const env={performance:{now:()=>time},navigator:supported?{vibrate:pattern=>{calls.push(pattern);if(response instanceof Error)throw response;return response;}}:{},localStorage:{getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value)},document:{hidden:false,addEventListener:(name,fn)=>docEvents.set(name,fn)},addEventListener:(name,fn)=>events.set(name,fn),setTimeout:(fn,delay)=>{const id=nextTimer++;timers.set(id,{fn,at:time+delay});return id;},clearTimeout:id=>timers.delete(id)};
 const guide=createHapticGuide({env,root:{getElementById:id=>elements.get(id)||null}}),el=id=>elements.get(id);
 return {guide,env,el,calls,saved,respond:value=>response=value,run(ms){time+=ms;for(const [id,timer]of [...timers])if(timer.at<=time){timers.delete(id);timer.fn();}},hide(){env.document.hidden=true;docEvents.get('visibilitychange')();}};
}
const aligned=(error=20)=>({haptic:{ready:true,error},message:'Actual aligned distance',listening:true,mode:'handheld'});
test('turning automatic vibration back on immediately resumes active safe guidance',()=>{
 const f=fixture({off:true});f.guide.activate(true);f.guide.pose(aligned());f.guide.start();assert.deepEqual(f.calls,[]);
 f.el('guidance-vibration-auto').checked=true;f.el('guidance-vibration-auto').fire('change');assert.ok(f.calls.some(x=>typeof x==='number'&&x>=60));assert.equal(f.el('finder-vibration').attrs['aria-pressed'],'true');assert.equal(f.el('finder-vibration-quick').attrs['aria-pressed'],'true');assert.equal(f.saved.get('dvsky:vibration:auto:v1'),'on');
 f.el('finder-vibration-quick').fire();assert.equal(f.saved.get('dvsky:vibration:auto:v1'),'off');assert.equal(f.el('finder-vibration').attrs['aria-pressed'],'false');f.guide.start();assert.equal(f.el('finder-vibration').attrs['aria-pressed'],'false');
});
test('normal pulses require a safe pose; an explicitly labelled phone test does not invent alignment',()=>{
 const f=fixture({off:true});f.guide.activate(true);f.guide.pose({haptic:{ready:false,message:'Align one object'},listening:false});f.el('finder-vibration-test').fire();assert.deepEqual(f.calls,[[160,100,160]]);assert.match(f.el('vibration-test-status').textContent,/cannot confirm you felt/);assert.match(f.el('vibration-window-status').textContent,/not target guidance/);
 f.run(200);f.guide.pose({haptic:{ready:false,message:'Daylight'},listening:false});assert.equal(f.calls.length,1);f.run(260);assert.equal(f.calls.length,1);assert.equal(f.saved.get('dvsky:vibration:auto:v1'),'off');assert.match(f.el('vibration-status').textContent,/off/);
});
test('browser rejection stays explicit without a request storm and a tap can retry without realignment',()=>{
 const f=fixture();f.respond(false);f.guide.activate(true);f.guide.pose(aligned());f.guide.start();assert.equal(f.calls.length,1);assert.match(f.el('vibration-window-status').textContent,/blocked/);assert.equal(f.el('finder-vibration').attrs['aria-pressed'],'true');
 for(let i=0;i<20;i++){f.run(50);f.guide.pose(aligned());}assert.equal(f.calls.length,1);
 f.respond(true);f.el('finder-vibration-test').fire();assert.deepEqual(f.calls.at(-1),[160,100,160]);f.run(460);assert.equal(typeof f.calls.at(-1),'number');assert.match(f.el('vibration-status').textContent,/Pulses requested/);
});
test('unsupported vibration disables controls and reports the platform limitation',()=>{
 const f=fixture({supported:false});for(const id of ['finder-vibration','finder-vibration-quick','finder-vibration-test'])assert.equal(f.el(id).disabled,true);f.guide.start();f.guide.pose(aligned());assert.match(f.el('vibration-window-status').textContent,/unavailable in this browser/);assert.deepEqual(f.calls,[]);
});
test('test pulses survive ordinary sample updates but stop on leaving or hiding the app',()=>{
 for(const action of ['leave','hide']){
  const f=fixture();f.guide.activate(true);f.el('finder-vibration-test').fire();f.run(100);f.guide.pose({haptic:{ready:false,message:'No alignment'}});assert.equal(f.calls.length,1);
  if(action==='hide')f.hide();else f.guide.activate(false);assert.equal(f.calls.at(-1),0);const count=f.calls.length;f.run(1000);assert.equal(f.calls.length,count);
 }
});
test('guidance rate limits pulse requests and cancels immediately on unsafe or stale poses',()=>{
 const f=fixture();f.guide.activate(true);f.guide.pose(aligned(40));f.guide.start();assert.equal(f.calls.length,1);
 for(let i=0;i<100;i++){f.run(20);f.guide.pose(aligned(40));}assert.equal(f.calls.length,1);f.run(200);f.guide.pose(aligned(40));assert.equal(f.calls.length,2);
 f.guide.pose({haptic:{ready:false,message:'Target below horizon'}});assert.equal(f.calls.at(-1),0);const count=f.calls.length;for(let i=0;i<20;i++){f.run(100);f.guide.pose({haptic:{ready:false,message:'Stale samples'}});}assert.equal(f.calls.length,count);assert.match(f.el('vibration-window-status').textContent,/Stale samples/);
});
