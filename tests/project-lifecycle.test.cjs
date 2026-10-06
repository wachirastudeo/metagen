const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(storage){
  const source=fs.readFileSync('extension/sidepanel.js','utf8'),nodes=new Map();let resets=0;
  const context={structuredClone,extensionMode:true,chrome:{storage:{local:{set:storage}}},$:id=>{if(!nodes.has(id))nodes.set(id,{});return nodes.get(id);},resetStudioForProject(){resets++;}};
  vm.createContext(context);vm.runInContext("let project={title:'original'},saveChain=Promise.resolve(),selectedId=null,selectedAssetId='old',mediaImages=[];",context);
  vm.runInContext(source.slice(source.indexOf('function writeProject('),source.indexOf('function readSettings(')),context);
  return {context,nodes,resets:()=>resets,current:()=>vm.runInContext('project',context)};
}
test('replacement waits for persistence before changing the active project or stopping preview',async()=>{
  let finish;const h=setup(()=>new Promise(resolve=>finish=resolve));
  const next={title:'next',scenes:[{id:'new'}]},installing=h.context.installProject(next);
  await Promise.resolve();await Promise.resolve();assert.equal(h.current().title,'original');assert.equal(h.resets(),0);
  finish();await installing;assert.equal(h.current().title,'next');assert.equal(h.resets(),1);assert.equal(h.nodes.get('episode-filter').value,'');
});
test('failed project persistence leaves the current project and preview untouched',async()=>{
  const h=setup(async()=>{throw new Error('quota exceeded');});
  await assert.rejects(h.context.installProject({title:'next',scenes:[]}),/quota/);
  assert.equal(h.current().title,'original');assert.equal(h.resets(),0);
});
