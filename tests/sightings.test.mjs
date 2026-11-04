import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSightingsStore,SIGHTINGS_KEY,SIGHTINGS_FORMAT,parseSightings,preferUnseen} from '../prototype/sightings-store.js';
const allowedIds=new Set(['Saturn','Moon','M31']);
const record=(id='s1',objectId='Saturn')=>({id,objectId,observedAt:'2026-11-01T03:30:00.000Z',zone:'America/Edmonton',site:{label:'My observing site',latitude:50.68,longitude:-114.25,confirmed:true},eyepiece:{id:'zoom',name:'My zoom',mm:9.5,power:1200/9.5}});
const backup=records=>JSON.stringify({format:SIGHTINGS_FORMAT,version:1,records});
function memory(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),data};}
function setup(storage=memory()){return {storage,store:createSightingsStore({storage,allowedIds})};}
test('confirmed sightings preserve time, site and fitted setting through reload and repeated visits',()=>{
 const {store,storage}=setup(),r=record();store.add(r);r.site.label='Changed';r.eyepiece.mm=21;assert.equal(store.snapshot().records[0].site.label,'My observing site');assert.equal(store.snapshot().records[0].eyepiece.mm,9.5);
 store.add(record('s2'));assert.equal(store.snapshot().records.length,2);assert.equal(store.add(record()),false);const reloaded=createSightingsStore({storage,allowedIds});assert.deepEqual(reloaded.snapshot().records,[record(),record('s2')]);
 const copy=reloaded.snapshot();copy.records[0].site.latitude=0;assert.equal(reloaded.snapshot().records[0].site.latitude,50.68);
});
test('undo operations remove or restore only the intended record with its original timestamp',()=>{
 const {store}=setup();store.add(record());store.add(record('s2','Moon'));const removed=store.remove('s1');assert.deepEqual(store.snapshot().records,[record('s2','Moon')]);store.add(removed);assert.equal(store.snapshot().records.find(r=>r.id==='s1').observedAt,record().observedAt);assert.equal(store.remove('not-there'),null);
});
test('backup restore merges sightings and skips identical IDs; invalid or conflicting files change nothing',()=>{
 const {store,storage}=setup();store.add(record());assert.equal(store.restore(backup([record(),record('s2','Moon')])),1);assert.equal(store.restore(store.export().text),0);const before=storage.getItem(SIGHTINGS_KEY);
 for(const text of ['not JSON',backup([{...record('s3'),site:{...record().site,latitude:100}}]),backup([record('x'),record('x')]),backup([{...record(),observedAt:'2026-11-02T03:30:00.000Z'}])]){assert.throws(()=>store.restore(text));assert.equal(storage.getItem(SIGHTINGS_KEY),before);}
 assert.equal(parseSightings(store.export().text,allowedIds).length,2);
});
test('unreadable data stays intact and can be downloaded before explicitly replacing it with a validated backup',()=>{
 const storage=memory();storage.setItem(SIGHTINGS_KEY,'{broken');const {store}=setup(storage);assert.ok(store.snapshot().error);assert.throws(()=>store.add(record()));assert.deepEqual(store.export(),{text:'{broken',recovery:true});assert.throws(()=>store.restore(backup([record()])));assert.equal(storage.getItem(SIGHTINGS_KEY),'{broken');assert.equal(store.restore(backup([record()]),{replaceUnreadable:true}),1);assert.deepEqual(store.snapshot().records,[record()]);
});
test('storage refusal does not claim success or discard previous observations',()=>{
 const storage=memory();storage.setItem(SIGHTINGS_KEY,backup([record()]));const {store}=setup(storage);storage.setItem=()=>{throw Error('quota');};assert.throws(()=>store.add(record('s2')),/could not save/);assert.deepEqual(store.snapshot().records,[record()]);assert.equal(parseSightings(storage.getItem(SIGHTINGS_KEY),allowedIds).length,1);
 const blocked=createSightingsStore({storage:{getItem(){throw Error('denied');}},allowedIds});assert.ok(blocked.snapshot().error);assert.throws(()=>blocked.add(record()));
});
test('backup validation rejects unknown catalogues, unsupported versions, bad timezones and invalid optical settings',()=>{
 for(const bad of [{...record(),objectId:'invented'}, {...record(),zone:'Moon/Base'}, {...record(),observedAt:'tomorrow'}, {...record(),eyepiece:{...record().eyepiece,mm:0}}, {...record(),observedAt:'0001-01-01T00:00:00.000Z'}])assert.throws(()=>parseSightings(backup([bad]),allowedIds));
 assert.throws(()=>parseSightings(JSON.stringify({format:SIGHTINGS_FORMAT,version:3,records:[]}),allowedIds));assert.throws(()=>parseSightings(' '.repeat(8*1024*1024+1),allowedIds));
 const nakedEye={...record(),eyepiece:null};assert.equal(parseSightings(backup([nakedEye]),allowedIds)[0].eyepiece,null);
});
test('new-target preference keeps original ranking within groups and never hides seen favourites',()=>{
 const items=['Saturn','Moon','M31'].map(id=>({object:{id}})),seen=new Set(['Saturn']);assert.deepEqual(preferUnseen(items,seen).map(x=>x.object.id),['Moon','M31','Saturn']);assert.deepEqual(preferUnseen(items,seen,false),items);assert.deepEqual(preferUnseen(items,new Set(items.map(x=>x.object.id))),items);assert.equal(items[0].object.id,'Saturn');
});
test('new saves re-read other-tab observations instead of overwriting a stale snapshot',()=>{
 const storage=memory(),one=createSightingsStore({storage,allowedIds}),two=createSightingsStore({storage,allowedIds});one.add(record());two.add(record('s2','Moon'));assert.equal(two.snapshot().records.length,2);one.remove('s1');assert.deepEqual(one.snapshot().records,[record('s2','Moon')]);
});
