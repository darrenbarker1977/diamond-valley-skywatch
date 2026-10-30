import {rankTargets} from './forecast-targets.js?v=mission-1';
import {validateKit,describe,viewingPlan} from './eyepieces.js?v=catalogue-1';
import {weatherAt,assessWeather,coordinateKey,savedWeather} from './mission-weather.js';
export function fittedChoice(kit,id,mm){
 try{const k=validateKit(kit),e=k.eyepieces.find(e=>e.enabled&&e.id===id);if(!e||!Number.isFinite(mm)||mm<e.min||mm>e.max)return null;return {...e,mm,power:k.focalLength/mm};}catch{return null;}
}
export function fitsEyepiece(object,choice){
 if(!choice||choice.power>220)return false;
 const p=choice.power;
 if(object.sizeArcmin>=50||['M31','M45','NGC869'].includes(object.id)||['Star cloud','Asterism'].includes(object.type))return p<=70;
 if(object.id==='Moon')return p<=180;
 if(object.type==='Planet')return p>=65&&p<=220;
 if(['Globular cluster','Planetary nebula','Double star'].includes(object.type))return p>=40&&p<=200;
 if(['Galaxy','Nebula','Supernova remnant','Open cluster'].includes(object.type))return p<=120;
 return p<=100;
}
export function nextWithEyepiece(A,site,time,choice,excluded=[]){
 if(!choice)return [];
 return rankTargets(A,site,[new Date(time)]).filter(item=>!excluded.includes(item.object.id)&&fitsEyepiece(item.object,choice));
}
export function createNextTarget({A,site,getKit,getSelected,getSnapshot,onSelect}){
 const $=id=>document.getElementById(id),key='dvsky:fitted-eyepiece:v1';let chosen={id:'',mm:NaN},seen=new Set(),context='',kitSignature='';
 try{const value=JSON.parse(localStorage.getItem(key)||'null');if(value&&typeof value.id==='string')chosen=value;}catch{}
 const set=(id,value)=>{if($(id).textContent!==value)$(id).textContent=value;};
 function save(){try{localStorage.setItem(key,JSON.stringify(chosen));}catch{}}
 function choice(){return fittedChoice(getKit(),chosen.id,chosen.mm);}
 function sync(){
  const kit=getKit(),signature=JSON.stringify(kit);
  if(signature!==kitSignature){kitSignature=signature;const options=[Object.assign(document.createElement('option'),{value:'',textContent:'Choose the eyepiece fitted now'})];
   for(const e of kit?.eyepieces||[])if(e.enabled)options.push(Object.assign(document.createElement('option'),{value:e.id,textContent:e.name}));$('fitted-eyepiece').replaceChildren(...options);
  }
  const e=kit?.eyepieces.find(e=>e.enabled&&e.id===chosen.id);
  if(!e){chosen={id:'',mm:NaN};$('fitted-eyepiece').value='';}else $('fitted-eyepiece').value=e.id;
  $('fitted-zoom-label').hidden=e?.kind!=='zoom';if(e?.kind==='zoom'){const input=$('fitted-zoom');input.min=e.min;input.max=e.max;if(document.activeElement!==input)input.value=Number.isFinite(chosen.mm)?chosen.mm:'';}
  const current=choice();set('fitted-summary',current?describe(current):'Choose your actual eyepiece. Recommendations elsewhere do not change this setting.');
  $('show-another').disabled=!current;
  const newContext=coordinateKey(site)+':'+new Date().toISOString().slice(0,10)+':'+chosen.id+':'+chosen.mm+':'+(kit?.focalLength||'');if(newContext!==context){context=newContext;seen.clear();set('another-status',current?'Ready to suggest another target at this power.':'Select a fitted eyepiece above to keep the next target at the same setting.');}
  return current;
 }
 $('fitted-eyepiece').addEventListener('change',()=>{const e=getKit()?.eyepieces.find(e=>e.id===$('fitted-eyepiece').value);chosen={id:e?.id||'',mm:e?.kind==='fixed'?e.min:e?.max};save();sync();});
 $('fitted-zoom').addEventListener('input',()=>{chosen.mm=$('fitted-zoom').value.trim()?Number($('fitted-zoom').value):NaN;save();sync();});
 $('show-another').addEventListener('click',()=>{
  const current=sync();if(!current)return;
  try{
   seen.add(getSelected());const now=new Date(),pool=nextWithEyepiece(A,site,now,current),available=pool.filter(item=>!seen.has(item.object.id));
   const next=available[0];
   if(!next){seen.clear();seen.add(getSelected());const alternative=rankTargets(A,site,[now]).find(item=>item.object.id!==getSelected()),plan=alternative?viewingPlan(alternative.object,getKit(),alternative.alt):null,hint=plan?.steps[1]||plan?.steps[0];set('another-status',pool.length?'You have browsed the other suitable targets at this power. Tap again to start a fresh round.':'No other suitable target meets the darkness, altitude and Sun-distance checks at this eyepiece setting right now. Try lower power, or use Sky & objects to plan a later time.'+(hint?' Another option: '+alternative.object.name+' with '+describe(hint.choice)+'. Change the fitted setting yourself if you switch.':''));return;}
   seen.add(next.object.id);onSelect(next.object.id);
   const plan=viewingPlan(next.object,getKit(),next.alt),recommended=plan.steps[1]||plan.steps[0],optional=recommended&&Math.abs(Math.log(recommended.choice.power/current.power))>.25?' Optional later: '+describe(recommended.choice)+', if you decide to change power.':'';
   const snapshot=getSnapshot()||savedWeather(site),row=snapshot?.coordinateKey===coordinateKey(site)?weatherAt(snapshot,now):null,outlook=assessWeather(row),az=['N','NE','E','SE','S','SW','W','NW'][Math.round(next.az/45)%8];
   set('another-status',`${next.object.name} · ${next.object.type} · ${az}, ${Math.round(next.alt)}° up. Keep ${describe(current)}. A useful starting power; field of view and seeing are not measured. ${outlook.known?outlook.reason+' Forecast '+Math.max(0,Math.floor((Date.now()-snapshot.stamp)/60000))+' min old'+(snapshot.offline?' · saved offline.':'.'):'Weather unconfirmed.'} Trees and cloud may hide it.${optional}`);
  }catch{set('another-status','Sky calculations unavailable. No target has been substituted.');}
 });
 sync();return {refresh:sync};
}
