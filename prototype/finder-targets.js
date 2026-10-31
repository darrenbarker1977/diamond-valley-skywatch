import {rankTargets} from './forecast-targets.js?v=mission-1';
import {matches} from './positions.js?v=catalogue-1';
export function createFinderTargets({A,site,getSelected,onSelect,getTime=()=>new Date(),isPractice=()=>false}){
 const $=id=>document.getElementById(id),panel=$('finder-target-picker'),results=$('finder-target-results');
 function refresh(){
  if(!panel.open)return;
  try{
   const all=rankTargets(A,site,[getTime()]),filtered=all.filter(item=>item.object.id!==getSelected()&&matches(item.object,$('finder-target-search').value)),shown=filtered.slice(0,10),ids=shown.map(item=>item.object.id).join('|');
   if(results.dataset.ids!==ids){results.replaceChildren(...shown.map(item=>{const button=document.createElement('button');button.type='button';button.dataset.target=item.object.id;button.addEventListener('click',()=>{panel.open=false;onSelect(item.object.id);});return button;}));results.dataset.ids=ids;}
   for(const [index,item]of shown.entries())results.children[index].textContent=`${item.object.name} · ${item.object.type} · ${Math.round(item.alt)}° up`;
   $('finder-picker-status').textContent=shown.length?`${shown.length} ${filtered.length>10?'of '+filtered.length+' ':''}matches above the horizon ${isPractice()?'at practice time':'now'}. Tap to keep your alignment and guide to that target; clouds and obstacles are unconfirmed.`:all.length?'No suitable match right now. Try another name, or browse Sky & objects to plan ahead.':'No targets pass the darkness, useful-height and Sun-distance checks right now. You can still browse and plan in Sky & objects.';
  }catch{results.replaceChildren();delete results.dataset.ids;$('finder-picker-status').textContent='Sky calculations are unavailable. No pointing direction will be substituted.';}
 }
 panel.addEventListener('toggle',refresh);$('finder-target-search').addEventListener('input',refresh);return {refresh};
}
