import {catalogue} from './catalogue.js';
import {position,project,matches} from './positions.js';
const $=id=>document.getElementById(id), dialog=$('navigator');
let selected='Moon',filter='all',timer,positions=new Map();
const A=globalThis.Astronomy;
const degrees=n=>`${n.toFixed(1)}°`;
const compass=az=>['N','NE','E','SE','S','SW','W','NW'][Math.round(az/45)%8];
function node(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
function svg(tag,attrs,text){const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,value);if(text)el.textContent=text;return el;}
function fail(error){positions.clear();$('objects').replaceChildren();$('detail').replaceChildren();drawMap();$('error').hidden=false;$('error').textContent=`Sky calculations unavailable: ${error.message}. No positions or pointing readings will be substituted.`;$('clock').textContent='Calculation unavailable';}
function update(){
  try {
    if(!A)throw new Error('astronomy library did not load');
    const now=new Date();
    positions=new Map(catalogue.map(o=>[o.id,position(A,o,now)]));
    $('clock').textContent=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Edmonton',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit',timeZoneName:'short'}).format(now);
    $('error').hidden=true;render();
  }catch(error){fail(error);}
}
function render(){
  const objects=catalogue.filter(o=>matches(o,$('search').value)&&(filter!=='up'||positions.get(o.id).alt>0));
  $('count').textContent=`${objects.length} of ${catalogue.length} curated objects · positions update every 10 seconds`;
  const list=$('objects');const previous=list.scrollTop;
  // Keep existing buttons when the result IDs have not changed, preserving keyboard focus.
  const ids=objects.map(o=>o.id).join('|');
  if(list.dataset.ids!==ids){
    list.replaceChildren(...objects.map(o=>{
      const button=node('button',undefined,'dv-nav-object');button.type='button';button.dataset.id=o.id;
      const label=node('span');label.append(node('strong',o.name),node('small',`${o.id===o.name?o.type:o.id+' · '+o.type}`));
      button.append(label,node('span','','dv-nav-alt'));button.addEventListener('click',()=>{selected=o.id;render();});return button;
    }));list.dataset.ids=ids;
  }
  for(const button of list.children){const p=positions.get(button.dataset.id);button.setAttribute('aria-pressed',String(button.dataset.id===selected));button.lastChild.textContent=p.alt>0?`${degrees(p.alt)} up`:'Below horizon';}
  list.scrollTop=previous;
  if(!objects.length){$('count').textContent='No matching objects. Try a name or a Messier / NGC number.';}
  const o=catalogue.find(o=>o.id===selected),p=positions.get(selected);
  const detail=$('detail');detail.replaceChildren(node('span',o.type.toUpperCase(),'dv-nav-eyebrow'),Object.assign(node('h3',o.name),{id:'target-name'}));
  const stats=node('dl',undefined,'dv-nav-stats');
  for(const [label,value] of [['ALTITUDE',degrees(p.alt)],['TRUE AZIMUTH',`${degrees(p.az)} ${compass(p.az)}`]]){const group=node('div');group.append(node('dt',label),node('dd',value));stats.append(group);}
  detail.append(stats,node('p',p.alt>0?'Above the geometric horizon · terrain and daylight may prevent viewing.':'Below the geometric horizon · not currently observable.'),node('p',o.note));
  if(!o.body)detail.append(node('p','Precessed J2000 catalogue position. Rounded coordinates; proper motion not applied. Suitable for exploration, not precision alignment.'));
  drawMap();
}
function drawMap(){
  const sky=$('sky');sky.querySelectorAll(':scope > :not(title):not(desc)').forEach(n=>n.remove());
  for(const r of [55.3,110.7,166])sky.append(svg('circle',{cx:200,cy:200,r,class:'dv-nav-grid'}));
  sky.append(svg('path',{d:'M34 200H366 M200 34V366',class:'dv-nav-grid'}));
  for(const [label,x,y] of [['N',196,20],['E',380,204],['S',196,390],['W',8,204],['Zenith',183,195]])sky.append(svg('text',{x,y},label));
  for(const o of catalogue){const p=positions.get(o.id);if(!p||p.alt<=0)continue;const {x,y}=project(p);const dot=svg('circle',{cx:x,cy:y,r:o.id===selected?5:2.7,class:'dv-nav-dot'});dot.append(svg('title',{},`${o.name}: ${degrees(p.alt)} altitude, ${degrees(p.az)} azimuth`));sky.append(dot);if(o.id===selected){sky.append(svg('circle',{cx:x,cy:y,r:10,class:'dv-nav-selected'}),svg('text',{x:Math.min(300,Math.max(40,x+14)),y:y-12,class:'dv-nav-target-label'},o.name));}}
}
$('launch').addEventListener('click',()=>{dialog.showModal();$('launch').setAttribute('aria-expanded','true');update();clearInterval(timer);timer=setInterval(()=>{if(!document.hidden)update();},10000);$('close').focus();});
$('close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{clearInterval(timer);$('launch').setAttribute('aria-expanded','false');$('launch').focus();});
$('expand').addEventListener('click',()=>{const expanded=dialog.classList.toggle('dv-nav-expanded');$('expand').setAttribute('aria-pressed',String(expanded));$('expand').setAttribute('aria-label',expanded?'Collapse panel':'Expand panel');});
$('night').addEventListener('click',()=>{const enabled=document.body.classList.toggle('dv-nav-night');$('night').setAttribute('aria-pressed',String(enabled));$('night').textContent=`☾ Red night mode: ${enabled?'on':'off'}`;});
$('search').addEventListener('input',()=>{if(positions.size)render();});
for(const button of document.querySelectorAll('[data-filter]'))button.addEventListener('click',()=>{filter=button.dataset.filter;for(const b of document.querySelectorAll('[data-filter]'))b.setAttribute('aria-pressed',String(b===button));if(positions.size)render();});
document.addEventListener('visibilitychange',()=>{if(dialog.open&&!document.hidden)update();});
window.addEventListener('pageshow',()=>{if(dialog.open)update();});
