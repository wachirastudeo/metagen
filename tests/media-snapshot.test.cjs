const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

test('Home illustrations cannot finish a pending image generation',async()=>{
  let listener;
  const sandbox={
    chrome:{runtime:{id:'test',onMessage:{addListener:fn=>listener=fn}}},
    location:{pathname:'/',href:'https://www.meta.ai/'},
    document:{querySelector:()=>null,querySelectorAll:()=>[]}
  };
  vm.runInNewContext(fs.readFileSync('extension/content.js','utf8'),sandbox);
  const result=await new Promise(resolve=>listener({type:'SCENEPILOT',action:'readMedia'},{id:'test'},resolve));
  assert.equal(result.ok,true);
  assert.equal(result.images.length,0);
  assert.equal(result.scope,'page');
});
