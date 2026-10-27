const photos={
 Moon:['moon','PIA00405'],Saturn:['saturn','PIA17172'],Jupiter:['jupiter','PIA22946'],
 M31:['m31','PIA04921'],M42:['m42','PIA04227'],M45:['m45','PIA09262'],NGC5139:['omega-centauri','PIA10372']
};
const expectations={
 Moon:'Look for sharp crater rims and mountains near the light–dark boundary. Near full Moon, the view is bright and flatter because shadows are shorter.',
 Saturn:'A small, pale planet with rings. Their apparent tilt changes with the years. Steady air matters more than maximum magnification.',
 Jupiter:'A bright disk, often with two main cloud belts and several tiny moons in a line. Their positions change; they will not always all be visible.',
 Venus:'A bright white phase, like a tiny Moon. Ordinary eyepieces do not reveal the surface. Observe only after sunset, safely away from the Sun.',
 Mars:'A small orange disk. Surface detail is difficult unless Mars is close to Earth and the air is steady. Start with modest expectations.',
 Mercury:'A small phase near the horizon, often blurred by the atmosphere. This is a difficult beginner target; never search near the Sun with a telescope.',
 Uranus:'A very small pale disk at sufficient magnification. It can resemble a star at low power; a detailed chart is needed for confident identification.',
 Neptune:'A tiny, faint disk that can resemble a star. Use a detailed chart and confirm the surrounding star pattern; phone guidance alone cannot identify it.',
 M31:'A soft, elongated grey glow with a brighter centre. The whole galaxy is much larger than its bright centre and may extend beyond the eyepiece view.',
 M42:'A grey, smoky fan surrounding bright stars. Look for the compact Trapezium group. Colour photographs show much more than the eye usually sees.',
 M45:'A wide scattering of bright blue-white stars. Your widest eyepiece or binoculars may frame them best; do not expect the blue photographic nebulosity.',
 NGC104:'A dense, round glow that becomes grainy and may resolve into many stars as magnification and sky conditions allow.',
 NGC5139:'A broad, rich ball of stars. Start wide, then try moderate power to resolve the outer regions. It is accessible from southern observing sites.',
 Albireo:'Two contrasting stars, often described as gold and blue. Find them at low power before deciding whether more magnification helps.',
 Almach:'A bright golden star with a smaller bluish companion. Increase power gently if you cannot separate the pair at first.',
 Sun:'Do not point this telescope at the Sun without a properly fitted certified front-aperture solar filter and appropriate solar observing knowledge.'
};
const generic={
 'Galaxy':'A faint grey patch, often with a brighter centre. Dark skies and patient, slightly averted vision help. Photographic colour and spiral detail are much harder to see.',
 'Globular cluster':'A round glow that may become grainy or resolve into stars. Find it at low power, then increase gradually while the view stays sharp.',
 'Open cluster':'A loose pattern of individual stars. Start wide to take in the shape before looking more closely at small groups.',
 'Nebula':'A subtle grey glow. Dark skies, patient viewing and a clean eyepiece help; photographic colours are usually absent visually.',
 'Planetary nebula':'A small, faint patch or disk among stars. Find the correct star field at low power before trying more magnification.',
 'Supernova remnant':'A delicate extended glow. This is a challenging visual target that rewards dark, transparent skies and a detailed star chart.',
 'Double star':'Look for the two components and compare their brightness and colour. Some pairs need moderate power and steady air.',
 'Star cloud':'A broad field rich in stars. Low magnification or binoculars often give the most satisfying view.',
 'Asterism':'A pattern of stars rather than a single physical object. Use low power to frame the shape.',
 'Star':'A point of light with a subtle colour. Magnification does not reveal a stellar surface. Bright stars make useful landmarks for finding your way.'
};
export function objectStory(object){
 let difficulty='A rewarding next step';
 if(['Moon','Jupiter','Saturn','M42','M45','Albireo','NGC104','NGC5139'].includes(object.id)||object.type==='Star')difficulty='Beginner favourite';
 if(['Mercury','Uranus','Neptune'].includes(object.id)||(object.magnitude??0)>9||object.type==='Supernova remnant')difficulty='A patient-sky challenge';
 if(object.id==='Sun')difficulty='Specialist solar equipment required';
 return {expect:expectations[object.id]||generic[object.type]||object.note,difficulty};
}
export function objectVisual(object){
 const figure=document.createElement('figure');figure.className='object-visual';figure.dataset.kind=object.type.toLowerCase().replaceAll(' ','-');
 const photo=photos[object.id];
 if(photo){const img=document.createElement('img');img.src=new URL('../assets/objects/'+photo[0]+'.jpg',import.meta.url).href;img.alt=object.name+' — NASA image';img.loading='lazy';img.decoding='async';img.addEventListener('error',()=>{img.hidden=true;figure.classList.add('image-unavailable');figure.querySelector('figcaption').textContent='Photo unavailable · '+object.type+' illustration';},{once:true});figure.append(img);}
 const mark=document.createElement('span');mark.className='object-illustration';mark.setAttribute('aria-hidden','true');mark.textContent=object.type==='Planet'?'◎':object.type==='Double star'?'✦':object.type==='Galaxy'?'◌':object.type==='Moon'?'☾':'✧';figure.append(mark);
 const caption=document.createElement('figcaption');
 if(photo){const credit=document.createElement('a');credit.href='https://images.nasa.gov/details/'+photo[1];credit.target='_blank';credit.rel='noopener noreferrer';credit.textContent='NASA / JPL image ↗';caption.append(credit);}
 else caption.textContent=object.type+' illustration';
 figure.append(caption);return figure;
}
