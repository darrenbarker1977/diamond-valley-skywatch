export const HISTORY_KEY='dvsky-navigation-v1';
const sections=new Set(['walkthrough','objects','mission','finder','pointing','equipment','field']);
const panels=new Set(['scope','camera','compass','sightings','awake']);
export const homeRoute=()=>({view:'home',underlay:'home',section:'objects',stage:null,layers:[]});
export function validRoute(value){
 if(!value||!['home','forecast','navigator'].includes(value.view)||!['home','forecast'].includes(value.underlay)||!sections.has(value.section)||!Array.isArray(value.layers)||value.layers.length>5||new Set(value.layers).size!==value.layers.length||value.layers.some(x=>!panels.has(x)))return null;
 if(value.stage!==null&&(!Number.isInteger(value.stage)||value.stage<0||value.stage>4))return null;
 if(value.view!=='navigator'&&value.layers.some(x=>['scope','camera','sightings'].includes(x)))return null;
 if(value.layers.includes('scope')&&value.section!=='finder')return null;
 return {view:value.view,underlay:value.underlay,section:value.section,stage:value.stage,layers:[...value.layers]};
}
export function createAppHistory({env=window,onRestore=()=>{}}={}){
 const unpack=state=>{const x=state?.[HISTORY_KEY],route=validRoute(x?.route);return x?.version===1&&Number.isInteger(x.depth)&&x.depth>=0&&x.depth<1000000&&route?{route,depth:x.depth}:null;};
 let saved=unpack(env.history?.state),current=saved?.route||homeRoute(),depth=saved?.depth||0,enabled=!!env.history?.pushState,pending=false,deferred=null;
 function write(replace){if(!enabled)return;try{const prior=env.history.state,outer=prior&&typeof prior==='object'?prior:{};env.history[replace?'replaceState':'pushState']({...outer,[HISTORY_KEY]:{version:1,depth,route:current}},'');}catch{enabled=false;}}
 if(saved&&env.history.length<=1&&saved.route.view!=='home'){const wanted=current;current=homeRoute();depth=0;write(true);current=wanted;depth=1;write(false);}else write(true);
 function commit(route,{replace=false}={}){const next=validRoute(route);if(!next||JSON.stringify(next)===JSON.stringify(current))return false;if(pending){deferred=next;current=next;return true;}current=next;if(!replace)depth++;write(replace);return true;}
 function back(){if(pending)return true;if(!enabled||depth===0)return false;pending=true;env.history.back();return true;}
 env.addEventListener('popstate',event=>{pending=false;const target=unpack(event.state);if(!target)return;const previous=current;current=target.route;depth=target.depth;if(deferred){const wanted=deferred;deferred=null;commit(wanted);}onRestore(current,previous);});
 return {commit,back,get current(){return {...current,layers:[...current.layers]};},get depth(){return depth;},get enabled(){return enabled;},restore(){if(!saved)return false;saved=null;if(current.layers.length)commit({...current,layers:[]},{replace:true});onRestore(current,null);return true;}};
}
