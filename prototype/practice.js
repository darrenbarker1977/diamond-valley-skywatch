import {localInstant,localParts,localLabel} from './observing-time.js';
// A temporary astronomy clock, never a source of measured phone readings.
export function findDarkTime(start,sunAltitude){
 let twilight=null;
 for(let i=0;i<=192;i++){
  const time=new Date(start.getTime()+i*15*60000),alt=sunAltitude(time);
  if(alt<=-12)return time;if(alt<=-6&&!twilight)twilight=time;
 }
 return twilight;
}
export function createPractice({getZone,sunAltitude,onChange,onSetup}){
 const $=id=>document.getElementById(id);let active=false,instant=null;
 const local=localParts(new Date(),getZone());$('practice-date').value=local.date;$('practice-time').value='21:00';
 function input(){const value=$('practice-time').value;if(!/^\d\d:\d\d$/.test(value))throw Error('Choose a date and time.');const [h,m]=value.split(':').map(Number);return localInstant($('practice-date').value,h*60+m,getZone());}
 function paint(){
  document.body.classList.toggle('dv-practice-mode',active);$('practice-banner').hidden=!active;$('practice-finder-live').hidden=!active;
  $('practice-clock').textContent=active?'PRACTICE · '+localLabel(instant,getZone()):'';
  $('practice-start').textContent=active?'Apply time & restart practice setup':'Start practice walkthrough';
 }
 function stop(){if(!active)return;active=false;instant=null;paint();onChange();}
 function start(){try{const next=input();if(sunAltitude(next)>-6)throw Error('That time is still daylight or bright twilight here. Choose a later time, or use Find a dark time.');instant=next;active=true;$('practice-error').textContent='';$('practice-settings').open=false;paint();onChange();onSetup();}catch(error){$('practice-error').textContent=error.message;}}
 function open(){ $('practice-settings').open=true;$('practice-date').focus();$('practice-settings').scrollIntoView({block:'center'}); }
 $('practice-start').addEventListener('click',start);$('practice-live').addEventListener('click',stop);$('practice-finder-live').addEventListener('click',stop);$('walk-practice').addEventListener('click',open);
 $('practice-dark').addEventListener('click',()=>{try{const time=findDarkTime(input(),sunAltitude);if(!time)throw Error('No dark interval found here in the next 48 hours. Try another season or location.');const p=localParts(time,getZone());$('practice-date').value=p.date;$('practice-time').value=String(p.hour).padStart(2,'0')+':'+String(p.minute).padStart(2,'0');$('practice-error').textContent='Dark sky time selected. This is an astronomy check, not a weather recommendation. Tap Start to apply it.';}catch(error){$('practice-error').textContent=error.message;}});
 paint();return {stop,open,get active(){return active;},context(){return {practice:active,zone:getZone(),instant:active?new Date(instant):new Date()};}};
}
