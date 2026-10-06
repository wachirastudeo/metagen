chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

const isMeta = url => { try { return ['meta.ai', 'www.meta.ai'].includes(new URL(url).hostname); } catch { return false; } };
async function connectMeta(){
  const [active]=await chrome.tabs.query({active:true,currentWindow:true});
  let tab=active && isMeta(active.url)?active:null;
  if(!tab){
    const candidates=await chrome.tabs.query({currentWindow:true,url:['https://www.meta.ai/*','https://meta.ai/*']});
    tab=candidates.find(t=>t.url==='https://www.meta.ai/create') || candidates[0];
    tab=tab?await chrome.tabs.update(tab.id,{active:true}):await chrome.tabs.create({url:'https://www.meta.ai/create',active:true});
  }
  let lastError='หน้า Meta AI ยังโหลดไม่เสร็จ';
  for(let attempt=0;attempt<24;attempt++){
    const current=await chrome.tabs.get(tab.id);
    if(!isMeta(current.url || current.pendingUrl))throw new Error('หน้าเว็บเปลี่ยนออกจาก Meta AI กรุณาเชื่อมต่อใหม่');
    if(current.status==='complete'){
      try{
        let result;
        try{result=await chrome.tabs.sendMessage(tab.id,{type:'SCENEPILOT',action:'probe'});}
        catch(error){
          if(!/Receiving end|Could not establish connection/.test(error.message))throw error;
          await chrome.scripting.executeScript({target:{tabId:tab.id},files:['content.js']});
          result=await chrome.tabs.sendMessage(tab.id,{type:'SCENEPILOT',action:'probe'});
        }
        if(result?.ok)return {...result,pageUrl:current.url};
        lastError=result?.error || lastError;
      }catch(error){lastError=error.message;}
    }
    await new Promise(resolve=>setTimeout(resolve,500));
  }
  return {ok:false,error:`เปิด Meta AI ให้แล้ว แต่ยังเชื่อมช่องพร้อมต์ไม่ได้: ${lastError} หากเว็บให้เข้าสู่ระบบ ให้เข้าสู่ระบบแล้วกดเชื่อมต่ออีกครั้ง`};
}
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (sender.id !== chrome.runtime.id || message.type !== 'META_COMMAND') return;
  (async () => {
    if(message.action==='connect')return await connectMeta();
    // Always use the current tab. Never send a project to a hidden, unrelated tab.
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !isMeta(tab.url)) throw new Error('เปิดแท็บ meta.ai และล็อกอินก่อน แล้วกดเชื่อมต่ออีกครั้ง');
    return await chrome.tabs.sendMessage(tab.id, { type: 'SCENEPILOT', action: message.action, prompt: message.prompt, attachments: message.attachments });
  })().then(reply).catch(error => reply({ ok: false, error: error.message.includes('Receiving end') ? 'รีเฟรชหน้า Meta AI หลังติดตั้ง extension แล้วลองอีกครั้ง' : error.message }));
  return true;
});
