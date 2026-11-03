import {defaultKit,validateKit} from './eyepieces.js?v=catalogue-1';
export const KIT_KEY='dvsky:navigator:eyepieces:v1';
export const KIT_VERSION=2;
export function migrateKit(value){
 const kit=validateKit(value);
 if(value.version===KIT_VERSION)return kit;
 const assumed=e=>e.kind==='fixed'&&((e.id==='supplied25'&&e.name==='Supplied 25 mm'&&e.min===25&&e.max===25)||(e.id==='supplied10'&&e.name==='Supplied 10 mm'&&e.min===10&&e.max===10));
 if(!kit.eyepieces.some(assumed))return kit;
 const eyepieces=kit.eyepieces.filter(e=>!assumed(e));
 for(const e of defaultKit().eyepieces.filter(e=>e.kind==='fixed'))if(!eyepieces.some(item=>item.id===e.id||(item.kind==='fixed'&&item.min===e.min)))eyepieces.push(e);
 return validateKit({...kit,eyepieces});
}
export function writeKit(kit){globalThis.localStorage.setItem(KIT_KEY,JSON.stringify({...validateKit(kit),version:KIT_VERSION}));}
export function readKit(){
 try{const saved=globalThis.localStorage?.getItem(KIT_KEY);if(saved){const value=JSON.parse(saved),kit=migrateKit(value);if(value.version!==KIT_VERSION)try{writeKit(kit);}catch{}return kit;}}catch{}
 return defaultKit();
}
