import {createLocation,site,forecastURL,setSite} from './location.js?v=location-1';
import {createNavigation} from './navigation.js?v=field-1';
import {createEquipment} from './equipment-ui.js?v=folds-1';
import {createPointing} from './pointing.js?v=flow-1';
import {catalogue} from './catalogue.js?v=catalogue-1';
import {skyVector,angle} from './alignment.js?v=field-1';
import {position,matches} from './positions.js?v=catalogue-1';
import {createSkyAtlas} from './sky-atlas.js?v=flow-1';
import {createFinder} from './finder.js?v=flow-1';
import {objectVisual,objectStory,discoveryNote} from './object-cards.js?v=field-1';
import {createPlanner} from './planner.js?v=aiming-1';
import {createNightMission} from './night-mission.js?v=tour-1';
import {localParts,nightDate,addDays} from './observing-time.js';
import {createLiveCompass} from './live-compass.js?v=field-1';
import {createDiscovery} from './discovery.js';
import {createFieldTools} from './field-tools.js?v=ready-1';
import {createStarHops} from './star-hops.js';
import {createScopeView} from './scope-view.js?v=awake-1';
import {createScreenAwake} from './screen-awake.js?v=dismiss-1';
import {createReadyCheck} from './ready-check.js?v=flow-1';
import {createNextTarget} from './next-target.js';
import {createFinderTargets} from './finder-targets.js';
import {createHapticGuide} from './haptic-guide.js?v=flow-1';
import {createContextHelp} from './context-help.js';
const requestedQuery=new URLSearchParams(location.search);
if(requestedQuery.has('mission')&&requestedQuery.has('lat')&&requestedQuery.has('lon')){
 try{let zone=requestedQuery.get('zone')||'UTC';try{new Intl.DateTimeFormat('en',{timeZone:zone});}catch{zone='UTC';}setSite({latitude:Number(requestedQuery.get('lat')),longitude:Number(requestedQuery.get('lon')),height:0,accuracy:null,source:'coordinates',label:(requestedQuery.get('name')||'Planned location').slice(0,120),clockTimezone:zone,physicalConfirmed:false});}catch{}
}
const $=id=>document.getElementById(id), dialog=$('navigator');
let readyCheck=null,nextTarget=null,haptics=null,finderTargets=null,currentPointing=null,contextHelp=null;
let selected='Moon',desiredTarget='Moon',filter='all',timer,positions=new Map(),livePositions=new Map(),atlas=null,finder=null,planner=null,mission=null,locationUI=null,field=null,hops=null,lastDetail='',calculationTime=new Date();
const A=globalThis.Astronomy;
const equipment=createEquipment(()=>{if(positions.size)render();pointing.refresh();mission?.refresh();nextTarget?.refresh();readyCheck?.refresh();});
const pointing=createPointing({A,catalogue,position,getSelected:()=>catalogue.find(o=>o.id===selected),getAlignmentEyepiece:()=>equipment.alignmentHint(),onTargetSelect:id=>{selected=id;if(positions.size)render();},onAligned:result=>completeAlignment(result),onNext:step=>{if(step==='guidance')startLiveGuidance();else if(step==='daylight')appHelpAction('mission');else readyPointing(null,step,step==='sensors'&&!currentPointing?.listening);},allowGuidance:()=>!planner?.planning,onPose:state=>{currentPointing=state;updateHomeSession(state);atlas?.pose(state);finder?.pose(state);readyCheck?.pose(state);haptics?.pose(state);}});
atlas=createSkyAtlas({A,site,catalogue,onSelect:id=>chooseObject(id)});
function setPointingMode(mode){if($('pointing-mode').value!==mode){$('pointing-mode').value=mode;$('pointing-mode').dispatchEvent(new Event('change'));}}
finder=createFinder({getKit:()=>equipment.current(),onSetup:mode=>readyPointing(mode,'alignment'),onMode:setPointingMode,onStop:()=>pointing.suspend(),onSky:()=>{navigation.section('objects');$('atlas-card').open=true;if(currentPointing?.alignment?.calibrated)atlas.follow();revealReadyControl('atlas-title');}});
hops=createStarHops({catalogue,onRoute:ids=>{planner.now();navigation.section('objects');$('atlas-card').open=true;atlas.showHop(ids);},onVibration:()=>appHelpAction('vibration')});
const screenAwake=createScreenAwake();
haptics=createHapticGuide();
const scopeView=createScopeView();
createLiveCompass();createDiscovery();
planner=createPlanner({getZone:()=>mission?.snapshot?.zone||site.clockTimezone,onChange:()=>{
 if(planner.planning)pointing.suspend('Planned sky only. Return to Now and repeat alignment before using direction arrows.');
 if(mission?.active||planner.planning)mission?.activate();
 if(dialog.open)update();field?.refresh();readyCheck?.refresh();
}});
mission=createNightMission({A,site,getContext:()=>planner.context(),getKit:()=>equipment.current(),ensureForecast:()=>navigation.ensureForecast(),onLive:id=>{
 setTransition('');selected=desiredTarget=id;planner.now();if(dialog.open)update();else $('launch').click();navigation.section('finder');
},onPreview:(id,time)=>{
 const zone=planner.zone,p=localParts(time,zone);planner.plan(nightDate(time,zone),p.hour*60+p.minute+(p.hour<6?1440:0));selected=desiredTarget=id;update();navigation.section('objects');$('atlas-card').open=true;atlas.centerTarget();$('selected-panel').open=true;
},onWeather:()=>{
 if(mission?.snapshot?.zone)site.clockTimezone=mission.snapshot.zone;locationUI?.display();planner.refresh();field?.refresh();readyCheck?.refresh();if(dialog.open)update();
}});
field=createFieldTools({A,site,getContext:()=>planner.context(),getSnapshot:()=>mission.snapshot,ensureWeather:()=>navigation.ensureForecast()});
const degrees=n=>`${n.toFixed(1)}°`;
const compass=az=>['N','NE','E','SE','S','SW','W','NW'][Math.round(az/45)%8];
function node(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
function svg(tag,attrs,text){const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,value);if(text)el.textContent=text;return el;}
function fail(error){pointing.suspend('Sky calculations failed. Guidance is off.');positions.clear();$('objects').replaceChildren();$('detail').replaceChildren();atlas?.fail();finder?.fail();$('error').hidden=false;$('error').textContent=`Sky calculations unavailable: ${error.message}. No positions or pointing readings will be substituted.`;$('clock').textContent='Calculation unavailable';}
function update(){
  try {
    if(!A)throw new Error('astronomy library did not load');
    const now=new Date(),context=planner.context();calculationTime=context.planning?context.instant:now;
    positions=new Map(catalogue.map(o=>[o.id,position(A,o,calculationTime)]));
    livePositions=context.planning?new Map(catalogue.map(o=>[o.id,position(A,o,now)])):positions;
    $('clock').textContent=new Intl.DateTimeFormat('en-CA',{timeZone:context.zone,month:'short',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit',timeZoneName:'short'}).format(calculationTime);planner.refresh();
    $('error').hidden=true;render();pointing.refresh();
  }catch(error){fail(error);}
}
function render(){
  const objects=catalogue.filter(o=>matches(o,$('search').value)&&(filter!=='up'||positions.get(o.id).alt>0));
  $('count').textContent=`${objects.length} of ${catalogue.length} objects · all 110 Messier objects, southern highlights, bright stars and planets · positions update every 10 seconds`;
  const list=$('objects');const previous=list.scrollTop;
  // Keep existing buttons when the result IDs have not changed, preserving keyboard focus.
  const ids=objects.map(o=>o.id).join('|');
  if(list.dataset.ids!==ids){
    list.replaceChildren(...objects.map(o=>{
      const button=node('button',undefined,'dv-nav-object');button.type='button';button.dataset.id=o.id;
      const label=node('span');label.append(node('strong',o.name),node('small',`${o.id===o.name?o.type:o.id+' · '+o.type}`));
      button.append(label,node('span','','dv-nav-alt'));button.addEventListener('click',()=>chooseObject(o.id));return button;
    }));list.dataset.ids=ids;
  }
  for(const button of list.children){const p=positions.get(button.dataset.id);button.setAttribute('aria-pressed',String(button.dataset.id===selected));button.lastChild.textContent=p.alt>0?`${degrees(p.alt)} up`:'Below horizon';}
  list.scrollTop=previous;
  if(!objects.length){$('count').textContent='No matching objects. Try a name or a Messier / NGC number.';}
  $('library-count').textContent=objects.length+' objects';
  $('selected-summary').textContent=catalogue.find(o=>o.id===selected).name+' · viewing guide';
  const o=catalogue.find(o=>o.id===selected),p=positions.get(selected),story=objectStory(o);
  const detail=$('detail'),same=lastDetail===selected,openKeys=same?[...detail.querySelectorAll('details[open]')].map(el=>el.dataset.detailKey):[];
  const focusElement=detail.contains(document.activeElement)?document.activeElement:null,focusId=focusElement?.id;
  const hero=same?detail.querySelector(':scope > .object-visual'):null;
  const heading=node('div',undefined,'object-caption');heading.append(node('span',o.type.toUpperCase(),'dv-nav-eyebrow'),node('span',story.difficulty,'object-difficulty'),Object.assign(node('h3',o.name),{id:'target-name'}));
  const sun=positions.get('Sun');const availability=o.id==='Sun'?'Solar observing requires specialist protection':p.alt<=0?'Below the horizon · plan for another time':sun?.alt>-6?'Daylight or bright twilight · sky positions shown for planning':p.alt<20?'Low in the sky · watch for obstacles':'Above the horizon · check your actual sky';
  heading.append(node('p',(planner.planning?'Planned sky · ':'')+availability,'object-availability'),node('p',`${compass(p.az)} · ${degrees(p.alt)} up · ${degrees(p.az)} true azimuth`,'object-position'),node('p',discoveryNote(o),'object-fact'));detail.replaceChildren(hero||objectVisual(o,{compass:true}),heading);
  const stats=node('dl',undefined,'dv-nav-stats');
  for(const [label,value] of [['ALTITUDE',degrees(p.alt)],['TRUE AZIMUTH',`${degrees(p.az)} ${compass(p.az)}`]]){const group=node('div');group.append(node('dt',label),node('dd',value));stats.append(group);}
  const actions=node('div',undefined,'object-actions'),findButton=node('button',planner.planning?'⌖ Find in the live sky':'⌖ Find this object'),center=node('button','Show on sky map');findButton.id='find-selected';center.id='center-selected';findButton.type=center.type='button';findButton.disabled=o.id==='Sun';findButton.addEventListener('click',()=>startLiveGuidance());center.addEventListener('click',()=>{$('atlas-card').open=true;atlas.centerTarget();$('atlas-card').scrollIntoView({block:'nearest'});});actions.append(findButton,center);if(p.alt<=0||sun?.alt>-6){const plan=node('button','Plan another time');plan.type='button';plan.id='plan-selected';plan.addEventListener('click',()=>appHelpAction('plan'));actions.append(plan);}const kitLink=node('button','My eyepieces');kitLink.type='button';kitLink.id='object-kit-link';kitLink.addEventListener('click',()=>appHelpAction(equipment.current()?'kit':'telescope'));actions.append(kitLink);detail.append(actions);
  const about=node('details',undefined,'dv-nav-about');about.dataset.detailKey='calculation';about.append(node('summary','Object notes & position details'));about.append(stats,node('p',o.note,'object-spoiler'));
  if(!o.body)about.append(node('p','Precessed J2000 catalogue position. Rounded coordinates; proper motion not applied. Suitable for exploration, not precision alignment.'));
  const advice=equipment.appendAdvice(detail,o,p.alt);advice.querySelector('details').dataset.detailKey='eyepiece';
  const expect=node('details',undefined,'object-expect');expect.dataset.detailKey='expect';expect.append(node('summary','What will I see through the eyepiece?'),node('p',story.expect),node('p','Space images can use enhanced colour and non-visible wavelengths. Expect subtler colours and less detail through an eyepiece.','dv-nav-fine'));detail.append(expect,about);
  for(const extra of detail.querySelectorAll('details'))if(openKeys.includes(extra.dataset.detailKey))extra.open=true;
  if(focusElement?.isConnected)focusElement.focus({preventScroll:true});else if(focusId)document.getElementById(focusId)?.focus({preventScroll:true});lastDetail=selected;
  finder.target(o,livePositions.get(selected));nextTarget?.refresh();finderTargets?.refresh();hops.update(livePositions,selected);drawMap();pointing.paint();contextHelp?.refresh();
}
function drawMap(){atlas?.update(positions,selected,calculationTime,planner.planning);}
function chooseObject(id){setTransition('');atlas.showHop([]);selected=desiredTarget=id;render();$('object-library').open=false;$('selected-panel').open=true;if(id!=='Sun'&&!planner.planning&&currentPointing?.alignment?.calibrated)startLiveGuidance();else atlas.centerTarget();}
$('atlas-center').addEventListener('click',()=>atlas.centerTarget());
$('atlas-align').addEventListener('click',()=>readyPointing(null,'alignment'));
$('launch').addEventListener('click',()=>{if(!dialog.open)dialog.show();$('launch').setAttribute('aria-expanded','true');update();clearInterval(timer);timer=setInterval(()=>{if(!document.hidden)update();},10000);$('close').focus();});
$('close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{clearInterval(timer);$('launch').setAttribute('aria-expanded','false');$('launch').focus();});
$('expand').addEventListener('click',()=>{const expanded=dialog.classList.toggle('dv-nav-expanded');$('expand').setAttribute('aria-pressed',String(expanded));$('expand').setAttribute('aria-label',expanded?'Collapse panel':'Expand panel');});
$('night').addEventListener('click',()=>{const enabled=document.body.classList.toggle('dv-nav-night');$('night').setAttribute('aria-pressed',String(enabled));$('night').textContent=`☾ Red night mode: ${enabled?'on':'off'}`;});
$('search').addEventListener('input',()=>{$('object-library').open=true;if(positions.size)render();});
for(const button of document.querySelectorAll('[data-filter]'))button.addEventListener('click',()=>{filter=button.dataset.filter;for(const b of document.querySelectorAll('[data-filter]'))b.setAttribute('aria-pressed',String(b===button));if(positions.size)render();});
document.addEventListener('visibilitychange',()=>{if(dialog.open&&!document.hidden)update();});
window.addEventListener('pageshow',()=>{if(dialog.open)update();});

const navigation=createNavigation({dialog,launch:$('launch'),stopCamera:()=>pointing.hideCamera(),forecastURL,onSection:name=>{
 if(name!=='finder')scopeView.exit();
 readyCheck?.place(dialog.open);haptics?.activate(name==='finder'&&dialog.open);
 if(['finder','pointing'].includes(name)&&planner.planning)planner.now();
 if(name==='finder'&&currentPointing?.alignment?.calibrated){haptics?.start();atlas?.follow();}
 if(name==='mission')mission.activate();if(name==='field')field.activate();else field.deactivate();
}});
locationUI=createLocation(()=>{pointing.suspend('Observing location changed. Repeat alignment at this location.');atlas.locationChanged();navigation.locationChanged();mission.locationChanged();field.locationChanged();planner.refresh();readyCheck?.refresh();nextTarget?.refresh();haptics?.reset();if(dialog.open)update();});

function revealReadyControl(id){
 const control=$(id);if(!control||control.hidden)return;
 if(!control.matches('button,input,select,a[href]'))control.tabIndex=-1;
 control.focus({preventScroll:true});control.scrollIntoView({block:'center'});
}
function readyPointing(mode,step,startSensors=false){
 if(!dialog.open)$('launch').click();navigation.section('pointing');if(mode)setPointingMode(mode);
 $('pointing-setup').open=true;let target='pointing-mode';
 if(step==='location')target='location-present';
 else if(step==='daylight')target=$('alignment-daylight').hidden?'alignment-help':'alignment-daylight';
 else if(step==='placement')target=$('pointing-mode').value==='mounted'?'mount-confirm':'setup-help';
 else if(step==='sensors'){
  if(!site.physicalConfirmed)target='location-present';
  else if(startSensors&&!$('enable-sensors').disabled){$('enable-sensors').click();$('pointing-setup').open=true;target='sensor-status';}
  else target=$('enable-sensors').disabled?'sensor-status':'enable-sensors';
 }else if(step==='alignment'){
  if(!site.physicalConfirmed)target='location-present';
  else if(!$('alignment-daylight').hidden)target='alignment-daylight';
  else if($('pointing-mode').value==='mounted'&&!$('mount-confirm').checked)target='mount-confirm';
  else if(!currentPointing?.alignment?.fresh||currentPointing.alignment.sensorStatus!=='receiving')target=$('enable-sensors').disabled?'sensor-status':'enable-sensors';
  else if(document.querySelector('.dv-nav-alignment').hidden)target='guidance';
  else target=$('alignment-target').disabled?'alignment-help':'alignment-search';
 }
 revealReadyControl(target);
}
readyCheck=createReadyCheck({A,site,getContext:()=>planner.context(),getSnapshot:()=>mission.snapshot,getAwake:()=>screenAwake.snapshot,
 onLocation:()=>{const wasOpen=dialog.open,openLocation=()=>{$('home-location-panel').open=true;revealReadyControl('use-location');};if(wasOpen)dialog.addEventListener('close',openLocation,{once:true});document.querySelector('#app-header [data-app-view=home]').click();if(!wasOpen)openLocation();},
 onPointing:readyPointing,
 onTime:action=>{if(action==='reload'){location.reload();return;}if(action==='now'){planner.now();readyCheck.refresh();return;}if(!dialog.open)$('launch').click();if(action==='tonight'){planner.now();navigation.section('mission');revealReadyControl('mission-title');}else{navigation.section('objects');$('atlas-card').open=true;revealReadyControl('atlas-title');}},
 onFind:()=>startLiveGuidance({pick:true}),
 onWeather:refresh=>{$('nav-to-forecast').click();const frame=$('forecast-frame');if(refresh)frame.contentWindow?.postMessage({type:'dvsky-weather-refresh'},location.origin);},
 onAwake:action=>{if(action==='settings'){$('screen-awake-info').open=true;revealReadyControl('screen-awake-auto');}else screenAwake.set(true);}
});
if(currentPointing)readyCheck.pose(currentPointing);
function findLiveTarget(id){haptics.reset();selected=desiredTarget=id;setTransition('');startLiveGuidance();}
finderTargets=createFinderTargets({A,site,getSelected:()=>selected,onSelect:findLiveTarget});
nextTarget=createNextTarget({A,site,getKit:()=>equipment.current(),getSelected:()=>selected,getSnapshot:()=>mission.snapshot,onSelect:findLiveTarget});

function setTransition(text){$('guidance-transition-status').textContent=text;$('guidance-transition-status').hidden=!text;}
function updateHomeSession(state){
 if(!state?.alignment?.calibrated)setTransition('');
 const visible=!!state?.listening||!!state?.alignment?.calibrated;$('observing-session').hidden=!visible;if(!visible)return;
 const aligned=!!state.alignment?.calibrated,receiving=state.alignment?.fresh&&state.alignment?.sensorStatus==='receiving';
 $('observing-session-status').textContent=aligned?(receiving?'Your alignment is retained · live pointing sensors are on.':'Alignment retained · waiting for fresh phone readings.'):(receiving?'Sensors are on · next, centre and record one bright object.':'Pointing sensors are starting or waiting for readings.');
 $('observing-session-next').textContent=aligned?'Continue live guidance':'Next · finish one-object alignment';
}
function liveTargetUsable(id){
 try{const object=catalogue.find(o=>o.id===id);if(!object||id==='Sun')return false;const now=new Date(),p=position(A,object,now),sun=position(A,catalogue.find(o=>o.id==='Sun'),now);return p.alt>0&&p.alt<=80&&sun.alt<=-6&&angle(skyVector(p),skyVector(sun))>=30;}catch{return false;}
}
function completeAlignment(result){
 if(!currentPointing?.alignment?.calibrated)return;
 const preferred=desiredTarget,kept=liveTargetUsable(preferred);selected=desiredTarget=kept?preferred:result.id;
 setTransition(kept?'Aligned · live guidance is ready. Choose another target whenever you like.':'Alignment saved. Your previous target is not suitable in the live sky; showing '+(catalogue.find(o=>o.id===result.id)?.name||result.id)+'. Choose a visible target to continue.');
 startLiveGuidance();
}
function startLiveGuidance({pick=false}={}){
 planner.now();if(!dialog.open)$('launch').click();else update();navigation.section('finder');
 if(currentPointing?.alignment?.calibrated){atlas.follow();haptics.start();}
 if(pick){$('finder-target-picker').open=true;finderTargets?.refresh();revealReadyControl('finder-target-search');}
 else{$('finder-target-picker').open=false;revealReadyControl('finder-compass');}
}
$('observing-session-next').addEventListener('click',()=>{if(currentPointing?.alignment?.calibrated)startLiveGuidance();else readyPointing(null,'alignment');});
$('observing-session-stop').addEventListener('click',()=>pointing.suspend('Pointing stopped. Enable sensors and align when you want to resume.'));

function openAppSection(name){if(!dialog.open)$('launch').click();navigation.section(name);}
function openAppLocation(action){
 const wasOpen=dialog.open,show=()=>{$('home-location-panel').open=true;if(action==='place'||action==='coordinates')document.querySelector('.dv-location-search').open=true;if(action==='coordinates')$('coordinate-form').closest('details').open=true;revealReadyControl(action==='place'?'place-query':action==='coordinates'?'site-latitude':'use-location');};
 if(wasOpen)dialog.addEventListener('close',show,{once:true});document.querySelector('#app-header [data-app-view=home]').click();if(!wasOpen)show();
}
function appHelpAction(action){
 switch(action){
 case 'reload':location.reload();break;
 case 'clear-search':$('search').value='';filter='all';for(const button of document.querySelectorAll('[data-filter]'))button.setAttribute('aria-pressed',String(button.dataset.filter==='all'));openAppSection('objects');if(positions.size)render();$('object-library').open=true;revealReadyControl('search');break;
 case 'catalogue':openAppSection('objects');$('object-library').open=true;revealReadyControl('search');break;
 case 'pick-target':openAppSection('finder');$('finder-target-picker').open=true;finderTargets?.refresh();revealReadyControl('finder-target-search');break;
 case 'align':readyPointing(null,'alignment');break;
 case 'sensors':readyPointing(null,'sensors');break;
 case 'sensor-help':openAppSection('pointing');$('pointing-troubleshooting').open=true;revealReadyControl('pointing-troubleshooting');break;
 case 'camera-help':openAppSection('pointing');$('pointing-troubleshooting').open=true;revealReadyControl('pointing-troubleshooting');break;
 case 'without-camera':pointing.hideCamera();readyPointing(null,'alignment');break;
 case 'vibration':openAppSection('finder');revealReadyControl('finder-vibration');break;
 case 'fitted':openAppSection('finder');$('fitted-panel').open=true;revealReadyControl(!$('fitted-zoom-label').hidden&&$('fitted-eyepiece').value?'fitted-zoom':'fitted-eyepiece');break;
 case 'kit':openAppSection('equipment');revealReadyControl('kit-list');break;
 case 'telescope':openAppSection('equipment');$('telescope-settings').open=true;revealReadyControl('telescope-focal');break;
 case 'enable-eyepiece':openAppSection('equipment');if(!equipment.current()){appHelpAction('telescope');break;}const input=$('kit-list').querySelector('input');if(input){input.focus();input.scrollIntoView({block:'center'});}else appHelpAction('add-eyepiece');break;
 case 'add-eyepiece':if(!equipment.current()){appHelpAction('telescope');break;}openAppSection('equipment');$('eyepiece-add-panel').open=true;revealReadyControl('new-eyepiece-name');break;
 case 'plan':openAppSection('objects');if(!planner.planning)planner.plan();$('planner-settings').open=true;revealReadyControl('plan-date');break;
 case 'duration':openAppSection('mission');$('mission-duration-panel').open=true;document.querySelector('.mission-duration-entry').open=true;revealReadyControl('mission-minutes-input');break;
 case 'mission':openAppSection('mission');revealReadyControl('mission-title');break;
 case 'now':planner.now();field?.refresh();contextHelp?.refresh();break;
 case 'forecast':$('nav-to-forecast').click();break;
 case 'location':openAppLocation();break;
 case 'place':openAppLocation('place');break;
 case 'coordinates':openAppLocation('coordinates');break;
 case 'location-help':location.href=new URL('../field-check.html#permissions',import.meta.url).href;break;
 case 'guide':location.href=new URL('../field-check.html',import.meta.url).href;break;
 case 'retry-aurora':case 'retry-air':case 'retry-iss':field.retry(action.slice(6));break;
 }
}
contextHelp=createContextHelp({act:appHelpAction,getState:()=>({pose:currentPointing,kit:equipment.current(),target:catalogue.find(o=>o.id===selected),position:livePositions.get(selected)})});

window.addEventListener('keydown',event=>{if(event.key==='Escape'&&dialog.open){event.preventDefault();dialog.close();}});
function openTarget(id){
 setTransition('');
 if(id&&!catalogue.some(object=>object.id===id))return;
 if(id)selected=desiredTarget=id;
 planner.now();
 $('search').value='';filter='all';for(const button of document.querySelectorAll('[data-filter]'))button.setAttribute('aria-pressed',String(button.dataset.filter==='all'));
 $('launch').click();
 if(id){$('selected-panel').open=true;if(id!=='Sun'&&currentPointing?.alignment?.calibrated)startLiveGuidance();else atlas.centerTarget();}else $('object-library').open=true;
}
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==$('forecast-frame').contentWindow)return;
 if(event.data?.type==='dvsky-open-help'&&['location','catalogue','guide'].includes(event.data.action)){appHelpAction(event.data.action);return;}
 if(event.data?.type==='dvsky-night-mission'){startMission(event.data.date,event.data.start);return;}
 if(event.data?.type==='dvsky-select-target'&&typeof event.data.id==='string')openTarget(event.data.id);
});
function startMission(date,minute){
 try{if(date){addDays(date,0);if(!Number.isInteger(minute)||minute<960||minute>1800)return;planner.plan(date,minute);}if(!dialog.open)$('launch').click();navigation.section('mission');}catch{}
}
if(requestedQuery.has('target')||requestedQuery.has('navigator'))openTarget(requestedQuery.get('target')||'');
if(requestedQuery.has('mission'))startMission(requestedQuery.get('night'),Number(requestedQuery.get('at')||1260));

const sectionLink=requestedQuery.get('section');
if(['objects','finder','pointing','equipment','mission','field'].includes(sectionLink)){openAppSection(sectionLink);if(sectionLink==='pointing')readyPointing(null,'alignment');}
