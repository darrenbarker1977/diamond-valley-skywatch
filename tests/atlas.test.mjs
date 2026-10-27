import test from 'node:test';
import assert from 'node:assert/strict';
import {projectView,projectDome,moveCamera,wrap} from '../prototype/atlas-math.js';
import {stars,constellations} from '../prototype/atlas-data.js';
import {guidance} from '../prototype/alignment.js';
test('horizon projection centres its actual direction and preserves east/right',()=>{
 const camera={az:0,alt:25,fov:85},width=400,height=300;
 const center=projectView({az:0,alt:25},camera,width,height);assert.ok(Math.abs(center.x-200)<1e-8&&Math.abs(center.y-150)<1e-8);
 assert.ok(projectView({az:30,alt:25},camera,width,height).x>200);
 assert.ok(projectView({az:330,alt:25},camera,width,height).x<200);
 assert.equal(projectView({az:180,alt:0},camera,width,height),null);
 const a=projectView({az:0,alt:0},camera,width,height),b=projectView({az:40,alt:0},camera,width,height);assert.ok(Math.abs(a.y-b.y)<1e-8);
});
test('whole-sky projection preserves compass directions and camera movement wraps north',()=>{
 assert.deepEqual(projectDome({alt:90,az:0},400,400),{x:200,y:200});
 assert.ok(projectDome({alt:0,az:90},400,400).x>200);assert.ok(projectDome({alt:0,az:0},400,400).y<200);
 assert.equal(wrap(-1),359);const p=moveCamera({az:2,alt:80,fov:85},40,100,400,300);assert.ok(p.az>=0&&p.az<360);assert.equal(p.alt,85);
});
test('the dense star field is real finite catalogue data, not a random background',()=>{
 assert.equal(stars.length,2851);assert.ok(constellations.length>=88);
 for(const [ra,dec,mag,bv] of stars){assert.ok([ra,dec,mag,bv].every(Number.isFinite));assert.ok(Math.abs(ra)<=180&&Math.abs(dec)<=90&&mag<=5.5);}
 for(const c of constellations)for(const line of c.lines)for(const [ra,dec] of line)assert.ok(Number.isFinite(ra)&&Number.isFinite(dec)&&Math.abs(dec)<=90);
});
test('finder receives direction deltas only from unblocked guidance',()=>{
 const result=guidance({az:350,alt:30},{az:10,alt:45});assert.equal(result.azDelta,20);assert.equal(result.altDelta,15);
 assert.ok(!('azDelta' in guidance({az:350,alt:30},{az:10,alt:-1})));
 assert.ok(!('azDelta' in guidance({az:350,alt:85},{az:10,alt:45})));
});
