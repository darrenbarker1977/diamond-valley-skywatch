// Official ASTRO category ranges: https://github.com/Yeqzids/7timer-issues/wiki/Wiki
export const ASTRO_SITE=Object.freeze({latitude:50.68,longitude:-114.25,label:'Diamond Valley'});
export const ASTRO_RADIUS_KM=10;
const hour=3600000;
export function siteDistance(a,b){const r=Math.PI/180,dlat=(b.latitude-a.latitude)*r,dlon=(b.longitude-a.longitude)*r,x=Math.sin(dlat/2)**2+Math.cos(a.latitude*r)*Math.cos(b.latitude*r)*Math.sin(dlon/2)**2;return 6371*2*Math.asin(Math.min(1,Math.sqrt(x)));}
export function astroURLs(site){
 if(![site.latitude,site.longitude].every(Number.isFinite)||Math.abs(site.latitude)>90||Math.abs(site.longitude)>180)throw Error('Choose a valid observing site.');
 const query=new URLSearchParams({lon:String(site.longitude),lat:String(site.latitude),ac:'0',lang:'en',unit:'metric',tzshift:'0'});
 return {chart:'https://www.7timer.info/bin/astro.php?'+query+'&output=internal',source:'https://www.7timer.info/index.php?'+query+'&product=astro',meteoblue:`https://www.meteoblue.com/en/weather/outdoorsports/seeing/${site.latitude.toFixed(4)}N${site.longitude.toFixed(4)}E`};
}
export function parseAstro(envelope,site,now=Date.now()){
 if(envelope?.schema!==1||envelope.source!=='7timer-astro'||!envelope.site||![envelope.site.latitude,envelope.site.longitude].every(Number.isFinite)||Math.abs(envelope.site.latitude)>90||Math.abs(envelope.site.longitude)>180)throw Error('Astronomy feed has no valid location metadata.');
 const distance=siteDistance(site,envelope.site);if(distance>ASTRO_RADIUS_KM)throw Error('The saved model point is outside this observing area.');
 const d=envelope.forecast;if(d?.product!=='astro'||!/^\d{10}$/.test(d.init)||!Array.isArray(d.dataseries)||!d.dataseries.length||d.dataseries.length>80)throw Error('Astronomy model data is invalid.');
 const init=new Date(`${d.init.slice(0,4)}-${d.init.slice(4,6)}-${d.init.slice(6,8)}T${d.init.slice(8,10)}:00:00Z`);
 if(!Number.isFinite(init.getTime())||init.toISOString().replace(/\D/g,'').slice(0,10)!==d.init||init.getTime()>now+30*60000)throw Error('Astronomy model issue time is invalid or in the future.');
 const age=now-init.getTime();if(age>24*hour)throw Error('The astronomy model is over 24 hours old. Refresh for a current forecast.');
 let prior=0;const rows=d.dataseries.map(row=>{if(!Number.isInteger(row.timepoint)||row.timepoint<=prior||row.timepoint>240||row.timepoint%3)throw Error('Astronomy forecast time steps are invalid.');prior=row.timepoint;
  const category=value=>value===-9999?null:Number.isInteger(value)&&value>=1&&value<=8?value:null;
  return {time:new Date(init.getTime()+row.timepoint*hour),seeing:category(row.seeing),transparency:category(row.transparency)};
 });
 if(!rows.some(r=>r.seeing!==null||r.transparency!==null))throw Error('The astronomy model contains no seeing or transparency values.');
 return {init,rows,distance,stale:age>12*hour,site:envelope.site,until:rows.at(-1).time};
}
export function astroAt(model,time){if(!model)return null;const target=new Date(time).getTime();let closest=null;for(const row of model.rows){if(!closest||Math.abs(row.time-target)<Math.abs(closest.time-target))closest=row;}return closest&&Math.abs(closest.time-target)<=90*60000?closest:null;}
export function astroCategory(kind,value){
 if(!Number.isInteger(value)||value<1||value>8)return {label:'Not supplied',range:'—'};
 const seeing=['<0.5″','0.5–0.75″','0.75–1.0″','1.0–1.25″','1.25–1.5″','1.5–2.0″','2.0–2.5″','>2.5″'];
 const transparency=['<0.3','0.3–0.4','0.4–0.5','0.5–0.6','0.6–0.7','0.7–0.85','0.85–1.0','>1.0'];
 return {label:value<=2?'Excellent':value<=4?'Good':value<=6?'Fair':'Poor',range:kind==='seeing'?seeing[value-1]:transparency[value-1]+' mag/airmass'};
}
