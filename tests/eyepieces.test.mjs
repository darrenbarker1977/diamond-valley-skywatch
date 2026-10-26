import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultKit,candidates,viewingPlan,alignmentEyepiece,validateKit} from '../prototype/eyepieces.js';
test('photographed kit gives correct magnifications at standard 1200 mm focal length',()=>{
 const c=candidates(defaultKit());assert.equal(c.find(e=>e.id==='supplied25').power,48);assert.equal(c.find(e=>e.id==='supplied10').power,120);assert.equal(Math.round(c.find(e=>e.id==='sv135'&&e.mm===7).power),171);
 assert.match(alignmentEyepiece(defaultKit()),/25 mm.*48×/);
});
test('new longer and shorter eyepieces participate in live recommendations',()=>{
 const kit=defaultKit();kit.eyepieces.push({id:'wide32',name:'My wide eyepiece',kind:'fixed',min:32,max:32,enabled:true},{id:'detail6',name:'My detail eyepiece',kind:'fixed',min:6,max:6,enabled:true});
 const plan=viewingPlan({id:'Jupiter',type:'Planet'},kit,45);
 assert.equal(plan.steps[0].choice.id,'wide32');assert.equal(plan.steps.at(-1).choice.id,'detail6');assert.equal(plan.steps.at(-1).choice.power,200);
 kit.eyepieces.find(e=>e.id==='wide32').enabled=false;assert.equal(viewingPlan({id:'M45'},kit).steps[0].choice.mm,25);
 kit.focalLength=1000;assert.equal(candidates(kit).find(e=>e.id==='supplied25').power,40);
});
test('large objects, low targets and the Sun have appropriate limits',()=>{
 assert.equal(viewingPlan({id:'M31'},defaultKit()).steps.length,1);
 assert.equal(viewingPlan({id:'Moon'},defaultKit(),10).steps.length,1);
 assert.match(viewingPlan({id:'Moon'},defaultKit(),-5).note,/below the horizon/);
 assert.equal(viewingPlan({id:'Sun'},defaultKit()).steps.length,0);
 const kit=defaultKit();kit.eyepieces.forEach(e=>e.enabled=false);assert.equal(viewingPlan({id:'Moon'},kit).steps.length,0);
});
test('invalid saved kits and zoom limits are rejected, empty kit is allowed',()=>{
 assert.throws(()=>validateKit({focalLength:0,eyepieces:[]}));
 const kit=defaultKit();kit.eyepieces[2].min=30;assert.throws(()=>validateKit(kit));
 assert.equal(validateKit({focalLength:1200,eyepieces:[]}).eyepieces.length,0);
});
test('an extreme new eyepiece is listed but never recommended as a beginner high-power step',()=>{
 const kit=defaultKit();kit.eyepieces.push({id:'tiny',name:'1 mm',kind:'fixed',min:1,max:1,enabled:true});
 const plan=viewingPlan({id:'Moon'},kit);assert.ok(plan.steps.every(s=>s.choice.power<=220));
 kit.eyepieces=kit.eyepieces.filter(e=>e.id==='tiny');assert.equal(viewingPlan({id:'Moon'},kit).steps.length,0);
});
