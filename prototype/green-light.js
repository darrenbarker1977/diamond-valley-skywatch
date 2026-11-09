export const GREEN_CLOUD_LIMIT=25;
export const GREEN_RULE='Green means a promising general observing window: at least two consecutive evening hours at 25% cloud or less, light wind, low precipitation risk and no conflicting official outlook. Seeing and transparency remain separate checks; unknown is not excellent.';
const hazards=new Set([45,48,51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99]);
const greatestKnown=(...values)=>{const known=values.filter(Number.isFinite);return known.length?Math.max(...known):null;};
export function greenWindow(rows,official){
 if(official&&official.outlook!=='GREEN LIGHT')return null;
 let active=[],best=null;
 for(let i=0;i<rows.length;i++){
  const r=rows[i],e=official?.rows?.[i],rain=greatestKnown(e?.precipitation_probability,r.precipitation_probability),gust=greatestKnown(e?.wind_gusts_10m,r.wind_gusts_10m),wind=greatestKnown(e?.wind_speed_10m,r.wind_speed_10m);
  const valid=Number.isFinite(r.cloud_cover)&&r.cloud_cover>=0&&r.cloud_cover<=GREEN_CLOUD_LIMIT&&Number.isFinite(rain)&&rain>=0&&rain<=20&&Number.isFinite(gust)&&gust>=0&&gust<=25&&Number.isFinite(wind)&&wind>=0&&wind<=15&&!hazards.has(r.weather_code)&&(r.visibility==null||Number.isFinite(r.visibility)&&r.visibility>=10000)&&(r.snowfall==null||r.snowfall===0);
  const consecutive=!active.length||Date.parse(r.time+'Z')-Date.parse(rows[active.at(-1)].time+'Z')===3600000;
  if(!valid){active=[];continue;}if(!consecutive)active=[];active.push(i);
  if(active.length>=2&&(!best||active.length>best.length))best=[...active];
 }
 return best;
}
export function checkGreenLight(candidate,rows,official,moonIllum=0){
 const window=greenWindow(rows,official),brightMoon=Number.isFinite(moonIllum)&&moonIllum>=60;
 const qualified=candidate==='GREEN LIGHT'&&window&&!brightMoon;
 const verdict=candidate==='GREEN LIGHT'&&!qualified?'MAYBE':candidate;
 const reason=qualified?`${window.length} consecutive evening hours forecast at ${Math.min(...window.map(i=>rows[i].cloud_cover))}–${Math.max(...window.map(i=>rows[i].cloud_cover))}% cloud (green limit: 25%). Check the actual sky.`:brightMoon?'Bright moonlight limits the general stargazing outlook. '+GREEN_RULE:official&&official.outlook!=='GREEN LIGHT'?'The official outlook is variable, cloudy or unverified. '+GREEN_RULE:!window?'No verified two-hour stretch meets the 25% cloud limit and wind/precipitation checks. '+GREEN_RULE:GREEN_RULE;
 return {verdict,window:qualified?window:null,reason};
}
