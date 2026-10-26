export const DEFAULT_SITE=Object.freeze({latitude:50.68,longitude:-114.25,height:0,source:'default',accuracy:null,clockTimezone:'America/Edmonton',label:'Diamond Valley',physicalConfirmed:false});
export const site={...DEFAULT_SITE};
export function setSite(value){
 if(!value||![value.latitude,value.longitude,value.height].every(Number.isFinite)||Math.abs(value.latitude)>90||Math.abs(value.longitude)>180||value.height< -500||value.height>10000)throw Error('The location provider returned invalid coordinates.');
 Object.assign(site,value);
}
const LOCATION_KEY='dvsky:observing-location:v1';
try {const saved=JSON.parse(globalThis.localStorage?.getItem(LOCATION_KEY)||'null');if(saved&&typeof saved.label==='string'&&saved.label.length<=120&&typeof saved.clockTimezone==='string'){new Intl.DateTimeFormat('en',{timeZone:saved.clockTimezone});setSite({...saved,source:saved.source==='default'?'default':'saved',physicalConfirmed:false,accuracy:Number.isFinite(saved.accuracy)?saved.accuracy:null});}}catch{}
function saveSite(){try{localStorage.setItem(LOCATION_KEY,JSON.stringify({...site,physicalConfirmed:false,savedAt:Date.now()}));return true;}catch{return false;}}
export function coordinates(){return `${Math.abs(site.latitude).toFixed(5)}° ${site.latitude<0?'S':'N'}, ${Math.abs(site.longitude).toFixed(5)}° ${site.longitude<0?'W':'E'}`;}
export function forecastURL(base){const url=new URL(base,document.baseURI);url.searchParams.set('v','location-1');if(site.source!=='default'){url.searchParams.set('lat',site.latitude);url.searchParams.set('lon',site.longitude);url.searchParams.set('name',site.label);}return url.href;}
export function createLocation(onChange){
 const $=id=>document.getElementById(id);let generation=0;
 function display(){
  $('location-display').textContent=site.source==='default'?'Diamond Valley, Alberta · default location':`${site.label} · ${coordinates()}${site.source==='geolocation'?` · reported accuracy ±${Math.round(site.accuracy)} m`:' · selected viewing site'}`;
  document.title='Barker After Dark · '+site.label;document.querySelector('.dv-app-brand').firstChild.textContent='✧ Barker After Dark ';document.querySelector('.dv-app-brand small').textContent=site.label+' · Forecast & Sky Navigator';
  $('location-present-label').hidden=site.source==='geolocation';$('location-present').checked=site.physicalConfirmed;
  if($('active-site-caption'))$('active-site-caption').textContent=site.label+' · weather, sky navigation and your telescope kit.';
  $('observer-name').textContent=site.source==='default'?'DIAMOND VALLEY · ALBERTA':site.label.toUpperCase();
  document.querySelector('.dv-nav-location').textContent=`${coordinates()} · observer height ${site.height} m${site.height===0?' (assumed)':''}. Clock: ${site.clockTimezone}.`;
  $('site-warning').textContent='Keep the phone at the observing location shown above. These are coarse phone estimates, not telescope encoders. If the phone slips or directions look wrong, stop and align again.';
 }
 function finish(message){$('use-location').disabled=false;$('location-status').textContent=message;}
 $('use-location').addEventListener('click',()=>{
  const request=++generation;
  if(!isSecureContext||!navigator.geolocation){finish('Location access needs HTTPS and browser geolocation support. The previous location is unchanged.');return;}
  $('use-location').disabled=true;$('location-status').textContent='Requesting a high-accuracy fix. Allow location access in your browser if asked…';
  try{navigator.geolocation.getCurrentPosition(position=>{
   if(request!==generation)return;
   try {
    const c=position.coords;if(!Number.isFinite(c.accuracy)||c.accuracy<0)throw Error('No accuracy estimate was returned');
    setSite({latitude:c.latitude,longitude:c.longitude,height:Number.isFinite(c.altitude)&&c.altitude>=-500&&c.altitude<=10000?c.altitude:0,accuracy:c.accuracy,source:'geolocation',label:'My location',physicalConfirmed:true,clockTimezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'});
    const stored=saveSite();display();onChange();finish(`${stored?'Saved on this browser. ': 'Browser storage unavailable; location is for this visit only. '}Location updated. Reported accuracy ±${Math.round(c.accuracy)} m. Tap again after moving; this is not live tracking.`);
   }catch(e){finish(e.message+' The previous location is unchanged.');}
  },error=>{if(request!==generation)return;finish(({1:'Location permission was denied. Allow it in browser site settings and try again.',2:'The device could not determine a location. Try outdoors or enable device location services.',3:'The location request timed out. Try again with a clearer view of the sky.'}[error.code]||'Location could not be obtained.')+' The previous location is unchanged.');},{enableHighAccuracy:true,maximumAge:0,timeout:15000});}catch(e){finish('Location access failed: '+e.message+'. The previous location is unchanged.');}
 });

 function choose(value){generation++;setSite(value);const stored=saveSite();display();onChange();finish((stored?'Saved on this browser. ':'Browser storage unavailable; this is for this visit only. ')+'Viewing '+site.label+'. Forecast and sky positions now use this site. Phone guidance requires being physically there.');$('place-results').replaceChildren();}
 $('place-search').addEventListener('submit',async event=>{
  event.preventDefault();const query=$('place-query').value.trim();if(query.length<2){$('place-status').textContent='Enter at least two characters, or use coordinates.';return;}
  const request=++generation;$('use-location').disabled=false;$('place-status').textContent='Searching for places…';$('place-results').replaceChildren();
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{
   const url=new URL('https://geocoding-api.open-meteo.com/v1/search');url.search=new URLSearchParams({name:query.split(',')[0].trim(),count:'10',language:'en',format:'json'});
   const response=await fetch(url,{signal:controller.signal});if(!response.ok)throw Error('Place search HTTP '+response.status);
   const data=await response.json();if(request!==generation)return;
   const found=(data.results||[]).filter(p=>Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&Math.abs(p.latitude)<=90&&Math.abs(p.longitude)<=180&&typeof p.name==='string');
   $('place-status').textContent=found.length?'Choose the matching place. These coordinates identify its centre, not your current physical position.':'No matching places. Try a nearby town or enter latitude and longitude below.';
   for(const place of found){const button=document.createElement('button');button.type='button';const label=[place.name,place.admin1,place.country].filter(Boolean).join(', ').slice(0,120);button.textContent=label;button.addEventListener('click',()=>{try{let zone='UTC';try{new Intl.DateTimeFormat('en',{timeZone:place.timezone});if(place.timezone)zone=place.timezone;}catch{}choose({latitude:place.latitude,longitude:place.longitude,height:Number.isFinite(place.elevation)&&place.elevation>=-500&&place.elevation<=10000?place.elevation:0,source:'place',label,accuracy:null,physicalConfirmed:false,clockTimezone:zone});}catch(e){$('place-status').textContent=e.message;}});$('place-results').append(button);}
  }catch(e){if(request===generation)$('place-status').textContent='Place search failed ('+(e.name==='AbortError'?'timed out':e.message)+'). The previous site is unchanged. You can enter coordinates instead.';}finally{clearTimeout(timer);}
 });
 $('coordinate-form').addEventListener('submit',event=>{event.preventDefault();try{const latitude=Number($('site-latitude').value),longitude=Number($('site-longitude').value);if(!$('site-latitude').value.trim()||!$('site-longitude').value.trim())throw Error('Enter both latitude and longitude.');choose({latitude,longitude,height:0,source:'coordinates',label:$('coordinate-name').value.trim().slice(0,100)||'Custom location',accuracy:null,physicalConfirmed:false,clockTimezone:'UTC'});$('coordinate-status').textContent='Viewing this coordinate location. Weather resolves its local timezone; the sky clock uses UTC until then.';}catch(e){$('coordinate-status').textContent=e.message;}});
 $('location-present').addEventListener('change',()=>{site.physicalConfirmed=$('location-present').checked;window.dispatchEvent(new Event('dvsky-presence-changed'));});

 $('reset-location').addEventListener('click',()=>{generation++;setSite(DEFAULT_SITE);saveSite();display();onChange();finish('Using the default Diamond Valley location. No location tracking is active.');});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&$('use-location').disabled){generation++;finish('Location request canceled when the page was hidden. The previous location is unchanged.');}});
 window.addEventListener('message',event=>{
  const frame=$('forecast-frame'),m=event.data;
  if(event.origin!==location.origin||event.source!==frame.contentWindow||m?.type!=='dvsky-weather-zone'||m.latitude!==site.latitude||m.longitude!==site.longitude)return;
  try {new Intl.DateTimeFormat('en',{timeZone:m.timezone});site.clockTimezone=m.timezone;saveSite();display();}catch{}
 });
 if(site.source==='saved')finish('Restored your last selected location on this browser. It is not a new GPS fix. You can view its sky and last downloaded forecast offline.');
 display();return {display};
}
