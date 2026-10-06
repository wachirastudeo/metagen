/* Local master images share the media store with clips; object URLs stay out of JSON. */
let portraitSaving=false;
const portraitViews=new Map();
function releasePortrait(image){const view=portraitViews.get(image);if(view?.url)URL.revokeObjectURL(view.url);view?.note?.remove();portraitViews.delete(image);image.removeAttribute('src');}
async function showPortrait(asset,image){
  releasePortrait(image);image.hidden=true;const view={url:null};portraitViews.set(image,view);
  try{
    let src=asset.image;
    if(asset.portrait){const record=await StudioMedia.get(asset.portrait.id);if(!record?.blob)throw new Error('ไม่พบไฟล์ภาพหลัก เลือกภาพใหม่หรือโหลดไฟล์สำรอง');
      if(portraitViews.get(image)!==view || !image.isConnected)return;view.url=URL.createObjectURL(record.blob);src=view.url;}
    if(!src)return;image.src=src;image.hidden=false;
    image.onerror=()=>{if(portraitViews.get(image)===view){image.hidden=true;image.title='เปิดภาพไม่ได้ เลือกภาพหลักจากเครื่องใหม่';if(!view.note){view.note=document.createElement('small');view.note.textContent=image.title;image.parentElement?.append(view.note);}}};
  }catch(error){if(portraitViews.get(image)===view && image.isConnected){image.hidden=true;image.title=error.message;view.note=document.createElement('small');view.note.textContent=error.message;image.parentElement?.append(view.note);}}
}
new MutationObserver(()=>{for(const [image,view] of portraitViews)if(!image.isConnected){if(view.url)URL.revokeObjectURL(view.url);portraitViews.delete(image);}}).observe(document.body,{childList:true,subtree:true});
async function downloadPortrait(asset){
  try{
    if(!asset?.portrait){if(asset?.image)window.open(asset.image,'_blank','noopener');return;}
    const record=await StudioMedia.get(asset.portrait.id);if(!record?.blob)throw new Error('ไม่พบไฟล์ภาพหลัก กรุณาเลือกภาพใหม่');
    StudioMedia.download(record.blob,core.portraitFilename(asset));
  }catch(error){notice(error.message);}
}
async function ensurePortraitReferences(references){
  for(const {person,asset} of references)if(asset?.portrait){const record=await StudioMedia.get(asset.portrait.id);
    if(!record?.blob || record.blob.size!==asset.portrait.size)throw new Error(`ไม่พบไฟล์ภาพหลักของ ${person.name} เลือกภาพใหม่หรือโหลดไฟล์สำรองก่อนส่ง`);}
}
async function portraitAttachments(references){
  // Mixed online/local masters retain the manual path to preserve ordering.
  if(!references.length || references.some(ref=>!ref.asset?.portrait))return undefined;
  const files=[];let total=0;
  for(const {person,asset} of references){
    const record=await StudioMedia.get(asset.portrait.id);
    if(!record?.blob || record.blob.size!==asset.portrait.size)throw new Error(`ไม่พบไฟล์ภาพหลักของ ${person.name}`);
    total+=record.blob.size;
    if(total>20*1024*1024)throw new Error('ภาพหลักรวมเกิน 20 MB ลดขนาดภาพก่อนส่ง หรือคัดลอก JSON แล้วแนบภาพเอง');
    const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('อ่านภาพหลักไม่สำเร็จ'));reader.readAsDataURL(record.blob);});
    files.push({name:core.portraitFilename(asset),type:asset.portrait.type,base64:data.slice(data.indexOf(',')+1)});
  }
  return files;
}
function chooseCharacterPortrait(person){
  if(projectWorkInProgress())return notice('รองานปัจจุบันเสร็จก่อนเปลี่ยนภาพหลัก');
  if(!person.name.trim())return notice('ใส่ชื่อตัวละครก่อนเลือกภาพหลัก');
  try{project.assets=core.syncAssets(project.assets || [],project.cast);selectedAssetId=project.assets.find(a=>a.castId===person.id).id;$('asset-portrait-file').click();}
  catch(error){notice(error.message);}
}
function renderPortraitEditor(asset){
  const image=$('asset-master-image');releasePortrait(image);image.hidden=true;if(asset.portrait || asset.image)showPortrait(asset,image);
  $('asset-portrait-status').textContent=asset.portrait?`${asset.portrait.name} · เก็บในเครื่องแล้ว`:'เลือกภาพหลักจากเครื่องเพื่อเก็บไฟล์ถาวร';
  $('asset-portrait-download').disabled=!asset.portrait && !asset.image;$('asset-portrait-file').disabled=projectWorkInProgress();
}
$('asset-portrait-file').onchange=async()=>{
  const asset=currentAsset(),file=$('asset-portrait-file').files[0];if(!asset || !file || projectWorkInProgress())return;
  const owner=project;portraitSaving=true;const unlock=lockProjectControls();$('asset-portrait-status').textContent='ตรวจและบันทึกภาพหลัก…';
  try{
    const record=await StudioMedia.inspectImage(file);const {blob,...portrait}=record;await StudioMedia.putMany([record]);
    if(owner!==project || !owner.assets.includes(asset))throw new Error('โปรเจกต์เปลี่ยน กรุณาเลือกภาพหลักใหม่');
    const next=structuredClone(project);next.assets.find(a=>a.id===asset.id).portrait=portrait;
    await writeProject(next);asset.portrait=portrait;notice('เก็บภาพหลักแล้ว ใช้ไฟล์เดียวกันทุกซีนและรวมในไฟล์สำรองได้');
  }catch(error){notice(error.message);}
  finally{portraitSaving=false;$('asset-portrait-file').value='';unlock();renderCast();renderAssets();if(selected())renderSceneCast(selected());}
};
$('asset-portrait-download').onclick=()=>downloadPortrait(currentAsset());
