// Shared by classic Forecast and module-based Navigator. Never changes Date/UTC
// or the browser's Intl API. Alberta law: permanent UTC-6 from Nov 1, 2026.
// Sources: AESO Alberta Time Change Administrative Amendments; UAlberta IST
// Alberta Time transition, Oct 6 2026 (linked in docs/alberta-time.md).
(function(root){
 if(root.DVSkyTime)return;
 const Native=Intl.DateTimeFormat,START=Date.parse('2026-11-01T06:00:00Z'),RULE='alberta-utc6-2026',FIXED='Etc/GMT+6';
 const zones=new Map();
 function isAlberta(zone){if(!zones.has(zone)){const canonical=new Native('en',{timeZone:zone}).resolvedOptions().timeZone;zones.set(zone,canonical==='America/Edmonton'||zone==='Canada/Mountain');}return zones.get(zone);}
 const permanent=(zone,time=Date.now())=>isAlberta(zone)&&new Date(time).getTime()>=START;
 function formatter(locale,options={}){
  const original=new Native(locale,options);if(!options.timeZone||!isAlberta(options.timeZone))return original;
  const corrected=new Native(locale,{...options,timeZone:FIXED});
  function parts(value=Date.now()){const date=new Date(value),after=permanent(options.timeZone,date),list=(after?corrected:original).formatToParts(date);return after?list.map(p=>p.type==='timeZoneName'&&['short','long'].includes(options.timeZoneName)?{...p,value:options.timeZoneName==='long'?'Alberta Time':'ABT'}:p):list;}
  return {format(value=Date.now()){return parts(value).map(p=>p.value).join('');},formatToParts:parts,resolvedOptions:()=>original.resolvedOptions()};
 }
 const weatherSafe=(data,time=Date.now())=>!permanent(data?.timezone||'UTC',time)||data?.clock_rule===RULE;
 root.DVSkyTime=Object.freeze({formatter,isAlberta,permanent,weatherSafe,START,RULE,FIXED,requestZone(zone,time=Date.now()){return permanent(zone,time)?FIXED:zone;}});
})(globalThis);
