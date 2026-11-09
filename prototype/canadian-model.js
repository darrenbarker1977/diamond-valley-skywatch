import {canadianZone,distanceKm} from './official-weather.js?v=official-1';
export async function fetchCanadianModel(api,zone,{signal,fetcher=fetch}={}){
 if(!canadianZone(zone))return null;
 const u=new URL(api);u.pathname='/v1/gem';const fields=(u.searchParams.get('hourly')||'').split(',').filter(f=>f!=='precipitation_probability');u.searchParams.set('hourly',fields.join(','));
 if(DVSkyTime.permanent(zone))u.searchParams.set('timezone',DVSkyTime.FIXED);
 const r=await fetcher(u,{cache:'no-store',signal});if(!r.ok)throw Error('Canadian GEM HTTP '+r.status);return r.json();
}
export function mergeCanadianModel(model,gem,site,zone){
 if(!canadianZone(zone)||!gem||!Number.isFinite(gem.latitude)||!Number.isFinite(gem.longitude)||distanceKm(site,{latitude:gem.latitude,longitude:gem.longitude})>5||!Array.isArray(gem.hourly?.time)||gem.hourly.time.length<24)return model;
 if(DVSkyTime.permanent(zone)&&gem.utc_offset_seconds!==-21600)return model;
 if(model&&model.utc_offset_seconds!==gem.utc_offset_seconds)return model;
 const base=model||gem,hourly={...base.hourly},index=new Map(gem.hourly.time.map((t,i)=>[t,i]));let count=0;
 for(const key of Object.keys(gem.hourly)){if(key==='time')continue;hourly[key]=base.hourly.time.map((t,i)=>{const j=index.get(t),value=j===undefined?null:gem.hourly[key]?.[j];if(Number.isFinite(value)){if(key==='cloud_cover')count++;return value;}return base.hourly[key]?.[i]??null;});}
 if(!count)return model;
 return {...base,hourly,timezone:zone,clock_rule:DVSkyTime.permanent(zone)?DVSkyTime.RULE:base.clock_rule,model_source:'Canadian GEM via Open-Meteo',model_grid:{latitude:gem.latitude,longitude:gem.longitude},model_note:'Canadian GEM: 2.5 km HRDPS near-term grid where available; regional/global grids are coarser at longer lead times. Open-Meteo best-match supplies precipitation probability and any missing fields.'};
}
