const formatters=new Map();
function formatter(zone){if(!formatters.has(zone))formatters.set(zone,new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}));return formatters.get(zone);}
export function localParts(time,zone){
 const parts=formatter(zone).formatToParts(new Date(time)),get=key=>parts.find(p=>p.type===key).value;
 return {date:`${get('year')}-${get('month')}-${get('day')}`,hour:Number(get('hour')),minute:Number(get('minute'))};
}
export function addDays(date,days){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isInteger(days))throw Error('Choose a valid calendar date.');
 const value=new Date(date+'T12:00:00Z');if(!Number.isFinite(value.getTime())||value.toISOString().slice(0,10)!==date)throw Error('Choose a valid calendar date.');
 value.setUTCDate(value.getUTCDate()+days);return value.toISOString().slice(0,10);
}
export function nightDate(time,zone){const p=localParts(time,zone);return p.hour<6?addDays(p.date,-1):p.date;}
export function localInstant(date,minutes,zone){
 addDays(date,0);if(!Number.isInteger(minutes)||minutes<0||minutes>2880)throw Error('Choose a valid local time.');
 const day=addDays(date,Math.floor(minutes/1440)),minute=minutes%1440,hour=Math.floor(minute/60),mm=minute%60;
 const target=Date.parse(`${day}T${String(hour).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00Z`);
 let guess=target;
 for(let i=0;i<5;i++){
  const p=localParts(guess,zone),actual=Date.parse(`${p.date}T${String(p.hour).padStart(2,'0')}:${String(p.minute).padStart(2,'0')}:00Z`),difference=target-actual;
  guess+=difference;if(!difference)break;
 }
 const matches=[];
 // Pick the earlier occurrence of an ambiguous clock time; reject a skipped time.
 for(let offset=-180;offset<=180;offset+=15){const t=guess+offset*60000,p=localParts(t,zone);if(p.date===day&&p.hour===hour&&p.minute===mm)matches.push(t);}
 if(!matches.length)throw Error('This local time is skipped when the clocks change. Choose another time.');
 return new Date(Math.min(...matches));
}
export function localLabel(time,zone){return new Intl.DateTimeFormat('en-CA',{timeZone:zone,weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date(time));}
export function shortClock(time,zone){return new Intl.DateTimeFormat('en-CA',{timeZone:zone,hour:'numeric',minute:'2-digit'}).format(new Date(time));}
