export function warmth(error){
 if(!Number.isFinite(error)||error<0)return null;
 return error<=3?{interval:1500,pattern:[75,100,75],label:'Near the coarse estimate · confirm in the finder; this is not a lock.'}:error<=7?{interval:550,pattern:90,label:'Hot · within 7° of the phone estimate.'}:error<=15?{interval:900,pattern:80,label:'Warmer · within 15°.'}:error<=30?{interval:1400,pattern:70,label:'Getting closer · within 30°.'}:{interval:2200,pattern:60,label:'Farther away · slow pulses. Follow the direction arrows.'};
}
export function createHapticGuide({env=window,root=document}={}){
 const $=id=>root.getElementById(id),buttons=[$('finder-vibration'),$('finder-vibration-quick')].filter(Boolean),status=$('vibration-status'),quick=$('vibration-window-status'),testButton=$('finder-vibration-test'),testStatus=$('vibration-test-status'),autoControl=$('guidance-vibration-auto');
 const supported=typeof env.navigator.vibrate==='function',preferenceKey='dvsky:vibration:auto:v1';let automatic=true;try{automatic=env.localStorage.getItem(preferenceKey)!=='off';}catch{}
 let enabled=false,active=false,pose=null,last=-Infinity,buzzing=false,anchor=null,trend='',blocked='',testing=false,testTimer=null;
 if(autoControl)autoControl.checked=automatic;
 const now=()=>env.performance.now();
 const set=(el,value)=>{if(el&&el.textContent!==value)el.textContent=value;};
 function text(value){set(status,value);set(quick,value);}
 function save(value){automatic=value;if(autoControl)autoControl.checked=value;try{env.localStorage.setItem(preferenceKey,value?'on':'off');}catch{}}
 function stop(){
  if(testTimer!==null)env.clearTimeout(testTimer);testTimer=null;testing=false;
  if(buzzing){try{env.navigator.vibrate(0);}catch{}}buzzing=false;last=-Infinity;anchor=null;trend='';
 }
 function paint(){for(const button of buttons){button.setAttribute('aria-pressed',String(enabled));button.textContent=button.id==='finder-vibration-quick'?(enabled?'Pulses on':'Pulses off'):(enabled?'Vibration guidance: on':'Vibration guidance: off');button.disabled=!supported;}if(testButton)testButton.disabled=!supported||testing;}
 function request(pattern){
  try{if(env.navigator.vibrate(pattern)===false)throw Error('The browser refused the vibration request.');buzzing=true;return true;}
  catch{blocked='Vibration blocked or unavailable. Tap Test pulse to retry from your touch; check phone settings if it stays silent.';stop();paint();text(blocked);return false;}
 }
 function update(state=pose){
  pose=state?.haptic?{...state.haptic,message:state.haptic.message||state.message}:state;
  if(!supported){text('Vibration is unavailable in this browser. Use Chrome on a supported Android phone; arrows still work.');return;}
  if(testing){if(active&&!env.document.hidden)return;stop();paint();}
  if(!enabled){text('Vibration is off. Direction arrows still work.');return;}
  if(blocked){text(blocked);return;}
  if(!active||env.document.hidden||!pose?.ready){stop();text('Vibration paused · '+(!active?'Open Find target to use guidance.':env.document.hidden?'The app is hidden.':pose?.message||'Align on one identified object.'));return;}
  const band=warmth(pose.error);if(!band){stop();text('Vibration paused · no valid aligned distance.');return;}
  if(anchor===null)anchor=pose.error;else if(Math.abs(pose.error-anchor)>=1.5){trend=pose.error<anchor?'Getting closer · ':'Moving away · ';anchor=pose.error;}
  text('Pulses requested · '+trend+band.label);
  if(now()-last<band.interval)return;
  if(request(band.pattern))last=now();
 }
 function toggle(){enabled=!enabled;save(enabled);blocked='';stop();paint();update();}
 for(const button of buttons)button.addEventListener('click',toggle);
 autoControl?.addEventListener('change',()=>{save(autoControl.checked);enabled=automatic&&supported;blocked='';stop();paint();update();});
 function start(){if(!automatic||!supported)return;enabled=true;paint();update();}
 testButton?.addEventListener('click',()=>{
  if(!supported||!active||env.document.hidden)return;
  stop();blocked='';
  if(testStatus)testStatus.hidden=false;
  if(!request([160,100,160])){set(testStatus,'Test refused by the browser. Allow vibration/site access where available, then tap Test pulse again.');return;}
  testing=true;paint();text('Test pulse requested · this is a phone check, not target guidance.');
  set(testStatus,'Two test pulses requested. The browser cannot confirm you felt them. If silent, check phone vibration settings and Do Not Disturb using the help below.');
  testTimer=env.setTimeout(()=>{testTimer=null;testing=false;buzzing=false;last=-Infinity;paint();update();},460);
 });
 $('vibration-phone-checks')?.addEventListener('click',()=>{const help=$('vibration-help');if(help){help.open=true;help.scrollIntoView({block:'center'});help.querySelector('summary')?.focus();}});
 function hidden(){stop();pose=null;paint();update();}
 env.document.addEventListener('visibilitychange',()=>{if(env.document.hidden)hidden();});env.addEventListener('pagehide',hidden);
 paint();update();
 return {start,pose:update,activate(value){active=value;if(!active){stop();pose=null;paint();}update();},reset(){stop();pose=null;paint();update();}};
}
