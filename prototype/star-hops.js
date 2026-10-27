import {hopRoute,separation,bearing} from './field-math.js';
export function createStarHops({catalogue,onRoute}){
 const view=document.createElement('details');view.id='hop-guide';view.className='hop-guide';view.innerHTML='<summary>Guide me from a bright star</summary><p class="dv-nav-fine">A chart route, not a measured pointing reading. Identify each star yourself. Clouds or local obstacles may hide it.</p><ol id="hop-steps"></ol><p id="hop-status" role="status"></p><button type="button" id="hop-map">Show this route on the sky</button><button type="button" id="hop-haptics" aria-pressed="false">Vibration cues: off</button><p id="hop-haptic-status" class="dv-nav-fine">Optional vibration uses checked alignment only. A cue means check the finder, not that the object is centred.</p>';
 document.getElementById('finder-kit')?.before(view);
 if(!view.isConnected)document.querySelector('.finder-kit').before(view);
 const $=id=>view.querySelector('#'+id);let route=[],lastKey='',target='',haptics=false,lastPulse=0,previous=null;
 $('hop-map').addEventListener('click',()=>{if(route.length)onRoute(route);});
 $('hop-haptics').addEventListener('click',()=>{if(typeof navigator.vibrate!=='function'){$('hop-haptic-status').textContent='Vibration is not available in this browser. Visual directions remain available.';return;}haptics=!haptics;$('hop-haptics').setAttribute('aria-pressed',String(haptics));$('hop-haptics').textContent='Vibration cues: '+(haptics?'on':'off');if(!haptics)navigator.vibrate(0);previous=null;});
 return {
  update(positions,id){target=id;route=hopRoute(catalogue,positions,id);const key=route.join('|');$('hop-map').disabled=route.length<2;
   if(key!==lastKey){$('hop-steps').replaceChildren(...route.map((id,index)=>{const li=document.createElement('li');li.dataset.id=id;li.append(document.createElement('strong'),document.createElement('span'));li.firstChild.textContent=(index===0?'Start: ':index===route.length-1?'Destination: ':'Then: ')+(catalogue.find(o=>o.id===id)?.name||id);return li;}));lastKey=key;}
   for(const [index,li] of [...$('hop-steps').children].entries()){const p=positions.get(li.dataset.id),distance=index?separation(positions.get(route[index-1]),p):null;li.lastChild.textContent=`${bearing(p.az)} · ${Math.round(p.alt)}° up${distance===null?'':' · '+distance.toFixed(1)+'° from the previous marker'}`;}
   $('hop-status').textContent=route.length?'Follow the named markers, then search the final area at low power. There is no automatic confirmation of arrival.':positions.get('Sun')?.alt>-6?'Return after dusk for a beginner star-hop route.':positions.get(id)?.alt<10?'Target is below the usable chart horizon.':'No short, suitable bright-star route is available. Use the target direction and checked alignment; do not guess a faint starter.';
  },
  pose(state){if(!haptics)return;if(!state.ready||state.quality!=='checked'||target==='Sun'||!Number.isFinite(state.error)){previous=null;navigator.vibrate?.(0);return;}const error=state.error,now=performance.now();if(previous!==null&&error<previous&&[20,10,5,3].some(t=>previous>t&&error<=t)&&now-lastPulse>3000){navigator.vibrate(error<=3?[35,60,35]:35);lastPulse=now;}previous=error;}
 };
}
