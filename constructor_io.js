/* BiblioPromptosAPP - construtores individuais v1. Sem dependências e sem execução de código importado. */
(function(root){
'use strict';
const FORMAT='bibliopromptos-constructor-v1',VERSION=1,MAX_JSON=2*1024*1024,MAX_ZIP=6*1024*1024,MAX_IMAGE=2*1024*1024;
const TE=new TextEncoder(),TD=new TextDecoder('utf-8',{fatal:true});
function error(msg){throw Error(msg)}
function obj(x,label){if(!x||typeof x!=='object'||Array.isArray(x))error(label+' deve ser um objeto');return x}
function keys(x,allowed,label){for(const k of Object.keys(x))if(!allowed.includes(k))error(label+': campo não suportado "'+k+'"')}
function str(x,label,max=120,required=true){if(typeof x!=='string'||x.length>max||(required&&!x.trim()))error(label+' deve ser texto '+(required?'não vazio ':'')+'de até '+max+' caracteres');return x}
function id(x,label){if(typeof x!=='string'||! /^[A-Za-z0-9][A-Za-z0-9_.-]{0,79}$/.test(x))error(label+' deve ser ID alfanumérico (1–80 caracteres, com _ . -)');return x}
function validateEnvelope(input){
 const e=obj(input,'Arquivo');
 keys(e,['format','formatVersion','constructor','thumbnail'],'Arquivo');
 if(e.format!==FORMAT||e.formatVersion!==VERSION)error('Formato ou versão incompatível. Esperado '+FORMAT+' / '+VERSION);
 const raw=obj(e.constructor,'Construtor');
 keys(raw,['id','title','description','category','steps'],'Construtor');
 const c={id:id(raw.id,'ID do construtor'),title:str(raw.title,'Nome',160),description:raw.description===undefined?'':str(raw.description,'Descrição',1000,false),category:raw.category===undefined?'Geral':str(raw.category,'Categoria',100)};
 if(!Array.isArray(raw.steps)||raw.steps.length<1||raw.steps.length>100)error('O construtor precisa de 1 a 100 etapas');
 const ids=new Set([c.id]),priorChoices=new Map();let blocksCount=0,optionsCount=0;
 function claim(v,label){const value=id(v,label);if(ids.has(value))error('Identificador duplicado no construtor: '+value);ids.add(value);return value}
 c.steps=raw.steps.map((rawStep,si)=>{
   const st=obj(rawStep,'Etapa '+(si+1));keys(st,['id','title','blocks'],'Etapa '+(si+1));
   const step={id:claim(st.id,'ID da etapa'),title:str(st.title,'Nome da etapa',160)};
   if(!Array.isArray(st.blocks)||st.blocks.length<1||st.blocks.length>100)error('Etapa '+(si+1)+' precisa de 1 a 100 blocos');
   step.blocks=st.blocks.map((rawBlock,bi)=>{
     if(++blocksCount>800)error('Limite de 800 blocos por construtor');
     const label='Bloco '+(si+1)+'.'+(bi+1),b=obj(rawBlock,label);
     keys(b,['id','type','title','text','options','visibleIf','hint','default'],label);
     if(!['choice','text','number','0.circle','fixed'].includes(b.type))error(label+': tipo inválido '+String(b.type));
     const clean={id:claim(b.id,'ID do bloco'),type:b.type==='0.circle'?'number':b.type,title:str(b.title,'Título do bloco',160)};
     if(b.visibleIf!==undefined){
       const cond=obj(b.visibleIf,label+' / condição');keys(cond,['id','value'],label+' / condição');
       const sourceId=id(cond.id,'ID da condição'),value=id(cond.value,'Valor da condição');
       if(!priorChoices.has(sourceId))error(label+': condição deve referenciar pergunta de escolha anterior: '+sourceId);
       if(!priorChoices.get(sourceId).has(value))error(label+': alternativa inexistente na condição: '+value);
       clean.visibleIf={id:sourceId,value};
     }
     if(clean.type==='choice'){
       if(b.text!==undefined||b.hint!==undefined||b.default!==undefined)error(label+': propriedades inválidas para múltipla escolha');
       if(!Array.isArray(b.options)||!b.options.length||b.options.length>60)error(label+': 1 a 60 alternativas obrigatórias');
       clean.options=b.options.map((rawOption,oi)=>{
         if(++optionsCount>4000)error('Limite de 4000 alternativas');
         const opt=obj(rawOption,label+' alternativa '+(oi+1));
         keys(opt,['id','label','text'],label+' alternativa');
         return {id:claim(opt.id,'ID da alternativa'),label:str(opt.label,'Rótulo da alternativa',160),text:opt.text===undefined?'':str(opt.text,'Trecho da alternativa',20000,false)};
       });
       priorChoices.set(clean.id,new Set(clean.options.map(x=>x.id)));
     }else{
       if(b.options!==undefined)error(label+': alternativas são permitidas apenas em perguntas de escolha');
       clean.text=b.text===undefined?'':str(b.text,'Texto do bloco',20000,false);
       if(clean.type==='fixed'&&!clean.text.trim())error(label+': bloco fixo precisa de texto');
       if(clean.type==='number'){
         if(b.hint!==undefined)clean.hint=str(b.hint,'Dica numérica',300,false);
         if(b.default!==undefined){if(typeof b.default!=='string'&&typeof b.default!=='number')error(label+': valor padrão numérico inválido');clean.default=str(String(b.default),'Valor padrão',60,false)}
       }else if(b.hint!==undefined||b.default!==undefined)error(label+': dica/padrão numérico em tipo não numérico');
     }
     return clean;
   });
   return step;
 });
 const thumb=e.thumbnail===undefined?null:e.thumbnail;
 if(thumb!==null){
   obj(thumb,'Miniatura');keys(thumb,['path','mime'],'Miniatura');
   if(typeof thumb.path!=='string'||!/^miniaturas\/[A-Za-z0-9_.-]{1,90}\.(?:png|jpg|jpeg|webp)$/i.test(thumb.path))error('Caminho de miniatura inválido');
   if(!['image/png','image/jpeg','image/webp'].includes(thumb.mime))error('Tipo de imagem não suportado');
   const ext=thumb.path.split('.').pop().toLowerCase();
   if((ext==='png'&&thumb.mime!=='image/png')||((ext==='jpg'||ext==='jpeg')&&thumb.mime!=='image/jpeg')||(ext==='webp'&&thumb.mime!=='image/webp'))error('Extensão da miniatura diferente do tipo declarado');
 }
 return {format:FORMAT,formatVersion:VERSION,constructor:c,thumbnail:thumb?{path:thumb.path,mime:thumb.mime}:null,counts:{steps:c.steps.length,questions:blocksCount-c.steps.reduce((n,s)=>n+s.blocks.filter(b=>b.type==='fixed').length,0),blocks:blocksCount,options:optionsCount}};
}
function copyWithNewIds(constructor,newId){
 const c=JSON.parse(JSON.stringify(constructor)),mapping=new Map(),generated=new Set();
 function newid(old){const result=newId();if(typeof result!=='string'||!result||generated.has(result))error('Novo ID duplicado ou inválido');generated.add(result);mapping.set(old,result);return result}
 c.id=newid(c.id);
 for(const s of c.steps){s.id=newid(s.id);for(const b of s.blocks){b.id=newid(b.id);if(b.options)for(const o of b.options)o.id=newid(o.id)}}
 for(const s of c.steps)for(const b of s.blocks)if(b.visibleIf){b.visibleIf.id=mapping.get(b.visibleIf.id);b.visibleIf.value=mapping.get(b.visibleIf.value);if(!b.visibleIf.id||!b.visibleIf.value)error('Referência condicional não resolvida na cópia')}
 return c;
}
function toEnvelope(c,thumbnail=null){
 const clean=validateEnvelope({format:FORMAT,formatVersion:VERSION,constructor:{id:c.id,title:c.title,description:c.description||'',category:c.category||'Geral',steps:c.steps},thumbnail});
 delete clean.counts;return clean;
}
function mimeMatches(bytes,mime){
 if(mime==='image/png')return bytes.length>24&&bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10;
 if(mime==='image/jpeg')return bytes.length>12&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(mime==='image/webp')return bytes.length>16&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
 return false;
}
function read16(b,i){if(i<0||i+2>b.length)error('ZIP truncado');return b[i]|(b[i+1]<<8)}
function read32(b,i){return (read16(b,i)|(read16(b,i+2)<<16))>>>0}
let crcTable;
function crc32(bytes){if(!crcTable){crcTable=new Uint32Array(256);for(let i=0;i<256;i++){let c=i;for(let n=0;n<8;n++)c=c&1?0xedb88320^(c>>>1):c>>>1;crcTable[i]=c>>>0}}let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0}
async function inflateBounded(comp,expected){
 if(typeof DecompressionStream==='undefined')error('Este navegador não suporta ZIP DEFLATE; use ZIP sem compactação');
 let stream;
 try{stream=new Blob([comp]).stream().pipeThrough(new DecompressionStream('deflate-raw'))}catch(_){error('Descompressão ZIP não suportada')}
 const reader=stream.getReader(),chunks=[];let total=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>expected||total>MAX_JSON+MAX_IMAGE){await reader.cancel();error('ZIP declara tamanho de dados incompatível')}chunks.push(value)}}catch(e){try{await reader.cancel()}catch(_){}throw Error('ZIP DEFLATE inválido: '+e.message)}
 if(total!==expected)error('ZIP: tamanho descompactado diferente do declarado');
 const out=new Uint8Array(total);let offset=0;for(const chunk of chunks){out.set(chunk,offset);offset+=chunk.length}return out;
}
async function unzipIndividual(bytes){
 if(bytes.length>MAX_ZIP)error('ZIP excede o máximo de 6 MB');
 let eocd=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(read32(bytes,i)===0x06054b50){eocd=i;break}
 if(eocd<0)error('Arquivo não é um ZIP válido');
 if(read16(bytes,eocd+4)||read16(bytes,eocd+6))error('ZIP multidisco não suportado');
 const count=read16(bytes,eocd+10),total=read16(bytes,eocd+8),centralSize=read32(bytes,eocd+12),offset=read32(bytes,eocd+16);
 if(!count||count!==total||count>2||offset+centralSize>eocd)error('ZIP individual exige 1 ou 2 arquivos e índice íntegro');
 const entries=new Map();let p=offset;
 for(let n=0;n<count;n++){
   if(read32(bytes,p)!==0x02014b50)error('ZIP com índice central inválido');
   const flags=read16(bytes,p+8),method=read16(bytes,p+10),crc=read32(bytes,p+16),compressed=read32(bytes,p+20),size=read32(bytes,p+24);
   const len=read16(bytes,p+28),extra=read16(bytes,p+30),comment=read16(bytes,p+32),disk=read16(bytes,p+34),local=read32(bytes,p+42);
   if(flags&1||disk||![0,8].includes(method))error('ZIP usa criptografia ou método não suportado');
   if(size>(n===0?MAX_JSON+MAX_IMAGE:MAX_JSON+MAX_IMAGE)||compressed>MAX_ZIP)error('Arquivo ZIP interno muito grande');
   const name=TD.decode(bytes.slice(p+46,p+46+len));
   p+=46+len+extra+comment;
   if(name!=='constructor.json'&&!/^miniaturas\/[A-Za-z0-9_.-]{1,90}\.(png|jpg|jpeg|webp)$/i.test(name))error('ZIP individual contém arquivo não permitido: '+name);
   if(entries.has(name)||read32(bytes,local)!==0x04034b50)error('ZIP com arquivo duplicado ou cabeçalho inválido');
   const start=local+30+read16(bytes,local+26)+read16(bytes,local+28);
   if(start+compressed>bytes.length)error('ZIP truncado');
   const raw=bytes.slice(start,start+compressed);
   const output=method===0?raw:await inflateBounded(raw,size);
   if(output.length!==size||crc32(output)!==crc)error('Falha de integridade CRC: '+name);
   entries.set(name,output);
 }
 if(p!==offset+centralSize)error('ZIP com índice inconsistente');
 return entries;
}
async function readFile(file){
 if(!file||typeof file.arrayBuffer!=='function')error('Selecione um arquivo válido');
 if(file.size>MAX_ZIP)error('Arquivo individual excede 6 MB');
 const bytes=new Uint8Array(await file.arrayBuffer());
 const isZip=bytes.length>=4&&read32(bytes,0)===0x04034b50;
 let envelope,imageBlob=null;
 if(isZip){
   const entries=await unzipIndividual(bytes);
   if(!entries.has('constructor.json'))error('ZIP sem constructor.json');
   const jsonBytes=entries.get('constructor.json');
   if(jsonBytes.length>MAX_JSON)error('constructor.json excede 2 MB');
   try{envelope=JSON.parse(TD.decode(jsonBytes))}catch(_){error('constructor.json inválido ou não UTF-8')}
   const clean=validateEnvelope(envelope);
   if(clean.thumbnail){
     if(entries.size!==2||!entries.has(clean.thumbnail.path))error('Miniatura referenciada não encontrada no ZIP');
     const img=entries.get(clean.thumbnail.path);
     if(img.length>MAX_IMAGE||!mimeMatches(img,clean.thumbnail.mime))error('Imagem inválida ou maior que 2 MB');
     imageBlob=new Blob([img],{type:clean.thumbnail.mime});
   }else if(entries.size!==1)error('ZIP contém imagem sem associação');
   return {envelope:clean,thumbnailBlob:imageBlob,origin:'zip'};
 }
 if(bytes.length>MAX_JSON)error('JSON excede 2 MB');
 try{envelope=JSON.parse(TD.decode(bytes))}catch(_){error('JSON inválido ou não UTF-8')}
 const clean=validateEnvelope(envelope);
 if(clean.thumbnail)error('Para importar miniatura associada, forneça um ZIP com a imagem');
 return {envelope:clean,thumbnailBlob:null,origin:'json'};
}
root.BPConstructorIO={FORMAT,VERSION,validateEnvelope,copyWithNewIds,toEnvelope,readFile,unzipIndividual,mimeMatches};
if(typeof module!=='undefined'&&module.exports)module.exports=root.BPConstructorIO;
})(typeof globalThis!=='undefined'?globalThis:this);
