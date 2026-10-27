// Shared geometric positions for both forecast evenings and the live Navigator.
export function positionFor(A,object,date,site){
 if(!Number.isFinite(date.getTime()))throw Error('Invalid calculation time');
 if(!site||![site.latitude,site.longitude].every(Number.isFinite)||Math.abs(site.latitude)>90||Math.abs(site.longitude)>180)throw Error('Invalid observing location');
 const observer=new A.Observer(site.latitude,site.longitude,site.height??0);
 let eq;
 if(object.body)eq=A.Equator(object.body,date,observer,true,true);
 else{
  const ra=object.ra*Math.PI/12,dec=object.dec*Math.PI/180;
  const vector=new A.Vector(Math.cos(dec)*Math.cos(ra),Math.cos(dec)*Math.sin(ra),Math.sin(dec),date);
  eq=A.EquatorFromVector(A.RotateVector(A.Rotation_EQJ_EQD(date),vector));
 }
 const h=A.Horizon(date,observer,eq.ra,eq.dec);
 if(![h.altitude,h.azimuth].every(Number.isFinite))throw Error('Non-finite sky position');
 return {alt:h.altitude,az:((h.azimuth%360)+360)%360};
}
