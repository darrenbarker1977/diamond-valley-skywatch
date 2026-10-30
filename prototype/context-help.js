// Small, contextual recovery routes. No sensor, alignment or weather is invented.
export function createContextHelp({act,getState}){
 const $=id=>document.getElementById(id),groups=[];
 function group(id,anchor,items,when){
  const el=document.createElement('div');el.id=id;el.className='context-actions';el.hidden=true;
  for(const [label,action]of items){const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.helpAction=action;button.addEventListener('click',()=>act(action));el.append(button);}
  anchor.after(el);groups.push({el,when});return el;
 }
 group('time-recovery',$('plan-error'),[['Choose date & time','plan'],['Return to Now','now']],()=>!$('plan-error').hidden);
 const count=$('count');group('search-recovery',count,[['Clear search & filters','clear-search'],['Plan another time','plan']],()=>!$('objects').children.length);
 group('finder-recovery',$('finder-compass'),[['Review pointing setup','align'],['Choose a visible target','pick-target'],['Plan tonight','mission']],s=>!s.pose?.alignment?.calibrated||!s.pose?.alignment?.fresh||s.target?.id==='Sun'||s.position?.alt<=0);
 group('picker-recovery',$('finder-picker-status'),[['Browse the full catalogue','catalogue'],['Plan another time','plan']],()=>!$('finder-target-results').children.length);
 group('eyepiece-recovery',$('another-status'),[['Check fitted eyepiece','fitted'],['Manage eyepieces','kit'],['Plan another time','plan']],()=>$('show-another').disabled||/No other suitable|Sky calculations unavailable/.test($('another-status').textContent));
 group('kit-recovery',$('kit-status'),[['Check telescope settings','telescope'],['Add an eyepiece','add-eyepiece'],['Enable an eyepiece','enable-eyepiece']],s=>!s.kit||!s.kit.eyepieces.some(e=>e.enabled));
 group('map-recovery',$('atlas-status'),[['Reload sky map','reload'],['Browse objects','catalogue'],['Check forecast','forecast']],()=>/unavailable|failed/i.test($('atlas-status').textContent));
 group('mission-recovery',$('mission-stops'),[['Set date & time','plan'],['Set tour duration','duration'],['Browse objects','catalogue']],()=>!$('mission-stops').querySelector('[data-id]'));
 group('location-recovery',$('location-status'),[['Search for a place','place'],['Enter coordinates','coordinates'],['Permission help','location-help']],()=>/denied|timed out|could not|failed|unavailable|canceled/i.test($('location-status').textContent));
 group('place-recovery',$('place-status'),[['Enter coordinates instead','coordinates']],()=>/No matching|No matches|failed/i.test($('place-status').textContent));
 group('sensor-recovery',$('sensor-status'),[['Open sensor controls','sensors'],['Permission & sensor help','sensor-help']],s=>['denied','unsupported','unreliable','stale'].includes(s.pose?.alignment?.sensorStatus));
 group('sky-error-recovery',$('error'),[['Reload sky calculations','reload'],['Check forecast','forecast'],['Outdoor guide','guide']],()=>!$('error').hidden);
 for(const name of ['aurora','air','iss']){
  const status=$(name==='aurora'?'aurora-status':name==='air'?'air-status':'iss-status');
  group(name+'-recovery',status,[['Retry this feed','retry-'+name],['Use current time','now'],['Choose another date','plan']],()=>name==='aurora'?$('aurora-value').textContent==='Unavailable':name==='air'?$('air-value').textContent==='Unknown':/old|outside|unavailable|failed|Offline|invalid|Retry/i.test(status.textContent));
 }
 group('solar-recovery',$('solar-error'),[['Reload sky calculations','reload'],['Check forecast','forecast']],()=>!!$('solar-error').textContent);
 const advice=document.createElement('details');advice.id='pointing-troubleshooting';advice.className='context-help';
 advice.innerHTML=`<summary>Sensor, permission &amp; camera help</summary><p>Chrome on Android: open this site's controls beside the address, then Permissions / Site settings. Allow Motion sensors and Camera when you want to use them. Android Settings → Apps → Chrome → Permissions controls camera and location too. Menu names vary; a website cannot change these settings for you.</p><p>No readings? Check device sensor support and browser permissions, return to the app, then enable sensors again. Move away from magnetic cases and metal. If readings pause, hold still briefly; do not guess a heading. If the phone moves in its straps, start alignment again.</p><p>The camera is optional. If a star is too faint on video, close the camera and use a confidently identified bright object. In mounted mode, centre it in the telescope's low-power eyepiece. No photo recognition or automatic identification is performed.</p><div class="context-actions"><button type="button" data-help-action="sensors">Open sensor controls</button><button type="button" data-help-action="camera-help">Camera help</button><button type="button" data-help-action="guide">Outdoor guide</button></div>`;
 advice.addEventListener('click',event=>{const action=event.target.closest('[data-help-action]')?.dataset.helpAction;if(action)act(action);});$('camera-tools').after(advice);
 const cameraContinue=document.createElement('button');cameraContinue.type='button';cameraContinue.id='camera-continue-without';cameraContinue.textContent='Continue without camera';cameraContinue.addEventListener('click',()=>act('without-camera'));$('camera-status').after(cameraContinue);
 let pending=false;
 function refresh(){const state=getState();for(const{el,when}of groups){const hidden=!when(state);if(el.hidden!==hidden)el.hidden=hidden;}}
 function schedule(){if(pending)return;pending=true;queueMicrotask(()=>{pending=false;refresh();});}
 // Watch source statuses rather than the whole page, avoiding recovery UI loops.
 const observer=new MutationObserver(schedule);
 for(const id of ['plan-error','count','finder-session','finder-guide-text','finder-picker-status','another-status','kit-status','atlas-status','mission-summary','mission-stops','location-status','place-status','sensor-status','error','solar-error','aurora-value','aurora-status','air-value','air-status','iss-status','show-another']){
  const target=$(id);if(target)observer.observe(target,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','disabled']});
 }
 refresh();return {refresh};
}
