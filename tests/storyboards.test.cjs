const {test}=require('node:test'),assert=require('node:assert/strict');
const core=require('../extension/core.js'),backup=require('../extension/project-backup.js');
const image={id:'board-file',name:'board.png',type:'image/png',size:5,width:720,height:1280};
function fixture(){const scene=core.createScenes({...core.defaults,episodes:1})[0];scene.description='A quiet empty library at sunrise';scene.castIds=[];scene.storyboard={...image};return {version:1,settings:{...core.defaults,duration:5},scenes:[scene],cast:[],assets:[]};}
test('storyboard image request is separate from ten-second video and survives project round-trip',()=>{
 const p=core.validateProject(fixture()),scene=p.scenes[0],request=JSON.parse(core.storyboardPrompt(p,scene));
 assert.equal(p.settings.duration,10);assert.deepEqual(scene.storyboard,image);assert.equal(request.task,'generate_storyboard_image');assert.equal(request.output_type,'image');assert.equal(request.scene_duration_seconds,10);assert.equal(request.video,undefined);assert.equal(request.storyboard_reference,undefined);assert.ok(request.instructions.includes(scene.description));
 const video=JSON.parse(core.referencePrompt(p,scene));assert.equal(video.video.duration_seconds,10);assert.equal(video.storyboard_reference.attachment_number,1);assert.equal(video.storyboard_reference.local_file.type,'image/png');
 for(const change of [{type:'image/svg+xml'},{id:''},{size:0},{width:0}]){const bad=fixture();Object.assign(bad.scenes[0].storyboard,change);assert.throws(()=>core.validateProject(bad));}
});
test('portable backup contains scene image bytes and restores their media IDs',async()=>{
 const p=fixture(),blob=new Blob(['image'],{type:'image/png'}),media={MAX_IMAGE:10*1024*1024,MAX_FILE:250*1024*1024,get:async()=>({blob}),inspectImage:async file=>({...image,id:'restored-board',blob:file})};
 const archive=await backup.read(await backup.create(p,{core,media}),{core,media});assert.equal(archive.files.length,1);assert.equal(await archive.files[0].blob.text(),'image');
 const restored=await backup.prepare(archive,{media});assert.equal(restored.project.scenes[0].storyboard.id,'restored-board');assert.equal(restored.project.scenes[0].id,p.scenes[0].id);
 await assert.rejects(backup.create(p,{core,media:{...media,get:async()=>undefined}}),/board.png/);
});
test('storyboard preserves location context and video references follow character masters',()=>{
 const p=fixture();p.settings.locations='Village library: wooden shelves, green walls';
 p.cast=[{id:'alice',name:'Alice',role:'Librarian',description:'Black bob'},{id:'bob',name:'Bob',role:'Visitor',description:'Short hair'}];
 p.assets=p.cast.map(person=>({id:`asset-${person.id}`,kind:'character',castId:person.id,name:person.name,description:person.description,portrait:{...image,id:`file-${person.id}`}}));
 const scene=p.scenes[0];scene.castIds=['alice','bob'];
 const board=JSON.parse(core.storyboardPrompt(p,scene));
 assert.equal(board.location_context.description,p.settings.locations);
 assert.deepEqual(board.characters.map(person=>person.reference.attachment_number),[1,2]);
 assert.equal(board.storyboard_reference,undefined,'an existing scene image is not its own generation reference');
 const video=JSON.parse(core.referencePrompt(p,scene));
 assert.deepEqual(video.characters.map(person=>person.reference.attachment_number),[1,2]);
 assert.equal(video.storyboard_reference.attachment_number,3);
 const place={id:'library',kind:'location',name:'Library',description:'Green walls',portrait:{...image,id:'location-file'}};p.assets.push(place);scene.locationId=place.id;
 const located=JSON.parse(core.referencePrompt(p,scene));assert.equal(located.location_reference.attachment_number,3);assert.equal(located.storyboard_reference.attachment_number,4);
 assert.deepEqual(core.sceneImageReferences(p,scene).map(ref=>ref.asset.id),['asset-alice','asset-bob','library']);
 assert.equal(core.validateProject(p).scenes[0].locationId,'library');
 assert.equal(JSON.parse(core.storyboardPrompt(p,scene)).location_reference.asset_id,'library');
 delete place.portrait;assert.throws(()=>core.storyboardPrompt(p,scene),/สถานที่/);
 p.assets.pop();assert.throws(()=>core.referencePrompt(p,scene),/ถูกลบ/);
});
test('combined scene backup restores every image and clip without breaking cast or location identity',async()=>{
 const p=fixture(),scene=p.scenes[0];
 p.cast=[{id:'alice',name:'Alice',role:'Librarian',description:'Black bob'}];
 p.assets=[{id:'alice-master',kind:'character',castId:'alice',name:'Alice',description:'Black bob',portrait:{...image,id:'alice-file',name:'alice.png'}},{id:'library',kind:'location',name:'Library',description:'Green walls',portrait:{...image,id:'library-file',name:'library.png'}}];
 scene.castIds=['alice'];scene.locationId='library';scene.clip={id:'clip-file',name:'scene.mp4',type:'video/mp4',size:4,duration:10,width:720,height:1280};
 const bytes=new Map([['board-file','board'],['alice-file','alice'],['library-file','place'],['clip-file','clip']]);
 const inspect=async file=>({id:`restored-${file.name}`,name:file.name,type:file.type,size:file.size,width:720,height:1280,...(file.type.startsWith('video/')?{duration:10}:{}),blob:file});
 const media={MAX_IMAGE:10*1024*1024,MAX_FILE:250*1024*1024,get:async id=>({blob:new Blob([bytes.get(id)])}),inspectImage:inspect,inspect};
 const archive=await backup.read(await backup.create(p,{core,media}),{core,media});assert.equal(archive.files.length,4);
 const restored=await backup.prepare(archive,{media}),saved=core.validateProject(restored.project),savedScene=saved.scenes[0];
 assert.equal(savedScene.id,scene.id);assert.deepEqual(savedScene.castIds,['alice']);assert.equal(savedScene.locationId,'library');
 assert.equal(saved.assets[0].castId,'alice');assert.equal(saved.assets[1].id,'library');
 assert.equal(savedScene.storyboard.id,'restored-board.png');assert.equal(savedScene.clip.id,'restored-scene.mp4');
 assert.equal(saved.assets[0].portrait.id,'restored-alice.png');assert.equal(saved.assets[1].portrait.id,'restored-library.png');
 const request=JSON.parse(core.referencePrompt(saved,savedScene));assert.equal(request.characters[0].reference.attachment_number,1);assert.equal(request.location_reference.attachment_number,2);assert.equal(request.storyboard_reference.attachment_number,3);
 for(const record of restored.records)assert.equal(await record.blob.text(),bytes.get(archive.files.find(file=>file.name===record.name).id));
});
