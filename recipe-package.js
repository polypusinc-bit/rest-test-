// Small stored-ZIP writer: USDZ requires uncompressed, 64-byte-aligned entries.
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const crcTable = Uint32Array.from({length:256}, (_,n) => {
  for (let j=0;j<8;j++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
export function readStoredZip(buffer) {
  const bytes = new Uint8Array(buffer), view = new DataView(buffer);
  const entries = [];
  let offset=0;
  while (view.getUint32(offset,true)===0x04034b50) {
    if (view.getUint16(offset+6,true) & 8 || view.getUint16(offset+8,true)!==0) throw new Error('Unsupported model archive');
    const size=view.getUint32(offset+18,true), nl=view.getUint16(offset+26,true), el=view.getUint16(offset+28,true);
    const name=decoder.decode(bytes.subarray(offset+30,offset+30+nl));
    const start=offset+30+nl+el;
    const data=bytes.slice(start,start+size);
    if (crc32(data)!==view.getUint32(offset+14,true)) throw new Error('Model download was incomplete');
    entries.push({name,data});offset=start+size;
  }
  if (!entries.length || entries[0].name!=='recipe.usda') throw new Error('Unexpected model archive');
  return entries;
}
export function writeStoredZip(entries) {
  const chunks=[],directory=[];let offset=0;
  for (const {name,data} of entries) {
    const filename=encoder.encode(name);let padding=(-(offset+30+filename.length)) & 63;
    if (padding>0 && padding<4) padding+=64;
    const crc=crc32(data),header=new Uint8Array(30+filename.length+padding),v=new DataView(header.buffer);
    v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,filename.length,true);v.setUint16(28,padding,true);header.set(filename,30);
    if (padding) {v.setUint16(30+filename.length,0x1986,true);v.setUint16(32+filename.length,padding-4,true);}
    const central=new Uint8Array(46+filename.length),c=new DataView(central.buffer);
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,filename.length,true);c.setUint32(42,offset,true);central.set(filename,46);
    chunks.push(header,data);directory.push(central);offset+=header.length+data.length;
  }
  const size=directory.reduce((n,c)=>n+c.length,0),end=new Uint8Array(22),v=new DataView(end.buffer);
  v.setUint32(0,0x06054b50,true);v.setUint16(8,entries.length,true);v.setUint16(10,entries.length,true);v.setUint32(12,size,true);v.setUint32(16,offset,true);
  const output=new Uint8Array(offset+size+22);let cursor=0;
  for (const chunk of [...chunks,...directory,end]) {output.set(chunk,cursor);cursor+=chunk.length;}
  return output;
}
export function makeRecipePackage(entries,recipe,separated) {
  let text=decoder.decode(entries[0].data);
  for (const [name,included] of Object.entries(recipe)) {
    if (!/^[A-Za-z_]+$/.test(name)) throw new Error('Invalid ingredient');
    const pattern=new RegExp(`string ${name} = "(Included|Removed)"`);
    if (!pattern.test(text)) throw new Error('Ingredient missing from AR model');
    text=text.replace(pattern,`string ${name} = "${included?'Included':'Removed'}"`);
  }
  text=text.replace('string Arrangement = "Stacked"',`string Arrangement = "${separated?'Separated':'Stacked'}"`);
  return writeStoredZip([{name:'recipe.usda',data:encoder.encode(text)},...entries.slice(1)]);
}
