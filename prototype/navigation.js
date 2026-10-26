export function createNavigation({dialog,launch,stopCamera,forecastURL}){
 const $=id=>document.getElementById(id);let view='home';
 const menus=[...document.querySelectorAll('[data-app-view]')];
 function mark(){for(const button of document.querySelectorAll('.dv-app-header button')){const active=dialog.open?button.hasAttribute('data-open-section'):button.dataset.appView===view;if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}}
 function section(name){
  for(const [id,wanted] of [['pointing','pointing'],['equipment','equipment']]){$(id).hidden=name!==wanted;$(id).open=name===wanted;}
  document.querySelector('.dv-nav-content').hidden=name!=='objects';$('compact-guidance').hidden=name!=='objects';
  for(const button of document.querySelectorAll('[data-nav-section]'))button.setAttribute('aria-pressed',String(button.dataset.navSection===name));
  if(name!=='pointing')stopCamera();dialog.scrollTop=0;window.scrollTo(0,0);
 }
 function show(name){
  if(dialog.open)dialog.close();view=name;$('home-view').hidden=name!=='home';$('forecast-view').hidden=name!=='forecast';document.body.classList.toggle('dv-app-forecast-mode',name==='forecast');
  if(name==='forecast'){
   const frame=$('forecast-frame');
   if(!frame.hasAttribute('src'))frame.src=forecastURL(frame.dataset.src);
   else {try{frame.contentWindow.dispatchEvent(new Event('focus'));}catch{}}
  }
  mark();window.scrollTo(0,0);
 }
 for(const button of menus)button.addEventListener('click',()=>show(button.dataset.appView));
 for(const button of document.querySelectorAll('[data-open-section]'))button.addEventListener('click',()=>{if(!dialog.open)launch.click();section(button.dataset.openSection);mark();});
 for(const button of document.querySelectorAll('[data-nav-section]'))button.addEventListener('click',()=>section(button.dataset.navSection));
 launch.addEventListener('click',()=>{$('home-view').hidden=true;$('forecast-view').hidden=true;document.body.classList.remove('dv-app-forecast-mode');document.body.classList.add('dv-app-navigator-mode');section('objects');mark();window.scrollTo(0,0);});
 dialog.addEventListener('close',()=>{$('home-view').hidden=view!=='home';$('forecast-view').hidden=view!=='forecast';document.body.classList.remove('dv-app-navigator-mode');document.body.classList.toggle('dv-app-forecast-mode',view==='forecast');section('objects');mark();});
 const height=()=>document.documentElement.style.setProperty('--app-header-height',$('app-header').getBoundingClientRect().height+'px');
 if(globalThis.ResizeObserver)new ResizeObserver(height).observe($('app-header'));height();
 section('objects');mark();
 return {locationChanged(){const frame=$('forecast-frame');if(frame.hasAttribute('src'))frame.src=forecastURL(frame.dataset.src);}};
}
