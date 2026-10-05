const assert=require('node:assert/strict');globalThis.crypto=require('node:crypto').webcrypto;const c=require('../extension/core.js');
const data={cast:[{name:'ลำดวน',role:'นางเอก',description:'สไบครีม'},{name:'ขุนแสง',role:'พระเอก',description:'เสื้อไหมงาช้าง'}],locations:[{name:'เรือนไทย',description:'ไม้สักริมน้ำ'},{name:'ตลาด',description:'ตลาดโบราณ'}]};
const catalog=c.parseCatalog(JSON.stringify(data));const assets=c.syncAssets([],catalog.cast,catalog.locations);assert.equal(assets.length,4);
assets[0].image='https://scontent.xx.fbcdn.net/test.webp';const again=c.parseCatalog(JSON.stringify(data));const synced=c.syncAssets(assets,again.cast,again.locations);assert.equal(synced.length,4);assert.equal(synced[0].image,assets[0].image);assert.equal(synced[0].castId,again.cast[0].id);
assert.throws(()=>c.parseCatalog(JSON.stringify({cast:data.cast})),/สถานที่/);assert.throws(()=>c.parseCatalog(JSON.stringify({...data,locations:[{name:'ตลาด'}]})));
assert.ok(c.castRequest({},[{description:'ขุนแสงเดินตลาด'}]).includes('ขุนแสงเดินตลาด'));assert.ok(c.castRequest({}).includes('6–12'));
console.log('PASS: complete catalog import, cast/place image preparation, repeat sync preserves images, missing locations rejected');
