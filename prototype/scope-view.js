export function createScopeView(){
 const $=id=>document.getElementById(id),view=$('finder-view');let active=false,hold=null,wanted=false,generation=0,scroll=0;
 const setStatus=text=>{$('scope-awake-status').textContent=text;};
 async function release(){generation++;const prior=hold;hold=null;$('scope-awake').setAttribute('aria-pressed','false');if(prior)try{await prior.release();}catch{}}
 async function acquire(){
  const id=++generation;
  try{
   if(!isSecureContext||!navigator.wakeLock?.request)throw Error('This browser does not offer screen hold. Use the phone’s screen-timeout setting.');
   setStatus('Requesting screen hold…');const lock=await navigator.wakeLock.request('screen');
   if(id!==generation||!active||!wanted||document.hidden){await lock.release();return;}
   hold=lock;$('scope-awake').setAttribute('aria-pressed','true');setStatus('Screen held awake while this view stays open.');
   lock.addEventListener('release',()=>{if(hold!==lock)return;hold=null;wanted=false;$('scope-awake').setAttribute('aria-pressed','false');setStatus('Screen hold ended. Tap Keep awake to retry.');});
  }catch(error){if(id===generation){wanted=false;setStatus('Screen hold unavailable: '+error.message);$('scope-awake').setAttribute('aria-pressed','false');}}
 }
 function exit(){
  if(!active)return;active=false;wanted=false;release();document.body.classList.remove('dv-scope-view');view.removeAttribute('aria-modal');view.removeAttribute('role');view.removeAttribute('tabindex');$('finder-scope-view').setAttribute('aria-expanded','false');window.scrollTo(0,scroll);$('finder-scope-view').focus({preventScroll:true});setStatus('Optional: keep the screen awake while locating objects.');
 }
 $('finder-scope-view').addEventListener('click',()=>{
  if(active){exit();return;}active=true;scroll=window.scrollY;document.body.classList.add('dv-scope-view');view.setAttribute('role','dialog');view.setAttribute('aria-modal','true');view.setAttribute('tabindex','-1');$('finder-scope-view').setAttribute('aria-expanded','true');$('scope-exit').focus({preventScroll:true});
 });
 $('scope-exit').addEventListener('click',exit);
 $('scope-awake').addEventListener('click',()=>{if(!active)return;if(wanted||hold){wanted=false;release();setStatus('Screen hold off.');}else{wanted=true;acquire();}});
 $('scope-night').addEventListener('click',()=>$('night').click());
 const night=()=>{$('scope-night').setAttribute('aria-pressed',String(document.body.classList.contains('dv-nav-night')));};new MutationObserver(night).observe(document.body,{attributes:true,attributeFilter:['class']});night();
 document.addEventListener('keydown',event=>{
  if(!active)return;
  if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();exit();return;}
  if(event.key==='Tab'){
   const buttons=[...view.querySelectorAll('button,input,select,summary,a[href]')].filter(el=>!el.disabled&&el.getClientRects().length);
   if(!buttons.length)return;const first=buttons[0],last=buttons.at(-1);
   if(event.shiftKey&&(document.activeElement===first||!view.contains(document.activeElement))){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&(document.activeElement===last||!view.contains(document.activeElement))){event.preventDefault();first.focus();}
  }
 },true);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){release();setStatus('Screen hold paused while the app is hidden.');}else if(active&&wanted)acquire();});
 window.addEventListener('pagehide',()=>{wanted=false;release();});$('navigator').addEventListener('close',exit);
 return {exit,get active(){return active;}};
}
