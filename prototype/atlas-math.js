const R=Math.PI/180;
export const wrap=angle=>((angle%360)+360)%360;
export function projectView({alt,az},camera,width,height){
 const a=alt*R,d=(az-camera.az)*R,p=camera.alt*R;
 const forward=Math.sin(a)*Math.sin(p)+Math.cos(a)*Math.cos(p)*Math.cos(d);
 if(forward<=.015)return null;
 const scale=height/(2*Math.tan(camera.fov*R/2));
 return {x:width/2+scale*Math.cos(a)*Math.sin(d)/forward,y:height/2-scale*(Math.sin(a)*Math.cos(p)-Math.cos(a)*Math.sin(p)*Math.cos(d))/forward};
}
export function projectDome({alt,az},width,height){
 const radius=Math.min(width,height)*.42*(90-alt)/90;
 return {x:width/2+radius*Math.sin(az*R),y:height/2-radius*Math.cos(az*R)};
}
export function moveCamera(camera,dx,dy,width,height){
 return {...camera,az:wrap(camera.az-dx/width*camera.fov*width/height),alt:Math.max(-10,Math.min(85,camera.alt+dy/height*camera.fov))};
}
export function starColour(bv){
 if(bv<0)return '#c5dcff';if(bv<.45)return '#edf2ff';if(bv<.9)return '#fff4d8';if(bv<1.4)return '#ffd4ab';return '#ffad88';
}
