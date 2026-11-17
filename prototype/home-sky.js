import {createSkyAtlas} from './sky-atlas.js?v=atlas-1';
import {positionFor} from './sky-position.js?v=catalogue-1';
import {localParts} from './observing-time.js?v=abt-1';

// Home is always a real-time sky preview. It never manufactures an alignment
// or passes uncalibrated compass readings into the telescope-guidance engine.
export function createHomeSky({A,site,catalogue,compass,getPointing,onTarget,onSetup}){
 const $=id=>document.getElementById(id),home=$('home-view'),slot=$('home-sky-slot');
 const card=$('atlas-card').cloneNode(true),ids=new Set([card,...card.querySelectorAll('[id]')].map(el=>el.id).filter(Boolean));
 for(const el of [card,...card.querySelectorAll('*')]){
  if(el.id)el.id='home-'+el.id;
  for(const attr of ['aria-labelledby','aria-describedby','aria-controls','for'])if(el.hasAttribute(attr))el.setAttribute(attr,el.getAttribute(attr).split(' ').map(id=>ids.has(id)?'home-'+id:id).join(' '));
 }
 card.classList.add('home-live-sky');card.open=true;card.querySelector(':scope>summary').addEventListener('click',e=>e.preventDefault());
 card.querySelector('.dv-nav-location').className='home-observer-location';
 card.querySelector('.atlas-kicker').textContent='BARKER AFTER DARK · YOUR WINDOW TO THE UNIVERSE';
 const title=card.querySelector('#home-atlas-title'),h1=document.createElement('h1');h1.id=title.id;h1.textContent='Your sky. In motion.';title.replaceWith(h1);
 const canvas=card.querySelector('canvas');canvas.setAttribute('aria-label','Live sky preview. On a phone, point the rear camera toward the sky and turn or tilt the phone. Phone orientation is approximate until aligned. Use Manual map on a computer.');
 card.querySelector('#home-atlas-align').textContent='Align telescope';
 card.querySelector('.atlas-follow-guide').innerHTML='<summary>Phone view, permissions & accuracy</summary><p>Hold the phone upright and point its rear camera toward the sky. Turning and tilting the phone moves this calculated star view; camera video is not needed. Dragging does not disconnect live phone following. Pinch or use + and − to zoom.</p><p>Already-allowed sensors start automatically. If your browser requires permission, use Enable phone view once. In Chrome, check Settings → Site settings → Motion sensors if readings remain unavailable. Relative motion alone cannot provide north. A fresh absolute orientation sample is required.</p><p>Unaligned phone view uses the device’s north reference and can be offset by magnetic interference. It is labelled approximate. Telescope arrows and pulses still require the real one-object alignment in Navigator. Changing the selected place changes the calculated sky; confirm that place before using physical guidance.</p><p>Temporary sensor gaps pause the view and it resumes with fresh readings. No saved bearing or pretend sensor reading is shown as live. On a computer, use Manual map, direction buttons or keyboard arrows.</p>';
 const manual=document.createElement('button');manual.type='button';manual.id='home-manual-map';manual.textContent='Manual map';card.querySelector('.atlas-follow-panel>div').append(manual);
 const mapHelp=card.querySelector('.atlas-options>p');mapHelp.textContent='Phone view follows orientation automatically where sensors are available. Manual map keeps browsing available without sensors. The current place and real time are shown below.';
 for(const button of card.querySelectorAll('[data-atlas-bearing]')){button.dataset.homeAtlasBearing=button.dataset.atlasBearing;button.removeAttribute('data-atlas-bearing');}card.querySelector('.atlas-options').classList.replace('atlas-options','home-atlas-options');
 // One location control, directly above the sky; reuse the existing forms and handlers.
 const locationPanel=$('home-location-panel'),locationBar=document.createElement('section');
 locationBar.className='home-sky-location';locationBar.setAttribute('aria-label','Location for the live sky');
 locationBar.innerHTML='<p class="home-location-kicker">SKY & FORECAST LOCATION</p><strong id="home-active-location"></strong><div class="home-location-choices"><button type="button" id="home-use-phone-location" aria-pressed="false"><span aria-hidden="true">□</span> Phone location</button><button type="button" id="home-choose-place" aria-expanded="false" aria-controls="home-location-panel"><span aria-hidden="true">□</span> Choose a place</button></div><p id="home-location-source"></p><p class="home-location-help">A nearby town is enough to browse. For pointing, use your actual observing site. Saved locations work without GPS or cell service; weather needs a connection to refresh.</p><p id="home-location-feedback" role="status"></p>';
 card.querySelector('.atlas-stage').before(locationBar,locationPanel);
 const phoneLocation=$('home-use-phone-location'),choosePlace=$('home-choose-place');
 function locationUI(){
  const gps=site.source==='geolocation',pending=$('use-location').disabled;
  $('home-active-location').textContent=`${site.label} · ${Math.abs(site.latitude).toFixed(3)}° ${site.latitude<0?'S':'N'}, ${Math.abs(site.longitude).toFixed(3)}° ${site.longitude<0?'W':'E'}`;
  phoneLocation.setAttribute('aria-pressed',String(gps));phoneLocation.querySelector('span').textContent=gps?'☑':'□';phoneLocation.disabled=pending;
  choosePlace.querySelector('span').textContent=gps?'□':'☑';choosePlace.setAttribute('aria-expanded',String(locationPanel.open));
  $('home-location-source').textContent=gps?`Phone fix in use · accuracy ±${Math.round(site.accuracy)} m. Update after moving; this is not live tracking.`:site.source==='saved'?'Last saved place in use · no new GPS fix.':site.source==='default'?'Default place in use · choose your location if you are elsewhere.':'Chosen place in use · GPS is optional.';
  $('home-location-feedback').textContent=$('location-status').textContent;
 }
 phoneLocation.addEventListener('click',()=>{$('use-location').click();locationUI();});
 choosePlace.addEventListener('click',()=>{locationPanel.open=!locationPanel.open;if(locationPanel.open){const search=locationPanel.querySelector('.dv-location-search');search.open=true;$('place-query').focus({preventScroll:true});}locationUI();});
 locationPanel.addEventListener('toggle',locationUI);
 new MutationObserver(locationUI).observe($('location-status'),{childList:true,subtree:true,characterData:true});
 locationUI();slot.append(card);
 const target=document.createElement('div');target.id='home-sky-target';target.className='home-sky-target';target.hidden=true;
 const targetName=document.createElement('strong'),targetPlace=document.createElement('span'),targetButton=document.createElement('button');targetButton.type='button';targetButton.textContent='View target';target.append(targetName,targetPlace,targetButton);card.querySelector('.atlas-follow-panel').after(target);
 // Keep the existing controls, event handlers, mode choices and saved data.
 const dock=document.createElement('nav');dock.className='home-tool-dock';dock.setAttribute('aria-label','Observing tools');
 const oldActions=home.querySelector('.dv-app-cards');for(const button of [home.querySelector('.home-find-target'),...oldActions.querySelectorAll('button'),home.querySelector('.home-mission')])if(button&&!dock.contains(button))dock.append(button);
 oldActions.replaceWith(dock);home.querySelector('.experience-picker').after(dock);
 let positions=new Map(),selected='Moon',following=compass.phone,reading=compass.snapshot,lastSite='',updating=false,pointingStamp=-Infinity;
 const sky=createSkyAtlas({A,site,catalogue,prefix:'home-',phonePreview:true,onPreviewToggle:enabled=>{following=enabled;if(enabled)compass.enable();paint();},onSelect:id=>{selected=id;target.hidden=false;renderTarget();refresh(true);}});
 const visible=()=>!document.hidden&&!home.hidden;
 const set=(id,value)=>{const el=$(id);if(el.textContent!==value)el.textContent=value;};
 function renderTarget(){const o=catalogue.find(o=>o.id===selected),p=positions.get(selected);if(!o||!p)return;targetName.textContent=o.name;targetPlace.textContent=p.alt>0?`${Math.round(p.alt)}° up · calculated for ${site.label}`:'Below the selected location’s horizon';}
 function paint(){
  if(!visible())return;
  const pose=getPointing(),aligned=!!pose?.map?.calibrated&&!pose.practice;
  let ready=false,current=null,kind='approximate',message='Waiting for real phone readings. Enable phone view if your browser needs a permission tap.';
  if(aligned){ready=performance.now()-pointingStamp<1500&&pose.map.ready===true&&Number.isFinite(pose.map.current?.az)&&Number.isFinite(pose.map.current?.alt);current=ready?pose.map.current:null;kind='aligned';message=ready?`Following your aligned ${pose.mode==='mounted'?'telescope':'phone'} · phone estimates, not telescope encoders.`:'Aligned view paused · '+(pose.map.message||'waiting for fresh checked readings.')+' It resumes automatically.';}
  else if(reading?.fresh&&reading.current&&Math.abs(reading.current.alt)<85){ready=true;current=reading.current;message=`Approximate phone view · sky for ${site.label}. Align in Navigator for telescope arrows and pulses.`;}
  else if(reading?.fresh)message='Raise the rear camera toward the sky. Near straight up or down, a north bearing is undefined.';
  else if(reading?.status==='denied'||reading?.status==='unsupported')message=reading.message;
  else if(reading?.status==='paused')message='Phone view paused. Fresh readings will be used when you return.';
  else if(!reading?.wanted)message='Phone sensors are off. Use Enable phone view, or explore manually.';
  compass.reference(following&&(!aligned||pose.mode!=='mounted')?'camera':'top');
  sky.preview({enabled:following,ready,current,kind,message,supported:!!window.DeviceOrientationEvent&&isSecureContext});
  set('home-atlas-live-badge',following&&ready?aligned?'● ALIGNED VIEW':'● PHONE VIEW':following?'◌ SENSOR PREVIEW':'✧ MANUAL MAP');
  manual.setAttribute('aria-pressed',String(!following));
 }
 function refresh(force=false){
  if(!visible()||updating)return;updating=true;
  try{
   locationUI();const key=site.latitude+':'+site.longitude;if(key!==lastSite){lastSite=key;sky.locationChanged();}
   const now=new Date();positions=new Map(catalogue.map(o=>[o.id,positionFor(A,o,now,site)]));sky.update(positions,selected,now,false);
   const zone=site.clockTimezone||'UTC',p=localParts(now,zone);set('home-clock',DVSkyTime.formatter('en-CA',{timeZone:zone,weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(now));
   card.querySelector('.home-observer-location').textContent=`${site.label} · ${site.latitude.toFixed(4)}°, ${site.longitude.toFixed(4)}° · ${site.physicalConfirmed?'observing site confirmed':'selected place; confirm for telescope guidance'}`;
   card.dataset.localDate=p.date;renderTarget();paint();
  }catch(error){sky.fail();set('home-atlas-follow-state','Sky unavailable: '+error.message+'. Forecast and Navigator remain available.');}
  finally{updating=false;}
 }
 const unsubscribe=compass.subscribe(state=>{reading=state;paint();});
 manual.addEventListener('click',()=>{following=false;paint();sky.refresh();});
 $('home-atlas-align').addEventListener('click',onSetup);targetButton.addEventListener('click',()=>onTarget(selected));
 $('home-atlas-center').addEventListener('click',()=>{following=false;sky.centerTarget();paint();});
 new MutationObserver(()=>{if(visible()){card.open=true;refresh(true);}else compass.reference('top');}).observe(home,{attributes:true,attributeFilter:['hidden']});
 document.addEventListener('visibilitychange',()=>{if(visible())refresh(true);});window.addEventListener('pageshow',()=>refresh(true));
 setInterval(()=>refresh(),10000);refresh(true);
 return {refresh,pose(){pointingStamp=performance.now();paint();},get following(){return following;},unsubscribe};
}
