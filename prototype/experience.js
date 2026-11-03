export const EXPERIENCE_KEY='dvsky:experience:v1';
export const EXPERIENCES=Object.freeze({
 browse:{label:'Browse & plan',start:'Open the sky & plan',help:'Forecasts, sky maps, targets and tours. No sensors or alignment needed.'},
 handheld:{label:'Handheld',start:'Set up handheld pointing',help:'Point the rear camera toward the sky. Enable sensors and align on one identified object for guidance.'},
 mounted:{label:'Telescope',start:'Set up telescope guidance',help:'Secure the phone along your telescope tube, confirm placement and align on one identified object.'}
});
export function savedExperience(storage){
 try{const saved=storage?.getItem(EXPERIENCE_KEY);if(Object.hasOwn(EXPERIENCES,saved))return saved;
 const previous=storage?.getItem('dvsky:ready-purpose:v1');if(Object.hasOwn(EXPERIENCES,previous))return previous;}catch{}
 return 'browse';
}
export function deviceTools(env){
 return [
  ['Compass & pointing',!env.isSecureContext?'Needs HTTPS. Browsing and planning remain available.':env.DeviceOrientationEvent?'This browser offers motion access, but working sensors, permission and fresh absolute compass readings are still required. Computers often supply no heading.':'Motion sensors are unavailable in this browser. Use north on the sky map; open this same site on a compatible phone for a physical compass.'],
  ['Location',env.navigator.geolocation?'Use precise location with permission, or search for any place. No location request is made by choosing a mode.':'Search for a place or enter coordinates; precise location is unavailable in this browser.'],
  ['Camera',env.isSecureContext&&env.navigator.mediaDevices?.getUserMedia?'An optional camera view can be requested during alignment. Permission is required.':'Camera access is unavailable here. It is optional; maps, forecasts and planning still work.'],
  ['Vibration',typeof env.navigator.vibrate==='function'?'This browser offers vibration; the device or browser may still block pulses. Direction arrows remain available after alignment.':'Vibration is unavailable in this browser. Use the visual guidance arrows after alignment on a compatible phone.']
 ];
}
export function createExperience({env=window,root=document,onChange=()=>{}}={}){
 const $=id=>root.getElementById(id);let storage;try{storage=env.localStorage;}catch{}
 let mode=savedExperience(storage);
 function paint(){
  const choice=EXPERIENCES[mode];root.body.dataset.experience=mode;
  for(const button of root.querySelectorAll('button[data-experience]'))button.setAttribute('aria-pressed',String(button.dataset.experience===mode));
  $('experience-mode').value=mode;$('experience-home-note').textContent=choice.help;$('experience-note').textContent=mode==='browse'?'Explore the map manually and plan for any location. Live compass headings need a compatible device; pointing setup is optional.':choice.help+' Changing phone placement requires fresh alignment.';
  const start=root.querySelector('.home-find-target');start.dataset.openSection=mode==='browse'?'objects':'walkthrough';start.querySelector('strong').textContent=choice.start;start.querySelector('small').textContent=mode==='browse'?'Any computer or phone · explore without setup':mode==='handheld'?'Your phone in hand · guided setup to the live sky':'Phone strapped to the scope · guided setup to the live sky';
  $('experience-pointing-options').hidden=mode!=='browse';
 }
 function set(value,{source='picker'}={}){
  if(!Object.hasOwn(EXPERIENCES,value)||value===mode)return;
  const previous=mode;mode=value;try{storage?.setItem(EXPERIENCE_KEY,mode);}catch{}
  paint();onChange({mode,previous,source});
 }
 for(const button of root.querySelectorAll('button[data-experience]'))button.addEventListener('click',()=>set(button.dataset.experience));
 $('experience-mode').addEventListener('change',()=>set($('experience-mode').value));
 $('pointing-mode').addEventListener('change',()=>set($('pointing-mode').value,{source:'placement'}));
 for(const button of root.querySelectorAll('[data-nav-section=walkthrough],[data-nav-section=pointing]'))button.addEventListener('click',()=>{if(mode==='browse')set($('pointing-mode').value,{source:'setup'});});
 const tools=$('experience-device-tools');for(const [name,description]of deviceTools(env)){const item=root.createElement('li'),title=root.createElement('strong'),text=root.createElement('span');title.textContent=name;text.textContent=description;item.append(title,text);tools.append(item);}
 const compassHelp=root.createElement('p');compassHelp.className='dv-nav-fine';compassHelp.textContent='On a computer without heading sensors, use the north labels on the sky map. Motion support alone does not prove that live compass readings are available.';$('header-compass-content').before(compassHelp);
 const publicURL=new URL('../',import.meta.url).href;$('public-site-link').value=publicURL;
 $('copy-site-link').addEventListener('click',async()=>{try{if(!env.navigator.clipboard?.writeText)throw Error();await env.navigator.clipboard.writeText(publicURL);$('share-site-status').textContent='Link copied. Anyone can open it without an account or installation.';}catch{$('public-site-link').focus();$('public-site-link').select();$('share-site-status').textContent='Copy the selected link. Anyone can open it without an account or installation.';}});
 paint();return {set,get mode(){return mode;}};
}
