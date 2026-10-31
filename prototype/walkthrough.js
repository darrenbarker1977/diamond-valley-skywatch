// This controls the journey only. Original controls still own location, sensors and alignment.
export function createWalkthrough({site,getPose,getTarget,canUseTarget,onLive,onPlan,onBrowse,onLeaveAlignment,onTargets}){
 const $=id=>document.getElementById(id),slots=['walk-mode-slot','walk-location-slot','walk-sensors-slot','walk-align-slot','walk-target-slot'];
 const definitions=[
  ['Choose how you are pointing','Choose handheld for the rear-camera direction, or secure the phone along the telescope tube.'],
  ['Set your observing location','Use your location or choose a site. Live pointing requires being physically there.'],
  ['Enable the phone sensors','Tap Enable sensors and allow motion access. We need fresh absolute readings before alignment.'],
  ['Centre and record one known object','This alignment object teaches the phone where you are pointing. It can be different from your destination.'],
  ['Explore, or choose a target','Your alignment is ready. Explore the moving sky without a target, or choose a destination for arrows and optional pulses.']
 ];
 const modeLabel=document.querySelector('label[for=pointing-mode]'),controls=$('enable-sensors').parentElement;
 const groups=[[modeLabel,$('pointing-mode'),$('setup-help'),$('mount-confirm-label'),document.querySelector('.setup-tips')],[$('home-location-panel'),$('location-present-label')],[controls,$('sensor-status'),$('sensor-recovery'),$('measured-direction'),$('pointing-troubleshooting')],[$('alignment-daylight'),$('camera-tools'),document.querySelector('.dv-nav-alignment')],[$('finder-target-picker')]];
 const originals=groups.map(nodes=>nodes.filter(Boolean).map(node=>{const marker=document.createComment('navigator control home');node.before(marker);return {node,marker,open:node instanceof HTMLDetailsElement?node.open:null};}));
 const pickerSummary=$('finder-target-picker').querySelector('summary'),pickerTitle=pickerSummary.textContent;
 let active=false,step=0,modeDone=false;
 const pose=()=>getPose()||{},aligned=()=>!!pose().alignment?.calibrated;
 function firstNeeded(){const p=pose();if(!(modeDone||p.listening||p.alignment?.calibrated)||p.mode==='mounted'&&!p.alignment?.mountedConfirmed)return 0;if(!site.physicalConfirmed)return 1;if(!p.alignment?.fresh||p.alignment?.sensorStatus!=='receiving')return 2;return aligned()?4:3;}
 function focus(id='walk-stage-title'){const el=$(id);if(!el||!el.getClientRects().length)return;el.focus({preventScroll:true});el.scrollIntoView({block:'center'});}
 function update(){
  if(!active)return;const p=pose(),target=getTarget(),day=p.guidanceStatus==='daylight',mounted=p.mode==='mounted';
  $('walkthrough-view').dataset.step=String(step);$('walk-step-number').textContent='STEP '+(step+1)+' OF 6';$('walk-stage-title').textContent=definitions[step][0];$('walk-stage-help').textContent=definitions[step][1];$('walk-destination').textContent='Optional target: '+target.name+' · choose another or simply explore';
  for(let i=0;i<slots.length;i++)$(slots[i]).hidden=i!==step;
  const complete=[(modeDone||p.listening||aligned())&&(!mounted||p.alignment?.mountedConfirmed),site.physicalConfirmed,!!p.alignment?.fresh&&p.alignment?.sensorStatus==='receiving',aligned(),aligned()&&canUseTarget(),false];
  for(const item of document.querySelectorAll('[data-walk-step]')){const n=Number(item.dataset.walkStep);item.dataset.complete=String(complete[n]);if(n===step)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');}
  $('walk-back').disabled=step===0;$('walk-plan').hidden=!day;$('walk-explore-aligned').hidden=step!==4;
  let status='',disabled=false,next='Continue →';
  if(step===0){disabled=mounted&&!p.alignment?.mountedConfirmed;status=disabled?'Confirm the phone is secured as described above.':'You can switch modes later; changing phone placement requires fresh alignment.';next='Use this placement →';}
  if(step===1){disabled=!site.physicalConfirmed;status=disabled?'For a searched or saved site, confirm you are physically there. You can browse a remote sky without pointing.':'Observing location confirmed. Continue to sensors.';next='Continue to sensors →';}
  if(step===2){disabled=!p.alignment?.fresh||p.alignment?.sensorStatus!=='receiving';status=disabled?'Waiting for fresh usable readings. Read the sensor status above; permission alone does not align the phone.':aligned()?'Fresh readings restored. Your alignment is retained.':'Sensors are receiving. Next, align on one object you can positively identify.';next=aligned()?'Continue to target →':'Continue to alignment →';}
  if(step===3){const name=$('alignment-target').selectedOptions[0]?.textContent.split(' · ')[0]||'one object';status=aligned()?'One-object alignment is ready. Another object is optional.':day?'Daylight alignment is disabled. This is expected; plan tonight or browse while waiting for dusk.':'Record becomes available only after fresh, steady readings and your object confirmation.';next=aligned()?'Choose a destination →':day?'Plan tonight instead →':p.capture?.ready?'Record '+name+' · continue →':mounted?'Centre & record in the eyepiece →':'Centre & record with crosshairs →';disabled=!day&&!aligned()&&!$('alignment-target').value;}
  if(step===3&&!day&&!aligned()&&firstNeeded()<3){disabled=false;next='Review the missing setup step →';}
  if(step===4){disabled=!aligned()||!canUseTarget();status=disabled?'Choose a suitable visible target from the list. Your current destination cannot be guided to right now.':'Find '+target.name+' now, or choose a different object above. Weather and obstacles are unconfirmed.';next='Find '+target.name+' · live sky →';}
  $('walk-status').textContent=status;$('walk-next').disabled=disabled;$('walk-next').textContent=next;
 }
 function go(value){let wanted=typeof value==='number'?value:value==='location'?1:value==='placement'?0:value==='sensors'?2:value==='target'?4:3;
  if(wanted>=2&&value!=='daylight'){const need=firstNeeded();if(need<wanted&&need<3)wanted=need;}
  if(wanted===4&&!aligned())wanted=firstNeeded();
  if(step===3&&wanted!==3)onLeaveAlignment();step=Math.max(0,Math.min(4,wanted));
  if(step===4){$('finder-target-picker').open=true;onTargets();}
  update();focus();
 }
 function activate(value){
  if(value&&!active){active=true;modeDone=modeDone||!!pose().listening||aligned();for(let i=0;i<groups.length;i++)for(const entry of originals[i]){if(entry.open!==null)entry.open=entry.node.open;$(slots[i]).append(entry.node);}$('home-location-panel').open=true;pickerSummary.textContent='Search visible destinations';step=firstNeeded();if(step===4){$('finder-target-picker').open=true;onTargets();}update();}
  else if(!value&&active){if(step===3)onLeaveAlignment();active=false;for(const group of originals)for(const {node,marker,open}of group){marker.after(node);if(open!==null)node.open=open;}pickerSummary.textContent=pickerTitle;}
 }
 $('walk-back').addEventListener('click',()=>go(step-1));
 $('walk-next').addEventListener('click',()=>{
  if(step===0){modeDone=true;go(1);}else if(step===1)go(2);else if(step===2)go(aligned()?4:3);else if(step===4)onLive();
  else if(aligned())go(4);else if(pose().guidanceStatus==='daylight')onPlan();else if(firstNeeded()<3)go(firstNeeded());else if(pose().capture?.ready)$('capture-alignment').click();else if(pose().mode==='handheld'){$('camera-tools').open=true;$('camera-toggle').click();}else focus('object-confirm');
 });
 $('walk-explore').addEventListener('click',onBrowse);$('walk-explore-aligned').addEventListener('click',onBrowse);$('walk-plan').addEventListener('click',onPlan);$('walk-preview').addEventListener('click',onLive);$('walk-catalogue').addEventListener('click',onBrowse);
 return {activate,go,update,focus,confirmMode(){modeDone=true;},get active(){return active;},get step(){return step;},aligned(){onLeaveAlignment();go(4);}};
}
