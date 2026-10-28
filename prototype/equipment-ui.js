import {validateKit,viewingPlan,describe,alignmentEyepiece} from './eyepieces.js?v=catalogue-1';
import {KIT_KEY as KEY,readKit} from './kit-store.js?v=catalogue-1';
const element=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
export function createEquipment(onChange){
 const $=id=>document.getElementById(id);let kit=readKit();
 $('telescope-focal').value=kit.focalLength;
 function current(){const focalLength=Number($('telescope-focal').value);try{return validateKit({...kit,focalLength});}catch{return null;}}
 function update(){
  const config=current();
  if(!config){$('kit-status').textContent='Enter a valid telescope focal length between 200 and 5000 mm. Suggestions are paused.';onChange();return;}
  kit=config;
  try{localStorage.setItem(KEY,JSON.stringify(kit));$('kit-status').textContent='Saved on this browser only. Changes update viewing suggestions immediately.';}catch{$('kit-status').textContent='Settings work for this visit, but browser storage is unavailable. They may not survive a reload.';}
  for(const row of $('kit-list').children){const e=kit.eyepieces.find(e=>e.id===row.dataset.id);row.querySelector('small').textContent=e.kind==='zoom'?`${e.min}–${e.max} mm · about ${Math.round(kit.focalLength/e.max)}–${Math.round(kit.focalLength/e.min)}×`:`${e.min} mm · about ${Math.round(kit.focalLength/e.min)}×`;}
  onChange();
 }
 function draw(){
  $('kit-list').replaceChildren(...kit.eyepieces.map(e=>{
   const row=element('div');row.className='dv-nav-kit-row';row.dataset.id=e.id;
   const label=element('label'),input=element('input');input.type='checkbox';input.checked=e.enabled;input.setAttribute('aria-label',`Use ${e.name}`);
   const text=element('span');text.append(element('strong',e.name),element('small',e.kind==='zoom'?`${e.min}–${e.max} mm · about ${Math.round(kit.focalLength/e.max)}–${Math.round(kit.focalLength/e.min)}×`:`${e.min} mm · about ${Math.round(kit.focalLength/e.min)}×`));label.append(input,text);
   input.addEventListener('change',()=>{kit.eyepieces.find(item=>item.id===e.id).enabled=input.checked;update();});
   const remove=element('button','Remove');remove.type='button';remove.setAttribute('aria-label',`Remove ${e.name}`);remove.addEventListener('click',()=>{kit.eyepieces=kit.eyepieces.filter(item=>item.id!==e.id);draw();update();($('kit-list').querySelector('input')||$('eyepiece-add-panel').querySelector('summary')).focus();});row.append(label,remove);return row;
  }));
 }
 $('telescope-focal').addEventListener('input',update);
 $('new-eyepiece-kind').addEventListener('change',()=>{const zoom=$('new-eyepiece-kind').value==='zoom';$('zoom-max-label').hidden=!zoom;$('new-eyepiece-max').required=zoom;$('focal-min-label').firstChild.textContent=zoom?'Shortest focal length (mm) ':'Focal length (mm) ';});
 $('add-eyepiece-form').addEventListener('submit',event=>{
  event.preventDefault();
  try{
   const config=current();if(!config)throw Error('Enter a valid telescope focal length before adding an eyepiece.');
   const kind=$('new-eyepiece-kind').value,min=Number($('new-eyepiece-min').value),max=kind==='zoom'?Number($('new-eyepiece-max').value):min;
   const name=$('new-eyepiece-name').value.trim()||(kind==='zoom'?`${min}–${max} mm zoom`:`${min} mm eyepiece`);
   const id=globalThis.crypto.randomUUID();
   kit=validateKit({...config,eyepieces:[...config.eyepieces,{id,name,kind,min,max,enabled:true}]});draw();update();$('add-eyepiece-status').textContent=`${name} added. Viewing suggestions now include it.`;$('new-eyepiece-name').value='';$('new-eyepiece-min').value='';$('new-eyepiece-max').value='';
  }catch(e){$('add-eyepiece-status').textContent=e.message;}
 });
 draw();
 return {
  current,
  alignmentHint:()=>alignmentEyepiece(current()),
  appendAdvice(container,object,alt){
   const section=element('section');section.className='dv-nav-eyepiece-plan';section.setAttribute('aria-label','Your eyepiece plan');section.append(element('h4','Recommended eyepiece'));
   const plan=viewingPlan(object,current(),alt),list=element('ol');
   const primary=plan.steps[1]||plan.steps[0];
   if(primary){section.append(element('p',describe(primary.choice)));const tip=element('p',primary!==plan.steps[0]?`Find it first with ${describe(plan.steps[0].choice)}. Then increase power only if the image stays sharp.`:'Start at low power. More magnification is not always a better view.');tip.className='dv-nav-fine';section.append(tip);}
   const extra=element('details');extra.append(element('summary','Finding steps & more options'));
   for(const step of plan.steps){const item=element('li');item.append(element('strong',step.title),element('p',describe(step.choice)),element('p',step.why));list.append(item);}
   extra.append(list,element('p',plan.note));const config=current();if(config)extra.append(element('p',`Magnification = telescope focal length ÷ eyepiece focal length. Using ${config.focalLength} mm; check your tube label in My eyepieces.`));section.append(extra);container.append(section);return section;
  }
 };
}
