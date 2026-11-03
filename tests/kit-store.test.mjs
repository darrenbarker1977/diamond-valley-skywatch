import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultKit,viewingPlan,alignmentEyepiece} from '../prototype/eyepieces.js';
import {migrateKit,readKit,writeKit,KIT_KEY,KIT_VERSION} from '../prototype/kit-store.js';
const legacy=()=>({focalLength:1000,eyepieces:[
 {id:'supplied25',name:'Supplied 25 mm',kind:'fixed',min:25,max:25,enabled:false},
 {id:'supplied10',name:'Supplied 10 mm',kind:'fixed',min:10,max:10,enabled:true},
 {id:'sv135',name:'SVBONY SV135 7–21 mm zoom',kind:'zoom',min:7,max:21,enabled:false},
 {id:'custom',name:'My real 25 mm',kind:'fixed',min:25,max:25,enabled:false}
]});
test('legacy assumptions migrate without changing custom lenses, zoom state or telescope',()=>{
 const kit=migrateKit(legacy());assert.equal(kit.focalLength,1000);
 assert.deepEqual(kit.eyepieces.map(e=>e.id),['sv135','custom','wide20','wide12_5']);
 assert.equal(kit.eyepieces.find(e=>e.id==='sv135').enabled,false);
 assert.deepEqual(kit.eyepieces.find(e=>e.id==='custom'),legacy().eyepieces[3]);
});
test('customized original IDs and already entered actual lenses are preserved',()=>{
 const kit=legacy();kit.eyepieces[0].name='My own 25 mm';kit.eyepieces.push({...defaultKit().eyepieces[0],id:'my20',enabled:false});
 const result=migrateKit(kit);assert.ok(result.eyepieces.some(e=>e.name==='My own 25 mm'));assert.equal(result.eyepieces.filter(e=>e.min===20).length,1);assert.equal(result.eyepieces.find(e=>e.id==='my20').enabled,false);
});
test('saved migration is one-time and user removals survive reload',()=>{
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),values=new Map([[KIT_KEY,JSON.stringify(legacy())]]);
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)}});
 try{const kit=readKit();assert.equal(JSON.parse(values.get(KIT_KEY)).version,KIT_VERSION);kit.eyepieces=kit.eyepieces.filter(e=>e.id!=='wide12_5');writeKit(kit);assert.ok(!readKit().eyepieces.some(e=>e.id==='wide12_5'));}
 finally{if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);else delete globalThis.localStorage;}
});
test('actual kit starts with 20 mm for finding and alignment; zoom supports closer views',()=>{
 const kit=defaultKit();assert.match(alignmentEyepiece(kit),/20 mm.*60×/);
 for(const object of [{id:'Albireo',type:'Double star'},{id:'Saturn',type:'Planet'},{id:'M45',sizeArcmin:110}]){const plan=viewingPlan(object,kit,45);assert.equal(plan.steps[0].choice.id,'wide20');if(object.id!=='M45')assert.equal(plan.steps[1].choice.id,'sv135');}
 kit.eyepieces[0].enabled=false;assert.equal(viewingPlan({id:'Saturn',type:'Planet'},kit).steps[0].choice.mm,21);
});
