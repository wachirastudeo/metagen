/* Header-only duration patch for Chrome MediaRecorder. Encoded clusters stay intact.
 * EBML: RFC 8794; duration units: Matroska TimestampScale specification. */
(function(root){
  function vint(bytes,offset,id=false){
    const first=bytes[offset];if(!first)throw new Error('Invalid WebM element');
    let width=1;while(!(first & (1 << (8-width))))width++;
    if(width>(id?4:8) || offset+width>bytes.length)throw new Error('Truncated WebM header');
    let value=BigInt(id?first:first & ((1 << (8-width))-1));
    for(let i=1;i<width;i++)value=value*256n+BigInt(bytes[offset+i]);
    const unknown=!id && value===(1n << BigInt(7*width))-1n;
    if(!unknown && value>BigInt(Number.MAX_SAFE_INTEGER))throw new Error('WebM element too large');
    return {width,value:unknown?null:Number(value)};
  }
  function element(bytes,start){
    const id=vint(bytes,start,true),size=vint(bytes,start+id.width),data=start+id.width+size.width;
    return {id:id.value,start,sizeOffset:start+id.width,sizeWidth:size.width,size:size.value,data,end:size.value===null?null:data+size.value};
  }
  function sizeBytes(size,minWidth=1){
    let width=minWidth;while(BigInt(size)>=(1n << BigInt(7*width))-1n)width++;
    if(width>8)throw new Error('WebM element too large');
    const bytes=new Uint8Array(width);let value=BigInt(size) | (1n << BigInt(7*width));
    for(let i=width-1;i>=0;i--){bytes[i]=Number(value & 255n);value>>=8n;}return bytes;
  }
  async function fix(blob,milliseconds){
    if(!Number.isFinite(milliseconds) || milliseconds<=0)throw new Error('Invalid WebM duration');
    // Read metadata only, rather than copying a complete series into memory.
    const header=new Uint8Array(await blob.slice(0,65536).arrayBuffer());let segment,info;
    for(let offset=0;offset<header.length;){
      const item=element(header,offset);if(item.id===0x18538067){segment=item;break;}
      if(item.end===null || item.end>header.length)break;offset=item.end;
    }
    if(!segment)throw new Error('WebM Segment is missing');
    // Indexed files require remuxing offsets; this helper handles recorder streams only.
    if(segment.size!==null)throw new Error('Expected streaming MediaRecorder WebM');
    for(let offset=segment.data;offset<header.length;){
      const item=element(header,offset);
      if(item.id===0x114d9b74 || item.id===0x1c53bb6b)throw new Error('Indexed WebM needs remuxing');
      if(item.id===0x1549a966){info=item;break;}
      if(item.end===null || item.end>header.length)break;offset=item.end;
    }
    if(!info || info.end===null || info.end>header.length)throw new Error('WebM Info is missing or truncated');
    let scale=1000000,duration;
    for(let offset=info.data;offset<info.end;){
      const item=element(header,offset);if(item.end===null || item.end>info.end)throw new Error('Invalid WebM Info');
      if(item.id===0x2ad7b1){scale=0;for(let i=item.data;i<item.end;i++)scale=scale*256+header[i];if(!Number.isSafeInteger(scale) || scale<=0)throw new Error('Invalid WebM timestamp scale');}
      if(item.id===0x4489)duration=item;offset=item.end;
    }
    const value=new Uint8Array(8);new DataView(value.buffer).setFloat64(0,milliseconds*1000000/scale);
    const durationElement=new Uint8Array([0x44,0x89,0x88,...value]);
    const parts=duration?[header.slice(info.data,duration.start),durationElement,header.slice(duration.end,info.end)]:[header.slice(info.data,info.end),durationElement];
    return new Blob([blob.slice(0,info.sizeOffset),sizeBytes(parts.reduce((sum,part)=>sum+part.length,0),info.sizeWidth),...parts,blob.slice(info.end)],{type:blob.type || 'video/webm'});
  }
  const api={fix};if(typeof module!=='undefined')module.exports=api;else root.WebmDuration=api;
})(globalThis);
