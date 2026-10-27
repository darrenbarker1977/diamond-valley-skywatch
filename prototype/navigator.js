import {createLocation,site,forecastURL,setSite} from './location.js?v=location-1';
import {createNavigation} from './navigation.js?v=compass-2';
import {createEquipment} from './equipment-ui.js?v=catalogue-1';
import {createPointing} from './pointing.js?v=mission-1';
import {catalogue} from './catalogue.js?v=catalogue-1';
import {position,matches} from './positions.js?v=catalogue-1';
import {createSkyAtlas} from './sky-atlas.js?v=mission-1';
import {createFinder} from './finder.js?v=compass-1';
import {objectVisual,objectStory} from './object-cards.js?v=compass-5';
import {createPlanner} from './planner.js';
import {createNightMission} from './night-mission.js';
import {localParts,nightDate,addDays} from './observing-time.js';
import {createLiveCompass} from './live-compass.js?v=compass-5';
import {createScopeView} from './scope-view.js';
const requestedQuery=new URLSearchParams(location.search);
if(requestedQuery.has('mission')&&requestedQuery.has('lat')&&requestedQuery.has('lon')){
 try{let zone=requestedQuery.get('zone')||'UTC';try{new Intl.DateTimeFormat('en',{timeZone:zone});}catch{zone='UTC';}setSite({latitude:Number(requestedQuery.get('lat')),longitude:Number(requestedQuery.get('lon')),height:0,accuracy:null,source:'coordinates',label:(requestedQuery.get('name')||'Planned location').slice(0,120),clockTimezone:zone,physicalConfirmed:false});}catch{}
}
const $=id=>document.getElementById(id), dialog=$('navigator');
let selected='Moon',desiredTarget='Moon',filter='all',timer,positions=new Map(),livePositions=new Map(),atlas=null,finder=null,planner=null,mission=null,locationUI=null,lastDetail='',calculationTime=new Date();
const A=globalThis.Astronomy;
const equipment=createEquipment(()=>{if(positions.size)render();pointing.refresh();mission?.refresh();});
const pointing=createPointing({A,catalogue,position,getSelected:()=>catalogue.find(o=>o.id===selected),getAlignmentEyepiece:()=>equipment.alignmentHint(),onTargetSelect:id=>{selected=id;if(positions.size)render();},onAligned:()=>{if(desiredTarget!=='Sun'&&catalogue.some(o=>o.id===desiredTarget)){selected=desiredTarget;if(positions.size)render();}},allowGuidance:()=>!planner?.planning,onPose:state=>{atlas?.pose(state);finder?.pose(state);}});
atlas=createSkyAtlas({A,site,catalogue,onSelect:id=>chooseObject(id)});
function setPointingMode(mode){if($('pointing-mode').value!==mode){$('pointing-mode').value=mode;$('pointing-mode').dispatchEvent(new Event('change'));}}
finder=createFinder({getKit:()=>equipment.current(),onSetup:mode=>{setPointingMode(mode);navigation.section('pointing');},onMode:setPointingMode,onStop:()=>pointing.suspend(),onSky:()=>navigation.section('objects')});
const scopeView=createScopeView();
createLiveCompass();
planner=createPlanner({getZone:()=>mission?.snapshot?.zone||site.clockTimezone,onChange:()=>{
 if(planner.planning)pointing.suspend('Planned sky only. Return to Now and repeat alignment before using direction arrows.');
 if(mission?.active||planner.planning)mission?.activate();
 if(dialog.open)update();
}});
mission=createNightMission({A,site,getContext:()=>planner.context(),getKit:()=>equipment.current(),ensureForecast:()=>navigation.ensureForecast(),onLive:id=>{
 selected=desiredTarget=id;planner.now();if(dialog.open)update();else $('launch').click();navigation.section('finder');
},onPreview:(id,time)=>{
 const zone=planner.zone,p=localParts(time,zone);planner.plan(nightDate(time,zone),p.hour*60+p.minute+(p.hour<6?1440:0));selected=desiredTarget=id;update();navigation.section('objects');atlas.centerTarget();$('selected-panel').open=true;
},onWeather:()=>{
 if(mission?.snapshot?.zone)site.clockTimezone=mission.snapshot.zone;locationUI?.display();planner.refresh();if(dialog.open)update();
}});
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
  const sun=positions.get('Sun');const availability=o.id==='Sun'?'Solar observing requires specialist protection':p.alt<=0?'Below the horizon · plan for another time':sun?.alt>0?'Daylight · sky positions shown for planning':p.alt<20?'Low in the sky · watch for obstacles':'Above the horizon · check your actual sky';
  heading.append(node('p',(planner.planning?'Planned sky · ':'')+availability,'object-availability'),node('p',`${compass(p.az)} · ${degrees(p.alt)} up · ${degrees(p.az)} true azimuth`,'object-position'));detail.replaceChildren(hero||objectVisual(o,{compass:true}),heading);
  const stats=node('dl',undefined,'dv-nav-stats');
  for(const [label,value] of [['ALTITUDE',degrees(p.alt)],['TRUE AZIMUTH',`${degrees(p.az)} ${compass(p.az)}`]]){const group=node('div');group.append(node('dt',label),node('dd',value));stats.append(group);}
  const actions=node('div',undefined,'object-actions'),findButton=node('button',planner.planning?'⌖ Find in the live sky':'⌖ Find this object'),center=node('button','Show on sky map');findButton.id='find-selected';center.id='center-selected';findButton.type=center.type='button';findButton.disabled=o.id==='Sun';findButton.addEventListener('click',()=>navigation.section('finder'));center.addEventListener('click',()=>{atlas.centerTarget();$('atlas-card').scrollIntoView({block:'nearest'});});actions.append(findButton,center);detail.append(actions);
  const about=node('details',undefined,'dv-nav-about');about.dataset.detailKey='calculation';about.append(node('summary','Object notes & position details'));about.append(stats,node('p',o.note));
  if(!o.body)about.append(node('p','Precessed J2000 catalogue position. Rounded coordinates; proper motion not applied. Suitable for exploration, not precision alignment.'));
  const advice=equipment.appendAdvice(detail,o,p.alt);advice.querySelector('details').dataset.detailKey='eyepiece';
  const expect=node('details',undefined,'object-expect');expect.dataset.detailKey='expect';expect.append(node('summary','What will I see through the eyepiece?'),node('p',story.expect),node('p','Space images can use enhanced colour and non-visible wavelengths. Expect subtler colours and less detail through an eyepiece.','dv-nav-fine'));detail.append(expect,about);
  for(const extra of detail.querySelectorAll('details'))if(openKeys.includes(extra.dataset.detailKey))extra.open=true;
  if(focusElement?.isConnected)focusElement.focus({preventScroll:true});else if(focusId)document.getElementById(focusId)?.focus({preventScroll:true});lastDetail=selected;
  finder.target(o,livePositions.get(selected));drawMap();pointing.paint();
}
function drawMap(){atlas?.update(positions,selected,calculationTime,planner.planning);}
function chooseObject(id){selected=desiredTarget=id;render();$('object-library').open=false;$('selected-panel').open=true;atlas.centerTarget();}
$('atlas-center').addEventListener('click',()=>atlas.centerTarget());
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
 if(['finder','pointing'].includes(name)&&planner.planning)planner.now();
 if(name==='mission')mission.activate();
}});
locationUI=createLocation(()=>{pointing.suspend('Observing location changed. Repeat alignment at this location.');atlas.locationChanged();navigation.locationChanged();mission.locationChanged();planner.refresh();if(dialog.open)update();});

