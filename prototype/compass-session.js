import {deviceAxis,angle} from './alignment.js';

// A compass is not a telescope alignment session: a quiet/paused phone stream
// must not permanently detach the listeners that could deliver its next sample.
export class CompassSession {
 constructor(env,onChange){Object.assign(this,{env,onChange,status:'off',message:'Compass off',history:[],active:false,generation:0,lastReconnect:0});this.handle=this.handle.bind(this);}
 now(){return this.env.performance.now();}
 notify(){this.onChange(this);}
 attach(){for(const name of ['deviceorientationabsolute','deviceorientation']){this.env.removeEventListener(name,this.handle);this.env.addEventListener(name,this.handle);}}
 reconnect(){if(!this.active)return this.start();this.attach();this.lastReconnect=this.now();this.notify();}
 async start(){
  this.stop();const generation=this.generation;
  if(!this.env.isSecureContext){this.status='unsupported';this.message='Compass needs HTTPS. Open the permanent secure website.';this.notify();return;}
  const API=this.env.DeviceOrientationEvent;
  if(!API){this.status='unsupported';this.message='This browser does not expose orientation sensors. Try Chrome on your Pixel 8.';this.notify();return;}
  this.status='permission';this.message='Waiting for motion-sensor permission…';this.notify();
  try{
   if(typeof API.requestPermission==='function'&&await API.requestPermission(true)!=='granted')throw Error('Motion-sensor permission denied. Allow it in browser site settings, then retry.');
   if(generation!==this.generation)return;
   this.active=true;this.started=this.lastReconnect=this.now();this.status='waiting';this.message='Compass enabled · waiting for absolute sensor readings.';this.attach();this.timer=this.env.setInterval(()=>this.tick(),500);this.notify();
  }catch(error){if(generation!==this.generation)return;this.status='denied';this.message=error.message||'Motion-sensor permission failed.';this.notify();}
 }
 handle(event){
  if(!this.active)return;
  if(event.absolute!==true){if(!this.history.length){this.status='waiting';this.message='Compass enabled · only relative orientation is arriving. Absolute north is unavailable.';this.notify();}return;}
  let vector;try{vector=deviceAxis(event,'mounted');}catch{this.history=[];this.status='waiting';this.message='Incomplete sensor reading · waiting for a valid heading.';this.notify();return;}
  const time=this.now(),last=this.history.at(-1);
  if(last&&time-last.time<80&&angle(last.vector,vector)>80&&!this.suspect){this.suspect=vector;this.history=[];this.status='waiting';this.message='Sudden heading change · checking the next sensor sample.';this.notify();return;}
  this.suspect=null;this.history=[{vector,time}];this.status='receiving';this.message='Live device-north heading · browser accuracy unknown.';this.notify();
 }
 tick(){
  if(!this.active)return;const time=this.now(),last=this.history.at(-1);
  if(!last||time-last.time>3000){
   this.status='waiting';this.message=last?'Compass enabled · readings paused; waiting to reconnect. No current heading is shown.':time-this.started>6000?'Compass enabled · no absolute readings yet. Move the phone or tap the page; check browser motion-sensor settings if this persists.':'Compass enabled · waiting for absolute sensor readings.';
   if(time-this.lastReconnect>=10000){this.attach();this.lastReconnect=time;}
  }
  this.notify();
 }
 stop(){this.generation++;this.active=false;for(const name of ['deviceorientationabsolute','deviceorientation'])this.env.removeEventListener(name,this.handle);if(this.timer)this.env.clearInterval(this.timer);this.timer=null;this.history=[];this.suspect=null;this.status='off';this.message='Compass off';}
}
