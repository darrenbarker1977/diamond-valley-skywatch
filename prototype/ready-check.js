import {positionFor} from './sky-position.js?v=catalogue-1';
import {weatherAt,assessWeather,coordinateKey,savedWeather} from './mission-weather.js';
export function createReadyCheck({A,site,getContext,getSnapshot,getAwake,onLocation,onPointing,onTime,onFind,onWeather,onAwake}){
 const $=id=>document.getElementById(id),box=document.createElement('details');box.className='ready-check';box.id='ready-check';
 box.innerHTML=`<summary><span class="ready-check-mark" id="ready-mark" aria-hidden="true">◇</span><span><strong>Ready check</strong><small id="ready-summary">Browse freely · setup is optional</small></span><span class="ready-chevron" aria-hidden="true">⌄</span></summary><div class="ready-body"><p>Just looking ahead? Explore without enabling sensors or aligning anything. These checks help when you are ready to go outside.</p><label for="ready-purpose">What are you using the app for?</label><select id="ready-purpose"><option value="browse">Browsing &amp; planning</option><option value="handheld">Pointing by hand</option><option value="mounted">Finding with my telescope</option></select><ul class="ready-rows"><li><div><strong>Observing location</strong><span id="ready-location"></span></div><button type="button" data-ready-action="location">Choose site</button></li><li><div><strong>Sky time &amp; darkness</strong><span id="ready-time"></span></div></li><li><div><strong>Pointing sensors</strong><span id="ready-sensors"></span></div><button type="button" data-ready-action="pointing">Set up pointing</button></li><li><div><strong>Alignment &amp; phone placement</strong><span id="ready-alignment"></span></div></li><li><div><strong>Forecast</strong><span id="ready-weather"></span></div><button type="button" data-ready-action="weather">Check forecast</button></li><li><div><strong>Screen hold</strong><span id="ready-awake"></span></div><button type="button" data-ready-action="awake">Keep awake</button></li></ul><p class="dv-nav-fine">One-target alignment starts basic estimates; it is not verified telescope accuracy. Confirm the object in your finder. Cloud, buildings and trees can still block a calculated target.</p></div>`;
 $('home-ready-slot').append(box);
 // Every row has a route to the relevant control; no check confirms itself.
 for(const [id,action] of [['ready-time','time'],['ready-alignment','alignment']]){const button=document.createElement('button');button.type='button';button.dataset.readyAction=action;$(id)?.closest('li')?.append(button);}
 let pose={},fingerprint='',purpose='browse',actions={};
 try{const saved=localStorage.getItem('dvsky:ready-purpose:v1');if(['browse','handheld','mounted'].includes(saved))purpose=saved;}catch{}
 $('ready-purpose').value=purpose;
 const set=(id,text)=>{if($(id).textContent!==text)$(id).textContent=text;};
 function action(name,label,run){const button=box.querySelector(`[data-ready-action="${name}"]`);if(button.textContent!==label)button.textContent=label;actions[name]=run;}
 function refresh(){
  const c=getContext(),now=new Date(),p=pose.alignment||{},browsing=purpose==='browse',awake=getAwake();let dark=false,skyOkay=!!A;
  try{dark=positionFor(A,{body:'Sun'},now,site).alt<=-6;}catch{skyOkay=false;}
  const snapshot=getSnapshot()||savedWeather(site),same=snapshot?.coordinateKey===coordinateKey(site),row=same?weatherAt(snapshot,now):null,outlook=assessWeather(row),age=same?Math.max(0,Math.floor((Date.now()-snapshot.stamp)/60000)):null;
  const wrongMode=pose.mode!==purpose,mountedOkay=purpose!=='mounted'||p.mountedConfirmed,pointingOkay=skyOkay&&site.physicalConfirmed&&!c.planning&&dark&&p.calibrated&&p.fresh&&p.sensorStatus==='receiving'&&!wrongMode&&mountedOkay;
  box.dataset.state=browsing?(skyOkay?'browse':'attention'):pointingOkay?'checked':'attention';set('ready-mark',box.dataset.state==='checked'?'✓':box.dataset.state==='attention'?'!':'◇');
  set('ready-summary',browsing?(skyOkay?'Browse freely · setup is optional':'Sky calculations unavailable'):pointingOkay?'Pointing checks passed · verify your sky':c.planning?'Planning ahead · pointing setup waits':!dark?'Waiting for dusk · browsing works':'Pointing setup needs attention');
  set('ready-location',site.label+(site.physicalConfirmed?' · physical presence confirmed':' · selected viewing site; physical presence unconfirmed'));
  set('ready-time',!skyOkay?'Sky calculations unavailable.':c.planning?'Planned sky. Live pointing is off; return to Now to align.':dark?'Live sky · after dusk.':'Daylight or bright twilight. Alignment opens after dusk; browsing works now.');
  set('ready-sensors',browsing?'Optional for browsing. '+(p.fresh?'Fresh pointing readings are available.':'No pointing sensors needed.'):(p.sensorStatus==='receiving'&&p.fresh?'Fresh pointing sensor readings.':pose.listening?'Waiting for fresh usable readings.':!site.physicalConfirmed?'Confirm this is your observing site before enabling pointing sensors.':'Pointing sensors are off. Enable them when ready; the compass is separate.'));
  set('ready-alignment',browsing?'Optional for browsing and planning.':wrongMode?'Choose '+(purpose==='mounted'?'telescope-mounted':'handheld')+' mode in Pointing.':!mountedOkay?'Check the strap and phone orientation, then confirm placement.':!p.calibrated?'Ready to begin: identify and centre one bright object to start basic guidance.':p.quality==='checked'?'Third-object check passed · coarse estimates, not encoders.':p.quality==='refined'?'Two-target alignment · no independent accuracy check.':'One-target basic alignment · accuracy unverified. A second target is optional.');
  set('ready-weather',same?`${snapshot.offline?'Saved offline forecast':'Forecast saved'} · ${age} min old${age>=30?' · needs refreshing':''}. ${outlook.known?outlook.reason:'No forecast covers this hour.'}`:'No downloaded forecast for this location. This does not block browsing or sky-based tours.');
  set('ready-awake',awake?.active?'Screen hold granted while the app is visible.':awake?.message||'Screen hold is not confirmed. Your normal timeout may apply.');
  const requestedMode=browsing?null:purpose,pointing=(step,start=false)=>()=>onPointing(requestedMode,step,start);
  action('location',!browsing&&!site.physicalConfirmed?'Confirm I’m here':'Change site',!browsing&&!site.physicalConfirmed?pointing('location'):onLocation);
  action('time',!skyOkay?'Reload sky':c.planning?'Return to Now':!dark?'Plan tonight':'View live sky',()=>onTime(!skyOkay?'reload':c.planning?'now':!dark?'tonight':'sky'));
  if(browsing)action('pointing','Sensor controls',pointing('sensors'));
  else if(!site.physicalConfirmed)action('pointing','Confirm location',pointing('location'));
  else if(c.planning||wrongMode)action('pointing','Review setup',pointing('setup'));
  else if(p.sensorStatus==='receiving'&&p.fresh)action('pointing','View sensors',pointing('sensors'));
  else if(pose.listening)action('pointing','Check sensors',pointing('sensors'));
  else action('pointing',['denied','unsupported','unreliable'].includes(p.sensorStatus)?'Retry sensors':'Enable sensors',pointing('sensors',true));
  if(browsing)action('alignment','Alignment guide',pointing('alignment'));
  else if(c.planning)action('alignment','Set up live',pointing('alignment'));
  else if(!dark)action('alignment','Alignment help',pointing('daylight'));
  else if(!site.physicalConfirmed)action('alignment','Confirm location',pointing('location'));
  else if(wrongMode||!mountedOkay)action('alignment','Check placement',pointing('placement'));
  else if(!p.calibrated||!p.fresh)action('alignment','Begin alignment',pointing('alignment'));
  else action('alignment','Find a target',onFind);
  const refreshWeather=!same||age>=30||snapshot?.offline;
  action('weather',refreshWeather?'Refresh weather':outlook.known&&!outlook.usable?'See other nights':'View forecast',()=>onWeather(refreshWeather));
  action('awake',awake?.active?'Screen settings':awake?.state==='unsupported'?'Screen help':['blocked','released'].includes(awake?.state)?'Retry screen hold':'Keep awake',()=>onAwake(awake?.active||awake?.state==='unsupported'?'settings':'enable'));
 }
 $('ready-purpose').addEventListener('change',()=>{purpose=$('ready-purpose').value;try{localStorage.setItem('dvsky:ready-purpose:v1',purpose);}catch{}refresh();});
 box.addEventListener('click',event=>{const name=event.target.closest('[data-ready-action]')?.dataset.readyAction;if(name){refresh();actions[name]?.();}});
 box.addEventListener('toggle',refresh);window.addEventListener('dvsky-screen-awake',refresh);window.addEventListener('dvsky-presence-changed',refresh);
 setInterval(()=>{if(!document.hidden)refresh();},15000);
 refresh();return {refresh,pose(state){pose=state;const signature=JSON.stringify([state.alignment,state.listening,state.mode]);if(signature!==fingerprint){fingerprint=signature;refresh();}},place(navigatorOpen){const home=$('home-ready-slot'),target=navigatorOpen?$('navigator-ready-slot'):home;if(box.parentElement!==target)target.append(box);refresh();}};
}
