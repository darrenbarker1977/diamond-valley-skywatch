export const defaultKit=()=>({focalLength:1200,eyepieces:[
 {id:'supplied25',name:'Supplied 25 mm',kind:'fixed',min:25,max:25,enabled:true},
 {id:'supplied10',name:'Supplied 10 mm',kind:'fixed',min:10,max:10,enabled:true},
 {id:'sv135',name:'SVBONY SV135 7–21 mm zoom',kind:'zoom',min:7,max:21,enabled:true}
]});
export function validateKit(value){
 if(!value||!Number.isFinite(value.focalLength)||value.focalLength<200||value.focalLength>5000||!Array.isArray(value.eyepieces)||value.eyepieces.length>40)throw Error('Enter a telescope focal length between 200 and 5000 mm.');
 const ids=new Set();
 const eyepieces=value.eyepieces.map(e=>{
  if(!e||!['fixed','zoom'].includes(e.kind)||typeof e.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(e.id)||ids.has(e.id)||typeof e.name!=='string'||!e.name.trim()||e.name.length>80||typeof e.enabled!=='boolean'||!Number.isFinite(e.min)||!Number.isFinite(e.max)||e.min<1||e.max>80||e.max<e.min||(e.kind==='fixed'&&e.max!==e.min))throw Error('Check the eyepiece name and focal length (1–80 mm). Zoom limits must be in increasing order.');
  ids.add(e.id);return {id:e.id,name:e.name.trim(),kind:e.kind,min:e.min,max:e.max,enabled:e.enabled};
 });return {focalLength:value.focalLength,eyepieces};
}
export function candidates(kit){
 const config=validateKit(kit),choices=[];
 for(const e of config.eyepieces.filter(e=>e.enabled)){
  const lengths=e.kind==='fixed'?[e.min]:[e.min,e.max,...[7,9,10,12,14,16,18,21,24,28,32].filter(mm=>mm>e.min&&mm<e.max)];
  for(const mm of [...new Set(lengths)])choices.push({id:e.id,name:e.name,kind:e.kind,mm,power:config.focalLength/mm});
 }
 return choices.sort((a,b)=>a.power-b.power||(a.kind===b.kind?0:a.kind==='fixed'?-1:1));
}
export const describe=e=>`${e.name}${e.kind==='zoom'?` set to ${e.mm} mm`:''} · about ${Math.round(e.power)}×`;
export function alignmentEyepiece(kit){
 try {const start=candidates(kit)[0];return start&&start.power>220?'Enable a longer-focal-length eyepiece for alignment; your current kit starts above 220×.':start?`For alignment, use ${describe(start)}. This is your lowest available magnification. Centre the object before recording; you can zoom in after alignment.`:'Add or enable an eyepiece in My eyepieces before choosing alignment magnification.';}catch{return 'Check the telescope focal length in My eyepieces before using the magnification suggestions.';}
}
export function viewingPlan(object,kit,alt=45){
 if(object.id==='Sun')return {steps:[],note:'No ordinary eyepiece recommendation for the Sun. Never observe it through this telescope without a certified front-aperture solar filter and appropriate solar observing knowledge.'};
 let pool;try{pool=candidates(kit);}catch{return {steps:[],note:'Check your telescope focal length and eyepiece settings first.'};}
 if(!pool.length)return {steps:[],note:'Add or enable an eyepiece in My eyepieces to see a viewing plan.'};
 const start=pool[0];
 if(start.power>220)return {steps:[],note:'All your enabled eyepieces give more than 220×. Enable a longer-focal-length eyepiece for finding and beginner viewing; this guide does not recommend starting at such high power.'};
 const steps=[{title:'Find it first',choice:start,why:'Use the finder, then your lowest available magnification. Centre the object before changing power.'}];
 const add=(title,wanted,why,high=false)=>{
  const available=pool.filter(e=>e.power>steps.at(-1).choice.power*1.12&&e.power<=220);
  if(!available.length)return;
  const choice=high?available.find(e=>Math.abs(e.power-available.at(-1).power)<1e-6):available.reduce((best,e)=>Math.abs(Math.log(e.power/wanted))<Math.abs(Math.log(best.power/wanted))?e:best);
  steps.push({title,choice,why});
 };
 let note='Suggestions use your enabled eyepieces. Atmospheric steadiness is not measured: if the view blurs or shimmers, return to lower power.';
 if(alt<=0)return {steps,note:'Planning for later: this object is currently below the horizon. '+note};
 if(alt<20)return {steps,note:'This object is low in the sky. Start at low power; air distortion can make detail poor. '+note};
 if(['M31','M45','NGC869'].includes(object.id)||object.sizeArcmin>=50||['Star cloud','Asterism'].includes(object.type))note='Stay at low power to frame this large object. It may extend beyond the eyepiece view; binoculars can show more of the surroundings. '+note;
 else if(object.id==='Moon'){
  add('Explore craters',100,'Look near the light–dark boundary for shadows; near full Moon the shadows are less pronounced.');
  add('Try more detail only if sharp',200,'Increase slowly. Stop if detail softens; higher magnification does not guarantee a better view.',true);
 }else if(object.type==='Planet'){
  add('Look for a disk or detail',120,object.id==='Venus'||object.id==='Mercury'?'Look for its phase; do not expect surface markings.':'Let the telescope cool, focus carefully, and wait for moments when the air settles.');
  add('Optional higher power',200,'Try this only while the image stays sharp. Uranus and Neptune remain tiny; phone guidance only brings you to the rough area.',true);
 }else if(['M13','M57','Almach'].includes(object.id)||['Globular cluster','Planetary nebula','Double star'].includes(object.type)){
  add('Inspect the target',120,object.id==='Almach'?'Look for the two contrasting-colour stars.':'After finding the target at low power, increase magnification to inspect its compact structure.');
  add('Optional closer look',180,'Only keep this setting if it reveals more detail rather than a dimmer or blurrier view.',true);
 }else if(['M42','M81','Albireo'].includes(object.id)||['Open cluster','Galaxy','Nebula','Supernova remnant'].includes(object.type))add('Take a closer look',90,object.id==='Albireo'?'Look for the blue-and-gold pair; you may already separate it at low power.':'Compare the brighter central region at moderate power; return to low power for the wider surroundings.');
 else note='Low power is enough to identify this bright star or use it for alignment. Stars remain points; extra magnification will not reveal a stellar surface. '+note;
 if(start.power>100)note='Your lowest enabled power is already fairly high. Finding objects may be harder; a longer-focal-length eyepiece would make a useful low-power option. '+note;
 return {steps,note};
}
