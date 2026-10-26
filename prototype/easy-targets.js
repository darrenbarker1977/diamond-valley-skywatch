import {angle,skyVector} from './alignment.js';
// Ranking is ease of recognition, not a promise of local visibility.
export const easyObjects={
 Moon:{rank:100,hint:'Look for the bright Moon. Use the middle of its disk, not an edge.'},
 Jupiter:{rank:94,hint:'A very bright, steady point of light. Confirm its direction on the map; in the telescope it has a disk and may show small moons.'},
 Venus:{rank:96,hint:'A brilliant, steady point of light. Use only after sunset, well away from the Sun.'},
 Saturn:{rank:70,hint:'A steady yellowish point. Confirm the direction; its rings help identify it in a telescope.'},
 Sirius:{rank:86,hint:'A very bright, often twinkling star below and to one side of Orion’s Belt. Confirm the map direction.'},
 Vega:{rank:83,hint:'A bright bluish-white star in the Summer Triangle. Confirm the direction on the map.'},
 Polaris:{rank:75,hint:'The North Star is fairly bright, but not the brightest. Look north, about halfway up. The two outer stars in the Big Dipper’s bowl point toward it.'},
 Capella:{rank:84,hint:'A bright yellow-white star in Auriga. Match its direction and height on the map.'},
 Arcturus:{rank:85,hint:'A bright orange star. Follow the curve of the Big Dipper’s handle toward it, then check the map.'},
 Altair:{rank:78,hint:'A bright star flanked by two fainter stars in a line. It is part of the Summer Triangle.'},
 Deneb:{rank:67,hint:'At the tail of Cygnus (the Northern Cross), part of the Summer Triangle. Match the map before recording.'},
 Betelgeuse:{rank:76,hint:'The reddish shoulder star in Orion, above Orion’s Belt. Confirm the map direction.'},
 Rigel:{rank:80,hint:'The bright blue-white foot of Orion, below Orion’s Belt. Confirm the map direction.'}
};
export function easyTargets(catalogue,positions,samples,phase=1){
 const sun=positions.get('Sun');if(!sun||sun.alt>-6)return [];
 return catalogue.filter(o=>{
  const p=positions.get(o.id);if(!easyObjects[o.id]||!p||p.alt<20||p.alt>75||angle(skyVector(p),skyVector(sun))<30)return false;
  if(o.id==='Moon'&&phase<0.15)return false;
  if(samples.some(s=>s.id===o.id))return false;
  if(samples.length===1){const distance=angle(samples[0].target,skyVector(p));return distance>=30&&distance<=140;}
  return !samples.some(s=>angle(s.target,skyVector(p))<20);
 }).sort((a,b)=>easyObjects[b.id].rank-easyObjects[a.id].rank);
}
