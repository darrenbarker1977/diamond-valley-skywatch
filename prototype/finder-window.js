// One shared atlas, moved into the finder. No simulated pose or camera fallback.
export function createFinderWindow({onExpand,onClose,getContext=()=>null,env=window,root=document}){
 const $=id=>root.getElementById(id),stage=root.querySelector('.atlas-stage'),home=stage.parentElement,anchor=stage.nextSibling,canvas=$('sky-canvas'),video=$('finder-live-camera');
 const originalLabel=canvas.getAttribute('aria-label');let active=false,pose=null,stream=null,generation=0,cameraPending=false,view='sky',cameraError='';
 function say(text){if($('finder-view-status').textContent!==text)$('finder-view-status').textContent=text;}
 function paint(){
  const aligned=!!pose?.alignment?.calibrated,measured=!!pose?.map?.ready;
  $('finder-view-sky').setAttribute('aria-pressed',String(view==='sky'));$('finder-view-camera').setAttribute('aria-pressed',String(view==='camera'));
  $('finder-view-camera').disabled=cameraPending||pose?.practice||pose?.mode==='mounted';
  $('finder-map-slot').hidden=view==='camera';video.hidden=view!=='camera';
  $('finder-live-stage').dataset.view=view;$('finder-live-stage').dataset.tracking=aligned&&measured?'live':aligned?'paused':'preview';
  const context=getContext(),practiceClock=context?.practice?new Intl.DateTimeFormat('en-CA',{timeZone:context.zone,month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(context.instant):'';
  $('finder-view-badge').textContent=pose?.practice?'PRACTICE · ASSUMED · '+practiceClock:view==='camera'?'Rear camera · phone estimate':aligned?(measured?'Live aligned sky':'Paused · last sky view'):'Calculated sky preview · align to follow';
  if(cameraPending)say('Requesting the rear camera… You can keep using Live sky.');
  else if(cameraError)say(cameraError+' Live sky and setup remain available.');
  else if(view==='camera')say('Local rear camera with coarse sensor guidance. The app does not recognise objects or verify centring. Nothing is recorded or uploaded.');
  else if(pose?.practice)say('Real phone movement through a temporary night sky. Direction offsets are assumed for practice; they do not point a telescope at real objects. Return to real time and align after dusk.');
  else say(pose?.mode==='mounted'?'Mounted guidance follows the phone’s top edge along the tube. Rear camera is for handheld mode; use the telescope finder and eyepiece to confirm the object.':aligned?'Live sky follows the aligned rear-camera direction. Rear camera is optional; arrows and pulses use the same checked phone readings.':'Choose a target, then align on one known bright object. The preview is not a measured phone direction.');
 }
 function stopCamera(message=''){
  generation++;cameraPending=false;if(stream)stream.getTracks().forEach(track=>track.stop());stream=null;video.srcObject=null;view='sky';cameraError=message;paint();
 }
 async function camera(){
  if(view==='camera'){stopCamera();return;}
  if(!active||pose?.practice||pose?.mode==='mounted')return;
  const requested=++generation;cameraPending=true;cameraError='';paint();
  try{
   if(!env.isSecureContext||!env.navigator.mediaDevices?.getUserMedia)throw Error('Rear camera requires HTTPS and camera support.');
   const received=await env.navigator.mediaDevices.getUserMedia({video:{facingMode:{exact:'environment'}},audio:false});
   if(requested!==generation||!active||env.document.hidden||pose?.mode==='mounted'){received.getTracks().forEach(track=>track.stop());return;}
   stream=received;const track=stream.getVideoTracks()[0];
   if(track?.getSettings().facingMode!=='environment')throw Error('A rear-facing camera could not be confirmed.');
   const ended=()=>{if(requested===generation)stopCamera('Camera stream ended. Tap Rear camera to retry.');};track.addEventListener?.('ended',ended,{once:true});track.addEventListener?.('mute',ended,{once:true});
   video.srcObject=stream;await video.play();
   if(requested!==generation)return;
   view='camera';cameraPending=false;paint();
  }catch(error){if(requested!==generation)return;stopCamera('Camera unavailable: '+(error.message||'check camera permission and try again.'));}
 }
 $('finder-view-camera').addEventListener('click',camera);$('finder-view-sky').addEventListener('click',()=>stopCamera());$('finder-window-expand').addEventListener('click',onExpand);$('finder-window-close').addEventListener('click',onClose);
 env.document.addEventListener('visibilitychange',()=>{if(env.document.hidden)stopCamera();});env.addEventListener('pagehide',()=>stopCamera());
 paint();
 return {
  activate(value){
   active=value;if(value){$('finder-map-slot').append(stage);canvas.tabIndex=-1;canvas.setAttribute('aria-label','Live calculated sky for the aligned phone. Use Live sky controls and the arrows to find your target.');}
   else{stopCamera();home.insertBefore(stage,anchor);canvas.tabIndex=0;canvas.setAttribute('aria-label',originalLabel);}
   paint();
  },
  pose(state){const changed=pose&&state.mode!==pose.mode;pose=state;if(changed||(!state.listening&&(stream||cameraPending||cameraError)))stopCamera();else paint();},
  stopCamera
 };
}
