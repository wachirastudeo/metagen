const {test}=require('node:test'),assert=require('node:assert/strict');
const core=require('../extension/core.js'),backup=require('../extension/project-backup.js');
function fixture(){
  const base=core.createScenes({...core.defaults,episodes:1})[0],clips=new Map();
  function scene(id,shot){const blob=new Blob(['video '+id],{type:'video/mp4'});
    const clip={id,name:id+'.mp4',size:blob.size,type:'video/mp4',duration:1,width:320,height:180};clips.set(id,{...clip,blob});return {...base,id:'scene-'+shot,episode:1,shot,clip};}
  const scenes=[scene('a',1),scene('b',2)];scenes.push({...scenes[0],id:'scene-3',shot:3});
  let serial=0;const media={MAX_FILE:250*1024*1024,get:async id=>clips.get(id),inspect:async file=>({id:'restored-'+(++serial),name:file.name,size:file.size,type:file.type,duration:2,width:640,height:360,blob:file})};
  return {project:{version:1,settings:core.defaults,scenes,cast:[],assets:[]},media,clips};
}
async function rewrite(blob,edit){const bytes=Buffer.from(await blob.arrayBuffer()),length=bytes.readUInt32BE(8),header=JSON.parse(bytes.subarray(12,12+length).toString());edit(header);
  const encoded=Buffer.from(JSON.stringify(header)),prefix=Buffer.from(bytes.subarray(0,12));prefix.writeUInt32BE(encoded.length,8);
  return new Blob([prefix,encoded,bytes.subarray(12+length)]);
}
test('portable backup retains original bytes, deduplicates shared clips and remaps identities',async()=>{
  const f=fixture(),archive=await backup.create(f.project,{core,media:f.media}),parsed=await backup.read(archive,{core,media:f.media});
  assert.equal(parsed.files.length,2);assert.equal(await parsed.files[0].blob.text(),'video a');
  const result=await backup.prepare(parsed,{media:f.media});assert.equal(result.records.length,2);
  assert.equal(result.project.scenes[0].clip.id,'restored-1');assert.equal(result.project.scenes[2].clip.id,'restored-1');
  assert.equal(result.project.scenes[0].clip.duration,2);assert.equal(result.project.scenes[0].clip.width,640);
  assert.equal(f.project.scenes[0].clip.id,'a');
});
test('missing local media prevents producing an incomplete backup',async()=>{
  const f=fixture();f.clips.delete('b');await assert.rejects(backup.create(f.project,{core,media:f.media}),/b.mp4/);
});
test('corrupt media fails checksum before decoder or storage is invoked',async()=>{
  const f=fixture(),blob=await backup.create(f.project,{core,media:f.media}),bytes=new Uint8Array(await blob.arrayBuffer());bytes[bytes.length-1]^=1;
  const parsed=await backup.read(new Blob([bytes]),{core,media:f.media});let inspected=0;
  await assert.rejects(backup.prepare(parsed,{media:{...f.media,inspect:async file=>{inspected++;return f.media.inspect(file);}}}),/เสียหาย/);
  assert.equal(inspected,1); // a passes; corrupt b never reaches the decoder
});
test('rejects truncated payloads, trailing bytes, unsupported versions and invalid file manifests',async()=>{
  const f=fixture(),blob=await backup.create(f.project,{core,media:f.media});
  for(const bad of [blob.slice(0,blob.size-1),new Blob([blob,'extra']),await rewrite(blob,h=>h.version=99),await rewrite(blob,h=>h.files.push(h.files[0])),await rewrite(blob,h=>h.files.pop()),await rewrite(blob,h=>h.files[0].size=-1),await rewrite(blob,h=>h.files[0].type='text/html')])
    await assert.rejects(backup.read(bad,{core,media:f.media}));
});
test('empty draft projects can be backed up and restored without files',async()=>{
  const f=fixture();f.project.scenes=[];const blob=await backup.create(f.project,{core,media:f.media});
  const result=await backup.prepare(await backup.read(blob,{core,media:f.media}),{media:f.media});assert.equal(result.records.length,0);assert.equal(result.project.scenes.length,0);
});
test('cancellation prevents completing backup creation or restore preparation',async()=>{
  const f=fixture(),controller=new AbortController();controller.abort();
  await assert.rejects(backup.create(f.project,{core,media:f.media,signal:controller.signal}),{name:'AbortError'});
  const parsed=await backup.read(await backup.create(f.project,{core,media:f.media}),{core,media:f.media});
  await assert.rejects(backup.prepare(parsed,{media:f.media,signal:controller.signal}),{name:'AbortError'});
});
test('oversized header declarations fail before allocating or decoding their contents',async()=>{
  const prefix=Buffer.alloc(12);prefix.write('SCPILOT1');prefix.writeUInt32BE(backup.MAX_HEADER+1,8);
  const f=fixture();await assert.rejects(backup.read(new Blob([prefix]),{core,media:f.media}),/ส่วนหัว/);
});
test('the current reader restores legacy version 1 clip-only backups',async()=>{
  const f=fixture(),current=await backup.create(f.project,{core,media:f.media});
  const legacy=await rewrite(current,header=>header.version=1);
  const parsed=await backup.read(legacy,{core,media:f.media});assert.equal(parsed.files.length,2);
  const restored=await backup.prepare(parsed,{media:f.media});assert.equal(restored.project.scenes[0].clip.id,'restored-1');
});
