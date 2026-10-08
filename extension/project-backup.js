/* Portable uncompressed backup: 8-byte magic, uint32 BE JSON length, JSON, media.
 * Blob slices retain file bytes; hashes are checked before any storage write. */
(function(root){
  const MAGIC='SCPILOT1',MAX_HEADER=5*1024*1024,MAX_MEDIA=600*1024*1024;
  const encoder=new TextEncoder();
  const aborted=signal=>{if(signal?.aborted)throw new DOMException('ยกเลิกการสำรอง/โหลด','AbortError');};
  async function hash(blob){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),byte=>byte.toString(16).padStart(2,'0')).join('');}
  function references(project){
    const refs=new Map();
    const add=(metadata,kind)=>{if(!metadata)return;const item={...metadata,kind},old=refs.get(item.id);
      if(old && JSON.stringify(old)!==JSON.stringify(item))throw new Error('ข้อมูลไฟล์ที่ใช้ซ้ำไม่ตรงกัน');refs.set(item.id,item);};
    for(const scene of project.scenes){add(scene.clip,'clip');add(scene.storyboard,'portrait');}
    for(const asset of project.assets || [])add(asset.portrait,'portrait');
    return refs;
  }
  async function create(project,{core,media,signal,onProgress=()=>{}}){
    const snapshot=core.validateProject(structuredClone(project)),refs=references(snapshot),files=[],parts=[];let total=0,index=0;
    for(const [id,clip] of refs){
      aborted(signal);onProgress(`เก็บไฟล์ ${++index}/${refs.size} · ${clip.name}`);
      const record=await media.get(id);
      if(!record?.blob)throw new Error(`ไม่พบไฟล์ ${clip.name} กรุณาเลือกคลิปหรือภาพหลักใหม่ก่อนสำรอง`);
      if(record.blob.size!==clip.size || clip.size>(clip.kind==='portrait'?media.MAX_IMAGE:media.MAX_FILE))throw new Error(`ข้อมูลไฟล์ ${clip.name} ไม่ตรงกับไฟล์ที่เก็บ`);
      total+=clip.size;if(total>MAX_MEDIA)throw new Error('ไฟล์รวมเกิน 600 MB กรุณาแยกโปรเจกต์ก่อนสำรอง');
      files.push({kind:clip.kind,id,size:clip.size,type:clip.type,name:clip.name,sha256:await hash(record.blob)});parts.push(record.blob);
    }
    aborted(signal);const header=encoder.encode(JSON.stringify({format:'scenepilot-backup',version:2,project:snapshot,files}));
    if(header.length>MAX_HEADER)throw new Error('รายละเอียดโปรเจกต์ใหญ่เกิน 5 MB');
    const prefix=new Uint8Array(12);prefix.set(encoder.encode(MAGIC));new DataView(prefix.buffer).setUint32(8,header.length);
    return new Blob([prefix,header,...parts],{type:'application/octet-stream'});
  }
  async function read(blob,{core,media}){
    if(blob.size<12 || blob.size>MAX_MEDIA+MAX_HEADER+12)throw new Error('ขนาดไฟล์สำรองไม่ถูกต้อง');
    const prefix=new Uint8Array(await blob.slice(0,12).arrayBuffer());
    if(new TextDecoder().decode(prefix.slice(0,8))!==MAGIC)throw new Error('ไม่ใช่ไฟล์สำรอง ScenePilot');
    const length=new DataView(prefix.buffer).getUint32(8);
    if(!length || length>MAX_HEADER || length+12>blob.size)throw new Error('ส่วนหัวไฟล์สำรองไม่ครบหรือใหญ่เกินกำหนด');
    let header;try{header=JSON.parse(await blob.slice(12,12+length).text());}catch{throw new Error('รายละเอียดไฟล์สำรองอ่านไม่ได้');}
    if(header?.format!=='scenepilot-backup' || ![1,2].includes(header.version) || !Array.isArray(header.files) || header.files.length>1860)throw new Error('รุ่นไฟล์สำรองไม่รองรับ');
    const project=core.validateProject(header.project),refs=references(project),seen=new Set(),files=[];let offset=12+length,total=0;
    for(const item of header.files){
      const clip=item && refs.get(item.id);
      if(!clip || seen.has(item.id) || item.kind!==clip.kind || !Number.isSafeInteger(item.size) || item.size<=0 || item.size>(item.kind==='portrait'?media.MAX_IMAGE:media.MAX_FILE) || item.size!==clip.size || item.type!==clip.type || item.name!==clip.name || typeof item.sha256!=='string' || !/^[a-f0-9]{64}$/.test(item.sha256))throw new Error('รายการไฟล์ในสำรองไม่ถูกต้อง');
      seen.add(item.id);total+=item.size;if(total>MAX_MEDIA || offset+item.size>blob.size)throw new Error('ไฟล์คลิปในสำรองไม่ครบหรือใหญ่เกินกำหนด');
      files.push({...item,blob:blob.slice(offset,offset+item.size,item.type)});offset+=item.size;
    }
    if(offset!==blob.size || seen.size!==refs.size)throw new Error('ไฟล์สำรองมีคลิปไม่ครบหรือมีข้อมูลส่วนเกิน');
    return {project,files};
  }
  async function prepare(archive,{media,signal,onProgress=()=>{}}){
    const project=structuredClone(archive.project),records=[],mapping=new Map();let index=0;
    for(const item of archive.files){
      aborted(signal);onProgress(`ตรวจไฟล์ ${++index}/${archive.files.length} · ${item.name}`);
      if(await hash(item.blob)!==item.sha256)throw new Error(`ไฟล์ ${item.name} เสียหาย กรุณาใช้ไฟล์สำรองใหม่`);
      aborted(signal);const inspect=item.kind==='portrait'?media.inspectImage:media.inspect;
      const record=await inspect(new File([item.blob],item.name,{type:item.type}),{signal});
      const {blob,...metadata}=record;records.push({...record,kind:item.kind});mapping.set(item.id,metadata);
    }
    aborted(signal);for(const scene of project.scenes){if(scene.clip)scene.clip={...mapping.get(scene.clip.id)};if(scene.storyboard)scene.storyboard={...mapping.get(scene.storyboard.id)};}
    for(const asset of project.assets || [])if(asset.portrait)asset.portrait={...mapping.get(asset.portrait.id)};
    return {project,records};
  }
  const api={create,read,prepare,MAX_HEADER,MAX_MEDIA};if(typeof module!=='undefined')module.exports=api;else root.ProjectBackup=api;
})(globalThis);
