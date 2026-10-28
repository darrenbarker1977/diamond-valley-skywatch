// One foreground-only Screen Wake Lock shared by every app view.
export function createScreenAwake({env=window,root=document}={}){
 const key='dvsky:screen-awake:v1';let wanted=true;
 try{wanted=env.localStorage.getItem(key)!=='off';}catch{}
 let hold=null,pending=null,generation=0,retryTimer=null,releaseRetries=1,gestureRetried=false,state='off',message='Screen hold is off. Your usual timeout applies.';
 const buttons=[...root.querySelectorAll('[data-screen-awake]')],statuses=[...root.querySelectorAll('[data-screen-awake-status]')],auto=root.getElementById('screen-awake-auto');
 function paint(){
  if(auto)auto.checked=wanted;
  const active=!!hold&&!hold.released;
  const label=active?'Screen awake: on':state==='requesting'?'Screen awake: starting…':state==='paused'?'Screen awake: paused':state==='unsupported'?'Screen hold unavailable':state==='blocked'||state==='released'?'Keep awake · retry':'Keep screen awake';
  for(const button of buttons){button.textContent=label;button.setAttribute('aria-pressed',String(active));button.dataset.state=state;button.title=message;}
  for(const el of statuses)if(el.textContent!==message)el.textContent=message;
 }
 function save(){try{env.localStorage.setItem(key,wanted?'on':'off');}catch{}}
 function release(){
  generation++;if(retryTimer!==null)env.clearTimeout(retryTimer);retryTimer=null;pending=null;
  const old=hold;hold=null;if(old)Promise.resolve(old.release()).catch(()=>{});
 }
 async function acquire(){
  if(!wanted||env.document.hidden||hold||pending)return;
  if(!env.isSecureContext||!env.navigator.wakeLock?.request){state='unsupported';message='Screen hold is unavailable in this browser. Use Chrome over HTTPS, or increase Android Display → Screen timeout.';paint();return;}
  const token={generation};pending=token;state='requesting';message='Requesting a screen hold. Your normal timeout still applies until it is granted.';paint();
  try{
   const lock=await env.navigator.wakeLock.request('screen');
   if(token.generation!==generation||!wanted||env.document.hidden){await lock.release();return;}
   if(lock.released)throw Error('The phone released the screen hold before it became active.');
   hold=lock;state='on';message='Screen held awake across Home, Forecast, Navigator, camera and Scope view while the app stays visible. Turn it off when finished.';paint();
   lock.addEventListener('release',()=>{
    if(hold!==lock)return;hold=null;
    if(!wanted){state='off';message='Screen hold is off. Your usual timeout applies.';paint();return;}
    if(env.document.hidden){state='paused';message='Screen hold paused while the app is hidden. It will be requested again when you return.';paint();return;}
    state='released';message='The phone ended screen hold. Keep awake is no longer active.';paint();
    if(releaseRetries>0){releaseRetries--;message='The phone ended screen hold. Trying once to restore it…';paint();retryTimer=env.setTimeout(()=>{retryTimer=null;acquire();},500);}
    else{message='The phone ended screen hold. Tap Keep awake to retry; Battery Saver or phone policy may prevent it.';paint();}
   });
  }catch(error){if(token.generation===generation){state='blocked';message='Screen hold unavailable: '+(error.message||'The phone refused the request.')+' Your normal timeout applies; tap Keep awake to retry.';paint();}}
  finally{if(pending===token)pending=null;}
 }
 function set(value){
  wanted=value;save();releaseRetries=1;
  if(!wanted){release();state='off';message='Screen hold is off. Your usual timeout applies.';paint();}
  else acquire();
 }
 function toggle(){if(hold||pending)set(false);else set(true);}
 function gesture(event){
  if(!event.isTrusted||!wanted||hold||pending||gestureRetried||env.document.hidden)return;
  gestureRetried=true;releaseRetries=1;acquire();
 }
 auto?.addEventListener('change',()=>set(auto.checked));
 root.addEventListener('click',event=>{if(event.target.closest?.('#screen-awake-auto'))return;if(event.target.closest?.('[data-screen-awake]'))toggle();else gesture(event);});
 // Forecast is a same-origin frame. Its user taps may provide a browser's
 // required activation too, without adding another wake-lock owner.
 const frame=root.getElementById('forecast-frame');frame?.addEventListener('load',()=>{try{frame.contentDocument?.addEventListener('click',gesture);}catch{}});
 function pause(){release();state=wanted?'paused':'off';message=wanted?'Screen hold paused while the app is hidden. It will be requested again when you return.':'Screen hold is off. Your usual timeout applies.';paint();}
 function resume(){if(!env.document.hidden&&wanted){gestureRetried=false;releaseRetries=1;acquire();}}
 env.document.addEventListener('visibilitychange',()=>{if(env.document.hidden)pause();else resume();});env.addEventListener('pagehide',pause);env.addEventListener('pageshow',resume);
 paint();if(wanted)acquire();return {toggle,set};
}
