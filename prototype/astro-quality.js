import {ASTRO_SITE,ASTRO_RADIUS_KM,siteDistance,astroURLs,parseAstro,astroAt,astroCategory} from './astro-model.js?v=seeing-1';
import {localLabel,localParts} from './observing-time.js?v=abt-1';
const REMOTE='https://raw.githubusercontent.com/darrenbarker1977/diamond-valley-skywatch/main/data/astro-diamond-valley.json';
export function createAstroQuality({getSelection,env=window}){
 const $=id=>document.getElementById(id),panel=$('astro-quality-panel'),cacheKey='dvsky:astro:7timer:v1';let raw=null,model=null,loading=false,error='',generation=0,chartKey='',lastAttempt=0,offline=env.navigator.onLine===false;
 function text(id,value){const el=$(id);if(el&&el.textContent!==value)el.textContent=value;}
 function view(){const selection=getSelection(),near=siteDistance(selection.site,ASTRO_SITE)<=ASTRO_RADIUS_KM;return {...selection,near};}
 function chart(force=false){const c=view(),urls=astroURLs(c.site),key=c.site.latitude+':'+c.site.longitude;for(const id of ['astro-source-link','astro-chart-link'])$(id).href=urls.source;$('astro-meteoblue').href=urls.meteoblue;
  if(!$('astro-chart-details').open||(!force&&chartKey===key))return;chartKey=key;const image=$('astro-source-chart');image.hidden=false;text('astro-chart-status','Loading the provider chart for '+c.site.label+'…');image.alt='7Timer model chart with seeing and transparency for '+c.site.label;image.src=urls.chart+(force?'&refresh='+Date.now():'');
 }
 function paint(){
  const c=view();if(raw&&c.near){try{model=parseAstro(raw,c.site);}catch(e){model=null;error=e.message;}}else model=null;
  text('astro-site',c.site.label);text('astro-selected-time',c.zoneKnown?'Selected evening · '+localLabel(c.instant,c.zone):'Selected observing location · local time awaits the weather feed');
  const row=c.zoneKnown?astroAt(model,c.instant):null,s=astroCategory('seeing',row?.seeing),t=astroCategory('transparency',row?.transparency);
  text('astro-seeing',row?s.label:'View local chart');text('astro-seeing-range',row?s.range:'Image steadiness');text('astro-transparency',row?t.label:'View local chart');text('astro-transparency-range',row?t.range:'How much starlight gets through');
  let status;
  if(!c.near)status='A numeric feed is maintained for the Diamond Valley area. Open the 7Timer chart below for this location; Diamond Valley readings are never reused here.';
  else if(loading&&!model)status='Getting the specialist astronomy forecast…';
  else if(model&&!c.zoneKnown)status='Model ready. Local-time matching will start when the observing timezone is confirmed.';
  else if(model&&!row)status='This evening is outside the published model points. Coverage ends '+localLabel(model.until,c.zone)+'. Choose an earlier evening or open a provider forecast; no five-day seeing values are invented.';
  else if(row)status=`${offline?'Saved offline · ':''}7Timer / GFS model issued ${localLabel(model.init,c.zone)}${model.stale?' · older run; treat cautiously':''}. Forecast point ${localLabel(row.time,c.zone)} · approximately ${model.distance.toFixed(1)} km from the requested model point. Model forecasts, not measurements at your telescope.${error?' Refresh unavailable; showing the last valid model.':''}`;
  else status=(error||'No current numeric astronomy feed is cached.')+' Open the local provider chart below, or Retry forecast.';
  text('astro-status',status);text('astro-model-age',model?'Published model points: '+localLabel(model.rows[0].time,c.zone)+' → '+localLabel(model.until,c.zone):'7Timer normally supplies about 72 hours in 3-hour steps; only returned forecast points are used.');
  const tile=$('astro-quality-tile-status');if(tile)tile.textContent=row?`${model.stale?'Older model · ':''}Seeing: ${s.label} · transparency: ${t.label} · around 9 PM`:c.near?model?'Selected night outside model coverage':loading?'Checking specialist forecast…':'Open the specialist forecast':'View the specialist chart for this location';
  $('astro-retry').disabled=loading||!c.near;$('astro-table').replaceChildren();
  if(model){const p=localParts(c.instant,c.zone),rows=model.rows.filter(r=>localParts(r.time,c.zone).date===p.date);for(const r of rows){const tr=document.createElement('tr');for(const value of [localLabel(r.time,c.zone),astroCategory('seeing',r.seeing).label+' · '+astroCategory('seeing',r.seeing).range,astroCategory('transparency',r.transparency).label+' · '+astroCategory('transparency',r.transparency).range]){const td=document.createElement('td');td.textContent=value;tr.append(td);}$('astro-table').append(tr);}}
  $('astro-table-panel').hidden=!model||!c.zoneKnown;chart();
 }
 async function load(force=false){
  const c=view();if(!c.near){paint();return;}if(loading||(!force&&Date.now()-lastAttempt<30*60000)){paint();return;}lastAttempt=Date.now();loading=true;const request=++generation;paint();
  try{
   let latestError=null;
   for(const url of [REMOTE,new URL('../data/astro-diamond-valley.json',import.meta.url).href]){try{const ctl=new AbortController(),timer=env.setTimeout(()=>ctl.abort(),8000);let response;try{response=await env.fetch(url,{cache:'no-store',credentials:'omit',signal:ctl.signal});}finally{env.clearTimeout(timer);}if(!response.ok)throw Error('Astronomy feed HTTP '+response.status);const candidate=await response.json();parseAstro(candidate,c.site);if(request!==generation)return;raw=candidate;error='';offline=env.navigator.onLine===false;try{env.localStorage.setItem(cacheKey,JSON.stringify(raw));}catch{}latestError=null;break;}catch(e){latestError=e;}}
   if(latestError)throw latestError;
  }catch(e){if(request===generation){offline=env.navigator.onLine===false;error='Specialist forecast could not be refreshed: '+(e.name==='AbortError'?'request timed out':e.message)+'.';}}
  finally{if(request===generation){loading=false;paint();}}
 }
 try{const cached=JSON.parse(env.localStorage.getItem(cacheKey)||'null');if(cached){parseAstro(cached,view().site);raw=cached;}}catch{}
 document.addEventListener('click',event=>{if(event.target.closest('[data-open-astro-quality]')){panel.open=true;paint();load();panel.scrollIntoView({block:'start'});panel.querySelector('summary').focus();}});
 panel.addEventListener('toggle',()=>{if(panel.open){paint();load();}});$('astro-chart-details').addEventListener('toggle',()=>chart());$('astro-chart-retry').addEventListener('click',()=>chart(true));$('astro-retry').addEventListener('click',()=>load(true));
 $('astro-source-chart').addEventListener('load',()=>text('astro-chart-status','Provider forecast chart loaded for '+view().site.label+'. Times use the timezone printed on the chart. Check its model initialization time; this image is not an independent measurement.'));
 $('astro-source-chart').addEventListener('error',()=>{$('astro-source-chart').hidden=true;text('astro-chart-status','The provider chart could not be loaded. Retry it or open a specialist source below. No replacement readings have been generated.');});
 paint();load();return {refresh(){paint();load();},retry:()=>load(true)};
}
