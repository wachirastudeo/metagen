/* One durable opening keyframe per ten-second scene. */
let selectedBoardId=null,boardRenderVersion=0;
function currentBoard(){return project.scenes.find(scene=>scene.id===selectedBoardId);}
function renderStoryboards(){
  const filter=$('board-episode'),previous=Number(filter.value),episodes=[...new Set(project.scenes.map(scene=>scene.episode))].sort((a,b)=>a-b);
  filter.replaceChildren();for(const episode of episodes){const option=document.createElement('option');option.value=episode;option.textContent=`ตอนที่ ${episode}`;filter.append(option);}
  if(episodes.includes(previous))filter.value=String(previous);filter.disabled=!episodes.length;
  const scenes=project.scenes.filter(scene=>scene.episode===Number(filter.value));
  if(!scenes.some(scene=>scene.id===selectedBoardId))selectedBoardId=scenes[0]?.id;
  $('board-progress').textContent=`มีภาพ ${project.scenes.filter(scene=>scene.storyboard).length}/${project.scenes.length} ซีน · ซีนละ 10 วินาที`;
  $('board-list').replaceChildren();
  if(!scenes.length){const empty=document.createElement('p');empty.textContent='สร้างพล็อตและซีนก่อนเตรียมภาพสตอรี่บอร์ด';$('board-list').append(empty);}
  for(const scene of scenes){const button=document.createElement('button');button.className='secondary wide';button.textContent=`ซีน ${scene.shot} · 10 วินาที · ${scene.storyboard?'มีภาพแล้ว':'ยังขาดภาพ'}`;button.setAttribute('aria-pressed',String(scene.id===selectedBoardId));button.onclick=()=>{selectedBoardId=scene.id;renderStoryboards();};$('board-list').append(button);}
  renderBoardEditor();
}
async function renderBoardEditor(){
  const version=++boardRenderVersion,scene=currentBoard(),image=$('board-image');releasePortrait(image);image.hidden=true;$('board-editor').hidden=!scene;if(!scene)return;
  $('board-title').textContent=`ตอน ${scene.episode} · ซีน ${scene.shot} · 10 วินาที`;$('board-description').value=scene.description;$('board-dialogue').value=scene.dialogue;$('board-background-count').value=scene.backgroundCount ?? 0;
  renderSceneCast(scene,'board-cast',()=>{renderBoardEditor();renderList();});
  renderSceneLocation(scene,'board-location','board-location-image');
  $('board-download').disabled=!scene.storyboard;$('board-status').textContent=scene.storyboard?`${scene.storyboard.name} · เก็บในเครื่องแล้ว`:'ยังไม่มีภาพสตอรี่บอร์ด';
  renderBoardPrompt(scene);
  if(scene.storyboard){await showPortrait({portrait:scene.storyboard},image);if(version!==boardRenderVersion)return;if(image.hidden)$('board-status').textContent='ไม่พบภาพในเครื่องนี้ เลือกไฟล์ใหม่หรือโหลดไฟล์สำรอง';}
}
function renderBoardPrompt(scene){
  $('board-status').textContent=scene.storyboard?`${scene.storyboard.name} · เก็บในเครื่องแล้ว`:'ยังไม่มีภาพสตอรี่บอร์ด';
  try{$('board-prompt').value=core.storyboardPrompt(project,scene);$('board-fill').disabled=!scene.description.trim();$('board-copy').disabled=!scene.description.trim();if(!scene.description.trim())$('board-status').textContent='ใส่เหตุการณ์ของซีนก่อนสร้างภาพ';}
  catch(error){$('board-prompt').value='';$('board-fill').disabled=true;$('board-copy').disabled=true;$('board-status').textContent=error.message;}
}
for(const [id,key] of [['board-description','description'],['board-dialogue','dialogue']])$(id).oninput=()=>{
  const scene=currentBoard();if(!scene || projectWorkInProgress())return;const automatic=scene.prompt===core.prompt(project.settings,scene);scene[key]=$(id).value;if(automatic)scene.prompt=core.prompt(project.settings,scene);scene.status='draft';persist();renderSceneCast(scene,'board-cast',()=>{renderBoardEditor();renderList();});renderBoardPrompt(scene);
};
$('board-background-count').oninput=()=>{const scene=currentBoard(),count=Number($('board-background-count').value);if(!scene || projectWorkInProgress() || !Number.isInteger(count) || count<0 || count>12)return;scene.backgroundCount=count;scene.status='draft';persist();renderBoardPrompt(scene);};
$('board-background-count').onchange=()=>{const scene=currentBoard(),count=Number($('board-background-count').value);if(scene && (!Number.isInteger(count) || count<0 || count>12)){$('board-background-count').value=scene.backgroundCount ?? 0;notice('จำนวนคนในฉากหลังต้องเป็นจำนวนเต็ม 0–12');}};
$('board-episode').onchange=()=>{selectedBoardId=null;renderStoryboards();};
$('board-location').onchange=()=>{const scene=currentBoard();if(!scene || projectWorkInProgress())return;scene.locationId=$('board-location').value;scene.status='draft';persist();renderBoardEditor();};
$('board-copy').onclick=async()=>{try{await navigator.clipboard.writeText(core.storyboardPrompt(project,currentBoard()));notice('คัดลอก JSON สตอรี่บอร์ดแล้ว');}catch(error){notice(error.message);}};
$('board-fill').onclick=async()=>{
  const scene=currentBoard();if(!scene || projectWorkInProgress())return notice('รองานปัจจุบันเสร็จก่อน');if(!scene.description.trim())return notice('ใส่เหตุการณ์ของซีนก่อน');
  busy=true;const unlock=lockProjectControls();
  try{const refs=core.sceneImageReferences(project,scene);await ensurePortraitReferences(refs);const attachments=await portraitAttachments(refs),result=await meta('fill',core.storyboardPrompt(project,scene),attachments);if(!result.ok)throw new Error(result.error);notice(refs.length && !attachments?'ใส่พร้อมต์แล้ว แนบภาพหลักตามลำดับ JSON แล้วกด Send':'ใส่พร้อมต์ภาพแล้ว ตรวจภาพอ้างอิงและกด Send บน Meta AI');}
  catch(error){notice(error.message);}finally{busy=false;unlock();}
};
$('board-file').onchange=async()=>{
  const scene=currentBoard(),file=$('board-file').files[0];if(!scene || !file || projectWorkInProgress())return;
  const owner=project;portraitSaving=true;const unlock=lockProjectControls();$('board-status').textContent='กำลังตรวจและบันทึกภาพซีน…';
  try{const record=await StudioMedia.inspectImage(file),{blob,...metadata}=record;await StudioMedia.putMany([record]);if(owner!==project || !owner.scenes.includes(scene))throw new Error('โปรเจกต์เปลี่ยน กรุณาเลือกภาพใหม่');const next=structuredClone(owner);next.scenes.find(item=>item.id===scene.id).storyboard=metadata;await writeProject(next);scene.storyboard=metadata;notice('เก็บภาพสตอรี่บอร์ดให้ซีนนี้แล้ว');}
  catch(error){notice(error.message);}finally{portraitSaving=false;$('board-file').value='';unlock();renderStoryboards();}
};
$('board-download').onclick=async()=>{
  const scene=currentBoard();if(!scene?.storyboard)return;
  try{const record=await StudioMedia.get(scene.storyboard.id);if(!record?.blob)throw new Error('ไม่พบไฟล์ภาพสตอรี่บอร์ด');StudioMedia.download(record.blob,scene.storyboard.name);}catch(error){notice(error.message);}
};
$('board-video').onclick=()=>{const scene=currentBoard();if(!scene)return;selectedId=scene.id;$('episode-filter').value=String(scene.episode);page('scenes');};
