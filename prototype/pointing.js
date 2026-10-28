import {site} from './location.js?v=location-1';
import {OrientationSession} from './sensors.js';
import {skyVector,skyAngles,singleAlignment,alignedDirection,solveAlignment,validateAlignment,applyRotation,stableSample,guidance,angle} from './alignment.js?v=field-1';
import {easyTargets,easyObjects} from './easy-targets.js?v=catalogue-1';
export function createPointing({A,catalogue,position,getSelected,getAlignmentEyepiece=()=>'',onTargetSelect=()=>{},onAligned=()=>{},onPose=()=>{},allowGuidance=()=>true,env=window}){
 const $=id=>document.getElementById(id);
 let samples=[],model=null,verified=false,checkError=null,choices=[],cameraStream=null,cameraGeneration=0,cameraLive=false,isDaylight=false;
 const session=new OrientationSession(env,()=>paint());
 const mode=()=>$('pointing-mode').value;
 const searchText=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const matchesSearch=object=>{const text=searchText(`${object.id} ${object.name} ${object.id==='Polaris'?'North Star pole star':''}`);return searchText($('alignment-search').value).split(' ').every(word=>text.includes(word));};
 function reset(message='Alignment cleared. Start with the easiest object you can identify.'){
  samples=[];model=null;verified=false;checkError=null;$('alignment-search').value='';$('object-confirm').checked=false;$('alignment-feedback').textContent=message;refresh();
 }
 function stopCamera(){cameraGeneration++;if(cameraStream)cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null;cameraLive=false;$('camera').srcObject=null;$('alignment-actions-home').append($('alignment-actions'));if($('camera-view').open)$('camera-view').close();$('camera-view').hidden=true;document.body.classList.remove('dv-camera-aiming');$('camera-toggle').setAttribute('aria-pressed','false');$('camera-toggle').textContent='Show rear-camera aiming view';$('camera-status').textContent='Camera off · nothing recorded or uploaded.';}
 function suspend(message='Sensors stopped. Enable again and repeat alignment before using arrows.'){
  session.stop();stopCamera();$('pointing-setup').open=true;reset(message);paint();
 }
 function setup(){
  const mounted=mode()==='mounted';
  $('setup-help').textContent=mounted?'Strap the phone securely along the outside of the tube, screen facing out. Its physical top edge (opposite the charging port) must point toward the open end; keep its long edges parallel to the tube. Tighten the straps without obstructing movement. The guide uses that top-edge direction. Refit and start again if it slips.':'Hold the phone so its rear camera points at the sky. The aiming axis is out of the back of the phone, not the top of the screen. An optional camera crosshair can help you centre a bright object.';
  $('mount-confirm-label').hidden=!mounted;$('camera-tools').hidden=mounted;
 }
 function currentPositions(){const now=new Date();return new Map(catalogue.map(o=>[o.id,position(A,o,now)]));}
 function refresh(){
  if(!A){choices=[];isDaylight=false;paint();return;}
  try {
   const positions=currentPositions(),sun=positions.get('Sun');
   const phase=A.Illumination('Moon',new Date()).phase_fraction;
   const available=easyTargets(catalogue,positions,samples,phase),daylight=sun.alt>-6;
   isDaylight=daylight;
   choices=available.filter(matchesSearch);
   const select=$('alignment-target'),prior=select.value,ids=choices.map(o=>o.id).join('|');
   if(select.dataset.ids!==ids){select.replaceChildren(...choices.map(o=>{const option=document.createElement('option'),p=positions.get(o.id);option.value=o.id;option.textContent=`${o.name} · ${p.alt.toFixed(0)}° up · ${Math.round(p.az)}° true azimuth`;return option;}));select.dataset.ids=ids;if(choices.some(o=>o.id===prior))select.value=prior;else $('object-confirm').checked=false;}
   else if(choices.length)for(const option of select.options){const o=catalogue.find(o=>o.id===option.value),p=positions.get(o.id),text=`${o.name} · ${p.alt.toFixed(0)}° up · ${Math.round(p.az)}° true azimuth`;if(option.textContent!==text)option.textContent=text;}
   if(!choices.length){const text=daylight?'Available after dusk':available.length?'No matches · clear or change your search':'No suitable alignment objects right now';if(select.options[0]?.textContent!==text){const option=document.createElement('option');option.value='';option.textContent=text;select.replaceChildren(option);}$('object-confirm').checked=false;}
   $('easy-explanation').textContent=daylight?'It is too bright for this beginner alignment. This list opens after dusk; daylight alignment is disabled. You can still search all observing targets below.':available.length?'Suggested for right now, not a weather report. Clouds, trees and buildings may hide them. Type a name to filter this list, then choose the object you can confidently identify.':'No suitable easy object is available for this step right now. Wait for another time; do not guess at a faint object.';
   $('alignment-search-status').textContent=daylight?'Alignment search is ready; matching choices become available after dusk.':!available.length?'No easy objects meet the height, Sun distance and alignment separation requirements right now.':choices.length?`${choices.length} available ${choices.length===1?'match':'matches'}. The selected object is shown below.`:'No available match. Try another name or clear the search. This list contains easy alignment objects, not every observing target.';
   if(session.active&&!model&&select.value&&prior!==select.value)onTargetSelect(select.value);
   identify();paint();
  }catch(e){choices=[];isDaylight=false;const option=document.createElement('option');option.value='';option.textContent='Alignment choices unavailable';$('alignment-target').replaceChildren(option);delete $('alignment-target').dataset.ids;$('identify-help').textContent='';$('object-confirm').checked=false;$('alignment-search-status').textContent='Sky calculations are unavailable. Try refreshing the page.';$('easy-explanation').textContent='Alignment suggestions unavailable: '+e.message;paint();}
 }
 function identify(){
  const object=choices.find(o=>o.id===$('alignment-target').value);
  $('identify-help').textContent=object?easyObjects[object.id].hint+' Its map position is selected for you when sensors are enabled. A fist at arm’s length spans roughly 10° of sky. Never aim at or near the Sun. '+(mode()==='mounted'?getAlignmentEyepiece():''):'';
 }
 function paint(){
  $('alignment-daylight').hidden=!isDaylight;
  if(!session.active||['unreliable','denied','unsupported'].includes(session.status)){
   if(samples.length||model){samples=[];model=null;verified=false;$('alignment-feedback').textContent='Sensor continuity was lost. Repeat alignment.';}
  }
  if(model&&session.now()-model.created>20*60000){samples=[];model=null;verified=false;$('alignment-feedback').textContent='Twenty-minute session expired. Repeat alignment and the check.';}
  const status=session.message;
  if($('sensor-status').textContent!==status)$('sensor-status').textContent=status;
  $('enable-sensors').disabled=session.active||session.status==='permission';
  $('stop-sensors').disabled=!session.active&&session.status!=='permission';
  const latest=session.history.at(-1),fresh=latest&&session.now()-latest.time<=700;
  let measured='No measured direction available.';
  if(fresh){
   const raw=skyAngles(latest.vector);
   measured=`Measured ${mode()==='mounted'?'phone top-edge':'rear-camera'} tilt: ${raw.alt.toFixed(1)}°. North heading is uncalibrated.`;
   if(model){try{const p=alignedDirection(model,latest.vector);measured=`${mode()==='mounted'?'Phone-derived tube estimate':'Aligned rear-camera estimate'}: ${p.alt.toFixed(1)}° up · ${p.az.toFixed(1)}° true azimuth. ${verified?'Third-object check '+checkError.toFixed(1)+'°':model.kind==='single'?'One-target basic alignment; accuracy not measured':'Two-target refined alignment; no independent check'}; sensor accuracy unknown.`;}catch{measured='Fresh sensor values received, but this alignment correction is outside its usable range. Realign nearby.';}}
  }
  $('measured-direction').textContent=measured;
  const stage=samples.length;$('alignment-find').hidden=!model;
  $('alignment-step').textContent=isDaylight?'Waiting for dusk · alignment is paused':verified?'Alignment checked for this session':stage===0?'1 · Start with something easy':stage===1?'2 · Basic guidance ready · add another object if you like':'3 · Refined guidance ready · optional independent check';
  $('alignment-help').textContent=isDaylight?'No setup step is missing. This app waits until after dusk for sky alignment. Browsing and planning remain available.':verified?'Use search to select your destination. Move slowly and confirm through the finder.':stage===0?(session.active?'Identify one bright object, centre it and hold still for about one second. One target starts basic guidance; a second refines it.':'Choose an easy object below. Enable sensors above when you are ready to centre and record it. One target is enough to start.'):stage===1?'You can find targets now. One-target guidance corrects heading and tilt at your chosen object; accuracy elsewhere is not verified. Add a second object 30°–140° away for a fuller alignment.':'You can find targets now. A third object at least 20° from both alignment objects optionally checks the result. It is not required to start.';
  $('capture-alignment').textContent=isDaylight?'Alignment available after dusk':stage===0?'Record first object · start guidance':stage===1?'Add second object · refine alignment':'Check a third object · optional';
  let stable=false;try{stableSample(session.history,session.now());stable=true;}catch{}
  $('capture-alignment').disabled=verified||!fresh||!stable||!$('object-confirm').checked||!choices.length||(mode()==='mounted'&&!$('mount-confirm').checked)||(!!cameraStream&&!cameraLive);
  $('alignment-target').disabled=verified||!choices.length;
  $('object-confirm').disabled=verified||!choices.length;
  $('alignment-search').disabled=verified;
  const cameraObject=choices.find(o=>o.id===$('alignment-target').value);
  $('camera-object').textContent=verified?'Alignment checked · you can find your target now':cameraObject?(stage?'Next optional alignment object: ':'Align on: ')+cameraObject.name:'No suitable alignment object selected';
  $('camera-readiness').textContent=isDaylight?'Daylight alignment is unavailable. Return after dusk.':verified?'Alignment checked. Choose Find my target now when ready.':!session.active?'Close camera to enable pointing sensors. '+session.message:!choices.length?'Close the camera and choose a suitable alignment object.':!cameraLive?'Opening the rear camera…':!fresh||session.status!=='receiving'?'Recording disabled: '+session.message:!stable?'Hold the phone steady until Record becomes available.':!$('object-confirm').checked?(stage?'Guidance is ready. Find your target now, or centre the next optional object and confirm it below.':'Centre the identified object on the crosshair, then tick the confirmation below.'):'Steady readings received. Tap Record while the object is centred.';
  let direction=session.status==='stale'?'Sensor readings are stale; direction arrows are off until fresh samples arrive.':'Direction arrows are off until you align on one identified object.',pose={ready:false};
  if(model&&fresh){
   const recent=session.history.filter(s=>session.now()-s.time<400);
   const quiet=recent.length>=3&&recent.every(s=>angle(s.vector,latest.vector)<4);
   try {
    const current=alignedDirection(model,latest.vector),now=new Date(),target=getSelected(),p=position(A,target,now),sun=position(A,catalogue.find(o=>o.id==='Sun'),now);
    if(!quiet)direction='Hold steady briefly. Direction arrows are paused while readings are moving or noisy.';
    else if(sun.alt>-6)direction='Guidance paused until after dusk.';
    else if(target.id==='Sun'||angle(skyVector(p),skyVector(sun))<30)direction='No guidance toward the Sun or objects within 30° of it.';
    else {const result=guidance(current,p);direction=`${model.kind==='single'?'Basic one-target estimate · ':verified?'Checked alignment · ':'Two-target estimate · '}${target.name}: ${result.blocked||result.text}`;if(!result.blocked)pose={ready:true,current,quality:verified?'checked':model.kind==='single'?'basic':'refined',...result};}
   }catch{direction='Sky calculation unavailable. Guidance is off.';}
  }
  if(!site.physicalConfirmed){direction='Sky viewing only. Confirm you are physically at this observing location before using sensor guidance.';pose={ready:false};}
  if(!allowGuidance()){direction='Planned sky only. Return to Now and repeat alignment before using direction arrows.';pose={ready:false};}
  if(isDaylight){direction='Daylight at this observing location. Alignment is paused until after dusk. Sky browsing and tour planning still work.';pose={ready:false};}
  onPose({...pose,message:direction,listening:session.active||session.status==='permission',mode:mode()});
  $('guidance').textContent=direction;
  $('compact-guidance').textContent=session.active?direction:session.message+'. Open Pointing when you want to align.';
  document.querySelector('.dv-nav-alignment').hidden=verified;
  if(session.active&&session.status==='receiving'&&$('pointing-setup').dataset.autoCollapsed!=='true'){$('pointing-setup').open=false;$('pointing-setup').dataset.autoCollapsed='true';}
 }
 $('enable-sensors').addEventListener('click',()=>{if(!allowGuidance()){$('alignment-feedback').textContent='Return to Now before enabling pointing. A planned sky cannot supply live guidance.';return;}if(!site.physicalConfirmed){$('alignment-feedback').textContent='Remote viewing only. Confirm that you are physically at this observing site before enabling pointing.';return;}reset();$('pointing-setup').dataset.autoCollapsed='false';session.start(mode());if($('alignment-target').value)onTargetSelect($('alignment-target').value);});
 window.addEventListener('dvsky-presence-changed',()=>{if(!site.physicalConfirmed)suspend('Physical presence is not confirmed. Remote viewing remains available; pointing is off.');else paint();});
 $('stop-sensors').addEventListener('click',()=>suspend());
 $('reset-alignment').addEventListener('click',()=>reset());
 $('alignment-find').addEventListener('click',()=>document.querySelector('[data-nav-section=finder]').click());
 $('pointing-mode').addEventListener('change',()=>{suspend('Mode changed. Reposition your phone, enable sensors and start alignment again.');$('mount-confirm').checked=false;setup();});
 $('mount-confirm').addEventListener('change',()=>{reset('Phone placement changed. Start alignment again.');});
 $('object-confirm').addEventListener('change',paint);
 $('alignment-search').addEventListener('input',()=>{$('object-confirm').checked=false;refresh();if($('alignment-target').value)onTargetSelect($('alignment-target').value);});
 $('alignment-browse').addEventListener('click',()=>{document.querySelector('[data-nav-section=objects]').click();$('object-library').open=true;$('search').focus();});
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
   if(samples.length===0){samples.push(sample);model={...singleAlignment(sample),created:session.now()};$('alignment-feedback').textContent=`${object.name} recorded. Basic one-target guidance is ready. Accuracy is not verified; confirm through the finder. Add another object whenever you like.`;onAligned();}
   else if(samples.length===1){model={...solveAlignment(samples[0],sample),kind:'two',created:session.now()};samples.push(sample);$('alignment-feedback').textContent=`Two-target guidance is ready; fit residual ${model.residual.toFixed(1)}°. A third-object check is optional, not an accuracy guarantee.`;onAligned();}
   else {checkError=validateAlignment(model,samples,sample);verified=true;model.created=session.now();$('alignment-feedback').textContent=`Third-object check passed within ${checkError.toFixed(1)}°. This is a coarse estimate; confirm targets in the eyepiece.`;onAligned();}
   $('alignment-search').value='';$('object-confirm').checked=false;refresh();
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
   for(const track of stream.getVideoTracks())track.addEventListener?.('ended',()=>{if(generation===cameraGeneration){stopCamera();paint();$('camera-status').textContent='Camera stream ended. Reopen the rear-camera view when available.';}},{once:true});
   cameraStream=stream;cameraLive=false;$('object-confirm').checked=false;$('camera').srcObject=stream;$('camera-action-slot').append($('alignment-actions'));$('camera-view').hidden=false;$('camera-view').showModal();document.body.classList.add('dv-camera-aiming');paint();await $('camera').play();
   if(generation!==cameraGeneration)return;
   cameraLive=true;paint();$('camera-toggle').setAttribute('aria-pressed','true');$('camera-toggle').textContent='Stop rear-camera view';$('camera-status').textContent='Camera aiming has the confirmation and Record controls beside the crosshair. The view is local; nothing is recorded or uploaded. Camera-axis accuracy still needs a real-phone check.';
  }catch(e){if(generation!==cameraGeneration)return;stopCamera();paint();$('camera-status').textContent='Camera unavailable: '+e.message;}
 });
 $('camera-exit').addEventListener('click',()=>{stopCamera();paint();$('camera-toggle').focus();});
 $('camera-change-target').addEventListener('click',()=>{stopCamera();paint();$('alignment-search').focus();});
 $('camera-view').addEventListener('cancel',event=>{event.preventDefault();event.stopPropagation();stopCamera();paint();$('camera-toggle').focus();});
 document.addEventListener('keydown',event=>{if($('camera-view').open&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();stopCamera();paint();$('camera-toggle').focus();}},true);
 $('camera-view').addEventListener('close',()=>{if(cameraStream){stopCamera();paint();}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend('App was hidden. Enable sensors and repeat alignment.');});
 env.addEventListener('pagehide',()=>suspend('Page was left. Repeat alignment on return.'));
 env.screen?.orientation?.addEventListener('change',()=>suspend('Screen orientation changed. Repeat alignment in the new position.'));
 $('close').addEventListener('click',()=>suspend());
 $('navigator').addEventListener('cancel',()=>suspend());
 $('navigator').addEventListener('close',()=>suspend());
 $('camera-tools').addEventListener('toggle',()=>{if(!$('camera-tools').open)stopCamera();});
 setup();refresh();return {refresh,paint,suspend,hideCamera:stopCamera};
}
