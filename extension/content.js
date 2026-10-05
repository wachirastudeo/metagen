(() => {
  if(globalThis.__scenePilotBridge)return;
  globalThis.__scenePilotBridge=true;
  const visible = el => !!(el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
  const editable = () => [...document.querySelectorAll('textarea, [contenteditable="true"], [role="textbox"]')]
    .filter(el => visible(el) && !el.disabled && !el.readOnly && el.getAttribute('aria-disabled') !== 'true');
  function composer() {
    const fields = editable();
    const described = fields.filter(el => /prompt|ask|message|describe|ถาม|ข้อความ|อธิบาย/i.test([el.getAttribute('aria-label'), el.getAttribute('placeholder'), el.getAttribute('data-placeholder')].join(' ')));
    const choices = described.length ? described : fields;
    if (choices.length !== 1) throw new Error(choices.length ? 'พบช่องข้อความหลายช่อง กรุณาปิดหน้าต่างอื่นใน Meta AI ก่อนส่ง' : 'ไม่พบช่องพร้อมต์ กรุณาเปิดหน้าสร้างวิดีโอหรือช่องแชตของ Meta AI');
    return choices[0];
  }
  function read(el) { return 'value' in el ? el.value : el.innerText; }
  function sendButton(el) {
    const root = el.closest('form') || el.closest('[role="dialog"]') || document;
    const matches = [...root.querySelectorAll('button, [role="button"]')].filter(button => {
      const name = [button.getAttribute('aria-label'), button.getAttribute('title'), button.innerText].join(' ').trim();
      return visible(button) && !button.disabled && button.getAttribute('aria-disabled') !== 'true' && /^(send|submit|generate|create|ส่ง|ส่งข้อความ|สร้าง|สร้างวิดีโอ|เจน)(\s|$)/i.test(name);
    });
    if (matches.length !== 1) throw new Error('ไม่พบปุ่มส่งที่แน่ชัด พร้อมต์ถูกกรอกแล้ว ให้กดส่งบนหน้า Meta AI เอง');
    return matches[0];
  }
  function mediaSnapshot() {
    const dialog=document.querySelector('[role="dialog"]');
    const headings=[...document.querySelectorAll('h1,h2,h3,h4,[role="heading"]')];
    const works=headings.find(el=>/^(ผลงาน|Your creations|Creations)$/i.test(el.textContent.trim()));
    const roots=dialog?[dialog]:[document.querySelector('main') || document];
    const found=new Map();
    for(const root of roots)for(const img of root.querySelectorAll('img')) {
      // Chat may show web-search illustrations before the generated media.
      if(!dialog && location.pathname.startsWith('/prompt/') && img.getAttribute('data-testid')!=='ur-image-tile')continue;
      if(!visible(img) || img.closest('nav') || Math.max(img.naturalWidth,img.width)<120 || Math.max(img.naturalHeight,img.height)<120)continue;
      if(!dialog && location.pathname.startsWith('/create') && (!works || !(works.compareDocumentPosition(img)&Node.DOCUMENT_POSITION_FOLLOWING)))continue;
      const src=img.currentSrc || img.src;
      let url;try{url=new URL(src);}catch{continue;}
      if(url.protocol!=='https:' || !/(^|\.)(meta\.ai|fbcdn\.net|fbsbx\.com|cdninstagram\.com)$/.test(url.hostname))continue;
      const key=url.origin+url.pathname;
      if(found.has(key))continue;
      const anchor=img.closest('a[href]');
      found.set(key,{key,src:url.href,alt:(img.alt || '').slice(0,500),width:img.naturalWidth || img.width,height:img.naturalHeight || img.height,pageUrl:anchor?.href?.startsWith('https://www.meta.ai/')?anchor.href:location.href});
    }
    return {ok:true,pageUrl:location.href,images:[...found.values()].slice(0,80),scope:dialog?'dialog':works?'creations':'page'};
  }
  let locked = false;
  chrome.runtime.onMessage.addListener((message, sender, reply) => {
    if (sender.id !== chrome.runtime.id || message.type !== 'SCENEPILOT') return;
    (async () => {
      if(message.action==='readMedia')return mediaSnapshot();
      if(message.action==='inspectMedia')return {ok:true,pageUrl:location.href,
        fields:editable().map(el=>({tag:el.tagName,role:el.getAttribute('role'),label:el.getAttribute('aria-label'),placeholder:el.getAttribute('placeholder'),html:el.outerHTML.slice(0,1500)})),
        images:[...document.querySelectorAll('main img')].slice(0,40).map(el=>({src:el.currentSrc || el.src,alt:el.alt,width:el.naturalWidth,height:el.naturalHeight,parent:el.parentElement.outerHTML.slice(0,1500)})),
        headings:[...document.querySelectorAll('h1,h2,h3,h4,[role="heading"]')].map(el=>({text:el.textContent,html:el.outerHTML.slice(0,1000)})),media:mediaSnapshot()};
      if (message.action === 'probe') { composer(); return { ok: true, status: 'พร้อมรับพร้อมต์' }; }
      if (message.action === 'readSelection') {
        const text=window.getSelection()?.toString().trim();
        if(!text) throw new Error('เลือกข้อความคำตอบของ Meta AI บนหน้าเว็บก่อน หรือคัดลอกมาวางในช่องคำตอบ');
        if(text.length>500000) throw new Error('ข้อความที่เลือกยาวเกินกำหนด');
        return {ok:true,text};
      }
      if (!['fill', 'send'].includes(message.action)) throw new Error('คำสั่งไม่ถูกต้อง');
      if (locked) throw new Error('กำลังส่งพร้อมต์ กรุณารอสักครู่');
      if (typeof message.prompt !== 'string' || !message.prompt.trim() || message.prompt.length > 20000) throw new Error('พร้อมต์ต้องมีข้อความและไม่เกิน 20,000 ตัวอักษร');
      locked = true;
      let filled = false;
      try {
        const el = composer();
        if (read(el).trim()) throw new Error('ช่อง Meta AI มีข้อความอยู่แล้ว กรุณาส่งหรือล้างข้อความเดิมก่อน');
        el.focus();
        if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
          const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, message.prompt);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          // insertText lets rich editors receive their normal input events; never insert HTML.
          const selection = window.getSelection();
          const range = document.createRange(); range.selectNodeContents(el);
          selection.removeAllRanges(); selection.addRange(range);
          if (!document.execCommand('insertText', false, message.prompt)) throw new Error('ตัวแก้ไขไม่รับข้อความ กรุณาใช้ปุ่มคัดลอกพร้อมต์');
        }
        await new Promise(resolve => setTimeout(resolve, 250));
        if (read(el).replace(/\r?\n/g, '').trim() !== message.prompt.replace(/\r?\n/g, '').trim()) throw new Error('ตรวจข้อความในช่องไม่สำเร็จ กรุณาคัดลอกพร้อมต์แล้ววางเอง');
        filled = true;
        if (message.action === 'fill') return { ok: true, filled: true, submitted: false };
        sendButton(el).click();
        // A click does not prove the server accepted a generation.
        return { ok: true, filled: true, submitted: true, status: 'กดส่งแล้ว กรุณาตรวจผลบน Meta AI' };
      } catch (error) { return { ok: false, filled, error: error.message }; }
      finally { locked = false; }
    })().then(reply).catch(error => reply({ ok: false, error: error.message }));
    return true;
  });
})();
