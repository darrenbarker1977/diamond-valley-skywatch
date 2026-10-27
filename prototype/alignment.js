// All vectors use east, north, up; no DOM or sensor access in this module.
const D=Math.PI/180;
export const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function unit(a){const n=Math.hypot(...a);if(!Number.isFinite(n)||n<1e-8)throw Error('Direction is undefined');return a.map(v=>v/n);}
export const angle=(a,b)=>Math.acos(Math.max(-1,Math.min(1,dot(unit(a),unit(b)))))/D;
export function skyVector({alt,az}){return [Math.cos(alt*D)*Math.sin(az*D),Math.cos(alt*D)*Math.cos(az*D),Math.sin(alt*D)];}
export function skyAngles(v){const [e,n,u]=unit(v);return {alt:Math.asin(Math.max(-1,Math.min(1,u)))/D,az:(Math.atan2(e,n)/D+360)%360};}
export function deviceAxis({alpha,beta,gamma},mode){
 if(![alpha,beta,gamma].every(Number.isFinite))throw Error('Missing orientation values');
 // W3C intrinsic Z-X-Y rotation, device coordinates -> Earth reference.
 // Rear camera looks along -Z; a strapped phone's physical top edge is +Y.
 const a=alpha*D,b=beta*D,g=gamma*D,ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b),cg=Math.cos(g),sg=Math.sin(g);
 if(mode==='mounted')return unit([-sa*cb,ca*cb,sb]);
 return unit([-ca*sg-sa*sb*cg,-sa*sg+ca*sb*cg,-cb*cg]);
}
function basis(a,b){const x=unit(a),z=unit(cross(x,b)),y=cross(z,x);return [x,y,z];}
export function applyRotation(rotation,v){return rotation.map(row=>dot(row,v));}
export function singleAlignment(sample){
 const measured=skyAngles(sample.measured),target=skyAngles(sample.target);
 return {kind:'single',azOffset:((target.az-measured.az+540)%360)-180,altOffset:target.alt-measured.alt,residual:null};
}
export function alignedDirection(model,vector){
 if(model.kind!=='single')return skyAngles(applyRotation(model.rotation,vector));
 const raw=skyAngles(vector),alt=raw.alt+model.altOffset;
 if(alt< -90||alt>90)throw Error('Single-target tilt correction is outside its usable range. Realign nearby.');
 return {alt,az:(raw.az+model.azOffset+360)%360};
}
export function solveAlignment(first,second){
 const measured=angle(first.measured,second.measured),expected=angle(first.target,second.target);
 if(expected<30||expected>140||measured<25||measured>145)throw Error('Choose two objects 30°–140° apart in the sky.');
 if(Math.abs(measured-expected)>3)throw Error('The two directions disagree by more than 3°. Check object identity, phone placement and magnetic interference, then restart.');
 const m=basis(first.measured,second.measured),t=basis(first.target,second.target);
 const rotation=[0,1,2].map(row=>[0,1,2].map(col=>t.reduce((s,v,k)=>s+v[row]*m[k][col],0)));
 const residual=Math.max(angle(applyRotation(rotation,first.measured),first.target),angle(applyRotation(rotation,second.measured),second.target));
 return {rotation,residual};
}
export function validateAlignment(model,samples,check){
 if(samples.some(s=>s.id===check.id||angle(s.target,check.target)<20))throw Error('Use a different check object at least 20° from both alignment objects.');
 const error=angle(applyRotation(model.rotation,check.measured),check.target);
 if(error>3)throw Error(`Check missed by ${error.toFixed(1)}°. Guidance remains off. Check the target, tighten the straps, move magnetic accessories away and restart.`);
 return error;
}
export function guidance(current,target){
 if(target.alt<=0)return {blocked:'Target is below the horizon.'};
 if(target.alt>80||current.alt>80)return {blocked:'Too close to overhead for reliable left/right guidance. Choose a lower object.'};
 const error=angle(skyVector(current),skyVector(target));
 const az=((target.az-current.az+540)%360)-180,alt=target.alt-current.alt;
 if(error<=3)return {error,azDelta:az,altDelta:alt,text:'Within the 3° estimate — use the finder, then a low-power eyepiece (or look at the sky). This does not confirm centering.'};
 return {error,azDelta:az,altDelta:alt,text:`${Math.abs(az)<2?'Azimuth close':`${az>0?'→ Turn right':'← Turn left'} ${Math.abs(az).toFixed(1)}°`} · ${Math.abs(alt)<2?'Height close':`${alt>0?'↑ Raise':'↓ Lower'} ${Math.abs(alt).toFixed(1)}°`}`};
}
export function stableSample(history,now){
 const recent=history.filter(s=>now-s.time<=1200);
 if(recent.length<8||now-recent.at(-1).time>700||recent.at(-1).time-recent[0].time<600)throw Error('Hold still for about one second while fresh readings arrive.');
 const measured=unit([0,1,2].map(i=>recent.reduce((s,v)=>s+v.vector[i],0)));
 if(recent.some(s=>angle(s.vector,measured)>1.5))throw Error('The phone is moving or the sensor is noisy. Hold still and try again.');
 return measured;
}
