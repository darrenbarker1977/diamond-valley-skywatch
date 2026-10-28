export function createScopeView(){
 const $=id=>document.getElementById(id),view=$('finder-view');let active=false,scroll=0;
 function exit(){
  if(!active)return;active=false;document.body.classList.remove('dv-scope-view');view.removeAttribute('aria-modal');view.removeAttribute('role');view.removeAttribute('tabindex');$('finder-scope-view').setAttribute('aria-expanded','false');window.scrollTo(0,scroll);$('finder-scope-view').focus({preventScroll:true});
 }
 $('finder-scope-view').addEventListener('click',()=>{
  if(active){exit();return;}active=true;scroll=window.scrollY;document.body.classList.add('dv-scope-view');view.setAttribute('role','dialog');view.setAttribute('aria-modal','true');view.setAttribute('tabindex','-1');$('finder-scope-view').setAttribute('aria-expanded','true');$('scope-exit').focus({preventScroll:true});
 });
 $('scope-exit').addEventListener('click',exit);
 $('scope-night').addEventListener('click',()=>$('night').click());
 const night=()=>{$('scope-night').setAttribute('aria-pressed',String(document.body.classList.contains('dv-nav-night')));};new MutationObserver(night).observe(document.body,{attributes:true,attributeFilter:['class']});night();
 document.addEventListener('keydown',event=>{
  if(!active)return;
  if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();exit();return;}
  if(event.key==='Tab'){
   const buttons=[...view.querySelectorAll('button,input,select,summary,a[href]')].filter(el=>!el.disabled&&el.getClientRects().length);
   if(!buttons.length)return;const first=buttons[0],last=buttons.at(-1);
   if(event.shiftKey&&(document.activeElement===first||!view.contains(document.activeElement))){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&(document.activeElement===last||!view.contains(document.activeElement))){event.preventDefault();first.focus();}
  }
 },true);
 $('navigator').addEventListener('close',exit);
 return {exit,get active(){return active;}};
}
