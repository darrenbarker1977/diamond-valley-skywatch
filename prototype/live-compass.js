import {OrientationSession} from './sensors.js';
import {skyAngles} from './alignment.js';

const node=(tag,cls,text)=>{const el=document.createElement(tag);el.className=cls;if(text!==undefined)el.textContent=text;return el;};
const svg=(tag,attrs,text)=>{const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,value);if(text)el.textContent=text;return el;};
export function compassVisual(){
 const figure=node('figure','object-visual live-phone-compass');figure.dataset.state='off';
 const dial=node('div','phone-compass-dial');dial.setAttribute('aria-hidden','true');
 const face=svg('svg',{viewBox:'0 0 200 200',class:'phone-compass-face'});
 face.append(svg('circle',{cx:100,cy:100,r:91,class:'compass-rim'}),svg('circle',{cx:100,cy:100,r:68,class:'compass-inner'}));
 for(let a=0;a<360;a+=5)face.append(svg('path',{d:`M100 ${a%30===0?12:17}V${a%30===0?24:21}`,transform:`rotate(${a} 100 100)`,class:'compass-tick'}));
 for(const [a,text] of [[0,'N'],[90,'E'],[180,'S'],[270,'W']])face.append(svg('text',{x:100,y:43,transform:`rotate(${a} 100 100)`,class:text==='N'?'compass-north':'compass-cardinal','text-anchor':'middle'},text));
 for(let a=0;a<360;a+=45){const tip=a%90===0?51:64;face.append(svg('path',{d:`M100 ${tip}L108 100L100 96Z`,transform:`rotate(${a} 100 100)`,class:'compass-rose-light'}),svg('path',{d:`M100 ${tip}L92 100L100 96Z`,transform:`rotate(${a} 100 100)`,class:'compass-rose-dark'}));}
 face.append(svg('circle',{cx:100,cy:100,r:5,class:'compass-hub'}));dial.append(face,node('span','phone-compass-pointer','▾'));
 const info=node('div','phone-compass-info');info.append(node('span','atlas-kicker','BEARINGS · LIVE PHONE COMPASS'),node('strong','phone-compass-heading','—'),node('span','phone-compass-reference','Physical top edge of your phone'));
 const toggle=node('button','phone-compass-toggle','Start compass');toggle.type='button';toggle.setAttribute('aria-pressed','false');
 const status=node('p','phone-compass-status','Sensors off. Tap Start compass to read your phone’s heading.');status.setAttribute('role','status');
 const tips=node('details','phone-compass-tips');tips.append(node('summary','','Compass tips & accuracy'),node('p','','For an easy reading, hold the phone flat and point its physical top edge (opposite the charging port) ahead. Away from magnetic cases and telescope metal, gently move it in a figure eight. This does not prove accuracy. North is the device’s reference; the browser does not specify magnetic versus true north or heading accuracy. This compass reads the phone here and now, even when planning another place or time. Telescope arrows still require checked sky alignment.'));
 figure.append(dial,info,toggle,status,tips,node('figcaption','','Live phone compass'));return figure;
}

export function createLiveCompass({env=window,root=document}={}){
 let faces=[],drawn=new WeakSet(),headerRequested=false;
 const header=root.getElementById('compass-launch'),panel=root.getElementById('phone-compass-dialog');
 if(header&&panel){
  const face=compassVisual();root.getElementById('header-compass-content').append(face);
  header.append(face.querySelector('.phone-compass-dial').cloneNode(true));
  header.addEventListener('click',()=>{headerRequested=true;if(!panel.open)panel.showModal();header.setAttribute('aria-expanded','true');});
  const close=()=>panel.close();root.getElementById('compass-close').addEventListener('click',close);
  panel.addEventListener('close',()=>{header.setAttribute('aria-expanded','false');sync();header.focus({preventScroll:true});});
  root.getElementById('compass-night').addEventListener('click',()=>{root.getElementById('night').click();night();});
  function night(){root.getElementById('compass-night').setAttribute('aria-pressed',String(root.body.classList.contains('dv-nav-night')));}
  new MutationObserver(night).observe(root.body,{attributes:true,attributeFilter:['class']});night();
  root.addEventListener('keydown',event=>{if(panel.open&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}},true);
 }
 const session=new OrientationSession(env,paint);
 const visible=el=>el.checkVisibility?el.checkVisibility({visibilityProperty:true}):!!el.getClientRects().length;
 function paint(){
  const latest=session.history.at(-1),fresh=session.active&&session.status==='receiving'&&latest&&session.now()-latest.time<=700;
  let heading=null,message=session.message,state=session.status;
  if(fresh){const pose=skyAngles(latest.vector);if(Math.abs(pose.alt)>80){message='Lower the phone’s top edge: near vertical, a compass bearing is undefined.';state='tilted';}
   else{heading=pose.az;state='live';message='Live device-north heading · accuracy unknown. Keep away from magnets and telescope metal.';}}
  else if(session.active&&latest){state='waiting';message='Waiting for a fresh reading · heading hidden.';}
  if(state==='off')message='Sensors off. Tap Start compass to read your phone’s heading.';
  const busy=session.active||session.status==='permission';
  if(header){
   const label=heading===null?'Open live phone compass':`Phone compass: ${Math.round(heading)%360} degrees · open compass`;
   header.dataset.state=state;header.setAttribute('aria-label',label);header.title=label;
   header.querySelector('svg').style.transform=heading===null?'':'rotate('+(-heading)+'deg)';
  }
  for(const figure of faces){
   figure.dataset.state=state;figure.querySelector('.phone-compass-face').style.transform=heading===null?'':'rotate('+(-heading)+'deg)';
   const set=(selector,text)=>{const el=figure.querySelector(selector);if(el.textContent!==text)el.textContent=text;};
   set('.phone-compass-heading',heading===null?'—':`${Math.round(heading)%360}° ${['N','NE','E','SE','S','SW','W','NW'][Math.round(heading/45)%8]}`);
   set('.phone-compass-status',message);set('.phone-compass-toggle',busy?'Stop compass':'Start compass');figure.querySelector('button').setAttribute('aria-pressed',String(busy));drawn.add(figure);
  }
 }
 function stop(){headerRequested=false;session.stop();paint();}
 function sync(){
  faces=[...root.querySelectorAll('.live-phone-compass')];
  if(session.active||session.status==='permission'){if(env.document.hidden||!(faces.some(visible)||(headerRequested&&header&&visible(header)))){stop();return;}}
  if(faces.some(figure=>!drawn.has(figure)))paint();
 }
 root.addEventListener('click',event=>{if(!event.target.closest('.phone-compass-toggle'))return;if(session.active||session.status==='permission')stop();else{if(panel?.contains(event.target))headerRequested=true;session.start('mounted');}});
 // Watch only placement/visibility changes, not our own heading text updates.
 const observer=new MutationObserver(changes=>{if(changes.some(change=>change.type==='attributes'||[...change.addedNodes,...change.removedNodes].some(el=>el.nodeType===1&&(el.matches('.live-phone-compass')||el.querySelector('.live-phone-compass')))))sync();});
 observer.observe(root.documentElement||root,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','open','class']});
 env.document.addEventListener('visibilitychange',()=>{if(env.document.hidden)stop();});env.addEventListener('pagehide',stop);sync();
 return {stop};
}
