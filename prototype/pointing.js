import {site} from './location.js?v=location-1';
import {OrientationSession} from './sensors.js';
import {skyVector,skyAngles,solveAlignment,validateAlignment,applyRotation,stableSample,guidance,angle} from './alignment.js';
import {easyTargets,easyObjects} from './easy-targets.js?v=catalogue-1';
export function createPointing({A,catalogue,position,getSelected,getAlignmentEyepiece=()=>'',onTargetSelect=()=>{},env=window}){
 const $=id=>document.getElementById(id);
 let samples=[],model=null,verified=false,checkError=null,choices=[],cameraStream=null,cameraGeneration=0;
 const session=new OrientationSession(env,()=>paint());
 const mode=()=>$('pointing-mode').value;
 function reset(message='Alignment cleared. Start with the easiest object you can identify.'){
  samples=[];model=null;verified=false;checkError=null;$('object-confirm').checked=false;$('alignment-feedback').textContent=message;refresh();
 }
 function stopCamera(){cameraGeneration++;if(cameraStream)cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null;$('camera').srcObject=null;$('camera-view').hidden=true;$('camera-toggle').setAttribute('aria-pressed','false');$('camera-toggle').textContent='Show rear-camera aiming view';$('camera-status').textContent='Camera off · nothing recorded or uploaded.';}
 function suspend(message='Sensors stopped. Enable again and repeat alignment before using arrows.'){
  session.stop();stopCamera();reset(message);paint();
 }
 function setup(){
  const mounted=mode()==='mounted';
  $('setup-help').textContent=mounted?'Strap the phone securely along the outside of the tube, screen facing out. Its physical top edge (opposite the charging port) must point toward the open end; keep its long edges parallel to the tube. Tighten the straps without obstructing movement. The guide uses that top-edge direction. Refit and start again if it slips.':'Hold the phone so its rear camera points at the sky. The aiming axis is out of the back of the phone, not the top of the screen. An optional camera crosshair can help you centre a bright object.';
  $('mount-confirm-label').hidden=!mounted;$('camera-tools').hidden=mounted;
 }
 function currentPositions(){const now=new Date();return new Map(catalogue.map(o=>[o.id,position(A,o,now)]));}
 function refresh(){
  if(!A){choices=[];paint();return;}
  try {
   const positions=currentPositions(),sun=positions.get('Sun');
   const phase=A.Illumination('Moon',new Date()).phase_fraction;
   choices=easyTargets(catalogue,positions,samples,phase);
   const select=$('alignment-target'),prior=select.value,ids=choices.map(o=>o.id).join('|');
   if(select.dataset.ids!==ids){select.replaceChildren(...choices.map(o=>{const option=document.createElement('option'),p=positions.get(o.id);option.value=o.id;option.textContent=`${o.name} · ${p.alt.toFixed(0)}° up · ${Math.round(p.az)}° true azimuth`;return option;}));select.dataset.ids=ids;if(choices.some(o=>o.id===prior))select.value=prior;else $('object-confirm').checked=false;}
   else for(const option of select.options){const o=catalogue.find(o=>o.id===option.value),p=positions.get(o.id);option.textContent=`${o.name} · ${p.alt.toFixed(0)}° up · ${Math.round(p.az)}° true azimuth`;}
   $('easy-explanation').textContent=sun.alt>-6?'It is too bright for this beginner alignment. Return after dusk; daylight alignment is disabled.':choices.length?'Suggested for right now, not a weather report. Clouds, trees and buildings may hide them. Choose a different option if you cannot confidently identify the first.':'No suitable easy object is available for this step right now. Wait for another time; do not guess at a faint object.';
   if(session.active&&select.value&&prior!==select.value)onTargetSelect(select.value);
   identify();paint();
  }catch(e){choices=[];$('alignment-target').replaceChildren();$('easy-explanation').textContent='Alignment suggestions unavailable: '+e.message;paint();}
 }
 function identify(){
  const object=choices.find(o=>o.id===$('alignment-target').value);
  $('identify-help').textContent=object?easyObjects[object.id].hint+' Its map position is selected for you when sensors are enabled. A fist at arm’s length spans roughly 10° of sky. Never aim at or near the Sun. '+(mode()==='mounted'?getAlignmentEyepiece():''):'';
 }
 function paint(){
  if(!session.active||session.status!=='receiving'){
   if(samples.length||model){samples=[];model=null;verified=false;$('alignment-feedback').textContent='Sensor continuity was lost. Repeat alignment.';}
  }
  if(samples.length&&session.now()-samples[0].time>5*60000&&!verified){samples=[];model=null;$('alignment-feedback').textContent='Alignment took more than five minutes. Start again with fresh objects.';}
  if(model&&verified&&session.now()-model.created>20*60000){samples=[];model=null;verified=false;$('alignment-feedback').textContent='Twenty-minute session expired. Repeat alignment and the check.';}
  const status=session.message;
  if($('sensor-status').textContent!==status)$('sensor-status').textContent=status;
  $('enable-sensors').disabled=session.active||session.status==='permission';
  $('stop-sensors').disabled=!session.active&&session.status!=='permission';
  const latest=session.history.at(-1),fresh=latest&&session.now()-latest.time<=700;
  let measured='No measured direction available.';
  if(fresh){
   const raw=skyAngles(latest.vector);
   measured=`Measured ${mode()==='mounted'?'phone top-edge':'rear-camera'} tilt: ${raw.alt.toFixed(1)}°. North heading is uncalibrated.`;
   if(model&&verified){const p=skyAngles(applyRotation(model.rotation,latest.vector));measured=`${mode()==='mounted'?'Phone-derived tube estimate':'Aligned rear-camera estimate'}: ${p.alt.toFixed(1)}° up · ${p.az.toFixed(1)}° true azimuth. Third-object check ${checkError.toFixed(1)}°; sensor accuracy unknown.`;}
  }
  $('measured-direction').textContent=measured;
  const stage=samples.length;
  $('alignment-step').textContent=verified?'Alignment checked for this session':stage===0?'1 · Start with something easy':stage===1?'2 · Choose a different part of the sky':'3 · Check with a third object';
  $('alignment-help').textContent=verified?'Use search to select your destination. Move slowly and watch the actual sky. If arrows disagree with what you see, stop and start alignment again.':stage===0?'Identify one suggested bright object, centre it, and hold still for about one second. One object alone does not unlock arrows.':stage===1?'The suggestions now show objects 30°–140° from your first one. Centre another object you can confidently identify, then hold still.':'Use a third object at least 20° away from each of the first two. Centre it before recording. Arrows remain off until this independent check passes.';
  $('capture-alignment').textContent=stage===0?'Record first object':stage===1?'Record second object':'Check third object';
  let stable=false;try{stableSample(session.history,session.now());stable=true;}catch{}
  $('capture-alignment').disabled=verified||!fresh||!stable||!$('object-confirm').checked||!choices.length||(mode()==='mounted'&&!$('mount-confirm').checked);
  $('alignment-target').disabled=verified||!choices.length;
  $('object-confirm').disabled=verified;
  let direction='Direction arrows are off until two objects and an independent check agree.';
  if(model&&verified&&fresh){
   const recent=session.history.filter(s=>session.now()-s.time<400);
   const quiet=recent.length>=3&&recent.every(s=>angle(s.vector,latest.vector)<4);
   try {
    const current=skyAngles(applyRotation(model.rotation,latest.vector)),now=new Date(),target=getSelected(),p=position(A,target,now),sun=position(A,catalogue.find(o=>o.id==='Sun'),now);
    if(!quiet)direction='Hold steady briefly. Direction arrows are paused while readings are moving or noisy.';
    else if(sun.alt>-6)direction='Guidance paused until after dusk.';
    else if(target.id==='Sun'||angle(skyVector(p),skyVector(sun))<30)direction='No guidance toward the Sun or objects within 30° of it.';
    else {const result=guidance(current,p);direction=`${target.name}: ${result.blocked||result.text}`;}
   }catch{direction='Sky calculation unavailable. Guidance is off.';}
  }
  if(!site.physicalConfirmed)direction='Sky viewing only. Confirm you are physically at this observing location before using sensor guidance.';
  $('guidance').textContent=direction;
  $('compact-guidance').textContent=session.active?direction:session.message+'. Open Pointing when you want to align.';
  document.querySelector('.dv-nav-alignment').hidden=!session.active||verified;
  if(!session.active)$('pointing-setup').open=true;
  else if(session.status==='receiving'&&$('pointing-setup').dataset.autoCollapsed!=='true'){$('pointing-setup').open=false;$('pointing-setup').dataset.autoCollapsed='true';}
 }
 $('enable-sensors').addEventListener('click',()=>{if(!site.physicalConfirmed){$('alignment-feedback').textContent='Remote viewing only. Confirm that you are physically at this observing site before enabling pointing.';return;}reset();$('pointing-setup').dataset.autoCollapsed='false';session.start(mode());if($('alignment-target').value)onTargetSelect($('alignment-target').value);});
 window.addEventListener('dvsky-presence-changed',()=>{if(!site.physicalConfirmed)suspend('Physical presence is not confirmed. Remote viewing remains available; pointing is off.');else paint();});
 $('stop-sensors').addEventListener('click',()=>suspend());
 $('reset-alignment').addEventListener('click',()=>reset());
 $('pointing-mode').addEventListener('change',()=>{suspend('Mode changed. Reposition your phone, enable sensors and start alignment again.');$('mount-confirm').checked=false;setup();});
 $('mount-confirm').addEventListener('change',()=>{reset('Phone placement changed. Start alignment again.');});
 $('object-confirm').addEventListener('change',paint);
 $('alignment-target').addEventListener('change',()=>{$('object-confirm').checked=false;if($('alignment-target').value)onTargetSelect($('alignment-target').value);identify();paint();});
 $('capture-alignment').addEventListener('click',()=>{
  let accepted=false;
  try {
   if(!session.active||session.status!=='receiving')throw Error('Enable fresh absolute sensor readings first.');
   if(!$('object-confirm').checked||(mode()==='mounted'&&!$('mount-confirm').checked))throw Error('Confirm the object and phone placement first.');
   const positions=currentPositions(),phase=A.Illumination('Moon',new Date()).phase_fraction;
   const eligible=easyTargets(catalogue,positions,samples,phase),object=eligible.find(o=>o.id===$('alignment-target').value);
   if(!object)throw Error('That object is no longer suitable. Refresh the suggestions and choose another.');
   const measured=stableSample(session.history,session.now()),sample={id:object.id,measured,target:skyVector(positions.get(object.id)),time:session.now()};
   accepted=true;
   if(samples.length===0){samples.push(sample);$('alignment-feedback').textContent=`${object.name} recorded. Next choose another part of the sky.`;}
   else if(samples.length===1){model=solveAlignment(samples[0],sample);samples.push(sample);$('alignment-feedback').textContent=`Two objects recorded; fit residual ${model.residual.toFixed(1)}°. Arrows stay off until a third-object check.`;}
   else {checkError=validateAlignment(model,samples,sample);verified=true;model.created=session.now();$('alignment-feedback').textContent=`Third-object check passed within ${checkError.toFixed(1)}°. This is a coarse estimate; confirm targets in the eyepiece.`;}
   $('object-confirm').checked=false;refresh();
  }catch(e){if(accepted){samples=[];model=null;verified=false;}$('alignment-feedback').textContent=e.message;refresh();}
 });
 $('camera-toggle').addEventListener('click',async()=>{
  if(cameraStream){stopCamera();return;}
  const generation=++cameraGeneration;
  try {
   if(mode()!=='handheld'||!env.isSecureContext||!env.navigator.mediaDevices?.getUserMedia)throw Error('Rear-camera preview needs HTTPS and camera support in handheld mode.');
   $('camera-status').textContent='Requesting rear-camera permission…';
   const stream=await env.navigator.mediaDevices.getUserMedia({video:{facingMode:{exact:'environment'}},audio:false});
   if(generation!==cameraGeneration||!$('navigator').open){stream.getTracks().forEach(t=>t.stop());return;}
   cameraStream=stream;
   const facing=stream.getVideoTracks()[0]?.getSettings().facingMode;
   if(facing!=='environment')throw Error('A rear-facing camera could not be confirmed. Preview stopped.');
   cameraStream=stream;$('camera').srcObject=stream;$('camera-view').hidden=false;await $('camera').play();
   if(generation!==cameraGeneration)return;
   $('camera-toggle').setAttribute('aria-pressed','true');$('camera-toggle').textContent='Stop rear-camera view';$('camera-status').textContent='Centre the identified object on the crosshair. The view is local; nothing is recorded. Camera-axis accuracy still needs a real-phone check.';
  }catch(e){if(generation!==cameraGeneration)return;stopCamera();$('camera-status').textContent='Camera unavailable: '+e.message;}
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend('App was hidden. Enable sensors and repeat alignment.');});
 env.addEventListener('pagehide',()=>suspend('Page was left. Repeat alignment on return.'));
 env.screen?.orientation?.addEventListener('change',()=>suspend('Screen orientation changed. Repeat alignment in the new position.'));
 $('close').addEventListener('click',()=>suspend());
 $('navigator').addEventListener('cancel',()=>suspend());
 $('navigator').addEventListener('close',()=>suspend());
 $('camera-tools').addEventListener('toggle',()=>{if(!$('camera-tools').open)stopCamera();});
 setup();refresh();return {refresh,paint,suspend,hideCamera:stopCamera};
}
