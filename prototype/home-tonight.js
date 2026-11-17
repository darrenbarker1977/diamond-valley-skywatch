import {localParts} from './observing-time.js?v=abt-1';

// Consume Forecast's own selected-location evening analysis; never issue a
// separate weather request or invent a second set of stargazing thresholds.
export function createHomeTonight({site,ensureForecast,onForecast}){
 const home=document.getElementById('home-view'),frame=document.getElementById('forecast-frame');
 const bar=document.createElement('section');bar.id='home-tonight';bar.className='home-tonight';bar.setAttribute('aria-label',"Tonight’s forecast");
 bar.innerHTML='<button type="button" id="home-tonight-open"><span class="tonight-heading"><span>TONIGHT AT A GLANCE</span><strong id="home-tonight-verdict">Getting tonight’s forecast…</strong></span><span class="tonight-body"><span id="home-tonight-conditions">Weather for your selected observing place</span><span id="home-tonight-window"></span><small id="home-tonight-source"></small></span><span class="tonight-arrow" aria-hidden="true">↗</span></button>';
 home.prepend(bar);bar.querySelector('button').addEventListener('click',onForecast);
 const $=id=>document.getElementById(id),set=(id,text)=>{if($(id).textContent!==text)$(id).textContent=text;};
 let message=null,key='',initialized=false;
 const siteKey=()=>site.latitude+':'+site.longitude;
 const number=n=>Math.round(n),range=(min,max,suffix)=>Number.isFinite(min)&&Number.isFinite(max)?(number(min)===number(max)?number(min):`${number(min)}–${number(max)}`)+suffix:null;
 function paint(){
  const brief=message?.tonight,now=Date.now(),stamp=message?.stamp,age=Number.isFinite(stamp)?Math.max(0,Math.floor((now-stamp)/60000)):null;
  let valid=false;try{valid=!!brief&&brief.date===localParts(now,brief.zone).date&&['GREEN LIGHT','MAYBE','SKIP','PENDING'].includes(brief.verdict)&&age!==null&&stamp<=now+300000&&now-stamp<7*86400000;}catch{}
  if(!valid){
   delete bar.dataset.date;
   const waiting=!message||message.status==='loading';bar.dataset.state=waiting?'loading':'unavailable';
   set('home-tonight-verdict',waiting?'Getting tonight’s forecast…':'Tonight’s weather unavailable');
   set('home-tonight-conditions',site.label+' · '+(waiting?'Checking the shared forecast':'No verified conditions for this local evening'));
   set('home-tonight-window','Tap to open Forecast'+(waiting?'':' and retry'));set('home-tonight-source','');return;
  }
  bar.dataset.date=brief.date;
  const saved=message.offline||message.cached||!!message.error||age>=30;
  bar.dataset.state=saved?'saved':brief.verdict==='GREEN LIGHT'?'green':brief.verdict==='SKIP'?'skip':brief.verdict==='MAYBE'?'maybe':'unavailable';
  set('home-tonight-verdict',(saved?'Saved outlook · ':'')+({'GREEN LIGHT':'Green light · promising window',MAYBE:'Maybe · check for clear breaks',SKIP:'Skip · poor telescope weather',PENDING:'Conditions not verified'}[brief.verdict]));
  const cloud=range(brief.cloudMin,brief.cloudMax,'%'),temp=range(brief.tempMin,brief.tempMax,'°C'),wind=Number.isFinite(brief.windMax)?`${number(brief.windMax)} km/h`:null;
  set('home-tonight-conditions',[cloud?'Cloud '+cloud:null,temp,wind?'Wind up to '+wind:null].filter(Boolean).join(' · ')||brief.condition||'Hourly details unavailable');
  set('home-tonight-window',brief.window+' · '+site.label);
  const source=!brief.detailsSource||brief.source===brief.detailsSource?brief.source:`${brief.source} outlook · ${brief.detailsSource} hourly details`;
  set('home-tonight-source',`${saved?'Saved forecast; may be stale · ':''}${source} · ${age} min old · Forecast details ↗`);
 }
 function refresh(){
  if(key!==siteKey()){key=siteKey();message=null;initialized=false;}
  paint();if(home.hidden||document.hidden)return;
  if(!initialized){initialized=true;ensureForecast();}else frame.contentWindow?.postMessage({type:'dvsky-weather-request'},location.origin);
 }
 window.addEventListener('message',event=>{
  const m=event.data;if(event.origin!==location.origin||event.source!==frame.contentWindow||m?.type!=='dvsky-weather-snapshot'||!Number.isFinite(m.latitude)||!Number.isFinite(m.longitude)||Math.abs(m.latitude-site.latitude)>.00001||Math.abs(m.longitude-site.longitude)>.00001)return;
  message=m;paint();
 });
 new MutationObserver(refresh).observe(home,{attributes:true,attributeFilter:['hidden']});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});window.addEventListener('pageshow',refresh);
 setInterval(refresh,60000);refresh();
 return {locationChanged:refresh};
}
