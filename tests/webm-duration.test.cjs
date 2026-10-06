const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs/promises');
const {fix}=require('../extension/webm-duration.js');
const segment=Buffer.from('1853806701ffffffffffffff','hex');
const cluster=Buffer.from('1f43b67501ffffffffffffffe78100','hex');
function recording(info){assert(info.length<127);return new Blob([segment,Buffer.from('1549a966','hex'),Uint8Array.of(0x80|info.length),info,cluster],{type:'video/webm'});}
function durationValue(bytes){const start=Buffer.from(bytes).indexOf(Buffer.from('448988','hex'));return new DataView(bytes.buffer,bytes.byteOffset+start+3,8).getFloat64(0);}
test('Chrome regression: duration changes without rewriting any cluster bytes',async()=>{
  const raw=await fs.readFile(__dirname+'/fixtures/chrome-recorder.webm');
  const output=Buffer.from(await (await fix(new Blob([raw]),3000)).arrayBuffer());
  const marker=Buffer.from('1f43b675','hex');
  assert.deepEqual(output.subarray(output.indexOf(marker)),raw.subarray(raw.indexOf(marker)));
  assert(output.includes(segment));assert.equal(durationValue(output),3000);
});
test('respects non-default TimestampScale and preserves source metadata',async()=>{
  const info=Buffer.from('2ad7b1831e84804d808161','hex'); // 2,000,000 ns/tick
  const output=Buffer.from(await (await fix(recording(info),3000)).arrayBuffer());
  assert.equal(durationValue(output),1500);assert(output.includes(info));assert(output.subarray(-cluster.length).equals(cluster));
});
test('replaces an existing duration rather than duplicating it',async()=>{
  const old=Buffer.from('44898400000000','hex');
  const output=Buffer.from(await (await fix(recording(old),1250)).arrayBuffer());
  assert.equal(durationValue(output),1250);assert.equal(output.indexOf(Buffer.from('4489','hex')),output.lastIndexOf(Buffer.from('4489','hex')));
});
test('grows an Info size field across the one-byte boundary',async()=>{
  const info=Buffer.concat([Buffer.from('ecf8','hex'),Buffer.alloc(120)]);
  const output=Buffer.from(await (await fix(recording(info),3000)).arrayBuffer());
  assert.equal(output[16],0x40);assert.equal(output[17],133);assert.equal(durationValue(output),3000);
  assert(output.subarray(-cluster.length).equals(cluster));
});
test('rejects invalid, truncated and indexed input instead of corrupting it',async()=>{
  await assert.rejects(fix(recording(Buffer.alloc(0)),0),/duration/);
  await assert.rejects(fix(new Blob([Uint8Array.of(0)]),3000),/Invalid/);
  await assert.rejects(fix(new Blob([segment,Buffer.from('1549a966ff','hex')]),3000),/Info/);
  await assert.rejects(fix(new Blob([segment,Buffer.from('114d9b7480','hex')]),3000),/remuxing/);
});
