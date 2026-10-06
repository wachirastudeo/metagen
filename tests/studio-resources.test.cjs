const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
async function failingSetup(stage){
  let closed=0,stopped=0;
  const track={stop(){stopped++;}},stream={addTrack(){},getTracks(){return [track];}};
  class AudioContext{
    state='running';createMediaStreamDestination(){return {stream:{getAudioTracks(){return [];}}};}
    createMediaElementSource(){if(stage==='audio')throw new Error('audio setup failed');return {connect(){}};}
    async close(){closed++;this.state='closed';}
  }
  class MediaRecorder{static isTypeSupported(){return true;}constructor(){throw new Error('recorder setup failed');}}
  const db={transaction(){
    const transaction={objectStore(){return {get(){const request={result:{size:1,blob:new Blob(['test'])}};
      queueMicrotask(()=>{request.onsuccess();transaction.oncomplete();});return request;}};}};return transaction;
  }};
  const indexedDB={open(){const request={result:db};queueMicrotask(()=>request.onsuccess());return request;}};
  const context={Blob,indexedDB,AudioContext,MediaRecorder,HTMLCanvasElement:{prototype:{captureStream(){}}},
    document:{createElement:tag=>tag==='canvas'?{getContext(){return {};},captureStream(){return stream;}}:{pause(){},removeAttribute(){},load(){}}},clearInterval};
  vm.createContext(context);vm.runInContext(fs.readFileSync('extension/studio-media.js','utf8'),context);
  await assert.rejects(context.StudioMedia.assemble([{episode:1,shot:1,clip:{id:'one'}}]),new RegExp(stage+' setup failed'));
  assert.equal(closed,1);assert.equal(stopped,stage==='recorder'?1:0);
}
test('recorder setup failure closes audio and stops capture tracks',()=>failingSetup('recorder'));
test('audio graph setup failure closes the partially initialized context',()=>failingSetup('audio'));
test('audio-only files mislabeled as video are rejected before storage',async()=>{
  const video=new EventTarget();Object.assign(video,{duration:1,videoWidth:0,videoHeight:0,
    load(){if(this.src)queueMicrotask(()=>this.dispatchEvent(new Event('loadeddata')));},removeAttribute(){delete this.src;}});
  let opened=0,revoked=0;
  const context={Blob,setTimeout,clearTimeout,document:{createElement(){return video;}},
    indexedDB:{open(){opened++;}},URL:{createObjectURL(){return 'blob:test';},revokeObjectURL(){revoked++;}}};
  vm.createContext(context);vm.runInContext(fs.readFileSync('extension/studio-media.js','utf8'),context);
  await assert.rejects(context.StudioMedia.save(new Blob(['audio'],{type:'video/mp4'})),/ไม่มีภาพวิดีโอ/);
  assert.equal(opened,0);assert.equal(revoked,1);
});
