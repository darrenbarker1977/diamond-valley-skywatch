import {createAppHistory} from './app-history.js?v=back-1';
export function createNavigation({dialog,launch,stopCamera,forecastURL,onSection=()=>{},onShown=()=>{},getEntrySection=()=>'objects',getStage=()=>null,restoreStage=()=>{}}){
 const $=id=>document.getElementById(id);let view='home',sectionName='objects',applying=false,replaying=false,order=[],syncing=false;
 const menus=[...document.querySelectorAll('[data-app-view]')];
 const layerNodes={camera:$('camera-view'),compass:$('phone-compass-dialog'),sightings:null,awake:$('screen-awake-info')};
 function isOpen(name){if(name==='scope')return dialog.open&&document.body.classList.contains('dv-scope-view');const el=name==='sightings'?$('seen-history'):layerNodes[name];return !!el?.open&&(!['camera','sightings'].includes(name)||dialog.open);}
 function layers(){order=order.filter(isOpen);for(const name of ['sightings','awake','scope','camera','compass'])if(isOpen(name)&&!order.includes(name))order.push(name);return [...order];}
 function closeLayer(name){
  if(!isOpen(name))return;
  if(name==='camera')stopCamera();else if(name==='scope')$('scope-exit').click();else if(name==='compass')$('phone-compass-dialog').close();else if(name==='sightings')$('seen-history').open=false;else if(name==='awake')$('screen-awake-info').open=false;
 }
 function mark(){for(const button of document.querySelectorAll('.dv-app-header button')){const active=dialog.open?button.hasAttribute('data-open-section'):button.dataset.appView===view;if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}}
 function route(){return {view:dialog.open?'navigator':view,underlay:view,section:dialog.open?sectionName:'objects',stage:dialog.open&&sectionName==='walkthrough'?getStage():null,layers:layers()};}
 function batch(action){const previous=applying;applying=true;try{return action();}finally{applying=previous;checkpoint();}}
 function checkpoint(){if(!applying)history.commit(route(),{replace:history.current.layers.some(x=>['camera','scope','awake','compass'].includes(x))});}
 function section(name){
  if(!replaying&&name!==sectionName)for(const layer of [...layers()].reverse())closeLayer(layer);
  sectionName=name;onSection(name);
  for(const [id,wanted]of [['pointing','pointing'],['equipment','equipment']]){$(id).hidden=name!==wanted;$(id).open=name===wanted;}
  document.querySelector('.dv-nav-content').hidden=!['objects','finder'].includes(name);$('compact-guidance').hidden=name!=='objects';
  document.querySelector('.dv-nav-explore').hidden=name!=='objects';document.querySelector('.dv-nav-browser').hidden=name!=='objects';$('finder-view').hidden=name!=='finder';
  $('walkthrough-view').hidden=name!=='walkthrough';$('mission-view').hidden=name!=='mission';$('field-view').hidden=name!=='field';$('time-planner').hidden=!['objects','mission','field'].includes(name);
  document.body.classList.toggle('dv-app-finder-mode',name==='finder');
  for(const button of document.querySelectorAll('[data-nav-section]'))button.setAttribute('aria-pressed',String(button.dataset.navSection===name));
  document.querySelector(`[data-nav-section="${name}"]`)?.scrollIntoView({block:'nearest',inline:'nearest'});if(name!=='pointing')stopCamera();dialog.scrollTop=0;window.scrollTo(0,0);onShown(name);checkpoint();
 }
 function loadForecast(url){const frame=$('forecast-frame');try{frame.contentWindow.location.replace(url);}catch{frame.src=url;}frame.dataset.loadedUrl=url;}
 function ensureForecast(){
  const frame=$('forecast-frame'),url=forecastURL(frame.dataset.src);frame.title=(new URL(url).searchParams.get('name')||'Diamond Valley')+' five-day stargazing forecast';
  if(frame.dataset.loadedUrl!==url)loadForecast(url);
  else{frame.contentWindow?.postMessage({type:'dvsky-weather-request'},location.origin);try{frame.contentWindow.dispatchEvent(new Event('focus'));}catch{}}
  return frame;
 }
 function show(name){
  view=name;
  // Close the Navigator only after its destination is known, so its close event
  // cannot add an intermediate Home entry while opening Forecast.
  const wasApplying=applying;applying=true;for(const layer of [...layers()].reverse())closeLayer(layer);if(dialog.open)dialog.close();section('objects');
  $('home-view').hidden=name!=='home';$('forecast-view').hidden=name!=='forecast';document.body.classList.remove('dv-app-navigator-mode');document.body.classList.toggle('dv-app-forecast-mode',name==='forecast');
  if(name==='forecast')ensureForecast();mark();window.scrollTo(0,0);applying=wasApplying;checkpoint();
 }
 function replay(target){
  applying=true;replaying=true;
  try{
   for(const name of [...layers()].reverse())if(!target.layers.includes(name))closeLayer(name);
   view=target.underlay;
   if(target.view==='navigator'){
    if(!dialog.open)launch.click();
    $('home-view').hidden=true;$('forecast-view').hidden=true;document.body.classList.remove('dv-app-forecast-mode');document.body.classList.add('dv-app-navigator-mode');
    section(target.section);if(target.section==='walkthrough'&&target.stage!==null)restoreStage(target.stage);
   }else show(target.view);
   for(const name of target.layers){
    if(isOpen(name))continue;
    if(name==='compass')$('phone-compass-dialog').showModal();
    else if(name==='scope'&&dialog.open&&sectionName==='finder')$('finder-scope-view').click();
    else if(name==='sightings'&&dialog.open){$('seen-history').open=true;$('seen-history').scrollIntoView({block:'start'});}
    else if(name==='awake')$('screen-awake-info').open=true;
    // Camera access always needs a fresh explicit tap; Forward never requests it.
   }
   mark();history.commit(route(),{replace:true});
  }finally{applying=false;replaying=false;}
 }
 const history=createAppHistory({onRestore:replay});
 function syncLayers(){
  if(applying||syncing)return;const actual=layers(),prior=history.current.layers;if(JSON.stringify(actual)===JSON.stringify(prior))return;
  const removed=prior.some(x=>!actual.includes(x)),added=actual.some(x=>!prior.includes(x));
  if(removed&&!added&&actual.every((x,i)=>x===prior[i])){syncing=history.back();if(syncing)return;}
  history.commit({...history.current,layers:actual},{replace:removed});
 }
 window.addEventListener('popstate',()=>{syncing=false;});
 new MutationObserver(syncLayers).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['open','class']});
 $('forecast-frame').addEventListener('load',()=>{$('forecast-frame').contentWindow?.postMessage({type:'dvsky-weather-request'},location.origin);});
 for(const button of menus)button.addEventListener('click',()=>show(button.dataset.appView));
 for(const button of document.querySelectorAll('[data-open-section]'))if(button!==launch)button.addEventListener('click',()=>batch(()=>{if(!dialog.open)launch.click();section(button.dataset.openSection);mark();}));
 for(const button of document.querySelectorAll('[data-nav-section]'))button.addEventListener('click',()=>section(button.dataset.navSection));
 launch.addEventListener('click',()=>{$('home-view').hidden=true;$('forecast-view').hidden=true;document.body.classList.remove('dv-app-forecast-mode');document.body.classList.add('dv-app-navigator-mode');section(getEntrySection());mark();});
 dialog.addEventListener('close',()=>{if(dialog.open)return;const wanted=view;$('home-view').hidden=wanted!=='home';$('forecast-view').hidden=wanted!=='forecast';document.body.classList.remove('dv-app-navigator-mode');document.body.classList.toggle('dv-app-forecast-mode',wanted==='forecast');if(history.current.view==='navigator'&&!applying)show(wanted);mark();});
 const height=()=>document.documentElement.style.setProperty('--app-header-height',$('app-header').getBoundingClientRect().height+'px');
 if(globalThis.ResizeObserver)new ResizeObserver(height).observe($('app-header'));height();
 applying=true;section('objects');applying=false;
 return {section,ensureForecast,checkpoint,batch,open(name){return batch(()=>{if(!dialog.open)launch.click();section(name);});},back:()=>history.back(),restore:()=>history.restore(),locationChanged(){const frame=$('forecast-frame');if(frame.dataset.loadedUrl)ensureForecast();}};
}