window.addEventListener('keydown',event=>{if(event.key==='Escape'&&dialog.open){event.preventDefault();dialog.close();}});
function openTarget(id){
 if(id&&!catalogue.some(object=>object.id===id))return;
 if(id)selected=desiredTarget=id;
 planner.now();
 $('search').value='';filter='all';for(const button of document.querySelectorAll('[data-filter]'))button.setAttribute('aria-pressed',String(button.dataset.filter==='all'));
 $('launch').click();
 if(id){$('selected-panel').open=true;atlas.centerTarget();}else $('object-library').open=true;
}
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==$('forecast-frame').contentWindow)return;
 if(event.data?.type==='dvsky-night-mission'){startMission(event.data.date,event.data.start);return;}
 if(event.data?.type==='dvsky-select-target'&&typeof event.data.id==='string')openTarget(event.data.id);
});
function startMission(date,minute){
 try{if(date){addDays(date,0);if(!Number.isInteger(minute)||minute<960||minute>1800)return;planner.plan(date,minute);}if(!dialog.open)$('launch').click();navigation.section('mission');}catch{}
}
if(requestedQuery.has('target')||requestedQuery.has('navigator'))openTarget(requestedQuery.get('target')||'');
if(requestedQuery.has('mission'))startMission(requestedQuery.get('night'),Number(requestedQuery.get('at')||1260));
