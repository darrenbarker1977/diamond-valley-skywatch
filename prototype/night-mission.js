import {buildMission,targetAssessment} from './mission-engine.js';
import {savedWeather,weatherSnapshot,weatherKey,coordinateKey,assessWeather,weatherAt} from './mission-weather.js';
import {localLabel,shortClock,nightDate} from './observing-time.js';
import {viewingPlan,describe} from './eyepieces.js?v=catalogue-1';
import {catalogue} from './catalogue.js?v=catalogue-1';
import {objectStory,objectVisual} from './object-cards.js?v=atlas-1';
export function createNightMission({A,site,getContext,getKit,ensureForecast,onLive,onPreview,onWeather}){
 const $=id=>document.getElementById(id);let active=false,snapshot=null,siteKey=coordinateKey(site),nightKey='',current='',visited=new Set(),model={steps:[]},failure='',waiting=false,sessionStarted=0,sessionEnd=0,totalStops=0;
 const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const set=(id,value)=>{if($(id).textContent!==value)$(id).textContent=value;};
 function assessment(id){try{return targetAssessment(A,site,snapshot,id,new Date());}catch(error){return {usable:false,reason:error.message};}}
 function choose(id){const state=assessment(id);if(!state.usable){refresh();return;}const context=getContext(),actualNight=nightDate(new Date(),context.zone);if(context.planning&&context.night!==actualNight){current='';visited.clear();sessionStarted=sessionEnd=totalStops=0;nightKey=siteKey+':'+actualNight;}if(!current){sessionStarted=Date.now();sessionEnd=sessionStarted+Number($('mission-duration').value)*60000;totalStops=context.planning?Math.max(3,Math.min(5,Math.round(Number($('mission-duration').value)/25))):model.steps.length;}if(current&&current!==id)visited.add(current);current=id;$('mission-route').open=false;onLive(id);refresh();}
 function render(c){
  const now=Date.now(),age=snapshot?Math.max(0,Math.floor((now-snapshot.stamp)/60000)):0,stale=snapshot&&(snapshot.offline||age>=30);
  $('mission-view').dataset.location=siteKey;$('mission-view').dataset.planning=String(c.planning);$('mission-view').dataset.weatherStamp=String(snapshot?.stamp||0);
  set('mission-location',site.label);set('mission-mode',c.planning?'PLANNED EVENING':'LIVE · ADAPTS THROUGH THE NIGHT');
  set('mission-weather',snapshot?`${snapshot.offline?'Offline · saved forecast':snapshot.cached?'Saved forecast':stale?'Forecast needs refreshing':'Open-Meteo forecast'} · ${localLabel(snapshot.stamp,snapshot.zone)} · ${age} min old${stale?' · conditions may be stale':''}`:failure||'Getting this location’s hourly forecast…');
  $('mission-weather').classList.toggle('is-stale',!!stale||!snapshot);
  set('mission-date',model.start?`${localLabel(model.start,c.zone)} → ${shortClock(model.end,c.zone)}`:c.planning?localLabel(c.instant,c.zone):'Tonight at this observing location');
  set('mission-summary',model.reason||'Checking the sky and weather.');
  set('mission-route-count',model.steps.length+' upcoming stops');
  set('mission-updated',`Recommendations recalculated ${shortClock(new Date(),c.zone)} · sky checks every minute; weather refreshes every 30 min, on return and with Refresh weather.`);
  const openIds=new Set([...$('mission-stops').querySelectorAll('details[open]')].map(el=>el.dataset.object));
  const focus=document.activeElement?.dataset.missionAction?{action:document.activeElement.dataset.missionAction,id:document.activeElement.dataset.object}:null;
  const items=[];
  for(const [index,step] of model.steps.entries()){
   const object=step.object,item=node('li',undefined,'mission-stop');item.dataset.id=object.id;item.dataset.time=step.date.toISOString();
   const heading=node('div',undefined,'mission-stop-heading'),number=node('span',String(index+1),'mission-number'),body=node('div');
   body.append(node('span',shortClock(step.date,c.zone),'mission-stop-time'),node('h4',object.name),node('p',object.id===object.name?object.type:object.id+' · '+object.type,'mission-stop-kind'));heading.append(number,body);item.append(heading);
   const plan=viewingPlan(object,getKit(),step.alt),choice=plan.steps[1]||plan.steps[0];
   item.append(node('p',choice?'Eyepiece: '+describe(choice.choice):plan.note,'mission-lens'));
   if(choice&&plan.steps[1])item.append(node('p','Find it first with '+describe(plan.steps[0].choice)+'.','mission-position'));
   const compass=['N','NE','E','SE','S','SW','W','NW'][Math.round(step.az/45)%8];
   item.append(node('p',`${compass} · ${Math.round(step.alt)}° up at this stop · ${Math.round(step.weather.cloud_cover)}% hourly cloud forecast`,'mission-position'));
   const extra=node('details',undefined,'mission-object-notes');extra.dataset.object=object.id;extra.open=openIds.has(object.id);extra.append(node('summary','What to look for'),objectVisual(object),node('p',objectStory(object).expect));item.append(extra);
   const controls=node('div',undefined,'mission-stop-actions'),find=node('button','⌖ Find now'),preview=node('button','Preview this sky');find.type=preview.type='button';
   const state=assessment(object.id);find.disabled=!state.usable;find.title=state.usable?'Use the current sky and checked alignment':state.reason;
   find.dataset.missionAction='live';preview.dataset.missionAction='preview';find.dataset.object=preview.dataset.object=object.id;
   find.addEventListener('click',()=>choose(object.id));preview.addEventListener('click',()=>onPreview(object.id,step.date));controls.append(find,preview);item.append(controls);
   if(!state.usable)item.append(node('p','Find now is unavailable: '+state.reason,'mission-wait'));
   items.push(item);
  }
  $('mission-stops').replaceChildren(...items);
  if(!items.length){const empty=node('li',snapshot?'Try another date, a later time or a longer session. The sky planner remains available even when a weather-based mission cannot be recommended.':'A mission needs real downloaded weather. Use Refresh weather while connected; no conditions will be substituted.','mission-empty');$('mission-stops').append(empty);}
  $('mission-current').hidden=!current;
  if(current){const object=catalogue.find(o=>o.id===current),state=assessment(current);set('mission-current-name',object.name);set('mission-current-status',!c.planning&&sessionEnd&&now>=sessionEnd?'Your session time has finished. Your target stays selected; end the session to build another route.':state.usable?'Your selected target is kept while upcoming stops update.':state.reason+' Your target remains selected.');$('mission-current-open').disabled=!state.usable;}
  const next=model.steps.find(step=>assessment(step.object.id).usable);$('mission-next').disabled=!next;$('mission-next').dataset.object=next?.object.id||'';
  $('finder-mission-next').hidden=!current;$('finder-mission-next').disabled=!next;set('finder-mission-next',next?'Next mission stop: '+next.object.name:'No suitable next stop right now');$('finder-mission-note').hidden=!current;if(current)set('finder-mission-note','Night Mission: '+assessment(current).reason);
  if(focus){const button=[...$('mission-stops').querySelectorAll('button')].find(el=>el.dataset.missionAction===focus.action&&el.dataset.object===focus.id);button?.focus({preventScroll:true});}
 }
 function refresh(){
  if(!active)return;
  try{
   const c=getContext(),key=siteKey+':'+c.night;
   if(nightKey&&nightKey!==key){current='';visited.clear();sessionStarted=sessionEnd=totalStops=0;}nightKey=key;
   model=buildMission(A,{site,snapshot,night:c.night,anchor:c.instant,zone:c.zone,live:!c.planning,minutes:Number($('mission-duration').value),excluded:[...visited,...(current?[current]:[])],endAt:current&&!c.planning?sessionEnd:null,maxStops:current?Math.max(0,totalStops-visited.size-1):5});
   render(c);
  }catch(error){model={steps:[]};set('mission-summary','Night Mission unavailable: '+error.message);$('mission-stops').replaceChildren();$('mission-next').disabled=true;$('mission-next').dataset.object='';$('finder-mission-next').disabled=true;if(current)set('finder-mission-note','Night Mission unavailable: '+error.message);}
 }
 function loadSaved(){const saved=savedWeather(site);if(saved&&saved.dataSignature!==snapshot?.dataSignature)snapshot=saved;}
 function accept(message){
  if(!Number.isFinite(message.latitude)||!Number.isFinite(message.longitude)||Math.abs(message.latitude-site.latitude)>.00001||Math.abs(message.longitude-site.longitude)>.00001)return;
  if(!message.data){if(message.error){failure='Weather unavailable: '+String(message.error).slice(0,160);if(snapshot)snapshot={...snapshot,offline:true,error:failure};}waiting=message.status==='loading';refresh();return;}
  try{
   const next=weatherSnapshot(message,site);if(snapshot?.signature===next.signature&&snapshot.offline===next.offline&&snapshot.cached===next.cached)return;
   snapshot=next;failure='';waiting=false;onWeather();refresh();
  }catch(error){failure=error.message;refresh();}
 }
 function activate(){if(!active){active=true;loadSaved();onWeather();}waiting=true;ensureForecast();refresh();}
 window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==$('forecast-frame').contentWindow||event.data?.type!=='dvsky-weather-snapshot')return;accept(event.data);});
 window.addEventListener('storage',event=>{if(event.key===weatherKey(site)&&active){loadSaved();onWeather();refresh();}});
 window.addEventListener('offline',()=>{if(snapshot)snapshot={...snapshot,offline:true};refresh();});
 window.addEventListener('online',()=>{if(active){ensureForecast();refresh();}});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&active){ensureForecast();refresh();}});
 window.addEventListener('pageshow',()=>{if(active)refresh();});
 setInterval(()=>{if(active&&!document.hidden)refresh();},60000);
 $('mission-duration').addEventListener('change',()=>{if(current){sessionEnd=sessionStarted+Number($('mission-duration').value)*60000;totalStops=Math.max(3,Math.min(5,Math.round(Number($('mission-duration').value)/25)));}refresh();});
 $('mission-refresh').addEventListener('click',()=>{activate();$('forecast-frame').contentWindow?.postMessage({type:'dvsky-weather-refresh'},location.origin);});
 $('mission-next').addEventListener('click',()=>{const id=$('mission-next').dataset.object;if(id)choose(id);});
 $('finder-mission-next').addEventListener('click',()=>{const id=$('mission-next').dataset.object;if(id)choose(id);});
 $('mission-current-open').addEventListener('click',()=>{if(current)choose(current);});
 $('mission-end').addEventListener('click',()=>{current='';visited.clear();sessionStarted=sessionEnd=totalStops=0;refresh();});
 return {activate,refresh,get active(){return active;},get snapshot(){return snapshot;},locationChanged(){const key=coordinateKey(site);if(key!==siteKey){siteKey=key;nightKey='';current='';visited.clear();sessionStarted=sessionEnd=totalStops=0;snapshot=null;failure='';if(active){loadSaved();ensureForecast();}}if(active){onWeather();refresh();}}};
}
