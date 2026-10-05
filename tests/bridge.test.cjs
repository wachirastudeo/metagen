const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
async function run(options={}) {
  let listener,clicks=0;
  class Textarea { constructor(){this._value=options.initial||'';this.tagName='TEXTAREA';this.disabled=false;this.readOnly=false;} get value(){return this._value;} set value(v){this._value=options.joinLines?v.replace(/\r?\n/g,''):v;} getClientRects(){return [1];} getAttribute(k){return k==='placeholder'?'Ask Meta AI':null;} focus(){} dispatchEvent(){} closest(){return null;} }
  const field=new Textarea();
  const button={innerText:'Send',disabled:false,getClientRects:()=>[1],getAttribute:()=>null,click:()=>clicks++};
  const sandbox={chrome:{runtime:{id:'test',onMessage:{addListener:fn=>listener=fn}}},HTMLTextAreaElement:Textarea,HTMLInputElement:Textarea,Event:class{},getComputedStyle:()=>({visibility:'visible'}),setTimeout:fn=>fn(),document:{querySelectorAll:selector=>selector.startsWith('textarea')?(options.multiple?[field,new Textarea()]:[field]):(options.noButton?[]:[button])}};
  vm.runInNewContext(fs.readFileSync('extension/content.js','utf8'),sandbox);
  const reply=await new Promise(resolve=>listener({type:'SCENEPILOT',action:options.action||'send',prompt:options.prompt||'สร้างวิดีโอแนวตั้ง'}, {id:'test'},resolve));
  return {reply,clicks,value:field.value};
}
(async()=>{
  let r=await run();assert.equal(r.reply.ok,true);assert.equal(r.clicks,1);assert.equal(r.reply.submitted,true);
  r=await run({joinLines:true,prompt:'เรื่องแรก\n\nเรื่องที่สอง'});assert.equal(r.reply.ok,true);assert.equal(r.clicks,1);
  r=await run({action:'fill'});assert.equal(r.clicks,0);assert.equal(r.reply.filled,true);
  r=await run({initial:'ข้อความของผู้ใช้'});assert.equal(r.reply.ok,false);assert.equal(r.clicks,0);assert.equal(r.value,'ข้อความของผู้ใช้');
  r=await run({multiple:true});assert.equal(r.reply.ok,false);assert.equal(r.clicks,0);
  r=await run({noButton:true});assert.equal(r.reply.ok,false);assert.equal(r.reply.filled,true);assert.equal(r.clicks,0);
  console.log('PASS: send, fill-only, occupied composer, ambiguous composer and missing button fallback (simulated DOM)');
})().catch(error=>{console.error(error);process.exitCode=1;});
