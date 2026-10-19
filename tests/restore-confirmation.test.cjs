const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const I=require('../dist/data.js'),S=require('../dist/simple-data.js'),Art=require('../dist/product-art.js'),{Database}=require('./memory-idb.cjs');
async function setup(){
  const source=new Database([...I.tables,'recovery']),database=new Database([...I.tables,'recovery']);
  for(const db of [source,database]){await I.seed(db,[]);await S.ensure(db);}
  for(let n=0;n<30;n++)await S.add(source,{itemName:'合成恢复测试'+n,quantity:1,unit:'件',location:'测试位置'});
  const backup=await S.backup(source),events={},fields={restoreAck:{checked:false},confirmRestore:{disabled:true}},app={innerHTML:''};
  const sandbox={SimpleInventory:S,Inventory:I,ProductArt:Art,database,backup,crypto,structuredClone,URL,Blob,Intl,Date,console,setTimeout,clearTimeout,window:{addEventListener(){},scrollTo(){}},document:{querySelector:q=>q==='#app'?app:fields[q.slice(1)]||null,addEventListener(t,f){events[t]=f;},body:{classList:{toggle(){}}}}};
  vm.createContext(sandbox);for(const f of ['manage-ui.js','simple-app.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist',f),'utf8').replace(/\nstart\(\);\s*$/,''),sandbox);
  const run=x=>vm.runInContext(x,sandbox);await run('(async()=>{db=database;stock=await S.get(db);sheet={type:"restore",backup,incoming:backup.state,expectedState:S.stateKey(stock),ack:false}})()');
  return {run,events,fields,database,backup};
}
test('long restore preview places one confirmation above fixed footer buttons',async()=>{
  const {run}=await setup(),html=run('dialog()');assert(html.includes('规格库存：0 → 30 条'));const footer=html.indexOf('<div class="sheet-footer">'),checkbox=html.indexOf('id="restoreAck"'),actions=html.indexOf('<div class="audit-actions">');assert(footer<checkbox&&checkbox<actions);assert.equal((html.match(/id="restoreAck"/g)||[]).length,1);assert.match(html,/<button id="confirmRestore" disabled /);
});
test('checking and unchecking immediately toggles submit without redrawing the list',async()=>{
  const {run,events,fields}=await setup();run('draw=()=>{throw Error("Unexpected redraw")};');fields.restoreAck.checked=true;await events.change({target:{id:'restoreAck'}});assert.equal(run('sheet.ack'),true);assert.equal(fields.confirmRestore.disabled,false);assert(!/<button id="confirmRestore" disabled /.test(run('dialog()')));fields.restoreAck.checked=false;await events.change({target:{id:'restoreAck'}});assert.equal(run('sheet.ack'),false);assert.equal(fields.confirmRestore.disabled,true);
});
test('restore still requires acknowledgment and preserves all data and a pre-restore snapshot',async()=>{
  const {run,events,fields,database,backup}=await setup(),before=await S.get(database);await assert.rejects(()=>run('save()'),/请先核对并勾选确认/);assert.deepEqual(await S.get(database),before);fields.restoreAck.checked=true;await events.change({target:{id:'restoreAck'}});await run('save()');assert.deepEqual(await S.get(database),backup.state);const snapshots=await I.transaction(database,['recovery'],tx=>I.request(tx.objectStore('recovery').getAll()),'readonly');assert(snapshots.some(r=>r.simpleState&&r.simpleState.items.length===0));assert.equal(run('sheet'),null);
});
