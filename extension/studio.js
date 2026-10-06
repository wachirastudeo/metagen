/* Episode library UI. Project JSON stores clip metadata; IndexedDB stores the files. */
let studioPlayback=[],studioPlaybackIndex=0,studioURL,sceneClipURL,clipRenderVersion=0,assemblyController=null;
let studioAvailability=new Map(),studioRenderVersion=0,clipSaving=false,studioPlaybackVersion=0;
function stopStudioPlayback(){
  studioPlaybackVersion++;studioPlayback=[];const player=$('preview-player');player.pause();player.removeAttribute('src');player.load();player.hidden=true;
  if(studioURL){URL.revokeObjectURL(studioURL);studioURL=null;}
}
function resetStudioForProject(){
  stopStudioPlayback();studioRenderVersion++;clipRenderVersion++;
  const player=$('scene-clip-player');player.pause();player.removeAttribute('src');player.load();player.hidden=true;
  if(sceneClipURL){URL.revokeObjectURL(sceneClipURL);sceneClipURL=null;}
  $('preview-status').textContent='เลือกตอนเพื่อเริ่มดู';$('assembly-job').hidden=true;
}
async function renderSceneClip(scene){
  const version=++clipRenderVersion,player=$('scene-clip-player');player.pause();player.removeAttribute('src');player.load();player.hidden=true;
  if(sceneClipURL){URL.revokeObjectURL(sceneClipURL);sceneClipURL=null;}
  $('scene-clip-download').disabled=true;$('scene-clip-file').disabled=clipSaving || busy || !!assemblyController || projectIOBusy;
  $('scene-clip-status').textContent=scene.clip?`กำลังอ่าน ${scene.clip.name}…`:'ยังไม่มีไฟล์วิดีโอของซีนนี้';
  if(!scene.clip)return;
  try{
    const clip=await StudioMedia.get(scene.clip.id);if(version!==clipRenderVersion)return;
    if(!clip?.blob){$('scene-clip-status').textContent=`ไม่พบไฟล์ ${scene.clip.name} ในเครื่องนี้ กรุณาเลือกไฟล์อีกครั้ง`;return;}
    sceneClipURL=URL.createObjectURL(clip.blob);player.src=sceneClipURL;player.hidden=false;
    $('scene-clip-status').textContent=`${clip.name} · ${clip.duration.toFixed(1)} วินาที · ${(clip.size/1048576).toFixed(1)} MB`;
    $('scene-clip-download').disabled=projectIOBusy;
  }catch(error){if(version===clipRenderVersion)$('scene-clip-status').textContent=error.message;}
}
$('scene-clip-file').onchange=async()=>{
  const scene=selected(),file=$('scene-clip-file').files[0];if(!scene || !file || clipSaving || assemblyController || projectIOBusy)return;
  const owner=project;
  clipSaving=true;$('scene-clip-file').disabled=true;$('scene-clip-status').textContent='กำลังตรวจและบันทึกไฟล์…';
  try{const clip=await StudioMedia.save(file);if(project!==owner || !owner.scenes.includes(scene))return notice('ชุดฉากเปลี่ยนระหว่างบันทึก กรุณาเลือกคลิปให้ซีนใหม่อีกครั้ง');
    const next=structuredClone(owner),savedScene=next.scenes.find(item=>item.id===scene.id);savedScene.clip=clip;savedScene.status='done';
    await writeProject(next);
    scene.clip=clip;scene.status='done';if(selected()?.id===scene.id){renderList();renderEditor();}notice('เก็บไฟล์ซีนแล้ว ดูและรวมเป็นตอนในพรีวิวหนังได้');}
  catch(error){notice(error.message);}
  finally{clipSaving=false;$('scene-clip-file').value='';if(selected())renderSceneClip(selected());}
};
$('scene-clip-download').onclick=async()=>{
  const scene=selected();if(!scene?.clip)return;
  try{const clip=await StudioMedia.get(scene.clip.id);if(!clip?.blob)throw new Error('ไม่พบไฟล์คลิป กรุณาเลือกไฟล์ใหม่');StudioMedia.download(clip.blob,clip.name);}catch(error){notice(error.message);}
};
async function renderStudio(){
  const version=++studioRenderVersion,scenes=StudioMedia.ordered(project.scenes),list=$('preview-scenes');list.replaceChildren();studioAvailability=new Map();
  $('series-play').disabled=true;$('series-download').disabled=true;
  if(!scenes.length){$('series-progress').textContent='ยังไม่มีตอน เริ่มสร้างพล็อตและซีนก่อน';return;}
  $('series-progress').textContent='กำลังตรวจไฟล์คลิป…';
  try{
    const checks=await Promise.all(scenes.map(async scene=>[scene.id,!!(scene.clip && (await StudioMedia.get(scene.clip.id))?.blob)]));
    if(version!==studioRenderVersion)return;studioAvailability=new Map(checks);
    const episodes=[...new Set(scenes.map(scene=>scene.episode))];
    const available=scenes.filter(scene=>studioAvailability.get(scene.id)).length;
    $('series-progress').textContent=`${project.settings.title || 'ซีรีส์ของคุณ'} · ${episodes.length} ตอน · มีไฟล์ ${available}/${scenes.length} ซีน`;
    $('series-play').disabled=available!==scenes.length || !!assemblyController || projectIOBusy;
    $('series-download').disabled=available!==scenes.length || !!assemblyController || projectIOBusy;
    for(const episode of episodes){
      const items=scenes.filter(scene=>scene.episode===episode),ready=items.filter(scene=>studioAvailability.get(scene.id)).length;
      const card=document.createElement('article');card.className='episode-card';
      const title=document.createElement('h3');title.textContent=`ตอน ${episode} · มีไฟล์ ${ready}/${items.length} ซีน`;
      const duration=document.createElement('p');duration.className='hint';duration.textContent=`ความยาวคลิปที่มี ${(items.filter(scene=>studioAvailability.get(scene.id)).reduce((sum,scene)=>sum+scene.clip.duration,0)).toFixed(1)} วินาที`;
      const actions=document.createElement('div');actions.className='two';
      const play=document.createElement('button');play.className='secondary';play.textContent='▶ ดูตอนนี้';play.disabled=ready!==items.length || !!assemblyController || projectIOBusy;play.onclick=()=>playStudio(items);
      const download=document.createElement('button');download.className='primary';download.textContent='รวมและโหลดตอนนี้';download.disabled=ready!==items.length || !!assemblyController || projectIOBusy;download.onclick=()=>exportStudio(items,`episode-${String(episode).padStart(2,'0')}`);
      actions.append(play,download);card.append(title,duration,actions);
      const rows=document.createElement('ol');rows.className='episode-scenes';
      for(const scene of items){const row=document.createElement('li'),text=document.createElement('span'),edit=document.createElement('button');text.textContent=`ซีน ${scene.shot} · ${studioAvailability.get(scene.id)?scene.clip.name:'ยังขาดไฟล์'}`;
        if(scene.result?.trim()){const note=document.createElement('p');note.className='hint';note.textContent=`หมายเหตุ: ${scene.result}`;text.append(note);}
        edit.textContent='เปิดซีน';edit.className='text-button';edit.disabled=!!assemblyController || projectIOBusy;edit.onclick=()=>{selectedId=scene.id;$('episode-filter').value=String(scene.episode);page('scenes');};row.append(text,edit);rows.append(row);}
      card.append(rows);list.append(card);
    }
  }catch(error){if(version===studioRenderVersion)$('series-progress').textContent=error.message;}
}
async function playStudio(items){
  if(projectIOBusy)return;
  stopStudioPlayback();studioPlayback=structuredClone(items);studioPlaybackIndex=0;
  const version=studioPlaybackVersion;
  try{await playStudioScene(version);}catch(error){if(version===studioPlaybackVersion){stopStudioPlayback();notice(error.message);}}
}
async function playStudioScene(version=studioPlaybackVersion){
  const scene=studioPlayback[studioPlaybackIndex];if(!scene)return;
  const clip=scene.clip && await StudioMedia.get(scene.clip.id);if(version!==studioPlaybackVersion)return;
  if(!clip?.blob)throw new Error(`ตอน ${scene.episode} ซีน ${scene.shot} ยังไม่มีไฟล์`);
  const player=$('preview-player');player.pause();if(studioURL)URL.revokeObjectURL(studioURL);
  studioURL=URL.createObjectURL(clip.blob);player.src=studioURL;player.hidden=false;
  $('preview-status').textContent=`กำลังดู ตอน ${scene.episode} · ซีน ${scene.shot} (${studioPlaybackIndex+1}/${studioPlayback.length})`;
  await player.play();
}
$('preview-player').onended=async()=>{
  if(!studioPlayback.length)return;
  const version=studioPlaybackVersion;
  if(++studioPlaybackIndex>=studioPlayback.length){$('preview-status').textContent='เล่นครบแล้ว';studioPlayback=[];return;}
  try{await playStudioScene(version);}catch(error){if(version===studioPlaybackVersion){stopStudioPlayback();notice(error.message);}}
};
$('preview-player').onerror=()=>{if(studioPlayback.length){stopStudioPlayback();notice('เล่นคลิปไม่ได้ กรุณาเลือกไฟล์ซีนนี้ใหม่');}};
$('series-play').onclick=()=>playStudio(StudioMedia.ordered(project.scenes));
$('series-download').onclick=()=>exportStudio(StudioMedia.ordered(project.scenes),'complete-series');
async function exportStudio(items,suffix){
  if(assemblyController || projectIOBusy)return;
  stopStudioPlayback();assemblyController=new AbortController();const snapshot=structuredClone(items),settings={...project.settings};
  $('assembly-job').hidden=false;$('assembly-cancel').disabled=false;$('assembly-progress').value=0;$('assembly-status').textContent='ตรวจไฟล์ก่อนรวม…';
  renderStudio();
  const visibility=()=>{if(document.hidden)assemblyController?.abort();};document.addEventListener('visibilitychange',visibility);
  try{
    const blob=await StudioMedia.assemble(snapshot,{orientation:settings.orientation,signal:assemblyController.signal,onProgress:({index,total,scene,elapsed,duration})=>{
      $('assembly-progress').value=((index+Math.min(1,elapsed/duration))/total)*100;
      $('assembly-status').textContent=`รวมตอน ${scene.episode} ซีน ${scene.shot} · ไฟล์ ${index+1}/${total} · ${elapsed.toFixed(1)}/${duration.toFixed(1)} วินาที`;
    }});
    StudioMedia.download(blob,StudioMedia.filename(settings.title,suffix,'webm'));
    $('assembly-progress').value=100;$('assembly-status').textContent='รวมสำเร็จ ดาวน์โหลดไฟล์ WebM แล้ว';notice('รวมภาพและเสียงเป็นไฟล์เดียวสำเร็จ');
  }catch(error){$('assembly-status').textContent=error.name==='AbortError'?'ยกเลิกการรวมแล้ว คลิปต้นฉบับยังอยู่':error.message;notice($('assembly-status').textContent);}
  finally{document.removeEventListener('visibilitychange',visibility);assemblyController=null;$('assembly-cancel').disabled=true;renderStudio();}
}
$('assembly-cancel').onclick=()=>assemblyController?.abort();
