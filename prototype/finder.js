import {objectStory,objectVisual} from './object-cards.js?v=compass-1';
import {viewingPlan,describe} from './eyepieces.js?v=catalogue-1';
export function createFinder({onSetup,onMode,onStop,onSky,getKit}){
 const $=id=>document.getElementById(id);let lastId='',preferredMode='mounted';
 function modeUI(){for(const button of document.querySelectorAll('[data-finder-mode]'))button.setAttribute('aria-pressed',String(button.dataset.finderMode===preferredMode));$('finder-setup').textContent=preferredMode==='mounted'?'⌖ Align on telescope':'⌖ Align handheld';}
 $('finder-setup').addEventListener('click',()=>onSetup(preferredMode));$('finder-sky').addEventListener('click',onSky);$('finder-stop').addEventListener('click',onStop);
 for(const button of document.querySelectorAll('[data-finder-mode]'))button.addEventListener('click',()=>{preferredMode=button.dataset.finderMode;onMode(preferredMode);modeUI();});
 modeUI();
 const set=(id,text)=>{if($(id).textContent!==text)$(id).textContent=text;};
 return {
  target(object,p){
   if(lastId!==object.id){$('finder-photo').replaceChildren(objectVisual(object));lastId=object.id;}
   set('finder-name',object.name);set('finder-type',object.id===object.name?object.type:object.id+' · '+object.type);
   const compass=['N','NE','E','SE','S','SW','W','NW'][Math.round(p.az/45)%8];
   set('finder-destination',object.id==='Sun'?'Solar target · telescope guidance disabled':p.alt>0?`Look toward ${compass} · ${p.alt.toFixed(0)}° above the horizon`:'Below the horizon at this observing location');
   set('finder-coordinates',`${p.az.toFixed(1)}° true azimuth · ${p.alt.toFixed(1)}° altitude · calculated for now`);
   set('finder-expect',objectStory(object).expect);
   const plan=viewingPlan(object,getKit(),p.alt),choice=plan.steps[1]||plan.steps[0];
   set('finder-eyepiece',choice?describe(choice.choice):plan.note);
   set('finder-start',object.id==='Sun'?'Do not point the telescope toward the Sun without appropriate certified solar equipment.':choice&&plan.steps[1]?'Find it first with '+describe(plan.steps[0].choice)+'.':'Start at low power. Increase only while detail stays sharp.');
   $('finder-setup').disabled=object.id==='Sun';
  },
  pose(state){
   if(state.listening&&state.mode&&state.mode!==preferredMode){preferredMode=state.mode;modeUI();}
   $('finder-stop').disabled=!state.listening;
   const ready=!!state.ready;$('finder-arrows').hidden=!ready;$('finder-locked').hidden=ready;
   $('finder-compass').classList.toggle('is-ready',ready);set('finder-guide-text',state.message||'Align your phone before direction arrows appear.');
   set('finder-session',ready?'CHECKED ALIGNMENT · LIVE SENSOR ESTIMATE':'SKY POSITION ONLY · ARROWS LOCKED');
   if(!ready){set('finder-horizontal','');set('finder-vertical','');set('finder-error','');return;}
   set('finder-horizontal',Math.abs(state.azDelta)<2?'↔ Azimuth close':`${state.azDelta>0?'→ Right':'← Left'} ${Math.abs(state.azDelta).toFixed(1)}°`);
   set('finder-vertical',Math.abs(state.altDelta)<2?'↕ Height close':`${state.altDelta>0?'↑ Raise':'↓ Lower'} ${Math.abs(state.altDelta).toFixed(1)}°`);
   set('finder-error',state.error<=3?'Inside the coarse 3° estimate — confirm in the finder':`${state.error.toFixed(1)}° from the selected target`);
  },
  fail(){set('finder-destination','Sky calculation unavailable');set('finder-coordinates','');this.pose({ready:false,message:'No sky position or pointing direction will be substituted.'});}
 };
}
