import {positionFor} from './sky-position.js?v=catalogue-1';
import {projectView,projectDome,moveCamera,wrap,starColour} from './atlas-math.js';
export function createSkyAtlas({A,site,catalogue,onSelect}){
 const $=id=>document.getElementById(id),canvas=$('sky-canvas'),ctx=canvas.getContext('2d');
 let camera={az:180,alt:28,fov:85},mode='horizon',lines=true,labels=true,following=false,pose=null;
 let stars=[],constellations=[],dataLoaded=false,dataFailed=false;
 let starPositions=[],linePositions=[],labelPositions=[],positions=new Map(),selected='Moon',date=null,lastEpoch=0,hits=[],width=0,height=0,frame=0,failed=false;
 const pointers=new Map();let drag=null,pinch=0,moved=false;
 const request=()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;draw();});};
 import('./atlas-data.js?v=atlas-1').then(data=>{stars=data.stars;constellations=data.constellations;dataLoaded=true;if(date&&A)prepare(date);request();}).catch(()=>{dataFailed=true;failed=true;canvas.removeAttribute('data-ready');request();});
 const compass=az=>['N','NE','E','SE','S','SW','W','NW'][Math.round(wrap(az)/45)%8];
 function project(p){return mode==='dome'?projectDome(p,width,height):projectView(p,camera,width,height);}
 function visible(p,margin=8){return p&&p.x>=-margin&&p.x<=width+margin&&p.y>=-margin&&p.y<=height+margin;}
 function prepare(now){
  // Precession is calculated once per epoch. The same geometric horizon as Navigator is used.
  const rotation=A.Rotation_EQJ_EQD(now),observer=new A.Observer(site.latitude,site.longitude,site.height||0);
  const locate=(ra,dec)=>{
   const a=ra*Math.PI/180,d=dec*Math.PI/180,v=new A.Vector(Math.cos(d)*Math.cos(a),Math.cos(d)*Math.sin(a),Math.sin(d),now);
   const eq=A.EquatorFromVector(A.RotateVector(rotation,v)),h=A.Horizon(now,observer,eq.ra,eq.dec);
   return {alt:h.altitude,az:wrap(h.azimuth)};
  };
  starPositions=stars.map(s=>({...locate(s[0],s[1]),mag:s[2],colour:starColour(s[3])}));
  linePositions=constellations.flatMap(c=>c.lines.map(line=>line.map(p=>locate(p[0],p[1]))));
  labelPositions=constellations.filter(c=>c.center).map(c=>({...locate(c.center[0],c.center[1]),name:c.name}));
  lastEpoch=now.getTime();
 }
 function text(label,x,y,colour='#aec3d9',size=11){ctx.font=`${size}px system-ui,sans-serif`;ctx.textAlign='center';ctx.fillStyle=colour;ctx.fillText(label,x,y);}
 function draw(){
  const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
  width=rect.width;height=rect.height;const ratio=Math.min(2,globalThis.devicePixelRatio||1);
  if(canvas.width!==Math.round(width*ratio)||canvas.height!==Math.round(height*ratio)){canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);}
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);hits=[];
  const night=document.body.classList.contains('dv-nav-night'),sun=positions.get('Sun'),daylight=sun?.alt>0;
  const gradient=ctx.createLinearGradient(0,0,0,height);gradient.addColorStop(0,night?'#090101':daylight?'#17334e':'#040914');gradient.addColorStop(1,night?'#200606':daylight?'#4a718d':'#132b42');ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
  if(!date||failed||!dataLoaded){text(failed?'Sky map unavailable — no positions substituted.':'Loading the sky…',width/2,height/2,night?'#c45e54':'#b4cce0',12);$('atlas-status').textContent=failed?'Map unavailable. Object search and Forecast remain available.':'Loading real star positions…';return;}
  let horizon=height;
  if(mode==='horizon'){
   horizon=height/2+height/(2*Math.tan(camera.fov*Math.PI/360))*Math.tan(camera.alt*Math.PI/180);
   if(horizon<height){ctx.fillStyle=night?'#110303':'#071313';ctx.fillRect(0,Math.max(0,horizon),width,height);ctx.strokeStyle=night?'#68302a':'#4d7973';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,horizon);ctx.lineTo(width,horizon);ctx.stroke();}
   for(let az=0;az<360;az+=15){const p=project({alt:0,az});if(!visible(p)||p.y<0||p.y>height-8)continue;ctx.strokeStyle=night?'#57251f':'#42615f';ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x,p.y+5);ctx.stroke();if(az%45===0)text(compass(az),p.x,p.y+20,night?'#d96d5e':'#a2c8be',10);}
  }else{
   ctx.strokeStyle=night?'#6b2821':'#395666';ctx.lineWidth=1;ctx.beginPath();ctx.arc(width/2,height/2,Math.min(width,height)*.42,0,Math.PI*2);ctx.stroke();
   for(const [name,az] of [['N',0],['E',90],['S',180],['W',270]]){const p=project({alt:-7,az});text(name,p.x,p.y+4,night?'#d96d5e':'#a9c8d6',11);}
  }
  if(lines){ctx.strokeStyle=night?'#6f302a':daylight?'#718b9f66':'#4e789566';ctx.lineWidth=.8;
   for(const line of linePositions)for(let i=1;i<line.length;i++){
    const a=line[i-1],b=line[i];if(a.alt<0||b.alt<0)continue;const p=project(a),q=project(b);
    if(!p||!q||Math.hypot(p.x-q.x,p.y-q.y)>Math.max(width,height)*.6||(!visible(p,150)&&!visible(q,150)))continue;
    ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
   }
  }
  for(const star of starPositions){
   if(star.alt<0)continue;const p=project(star);if(!visible(p))continue;
   const radius=Math.max(.45,2.5-star.mag*.35)*(mode==='dome'?.8:1);
   ctx.globalAlpha=daylight?.3:Math.max(.35,1-star.mag*.08);ctx.fillStyle=night?'#e28e77':star.colour;
   if(star.mag<1.4){ctx.shadowBlur=5;ctx.shadowColor=ctx.fillStyle;}
   ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  }ctx.globalAlpha=1;
  if(labels&&mode!=='dome')for(const label of labelPositions){const p=project(label);if(label.alt>5&&visible(p,0))text(label.name.toUpperCase(),p.x,p.y,night?'#9d4b40':'#7897b3',9);}
  for(const object of catalogue){
   const p=positions.get(object.id);if(!p||p.alt<0)continue;const pixel=project(p);if(!visible(pixel))continue;
   const active=object.id===selected,body=!!object.body;
   hits.push({...pixel,id:object.id});
   if(object.type==='Star'&&!active&&!body){if(labels&&(object.magnitude??3)<1.4)text(object.name,pixel.x,pixel.y-10,night?'#bb6553':'#c9d8e6',10);continue;}
   const colour=night?'#e78568':active?'#f3cb85':body?'#f0d7a5':'#8fc6d8';ctx.strokeStyle=colour;ctx.fillStyle=colour;ctx.lineWidth=active?1.8:.8;
   if(body){const radius=object.id==='Sun'?6:object.id==='Moon'?5:3;ctx.shadowColor=colour;ctx.shadowBlur=8;ctx.beginPath();ctx.arc(pixel.x,pixel.y,radius,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
   else{ctx.globalAlpha=active?1:.65;ctx.beginPath();if(object.type==='Galaxy')ctx.ellipse(pixel.x,pixel.y,4,2.3,-.5,0,Math.PI*2);else ctx.arc(pixel.x,pixel.y,object.type==='Star'?3:3.5,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
   if(active){ctx.beginPath();ctx.arc(pixel.x,pixel.y,12,0,Math.PI*2);ctx.stroke();for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5]){ctx.beginPath();ctx.moveTo(pixel.x+Math.cos(angle)*15,pixel.y+Math.sin(angle)*15);ctx.lineTo(pixel.x+Math.cos(angle)*21,pixel.y+Math.sin(angle)*21);ctx.stroke();}}
   if(active||body||(labels&&camera.fov<45&&mode!=='dome')){const y=pixel.y-18;text(object.name,Math.min(width-65,Math.max(65,pixel.x)),Math.max(14,y),colour,active?12:10);}
  }
  $('atlas-direction').textContent=mode==='dome'?'All sky · north at top':`${following?'Aligned view':'Map view'} · ${compass(camera.az)} · ${Math.round(camera.az)}° · ${Math.round(camera.alt)}° up`;
  $('atlas-zoom').textContent=mode==='dome'?'Whole sky':Math.round(camera.fov)+'° vertical';
  $('atlas-status').textContent=daylight?'Daylight preview · most stars are hidden to the eye':sun&&sun.alt>-12?'Twilight · brighter objects are easier to see':'Live sky · drag to explore, tap an object';
  canvas.dataset.ready='true';canvas.dataset.starCount=String(stars.length);canvas.dataset.view=mode;canvas.dataset.azimuth=String(Math.round(camera.az));
 }
 function stopFollowing(){following=false;$('atlas-follow').setAttribute('aria-pressed','false');}
 function move(dx,dy){if(mode==='dome')return;stopFollowing();camera=moveCamera(camera,dx,dy,width,height);request();}
 function zoom(factor){if(mode==='dome')return;camera.fov=Math.max(20,Math.min(105,camera.fov*factor));request();}
 canvas.addEventListener('pointerdown',event=>{canvas.setPointerCapture(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});drag={x:event.clientX,y:event.clientY};moved=false;if(pointers.size===2){const [a,b]=[...pointers.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y);}});
 canvas.addEventListener('pointermove',event=>{
  if(!pointers.has(event.pointerId))return;const old=pointers.get(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
  if(pointers.size===2){const [a,b]=[...pointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);if(distance>0&&pinch>0)zoom(pinch/distance);pinch=distance;moved=true;}
  else{if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>4)moved=true;if(moved)move(event.clientX-old.x,event.clientY-old.y);}
 });
 function finish(event,cancel=false){
  if(!cancel&&!moved&&pointers.size===1){const rect=canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;const hit=hits.map(p=>({...p,d:Math.hypot(p.x-x,p.y-y)})).sort((a,b)=>a.d-b.d)[0];if(hit?.d<19)onSelect(hit.id);}
  pointers.delete(event.pointerId);pinch=0;if(pointers.size){const p=[...pointers.values()][0];drag={...p};moved=true;}
 }
 canvas.addEventListener('pointerup',event=>finish(event));canvas.addEventListener('pointercancel',event=>finish(event,true));
 canvas.addEventListener('wheel',event=>{event.preventDefault();zoom(event.deltaY>0?1.12:1/1.12);},{passive:false});
 canvas.addEventListener('keydown',event=>{const moves={ArrowLeft:[45,0],ArrowRight:[-45,0],ArrowUp:[0,35],ArrowDown:[0,-35]};if(moves[event.key]){event.preventDefault();move(...moves[event.key]);}else if(['+','=','-'].includes(event.key)){event.preventDefault();zoom(event.key==='-'?1.15:1/1.15);}});
 for(const button of document.querySelectorAll('[data-atlas-bearing]'))button.addEventListener('click',()=>{stopFollowing();mode='horizon';camera={az:Number(button.dataset.atlasBearing),alt:28,fov:85};$('atlas-overview').setAttribute('aria-pressed','false');request();});
 $('atlas-in').addEventListener('click',()=>zoom(1/1.25));$('atlas-out').addEventListener('click',()=>zoom(1.25));
 $('atlas-lines').addEventListener('click',()=>{lines=!lines;$('atlas-lines').setAttribute('aria-pressed',String(lines));request();});
 $('atlas-labels').addEventListener('click',()=>{labels=!labels;$('atlas-labels').setAttribute('aria-pressed',String(labels));request();});
 $('atlas-overview').addEventListener('click',()=>{stopFollowing();mode=mode==='dome'?'horizon':'dome';$('atlas-overview').setAttribute('aria-pressed',String(mode==='dome'));request();});
 $('atlas-follow').addEventListener('click',()=>{if(!pose?.ready)return;following=!following;mode='horizon';$('atlas-overview').setAttribute('aria-pressed','false');$('atlas-follow').setAttribute('aria-pressed',String(following));if(following){camera.az=pose.current.az;camera.alt=Math.min(85,Math.max(-10,pose.current.alt));}request();});
 const resize=new ResizeObserver(request);resize.observe(canvas);new MutationObserver(request).observe(document.body,{attributes:true,attributeFilter:['class']});
 return {
  update(nextPositions,id,now=new Date()){
   const first=!date;positions=nextPositions;selected=id;date=now;failed=dataFailed;
   const target=positions.get(selected);if(first&&target?.alt>0)camera={az:target.az,alt:Math.min(85,target.alt),fov:85};
   try{if(!A)throw Error('Astronomy library unavailable');if(dataLoaded&&(!lastEpoch||Math.abs(now.getTime()-lastEpoch)>9000))prepare(now);request();}catch{failed=true;request();}
  },
  centerTarget(){const p=positions.get(selected);if(!p)return;stopFollowing();if(p.alt<=0){$('atlas-status').textContent='This object is below the horizon. The map stays above your horizon.';return;}mode='horizon';camera={az:p.az,alt:Math.min(85,p.alt),fov:60};$('atlas-overview').setAttribute('aria-pressed','false');request();},
  pose(state){const changed=!!pose?.ready!==!!state.ready;pose=state;$('atlas-follow').disabled=!state.ready;if(!state.ready)stopFollowing();if(following&&state.ready){camera.az=state.current.az;camera.alt=Math.min(85,Math.max(-10,state.current.alt));request();}else if(changed)request();},
  locationChanged(){lastEpoch=0;date=null;stopFollowing();},
  fail(){failed=true;date=null;positions=new Map();stopFollowing();canvas.removeAttribute('data-ready');request();},
  refresh:request
 };
}
