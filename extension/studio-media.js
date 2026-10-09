/* Local clip storage and episode/series assembly. No remote service or microphone. */
(function(root){
  const MAX_FILE=250*1024*1024;
  let database;
  function openStore(){
    if(!database)database=new Promise((resolve,reject)=>{
      const request=indexedDB.open('scenepilot-clips',1);
      request.onupgradeneeded=()=>request.result.createObjectStore('clips',{keyPath:'id'});
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(new Error('เปิดพื้นที่เก็บคลิปไม่ได้'));
    }).catch(error=>{database=null;throw error;});
    return database;
  }
  async function store(mode,operation){
    const db=await openStore();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('clips',mode);let result;
      const request=operation(tx.objectStore('clips'));
      request.onsuccess=()=>{result=request.result;};
      tx.oncomplete=()=>resolve(result);
      tx.onerror=tx.onabort=()=>reject(new Error('บันทึกหรืออ่านคลิปไม่ได้ พื้นที่เก็บอาจไม่พอ'));
    });
  }
  const get=id=>store('readonly',table=>table.get(id));
  const clear=()=>store('readwrite',table=>table.clear());
  const MAX_IMAGE=10*1024*1024;
  async function inspectImage(file,{signal}={}){
    if(!(file instanceof Blob) || !file.size || file.size>MAX_IMAGE)throw new Error('เลือกภาพ PNG, JPEG หรือ WebP ขนาดไม่เกิน 10 MB');
    const check=()=>{if(signal?.aborted)throw new DOMException('ยกเลิก','AbortError');};check();
    const header=new Uint8Array(await file.slice(0,12).arrayBuffer());
    const matches=(offset,bytes)=>bytes.every((byte,i)=>header[offset+i]===byte);
    const type=matches(0,[137,80,78,71,13,10,26,10])?'image/png':matches(0,[255,216,255])?'image/jpeg':matches(0,[82,73,70,70]) && matches(8,[87,69,66,80])?'image/webp':null;
    if(!type)throw new Error('รองรับภาพ PNG, JPEG และ WebP จริงเท่านั้น');
    let bitmap;try{
      bitmap=await createImageBitmap(file);check();
      if(!bitmap.width || !bitmap.height || bitmap.width>8192 || bitmap.height>8192 || bitmap.width*bitmap.height>40000000)throw new Error('ภาพใหญ่เกินกำหนด รองรับไม่เกิน 8192 พิกเซลและ 40 ล้านพิกเซล');
      return {id:crypto.randomUUID(),name:(file.name || `portrait.${type==='image/jpeg'?'jpg':type.split('/')[1]}`).slice(0,240),size:file.size,type,width:bitmap.width,height:bitmap.height,blob:file.slice(0,file.size,type)};
    }catch(error){if(error.name==='AbortError' || error.message.includes('ภาพใหญ่'))throw error;throw new Error('อ่านไฟล์ภาพไม่ได้ กรุณาเลือกภาพที่สมบูรณ์');}
    finally{bitmap?.close();}
  }
  async function inspect(file,{signal}={}){
    if(!(file instanceof Blob) || !file.size || file.size>MAX_FILE)throw new Error('เลือกไฟล์วิดีโอขนาดไม่เกิน 250 MB');
    if(!file.type.startsWith('video/') && !/\.(mp4|webm|mov|m4v)$/i.test(file.name || ''))throw new Error('รองรับไฟล์วิดีโอ MP4, WebM หรือ MOV ที่ Chrome เล่นได้');
    const video=document.createElement('video'),url=URL.createObjectURL(file);
    try{
      await loadVideo(video,url,signal);
      const duration=video.duration;
      if(!Number.isFinite(duration) || duration<=0)throw new Error('อ่านความยาวคลิปไม่ได้ กรุณาใช้ไฟล์ที่มีความยาววิดีโอครบถ้วน');
      if(!video.videoWidth || !video.videoHeight)throw new Error('ไฟล์นี้ไม่มีภาพวิดีโอ กรุณาเลือกคลิปวิดีโอจริง');
      const clip={id:crypto.randomUUID(),name:(file.name || 'scene.webm').slice(0,240),size:file.size,type:file.type || 'video/mp4',duration,width:video.videoWidth,height:video.videoHeight};
      return {...clip,blob:file};
    }finally{video.removeAttribute('src');video.load();URL.revokeObjectURL(url);}
  }
  async function putMany(clips){
    if(!clips.length)return;
    const db=await openStore();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('clips','readwrite');
      tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>reject(new Error('บันทึกไฟล์สำรองไม่ได้ พื้นที่เก็บอาจไม่พอ'));
      try{const table=tx.objectStore('clips');for(const clip of clips)table.add(clip);}
      catch(error){tx.abort();reject(error);}
    });
  }
  async function save(file){
    const record=await inspect(file);await putMany([record]);const {blob,...clip}=record;return clip;
  }
  function ordered(scenes,episode){return scenes.filter(scene=>episode===undefined || scene.episode===episode).slice().sort((a,b)=>a.episode-b.episode || a.shot-b.shot);}
  function loadVideo(video,url,signal){
    return new Promise((resolve,reject)=>{
      let timer;
      const finish=error=>{clearTimeout(timer);video.removeEventListener('loadeddata',loaded);video.removeEventListener('error',failed);signal?.removeEventListener('abort',aborted);error?reject(error):resolve();};
      const loaded=()=>finish();const failed=()=>finish(new Error('Chrome เล่นไฟล์นี้ไม่ได้ กรุณาเลือก MP4/WebM ที่ถูกต้อง'));const aborted=()=>finish(new DOMException('ยกเลิกการรวมหนัง','AbortError'));
      video.addEventListener('loadeddata',loaded,{once:true});video.addEventListener('error',failed,{once:true});signal?.addEventListener('abort',aborted,{once:true});
      timer=setTimeout(()=>finish(new Error('โหลดคลิปเกิน 30 วินาที')),30000);
      if(signal?.aborted)return aborted();
      video.preload='auto';video.playsInline=true;video.src=url;video.load();
    });
  }
  function download(blob,name){
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  function filename(title,suffix,ext){return (title || 'ScenePilot').replace(/[\\/:*?"<>|\u0000-\u001f]/g,'-').slice(0,100)+'-'+suffix+'.'+ext;}
  function waitEvent(target,name,signal){return new Promise((resolve,reject)=>{
    const clean=()=>{target.removeEventListener(name,done);signal?.removeEventListener('abort',abort);};
    const done=()=>{clean();resolve();};const abort=()=>{clean();reject(new DOMException('ยกเลิกการรวมหนัง','AbortError'));};
    target.addEventListener(name,done,{once:true});signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
  });}
  async function assemble(items,{orientation='9:16',signal,onProgress=()=>{}}={}){
    if(!items.length)throw new Error('ยังไม่มีฉากให้รวม');
    if(!root.MediaRecorder || !root.AudioContext || !HTMLCanvasElement.prototype.captureStream)throw new Error('Chrome นี้ไม่รองรับการรวมวิดีโอ กรุณาอัปเดต Chrome');
    const mime=['video/webm;codecs=vp8,opus','video/webm;codecs=vp9,opus','video/webm'].find(type=>MediaRecorder.isTypeSupported(type));
    if(!mime)throw new Error('Chrome นี้ไม่มีตัวเข้ารหัส WebM');
    const clips=[];let bytes=0;
    for(const scene of items){
      if(signal?.aborted)throw new DOMException('ยกเลิกการรวมหนัง','AbortError');
      const clip=scene.clip && await get(scene.clip.id);
      if(!clip?.blob)throw new Error(`ตอน ${scene.episode} ฉาก ${scene.shot} ยังไม่มีไฟล์คลิป เลือกไฟล์ให้ครบก่อนรวม`);
      bytes+=clip.size;if(bytes>600*1024*1024)throw new Error('คลิปรวมเกิน 600 MB กรุณาดาวน์โหลดแยกรายตอน');
      clips.push(clip);
    }
    const canvas=document.createElement('canvas');canvas.width=orientation==='16:9'?1280:720;canvas.height=orientation==='16:9'?720:1280;
    const context=canvas.getContext('2d'),video=document.createElement('video');
    let audio,stream,recorder,currentURL,timer,totalBytes=0,recorderError;const chunks=[];
    const draw=()=>{if(video.readyState<2)return;const scale=Math.min(canvas.width/video.videoWidth,canvas.height/video.videoHeight);const width=video.videoWidth*scale,height=video.videoHeight*scale;context.fillStyle='#000';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(video,(canvas.width-width)/2,(canvas.height-height)/2,width,height);};
    try{
      if(!context)throw new Error('เปิดพื้นที่วาดวิดีโอไม่ได้');
      audio=new AudioContext();
      const destination=audio.createMediaStreamDestination();audio.createMediaElementSource(video).connect(destination);
      stream=canvas.captureStream(30);for(const track of destination.stream.getAudioTracks())stream.addTrack(track);
      recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:4000000,audioBitsPerSecond:128000});
      recorder.addEventListener('dataavailable',event=>{if(event.data.size){totalBytes+=event.data.size;chunks.push(event.data);if(totalBytes>600*1024*1024){recorderError=new Error('ไฟล์รวมเกิน 600 MB');video.pause();}}});
      recorder.addEventListener('error',()=>{recorderError=new Error('เข้ารหัสวิดีโอไม่สำเร็จ');video.pause();});
      await audio.resume();
      for(let index=0;index<clips.length;index++){
        if(signal?.aborted)throw new DOMException('ยกเลิกการรวมหนัง','AbortError');
        currentURL=URL.createObjectURL(clips[index].blob);await loadVideo(video,currentURL,signal);draw();
        if(index===0){recorder.start(1000);timer=setInterval(draw,1000/30);}else recorder.resume();
        const scene=items[index];onProgress({index,total:clips.length,scene,elapsed:0,duration:clips[index].duration});
        await new Promise((resolve,reject)=>{
          let watchdog;
          const clean=()=>{clearTimeout(watchdog);video.removeEventListener('ended',done);video.removeEventListener('error',failed);video.removeEventListener('pause',paused);video.removeEventListener('timeupdate',progress);signal?.removeEventListener('abort',abort);};
          const done=()=>{clean();resolve();};const failed=()=>{clean();reject(new Error(`อ่านคลิปตอน ${scene.episode} ฉาก ${scene.shot} ไม่สำเร็จ`));};
          const abort=()=>{clean();video.pause();reject(new DOMException('ยกเลิกการรวมหนัง','AbortError'));};
          const paused=()=>{if(recorderError){clean();reject(recorderError);}};
          const progress=()=>onProgress({index,total:clips.length,scene,elapsed:video.currentTime,duration:clips[index].duration});
          video.addEventListener('ended',done,{once:true});video.addEventListener('error',failed,{once:true});video.addEventListener('pause',paused);video.addEventListener('timeupdate',progress);signal?.addEventListener('abort',abort,{once:true});
          watchdog=setTimeout(()=>{clean();reject(new Error('คลิปหยุดเล่นระหว่างรวม กรุณาลองใหม่'));},(clips[index].duration+30)*1000);
          if(signal?.aborted)return abort();video.play().catch(error=>{clean();reject(error);});
        });
        if(recorderError)throw recorderError;
        if(index<clips.length-1){const paused=waitEvent(recorder,'pause',signal);recorder.pause();await paused;}
        video.removeAttribute('src');video.load();URL.revokeObjectURL(currentURL);currentURL=null;
      }
      const stopped=waitEvent(recorder,'stop',signal);recorder.stop();await stopped;
      if(!chunks.length)throw new Error('ไม่มีข้อมูลวิดีโอที่ส่งออก');
      const output=new Blob(chunks,{type:recorder.mimeType});
      if(!root.WebmDuration)throw new Error('โหลดตัวจัดความยาววิดีโอไม่สำเร็จ กรุณาเปิดแถบข้างใหม่');
      const result=await root.WebmDuration.fix(output,clips.reduce((sum,clip)=>sum+clip.duration,0)*1000);
      if(signal?.aborted)throw new DOMException('ยกเลิกการรวมหนัง','AbortError');
      return result;
    }finally{
      clearInterval(timer);video.pause();video.removeAttribute('src');video.load();
      if(recorder && recorder.state!=='inactive')recorder.stop();
      for(const track of stream?.getTracks() || [])track.stop();
      if(audio && audio.state!=='closed')await audio.close().catch(()=>{});
      if(currentURL)URL.revokeObjectURL(currentURL);
    }
  }
  const api={ordered,filename,get,clear,inspect,inspectImage,putMany,save,download,assemble,MAX_FILE,MAX_IMAGE};
  if(typeof module!=='undefined')module.exports=api;else root.StudioMedia=api;
})(globalThis);
