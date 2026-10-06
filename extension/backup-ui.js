let backupController=null;
function lockProjectControls(){
  const controls=[...document.querySelectorAll('button,input,textarea,select')].filter(node=>node.id!=='backup-cancel');
  const states=controls.map(node=>[node,node.disabled]);for(const [node] of states)node.disabled=true;
  return ()=>{for(const [node,disabled] of states)if(node.isConnected)node.disabled=disabled;};
}
async function runBackupOperation(action){
  if(projectWorkInProgress())return notice('รองานปัจจุบันเสร็จก่อนสำรองหรือโหลดโปรเจกต์');
  projectIOBusy=true;backupController=new AbortController();const unlock=lockProjectControls();
  $('backup-tools').open=true;$('backup-cancel').hidden=false;$('backup-cancel').disabled=false;
  const progress=message=>{$('backup-status').textContent=message;};
  try{await action({signal:backupController.signal,onProgress:progress});}
  catch(error){progress(error.name==='AbortError'?'ยกเลิกแล้ว โปรเจกต์เดิมยังอยู่':error.message);notice($('backup-status').textContent);}
  finally{projectIOBusy=false;backupController=null;$('backup-cancel').hidden=true;unlock();refreshProject();}
}
$('backup-project').onclick=()=>runBackupOperation(async options=>{
  const snapshot=structuredClone(project);
  const blob=await ProjectBackup.create(snapshot,{core,media:StudioMedia,...options});
  StudioMedia.download(blob,StudioMedia.filename(snapshot.settings.title,'backup','scenepilot'));
  $('backup-status').textContent='ดาวน์โหลดไฟล์สำรองพร้อมสื่อแล้ว';notice('สำรองบท คลิปและภาพหลักที่เลือกแล้วในไฟล์เดียว');
});
async function restoreProjectBackup(file){
  return runBackupOperation(async options=>{
    $('backup-status').textContent='กำลังอ่านไฟล์สำรอง…';
    const archive=await ProjectBackup.read(file,{core,media:StudioMedia});
    if(options.signal.aborted)throw new DOMException('ยกเลิก','AbortError');
    if(project.scenes.length && !confirm(`โหลด “${archive.project.settings.title || 'โปรเจกต์'}” พร้อม ${archive.files.length} ไฟล์ แทนงานปัจจุบัน?`)){
      $('backup-status').textContent='ยกเลิกแล้ว โปรเจกต์เดิมยังอยู่';return;
    }
    const prepared=await ProjectBackup.prepare(archive,{media:StudioMedia,...options});
    if(options.signal.aborted)throw new DOMException('ยกเลิก','AbortError');
    $('backup-cancel').disabled=true;$('backup-status').textContent='บันทึกไฟล์และโปรเจกต์…';
    await StudioMedia.putMany(prepared.records);
    await installProject(prepared.project);
    $('backup-status').textContent=`โหลดสำเร็จ ${prepared.project.scenes.length} ซีน · ${prepared.records.filter(r=>r.kind==='clip').length} คลิป · ${prepared.records.filter(r=>r.kind==='portrait').length} ภาพหลัก`;
    notice($('backup-status').textContent);
  });
}
async function restoreProjectJSON(file){
  return runBackupOperation(async options=>{
    if(file.size>5_000_000)throw new Error('ไฟล์ JSON ใหญ่เกิน 5 MB');
    $('backup-status').textContent='อ่านโปรเจกต์ JSON…';
    const loaded=core.validateProject(JSON.parse(await file.text()));
    if(options.signal.aborted)throw new DOMException('ยกเลิก','AbortError');
    if(project.scenes.length && !confirm('โหลดโปรเจกต์นี้แทนงานปัจจุบัน?')){
      $('backup-status').textContent='ยกเลิกแล้ว โปรเจกต์เดิมยังอยู่';return;
    }
    $('backup-cancel').disabled=true;await installProject(loaded);
    const hasLocalMedia=loaded.scenes.some(scene=>scene.clip) || loaded.assets.some(asset=>asset.portrait);
    $('backup-status').textContent=hasLocalMedia?'โหลด JSON แล้ว หากไฟล์คลิปหรือภาพหลักไม่อยู่ในเครื่องนี้ให้เลือกใหม่ หรือโหลดไฟล์สำรอง .scenepilot':'โหลดโปรเจกต์แล้ว';
    notice($('backup-status').textContent);
  });
}
$('backup-cancel').onclick=()=>backupController?.abort();
