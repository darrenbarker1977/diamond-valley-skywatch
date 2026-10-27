// Two scroll-snap wheels, with keyboard controls and an optional numeric entry.
export function createMissionDuration({onChange=()=>{},root=document}={}){
 const $=id=>root.getElementById(id),key='dvsky:mission-duration:v1',rowHeight=44;
 let initial=90;try{const saved=Number(localStorage.getItem(key));if(Number.isInteger(saved)&&saved>0&&saved<=719)initial=saved;}catch{}
 const values={hours:Math.floor(initial/60),minutes:initial%60},wheels=[];
 const total=()=>values.hours*60+values.minutes;
 function paint(){
  for(const {name,el,input} of wheels){el.setAttribute('aria-valuenow',String(values[name]));el.setAttribute('aria-valuetext',`${values[name]} ${name}`);for(const child of el.children)child.classList.toggle('is-selected',Number(child.dataset.value)===values[name]);if(root.activeElement!==input)input.value=values[name];}
  const h=values.hours,m=values.minutes;$('mission-duration-summary').textContent=total()?`${h?h+' '+(h===1?'hour':'hours'):''}${h&&m?' ':''}${m?m+' '+(m===1?'minute':'minutes'):''} · scroll the wheels or type below`:'Choose at least one minute.';
 }
 function set(name,value){
  const max=name==='hours'?11:59;if(!Number.isInteger(value)||value<0||value>max)return;
  const changed=values[name]!==value;values[name]=value;
  const wheel=wheels.find(w=>w.name===name);if(wheel.el.clientHeight)wheel.el.scrollTop=value*rowHeight;
  paint();if(changed){try{if(total())localStorage.setItem(key,String(total()));}catch{}onChange(total());}
 }
 for(const name of ['hours','minutes']){
  const el=$('mission-'+name),input=$('mission-'+name+'-input'),max=name==='hours'?11:59;let timer,interacting=false;
  for(let n=0;n<=max;n++){const option=root.createElement('div');option.className='mission-wheel-number';option.dataset.value=n;option.textContent=String(n).padStart(2,'0');option.setAttribute('aria-hidden','true');el.append(option);}
  wheels.push({name,el,input});
  const settle=()=>{clearTimeout(timer);if(!el.clientHeight)return;if(!interacting){if(Math.abs(el.scrollTop-values[name]*rowHeight)>2)el.scrollTop=values[name]*rowHeight;return;}interacting=false;set(name,Math.max(0,Math.min(max,Math.round(el.scrollTop/rowHeight))));};
  el.addEventListener('pointerdown',()=>{interacting=true;});
  el.addEventListener('wheel',()=>{interacting=true;},{passive:true});
  el.addEventListener('scroll',()=>{clearTimeout(timer);timer=setTimeout(settle,150);},{passive:true});
  el.addEventListener('scrollend',settle);
  el.addEventListener('click',event=>{const option=event.target.closest('.mission-wheel-number');if(option){interacting=false;set(name,Number(option.dataset.value));}});
  el.addEventListener('keydown',event=>{let value=values[name];switch(event.key){case 'ArrowUp':value--;break;case 'ArrowDown':value++;break;case 'PageUp':value-=5;break;case 'PageDown':value+=5;break;case 'Home':value=0;break;case 'End':value=max;break;default:return;}event.preventDefault();set(name,Math.max(0,Math.min(max,value)));});
  input.addEventListener('change',()=>{const value=input.valueAsNumber;if(!Number.isInteger(value)||value<0||value>max){input.value=values[name];return;}set(name,value);});
  // The Navigator starts hidden. Position each wheel when its panel is opened,
  // not while display:none would clamp scrollTop to zero.
  new ResizeObserver(()=>{if(el.clientHeight){interacting=false;el.scrollTop=values[name]*rowHeight;}}).observe(el);
 }
 paint();return {get minutes(){return total();}};
}
