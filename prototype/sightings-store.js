export const SIGHTINGS_KEY='dvsky:sightings:v1';
export const SIGHTINGS_FORMAT='barker-after-dark-sightings';
const LIMIT=10000;
const text=(value,max,label)=>{if(typeof value!=='string'||!value.trim()||value.length>max)throw Error('Invalid '+label+' in the sightings file.');return value;};
const number=(value,min,max,label)=>{if(!Number.isFinite(value)||value<min||value>max)throw Error('Invalid '+label+' in the sightings file.');return value;};
export function validateSighting(value,allowedIds){
 if(!value||typeof value!=='object')throw Error('Invalid sighting record.');
 const id=text(value.id,100,'record ID');if(!/^[a-zA-Z0-9_-]+$/.test(id))throw Error('Invalid record ID.');
 const objectId=text(value.objectId,60,'object');if(!allowedIds.has(objectId))throw Error('The backup contains an object outside this catalogue.');
 const observedAt=text(value.observedAt,40,'observing time'),date=new Date(observedAt);if(!Number.isFinite(date.getTime())||date.getUTCFullYear()<1000||date.getUTCFullYear()>9998||date.toISOString()!==observedAt)throw Error('Invalid observing time in the sightings file.');
 const zone=text(value.zone,100,'timezone');try{new Intl.DateTimeFormat('en',{timeZone:zone});}catch{throw Error('Invalid timezone in the sightings file.');}
 const s=value.site;if(!s||typeof s!=='object')throw Error('The observing site is missing.');
 const site={label:text(s.label,160,'site name'),latitude:number(s.latitude,-90,90,'latitude'),longitude:number(s.longitude,-180,180,'longitude'),confirmed:s.confirmed===true};
 let eyepiece=null;
 if(value.eyepiece!==null){const e=value.eyepiece;if(!e||typeof e!=='object')throw Error('Invalid eyepiece setting.');eyepiece={id:text(e.id,100,'eyepiece ID'),name:text(e.name,100,'eyepiece name'),mm:number(e.mm,1,80,'eyepiece focal length'),power:number(e.power,1,5000,'magnification')};}
 return {id,objectId,observedAt,zone,site,eyepiece};
}
export function parseSightings(raw,allowedIds){
 if(typeof raw!=='string'||raw.length>8*1024*1024)throw Error('Choose a sightings JSON file smaller than 8 MB.');
 let value;try{value=JSON.parse(raw);}catch{throw Error('That file is not valid JSON. Nothing was changed.');}
 if(value?.format!==SIGHTINGS_FORMAT||value.version!==1||!Array.isArray(value.records)||value.records.length>LIMIT)throw Error('Choose a Barker After Dark sightings backup (version 1, up to 10,000 records).');
 const ids=new Set();return value.records.map(item=>{const record=validateSighting(item,allowedIds);if(ids.has(record.id))throw Error('The backup contains duplicate record IDs. Nothing was changed.');ids.add(record.id);return record;});
}
const envelope=records=>JSON.stringify({format:SIGHTINGS_FORMAT,version:1,records},null,2);
export function preferUnseen(items,seenIds,enabled=true){
 return enabled?[...items.filter(item=>!seenIds.has(item.object.id)),...items.filter(item=>seenIds.has(item.object.id))]:items;
}
export function createSightingsStore({storage,allowedIds}){
 let records=[],error='',raw=null;
 function reload(){try{raw=storage.getItem(SIGHTINGS_KEY);records=raw===null?[]:parseSightings(raw,allowedIds);error='';}catch(e){error='Saved sightings could not be read: '+e.message+' Existing browser data was left unchanged.';records=[];}return snapshot();}
 function snapshot(){return {records:records.map(r=>({...r,site:{...r.site},eyepiece:r.eyepiece&&{...r.eyepiece}})),error,recovery:!!error&&typeof raw==='string'};}
 function write(next){if(next.length>LIMIT)throw Error('The 10,000-sighting limit is reached. Export a backup before removing old records.');const data=envelope(next);try{storage.setItem(SIGHTINGS_KEY,data);}catch{throw Error('The browser could not save sightings. Nothing was changed. Check available storage or browser permissions.');}records=next;raw=data;error='';}
 function ready(){reload();if(error)throw Error(error);}
 function add(input){ready();const record=validateSighting(input,allowedIds),prior=records.find(r=>r.id===record.id);if(prior){if(JSON.stringify(prior)!==JSON.stringify(record))throw Error('Conflicting sighting ID. Nothing was changed.');return false;}write([...records,record]);return true;}
 function remove(id){ready();const record=records.find(r=>r.id===id);if(!record)return null;write(records.filter(r=>r.id!==id));return record;}
 function restore(data,{replaceUnreadable=false}={}){
  const incoming=parseSightings(data,allowedIds);reload();if(error&&!replaceUnreadable)throw Error('Saved sightings are unreadable. Download the recovery copy first, then explicitly allow replacement below.');
  const base=error?[]:records,map=new Map(base.map(r=>[r.id,r]));let added=0;
  for(const record of incoming){const prior=map.get(record.id);if(prior&&JSON.stringify(prior)!==JSON.stringify(record))throw Error('A backup record conflicts with an existing sighting. Nothing was changed.');if(!prior){map.set(record.id,record);added++;}}
  write([...map.values()]);return added;
 }
 reload();return {snapshot,reload,add,remove,restore,export(){reload();if(error){if(typeof raw==='string')return {text:raw,recovery:true};throw Error(error);}return {text:envelope(records),recovery:false};}};
}
