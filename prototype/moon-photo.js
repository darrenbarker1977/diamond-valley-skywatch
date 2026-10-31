// Real Galileo lunar photography (NASA/JPL PIA00405) with calculated lighting.
// A phase reference, never a live photograph or an eyepiece simulation.
const NS='http://www.w3.org/2000/svg';let sequence=0;
export function phaseShape(phase){
 if(!Number.isFinite(phase))throw Error('Moon phase is unavailable.');
 const p=((phase%360)+360)%360,waxing=p<180,c=Math.cos(p*Math.PI/180),left=[],right=[];
 for(let i=0;i<=100;i++){const y=-50+i,x=Math.sqrt(Math.max(0,2500-y*y));left.push([waxing?c*x:-x,y]);right.push([waxing?x:-c*x,y]);}
 return [...left,...right.reverse()].map(([x,y])=>`${(x+50).toFixed(3)},${(y+50).toFixed(3)}`).join(' ');
}
export function moonPhoto({phase,fraction,latitude=0,name='Moon'}={}){
 const figure=document.createElement('figure');figure.className='moon-photo';figure.dataset.phase=String(phase);figure.dataset.hemisphere=latitude<0?'south':'north';
 const make=(tag,attrs={})=>{const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;};
 const svg=make('svg',{viewBox:'0 0 100 100',role:'img','aria-label':`${name}${Number.isFinite(fraction)?' · '+Math.round(fraction*100)+'% illuminated':''} · photographic phase reference; ${latitude<0?'south':'north'} up`});
 const id='moon-phase-'+(++sequence),defs=make('defs'),clip=make('clipPath',{id}),disk=make('clipPath',{id:id+'-disk'});clip.append(make('polygon',{points:phaseShape(phase)}));disk.append(make('circle',{cx:50,cy:50,r:50}));defs.append(clip,disk);svg.append(defs);
 const group=make('g',latitude<0?{transform:'rotate(180 50 50)'}:{});group.append(make('circle',{cx:50,cy:50,r:50,fill:'#03070b'}));
 const image=make('image',{href:new URL('../assets/objects/moon.jpg',import.meta.url).href,x:0,y:0,width:100,height:100,'clip-path':`url(#${id})`});
 // The source disk nearly fills its square. A circular outer clip hides corners.
 const surface=make('g',{'clip-path':`url(#${id}-disk)`});surface.append(image);group.append(surface);svg.append(group);figure.append(svg);
 const error=document.createElement('span');error.className='moon-photo-error';error.hidden=true;error.textContent='Moon photograph unavailable';image.addEventListener('error',()=>{svg.style.display='none';error.hidden=false;});figure.append(error);return figure;
}
export const moonCredit='NASA/JPL Galileo photographic composite with calculated phase shading. Phase reference, not a live photograph. North up in the north; south up in the south. The tilt at your horizon and telescope orientation vary.';
