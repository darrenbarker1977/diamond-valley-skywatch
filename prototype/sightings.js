import {captureSightingWeather,describeSightingWeather} from './sighting-weather.js?v=seen-weather-1';
import {savedWeather} from './mission-weather.js?v=abt-1';
import {createSightingsStore,preferUnseen,SIGHTINGS_KEY} from './sightings-store.js?v=seen-1';
import {nightDate} from './observing-time.js?v=abt-1';
export function createSightings({site,catalogue,getSelected,getEyepiece,getContext,getSnapshot=()=>null,onWeather=()=>{},onEyepiece=()=>{},onChange=()=>{},onHistory=()=>{},onLocation,onRealTime,onTarget,env=window}){
 const $=id=>document.getElementById(id),node=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
 let storage;try{storage=env.localStorage;}catch{storage={getItem(){throw Error('Browser storage is unavailable.');}};}
 const store=createSightingsStore({storage,allowedIds:new Set(catalogue.map(o=>o.id))});
 const widget=node('section');widget.id='seen-recorder';widget.className='seen-recorder';widget.setAttribute('aria-label','Record a confirmed sighting');
 widget.innerHTML='<div class="seen-record-row"><button type="button" id="seen-record">✓ Seen it</button><button type="button" id="seen-undo" hidden>Undo</button><button type="button" id="seen-open-history">Seen list</button></div><p id="seen-blocked" hidden></p><button type="button" id="seen-live" hidden>Return to real time</button><details class="seen-record-details"><summary id="seen-context-summary">Recording details &amp; location</summary><p id="seen-context"></p><p id="seen-weather-preview"></p><button type="button" id="seen-location">Check location</button><button type="button" id="seen-eyepiece">Set fitted eyepiece</button><button type="button" id="seen-weather-check">Check forecast</button><button type="button" id="seen-again" hidden>Log another look</button></details><p id="seen-feedback" role="status" aria-live="polite"></p>';
 $('seen-finder-slot').append(widget);
 const history=node('details');history.id='seen-history';history.className='seen-history';
 history.innerHTML='<summary>✓ Things I’ve seen <span id="seen-count">0 objects</span></summary><div class="seen-history-body"><p>Only sightings you confirm are recorded. Entries use your device clock and selected observing site. Saved on this browser, including offline; they do not sync to ChatGPT or another device.</p><label for="seen-search">Find a sighting</label><input id="seen-search" type="search" placeholder="Saturn, M31, location…" autocomplete="off"><label class="seen-preference"><input id="seen-prefer-new" type="checkbox" checked>Prefer unrecorded objects in Show me another and the target picker <small>Previously seen favourites remain available.</small></label><p id="seen-store-status" role="status"></p><div class="seen-history-feedback"><p id="seen-history-feedback" role="status"></p><button id="seen-history-undo" type="button" hidden>Undo last change</button></div><p id="seen-list-count"></p><ul id="seen-list"></ul><button id="seen-more" type="button" hidden>Show 20 more</button><details class="seen-backup"><summary>Backup &amp; restore</summary><p>Export before changing devices or clearing browser data. JSON backups include saved coordinates. Restore merges records and skips matching duplicates.</p><button id="seen-export" type="button">Download sightings backup</button><label for="seen-import">Restore a sightings JSON backup</label><input id="seen-import" type="file" accept=".json,application/json"><label id="seen-replace-label" hidden><input id="seen-replace" type="checkbox">Replace unreadable saved data with this validated backup. Download the recovery copy first.</label><p id="seen-backup-status" role="status"></p></details></div>';
 $('seen-history-slot').append(history);
 function weatherAtCapture(time){
  let current=null;try{current=getSnapshot();}catch{}
  const sources=[current,savedWeather(site,time.getTime())].filter(Boolean).sort((a,b)=>b.stamp-a.stamp);
  for(const snapshot of sources){const weather=captureSightingWeather(snapshot,site,time,{offline:env.navigator.onLine===false});if(weather)return weather;}
  return null;
 }
 let state=store.snapshot(),undo=null,message='',limit=20,signature='',preferNew=true;
 try{preferNew=storage.getItem('dvsky:sightings:prefer-new:v1')!=='off';}catch{}
 $('seen-prefer-new').checked=preferNew;
 const object=id=>catalogue.find(o=>o.id===id),name=id=>object(id)?.name||id;
 const dateFormats=new Map();
 function dateLabel(r){if(!dateFormats.has(r.zone))dateFormats.set(r.zone,DVSkyTime.formatter('en-CA',{timeZone:r.zone,year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}));return dateFormats.get(r.zone).format(new Date(r.observedAt));}
 const lensName=lens=>lens.name+(lens.barlow?' + '+Number(lens.barlow.factor.toFixed(2))+'× Barlow':'');
 const coordinates=s=>`${Math.abs(s.latitude).toFixed(5)}° ${s.latitude<0?'S':'N'}, ${Math.abs(s.longitude).toFixed(5)}° ${s.longitude<0?'W':'E'}`;
 const ids=()=>new Set(state.records.map(r=>r.objectId));
 function latestTonight(){const now=nightDate(new Date(),site.clockTimezone);return state.records.filter(r=>r.objectId===getSelected()&&Math.abs(r.site.latitude-site.latitude)<.00001&&Math.abs(r.site.longitude-site.longitude)<.00001&&nightDate(new Date(r.observedAt),site.clockTimezone)===now).sort((a,b)=>b.observedAt.localeCompare(a.observedAt))[0];}
 function paint(){
  const context=getContext(),simulated=context.planning||context.practice,target=object(getSelected()),last=latestTonight(),lens=getEyepiece();
  $('seen-record').textContent=last?'✓ Seen tonight':'✓ Seen it';$('seen-record').disabled=!!state.error||!!simulated||!!last||!target;$('seen-record').setAttribute('aria-label',last?'Already recorded '+target.name+' tonight':'Record that I saw '+(target?.name||'this object'));
  $('seen-again').hidden=!last||!!simulated||!!state.error;$('seen-live').hidden=!simulated;$('seen-blocked').hidden=!simulated;$('seen-blocked').textContent=simulated?'Sightings are off for planned and practice skies. Return to real time to record what you have seen.':'';
  const setting=lens?`${lensName(lens)} · ${lens.mm} mm · about ${Math.round(lens.power)}×`:'Eyepiece not selected';
  $('seen-context-summary').textContent=`${target?.name||'Selected object'} · ${site.label} · ${lens?lens.mm+' mm fitted'+(lens.barlow?' + '+Number(lens.barlow.factor.toFixed(2))+'× Barlow':''):'eyepiece not set'}`;
  $('seen-context').textContent=simulated?'Planned and practice skies cannot create sightings. Return to real time, then record only after you have seen the object.':`Confirm you saw ${target?.name||'the selected object'}. Records the real time at ${site.label} · ${coordinates(site)} (${site.physicalConfirmed?'presence confirmed':'selected site; check it before recording'}). ${setting}.`;
  const weather=simulated?null:weatherAtCapture(new Date());$('seen-weather-preview').textContent=simulated?'Weather is saved only with real-time observations.':weather?describeSightingWeather(weather,new Date().toISOString()).summary+' Will save this forecast with its download time; it is not measured weather.':'No matching hourly forecast is available to save. Seen it will still record the object, time, site and selected eyepiece.';
  $('seen-feedback').textContent=message;$('seen-history-feedback').textContent=message;$('seen-undo').hidden=!undo;$('seen-history-undo').hidden=!undo;
  $('seen-count').textContent=ids().size+' objects';$('seen-store-status').textContent=state.error||`${state.records.length} ${state.records.length===1?'sighting':'sightings'} saved on this browser. Export a backup to keep a separate copy.`;
  $('seen-export').textContent=state.recovery?'Download recovery copy':'Download sightings backup';$('seen-replace-label').hidden=!state.recovery;
  if(history.open)paintList();
 }
 function paintList(){
  const query=$('seen-search').value.trim().toLowerCase(),all=[...state.records].sort((a,b)=>b.observedAt.localeCompare(a.observedAt)||a.id.localeCompare(b.id)).filter(r=>!query||(name(r.objectId)+' '+r.objectId+' '+r.site.label+' '+dateLabel(r)).toLowerCase().includes(query));
  const shown=all.slice(0,limit),key=JSON.stringify(shown);$('seen-list-count').textContent=all.length?`Showing ${shown.length} of ${all.length} ${all.length===1?'sighting':'sightings'}.`:query?'No matching sightings.':'No sightings yet. Choose an object and tap Seen it after you have identified it.';$('seen-more').hidden=shown.length>=all.length;
  if(key===signature)return;signature=key;
  $('seen-list').replaceChildren(...shown.map(r=>{const li=node('li'),details=node('details'),summary=node('summary'),title=node('strong',name(r.objectId)),when=node('span',dateLabel(r)),where=node('small',r.site.label);summary.append(title,when,where);details.append(summary,node('p',coordinates(r.site)+(r.site.confirmed?' · presence confirmed when recorded':' · selected observing site; presence was not confirmed')));
   details.append(node('p',r.eyepiece?`${r.eyepiece.name} · ${r.eyepiece.mm} mm · about ${Math.round(r.eyepiece.power)}×`:'Eyepiece was not selected.'));
   const weather=describeSightingWeather(r.weather,r.observedAt);details.append(node('p',weather.summary));if(weather.detail)details.append(node('p',weather.detail));
   const actions=node('div');actions.className='seen-entry-actions';const open=node('button','Open object'),remove=node('button','Remove sighting');open.type=remove.type='button';open.dataset.seenObject=r.objectId;open.addEventListener('click',()=>onTarget(r.objectId));remove.setAttribute('aria-label','Remove sighting of '+name(r.objectId)+' at '+dateLabel(r));remove.addEventListener('click',()=>run(()=>{const removed=store.remove(r.id);if(removed){undo={kind:'remove',record:removed};message='Removed '+name(r.objectId)+' sighting. You can Undo.';}else message='That sighting was already removed.';}));actions.append(open,remove);details.append(actions);li.dataset.sighting=r.id;li.append(details);return li;}));
 }
 function changed(){state=store.snapshot();signature='';paint();onChange();}
 function run(action){try{action();changed();}catch(e){message=e.message;state=store.snapshot();paint();}}
 function record(again=false){
  const context=getContext();if(context.planning||context.practice)return;if(!again&&latestTonight())return;
  run(()=>{const lens=getEyepiece(),time=new Date(),record={id:env.crypto?.randomUUID?.()||('s'+Date.now().toString(36)+Math.random().toString(36).slice(2)),objectId:getSelected(),observedAt:time.toISOString(),zone:site.clockTimezone,site:{label:site.label,latitude:site.latitude,longitude:site.longitude,confirmed:!!site.physicalConfirmed},eyepiece:lens?{id:lens.id,name:lensName(lens),mm:lens.mm,power:lens.power}:null,weather:weatherAtCapture(time)};store.add(record);undo={kind:'add',record};message='Saved '+name(record.objectId)+' · '+dateLabel(record)+' · '+record.site.label+'.';});
 }
 function undoLast(){if(!undo)return;run(()=>{const action=undo;if(action.kind==='add')store.remove(action.record.id);else store.add(action.record);message='Undid the last change for '+name(action.record.objectId)+'.';undo=null;});}
 $('seen-record').addEventListener('click',()=>record());$('seen-again').addEventListener('click',()=>record(true));$('seen-undo').addEventListener('click',undoLast);$('seen-history-undo').addEventListener('click',undoLast);
 $('seen-location').addEventListener('click',onLocation);$('seen-eyepiece').addEventListener('click',onEyepiece);$('seen-weather-check').addEventListener('click',onWeather);$('seen-live').addEventListener('click',onRealTime);
 $('seen-open-history').addEventListener('click',()=>{onHistory();history.open=true;paintList();history.scrollIntoView({block:'start'});history.querySelector('summary').focus();});
 history.addEventListener('toggle',()=>{if(history.open){state=store.reload();paint();}});
 $('seen-search').addEventListener('input',()=>{limit=20;paintList();});$('seen-more').addEventListener('click',()=>{limit+=20;paintList();});
 $('seen-prefer-new').addEventListener('change',()=>{preferNew=$('seen-prefer-new').checked;try{storage.setItem('dvsky:sightings:prefer-new:v1',preferNew?'on':'off');}catch{$('seen-backup-status').textContent='This preference is for this visit only; browser storage is unavailable.';}onChange();});
 $('seen-export').addEventListener('click',()=>{try{const data=store.export(),blob=new Blob([data.text],{type:'application/json'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download=`barker-after-dark-${data.recovery?'recovery':'sightings'}-${new Date().toISOString().slice(0,10)}.json`;document.body.append(a);a.click();a.remove();env.setTimeout(()=>URL.revokeObjectURL(url),1000);$('seen-backup-status').textContent=data.recovery?'Recovery copy downloaded. Validate a backup before replacing unreadable data.':'Backup download requested. Keep the file somewhere separate from this browser.';}catch(e){$('seen-backup-status').textContent=e.message;}});
 $('seen-import').addEventListener('change',async()=>{const file=$('seen-import').files[0];if(!file)return;try{if(file.size>8*1024*1024)throw Error('Choose a sightings file smaller than 8 MB.');const added=store.restore(await file.text(),{replaceUnreadable:$('seen-replace').checked});undo=null;$('seen-replace').checked=false;message=`Restored ${added} new ${added===1?'sighting':'sightings'}. Existing records were kept; matching duplicates skipped.`;$('seen-backup-status').textContent=message;changed();}catch(e){$('seen-backup-status').textContent=e.message;}finally{$('seen-import').value='';}});
 env.addEventListener('storage',event=>{if(event.key===SIGHTINGS_KEY||event.key===null){state=store.reload();signature='';paint();onChange();}});
 paint();return {refresh:paint,ids,preferNew:()=>preferNew,order:items=>preferUnseen(items,ids(),preferNew),place(section){const slot=$(section==='objects'?'seen-object-slot':'seen-finder-slot');if(widget.parentElement!==slot)slot.append(widget);paint();}};
}
