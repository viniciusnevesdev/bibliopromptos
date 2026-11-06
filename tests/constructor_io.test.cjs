'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..'),lib=require(path.join(ROOT,'constructor_io.js'));
const dir=path.join(__dirname,'.fixtures');
const base=JSON.parse(fs.readFileSync(path.join(dir,'simple.json'),'utf8'));
let count=0;
function pass(message){count++;console.log('PASS',message)}
function copy(x){return JSON.parse(JSON.stringify(x))}
function invalid(change,regex){const v=copy(base);change(v);assert.throws(()=>lib.validateEnvelope(v),regex)}
function readBlob(name){return new Blob([fs.readFileSync(path.join(dir,name))])}
async function run(){
 assert.equal(lib.FORMAT,'bibliopromptos-constructor-v1');
 const valid=lib.validateEnvelope(base);
 assert.equal(valid.counts.steps,2);assert.equal(valid.counts.questions,4);
 assert.equal(valid.counts.blocks,5);pass('JSON complexo, módulos e contagem correta');
 const original=copy(valid.constructor);
 let n=0;const duplication=lib.copyWithNewIds(valid.constructor,()=> 'copy-'+(++n));
 assert.notEqual(duplication.id,original.id);
 assert.notEqual(duplication.steps[0].blocks[1].options[1].id,original.steps[0].blocks[1].options[1].id);
 assert.equal(duplication.steps[0].blocks[2].visibleIf.id,duplication.steps[0].blocks[1].id);
 assert.equal(duplication.steps[0].blocks[2].visibleIf.value,duplication.steps[0].blocks[1].options[1].id);
 assert.equal(lib.validateEnvelope({...base,constructor:duplication}).counts.blocks,5);pass('Cópia com novos IDs preserva condições');
 const legacy=copy(base);legacy.constructor.steps[1].blocks[0].type='0.circle';
 assert.equal(lib.validateEnvelope(legacy).constructor.steps[1].blocks[0].type,'number');pass('Compatibilidade numérica legada');
 invalid(v=>v.format='not-bibliopromptos',/Formato/);
 invalid(v=>v.formatVersion=2,/Formato/);
 invalid(v=>v.constructor.steps=[],/etapas/);
 invalid(v=>v.constructor.steps[0].blocks[0].type='javascript',/tipo inválido/);
 invalid(v=>v.constructor.steps[0].blocks[0].extra='<script>',/campo não suportado/);
 invalid(v=>v.constructor.steps[0].blocks[1].options[0].id=v.constructor.steps[0].blocks[0].id,/duplicado/);
 invalid(v=>v.constructor.steps[0].blocks[2].visibleIf.value='nao-existe',/alternativa inexistente/);
 invalid(v=>v.constructor.steps[0].blocks[0].visibleIf={id:'modalidade',value:'foto'},/anterior/);
 invalid(v=>v.constructor.steps[0].blocks[0].visibleIf={id:'nucleo-universal',value:'x'},/anterior/);
 invalid(v=>v.constructor.steps[0].blocks[0].text='',/texto/);
 invalid(v=>v.thumbnail={path:'../../x.png',mime:'image/png'},/Caminho/);
 invalid(v=>v.constructor.id='abc<script>',/ID/);
 invalid(v=>v.thumbnail={path:'miniaturas/foto.png',mime:'image/jpeg'},/Extensão/);
 invalid(v=>v.constructor.steps[0].blocks[1].options=[],/alternativas/);
 pass('14 testes de estrutura inválida, referência quebrada e integridade');
 const plain=await lib.readFile(readBlob('simple.json'));
 assert.equal(plain.origin,'json');assert.equal(plain.envelope.constructor.id,valid.constructor.id);
 for(const mode of ['stored.zip','deflated.zip']){
  const data=await lib.readFile(readBlob(mode));
  assert.equal(data.origin,'zip');
  assert(data.thumbnailBlob&&data.thumbnailBlob.size>50);
  assert.equal(data.thumbnailBlob.type,'image/png');
  assert.equal(data.envelope.counts.steps,2);
  pass('ZIP '+mode+' com miniatura transparente e CRC');
 }
 await assert.rejects(lib.readFile(readBlob('extra.zip')),/não permitido/);
 await assert.rejects(lib.readFile(new Blob([JSON.stringify({...base,thumbnail:{path:'miniaturas/exemplo.png',mime:'image/png'}})])),/forneça um ZIP/);
 await assert.rejects(lib.readFile(new Blob(['<script>window.biblioteca=[]</script>'])),/JSON inválido/);
 pass('Arquivos maliciosos e miniatura ausente rejeitados');
 const corrupted=Buffer.from(fs.readFileSync(path.join(dir,'stored.zip')));
 corrupted[70]^=0xff;
 await assert.rejects(lib.readFile(new Blob([corrupted])),/CRC|ZIP|inválido|UTF-8/);
 pass('Arquivo ZIP corrompido rejeitado');
 // A API de produção exporta o mesmo formato, sem os metadados internos.
 const exported=lib.toEnvelope({...valid.constructor,created:123,updated:456,thumbnailId:'thumb-local'});
 assert.equal(exported.constructor.thumbnailId,undefined);
 assert.equal(exported.constructor.created,undefined);
 assert.equal(lib.validateEnvelope(exported).counts.blocks,5);pass('Exportação sanitiza metadados locais');

 // Testa a operação aditiva real extraída de app.js, sem carregar a interface.
 const app=fs.readFileSync(path.join(ROOT,'app.js'),'utf8');
 const start=app.indexOf('// Importação individual:');
 const end=app.indexOf('function showNewMenu(){',start);
 assert(start>0&&end>start,'Funções de importação no app.js');
 const db={constructors:[{id:'original',title:'Original',description:'Manter',steps:[]}],prompts:[{id:'p',text:'Não apagar'}],templates:[{id:'m',title:'Modelo'}],favorites:['prompt:p'],settings:{sortLibrary:'created-new'},presets:[{id:'x'}],recents:[{id:'r'}]};
 const baseline=copy(db);
 let updated=0,serialised='',screen='',modalState=null,lastToast='',uidCount=0;
 const images=new Map(),downloads=[];
 const storage={setItem:(key,value)=>{assert.equal(key,'bp-demo-v4');updated++;serialised=value}};
 const ctx={db,state:{selected:null,modal:null},item:(type,id)=>db.constructors.find(c=>c.id===id),factory:{constructors:[],templates:[],prompts:[]},BPConstructorIO:lib,Date,Blob,File:globalThis.File,window:{BP_CONSTRUCTOR_SPEC:'DOC'},navigator:{},localStorage:storage,
 uid:()=> 'id-'+(++uidCount),clone:copy,versionName:(name,arr)=>arr.some(x=>x.title===name)?name+' (2)':name,
 thumbPut:async(id,b)=>{images.set(id,b)},thumbDel:async(id)=>{images.delete(id)},thumbGet:async(id)=>images.get(id),
 go:(x)=>{screen=x},toast:(x)=>{lastToast=x},modal:(...a)=>{modalState=a},renderModal:()=>{},
 esc:(x)=>String(x).replace(/</g,'&lt;').replace(/>/g,'&gt;'),triggerDownload:(b,n)=>downloads.push({blob:b,name:n}),
 zipStore:()=>new Blob(['fakezip']),console};
 ctx.item=(type,id)=>ctx.db.constructors.find(c=>c.id===id);
 vm.createContext(ctx);vm.runInContext(app.slice(start,end),ctx);
 await vm.runInContext('readConstructorImport(new Blob(['+JSON.stringify(fs.readFileSync(path.join(dir,'simple.json'),'utf8'))+']))',ctx);
 assert.equal(updated,0);assert(modalState[2].includes('Adicionar à Biblioteca'));pass('Prévia não altera dados');
 await vm.runInContext('confirmConstructorImport(false)',ctx);
 assert.equal(updated,1);
 assert.equal(ctx.db.constructors.length,2);
 for(const k of ['prompts','templates','favorites','settings','presets','recents'])assert.deepEqual(ctx.db[k],baseline[k]);
 assert.equal(screen,'constructors');assert.equal(JSON.parse(serialised).constructors.length,2);
 assert.equal(ctx.db.constructors[1].id,'original');pass('Importação mantém integralmente Biblioteca e configurações');
 await vm.runInContext('readConstructorImport(new Blob(['+JSON.stringify(fs.readFileSync(path.join(dir,'simple.json'),'utf8'))+']))',ctx);
 assert(!modalState[2].includes('data-act="constructor-import-confirm"'));
 assert(modalState[2].includes('Importar como cópia'));
 await vm.runInContext('confirmConstructorImport(true)',ctx);
 assert.equal(ctx.db.constructors.length,3);
 assert.notEqual(ctx.db.constructors[0].id,ctx.db.constructors[1].id);
 assert.equal(ctx.db.constructors[0].steps[0].blocks[2].visibleIf.id,ctx.db.constructors[0].steps[0].blocks[1].id);
 assert.equal(lib.toEnvelope(ctx.db.constructors[0]).constructor.steps.length,2);
 pass('Reimportação como cópia renumera bloco e preserva condições');

 await vm.runInContext('readConstructorImport(new Blob([JSON.stringify({format:"invalid"})]))',ctx);
 assert.equal(ctx.db.constructors.length,3);assert.equal(updated,2);
 assert.equal(modalState[0],'Importação não concluída');pass('Arquivo inválido não grava nada');
 ctx.state.selected=ctx.db.constructors[0].id;
 await vm.runInContext('exportConstructorSingle()',ctx);
 assert.equal(downloads.at(-1).name.endsWith('.json'),true);
 const exp=await lib.readFile(downloads.at(-1).blob);
 assert.equal(exp.envelope.counts.steps,2);pass('Exportação individual compatível com reimportação');

 // Miniatura escrita com ID novo; no erro de armazenamento não altera o banco.
 const withThumb=await lib.readFile(readBlob('stored.zip'));
 ctx.state.selected=null;
 const before=ctx.db.constructors.length;
 vm.runInContext('pendingConstructorImport='+JSON.stringify({envelope:withThumb.envelope,origin:'zip'})+';',ctx);
 vm.runInContext('pendingConstructorImport.thumbnailBlob=new Blob([new Uint8Array(['+Array.from(new Uint8Array(await withThumb.thumbnailBlob.arrayBuffer())).join(',')+'])],{type:"image/png"})',ctx);
 await vm.runInContext('confirmConstructorImport(false)',ctx);
 assert.equal(ctx.db.constructors.length,before+1);
 assert(images.has(ctx.db.constructors[0].thumbnailId));
 pass('Miniatura gravada com ID local novo, sem afetar imagens prévias');
 const oldDb=ctx.db,oldImages=images.size,oldPersist=JSON.stringify(ctx.db);
 ctx.localStorage.setItem=()=>{throw Error('QuotaExceeded')};
 vm.runInContext('pendingConstructorImport='+JSON.stringify({envelope:withThumb.envelope,origin:'zip'})+';',ctx);
 vm.runInContext('pendingConstructorImport.thumbnailBlob=new Blob([new Uint8Array(['+Array.from(new Uint8Array(await withThumb.thumbnailBlob.arrayBuffer())).join(',')+'])],{type:"image/png"})',ctx);
 await vm.runInContext('confirmConstructorImport(true)',ctx);
 assert.equal(ctx.db,oldDb);assert.equal(JSON.stringify(ctx.db),oldPersist);
 assert.equal(images.size,oldImages);assert.equal(modalState[0],'Importação não concluída');
 pass('Falha de armazenamento preserva objetos e desfaz miniatura gravada');

 // O ZIP Store exportado pelo próprio app deve ser aceito no importador individual.
 const begin=app.indexOf('const enc=new TextEncoder(),dec=new TextDecoder();');
 const finish=app.indexOf('async function exportBackupZip()',begin);
 assert(begin>0&&finish>begin);
 const zipCtx={TextEncoder,TextDecoder,Uint32Array,Uint8Array,Blob,URL,document:{},setTimeout:()=>{},payload:JSON.stringify(lib.toEnvelope(withThumb.envelope.constructor,withThumb.envelope.thumbnail)),png:new Uint8Array(await withThumb.thumbnailBlob.arrayBuffer())};
 vm.createContext(zipCtx);vm.runInContext(app.slice(begin,finish),zipCtx);
 const realZip=vm.runInContext('zipStore([["constructor.json",payload],["miniaturas/exemplo.png",new Uint8Array(png)]])',zipCtx);
 const recovered=await lib.readFile(realZip);
 assert.equal(recovered.envelope.constructor.id,withThumb.envelope.constructor.id);
 assert.deepEqual(new Uint8Array(await recovered.thumbnailBlob.arrayBuffer()),zipCtx.png);
 pass('ZIP Store criado pelo aplicativo reimporta JSON e bytes PNG exatos');

 console.log('TOTAL:',count,'grupos de testes passaram.');
}
run().catch(e=>{console.error('FAIL',e.stack||e);process.exitCode=1});
