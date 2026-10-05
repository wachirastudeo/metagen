(function (root) {
  const defaults = { title:'', synopsis:'', plotMode:'manual', idea:'', seriesType:'general', era:'', genre:'ดราม่า', orientation:'9:16', episodes:1, duration:10, style:'สมจริงแบบภาพยนตร์', characters:'', locations:'', productMode:'off', product:'', language:'ไทย', audio:'มีบทพูด', extra:'' };
  const periodPrompts = {
    chinese: 'ซีรีส์จีนย้อนยุค: เสื้อผ้าและทรงผมจีนโบราณ ฉากสถาปัตยกรรมจีนโบราณ รักษาเครื่องแต่งกายและบรรยากาศให้สอดคล้องกับยุคที่กำหนด หลีกเลี่ยงสิ่งของและอาคารสมัยใหม่ ไม่เพิ่มพลังวิเศษหรือการเหาะเว้นแต่เนื้อหาฉากระบุ',
    thai: 'ซีรีส์ไทยย้อนยุค: บรรยากาศละครรักไทยย้อนยุคละมุน หรูหรา โทนครีม งาช้าง ชมพูกุหลาบ และทอง แสงอาทิตย์สีทองอุ่นส่องผ่านใบไม้หรือหน้าต่าง แสงเงานุ่ม ฉากหลังละลายและมีมิติ รายละเอียดผ้าไหมและเครื่องประดับประณีต แนวทางชุดเมื่อเหมาะกับตัวละครและยุค: ชายสวมเสื้อคอตั้งผ้าไหมลายทองสีงาช้างกับโจงกระเบน หญิงห่มสไบผ้าไหมสีครีมกับผ้านุ่งชมพูหม่น เครื่องประดับทองและดอกไม้ประดับมวยผม ฉากเรือนไทยไม้ริมน้ำ สวนดอกไม้หรือบัวเมื่อสอดคล้องกับเหตุการณ์ แสดงอารมณ์ผ่านสายตาและท่าทางเป็นธรรมชาติ ไม่บังคับให้ทุกฉากเป็นฉากรักหรือมีตัวละครคู่ รักษาชุด ทรงผม สถาปัตยกรรม และฐานะให้ตรงยุคที่ระบุและข้อมูลตัวละคร หลีกเลี่ยงสิ่งของสมัยใหม่ ไม่มีข้อความ ชื่อเรื่อง โลโก้ หรือกรอบโปสเตอร์บนภาพ'
  };
  function settings(raw) {
    const result = { ...defaults };
    for (const key of Object.keys(defaults)) if (typeof defaults[key] === 'string') result[key] = String(raw[key] ?? defaults[key]).slice(0,6000);
    result.episodes = Math.min(30, Math.max(1, Math.floor(Number(raw.episodes) || defaults.episodes)));
    result.duration = [5,8,10].includes(Number(raw.duration)) ? Number(raw.duration) : 10;
    result.orientation = raw.orientation === '16:9' ? '16:9' : '9:16';
    result.seriesType = ['general','chinese','thai'].includes(raw.seriesType) ? raw.seriesType : 'general';
    result.plotMode = raw.plotMode === 'ai' ? 'ai' : 'manual';
    result.productMode = raw.productMode === 'on' ? 'on' : 'off';
    return result;
  }
  function prompt(config, scene) {
    const c = settings(config);
    return [`สร้างวิดีโอ${c.orientation === '9:16' ? 'แนวตั้ง' : 'แนวนอน'} อัตราส่วน ${c.orientation} ความยาว ${c.duration} วินาที`,
      `สไตล์ ${c.style} แนว${c.genre}`, periodPrompts[c.seriesType], c.seriesType === 'thai' && c.style === 'สมจริงแบบภาพยนตร์' && 'ภาพนักแสดงคนจริงแบบภาพยนตร์ ผิวเป็นธรรมชาติ ใบหน้าและมือสมส่วน รายละเอียดผ้าไหมคมชัด โทนโรแมนติกอบอุ่น ไม่ใช่ภาพการ์ตูน', c.era && `ยุค / สถานที่ของเรื่อง: ${c.era}`, c.title && `ซีรีส์: ${c.title} ตอน ${scene.episode} ฉาก ${scene.shot}`,
      c.synopsis && `บริบทเรื่อง: ${c.synopsis}`, c.characters && `ตัวละครหลัก (รักษาหน้าตา ทรงผม และเสื้อผ้าให้ต่อเนื่อง): ${c.characters}`,
      c.locations && `สถานที่อ้างอิงของเรื่อง (ใช้เฉพาะที่ตรงกับฉากนี้): ${c.locations}`, c.productMode==='on' && c.product && `สินค้าในเรื่อง: ${c.product} ใช้เมื่อเหมาะกับเหตุการณ์ ไม่เปลี่ยนเนื้อหาฉากเพื่อขายสินค้า`,
      `ฉากนี้: ${scene.description || 'โปรดระบุเหตุการณ์ของฉากนี้'}`, scene.dialogue && `บทพูดภาษา${c.language}: ${scene.dialogue}`,
      `เสียง: ${scene.dialogue?.trim() ? 'มีบทพูดและเสียงบรรยากาศ ให้ตัวละครพูดตามบทด้านบนตามลำดับ ผู้พูดตรงกับชื่อ เสียงและปากสัมพันธ์กัน ไม่สลับเสียง ไม่ใช้ผู้บรรยายแทนบทสนทนา ไม่ใส่ซับหรือตัวหนังสือ' : c.audio}`, 'จัดองค์ประกอบให้ตรงสัดส่วนที่ระบุ การเคลื่อนไหวเป็นธรรมชาติ รักษาความต่อเนื่องของตัวละคร', c.extra && `ข้อกำหนดเพิ่มเติม: ${c.extra}`].filter(Boolean).join('\n\n');
  }
  function createScenes(config) {
    const c = settings(config), scenes = [];
    for(let e=1;e<=c.episodes;e++) { const s=1;
      const scene = { id:crypto.randomUUID(),episode:e,shot:s,description:'',dialogue:'',result:'',status:'draft',prompt:'' };
      scene.prompt = prompt(c,scene); scenes.push(scene);
    }
    return scenes;
  }
  function validateProject(value) {
    if (!value || value.version !== 1 || !value.settings || !Array.isArray(value.scenes) || value.scenes.length > 900) throw new Error('รูปแบบโปรเจกต์ไม่ถูกต้อง หรือมีฉากเกิน 900 ฉาก');
    const ids=new Set();
    const scenes=value.scenes.map(s=>{
      if(!s || typeof s.id !== 'string' || ids.has(s.id) || s.id.length>100 || !Number.isInteger(s.episode) || s.episode<1 || s.episode>30 || !Number.isInteger(s.shot) || s.shot<1 || s.shot>900) throw new Error('ข้อมูลฉากไม่ถูกต้อง');
      ids.add(s.id);
      const result={id:s.id,episode:s.episode,shot:s.shot,status:['draft','filled','submitted','done'].includes(s.status)?s.status:'draft'};
      for(const k of ['description','dialogue','prompt','result']) { if(typeof s[k]!=='string' || s[k].length>20000) throw new Error('ข้อความในฉากไม่ถูกต้อง'); result[k]=s[k]; }
      return result;
    });
    return {version:1,settings:settings(value.settings),scenes,cast:validateCast(value.cast || []),plotOptions:validatePlotOptions(value.plotOptions || []),assets:validateAssets(value.assets || [])};
  }
  function validatePlotOptions(items) {
    if(!Array.isArray(items) || items.length>5)throw new Error('รองรับพล็อตให้เลือกสูงสุด 5 เรื่อง');
    return items.map(item=>{
      if(!item || ['title','synopsis'].some(k=>typeof item[k]!=='string' || !item[k].trim() || item[k].length>(k==='title'?120:6000)))throw new Error('แต่ละพล็อตต้องมีชื่อเรื่องและเรื่องย่อ');
      return {title:item.title,synopsis:item.synopsis};
    });
  }
  function parsePlotOptions(text) {
    if(typeof text!=='string' || text.length>100000)throw new Error('คำตอบพล็อตยาวเกินกำหนด');
    let data;try{data=JSON.parse(text.slice(text.indexOf('{'),text.lastIndexOf('}')+1));}catch{throw new Error('วาง JSON คำตอบให้ครบ');}
    const items=validatePlotOptions(data.plots);
    if(items.length<2)throw new Error('ต้องมีอย่างน้อย 2 พล็อตให้เลือก');
    return items;
  }
  function plotOptionsPrompt(config, previous=[]) {
    const c=settings(config);
    return ['ช่วยเสนอพล็อตซีรีส์ 5 เรื่องที่แตกต่างกันให้ฉันเลือก ยังไม่สร้างภาพ วิดีโอ ตัวละครละเอียด หรือแบ่งฉาก',
      `แนว${c.genre} จำนวน ${c.episodes} ตอน ภาษา${c.language} สไตล์ ${c.style}`,periodPrompts[c.seriesType],
      c.era && `ยุคและสถานที่: ${c.era}`,c.idea && `ไอเดียตั้งต้น: ${c.idea}`,c.synopsis && `แนวทาง: ${c.synopsis}`,c.characters && `ตัวละครที่ต้องรักษา: ${c.characters}`,c.extra && `ข้อกำหนด: ${c.extra}`,
      previous.length && `ขอชุดใหม่ หลีกเลี่ยงเรื่องเดิมเหล่านี้: ${previous.map(p=>p.title).join(' / ')}`,
      'แต่ละเรื่องมีชื่อและเรื่องย่อที่บอกตัวเอก เป้าหมาย อุปสรรค จุดพลิกผัน และแนวทางบทสรุป ไม่เกิน 6000 ตัวอักษรต่อเรื่อง ชื่อไม่เกิน 120 ตัวอักษร',
      'ตอบ JSON เท่านั้น รูปแบบ {"plots":[{"title":"ชื่อเรื่อง","synopsis":"เรื่องย่อ"}]}'].filter(Boolean).join('\n\n');
  }
  function plotPrompt(config) {
    const c=settings(config);
    return ['ช่วยคิดพล็อตซีรีส์และเขียนเนื้อหาทุกฉากให้ฉัน ไม่ต้องสร้างภาพหรือวิดีโอในขั้นนี้',
      `จำนวน ${c.episodes} ตอน ให้แบ่งฉากตามเนื้อเรื่องเอง จำนวนฉากแต่ละตอนไม่จำเป็นต้องเท่ากัน รวมไม่เกิน 900 ฉาก แต่ละฉากมีการกระทำที่เล่าได้ภายใน ${c.duration} วินาที อัตราส่วนวิดีโอ ${c.orientation}`,
      `แนว${c.genre} สไตล์ภาพ ${c.style} ภาษา${c.language} เสียง: ${c.audio}`,periodPrompts[c.seriesType],
      c.era && `ยุคและสถานที่: ${c.era}`,c.title && `ชื่อเรื่องที่ต้องใช้: ${c.title}`,c.idea && `ไอเดียเริ่มต้น: ${c.idea}`,
      c.synopsis && `พล็อตที่มีอยู่ ใช้เป็นแนวทาง: ${c.synopsis}`,c.characters && `ตัวละครที่ต้องรักษาไว้: ${c.characters}`,c.extra && `ข้อกำหนด: ${c.extra}`,
      'หากไม่ได้ระบุเรื่องหรือตัวละคร ให้คิดใหม่ให้ครบ เรื่องต้องต่อเนื่อง มีเป้าหมาย อุปสรรค และบทสรุป อธิบายหน้าตา เสื้อผ้า และอายุของตัวละครเพื่อใช้ต่อเนื่อง',
      'description ต้องเป็นเหตุการณ์จริงพร้อมสถานที่ ตัวละคร การกระทำ และมุมกล้อง ไม่ใช่ช่องว่างหรือคำสั่งให้ผู้ใช้เติม ไม่ใส่เหตุการณ์มากเกินความยาวคลิป',
      c.audio==='มีบทพูด' ? `เขียนบทละครพร้อมบทสนทนาจริงใน dialogue ทุกฉากที่ตัวละครคุยกัน ระบุชื่อผู้พูดตาม cast ตามด้วยคำพูด และอารมณ์สั้น ๆ ให้มีการถามตอบหรือโต้ตอบที่ขับเคลื่อนเรื่อง ไม่ใช่บรรยายเหตุการณ์แทนบทพูด บทพูดรวมและช่วงหยุดต้องพูดจบใน ${c.duration} วินาที โดยปกติ 1–2 ประโยคสั้นต่อฉาก แบ่งบทสนทนายาวเป็นฉากต่อเนื่อง ใช้คำพูดตรงยุค ฐานะ และบุคลิก เว้น dialogue ว่างได้เฉพาะฉากเงียบที่จำเป็น และระบุเหตุผลใน description ห้ามทำทั้งเรื่องเป็นฉากเงียบ` : 'ผู้ใช้เลือกไม่มีบทพูด ให้ dialogue เป็นสตริงว่างและเล่าเรื่องด้วยการกระทำ',
      'ตอบเป็น JSON object เท่านั้น ไม่เขียนคำอธิบายก่อนหรือหลัง ไม่สร้าง prompt วิดีโอเอง extension จะประกอบจาก description และ dialogue รักษาชื่อ key ตามตัวอย่าง ให้ครบทุกตอน ใช้เลข episode เริ่มจาก 1 และ shot เริ่มจาก 1 เรียงต่อเนื่องในแต่ละตอน',
      'ออกแบบตัวละครแยกเป็น cast ให้ครบทุกตัวที่มีบทบาทในเรื่อง ทั้งพระเอก นางเอก คู่แข่ง ครอบครัว และตัวละครสนับสนุนที่จำเป็น ไม่ย่อเหลือเพียงคู่พระนาง โดยปกติ 6–12 ตัวตามพล็อต ไม่เกิน 12 ตัว ใช้ name, role, description ระบุอายุ หน้าตา ทรงผม เสื้อผ้า บุคลิก',
      'เพิ่ม locations เป็นรายการสถานที่ทุกแห่งที่ใช้ในฉาก ไม่ใช่เพียงสถานที่หลัก โดยปกติ 3–8 แห่ง ไม่เกิน 20 แห่ง แต่ละรายการมี name และ description ระบุสถาปัตยกรรม ผัง วัสดุ แสงและบรรยากาศ ไม่สร้างภาพในขั้นนี้',
      'รูปแบบ: {"title":"ชื่อซีรีส์","synopsis":"พล็อตรวม","characters":"รายละเอียดตัวละครทั้งหมด","cast":[{"name":"ชื่อตัวละคร","role":"บทบาท","description":"อายุ หน้าตา ทรงผม เสื้อผ้า บุคลิก"}],"scenes":[{"episode":1,"shot":1,"description":"เหตุการณ์และมุมกล้อง","dialogue":"บทพูดหรือสตริงว่าง"}]}'].filter(Boolean).join('\n\n');
  }
  function parsePlot(text, config) {
    if(typeof text!=='string' || text.length>500000) throw new Error('คำตอบต้องเป็นข้อความไม่เกิน 500,000 ตัวอักษร');
    const start=text.indexOf('{'),end=text.lastIndexOf('}');
    let data;try{data=JSON.parse(text.slice(start,end+1));}catch{throw new Error('คำตอบไม่ใช่ JSON ที่สมบูรณ์ ให้ Meta AI ตอบใหม่ตามรูปแบบ หรือคัดลอกให้ครบ');}
    const c=settings(config);
    for(const key of ['title','synopsis','characters']) if(typeof data?.[key]!=='string' || !data[key].trim() || data[key].length>6000) throw new Error('คำตอบต้องมีชื่อเรื่อง พล็อต และรายละเอียดตัวละครเป็นข้อความ');
    if(!Array.isArray(data.scenes) || !data.scenes.length || data.scenes.length>900) throw new Error('ต้องมีเนื้อหาฉาก 1–900 ฉาก');
    const keys=new Set();
    const scenes=data.scenes.map(s=>{
      if(!s || !Number.isInteger(s.episode) || s.episode<1 || s.episode>c.episodes || !Number.isInteger(s.shot) || s.shot<1 || s.shot>900 || keys.has(`${s.episode}:${s.shot}`)) throw new Error('เลขตอนหรือฉากผิด หรือมีฉากซ้ำ');
      keys.add(`${s.episode}:${s.shot}`);
      if(typeof s.description!=='string' || !s.description.trim() || s.description.length>6000 || typeof s.dialogue!=='string' || s.dialogue.length>2000) throw new Error('เนื้อหาฉากหรือบทพูดไม่ครบหรือยาวเกินกำหนด');
      return {id:crypto.randomUUID(),episode:s.episode,shot:s.shot,description:s.description,dialogue:s.dialogue,result:'',status:'draft',prompt:''};
    }).sort((a,b)=>a.episode-b.episode || a.shot-b.shot);
    if(c.audio==='มีบทพูด' && !scenes.some(s=>s.dialogue.trim())) throw new Error('คำตอบยังไม่มีบทพูด ให้ Meta AI เขียนบทสนทนาพร้อมชื่อผู้พูดใน dialogue แล้วส่งคำตอบใหม่');
    for(let episode=1;episode<=c.episodes;episode++) {
      const items=scenes.filter(s=>s.episode===episode);
      if(!items.length || items.some((s,index)=>s.shot!==index+1))throw new Error('คำตอบต้องมีทุกตอน และเลขฉากเรียงต่อเนื่องเริ่มจาก 1');
    }
    const updated=settings({...c,title:data.title,synopsis:data.synopsis,characters:data.characters});
    const cast=validateCast(data.cast || []);
    if(cast.length) {
      const summary=cast.map(person=>`${person.name} (${person.role}): ${person.description}`).join('\n\n');
      if(summary.length>6000)throw new Error('รายละเอียดตัวละครรวมเกิน 6,000 ตัวอักษร ให้ AI ย่อรายละเอียด');
      updated.characters=summary;
    }
    const assets=syncAssets([],cast,validateLocations(data.locations || []));
    if(data.locations?.length)updated.locations=data.locations.map(x=>`${x.name}: ${x.description}`).join('\n').slice(0,6000);
    for(const scene of scenes){scene.prompt=prompt(updated,scene);if(scene.prompt.length>20000)throw new Error('เนื้อหายาวเกินพร้อมต์ที่ส่งได้ ให้ AI ย่อเรื่องและตัวละคร');}
    return {version:1,settings:updated,scenes,cast,assets};
  }
  function dialoguePrompt(config, scenes) {
    const c=settings(config);
    if(!scenes.length || scenes.some(s=>!s.description.trim())) throw new Error('ใส่เหตุการณ์ให้ครบทุกฉากก่อนให้ AI คิดบทพูด');
    return ['เขียนบทสนทนาสำหรับซีรีส์ละครจากฉากเดิม ไม่สร้างภาพหรือวิดีโอ ไม่เปลี่ยนเลขตอน เลขฉาก หรือเหตุการณ์',
      `ชื่อเรื่อง: ${c.title}\nพล็อต: ${c.synopsis}\nตัวละคร: ${c.characters}\nยุค: ${c.era}\nภาษา: ${c.language}`,
      `แต่ละฉากยาว ${c.duration} วินาที เขียนคำพูดจริงพร้อมชื่อผู้พูดและอารมณ์สั้น ๆ ให้ถามตอบหรือโต้ตอบต่อเนื่องตามเรื่อง ประมาณ 1–2 ประโยคสั้นรวมต่อฉาก เว้นจังหวะให้นักแสดง พูดจบในเวลาคลิป ไม่ใช้ผู้บรรยายแทนบทสนทนา รักษาบุคลิกและคำพูดตามยุค ฉากเงียบที่จำเป็นเท่านั้นจึงเว้น dialogue ว่างได้ ห้ามเว้นว่างทั้งเรื่อง`,
      `ฉากเดิม: ${JSON.stringify(scenes.map(s=>({episode:s.episode,shot:s.shot,description:s.description,dialogue:s.dialogue})))}`,
      'ตอบ JSON เท่านั้น ให้ครบทุกฉากตามลำดับ รูปแบบ {"scenes":[{"episode":1,"shot":1,"dialogue":"มิน (กังวล): เจ้าจะกลับมาไหม?\\nธาร (อ่อนโยน): ข้าสัญญา"}]}'].join('\n\n');
  }
  function parseDialogues(text, scenes) {
    if(typeof text!=='string' || text.length>500000) throw new Error('คำตอบบทพูดยาวเกินกำหนด');
    let data;try{data=JSON.parse(text.slice(text.indexOf('{'),text.lastIndexOf('}')+1));}catch{throw new Error('วาง JSON บทพูดให้ครบ');}
    if(!Array.isArray(data.scenes) || data.scenes.length!==scenes.length) throw new Error('คำตอบบทพูดต้องครบทุกฉากเดิม');
    const entries=new Map();
    for(const s of data.scenes){
      if(!s || !Number.isInteger(s.episode) || !Number.isInteger(s.shot) || typeof s.dialogue!=='string' || s.dialogue.length>2000 || entries.has(`${s.episode}:${s.shot}`)) throw new Error('เลขฉากซ้ำหรือบทพูดไม่ถูกต้อง');
      entries.set(`${s.episode}:${s.shot}`,s.dialogue);
    }
    const dialogues=scenes.map(s=>{const value=entries.get(`${s.episode}:${s.shot}`);if(value===undefined)throw new Error('เลขตอนหรือฉากไม่ตรงกับฉากเดิม');return value;});
    if(!dialogues.some(s=>s.trim())) throw new Error('คำตอบไม่มีบทพูด ให้ AI เขียนบทสนทนาใหม่');
    return dialogues;
  }
  function validateCast(items) {
    if(!Array.isArray(items) || items.length>12)throw new Error('รองรับตัวละครหลักไม่เกิน 12 ตัว');
    return items.map(item=>{
      if(!item || ['name','role','description'].some(key=>typeof item[key]!=='string' || item[key].length>(key==='description'?3000:120)))throw new Error('ข้อมูลตัวละครไม่ถูกต้อง');
      return {id:typeof item.id==='string' && item.id.length<=100?item.id:crypto.randomUUID(),name:item.name,role:item.role,description:item.description};
    });
  }
  function castRequest(config, scenes=[]) {
    const c=settings(config);
    return ['ช่วยออกแบบตัวละครหลักให้พล็อตนี้ ไม่สร้างภาพหรือวิดีโอ ตอบ JSON เท่านั้น',`ชื่อเรื่อง: ${c.title}\nพล็อต: ${c.synopsis}`,periodPrompts[c.seriesType],c.era && `ยุค: ${c.era}`,`แนว: ${c.genre} สไตล์: ${c.style}`,c.characters && `ข้อมูลเดิมที่ต้องรักษา: ${c.characters}`,
      scenes.length && `ฉากสำหรับตรวจความครบถ้วน: ${scenes.map(s=>s.description).join('\n').slice(0,7000)}`,
      'ออกแบบตัวละครให้ครบทุกบทบาทในพล็อต ทั้งตัวเอก คู่แข่ง ครอบครัว และตัวละครสนับสนุนที่จำเป็น โดยปกติ 6–12 ตัว ไม่เกิน 12 ตัว ไม่เพิ่มคนที่ไม่มีบทบาท ระบุชื่อ บทบาท อายุ หน้าตา ทรงผม เสื้อผ้า บุคลิก',
      'ออกแบบสถานที่ทุกแห่งที่เรื่องต้องใช้ โดยปกติ 3–8 แห่ง ไม่เกิน 20 แห่ง ระบุชื่อ สถาปัตยกรรม ผัง วัสดุ แสงและบรรยากาศ ตรวจว่าตัวละครและสถานที่ครอบคลุมเหตุการณ์ในพล็อตทั้งหมด',
      'รูปแบบ {"cast":[{"name":"ชื่อ","role":"บทบาท","description":"อายุ หน้าตา ทรงผม เสื้อผ้า บุคลิก"}],"locations":[{"name":"ชื่อสถานที่","description":"รูปลักษณ์และบรรยากาศ"}]}'].filter(Boolean).join('\n\n');
  }
  function validateLocations(items){
    if(!Array.isArray(items) || items.length>20)throw new Error('รองรับสถานที่ไม่เกิน 20 แห่ง');
    return items.map(x=>{if(!x || typeof x.name!=='string' || !x.name.trim() || x.name.length>120 || typeof x.description!=='string' || !x.description.trim() || x.description.length>3000)throw new Error('สถานที่ต้องมีชื่อและรายละเอียด');return {name:x.name,description:x.description};});
  }
  function syncAssets(existing,cast,locations=[]){
    const assets=validateAssets(existing).map(x=>({...x}));
    for(const item of [...cast.map(c=>({kind:'character',name:c.name,description:c.description,castId:c.id})),...locations.map(l=>({...l,kind:'location',castId:''}))]){
      let asset=assets.find(a=>a.kind===item.kind && ((item.castId && a.castId===item.castId) || a.name.trim()===item.name.trim()));
      if(asset){Object.assign(asset,item);}else{if(assets.length>=60)throw new Error('รายการภาพเกิน 60 รายการ');assets.push({id:crypto.randomUUID(),...item,image:'',pageUrl:''});}
    }
    return assets;
  }
  function parseCatalog(text){
    const cast=parseCast(text);let data;try{data=JSON.parse(text.slice(text.indexOf('{'),text.lastIndexOf('}')+1));}catch{throw new Error('วาง JSON ให้ครบ');}
    const locations=validateLocations(data.locations || []);
    if(!locations.length)throw new Error('คำตอบยังไม่มีสถานที่ ให้ Meta AI ตอบทั้ง cast และ locations ให้ครบ');
    return {cast,locations};
  }
  function parseCast(text) {
    if(typeof text!=='string' || text.length>100000)throw new Error('คำตอบตัวละครยาวเกินกำหนด');
    let data;try{data=JSON.parse(text.slice(text.indexOf('{'),text.lastIndexOf('}')+1));}catch{throw new Error('คำตอบตัวละครต้องเป็น JSON ที่ครบถ้วน');}
    const cast=validateCast(data.cast);
    if(!cast.length || cast.some(item=>!item.name.trim() || !item.description.trim()))throw new Error('ต้องมีชื่อและรายละเอียดตัวละคร');
    return cast;
  }
  function portraitPrompt(config, cast) {
    const c=settings(config);
    return ['สร้างภาพออกแบบตัวละครสำหรับซีรีส์ ไม่สร้างวิดีโอ',`สไตล์ ${c.style} อัตราส่วน ${c.orientation}`,periodPrompts[c.seriesType],c.era && `ยุค: ${c.era}`,`ตัวละคร: ${cast.name}\nบทบาท: ${cast.role}\nรายละเอียด: ${cast.description}`,
      'เห็นตัวละครเดี่ยวชัดเจนตั้งแต่ศีรษะถึงเท้า ท่าทางธรรมชาติ เห็นใบหน้า ทรงผมและชุดครบ แสงนุ่ม ฉากหลังเรียบ ไม่มีตัวหนังสือ โลโก้ หรือกรอบโปสเตอร์ รักษารายละเอียดที่ระบุ'].filter(Boolean).join('\n\n');
  }
  function mediaUrl(raw) {
    if(typeof raw!=='string' || raw.length>12000)return '';
    try{const u=new URL(raw);return u.protocol==='https:' && !u.username && !u.password && /(^|\.)(meta\.ai|fbcdn\.net|fbsbx\.com|cdninstagram\.com)$/.test(u.hostname)?u.href:'';}catch{return '';}
  }
  function validateAssets(items) {
    if(!Array.isArray(items) || items.length>60)throw new Error('รองรับภาพตัวละครและสถานที่สูงสุด 60 รายการ');
    const ids=new Set();
    return items.map(item=>{
      if(!item || typeof item.id!=='string' || item.id.length>100 || ids.has(item.id) || !['character','location'].includes(item.kind) || ['name','description'].some(k=>typeof item[k]!=='string' || item[k].length>(k==='name'?120:3000)))throw new Error('รายการภาพไม่ถูกต้อง');
      ids.add(item.id);
      const image=mediaUrl(item.image || '');
      if(item.image && !image)throw new Error('ลิงก์ภาพต้องเป็น HTTPS จาก Meta หรือ CDN ของ Meta');
      return {id:item.id,kind:item.kind,name:item.name,description:item.description,image,pageUrl:mediaUrl(item.pageUrl || ''),castId:typeof item.castId==='string'?item.castId.slice(0,100):''};
    });
  }
  function assetPrompt(config, asset) {
    if(asset.kind==='character')return portraitPrompt(config,{name:asset.name,role:'ตัวละครในซีรีส์',description:asset.description});
    const c=settings(config);
    return ['สร้างภาพสถานที่สำหรับซีรีส์ ไม่สร้างวิดีโอ',`สถานที่: ${asset.name}\nรายละเอียด: ${asset.description}`,`สไตล์ ${c.style} อัตราส่วน ${c.orientation}`,periodPrompts[c.seriesType],c.era && `ยุค: ${c.era}`,
      'ภาพมุมกว้างเห็นโครงสร้างสถานที่และบรรยากาศชัดเจน แสงสมจริง ไม่มีคน ไม่มีข้อความ ไม่มีโลโก้ ไม่มีกรอบโปสเตอร์'].filter(Boolean).join('\n\n');
  }
  const api={dialoguePrompt,parseDialogues,validateLocations,syncAssets,parseCatalog,mediaUrl,validateAssets,assetPrompt,validatePlotOptions,parsePlotOptions,plotOptionsPrompt,defaults,settings,prompt,createScenes,validateProject,plotPrompt,parsePlot,validateCast,castRequest,parseCast,portraitPrompt};
  if(typeof module!=='undefined') module.exports=api; else root.SceneCore=api;
})(globalThis);
