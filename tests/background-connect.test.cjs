const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
async function run({activeMeta=false,existing=false,missing=false}={}){
 let listener,created=0,activated=0,injected=0;const target={id:7,url:'https://www.meta.ai/create',status:'complete'};let receiver=!missing;
 const chrome={sidePanel:{setPanelBehavior:()=>Promise.resolve()},scripting:{executeScript:async()=>{injected++;receiver=true;}},runtime:{id:'test',onMessage:{addListener:f=>listener=f}},tabs:{
 query:async q=>q.active?[activeMeta?target:{id:1,url:'https://example.com'}]:existing?[target]:[],
 update:async(id,opts)=>{assert.equal(id,7);assert.equal(opts.active,true);activated++;return target;},
 create:async opts=>{assert.equal(opts.url,target.url);created++;return target;},get:async()=>target,
 sendMessage:async(id,message)=>{assert.equal(id,7);assert.equal(message.action,'probe');if(!receiver)throw new Error('Could not establish connection. Receiving end does not exist.');return {ok:true};}
 }};
 vm.runInNewContext(fs.readFileSync('extension/background.js','utf8'),{chrome,console,setTimeout,URL});
 const result=await new Promise(resolve=>listener({type:'META_COMMAND',action:'connect'},{id:'test'},resolve));assert.equal(result.ok,true);return {created,activated,injected};
}
(async()=>{assert.deepEqual(await run(),{created:1,activated:0,injected:0});assert.deepEqual(await run({existing:true}),{created:0,activated:1,injected:0});assert.deepEqual(await run({activeMeta:true}),{created:0,activated:0,injected:0});assert.deepEqual(await run({existing:true,missing:true}),{created:0,activated:1,injected:1});console.log('PASS: connect opens Meta Create, reuses/activates Meta tab, repairs missing bridge and never probes unrelated tab');})().catch(e=>{console.error(e);process.exitCode=1;});

