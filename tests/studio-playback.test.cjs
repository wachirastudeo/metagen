const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function harness(){
  const nodes=new Map(),requests=new Map(),notices=[];
  const player={src:'',hidden:true,pause(){},load(){},removeAttribute(){this.src='';},async play(){}};
  nodes.set('preview-player',player);
  const context={structuredClone,projectIOBusy:false,$:id=>{if(!nodes.has(id))nodes.set(id,{});return nodes.get(id);},notice:message=>notices.push(message),
    URL:{createObjectURL:blob=>'blob:'+blob.id,revokeObjectURL(){}},StudioMedia:{get:id=>new Promise((resolve,reject)=>requests.set(id,{resolve,reject}))}};
  vm.createContext(context);vm.runInContext(fs.readFileSync('extension/studio.js','utf8'),context);
  return {context,player,nodes,requests,notices};
}
const scene=id=>({id,episode:1,shot:1,clip:{id}});
test('switching episodes ignores a slow read from the previous playlist',async()=>{
  const h=harness(),old=h.context.playStudio([scene('old')]),current=h.context.playStudio([scene('new')]);
  h.requests.get('new').resolve({blob:{id:'new'}});await current;
  h.requests.get('old').resolve({blob:{id:'old'}});await old;
  assert.equal(h.player.src,'blob:new');assert.equal(h.player.hidden,false);assert.deepEqual(h.notices,[]);
});
test('a previous playlist read failure cannot stop the current episode',async()=>{
  const h=harness(),old=h.context.playStudio([scene('old')]),current=h.context.playStudio([scene('new')]);
  h.requests.get('new').resolve({blob:{id:'new'}});await current;
  h.requests.get('old').reject(new Error('old read failed'));await old;
  assert.equal(h.player.src,'blob:new');assert.deepEqual(h.notices,[]);
});
test('stopping while a clip loads prevents playback from starting afterward',async()=>{
  const h=harness(),loading=h.context.playStudio([scene('old')]);h.context.stopStudioPlayback();
  h.requests.get('old').resolve({blob:{id:'old'}});await loading;
  assert.equal(h.player.src,'');assert.equal(h.player.hidden,true);
});
test('a delayed clip save cannot modify a project that replaced its original scene',async()=>{
  const h=harness(),original={id:'one'};h.context.project={scenes:[original]};h.context.selected=()=>h.context.project.scenes[0];
  let finish,saves=0;h.context.StudioMedia.save=()=>new Promise(resolve=>finish=resolve);h.context.persist=async()=>saves++;
  h.nodes.get('scene-clip-file').files=[new Blob(['test'])];
  const saving=h.nodes.get('scene-clip-file').onchange();h.context.project={scenes:[]};finish({id:'saved'});await saving;
  assert.equal(original.clip,undefined);assert.equal(saves,0);assert.equal(h.context.project.scenes.length,0);assert.equal(h.notices.length,1);
});
test('failed project persistence preserves the previous clip and scene status',async()=>{
  const h=harness(),original={id:'one',status:'draft',clip:{id:'previous'}};
  h.context.project={scenes:[original]};h.context.selected=()=>original;
  h.context.StudioMedia.save=async()=>({id:'new'});
  h.context.writeProject=async()=>{throw new Error('Storage quota exceeded');};
  h.context.renderList=()=>{};h.context.renderEditor=()=>{};h.context.renderSceneClip=()=>{};
  h.nodes.get('scene-clip-file').files=[new Blob(['test'])];
  await h.nodes.get('scene-clip-file').onchange();
  assert.equal(original.clip.id,'previous');assert.equal(original.status,'draft');
  assert.deepEqual(h.notices,['Storage quota exceeded']);
});
test('scene completion becomes visible only after project persistence succeeds',async()=>{
  const h=harness(),original={id:'one',status:'draft'};h.context.project={scenes:[original]};h.context.selected=()=>original;
  h.context.StudioMedia.save=async()=>({id:'new'});let finish,stored,started;
  const writing=new Promise(resolve=>started=resolve);
  h.context.writeProject=next=>{stored=next;started();return new Promise(resolve=>finish=resolve);};
  h.context.renderList=()=>{};h.context.renderEditor=()=>{};h.context.renderSceneClip=()=>{};
  h.nodes.get('scene-clip-file').files=[new Blob(['test'])];
  const saving=h.nodes.get('scene-clip-file').onchange();await writing;
  assert.equal(original.clip,undefined);assert.equal(original.status,'draft');
  assert.equal(stored.scenes[0].clip.id,'new');assert.equal(stored.scenes[0].status,'done');
  finish();await saving;assert.equal(original.clip.id,'new');assert.equal(original.status,'done');
});
