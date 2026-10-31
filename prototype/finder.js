import {objectStory,objectVisual} from './object-cards.js?v=field-1';
import {viewingPlan,describe} from './eyepieces.js?v=catalogue-1';
export function createFinder({onSetup,onMode,onStop,onSky,onAdvance,onPick,getKit}){
 const $=id=>document.getElementById(id);let lastId='',preferredMode='mounted';
 function modeUI(){for(const button of document.querySelectorAll('[data-finder-mode]'))button.setAttribute('aria-pressed',String(button.dataset.finderMode===preferredMode));$('finder-setup').textContent=preferredMode==='mounted'?'⌖ Align on telescope':'⌖ Align handheld';$('finder-mode-hint').textContent=(preferredMode==='handheld'?'Point the rear camera at the sky.':'Guide with the phone’s top edge along the telescope tube.')+(typeof navigator.vibrate==='function'?' Follow the arrows; optional vibration gives faster pulses as you get closer.':' Follow the arrows; vibration is unavailable in this browser.');}
 $('finder-setup').addEventListener('click',()=>onSetup(preferredMode));$('finder-sky').addEventListener('click',onSky);$('finder-stop').addEventListener('click',onStop);
 for(const button of document.querySelectorAll('[data-finder-mode]'))button.addEventListener('click',()=>{preferredMode=button.dataset.finderMode;onMode(preferredMode);modeUI();});
 $('finder-primary').addEventListener('click',onAdvance);$('finder-pick-target').addEventListener('click',onPick);
 modeUI();
 const set=(id,text)=>{if($(id).textContent!==text)$(id).textContent=text;};
 return {get mode(){return preferredMode;},
  target(object,p){
   if(lastId!==object.id){$('finder-photo').replaceChildren(objectVisual(object));lastId=object.id;}
   set('finder-tracking-label','Target: '+object.name+' · live sky');
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
   const ready=!!state.ready,aligned=!!state.alignment?.calibrated,quality=state.alignment?.quality||state.quality;
   $('finder-arrows').hidden=!ready;$('finder-locked').hidden=ready;
   $('finder-compass').classList.toggle('is-ready',ready);set('finder-guide-text',state.message||'Enable sensors, then align on one identified object.');
   const level=quality==='basic'?'ONE-TARGET BASIC · ACCURACY UNVERIFIED':quality==='refined'?'TWO-TARGET REFINED · CHECK OPTIONAL':'CHECKED ALIGNMENT · LIVE SENSOR ESTIMATE';
   set('finder-session',aligned?(ready?'LIVE GUIDANCE · ':'ALIGNMENT RETAINED · PAUSED · ')+level:state.listening?'SENSORS ON · ONE OBJECT STILL NEEDED':'LIVE SKY · POINTING SETUP REQUIRED');
   const reason=state.guidanceStatus;
   const primary=reason==='daylight'?'Plan tonight · alignment after dusk':aligned?(['live','below-horizon','overhead','unsafe'].includes(reason)?'Choose a visible target':'Resume sensor readings'):reason==='presence'?'Confirm this observing location':!state.listening?'Set up sensors & one-object alignment':'Record one bright object · start finding';
   set('finder-primary',primary);
   $('finder-reticle').hidden=!ready;$('finder-turn-arrow').hidden=!ready||state.error<=3;
   if(ready){const x=state.azDelta*Math.cos((state.current?.alt||0)*Math.PI/180),y=state.altDelta;$('finder-turn-arrow').style.transform=`rotate(${Math.atan2(x,y)*180/Math.PI}deg)`;}

   set('finder-state-title',aligned?(reason==='below-horizon'?'That target is below your horizon':reason==='overhead'?'Choose a target away from overhead':reason==='stale'?'Waiting for fresh readings':reason==='noisy'?'Move smoothly':reason==='unsafe'?'Choose another target':'Alignment retained · guidance paused'):reason==='daylight'?'Waiting for dusk':state.listening?'Sensors are on · align one object':'Start live pointing');
   set('finder-state-help',aligned?(state.message||'Your alignment is retained. Follow the next step below.'):reason==='daylight'?'Browse or plan now; identify and record an alignment object after dusk.':state.listening?'Next, centre one bright object you can identify and tap Record. Sensor permission alone does not align the phone.':'Enable sensors, then centre and record one identified bright object. Guidance opens automatically after that.');
   $('finder-setup').textContent=aligned?'Refine alignment · optional':preferredMode==='mounted'?'⌖ Align on telescope':'⌖ Align handheld';
   $('finder-sky').textContent=aligned?'Explore full sky map':'Browse the sky map';
   if(!ready){set('finder-horizontal','');set('finder-vertical','');set('finder-error','');return;}
   set('finder-horizontal',Math.abs(state.azDelta)<2?'↔ Azimuth close':`${state.azDelta>0?'→ Right':'← Left'} ${Math.abs(state.azDelta).toFixed(1)}°`);
   set('finder-vertical',Math.abs(state.altDelta)<2?'↕ Height close':`${state.altDelta>0?'↑ Raise':'↓ Lower'} ${Math.abs(state.altDelta).toFixed(1)}°`);
   set('finder-error',state.error<=3?'Inside the coarse 3° estimate — confirm in the finder':`${state.error.toFixed(1)}° from the selected target`);
  },
  fail(){set('finder-destination','Sky calculation unavailable');set('finder-coordinates','');this.pose({ready:false,message:'No sky position or pointing direction will be substituted.'});}
 };
}
