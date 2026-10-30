import {hopRoute,separation,bearing} from './field-math.js';
export function createStarHops({catalogue,onRoute,onVibration}){
 const view=document.createElement('details');view.id='hop-guide';view.className='hop-guide';view.innerHTML='<summary>Guide me from a bright star</summary><p class="dv-nav-fine">A chart route, not a measured pointing reading. Identify each star yourself. Clouds or local obstacles may hide it.</p><ol id="hop-steps"></ol><p id="hop-status" role="status"></p><button type="button" id="hop-map">Show this route on the sky</button><button type="button" id="hop-haptics">Vibration settings</button><p id="hop-haptic-status" class="dv-nav-fine">Use the shared Vibration guidance toggle above for handheld or mounted pointing after one-target alignment. Pulses guide to the selected destination, not automatic arrivals at the chart markers.</p>';
 document.getElementById('finder-kit')?.before(view);
 if(!view.isConnected)document.querySelector('.finder-kit').before(view);
 const $=id=>view.querySelector('#'+id);let route=[],lastKey='';
 $('hop-map').addEventListener('click',()=>{if(route.length)onRoute(route);});
 $('hop-haptics').addEventListener('click',onVibration);
 return {
  update(positions,id){route=hopRoute(catalogue,positions,id);const key=route.join('|');$('hop-map').disabled=route.length<2;
   if(key!==lastKey){$('hop-steps').replaceChildren(...route.map((id,index)=>{const li=document.createElement('li');li.dataset.id=id;li.append(document.createElement('strong'),document.createElement('span'));li.firstChild.textContent=(index===0?'Start: ':index===route.length-1?'Destination: ':'Then: ')+(catalogue.find(o=>o.id===id)?.name||id);return li;}));lastKey=key;}
   for(const [index,li] of [...$('hop-steps').children].entries()){const p=positions.get(li.dataset.id),distance=index?separation(positions.get(route[index-1]),p):null;li.lastChild.textContent=`${bearing(p.az)} · ${Math.round(p.alt)}° up${distance===null?'':' · '+distance.toFixed(1)+'° from the previous marker'}`;}
   $('hop-status').textContent=route.length?'Follow the named markers, then search the final area at low power. There is no automatic confirmation of arrival.':positions.get('Sun')?.alt>-6?'Return after dusk for a beginner star-hop route.':positions.get(id)?.alt<10?'Target is below the usable chart horizon.':'No short, suitable bright-star route is available. Use the target direction and aligned guidance; do not guess a faint starter.';
  },
 };
}
