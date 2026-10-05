const $ = id => document.getElementById(id);
const core = SceneCore;
const extensionMode = !!globalThis.chrome?.runtime?.id;
let project = { version:1, settings:{...core.defaults}, scenes:[],cast:[] }, selectedId = null, busy=false;
let saveChain=Promise.resolve(), noticeTimer;
let selectedAssetId=null, mediaImages=[], imageJob=null, imagePoll=null, imagePollBusy=false;
const statuses={draft:'พร้อมต์ร่าง',filled:'กรอกแล้ว',submitted:'ส่งแล้ว · รอตรวจ',done:'เสร็จแล้ว'};
function notice(text) { clearTimeout(noticeTimer);$('notice').textContent=text; $('notice').hidden=false;noticeTimer=setTimeout(()=>{$('notice').hidden=true;},8000); }
function persist() {
  const snapshot=structuredClone(project);
  $('save-label').textContent='กำลังบันทึก…';
  saveChain=saveChain.catch(()=>{}).then(async()=>{
    if(extensionMode) await chrome.storage.local.set({project:snapshot});
    else localStorage.setItem('scenepilot-preview',JSON.stringify(snapshot));
    $('save-label').textContent='บันทึกในเครื่องแล้ว';
  }).catch(()=>{$('save-label').textContent='บันทึกไม่สำเร็จ';notice('พื้นที่บันทึกไม่พอหรือไม่พร้อม กรุณาส่งออกโปรเจกต์ไว้ก่อน');});
  return saveChain;
}
function readSettings() { project.settings=core.settings({...project.settings,...Object.fromEntries(new FormData($('setup-form')))}); }
function populate() {
  for(const [key,value] of Object.entries(project.settings)) {
    const field=$('setup-form').elements.namedItem(key);
    if(field) field.value=String(value);
  }
  estimate();plotMode();renderPlotOptions();
}
function plotMode() {
  const ai=project.settings.plotMode==='ai';
  $('synopsis-label').firstChild.textContent=ai?'พล็อตเดิมเป็นแนวทาง (ถ้ามี)':'เรื่องย่อ';$('idea-label').hidden=!ai;$('ai-plot').hidden=!ai;$('manual-hint').hidden=ai;
  $('create-scenes').textContent=ai?'เตรียมคำสั่งให้ Meta AI คิดเรื่อง →':'สร้างฉากและพร้อมต์ →';
}
function estimate() {
  $('estimate').textContent=project.settings.plotMode==='ai'?'AI แบ่งฉากตามเนื้อเรื่อง':'เพิ่มฉากได้ตามต้องการ';
}
function page(name) {
  $('notice').hidden=true;
  for(const id of ['setup','cast','storyboard','images','scenes','audio','preview']) $(id).hidden=id!==name;
  if(name==='cast'){renderCast();renderAssets();}
  if(name==='images'){renderCast();renderAssets();}
  if(name==='scenes'){renderList();renderEditor();}
  if(['storyboard','audio','preview'].includes(name))renderWorkflow(name);
  document.querySelectorAll('.tab').forEach(el=>{
    const active=el.dataset.page===name;
    el.classList.toggle('active',active);
    if(active) el.setAttribute('aria-current','page');
    else el.removeAttribute('aria-current');
    if(active)el.scrollIntoView({block:'nearest',inline:'nearest'});
  });
}
function renderWorkflow(name){
  const list=$(name==='storyboard'?'storyboard-list':name==='audio'?'audio-scenes':'preview-scenes');list.replaceChildren();
  if(name==='audio')$('audio-mode').value=project.settings.audio;
  if(!project.scenes.length){const empty=document.createElement('p');empty.className='empty';empty.textContent='ยังไม่มีฉาก เริ่มจากสร้างพล็อตและฉากก่อน';list.append(empty);return;}
  for(const scene of project.scenes){
    const card=document.createElement('article');card.className='workflow-card';
    const title=document.createElement('h3');title.textContent=`ตอน ${scene.episode} · ฉาก ${scene.shot}`;
    const description=document.createElement('p');description.textContent=scene.description || 'ยังไม่ได้ใส่เหตุการณ์';
    const dialogue=document.createElement('p');dialogue.className='workflow-dialogue';dialogue.textContent=scene.dialogue || 'ยังไม่มีบทพูด';
    const edit=document.createElement('button');edit.className='secondary wide';edit.textContent=name==='audio'?'แก้บทพูดฉากนี้':'เปิดฉาก / สร้างวิดีโอ';edit.onclick=()=>{selectedId=scene.id;$('episode-filter').value=String(scene.episode);page('scenes');};
    card.append(title,description,dialogue);
    if(name==='preview'){
      const url=core.mediaUrl(scene.result);
      if(url){const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='เปิดผลงานฉากนี้ ↗';card.append(link);}
      else{const status=document.createElement('p');status.className='hint';status.textContent=scene.result || 'ยังไม่ได้บันทึกลิงก์ผลงาน';card.append(status);}
    }
    card.append(edit);list.append(card);
  }
}
function selected() { return project.scenes.find(s=>s.id===selectedId); }
function renderList() {
  $('scene-count').textContent=project.scenes.length;
  const filter=$('episode-filter'),previous=filter.value;
  filter.replaceChildren();
  const episodes=[...new Set(project.scenes.map(s=>s.episode))].sort((a,b)=>a-b);
  for(const e of episodes) { const option=document.createElement('option');option.value=e;option.textContent=`ตอนที่ ${e}`;filter.append(option); }
  if(episodes.includes(Number(previous))) filter.value=previous;
  filter.disabled=!episodes.length;
  $('scene-list').replaceChildren();
  for(const scene of project.scenes.filter(s=>s.episode===Number(filter.value))) {
    const button=document.createElement('button');button.className='scene-row'+(scene.id===selectedId?' selected':'');
    const number=document.createElement('span');number.className='number';number.textContent=String(scene.shot).padStart(2,'0');
    const name=document.createElement('span');name.className='scene-name';name.textContent=scene.description || 'เพิ่มเหตุการณ์ของฉาก';
    const status=document.createElement('small');status.textContent=statuses[scene.status];
    button.append(number,name,status);button.onclick=()=>{selectedId=scene.id;renderList();renderEditor();};button.disabled=busy;$('scene-list').append(button);
  }
  $('empty').hidden=!!project.scenes.length;
}
function renderEditor() {
  const scene=selected();$('editor').hidden=!scene;
  if(!scene) return;
  $('editor-title').textContent=`ตอน ${scene.episode} · ฉาก ${scene.shot}`;
  $('scene-status').textContent=statuses[scene.status];
  for(const [id,key] of [['scene-description','description'],['scene-dialogue','dialogue'],['scene-prompt','prompt'],['scene-result','result']]) $(id).value=scene[key];
}
async function meta(action,prompt) {
  if(!extensionMode) return {ok:false,error:'นี่คือหน้าพรีวิว ติดตั้ง extension ใน Chrome เพื่อเชื่อม Meta AI'};
  return await chrome.runtime.sendMessage({type:'META_COMMAND',action,prompt});
}
async function connect() {
  if($('connect').disabled)return;
  const button=$('connect'),detail=$('connection-detail');let timer;
  button.disabled=true;button.textContent='กำลังเชื่อมต่อ…';
  $('connection-label').textContent='● กำลังตรวจหน้า Meta AI';
  detail.hidden=false;detail.textContent='กำลังเปิด Meta AI และรอหน้าเว็บพร้อม';
  document.querySelector('.connection').classList.remove('ready');
  try { const result=await Promise.race([meta('connect'),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('หน้า Meta AI ยังไม่พร้อมภายใน 20 วินาที ตรวจหน้าเว็บหรือเข้าสู่ระบบ แล้วกดเชื่อมต่อใหม่')),20000);})]);
    if(!result || typeof result.ok!=='boolean')throw new Error('ไม่ได้รับคำตอบจากตัวเชื่อม รีเฟรชหน้า Meta AI แล้วลองใหม่');
    $('connection-label').textContent=result.ok?'● พร้อมรับพร้อมต์':'● ยังไม่เชื่อมต่อ';
    document.querySelector('.connection').classList.toggle('ready',result.ok);
    detail.textContent=result.ok?'เชื่อมต่อแล้ว พร้อมส่งพร้อมต์ไปยังแท็บ Meta AI นี้':result.error || 'เชื่อมต่อไม่สำเร็จ เปิด Meta AI และรีเฟรชหน้าเว็บก่อนลองใหม่';
    detail.classList.toggle('error',!result.ok);
  } catch(error) { $('connection-label').textContent='● เชื่อมต่อไม่สำเร็จ';detail.classList.add('error');detail.textContent=error.message || 'การเชื่อมต่อขัดข้อง กรุณารีเฟรชหน้า Meta AI'; }
  finally{clearTimeout(timer);button.disabled=false;button.textContent='เชื่อมต่อ';}
}
async function transmit(action) {
  const scene=selected();if(!scene || busy) return;
  if(!scene.prompt.trim()) return notice('กรอกพร้อมต์ก่อนส่ง');
  if(scene.prompt.includes('โปรดระบุเหตุการณ์ของฉากนี้')) return notice('เพิ่มเนื้อหาฉากแล้วประกอบพร้อมต์ หรือแก้พร้อมต์ให้เป็นเหตุการณ์จริงก่อนส่ง');
  if(['submitted','done'].includes(scene.status)) return notice('ฉากนี้ส่งแล้ว หากต้องการเจนใหม่ ให้แก้พร้อมต์ก่อนเพื่อเปิดการส่งอีกครั้ง');
  busy=true;
  for(const id of ['send','fill','rebuild','done','next','add-scene','import']) $(id).disabled=true;
  for(const id of ['scene-description','scene-dialogue','scene-prompt','scene-result','episode-filter']) $(id).disabled=true;
  renderList();
  try {
    const result=await meta(action,scene.prompt);
    if(result.filled) scene.status=result.submitted?'submitted':'filled';
    notice(result.ok?(result.submitted?'กดส่งแล้ว ตรวจว่าการเจนเริ่มขึ้นบน Meta AI และยืนยันฉากเสร็จเมื่อได้คลิป':'กรอกพร้อมต์แล้ว กดเจนบนหน้า Meta AI ได้เลย'):result.error);
    await persist();
  } catch { notice('ไม่ได้รับคำตอบจากหน้า Meta AI ตรวจหน้าเว็บก่อนลองใหม่เพื่อป้องกันการส่งซ้ำ'); }
  finally {
    busy=false;for(const id of ['send','fill','rebuild','done','next','add-scene','import','scene-description','scene-dialogue','scene-prompt','scene-result','episode-filter']) $(id).disabled=false;
    renderList();renderEditor();
  }
}
document.querySelectorAll('.tab').forEach(el=>el.onclick=()=>page(el.dataset.page));
document.querySelectorAll('[data-go]').forEach(el=>el.onclick=()=>page(el.dataset.go));
let previewUrl;
$('preview-file').onchange=()=>{
  const file=$('preview-file').files[0];if(!file)return;
  if(previewUrl)URL.revokeObjectURL(previewUrl);
  previewUrl=URL.createObjectURL(file);$('preview-player').src=previewUrl;$('preview-player').hidden=false;$('preview-status').textContent=file.name;
};
$('audio-mode').onchange=()=>{
  const previous={...project.settings};project.settings.audio=$('audio-mode').value;
  for(const scene of project.scenes)if(scene.status==='draft' && scene.prompt===core.prompt(previous,scene))scene.prompt=core.prompt(project.settings,scene);
  populate();persist();notice('บันทึกการตั้งค่าเสียงแล้ว');
};
$('connect').onclick=connect;
$('open-meta').onclick=()=>{if(extensionMode) chrome.tabs.create({url:'https://www.meta.ai/'});else window.open('https://www.meta.ai/','_blank','noopener');};
$('setup-form').addEventListener('input',()=>{readSettings();estimate();plotMode();persist();});
$('setup-form').onsubmit=event=>{
  event.preventDefault();readSettings();
  if(project.settings.plotMode==='ai') {
    $('plot-request').value=core.plotOptionsPrompt(project.settings);
    $('plot-request').scrollIntoView({behavior:'smooth',block:'center'});
    return notice('คำสั่งพร้อมแล้ว ส่งให้ Meta AI คิดในหน้าแชต หรือคัดลอกไปวางเอง');
  }
  if(project.scenes.length && !confirm('สร้างชุดฉากใหม่แทนชุดเดิม? ส่งออกโปรเจกต์ก่อนหากต้องการเก็บฉากเดิม')) return;
  project.scenes=core.createScenes(project.settings);selectedId=project.scenes[0]?.id;
  $('episode-filter').value='';renderList();renderEditor();persist();page('cast');notice('ไปขั้นออกแบบตัวละครแล้ว จากนั้นเพิ่มเหตุการณ์แต่ละฉากก่อนส่งเจน');
};
$('episode-filter').onchange=()=>{selectedId=project.scenes.find(s=>s.episode===Number($('episode-filter').value))?.id;renderList();renderEditor();};
for(const [id,key] of [['scene-description','description'],['scene-dialogue','dialogue'],['scene-prompt','prompt'],['scene-result','result']]) $(id).oninput=()=>{
  const scene=selected();if(!scene)return;
  const wasGenerated=scene.prompt===core.prompt(project.settings,scene);
  scene[key]=$(id).value;
  if(['description','dialogue'].includes(key) && wasGenerated) {scene.prompt=core.prompt(project.settings,scene);$('scene-prompt').value=scene.prompt;}
  if(key!=='result') scene.status='draft';
  $('scene-status').textContent=statuses[scene.status];persist();
  renderList();
};
// Keep custom prompts intact when changing project settings or descriptions.
$('rebuild').onclick=()=>{const scene=selected();if(!scene)return;scene.prompt=core.prompt(project.settings,scene);scene.status='draft';renderList();renderEditor();persist();notice('ประกอบพร้อมต์ใหม่แล้ว');};
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(selected().prompt);notice('คัดลอกพร้อมต์แล้ว');}catch{notice('คัดลอกไม่สำเร็จ เลือกข้อความในช่องพร้อมต์แล้วกด Ctrl+C');}};
$('fill').onclick=()=>transmit('fill');$('send').onclick=()=>transmit('send');
$('done').onclick=()=>{const s=selected();if(!s)return;s.status='done';renderList();renderEditor();persist();notice('บันทึกว่าฉากนี้เสร็จแล้วตามการยืนยันของคุณ');};
$('next').onclick=()=>{
  const index=project.scenes.findIndex(s=>s.id===selectedId),next=project.scenes[index+1];
  if(!next)return notice('ถึงฉากสุดท้ายแล้ว');selectedId=next.id;
  $('episode-filter').value=next.episode;renderList();renderEditor();
};
$('add-scene').onclick=()=>{
  const episode=Number($('episode-filter').value)||1;
  if(project.scenes.length>=900)return notice('รองรับสูงสุด 900 ฉาก');
  const shot=Math.max(0,...project.scenes.filter(s=>s.episode===episode).map(s=>s.shot))+1;
  const s={id:crypto.randomUUID(),episode,shot,description:'',dialogue:'',result:'',status:'draft',prompt:''};s.prompt=core.prompt(project.settings,s);
  project.scenes.push(s);selectedId=s.id;renderList();renderEditor();persist();
};
$('export').onclick=()=>{
  const blob=new Blob([JSON.stringify(project,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=(project.settings.title||'scenepilot').replace(/[\\/:*?"<>|]/g,'-')+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$('import').onclick=()=>$('import-file').click();
$('copy-plot').onclick=async()=>{
  try{if(!$('plot-request').value.trim())throw new Error('กดเตรียมคำสั่งก่อน');await navigator.clipboard.writeText($('plot-request').value);notice('คัดลอกคำสั่งคิดเรื่องแล้ว');}catch(error){notice(error.message||'คัดลอกไม่ได้ เลือกข้อความและกด Ctrl+C');}
};
$('send-plot').onclick=async()=>{
  if(busy)return;
  if(!$('plot-request').value.trim())return notice('กดเตรียมคำสั่งก่อนส่ง');
  busy=true;$('send-plot').disabled=true;
  try{const result=await meta('send',$('plot-request').value);notice(result.ok?'กดส่งคำสั่งแล้ว รอคำตอบจบบน Meta AI แล้วนำ JSON กลับมา':result.error);}catch{notice('การส่งขัดข้อง ตรวจหน้า Meta AI ก่อนลองใหม่');}
  finally{busy=false;$('send-plot').disabled=false;}
};
$('read-plot').onclick=async()=>{
  try{const result=await meta('readSelection');if(!result.ok)throw new Error(result.error);$('plot-response').value=result.text;notice('อ่านคำตอบที่เลือกแล้ว กดใช้พล็อตเพื่อตรวจรูปแบบและสร้างฉาก');}catch(error){notice(error.message);}
};
function renderPlotOptions() {
  const items=project.plotOptions || [];
  $('plot-choice-section').hidden=!items.length;
  $('plot-options').replaceChildren();
  items.forEach((item,index)=>{
    const card=document.createElement('article');card.className='plot-card';
    const title=document.createElement('h3');title.textContent=`${index+1}. ${item.title}`;
    const summary=document.createElement('p');summary.textContent=item.synopsis;
    const button=document.createElement('button');button.className='secondary wide';button.textContent='เลือกเรื่องนี้ →';
    button.onclick=()=>{
      if(busy)return;
      readSettings();
      $('plot-request').value=core.plotPrompt({...project.settings,title:item.title,synopsis:item.synopsis});
      $('plot-response').value='';
      document.querySelectorAll('.plot-card').forEach(el=>el.classList.toggle('chosen',el===card));
      $('plot-request').scrollIntoView({behavior:'smooth',block:'center'});
      notice(`เลือก “${item.title}” แล้ว ส่งคำสั่งขยายเรื่องด้านบน แล้วนำ JSON คำตอบกลับมาอ่านเพื่อเข้าสู่ตัวละคร`);
    };
    card.append(title,summary,button);$('plot-options').append(card);
  });
}
$('new-plots').onclick=()=>{
  if(busy)return;
  readSettings();$('plot-request').value=core.plotOptionsPrompt(project.settings,project.plotOptions || []);
  $('plot-response').value='';$('plot-request').scrollIntoView({behavior:'smooth',block:'center'});
  notice('เตรียมคำสั่งขอพล็อตชุดใหม่แล้ว ส่งให้ Meta AI และนำคำตอบกลับมา รายการเดิมยังอยู่จนได้ชุดใหม่');
};
$('apply-plot').onclick=async()=>{
  if(busy)return;
  try{
    readSettings();
    const response=$('plot-response').value;
    let shape;try{shape=JSON.parse(response.slice(response.indexOf('{'),response.lastIndexOf('}')+1));}catch{throw new Error('วาง JSON คำตอบให้ครบ');}
    if(shape?.plots) {
      project.plotOptions=core.parsePlotOptions(response);renderPlotOptions();await persist();
      $('plot-choice-section').scrollIntoView({behavior:'smooth',block:'start'});
      return notice('ได้พล็อตแล้ว เลือกเรื่องที่อยากทำจากรายการด้านล่าง');
    }
    const loaded=core.parsePlot(response,project.settings);
    loaded.plotOptions=project.plotOptions || [];
    if(!confirm(`ใช้เรื่อง “${loaded.settings.title}” จำนวน ${loaded.scenes.length} ฉาก${project.scenes.length?' แทนฉากเดิม':''}?`))return;
    project=loaded;selectedId=project.scenes[0]?.id;populate();$('episode-filter').value='';renderList();renderEditor();await persist();page('cast');notice('โหลดพล็อตแล้ว ตรวจและออกแบบตัวละครก่อนเข้าสู่ฉาก');
  }catch(error){notice('ยังใช้พล็อตไม่ได้: '+error.message);}
};
$('import-file').onchange=async()=>{
  try {
    const file=$('import-file').files[0];if(!file)return;
    if(file.size>5_000_000)throw new Error('ไฟล์ใหญ่เกิน 5 MB');
    const loaded=core.validateProject(JSON.parse(await file.text()));
    if(project.scenes.length && !confirm('โหลดโปรเจกต์นี้แทนงานปัจจุบัน?'))return;
    project=loaded;selectedId=project.scenes[0]?.id;populate();$('episode-filter').value='';renderList();renderEditor();renderCast();await persist();notice('โหลดโปรเจกต์แล้ว');
  } catch(error){notice('โหลดไม่ได้: '+error.message);}finally{$('import-file').value='';}
};
function updateCatalog(changes) {
  const previous=project.settings;
  const generated=project.scenes.filter(s=>s.status==='draft' && s.prompt===core.prompt(previous,s));
  project.settings=core.settings({...previous,...changes});
  for(const scene of generated)scene.prompt=core.prompt(project.settings,scene);
  populate();persist();
}
function syncCastSummary() {
  const summary=project.cast.map(c=>`${c.name || 'ยังไม่มีชื่อ'} (${c.role || 'ยังไม่ระบุบทบาท'}): ${c.description}`).join('\n\n');
  if(summary.length>6000){persist();notice('รายละเอียดตัวละครรวมเกิน 6,000 ตัวอักษร กรุณาย่อก่อนใช้ในพร้อมต์');return false;}
  updateCatalog({characters:summary});
  $('cast-summary').value=project.settings.characters;
  return true;
}
function renderCast() {
  project.cast ||= [];
  $('cast-plot-title').textContent=project.settings.title?`เรื่อง: ${project.settings.title}`:'ยังไม่ได้ตั้งชื่อเรื่อง';
  $('cast-summary').value=project.settings.characters;
  $('cast-locations').value=project.settings.locations;
  $('product-enabled').checked=project.settings.productMode==='on';
  $('product-label').hidden=!$('product-enabled').checked;$('cast-product').value=project.settings.product;
  $('cast-list').replaceChildren();
  if(!project.cast.length){const empty=document.createElement('p');empty.className='hint';empty.textContent='ยังไม่มีรายการตัวละคร เพิ่มเองหรือให้ Meta AI ออกแบบได้';$('cast-list').append(empty);}
  project.cast.forEach((person,index)=>{
    const card=document.createElement('article');card.className='cast-card';
    const asset=(project.assets || []).find(a=>a.castId===person.id || (a.kind==='character' && a.name===person.name));
    if(asset?.image){const img=document.createElement('img');img.src=asset.image;img.alt=person.name;img.referrerPolicy='no-referrer';img.className='cast-portrait';card.append(img);}
    const heading=document.createElement('h3');heading.textContent=`ตัวละคร ${index+1}`;card.append(heading);
    for(const [key,title,limit] of [['name','ชื่อ',120],['role','บทบาท',120],['description','หน้าตา ชุด และบุคลิก',3000]]) {
      const label=document.createElement('label');label.textContent=title;
      const field=document.createElement(key==='description'?'textarea':'input');field.value=person[key];field.maxLength=limit;if(key==='description')field.rows=3;
      field.oninput=()=>{person[key]=field.value;syncCastSummary();};label.append(field);card.append(label);
    }
    const buttons=document.createElement('div');buttons.className='two';
    const portrait=document.createElement('button');portrait.className='secondary';portrait.textContent=asset?.image?'เจนภาพใหม่':'สร้างภาพตัวละคร';
    portrait.onclick=()=>{
      if(!person.name.trim() || !person.description.trim())return notice('ใส่ชื่อและรายละเอียดตัวละครก่อน');
      if(busy || imageJob)return notice('รอภาพที่กำลังเจนก่อน');project.assets=core.syncAssets(project.assets || [],project.cast);selectedAssetId=project.assets.find(a=>a.castId===person.id).id;persist();page('images');$('asset-editor').scrollIntoView({behavior:'smooth',block:'start'});$('asset-generate').click();
    };
    const remove=document.createElement('button');remove.className='text-button';remove.textContent='ลบตัวละคร';
    remove.onclick=()=>{if(!confirm(`ลบตัวละคร ${person.name || index+1}?`))return;project.cast.splice(index,1);syncCastSummary();renderCast();};
    buttons.append(portrait,remove);card.append(buttons);$('cast-list').append(card);
  });
}
$('add-cast').onclick=()=>{
  if(project.cast.length>=12)return notice('รองรับตัวละครหลักไม่เกิน 12 ตัว');
  project.cast.push({id:crypto.randomUUID(),name:'',role:'',description:''});persist();renderCast();
};
$('cast-summary').oninput=()=>updateCatalog({characters:$('cast-summary').value});
$('cast-locations').oninput=()=>updateCatalog({locations:$('cast-locations').value});
$('cast-product').oninput=()=>updateCatalog({product:$('cast-product').value});
$('product-enabled').onchange=()=>{updateCatalog({productMode:$('product-enabled').checked?'on':'off'});$('product-label').hidden=!$('product-enabled').checked;};
$('add-location').onclick=()=>{const field=$('cast-locations');field.value+=(field.value?'\n':'')+'สถานที่ใหม่: ';field.focus();updateCatalog({locations:field.value});};
$('prepare-cast-ai').onclick=()=>{$('cast-ai-request').value=core.castRequest(project.settings,project.scenes);};
$('apply-cast-ai').onclick=()=>{
  if(busy)return;
  try{const {cast,locations}=core.parseCatalog($('cast-ai-response').value);if(!confirm(`ใช้ตัวละคร ${cast.length} ตัว และสถานที่ ${locations.length} แห่งจากคำตอบนี้?`))return;
    const assets=core.syncAssets(project.assets || [],cast,locations);
    project.cast=cast;project.assets=assets;project.settings.locations=locations.map(l=>`${l.name}: ${l.description}`).join('\n').slice(0,6000);syncCastSummary();renderCast();renderAssets();notice(`เตรียมตัวละคร ${cast.length} ตัว และสถานที่ ${locations.length} แห่งแล้ว เลือกเจนภาพจากการ์ดในหน้านี้ได้เลย`);
  }catch(error){notice(error.message);}
};
$('all-cast-prompts').onclick=()=>{
  if(!project.cast.length || project.cast.some(c=>!c.name.trim() || !c.description.trim()))return notice('ใส่ชื่อและรายละเอียดทุกตัวละครก่อน');
  const prompts=project.cast.map((c,i)=>`--- ตัวละคร ${i+1}: ${c.name} ---\n${core.portraitPrompt(project.settings,c)}`).join('\n\n');
  if(prompts.length>20000)return notice('พร้อมต์รวมยาวเกินไป ให้เตรียมแยกทีละตัวละคร');
  $('cast-image-prompt').value=prompts;$('cast-image-prompt').dataset.batch='true';notice('เตรียมครบแล้ว คัดลอกเก็บได้ การส่งเจนให้เลือกพร้อมต์รายตัวละคร');
};
$('prepare-dialogue').onclick=()=>{
  try{$('dialogue-request').value=core.dialoguePrompt(project.settings,project.scenes);notice('เตรียมคำสั่งบทพูดครบทุกฉากแล้ว');}catch(error){notice(error.message);}
};
$('apply-dialogue').onclick=()=>{
  if(busy)return notice('รอการส่งปัจจุบันให้เสร็จก่อน');
  try{
    const dialogues=core.parseDialogues($('dialogue-response').value,project.scenes);
    const config={...project.settings,audio:'มีบทพูด'};
    const scenes=project.scenes.map((scene,i)=>{const updated={...scene,dialogue:dialogues[i],status:'draft'};updated.prompt=core.prompt(config,updated);if(updated.prompt.length>20000)throw new Error('พร้อมต์ยาวเกินกำหนด กรุณาย่อบทพูด');return updated;});
    if(!confirm('ใช้บทพูดชุดนี้และประกอบพร้อมต์ใหม่ทุกฉาก? คลิปเดิมต้องเจนใหม่จึงจะมีบทพูด'))return;
    project.settings=config;project.scenes=scenes;populate();renderList();renderEditor();renderWorkflow('audio');persist();notice('เพิ่มบทพูดทุกฉากแล้ว พร้อมต์พร้อมให้เจนใหม่');
  }catch(error){notice(error.message);}
};
for(const [button,field] of [['copy-dialogue','dialogue-request'],['copy-cast-ai','cast-ai-request'],['copy-cast-image','cast-image-prompt']]) $(button).onclick=async()=>{
  try{if(!$(field).value.trim())throw new Error('เตรียมพร้อมต์ก่อน');await navigator.clipboard.writeText($(field).value);notice('คัดลอกแล้ว');}catch(error){notice(error.message);}
};
for(const [button,field] of [['send-dialogue','dialogue-request'],['send-cast-ai','cast-ai-request'],['send-cast-image','cast-image-prompt']]) $(button).onclick=async()=>{
  if(busy)return;
  if(!$(field).value.trim())return notice('เตรียมพร้อมต์ก่อนส่ง');
  if($(field).dataset.batch)return notice('เลือกตัวละครแล้วกดเตรียมพร้อมต์ภาพ เพื่อส่งเจนทีละตัว');
  busy=true;$(button).disabled=true;
  try{const result=await meta('send',$(field).value);notice(result.ok?'กดส่งแล้ว ตรวจคำตอบหรือภาพบนหน้า Meta AI':result.error);}catch{notice('ส่งไม่สำเร็จ ตรวจหน้า Meta AI ก่อนลองใหม่');}
  finally{busy=false;$(button).disabled=false;}
};
$('back-plot').onclick=()=>page('setup');
$('cast-next').onclick=()=>{if(project.cast.length && project.cast.map(c=>`${c.name} (${c.role}): ${c.description}`).join('\n\n').length>6000)return notice('รายละเอียดตัวละครรวมยาวเกินไป กรุณาย่อก่อนเข้าสู่ฉาก');renderList();renderEditor();page('storyboard');notice('พร้อมต์ร่างที่ประกอบอัตโนมัติใช้ค่าตัวละครและสถานที่ใหม่แล้ว พร้อมต์ที่แก้เองหรือส่งแล้วคงเดิม');};
function currentAsset(){return (project.assets || []).find(a=>a.id===selectedAssetId);}
function renderAssets(){
  project.assets ||= [];
  const chars=project.assets.filter(a=>a.kind==='character'),places=project.assets.filter(a=>a.kind==='location');
  $('asset-progress').textContent=`ตัวละคร ${chars.filter(a=>a.image).length}/${chars.length} · สถานที่ ${places.filter(a=>a.image).length}/${places.length} มีภาพแล้ว · ยังขาด ${project.assets.filter(a=>!a.image).length} รายการ`;
  $('asset-list').replaceChildren();
  if(!project.assets.length){const p=document.createElement('p');p.className='hint';p.textContent='เพิ่มตัวละครหรือสถานที่ที่ต้องการสร้างภาพ';$('asset-list').append(p);}
  for(const asset of project.assets){
    if(asset.kind==='character' && project.cast.some(c=>c.id===asset.castId))continue;
    const card=document.createElement('article');card.className='asset-card'+(asset.id===selectedAssetId?' chosen':'');
    if(asset.image){const img=document.createElement('img');img.src=asset.image;img.alt=asset.name;img.referrerPolicy='no-referrer';img.loading='lazy';img.onerror=()=>{img.hidden=true;const p=document.createElement('p');p.className='hint';p.textContent='เปิดภาพไม่ได้ ลองอ่านภาพจาก Meta AI ใหม่';card.prepend(p);};card.append(img);}
    const title=document.createElement('h3');title.textContent=asset.name || 'ยังไม่มีชื่อ';
    const type=document.createElement('small');type.textContent=asset.kind==='character'?'ตัวละคร':'สถานที่';
    const select=document.createElement('button');select.className='secondary wide';select.textContent='เลือก / แก้ไข / เจนใหม่';select.onclick=()=>{if(busy)return;selectedAssetId=asset.id;renderAssets();renderAssetEditor();};
    const generate=document.createElement('button');generate.className='primary wide';generate.textContent=asset.image?'เจนภาพใหม่':'สร้างภาพ';generate.onclick=()=>{if(busy || imageJob)return notice('รอภาพที่กำลังเจนก่อน');selectedAssetId=asset.id;renderAssetEditor();$('asset-editor').scrollIntoView({behavior:'smooth',block:'start'});$('asset-generate').click();};
    card.append(type,title,select,generate);$('asset-list').append(card);
  }
  if(!currentAsset())selectedAssetId=project.assets[0]?.id;
  renderAssetEditor();
}
function renderAssetEditor(){
  const asset=currentAsset();$('asset-editor').hidden=!asset;if(!asset)return;
  $('asset-editor-title').textContent=asset.kind==='character'?'ภาพตัวละคร':'ภาพสถานที่';
  $('asset-name').value=asset.name;$('asset-description').value=asset.description;$('asset-prompt').value=core.assetPrompt(project.settings,asset);
  $('asset-generate').disabled=busy || !!imageJob;
}
function addAsset(kind){
  project.assets ||= [];if(project.assets.length>=60)return notice('รองรับสูงสุด 60 รายการ');
  const asset={id:crypto.randomUUID(),kind,name:'',description:'',image:'',pageUrl:'',castId:''};project.assets.push(asset);selectedAssetId=asset.id;persist();renderAssets();$('asset-editor').scrollIntoView({block:'start',behavior:'smooth'});
}
$('asset-add-character').onclick=()=>addAsset('character');$('asset-add-location').onclick=()=>addAsset('location');
$('assets-from-cast').onclick=()=>{
  project.assets ||= [];
  if(!project.cast.length)return notice('เพิ่มหรือออกแบบตัวละครในแท็บตัวละครก่อน');
  try{const count=project.assets.length;project.assets=core.syncAssets(project.assets,project.cast);selectedAssetId ||= project.assets[0]?.id;persist();renderAssets();notice(`ซิงก์ตัวละครครบ เพิ่ม ${project.assets.length-count} รายการ ภาพเดิมยังอยู่`);}catch(e){notice(e.message);}
};
$('asset-next-missing').onclick=()=>{if(busy || imageJob)return notice('รอรายการที่กำลังเจนก่อน');const asset=(project.assets || []).find(a=>!a.image);if(!asset)return notice('มีภาพครบทุกตัวละครและสถานที่แล้ว');selectedAssetId=asset.id;renderAssets();$('asset-editor').scrollIntoView({block:'start',behavior:'smooth'});};
for(const [id,key] of [['asset-name','name'],['asset-description','description']])$(id).oninput=()=>{const a=currentAsset();if(!a)return;a[key]=$(id).value;persist();};
$('asset-rebuild').onclick=()=>{const a=currentAsset();if(a)$('asset-prompt').value=core.assetPrompt(project.settings,a);};
$('asset-copy').onclick=async()=>{try{await navigator.clipboard.writeText($('asset-prompt').value);notice('คัดลอกพร้อมต์ภาพแล้ว');}catch{notice('คัดลอกไม่สำเร็จ');}};
$('open-create').onclick=()=>{if(extensionMode)chrome.tabs.create({url:'https://www.meta.ai/create'});else window.open('https://www.meta.ai/create','_blank','noopener');};
function renderMedia(){
  $('media-gallery').replaceChildren();
  if(!mediaImages.length){const p=document.createElement('p');p.className='hint';p.textContent='ยังไม่พบภาพผลงานที่โหลดแล้ว เปิดผลงานบน Meta AI แล้วกดอ่านใหม่';$('media-gallery').append(p);return;}
  for(const media of mediaImages){
    const card=document.createElement('article');card.className='media-card';
    const img=document.createElement('img');img.src=media.src;img.alt=media.alt || 'ภาพจาก Meta AI';img.referrerPolicy='no-referrer';img.loading='lazy';
    img.onerror=()=>{img.hidden=true;const p=document.createElement('p');p.className='hint';p.textContent='ลิงก์ภาพนี้เปิดไม่ได้ ลองเปิดภาพบนเว็บแล้วอ่านใหม่';card.prepend(p);};
    const use=document.createElement('button');use.className='secondary wide';use.textContent='ใช้ภาพนี้กับรายการที่เลือก';
    use.onclick=()=>{const asset=currentAsset();if(!asset)return notice('เลือกรายการตัวละครหรือสถานที่ก่อน');const src=core.mediaUrl(media.src);if(!src)return notice('ลิงก์ภาพไม่ถูกต้อง');asset.image=src;asset.pageUrl=core.mediaUrl(media.pageUrl);persist();renderCast();renderAssets();notice(`เก็บภาพให้ ${asset.name || 'รายการที่เลือก'} แล้ว`);};
    card.append(img,use);$('media-gallery').append(card);
  }
}
async function readMedia(){
  const result=await meta('readMedia');if(!result.ok)throw new Error(result.error);
  mediaImages=(result.images || []).filter(m=>core.mediaUrl(m.src));renderMedia();return result;
}
$('read-media').onclick=async()=>{try{const r=await readMedia();notice(`อ่านภาพ ${mediaImages.length} ภาพจากหน้า Meta AI ที่เปิดอยู่`);}catch(e){notice(e.message);}};
$('inspect-media').onclick=async()=>{try{const r=await meta('inspectMedia');if(!r.ok)throw new Error(r.error);$('media-debug').value=JSON.stringify(r,null,2);}catch(e){notice(e.message);}};
function finishImageJob(message){clearInterval(imagePoll);imagePoll=null;imageJob=null;$('image-job-status').textContent=message;$('asset-generate').disabled=busy;}
async function pollImageJob(){
  if(!imageJob || imagePollBusy)return;imagePollBusy=true;
  try{
    const r=await meta('readMedia');if(!r.ok)throw new Error(r.error);
    const fresh=(r.images || []).filter(m=>!imageJob.before.includes(m.key) && core.mediaUrl(m.src));
    if(fresh.length){mediaImages=fresh;renderMedia();finishImageJob(`พบภาพใหม่ ${fresh.length} ภาพ เลือกภาพที่ต้องการด้านล่าง`);notice('Meta AI มีภาพใหม่แล้ว เลือกใช้ภาพกับรายการที่ต้องการ');}
    else if(Date.now()-imageJob.startedAt>180000)finishImageJob('ยังไม่พบภาพใหม่ ตรวจหน้า Meta AI แล้วกดอ่านภาพจากหน้านี้');
  }catch(e){finishImageJob(e.message+' — เปิดหน้า Meta AI แล้วกดอ่านภาพอีกครั้ง');}
  finally{imagePollBusy=false;}
}
$('asset-generate').onclick=async()=>{
  const asset=currentAsset();if(!asset || busy || imageJob)return;
  if(!asset.name.trim() || !asset.description.trim())return notice('ใส่ชื่อและรายละเอียดก่อนส่งเจนภาพ');
  const prompt=$('asset-prompt').value;if(!prompt.trim())return notice('เตรียมพร้อมต์ภาพก่อน');
  busy=true;$('asset-generate').disabled=true;
  try{
    const before=await meta('readMedia');if(!before.ok)throw new Error(before.error);
    if(!new URL(before.pageUrl).pathname.startsWith('/create'))throw new Error('เปิดหน้า Meta AI /create ก่อนส่งเจนภาพ');
    const r=await meta('send',prompt);if(!r.ok)throw new Error(r.error);
    selectedAssetId=asset.id;imageJob={assetId:asset.id,before:(before.images || []).map(m=>m.key),startedAt:Date.now()};
    $('image-job-status').textContent='กดส่งแล้ว กำลังรอภาพใหม่จากเว็บ (สูงสุด 3 นาที)';
    imagePoll=setInterval(pollImageJob,4000);notice('กดส่งเจนภาพแล้ว รอผลบน Meta AI');
  }catch(e){notice(e.message);$('image-job-status').textContent=e.message;}
  finally{busy=false;$('asset-generate').disabled=!!imageJob;}
};
(async()=>{
  try{
    const saved=extensionMode?(await chrome.storage.local.get('project')).project:JSON.parse(localStorage.getItem('scenepilot-preview')||'null');
    if(saved)project=core.validateProject(saved);
  }catch{notice('โหลดงานเดิมไม่ได้ คุณยังโหลดไฟล์โปรเจกต์ที่ส่งออกไว้ได้');}
  selectedId=project.scenes[0]?.id;populate();renderList();renderEditor();
  if(!extensionMode){$('connection-label').textContent='● พรีวิว · ยังไม่ได้ติดตั้ง';}
})();
