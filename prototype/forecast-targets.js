import {catalogue} from './catalogue.js?v=catalogue-1';
import {positionFor} from './sky-position.js?v=catalogue-1';
export {catalogue};
export {readKit,KIT_KEY} from './kit-store.js?v=catalogue-1';
export {viewingPlan,describe} from './eyepieces.js?v=catalogue-1';
const priorities={'Moon':95,'Planet':85,'Double star':75,'Globular cluster':76,'Open cluster':75,'Planetary nebula':66,'Nebula':69,'Supernova remnant':48,'Galaxy':64,'Star cloud':65,'Asterism':61,'Star':30};
const highlights=new Set(['M42','M45','M13','M31','M57','NGC104','NGC5139','NGC4755','IC2602','NGC3372']);
function separation(a,b){const r=Math.PI/180;return Math.acos(Math.max(-1,Math.min(1,Math.sin(a.alt*r)*Math.sin(b.alt*r)+Math.cos(a.alt*r)*Math.cos(b.alt*r)*Math.cos((a.az-b.az)*r))))/r;}
export function shortlist(A,site,times,limit=6){
 if(!A)throw Error('The astronomy library did not load');
 if(!times.length)return [];
 const samples=times.map(time=>{
  const date=new Date(time),sun=positionFor(A,{body:'Sun'},date,site),moon=positionFor(A,{body:'Moon'},date,site);
  return {date,sun,moon,phase:A.Illumination('Moon',date).phase_fraction};
 });
 const candidates=[];
 for(const object of catalogue){
  if(object.id==='Sun'||(object.magnitude??0)>10.5)continue;
  let best=null;
  for(const sample of samples){
   const p=object.id==='Moon'?sample.moon:positionFor(A,object,sample.date,site);
   const deep=!object.body&&!['Star','Double star'].includes(object.type);
   if(p.alt<20||sample.sun.alt>(deep?-12:-6)||separation(p,sample.sun)<30)continue;
   if(object.id==='Moon'&&sample.phase<.08)continue;
   const moonlight=sample.moon.alt>0?sample.phase:0;
   if(deep&&moonlight>.65&&['Galaxy','Supernova remnant'].includes(object.type))continue;
   let score=(priorities[object.type]||50)+p.alt*.25-Math.max(0,(object.magnitude??2)-3)*2;
   if(highlights.has(object.id))score+=6;
   if(deep)score-=moonlight*(object.type==='Open cluster'?12:30);
   if(deep&&separation(p,sample.moon)<20&&sample.moon.alt>0)score-=20;
   if(['Uranus','Neptune','Mercury'].includes(object.id))score-=30;
   if(object.type==='Galaxy'&&object.sizeArcmin>120)score-=8;
   if(!best||score>best.score)best={object,...p,date:sample.date,score,moonlight,sunAltitude:sample.sun.alt};
  }
  if(best)candidates.push(best);
 }
 candidates.sort((a,b)=>b.score-a.score||a.object.id.localeCompare(b.object.id));
 const result=[],types=new Map();
 for(const candidate of candidates){
  const type=candidate.object.type;
  if((types.get(type)||0)>=2)continue;
  result.push(candidate);types.set(type,(types.get(type)||0)+1);
  if(result.length>=limit)break;
 }
 return result;
}
