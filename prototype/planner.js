import {nightDate,localInstant,localLabel,localParts} from './observing-time.js';
export function createPlanner({getZone,onChange}){
 const $=id=>document.getElementById(id);let planning=false,day=nightDate(new Date(),getZone()),minute=1260,pending=0,inputError='';
 function context(){return {planning,zone:getZone(),night:planning?day:nightDate(new Date(),getZone()),instant:planning?localInstant(day,minute,getZone()):new Date()};}
 function refresh(){
  $('plan-now').setAttribute('aria-pressed',String(!planning));$('plan-night').setAttribute('aria-pressed',String(planning));
  $('plan-date').disabled=!planning;$('plan-time').disabled=!planning;
  if(document.activeElement!==$('plan-date'))$('plan-date').value=day;
  $('plan-time').value=String(minute);document.body.classList.toggle('dv-planning-mode',planning);
  $('atlas-title').textContent=planning?'The sky, planned.':'The sky, right now.';
  $('atlas-live-badge').textContent=planning?'◇ PLAN':'● LIVE TIME';
  document.querySelector('.dv-nav-live').textContent=planning?'◇ Planned sky · pointing is off':'● Live sky calculations';
  try{const c=context();$('plan-clock').textContent=localLabel(c.instant,c.zone);$('plan-error').hidden=!inputError;if(inputError)$('plan-error').textContent=inputError;}
  catch(error){$('plan-clock').textContent='Choose another local time';$('plan-error').hidden=false;$('plan-error').textContent=error.message;}
  try{$('plan-time-label').textContent=localLabel(localInstant(day,minute,getZone()),getZone());}catch{$('plan-time-label').textContent='Clock change: choose another time';}
  $('planning-banner').hidden=!planning;
 }
 function changed(){clearTimeout(pending);refresh();onChange();}
 function valid(date,time){try{localInstant(date,time,getZone());inputError='';return true;}catch(error){inputError=error.message+' Your previous valid time is unchanged.';$('plan-error').hidden=false;$('plan-error').textContent=inputError;return false;}}
 function plan(date=day,time=minute){if(!valid(date,time))return false;planning=true;day=date;minute=time;$('planner-settings').open=true;changed();}
 function now(){inputError='';if(!planning){refresh();return;}planning=false;$('planner-settings').open=false;changed();}
 $('plan-now').addEventListener('click',now);$('plan-night').addEventListener('click',()=>plan());
 $('plan-date').addEventListener('change',()=>{const next=$('plan-date').value;if(!valid(next,minute))return;day=next;changed();});
 $('plan-time').addEventListener('input',()=>{const next=Number($('plan-time').value);if(!valid(day,next)){$('plan-time').value=String(minute);return;}minute=next;refresh();clearTimeout(pending);pending=setTimeout(onChange,80);});
 $('plan-time').addEventListener('change',()=>{const next=Number($('plan-time').value);if(!valid(day,next)){$('plan-time').value=String(minute);return;}minute=next;changed();});
 $('planning-live').addEventListener('click',now);
 refresh();
 return {context,refresh,plan,now,get planning(){return planning;},get zone(){return getZone();}};
}
