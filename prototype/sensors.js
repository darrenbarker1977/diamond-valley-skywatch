import {deviceAxis,angle} from './alignment.js';
export class OrientationSession {
 constructor(env,onChange){this.env=env;this.onChange=onChange;this.status='off';this.message='Sensors off';this.history=[];this.mode='handheld';this.generation=0;this.active=false;this.source=null;this.handle=this.handle.bind(this);}
 now(){return this.env.performance.now();}
 notify(){this.onChange(this);}
 async start(mode){
  this.stop();this.mode=mode;const generation=this.generation;
  if(!this.env.isSecureContext){this.status='unsupported';this.message='Sensors need HTTPS (or localhost). A plain HTTP phone preview cannot read them.';this.notify();return;}
  const API=this.env.DeviceOrientationEvent;
  if(!API){this.status='unsupported';this.message='This browser does not expose orientation sensors. Try Chrome on your Pixel 8.';this.notify();return;}
  this.status='permission';this.message='Waiting for sensor permission…';this.notify();
  try {
   if(typeof API.requestPermission==='function'&&await API.requestPermission(true)!=='granted')throw Error('Permission denied. Allow motion/orientation access in browser site settings, then enable again.');
   if(generation!==this.generation)return;
   this.active=true;this.started=this.now();this.status='waiting';this.message='Waiting for absolute orientation. Keep the phone away from magnets.';
   this.env.addEventListener('deviceorientationabsolute',this.handle);
   this.env.addEventListener('deviceorientation',this.handle);
   this.timer=this.env.setInterval(()=>this.tick(),250);this.notify();
  }catch(e){if(generation!==this.generation)return;this.status='denied';this.message=e.message||'Sensor permission failed. Check browser site settings.';this.notify();}
 }
 handle(event){
  if(!this.active)return;
  if(event.absolute!==true){if(!this.history.length){this.status='unreliable';this.message='Only relative orientation is available. Absolute heading is required; guidance is off.';this.notify();}return;}
  if(this.source&&event.type!==this.source)return;
  let vector;
  try {vector=deviceAxis(event,this.mode);}
  catch(e){if(!this.history.length){this.status='waiting';this.message='Waiting for complete absolute orientation values. No direction is available yet.';this.notify();}else this.interrupt('Invalid or missing orientation values. Enable sensors again; guidance is off.');return;}
  const time=this.now(),previous=this.history.at(-1);
  if(previous&&time-previous.time<100&&angle(previous.vector,vector)>70){this.interrupt('Orientation jumped abruptly. Move slowly and recalibrate; guidance is off.');return;}
  this.source=event.type;this.history.push({vector,time});this.history=this.history.filter(s=>time-s.time<1500);
  this.status='receiving';this.message='Absolute sensor samples received · heading accuracy not supplied by this browser';this.notify();
 }
 tick(){
  if(!this.active)return;
  const latest=this.history.at(-1);
  if(latest&&this.now()-latest.time>1500){this.interrupt('Sensor readings became stale. Enable sensors again and recalibrate.');return;}
  if(!latest&&this.now()-this.started>6000){this.interrupt('No usable absolute sensor readings. Check Chrome motion-sensor permissions and device support, then retry.');return;}
  this.notify();
 }
 interrupt(message){this.stop();this.status='unreliable';this.message=message;this.notify();}
 stop(){this.generation++;this.active=false;this.env.removeEventListener('deviceorientationabsolute',this.handle);this.env.removeEventListener('deviceorientation',this.handle);if(this.timer)this.env.clearInterval(this.timer);this.timer=null;this.history=[];this.source=null;this.status='off';this.message='Sensors off';}
}
