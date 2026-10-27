import {defaultKit,validateKit} from './eyepieces.js?v=catalogue-1';
export const KIT_KEY='dvsky:navigator:eyepieces:v1';
export function readKit(){
 try{const saved=globalThis.localStorage?.getItem(KIT_KEY);if(saved)return validateKit(JSON.parse(saved));}catch{}
 return defaultKit();
}
