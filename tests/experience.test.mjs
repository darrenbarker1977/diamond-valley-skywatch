import test from 'node:test';
import assert from 'node:assert/strict';
import {savedExperience,deviceTools} from '../prototype/experience.js';
test('fresh or blocked browsers default to browse; saved choices and older readiness preferences persist',()=>{
 assert.equal(savedExperience(null),'browse');assert.equal(savedExperience({getItem(){throw Error('blocked')}}),'browse');
 const storage=(mode,old)=>({getItem:key=>key==='dvsky:experience:v1'?mode:old});
 for(const mode of ['browse','handheld','mounted'])assert.equal(savedExperience(storage(mode,'browse')),mode);
 assert.equal(savedExperience(storage('bogus','mounted')),'mounted');assert.equal(savedExperience(storage(null,'handheld')),'handheld');
});
test('device guidance never treats API availability as working hardware or permission',()=>{
 const desktop=deviceTools({isSecureContext:true,navigator:{}});assert.match(desktop[0][1],/Motion sensors are unavailable/);assert.match(desktop[0][1],/sky map/);assert.match(desktop[1][1],/Search for a place/);
 const phone=deviceTools({isSecureContext:true,DeviceOrientationEvent:class{},navigator:{geolocation:{},mediaDevices:{getUserMedia(){}},vibrate(){}}});assert.match(phone[0][1],/fresh absolute compass readings/);assert.match(phone[0][1],/Computers often supply no heading/);assert.match(phone[2][1],/Permission is required/);assert.match(phone[3][1],/may still block/);
 assert.match(deviceTools({isSecureContext:false,navigator:{}})[0][1],/HTTPS/);
});
