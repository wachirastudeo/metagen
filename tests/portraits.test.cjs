const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const core=require('../extension/core.js'),backup=require('../extension/project-backup.js');
const portrait={id:'local-a',name:'alice.png',type:'image/png',size:8,width:128,height:128};
test('Thai character names stay in JSON while uploaded master filenames are ASCII',()=>{
  const p=project();p.cast[0].name='แม่ของฟ้า';p.assets[0].name='แม่ของฟ้า';
  const character=core.sceneJSON(p,p.scenes[0]).characters[0];
  assert.equal(character.name,'แม่ของฟ้า');
  assert.equal(character.reference.local_file.name,'character-asset-a-master.png');
  assert.equal(character.reference.local_file.name,core.portraitFilename(p.assets[0]));
  assert.match(character.reference.local_file.name,/^[A-Za-z0-9_.-]+$/);
});
function project(){return {version:1,settings:core.defaults,cast:[{id:'a',name:'Alice',role:'lead',description:'curly hair'}],assets:[{id:'asset-a',kind:'character',castId:'a',name:'Alice',description:'curly hair',image:'',pageUrl:'',portrait}],scenes:[{...core.createScenes(core.defaults)[0],castIds:['a']}]};}
test('local master portraits survive JSON and produce attachment metadata without a remote URL',()=>{
  const p=core.validateProject(project()),reference=core.sceneJSON(p,p.scenes[0]).characters[0].reference;
  assert.deepEqual(p.assets[0].portrait,portrait);assert.equal(reference.asset_id,'asset-a');assert.equal(reference.image_url,undefined);assert.equal(reference.attachment_number,1);assert.equal(reference.local_file.name,'Alice-asset-a-master.png');
  for(const invalid of [{id:''},{type:'image/svg+xml'},{size:10*1024*1024+1},{width:0},{height:8193}]){const bad=project();bad.assets[0].portrait={...portrait,...invalid};assert.throws(()=>core.validateProject(bad),/ภาพหลัก/);}
});
test('backups include portrait bytes and remap their file IDs while preserving character and asset identities',async()=>{
  const p=project(),blob=new Blob(['portrait'],{type:'image/png'}),media={MAX_FILE:250*1024*1024,MAX_IMAGE:10*1024*1024,get:async()=>({blob}),inspectImage:async file=>({...portrait,id:'restored-image',blob:file})};
  const archive=await backup.read(await backup.create(p,{core,media}),{core,media});assert.equal(archive.files[0].kind,'portrait');assert.equal(await archive.files[0].blob.text(),'portrait');
  const restored=await backup.prepare(archive,{media});assert.equal(restored.project.assets[0].portrait.id,'restored-image');assert.equal(restored.project.assets[0].id,'asset-a');assert.equal(restored.project.cast[0].id,'a');assert.equal(restored.records[0].kind,'portrait');
  await assert.rejects(backup.create(p,{core,media:{...media,get:async()=>undefined}}),/alice.png/);
});
test('image inspector verifies file signatures, limits and decoder success and releases bitmap resources',async()=>{
  let closed=0,decoded=0;const context={Blob,crypto,DOMException,createImageBitmap:async()=>{decoded++;return {width:128,height:128,close(){closed++;}};}};
  vm.createContext(context);vm.runInContext(fs.readFileSync('extension/studio-media.js','utf8'),context);
  const png=new Blob([Uint8Array.from([137,80,78,71,13,10,26,10])],{type:'text/html'});
  const result=await context.StudioMedia.inspectImage(png);assert.equal(result.type,'image/png');assert.equal(result.blob.type,'image/png');assert.equal(closed,1);
  await assert.rejects(context.StudioMedia.inspectImage(new Blob(['<svg/>'],{type:'image/png'})),/จริงเท่านั้น/);assert.equal(decoded,1);
  context.createImageBitmap=async()=>({width:9000,height:1,close(){closed++;}});await assert.rejects(context.StudioMedia.inspectImage(png),/ภาพใหญ่/);assert.equal(closed,2);
  context.createImageBitmap=async()=>{throw new Error('bad bytes');};await assert.rejects(context.StudioMedia.inspectImage(png),/อ่านไฟล์ภาพไม่ได้/);
  const controller=new AbortController();controller.abort();await assert.rejects(context.StudioMedia.inspectImage(png,{signal:controller.signal}),{name:'AbortError'});
});
test('missing local references block generation even when an old remote URL exists',async()=>{
  const nodes=new Map(),context={$:id=>{if(!nodes.has(id))nodes.set(id,{});return nodes.get(id);},document:{body:{}},MutationObserver:class{observe(){}},StudioMedia:{get:async()=>undefined}};
  vm.createContext(context);vm.runInContext(fs.readFileSync('extension/portrait-ui.js','utf8'),context);
  await assert.rejects(context.ensurePortraitReferences([{person:{name:'Alice'},asset:{portrait,image:'https://scontent.fbcdn.net/old.png'}}]),/Alice/);
});
test('a removed portrait preview cannot create an object URL after a delayed storage read',async()=>{
  let finish,created=0;const nodes=new Map(),context={$:id=>{if(!nodes.has(id))nodes.set(id,{});return nodes.get(id);},document:{body:{}},MutationObserver:class{observe(){}},StudioMedia:{get:()=>new Promise(resolve=>finish=resolve)},URL:{createObjectURL(){created++;return 'blob:test';},revokeObjectURL(){}}};
  vm.createContext(context);vm.runInContext(fs.readFileSync('extension/portrait-ui.js','utf8'),context);
  const image={isConnected:true,removeAttribute(){}};const loading=context.showPortrait({portrait},image);image.isConnected=false;
  finish({blob:new Blob(['portrait'])});await loading;assert.equal(created,0);assert.equal(image.hidden,true);
});
