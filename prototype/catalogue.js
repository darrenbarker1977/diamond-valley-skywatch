import {importedObjects} from './catalogue-data.js?v=catalogue-1';
// J2000 RA in hours, declination in degrees. Preserve familiar IDs and notes.
const familiarObjects = [
  ...['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune'].map(body => ({id:body,name:body,type:body === 'Sun' ? 'Star' : body === 'Moon' ? 'Moon' : 'Planet',body,aliases:body === 'Moon' ? ['Luna'] : [],note:body === 'Sun' ? 'Never look at the Sun through a telescope without a certified full-aperture solar filter.' : 'Position calculated for the current time and observing site.'})),
  {id:'M31',name:'Andromeda Galaxy',type:'Galaxy',ra:0.71231,dec:41.26917,aliases:['M31','NGC224','Andromeda'],note:'Best under dark skies. Start with your lowest-power eyepiece.'},
  {id:'M42',name:'Orion Nebula',type:'Nebula',ra:5.58814,dec:-5.38967,aliases:['M42','NGC1976','Orion'],note:'A bright stellar nursery in Orion’s sword.'},
  {id:'M45',name:'Pleiades',type:'Open cluster',ra:3.79,dec:24.1167,aliases:['M45','Seven Sisters'],note:'A wide cluster; binoculars or a wide-field eyepiece work well.'},
  {id:'M13',name:'Hercules Cluster',type:'Globular cluster',ra:16.6949,dec:36.4613,aliases:['M13','NGC6205'],note:'A rich globular cluster; look for a grainy glow at low power.'},
  {id:'M57',name:'Ring Nebula',type:'Planetary nebula',ra:18.89308,dec:33.02917,aliases:['M57','NGC6720'],note:'A small ring in Lyra. Locate at low power, then increase magnification.'},
  {id:'M81',name:'Bode’s Galaxy',type:'Galaxy',ra:9.92588,dec:69.0653,aliases:['M81','NGC3031','Bodes'],note:'A northern galaxy best observed away from moonlight.'},
  {id:'NGC869',name:'Double Cluster',type:'Open cluster',ra:2.3167,dec:57.1333,aliases:['NGC869','NGC884','C14','Perseus'],note:'Two neighbouring clusters. The plotted centre is NGC 869.'},
  {id:'Albireo',name:'Albireo',type:'Double star',ra:19.51202,dec:27.95969,aliases:['Beta Cygni'],note:'A colourful double in Cygnus, worth trying even with moonlight.'},
  {id:'Almach',name:'Almach',type:'Double star',ra:2.06498,dec:42.32972,aliases:['Gamma Andromedae'],note:'A golden and blue double star in Andromeda.'},
  {id:'Polaris',name:'Polaris',type:'Star',ra:2.5303,dec:89.2641,aliases:['North Star','Alpha Ursae Minoris'],note:'Close to the north celestial pole; it is not exactly true north.'},
  {id:'Vega',name:'Vega',type:'Star',ra:18.61565,dec:38.78369,aliases:['Alpha Lyrae'],note:'A bright star in Lyra and a member of the Summer Triangle.'},
  {id:'Capella',name:'Capella',type:'Star',ra:5.27816,dec:45.99799,aliases:['Alpha Aurigae'],note:'A bright yellow-white star in Auriga.'},
  {id:'Arcturus',name:'Arcturus',type:'Star',ra:14.26102,dec:19.18241,aliases:['Alpha Bootis'],note:'A bright orange star reached by following the Big Dipper’s handle.'},
  {id:'Altair',name:'Altair',type:'Star',ra:19.84639,dec:8.86832,aliases:['Alpha Aquilae'],note:'A bright star in the Summer Triangle.'},
  {id:'Deneb',name:'Deneb',type:'Star',ra:20.69053,dec:45.28034,aliases:['Alpha Cygni'],note:'The tail of Cygnus and a member of the Summer Triangle.'},
  {id:'Betelgeuse',name:'Betelgeuse',type:'Star',ra:5.91953,dec:7.40706,aliases:['Alpha Orionis'],note:'The reddish shoulder of Orion.'},
  {id:'Rigel',name:'Rigel',type:'Star',ra:5.2423,dec:-8.20164,aliases:['Beta Orionis'],note:'The bright blue-white foot of Orion.'},
  {id:'Sirius',name:'Sirius',type:'Star',ra:6.75248,dec:-16.71612,aliases:['Alpha Canis Majoris','Dog Star'],note:'The brightest night-time star; low altitude can cause strong twinkling.'}
];
const byId=new Map(importedObjects.map(object=>[object.id,object]));
for(const object of familiarObjects){
 const imported=byId.get(object.id);
 byId.set(object.id,{...imported,...object,aliases:[...new Set([...(imported?.aliases||[]),...object.aliases])]});
}
export const catalogue=[...familiarObjects.map(object=>byId.get(object.id)),...byId.values()].filter((object,index,all)=>all.findIndex(other=>other.id===object.id)===index);
