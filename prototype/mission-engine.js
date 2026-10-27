import {rankTargets,catalogue} from './forecast-targets.js?v=mission-1';
import {positionFor} from './sky-position.js?v=catalogue-1';
import {weatherAt,assessWeather} from './mission-weather.js';
import {localInstant} from './observing-time.js';
const easy=new Set(['Moon','Jupiter','Saturn','Venus','Albireo','M42','M45','NGC104','NGC5139','Sirius','Vega','Canopus','Achernar']);
const step=15*60000;
export function targetAssessment(A,site,snapshot,id,time){
 const object=catalogue.find(o=>o.id===id);if(!object)return {usable:false,reason:'Choose a catalogue object.'};
 const position=positionFor(A,object,new Date(time),site),weather=weatherAt(snapshot,time),outlook=assessWeather(weather);
 if(!outlook.usable)return {usable:false,position,weather,reason:outlook.reason};
 const candidate=rankTargets(A,site,[new Date(time)]).find(item=>item.object.id===id);
 return {usable:!!candidate,position,weather,reason:candidate?outlook.reason:position.alt<=0?'This target is now below your horizon.':position.alt<20?'This target is now too low for a beginner mission.':'Daylight, Moon interference or Sun-separation checks make another target a better choice.'};
}
export function buildMission(A,{site,snapshot,night,anchor,zone,live=true,minutes=90,excluded=[],endAt=null,maxStops=5}){
 if(!A)throw Error('The astronomy library did not load.');
 if(!snapshot)return {steps:[],reason:'Download this location’s forecast to build a weather-based mission.',covered:false};
 if(snapshot.coordinateKey!==`${site.latitude.toFixed(5)}:${site.longitude.toFixed(5)}`)return {steps:[],reason:'Waiting for the selected location’s forecast.',covered:false};
 if(![45,60,90,120,180].includes(minutes))throw Error('Choose a session length from the menu.');
 if(maxStops<=0)return {steps:[],covered:true,reason:'Your mission route is complete. End this session to build another route.'};
 const from=live?Math.max(new Date(anchor).getTime(),localInstant(night,960,zone).getTime()):new Date(anchor).getTime();
 const nightEnd=localInstant(night,1800,zone).getTime(),deadline=endAt===null?Infinity:new Date(endAt).getTime(),scanEnd=Math.min(live?nightEnd:Math.min(nightEnd,from+minutes*60000),deadline);
 if(from>=deadline)return {steps:[],covered:!!weatherAt(snapshot,from),reason:'Your chosen session time has finished. End this session to build a new mission.'};
 if(from>=nightEnd)return {steps:[],covered:!!weatherAt(snapshot,from),reason:'This evening’s mission window has ended. Choose a start before 6 AM or select another night.'};
 const times=[];let covered=false,weatherBlocked=false;
 for(let t=Math.ceil(from/step)*step;t<scanEnd;t+=step){
  const weather=weatherAt(snapshot,t),outlook=assessWeather(weather);if(outlook.known)covered=true;
  if(!outlook.usable){if(outlook.known)weatherBlocked=true;continue;}
  const sun=positionFor(A,{body:'Sun'},new Date(t),site);if(sun.alt>-6)continue;
  times.push({date:new Date(t),weather});
 }
 if(!times.length)return {steps:[],covered,reason:!covered?'No downloaded hourly forecast covers this night or time. Sky planning still works.':weatherBlocked?'No dark, suitable weather window remains in this session. Check actual skies and try another time.':'This window is too bright for a beginner night mission. Choose a later time.'};
 const start=times[0].date.getTime(),end=Math.min(scanEnd,live?start+minutes*60000:scanEnd);
 const samples=times.filter(t=>t.date.getTime()<end).map(t=>({...t,items:rankTargets(A,site,[t.date])}));
 const used=new Set(excluded),types=new Map(),count=Math.min(maxStops,Math.max(3,Math.min(5,Math.round(minutes/25)))),steps=[];
 let previousTime=start-step;
 for(let i=0;i<count;i++){
  const desired=start+i*(end-start)/count;
  const ordered=samples.filter(sample=>sample.date.getTime()>previousTime).sort((a,b)=>Math.abs(a.date.getTime()-desired)-Math.abs(b.date.getTime()-desired));
  let choice=null;
  for(const sample of ordered){
   const candidates=sample.items.filter(item=>!used.has(item.object.id)&&(types.get(item.object.type)||0)<(item.object.type==='Star'?1:2));
   candidates.sort((a,b)=>(b.score+(i===0&&easy.has(b.object.id)?16:0))-(a.score+(i===0&&easy.has(a.object.id)?16:0)));
   if(candidates.length){choice={...candidates[0],weather:sample.weather};break;}
  }
  if(!choice)break;
  used.add(choice.object.id);types.set(choice.object.type,(types.get(choice.object.type)||0)+1);steps.push(choice);previousTime=choice.date.getTime();
 }
 return {steps,covered,start:new Date(start),end:new Date(end),reason:steps.length?'A short route through the best-placed beginner targets in this forecast window.':'No suitable beginner targets meet the sky checks in this window. Try another time.'};
}
