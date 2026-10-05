const assert=require('node:assert/strict');globalThis.crypto=require('node:crypto').webcrypto;
const core=require('../extension/core.js');
const config=core.settings({plotMode:'ai',seriesType:'thai',episodes:1,shots:2,duration:10,idea:'รักต่างชนชั้น',era:'อยุธยา'});
const request=core.plotPrompt(config);
for(const s of ['ไม่ต้องสร้างภาพหรือวิดีโอ','รักต่างชนชั้น','อยุธยา','10 วินาที','ซีรีส์ไทยย้อนยุค','JSON'])assert.ok(request.includes(s));
const data={title:'ริมน้ำ',synopsis:'เรื่องรัก',characters:'มิน ชุดไทย',scenes:[{episode:1,shot:2,description:'มินหันมองเรือ',dialogue:'มิน: เจ้าจะกลับมาไหม?'},{episode:1,shot:1,description:'มินเดินลงท่าน้ำ',dialogue:'ธาร: ข้าจะรอเจ้าที่ท่าน้ำ'}]};
const project=core.parsePlot('```json\n'+JSON.stringify(data)+'\n```',config);
assert.equal(project.scenes[0].shot,1);assert.ok(project.scenes[0].prompt.includes('มินเดินลงท่าน้ำ'));assert.ok(project.scenes[0].prompt.includes('มิน ชุดไทย'));
assert.equal(project.settings.plotMode,'ai');assert.equal(core.validateProject(project).scenes.length,2);
assert.throws(()=>core.parsePlot('คำตอบไม่ครบ',config));
assert.equal(core.parsePlot(JSON.stringify({...data,scenes:[data.scenes[1]]}),config).scenes.length,1);
assert.throws(()=>core.parsePlot(JSON.stringify({...data,scenes:[data.scenes[0]]}),config));
assert.throws(()=>core.parsePlot(JSON.stringify(data),{...config,episodes:2}));
assert.throws(()=>core.parsePlot(JSON.stringify({...data,scenes:[data.scenes[0],data.scenes[0]]}),config));
assert.throws(()=>core.parsePlot(JSON.stringify({...data,scenes:[{...data.scenes[0],description:''},data.scenes[1]]}),config));
assert.equal(core.settings({}).plotMode,'manual');
const catalogProject=core.parsePlot(JSON.stringify({...data,cast:[{name:'มิน',role:'นางเอก',description:'สไบชมพู ผมมวยต่ำ'}],locations:[{name:'ท่าน้ำ',description:'เรือนไม้สัก แสงเช้า'}]}),config);
for(const scene of catalogProject.scenes){assert.ok(scene.prompt.includes('สไบชมพู ผมมวยต่ำ'));assert.ok(scene.prompt.includes('เรือนไม้สัก แสงเช้า'));}
console.log('PASS: AI plot request, fenced JSON, ordered scenes, prompt compilation, project compatibility and invalid response rejection');
