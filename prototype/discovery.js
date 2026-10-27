export function createDiscovery(){
 const key='dvsky:discovery:v1',control=document.getElementById('discovery-mode'),frame=document.getElementById('forecast-frame');let enabled=true;if(!control)return;
 try{enabled=localStorage.getItem(key)!=='reveal';}catch{}
 const send=()=>frame.contentWindow?.postMessage({type:'dvsky-discovery',enabled},location.origin);
 function paint(){control.checked=enabled;document.body.classList.toggle('dv-discovery',enabled);send();}
 control.addEventListener('change',()=>{enabled=control.checked;try{localStorage.setItem(key,enabled?'surprise':'reveal');}catch{}paint();});frame.addEventListener('load',send);window.addEventListener('storage',event=>{if(event.key===key){enabled=event.newValue!=='reveal';paint();}});paint();
}
