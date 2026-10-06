const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function img(name,{generated=false,after=true,host='scontent.xx.fbcdn.net',hidden=false}={}){
 return {name,after,src:`https://${host}/${name}.webp`,alt:name,naturalWidth:1152,naturalHeight:2048,width:180,height:320,
 getClientRects:()=>hidden?[]:[1],getAttribute:k=>k==='data-testid'&&generated?'ur-image-tile':null,closest:()=>null};
}
async function read(path,images){
 let listener;const heading={textContent:'ผลงาน',compareDocumentPosition:x=>x.after?4:2};const main={querySelectorAll:()=>images};
 const document={querySelector:s=>s==='main'?main:null,querySelectorAll:()=>path==='/create'?[heading]:[]};
 vm.runInNewContext(fs.readFileSync('extension/content.js','utf8'),{document,URL,Node:{DOCUMENT_POSITION_FOLLOWING:4},location:{pathname:path,href:`https://www.meta.ai${path}`},getComputedStyle:()=>({visibility:'visible'}),chrome:{runtime:{id:'test',onMessage:{addListener:f=>listener=f}}}});
 return await new Promise(resolve=>listener({type:'SCENEPILOT',action:'readMedia'},{id:'test'},resolve));
}
(async()=>{
 let r=await read('/prompt/example',[img('search'),img('generated',{generated:true}),img('external',{generated:true,host:'evil.test'})]);
 assert.equal(r.ok,true);assert.deepEqual(Array.from(r.images,x=>x.alt),['generated']);
 r=await read('/create',[img('preset',{after:false}),img('work'),img('hidden',{hidden:true}),img('work')]);
 assert.deepEqual(Array.from(r.images,x=>x.alt),['work']);assert.equal(r.scope,'creations');
 r=await read('/',[img('home-illustration'),img('avatar',{generated:true})]);
 assert.equal(r.images.length,0,'Home images must not finish a pending generation');
 r=await read('/artifacts',[img('artifact-thumbnail')]);
 assert.equal(r.images.length,0,'unrelated pages do not supply generated images');
 console.log('PASS: generated chat media, search/preset exclusion, hidden images, URL filtering and deduplication');
})().catch(e=>{console.error(e);process.exitCode=1;});
