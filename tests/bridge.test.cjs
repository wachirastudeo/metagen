const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
async function run(options={}) {
  let listener,clicks=0;
  class Textarea { constructor(){this._value=options.initial||'';this.tagName='TEXTAREA';this.disabled=false;this.readOnly=false;} get value(){return this._value;} set value(v){this._value=options.dropLastLine?v.split('\n').slice(0,-1).join(''):options.joinLines?v.replace(/\r?\n/g,''):v;} getClientRects(){return [1];} getAttribute(k){return k==='placeholder'?'Ask Meta AI':null;} focus(){} dispatchEvent(){} closest(){return null;} }
  const field=new Textarea();
  const button={innerText:'Send',disabled:false,getClientRects:()=>[1],getAttribute:()=>null,click:()=>clicks++};
  const fileInput={multiple:true,disabled:false,dispatchEvent(){}};
  if(options.scoped){
    const attachment={getClientRects:()=>[1],getAttribute:()=> 'Add attachment'};
    const remove={getClientRects:()=>[1],getAttribute:()=> 'Remove image'};
    field.parentElement={parentElement:null,querySelectorAll:selector=>selector==='input[type="file"]'?[fileInput]:[attachment,button,...(options.attached?[remove]:[])]};
  }
  const sandbox={chrome:{runtime:{id:'test',onMessage:{addListener:fn=>listener=fn}}},HTMLTextAreaElement:Textarea,HTMLInputElement:Textarea,Event:class{},getComputedStyle:()=>({visibility:'visible'}),setTimeout:fn=>fn(),document:{querySelectorAll:selector=>selector.startsWith('textarea')?(options.multiple?[field,new Textarea()]:[field]):(options.noButton?[]:[button])}};
  vm.runInNewContext(fs.readFileSync('extension/content.js','utf8'),sandbox);
  sandbox.atob=value=>Buffer.from(value,'base64').toString('binary');
  sandbox.File=class{constructor(parts,name,opts){this.name=name;this.type=opts.type;}};
  sandbox.DataTransfer=class{constructor(){this.files=[];this.items={add:file=>this.files.push(file)};}};
  const reply=await new Promise(resolve=>listener({type:'SCENEPILOT',action:options.action||'send',prompt:options.prompt||'สร้างวิดีโอแนวตั้ง',attachments:options.attachments}, {id:'test'},resolve));
  return {reply,clicks,value:field.value,files:fileInput.files};
}
(async()=>{
  let r=await run();assert.equal(r.reply.ok,true);assert.equal(r.clicks,1);assert.equal(r.reply.submitted,true);
  r=await run({joinLines:true,prompt:'เรื่องแรก\n\nเรื่องที่สอง'});assert.equal(r.reply.ok,true);assert.equal(r.clicks,1);
  const jsonPrompt=JSON.stringify({task:'generate_video',scene:{description:'First\nSecond'},characters:[{name:'Dao'}]},null,2);
  r=await run({action:'fill',prompt:jsonPrompt,joinLines:true});assert.equal(r.reply.ok,true);assert.deepEqual(JSON.parse(r.value),JSON.parse(jsonPrompt));
  r=await run({action:'fill',prompt:jsonPrompt,dropLastLine:true});assert.equal(r.reply.ok,false);assert.equal(r.clicks,0,'truncated JSON is never submitted');
  r=await run({action:'fill'});assert.equal(r.clicks,0);assert.equal(r.reply.filled,true);
  r=await run({initial:'ข้อความของผู้ใช้'});assert.equal(r.reply.ok,false);assert.equal(r.clicks,0);assert.equal(r.value,'ข้อความของผู้ใช้');
  r=await run({multiple:true});assert.equal(r.reply.ok,false);assert.equal(r.clicks,0);
  r=await run({noButton:true});assert.equal(r.reply.ok,false);assert.equal(r.reply.filled,true);assert.equal(r.clicks,0);
  r=await run({scoped:true,noButton:true});assert.equal(r.reply.ok,true);assert.equal(r.clicks,1,'active composer controls are used instead of page-wide controls');
  const attachments=[{name:'Dao.png',type:'image/png',base64:'YWJj'},{name:'Joe.webp',type:'image/webp',base64:'ZGVm'}];
  r=await run({scoped:true,action:'fill',attachments});assert.equal(r.reply.attachmentSelection,true);assert.equal(r.clicks,0);assert.deepEqual(r.files.map(f=>f.name),['Dao.png','Joe.webp']);
  r=await run({scoped:true,action:'send',attachments});assert.equal(r.reply.ok,false);assert.equal(r.clicks,0);assert.equal(r.value,'');
  r=await run({scoped:true,action:'fill',attachments,attached:true});assert.equal(r.reply.ok,false);assert.equal(r.value,'');
  r=await run({action:'fill',attachments});assert.equal(r.reply.ok,false);assert.equal(r.value,'');
  r=await run({scoped:true,action:'fill',attachments:[{...attachments[0],type:'image/svg+xml'}]});assert.equal(r.reply.ok,false);assert.equal(r.value,'');
  console.log('PASS: send, fill-only, occupied composer, ambiguous composer and missing button fallback (simulated DOM)');
})().catch(error=>{console.error(error);process.exitCode=1;});
