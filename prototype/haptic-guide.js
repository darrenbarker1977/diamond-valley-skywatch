export function warmth(error){
 if(!Number.isFinite(error)||error<0)return null;
 return error<=3?{interval:1500,pattern:[25,80,25],label:'Near the coarse estimate · confirm in the finder; this is not a lock.'}:error<=7?{interval:550,pattern:25,label:'Hot · within 7° of the phone estimate.'}:error<=15?{interval:900,pattern:25,label:'Warmer · within 15°.'}:error<=30?{interval:1400,pattern:20,label:'Getting closer · within 30°.'}:{interval:2200,pattern:15,label:'Farther away · slow pulses. Follow the direction arrows.'};
}
export function createHapticGuide({env=window,root=document}={}){
 const button=root.getElementById('finder-vibration'),status=root.getElementById('vibration-status');let enabled=false,active=false,pose=null,last=-Infinity,buzzing=false,anchor=null,trend='';
 const supported=typeof env.navigator.vibrate==='function',autoControl=root.getElementById('guidance-vibration-auto'),preferenceKey='dvsky:vibration:auto:v1';let automatic=true;try{automatic=env.localStorage.getItem(preferenceKey)!=='off';}catch{}
 if(autoControl)autoControl.checked=automatic;
 function saveAutomatic(value){automatic=value;if(autoControl)autoControl.checked=value;try{env.localStorage.setItem(preferenceKey,value?'on':'off');}catch{}}
 const text=value=>{if(status.textContent!==value)status.textContent=value;};
 function stop(){if(buzzing){try{env.navigator.vibrate(0);}catch{}}buzzing=false;last=-Infinity;anchor=null;trend='';}
 function paint(){button.setAttribute('aria-pressed',String(enabled));button.textContent=enabled?'Vibration guidance: on':'Vibration guidance: off';button.disabled=!supported;}
 function update(state=pose){
  pose=state?.haptic?{...state.haptic,message:state.haptic.message||state.message}:state;
  if(!enabled)return;
  if(!active||env.document.hidden||!pose?.ready){stop();text('Vibration paused · '+(pose?.message||'Open Find it and align on an identified object.'));return;}
  const band=warmth(pose.error);if(!band){stop();text('Vibration paused · no valid aligned distance.');return;}
  if(anchor===null)anchor=pose.error;else if(Math.abs(pose.error-anchor)>=1.5){trend=pose.error<anchor?'Getting closer · ':'Moving away · ';anchor=pose.error;}
  text(trend+band.label);
  const now=env.performance.now();if(now-last<band.interval)return;
  try{if(env.navigator.vibrate(band.pattern)===false)throw Error('Vibration was refused.');last=now;buzzing=true;}
  catch{enabled=false;stop();paint();text('Vibration unavailable or blocked by this phone. Direction arrows remain available.');}
 }
 button.addEventListener('click',()=>{enabled=!enabled;saveAutomatic(enabled);paint();stop();if(!enabled)text('Vibration is off. Direction arrows still work.');else update();});
 autoControl?.addEventListener('change',()=>{saveAutomatic(autoControl.checked);if(!automatic){enabled=false;stop();paint();text('Vibration is off. Direction arrows still work.');}});
 function start(){if(!automatic||!supported)return;enabled=true;paint();update();}
 env.document.addEventListener('visibilitychange',()=>{if(env.document.hidden){stop();pose=null;if(enabled)text('Vibration paused while the app is hidden. Fresh alignment is required on return.');}});
 env.addEventListener('pagehide',()=>{stop();pose=null;});
 paint();text(supported?'Optional · faster pulses mean closer to the aligned phone estimate. No vibration until guidance is ready.':'This browser does not support vibration. Direction arrows still work.');
 return {start,pose:update,activate(value){active=value;if(!active){stop();pose=null;if(enabled)text('Vibration paused outside Find it.');}},reset(){stop();pose=null;}};
}
