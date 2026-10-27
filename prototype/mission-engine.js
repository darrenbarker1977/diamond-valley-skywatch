import {rankTargets,catalogue} from './forecast-targets.js?v=mission-1';
import {positionFor} from './sky-position.js?v=catalogue-1';
import {weatherAt,assessWeather,coordinateKey} from './mission-weather.js';
import {localInstant} from './observing-time.js';
const easy=new Set(['Moon','Jupiter','Saturn','Venus','Albireo','M42','M45','NGC104','NGC5139','Sirius','Vega','Canopus','Achernar']);
const minute=60000;
export function missionStopCount(minutes){
 if(!Number.isInteger(minutes)||minutes<1||minutes>719)throw Error('Choose a duration of at least one minute, up to 11 hours 59 minutes.');
 return Math.max(1,Math.min(5,Math.ceil(minutes/25)));
}
function localWeather(snapshot,site,time){return snapshot?.coordinateKey===coordinateKey(site)?weatherAt(snapshot,time):null;}
function weatherPenalty(row){
 if(!Number.isFinite(row?.cloud_cover))return 12;
 return row.cloud_cover*.4+Math.max(0,(row.precipitation_probability||0)-30)*.3+(row.snowfall>.09?20:0)+Math.max(0,(row.wind_gusts_10m||0)-30)*.5;
}
export function targetAssessment(A,site,snapshot,id,time){
 const object=catalogue.find(o=>o.id===id);if(!object)return {usable:false,reason:'Choose a catalogue object.'};
 const position=positionFor(A,object,new Date(time),site),weather=localWeather(snapshot,site,time),outlook=assessWeather(weather);
 const candidate=rankTargets(A,site,[new Date(time)]).find(item=>item.object.id===id);
 return {usable:!!candidate,position,weather,outlook,reason:candidate?outlook.reason:position.alt<=0?'This target is now below your horizon.':position.alt<20?'This target is now too low for a beginner tour.':'Daylight, Moon interference or Sun-separation checks make another target a better choice.'};
}
export function buildMission(A,{site,snapshot,night,anchor,zone,live=true,minutes=90,excluded=[],endAt=null,maxStops=5}){
 if(!A)throw Error('The astronomy library did not load.');
 const budget=missionStopCount(minutes);
 if(maxStops<=0)return {steps:[],covered:false,reason:'Your mission route is complete. End this session to build another route.'};
 const from=live?Math.max(new Date(anchor).getTime(),localInstant(night,960,zone).getTime()):new Date(anchor).getTime();
 const nightEnd=localInstant(night,1800,zone).getTime(),deadline=endAt===null?Infinity:new Date(endAt).getTime();
 if(!Number.isFinite(from)||!Number.isFinite(nightEnd)||Number.isNaN(deadline))throw Error('Choose a valid observing date and time.');
 if(from>=deadline)return {steps:[],covered:false,reason:'Your chosen session time has finished. End this session to build a new mission.'};
 if(from>=nightEnd)return {steps:[],covered:false,reason:'This evening’s mission window has ended. Choose a start before 6 AM or select another night.'};
 // In live mode a not-yet-started tour may begin after dusk. Once started its
 // real deadline remains fixed. Planned sessions retain their selected window.
 const scanEnd=Math.min(nightEnd,deadline,live?Infinity:from+minutes*minute);
 let start=from;
 while(start<scanEnd&&positionFor(A,{body:'Sun'},new Date(start),site).alt>-6)start+=5*minute;
 if(start>=scanEnd)return {steps:[],covered:false,reason:'This window is too bright for a night tour. Choose a later start in Plan a night. Weather is not blocking the route.'};
 const end=Math.min(scanEnd,start+minutes*minute),count=Math.min(maxStops,budget),used=new Set(excluded),types=new Map(),steps=[];
 for(let i=0;i<count;i++){
  const slotStart=start+i*(end-start)/count,slotEnd=start+(i+1)*(end-start)/count;
  // Compare the beginning, middle and end of each stop's time slot. Weather
  // influences preference, never removes astronomical candidates or fills gaps.
  const times=[slotStart,(slotStart+slotEnd)/2,Math.max(slotStart,slotEnd-Math.min(minute,(slotEnd-slotStart)/4))];
  let choice=null,best=-Infinity;
  for(const t of [...new Set(times)]){
   const date=new Date(t),weather=localWeather(snapshot,site,date);
   for(const item of rankTargets(A,site,[date])){
    if(used.has(item.object.id)||(types.get(item.object.type)||0)>=(item.object.type==='Star'?1:2))continue;
    const score=item.score+(i===0&&easy.has(item.object.id)?16:0)-weatherPenalty(weather)-(t-slotStart)/minute*.08;
    if(score>best){best=score;choice={...item,weather};}
   }
  }
  if(!choice)continue;
  used.add(choice.object.id);types.set(choice.object.type,(types.get(choice.object.type)||0)+1);steps.push(choice);
 }
 const known=steps.filter(s=>assessWeather(s.weather).known),poor=known.filter(s=>!assessWeather(s.weather).usable),covered=known.length>0;
 const weatherNotice=!steps.length?'':known.length<steps.length?'Weather is unavailable for some or all stops. This is a sky-based tour; visibility is unconfirmed.':poor.length?'Weather caution: cloud, precipitation or wind may prevent observing. The tour remains available for planning.':'Forecast conditions help choose stop times. Check the actual sky before observing.';
 return {steps,covered,weatherNotice,weatherCaution:poor.length>0||known.length<steps.length,start:new Date(start),end:new Date(end),delayed:start>from,reason:steps.length?(start>from?'Your tour starts after dusk. ':'')+'A short route through well-placed beginner targets. Weather advises this tour; it does not hide it.':'No suitable beginner targets meet the darkness, altitude and Sun-distance checks in this window. Try a later time or another night.'};
}
