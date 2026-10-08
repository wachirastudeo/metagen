const assert=require('node:assert/strict');
const core=require('../extension/core.js');
const {webcrypto}=require('node:crypto');globalThis.crypto=webcrypto;
const c=core.settings({title:'ทดสอบ',episodes:2,shots:3,orientation:'16:9',duration:10,characters:'มิน เสื้อขาว'});
const scenes=core.createScenes(c);
assert.equal(scenes.length,2);assert.equal(new Set(scenes.map(s=>s.id)).size,2);
assert.equal(scenes[1].episode,2);assert.equal(scenes[1].shot,1);
const p=core.prompt(c,{episode:2,shot:1,description:'เดินเข้าร้านกาแฟ',dialogue:'สวัสดี'});
for(const expected of ['แนวนอน','16:9','10 วินาที','มิน เสื้อขาว','เดินเข้าร้านกาแฟ','สวัสดี']) assert.ok(p.includes(expected),expected);
assert.equal(core.settings({duration:99,orientation:'1:1',episodes:-4,shots:900}).duration,10);
assert.equal(core.settings({episodes:-4,shots:900}).episodes,1);
assert.ok(!('shots' in core.settings({shots:900})));
const chinese=core.prompt({...c,seriesType:'chinese',era:'ราชวงศ์ถัง'},scenes[0]);
assert.ok(chinese.includes('ซีรีส์จีนย้อนยุค'));assert.ok(chinese.includes('ราชวงศ์ถัง'));assert.ok(!chinese.includes('ซีรีส์ไทยย้อนยุค'));
const thai=core.prompt({...c,seriesType:'thai',era:'อยุธยา'},scenes[0]);
assert.ok(thai.includes('ซีรีส์ไทยย้อนยุค'));assert.ok(thai.includes('อยุธยา'));assert.ok(!thai.includes('ซีรีส์จีนย้อนยุค'));
const sales=core.prompt({...c,productMode:'on',product:'ถุงขนม 200 กรัม',audio:'เสียงบรรยากาศ ไม่มีบทพูด'},{episode:1,shot:1,description:'ถือถุงขนม',dialogue:'ซื้อเลย'});
assert.ok(sales.includes('0–3 วินาที'));assert.ok(sales.includes('6–10 วินาที'));
assert.ok(sales.includes('รักษาสัดส่วนจริง'));assert.ok(!sales.includes('บทพูดภาษาไทย: ซื้อเลย'));
assert.ok(!core.prompt(c,scenes[0]).includes('ลำดับภาพขายสินค้า'));
assert.equal(core.settings({seriesType:'unknown'}).seriesType,'general');
assert.equal(core.validateProject({version:1,settings:c,scenes}).settings.seriesType,'general');
assert.deepEqual(core.validateProject({version:1,settings:c,scenes}).scenes,scenes);
assert.throws(()=>core.validateProject({version:2,settings:c,scenes}));
assert.throws(()=>core.validateProject({version:1,settings:c,scenes:[scenes[0],scenes[0]]}));
assert.throws(()=>core.validateProject({version:1,settings:c,scenes:[{...scenes[0],prompt:3}]}));
console.log('PASS: prompt parameters, shot numbering, unique ids, setting limits, project round-trip and invalid imports');

// Every selectable series format survives import and guides scene generation.
for(const type of ['thai-modern','chinese-modern','korean','japanese','historical','fantasy','scifi','family','school','workplace','documentary','animation']) {
 const config=core.settings({seriesType:type});
 assert.equal(core.validateProject({version:1,settings:config,scenes:[]}).settings.seriesType,type);
 assert.notEqual(core.prompt(config,{episode:1,shot:1,description:'Test'}),core.prompt({...config,seriesType:'general'},{episode:1,shot:1,description:'Test'}));
}
