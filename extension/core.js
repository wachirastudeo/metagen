(function (root) {
  const defaults = { title:'', synopsis:'', plotMode:'manual', idea:'', seriesType:'general', era:'', genre:'ดราม่า', orientation:'9:16', episodes:3, duration:10, style:'สมจริงแบบภาพยนตร์', characters:'', locations:'', productMode:'off', product:'', language:'ไทย', audio:'มีบทพูด', extra:'' };
  const periodPrompts = {
    general:'ซีรีส์ทั่วไป: ใช้โลกของเรื่องตามพล็อตและข้อมูลตัวละคร',
    'thai-modern':'ซีรีส์ไทยร่วมสมัย: วิถีชีวิต สถานที่ และเครื่องแต่งกายไทยปัจจุบันตามพล็อต',
    'chinese-modern':'ซีรีส์จีนร่วมสมัย: ชีวิตและสถานที่จีนปัจจุบัน ไม่ใช้ชุดโบราณเว้นแต่พล็อตระบุ',
    korean:'ซีรีส์เกาหลีร่วมสมัย: วิถีชีวิตและสถานที่เกาหลีปัจจุบันตามพล็อต ไม่เปลี่ยนเชื้อชาติของตัวละครที่กำหนดไว้',
    japanese:'ซีรีส์ญี่ปุ่นร่วมสมัย: วิถีชีวิตและสถานที่ญี่ปุ่นปัจจุบันตามพล็อต ไม่เปลี่ยนเชื้อชาติของตัวละครที่กำหนดไว้',
    historical:'ซีรีส์ประวัติศาสตร์ / ชีวประวัติ: รักษายุค บุคคล เครื่องแต่งกาย และสถานที่ตามข้อมูลที่ให้ แยกเหตุการณ์จริงจากส่วนที่แต่งขึ้น ไม่อ้างรายละเอียดที่ไม่ทราบเป็นข้อเท็จจริง',
    fantasy:'ซีรีส์โลกแฟนตาซี: รักษากฎของโลก พลัง และรูปลักษณ์สิ่งมีชีวิตให้ต่อเนื่อง ใช้เฉพาะองค์ประกอบที่พล็อตกำหนด',
    scifi:'ซีรีส์อนาคต / ไซไฟ: รักษาระดับเทคโนโลยี กฎโลก และรูปลักษณ์อุปกรณ์ให้ต่อเนื่องตามพล็อต',
    family:'ซีรีส์ครอบครัว / ชีวิตชุมชน: รักษาความสัมพันธ์ อายุ และสภาพแวดล้อมของครอบครัวและชุมชนตามพล็อต',
    school:'ซีรีส์วัยเรียน / มหาวิทยาลัย: ใช้ช่วงอายุ ระดับการศึกษา เครื่องแบบ และสถานศึกษาตามพล็อต',
    workplace:'ซีรีส์ชีวิตการทำงาน: รักษาอาชีพ หน้าที่ สภาพแวดล้อม และความสัมพันธ์ในที่ทำงานตามพล็อต',
    documentary:'ซีรีส์สารคดี: ถ่ายทอดข้อมูลตามหลักฐานที่ให้ แยกข้อเท็จจริงกับภาพจำลอง ไม่แต่งคำพูดของบุคคลจริงเป็นข้อเท็จจริง',
    animation:'ซีรีส์แอนิเมชัน: รักษาการออกแบบตัวละครและโลกให้ต่อเนื่อง ใช้เทคนิคภาพตามสไตล์ภาพที่เลือก',

    chinese: 'ซีรีส์จีนย้อนยุค: เสื้อผ้าและทรงผมจีนโบราณ ฉากสถาปัตยกรรมจีนโบราณ รักษาเครื่องแต่งกายและบรรยากาศให้สอดคล้องกับยุคหรือฉากหลังที่กำหนด หลีกเลี่ยงสิ่งของและอาคารสมัยใหม่ ถ้าเลือกแนวเทพเซียนให้ใช้พลังวิเศษตามกฎของโลกในเรื่อง ถ้าเลือกยุทธภพให้เน้นวิชาต่อสู้และหลีกเลี่ยงการเหาะหรือพลังวิเศษเว้นแต่พล็อตระบุ',
    thai: 'ซีรีส์ไทยย้อนยุค: บรรยากาศละครรักไทยย้อนยุคละมุน หรูหรา โทนครีม งาช้าง ชมพูกุหลาบ และทอง แสงอาทิตย์สีทองอุ่นส่องผ่านใบไม้หรือหน้าต่าง แสงเงานุ่ม ฉากหลังละลายและมีมิติ รายละเอียดผ้าไหมและเครื่องประดับประณีต แนวทางชุดเมื่อเหมาะกับตัวละครและยุค: ชายสวมเสื้อคอตั้งผ้าไหมลายทองสีงาช้างกับโจงกระเบน หญิงห่มสไบผ้าไหมสีครีมกับผ้านุ่งชมพูหม่น เครื่องประดับทองและดอกไม้ประดับมวยผม ฉากเรือนไทยไม้ริมน้ำ สวนดอกไม้หรือบัวเมื่อสอดคล้องกับเหตุการณ์ แสดงอารมณ์ผ่านสายตาและท่าทางเป็นธรรมชาติ ไม่บังคับให้ทุกฉากเป็นฉากรักหรือมีตัวละครคู่ รักษาชุด ทรงผม สถาปัตยกรรม และฐานะให้ตรงยุคที่ระบุและข้อมูลตัวละคร หลีกเลี่ยงสิ่งของสมัยใหม่ ไม่มีข้อความ ชื่อเรื่อง โลโก้ หรือกรอบโปสเตอร์บนภาพ'
  };
  function settings(raw) {
    const result = { ...defaults };
    for (const key of Object.keys(defaults)) if (typeof defaults[key] === 'string') result[key] = String(raw[key] ?? defaults[key]).slice(0,6000);
    result.episodes = Math.min(30, Math.max(1, Math.floor(Number(raw.episodes) || defaults.episodes)));
    result.duration = 10;
    result.orientation = raw.orientation === '16:9' ? '16:9' : '9:16';
    result.seriesType = Object.hasOwn(periodPrompts,raw.seriesType) ? raw.seriesType : 'general';
    result.plotMode = raw.plotMode === 'ai' ? 'ai' : 'manual';
    result.productMode = raw.productMode === 'on' ? 'on' : 'off';
    return result;
  }
  function prompt(config, scene) {
    const c = settings(config);
    const realistic=c.style==='สมจริงแบบภาพยนตร์';
    const productShot=c.productMode==='on' && !!c.product;
    return [`สร้างวิดีโอ${c.orientation === '9:16' ? 'แนวตั้ง' : 'แนวนอน'} อัตราส่วน ${c.orientation} ความยาว ${c.duration} วินาที`,
      `สไตล์ ${c.style} แนว${c.genre}`, periodPrompts[c.seriesType], realistic && 'ภาพคนจริงสมจริงแบบภาพยนตร์ ผิวและสัดส่วนเป็นธรรมชาติ แสงสมจริง สีวัตถุแม่นยำ ภาพคมชัด ไม่เป็นการ์ตูนหรือภาพนิ่ง', c.seriesType === 'thai' && realistic && 'ภาพนักแสดงคนจริงแบบภาพยนตร์ ผิวเป็นธรรมชาติ ใบหน้าและมือสมส่วน รายละเอียดผ้าไหมคมชัด โทนโรแมนติกอบอุ่น ไม่ใช่ภาพการ์ตูน', c.era && `ยุค / สถานที่ของเรื่อง: ${c.era}`, c.title && `ซีรีส์: ${c.title} ตอน ${scene.episode} ฉาก ${scene.shot}`,
      c.synopsis && `บริบทเรื่อง: ${c.synopsis}`, c.characters && `ตัวละครหลัก (รักษาหน้าตา ทรงผม และเสื้อผ้าให้ต่อเนื่อง): ${c.characters}`,
      c.locations && `สถานที่อ้างอิงของเรื่อง (ใช้เฉพาะที่ตรงกับฉากนี้): ${c.locations}`, productShot && `สินค้าในเรื่อง: ${c.product} ใช้เมื่อเหมาะกับเหตุการณ์ ไม่เปลี่ยนเนื้อหาฉากเพื่อขายสินค้า`,
      productShot && realistic && 'เมื่อใช้ภาพสินค้าอ้างอิง ให้รักษาสี เฉดสี วัสดุ รูปทรง ลวดลาย ฉลาก และขนาดสินค้าตามภาพอย่างเคร่งครัด ไม่เปลี่ยนสีตามแสง ไม่สร้างรายละเอียดด้านหลังที่มองไม่เห็น รักษาสัดส่วนจริงเทียบกับมือและตัวคน ภาพสินค้าอ้างอิงใช้สำหรับสินค้าเท่านั้น ไม่คัดลอกใบหน้าหรืออายุของบุคคลในภาพ หากต้องมีผู้นำเสนอผู้ใหญ่และไม่ได้กำหนดอายุ ให้ใช้ตัวละครไทยสมมติอายุ 20–25 ปีคนเดิมตลอดคลิป',
      productShot && realistic && 'ลำดับภาพขายสินค้า 10 วินาที ตัดภาพเต็มเฟรม 3 ช่วง: 0–3 วินาที ภาพกว้างเห็นสินค้าและผู้นำเสนอหรือสภาพแวดล้อม; 3–6 วินาที ภาพกลางสาธิตสินค้าตามเหตุการณ์; 6–10 วินาที ภาพใกล้ด้านหน้าที่เห็นฉลากและวัสดุชัด แล้วถือภาพสินค้านิ่งตอนจบ กล้องระดับสายตาหันตรง ไม่หมุนสินค้า ไม่ใช้มุมข้างหรือมุมเฉียง ขยับกล้องเข้าใกล้แทนการขยายตัวสินค้า เห็นสินค้าทั้งชิ้นพร้อมพื้นที่รอบภาพ ไม่ครอปบรรจุภัณฑ์ ไม่ทำภาพแบ่งช่อง รักษาฉากและผู้นำเสนอให้ต่อเนื่อง',
      `ฉากนี้: ${scene.description || 'โปรดระบุเหตุการณ์ของฉากนี้'}`, c.audio==='มีบทพูด' && scene.dialogue && `บทพูดภาษา${c.language}: ${scene.dialogue}`,
      `เสียง: ${scene.dialogue?.trim() && c.audio==='มีบทพูด' ? 'มีบทพูดและเสียงบรรยากาศ ให้ตัวละครพูดตามบทด้านบนตามลำดับ ผู้พูดตรงกับชื่อ เสียงและปากสัมพันธ์กัน ไม่สลับเสียง ไม่ใช้ผู้บรรยายแทนบทสนทนา ไม่ใส่ซับหรือตัวหนังสือ' : c.audio}`, productShot && realistic && c.audio==='มีบทพูด' && 'ให้คำพูดหรือเสียงบรรยายต่อเนื่องข้ามทั้งสามช่วง ไม่เริ่มใหม่ทุกครั้งที่ตัดภาพ หากมีเสียงพูดให้ใช้ภาษาไทยธรรมชาติเท่านั้น ไม่มีเสียงพากย์ภาษาอังกฤษ', 'จัดองค์ประกอบให้ตรงสัดส่วนที่ระบุ การเคลื่อนไหวเป็นธรรมชาติ รักษาความต่อเนื่องของตัวละคร', c.extra && `ข้อกำหนดเพิ่มเติม: ${c.extra}`].filter(Boolean).join('\n\n');
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
      if(s.clip!==undefined){
        const clip=s.clip;
        if(!clip || typeof clip.id!=='string' || !clip.id || clip.id.length>100 || typeof clip.name!=='string' || clip.name.length>240 || !Number.isFinite(clip.size) || clip.size<=0 || !Number.isFinite(clip.duration) || clip.duration<=0 || typeof clip.type!=='string' || !clip.type.startsWith('video/') || clip.type.length>120 || !Number.isInteger(clip.width) || clip.width<1 || !Number.isInteger(clip.height) || clip.height<1)throw new Error('ข้อมูลไฟล์คลิปไม่ถูกต้อง');
        result.clip={id:clip.id,name:clip.name,size:clip.size,type:clip.type,duration:clip.duration,width:clip.width,height:clip.height};
      }
      if(s.storyboard!==undefined)result.storyboard=validateAssets([{id:'storyboard',kind:'location',name:'',description:'',portrait:s.storyboard}])[0].portrait;
      if(s.locationId!==undefined){if(typeof s.locationId!=='string' || s.locationId.length>100)throw new Error('สถานที่อ้างอิงไม่ถูกต้อง');result.locationId=s.locationId;}
      if(s.castIds!==undefined){if(!Array.isArray(s.castIds) || s.castIds.length>12 || s.castIds.some(id=>typeof id!=='string' || id.length>100))throw new Error('รายการตัวละครในฉากไม่ถูกต้อง');result.castIds=[...new Set(s.castIds)];}
      if(s.backgroundCount!==undefined){if(!Number.isInteger(s.backgroundCount) || s.backgroundCount<0 || s.backgroundCount>12)throw new Error('จำนวนคนในฉากหลังต้องเป็นจำนวนเต็ม 0–12');result.backgroundCount=s.backgroundCount;}
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
      'ภาพหลักอ้างอิงตัวละครเดี่ยว หันหน้าตรงเข้ากล้อง มองเลนส์ กล้องระดับสายตา ใบหน้าไม่เอียง ไม่หันข้าง ไม่ใช้มุมสามส่วนสี่ จัดกรอบตั้งแต่ศีรษะถึงเอว ให้ใบหน้ามีขนาดใหญ่และคมชัด เห็นตาทั้งสองข้าง จมูก ปาก แนวกรามและทรงผมครบ ไม่มีผม มือ หนังสือหรือสิ่งของบังใบหน้า สีหน้าเป็นกลาง ท่าทางธรรมชาติ แสงนุ่มสม่ำเสมอทั้งใบหน้า ไม่มีเงามืดบดบัง ฉากหลังเรียบ เห็นรายละเอียดเสื้อผ้าส่วนบนตามคำอธิบาย ให้ความชัดของใบหน้าสำคัญกว่าการเห็นเต็มตัว ไม่มีตัวหนังสือ โลโก้ หรือกรอบโปสเตอร์ รักษารายละเอียดตัวละครที่ระบุ'].filter(Boolean).join('\n\n');
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
      const asset={id:item.id,kind:item.kind,name:item.name,description:item.description,image,pageUrl:mediaUrl(item.pageUrl || ''),castId:typeof item.castId==='string'?item.castId.slice(0,100):''};
      if(item.portrait!==undefined){
        const p=item.portrait;
        if(!p || typeof p.id!=='string' || !p.id || p.id.length>100 || typeof p.name!=='string' || p.name.length>240 || !['image/png','image/jpeg','image/webp'].includes(p.type) || !Number.isSafeInteger(p.size) || p.size<=0 || p.size>10*1024*1024 || !Number.isInteger(p.width) || !Number.isInteger(p.height) || p.width<1 || p.height<1 || p.width>8192 || p.height>8192 || p.width*p.height>40000000)throw new Error('ข้อมูลไฟล์ภาพหลักไม่ถูกต้อง');
        asset.portrait={id:p.id,name:p.name,type:p.type,size:p.size,width:p.width,height:p.height};
      }
      return asset;
    });
  }
  function sceneCast(project, scene) {
    const cast=project.cast || [];
    if(Array.isArray(scene.castIds))return cast.filter(person=>scene.castIds.includes(person.id));
    const text=`${scene.description}\n${scene.dialogue}`;
    return cast.filter(person=>{
      const name=person.name.trim();if(!name)return false;
      // A longer character name may contain another character's entire name.
      // Remove those mentions before checking whether the shorter name also appears.
      const longer=cast.map(item=>item.name.trim()).filter(item=>item.length>name.length && item.includes(name));
      const ownMentions=longer.reduce((remaining,item)=>remaining.split(item).join(' '),text);
      return ownMentions.includes(name);
    });
  }
  function sceneReferences(project, scene) {
    return sceneCast(project,scene).map(person=>({person,asset:(project.assets || []).find(a=>a.kind==='character' && a.castId===person.id) || (project.assets || []).find(a=>a.kind==='character' && a.name===person.name)}));
  }
  function sceneImageReferences(project,scene){
    const refs=sceneReferences(project,scene);
    if(scene.locationId){const asset=(project.assets || []).find(item=>item.id===scene.locationId && item.kind==='location');if(!asset)throw new Error('สถานที่ที่เลือกถูกลบแล้ว กรุณาเลือกสถานที่ใหม่');if(!asset.image && !asset.portrait)throw new Error('สร้างและเลือกภาพหลักให้สถานที่นี้ก่อนส่ง');refs.push({person:{name:asset.name},asset});}
    return refs;
  }
  function portraitFilename(asset){
    const clean=value=>String(value || '').replace(/[^A-Za-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'') || 'character';
    const ext=asset.portrait?.type==='image/jpeg'?'jpg':asset.portrait?.type==='image/webp'?'webp':'png';
    return `${clean(asset.name).slice(0,80)}-${clean(asset.id).slice(0,12)}-master.${ext}`;
  }
  function sceneJSON(project, scene) {
    const refs=sceneReferences(project,scene),c=settings(project.settings);
    const imageRefs=sceneImageReferences(project,scene),location=imageRefs.find(ref=>ref.asset?.kind==='location')?.asset;
    if(refs.some(ref=>!ref.asset?.image && !ref.asset?.portrait))throw new Error('สร้างและเลือกภาพหลักให้ตัวละครในฉากนี้ครบก่อนส่ง');
    if(Array.isArray(scene.castIds) && scene.castIds.some(id=>!(project.cast || []).some(person=>person.id===id)))throw new Error('ตัวละครที่เลือกถูกลบแล้ว กรุณาเลือกตัวละครในฉากใหม่');
    const backgroundCount=scene.backgroundCount===undefined?0:scene.backgroundCount;
    if(!Number.isInteger(backgroundCount) || backgroundCount<0 || backgroundCount>12)throw new Error('จำนวนคนในฉากหลังต้องเป็นจำนวนเต็ม 0–12');
    const castInstruction=backgroundCount
      ? `ตัวละครหลักในซีนนี้: ${refs.map(ref=>ref.person.name).join(', ') || 'ไม่มี'} แต่ละชื่อเป็นคนเดียว เพิ่มคนในฉากหลังที่ไม่มีชื่อ ${backgroundCount} คนตามเนื้อหาฉากเท่านั้น รวมทั้งหมด ${refs.length+backgroundCount} คน ไม่สร้างคนซ้ำ ไม่เพิ่มคนอื่น ไม่สลับใบหน้าหรือผู้พูด คนในฉากหลังต้องไม่ใช้ใบหน้าของตัวละครหลัก`
      : refs.length
      ? `ตัวละครที่ปรากฏในซีนนี้เท่านั้น: ${refs.map(ref=>ref.person.name).join(', ')} จำนวนตัวละครทั้งหมดตลอดซีน ${refs.length} คน แต่ละชื่อเป็นคนเดียว ไม่สร้างคนซ้ำ ไม่เพิ่มตัวประกอบหรือคนในฉากหลัง ไม่เพิ่มตัวละครอื่นจากบริบทเรื่อง ไม่สลับผู้พูดหรือใบหน้า`
      : 'ซีนนี้ไม่แสดงตัวละคร ไม่เพิ่มคนจากบริบทเรื่องหรือรายละเอียดตัวละครหลัก';
    // Scope automatically composed prompts; user-written prompts remain intact.
    const automatic=scene.prompt===prompt(c,scene);
    let instructions=automatic && ((project.cast || []).length || backgroundCount)
      ? [prompt({...c,characters:refs.map(({person})=>`${person.name} (${person.role}): ${person.description}`).join('\n\n')},scene),castInstruction].join('\n\n')
      : scene.prompt;
    if(automatic)instructions=instructions.replace('ไม่ใส่ซับหรือตัวหนังสือ','ไม่ใส่ซับหรือข้อความซ้อนบนวิดีโอ แต่คงข้อความบนวัตถุที่ฉากระบุ เช่น ชื่อในสมุดหรือป้าย');
    return {
      schema_version:1,task:'generate_video',
      scene:{id:scene.id,episode:scene.episode,shot:scene.shot,description:scene.description,dialogue:scene.dialogue},
      video:{aspect_ratio:c.orientation,duration_seconds:c.duration,style:c.style,language:c.language},
      ...(location?{location_reference:{asset_id:location.id,name:location.name,description:location.description,attachment_number:refs.length+1,...(location.portrait?{local_file:{name:portraitFilename(location),type:location.portrait.type,size:location.portrait.size}}:{image_url:location.image}),instructions:'Preserve architecture, layout and materials. Do not copy people from the reference.'}}:{}),
      ...(scene.storyboard?{storyboard_reference:{attachment_number:imageRefs.length+1,local_file:{name:portraitFilename({id:scene.id,name:'scene',portrait:scene.storyboard}),type:scene.storyboard.type,size:scene.storyboard.size},instructions:'Use this image as the opening keyframe and preserve composition, setting and cast while animating the ten-second scene.'}}:{}),
      cast_constraints:{character_count:refs.length+backgroundCount,allow_extra_people:backgroundCount>0,allow_duplicate_characters:false,...(backgroundCount?{background_people_count:backgroundCount}:{})},
      characters:refs.map(({person,asset},i)=>({character_id:person.id,name:person.name,role:person.role,appearance:person.description,
        reference:{asset_id:asset.id,attachment_number:i+1,...(asset.portrait?{local_file:{name:portraitFilename(asset),type:asset.portrait.type,size:asset.portrait.size}}:{image_url:asset.image})},
        identity_constraints:['Match the attached master portrait: face shape, eyes, nose, mouth, skin tone and age.','Preserve hairstyle unless the scene explicitly changes it.','Do not swap or blend identities.']})),
      instructions:instructions+'\n\nข้อกำหนดความยาวซีน: 10 วินาที ใช้ค่านี้แทนความยาวเดิมที่ขัดกันในพร้อมต์',
      cast_instructions:castInstruction,
      reference_instructions:'Attach character masters, the selected location master and the storyboard opening image in attachment_number order when present. image_url and local_file are metadata, not uploaded attachments. Reuse the same portrait for each character and the same location master across scenes. Generate the video, not a JSON response.'
    };
  }
  function storyboardPrompt(project,scene){
    const data=sceneJSON(project,scene);
    delete data.video;delete data.storyboard_reference;
    data.task='generate_storyboard_image';data.output_type='image';data.scene_duration_seconds=10;
    data.image={aspect_ratio:settings(project.settings).orientation,style:settings(project.settings).style,frame:'opening keyframe'};
    if(settings(project.settings).locations)data.location_context={instructions:'Use only the location matching this scene. Preserve its architecture, layout and materials across scenes.',description:settings(project.settings).locations};
    data.instructions=['สร้างภาพสตอรี่บอร์ดหนึ่งภาพสำหรับซีนนี้ ไม่สร้างวิดีโอ ไม่ทำคอลลาจหรือแบ่งช่อง',`ตอน ${scene.episode} ซีน ${scene.shot} · วิดีโอซีนนี้ยาว 10 วินาที`,settings(project.settings).era,periodPrompts[settings(project.settings).seriesType],`เหตุการณ์: ${scene.description}`,`บทพูดสำหรับวิดีโอ (ไม่เขียนบนภาพ): ${scene.dialogue || 'ไม่มีบทพูด'}`,'เลือกช่วงเริ่มต้นของเหตุการณ์ที่นำไปเคลื่อนไหวต่อได้ รักษาสถานที่ แสง ชุด และใบหน้าตามภาพหลัก ไม่มีซับหรือข้อความทับภาพ'].filter(Boolean).join('\n\n');
    data.reference_instructions='Attach character and location masters in attachment_number order. Generate one storyboard image, not video or JSON. Preserve each character identity.';
    const text=JSON.stringify(data,null,2);if(text.length>20000)throw new Error('พร้อมต์สตอรี่บอร์ดเกิน 20,000 ตัวอักษร');return text;
  }
  function referencePrompt(project, scene) {
    const data=sceneJSON(project,scene);
    if(!data.characters.length && !scene.backgroundCount && !scene.storyboard && !scene.locationId)return data.instructions;
    const text=JSON.stringify(data,null,2);
    if(text.length>20000)throw new Error('พร้อมต์รวมภาพอ้างอิงเกิน 20,000 ตัวอักษร');
    return text;
  }
  function assetPrompt(config, asset) {
    if(asset.kind==='character')return portraitPrompt(config,{name:asset.name,role:'ตัวละครในซีรีส์',description:asset.description});
    const c=settings(config);
    return ['สร้างภาพสถานที่สำหรับซีรีส์ ไม่สร้างวิดีโอ',`สถานที่: ${asset.name}\nรายละเอียด: ${asset.description}`,`สไตล์ ${c.style} อัตราส่วน ${c.orientation}`,periodPrompts[c.seriesType],c.era && `ยุค: ${c.era}`,
      'ภาพมุมกว้างเห็นโครงสร้างสถานที่และบรรยากาศชัดเจน แสงสมจริง ไม่มีคน ไม่มีข้อความ ไม่มีโลโก้ ไม่มีกรอบโปสเตอร์'].filter(Boolean).join('\n\n');
  }
  const api={sceneImageReferences,storyboardPrompt,portraitFilename,sceneJSON,sceneCast,sceneReferences,referencePrompt,dialoguePrompt,parseDialogues,validateLocations,syncAssets,parseCatalog,mediaUrl,validateAssets,assetPrompt,validatePlotOptions,parsePlotOptions,plotOptionsPrompt,defaults,settings,prompt,createScenes,validateProject,plotPrompt,parsePlot,validateCast,castRequest,parseCast,portraitPrompt};
  if(typeof module!=='undefined') module.exports=api; else root.SceneCore=api;
})(globalThis);
