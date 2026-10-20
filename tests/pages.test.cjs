const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const I=require('../dist/data.js'),S=require('../dist/simple-data.js'),Art=require('../dist/product-art.js'),{Database}=require('./memory-idb.cjs');
const dist=path.join(__dirname,'../dist'),read=f=>fs.readFileSync(path.join(dist,f),'utf8');
const emptyDb=()=>new Database([...I.tables,'recovery']);
async function initialized(){const db=emptyDb();await I.seed(db,JSON.parse(read('seed.json')));await S.ensure(db);return db;}
async function synthetic(db){return S.add(db,{itemName:'测试产品甲',brandName:'测试品牌',specName:'测试规格',quantity:3,unit:'盒',location:'测试位置',iconKey:'box'});}
function worker(scope='https://example.github.io/tuntun-inventory/'){
  const events={},stores=new Map(),deleted=[],requests=[];let offline=false;
  const absolute=x=>new URL(typeof x==='string'?x:x.url,scope).href;
  const caches={async open(name){if(!stores.has(name))stores.set(name,new Map());const data=stores.get(name);return {async addAll(list){for(const x of list){requests.push(absolute(x));data.set(absolute(x),'CACHED:'+absolute(x));}},async match(x){return data.get(absolute(x));}};},async keys(){return [...stores.keys()];},async delete(k){deleted.push(k);return stores.delete(k);},async match(x){for(const data of stores.values())if(data.has(absolute(x)))return data.get(absolute(x));}};
  const sandbox={URL,caches,fetch:async x=>{if(offline)throw Error('offline');return 'NETWORK:'+absolute(x);},self:{registration:{scope},location:{origin:new URL(scope).origin},addEventListener(t,f){events[t]=f;},skipWaiting:async()=>{},clients:{claim:async()=>{}}}};
  vm.createContext(sandbox);vm.runInContext(read('sw.js')+';globalThis.cacheName=CACHE;globalThis.prefix=CACHE_PREFIX;',sandbox);
  async function lifecycle(type){let p;events[type]({waitUntil(x){p=x;}});await p;}
  async function fetchEvent(url,mode='cors',method='GET'){let p;events.fetch({request:{url,mode,method},respondWith(x){p=x;}});return p===undefined?undefined:await p;}
  return {sandbox,stores,deleted,requests,lifecycle,fetchEvent,setOffline(){offline=true;}};
}
test('public seed starts with a valid empty inventory and can create the first product',async()=>{
  const db=await initialized(),s=await S.get(db);assert.deepEqual(s.items,[]);assert.deepEqual(s.operations,[]);S.validate(s);
  await S.add(db,{itemName:'待购测试品',quantity:0,unit:'件'});const after=await S.get(db);assert.equal(after.items.length,1);assert.equal(after.variants[0].quantity,0);assert.equal(after.operations[0].type,'CREATE');
});
test('reopening never seeds over existing stock',async()=>{
  const db=await initialized();await synthetic(db);const before=await S.get(db);assert.equal(await I.preserveExisting(db),true);assert.equal(await I.seed(db,[]),false);await S.ensure(db);assert.deepEqual(await S.get(db),before);
});
test('intake, consume and undo remain correct on the public empty seed',async()=>{
  const db=await initialized();await synthetic(db);let s=await S.get(db);const v=s.variants[0];const op=await S.change(db,{variantId:v.id,delta:-1});assert.equal((await S.get(db)).variants[0].quantity,2);await S.undo(db,op.id);s=await S.get(db);assert.equal(s.variants[0].quantity,3);assert.equal(s.operations.at(-1).type,'REVERSE');
});
test('backup restores archived stock, locations, icons and ledger into a new origin database',async()=>{
  const old=await initialized();await synthetic(old);let s=await S.get(old);await S.archive(old,{itemId:s.items[0].id,archived:true,expectedState:S.stateKey(s.items[0]),expectedStockState:S.archiveKey(s,s.items[0].id)});await S.setView(old,'list');
  const backup=await S.backup(old),fresh=await initialized();assert.equal((await S.get(fresh)).items.length,0);const before=await S.get(fresh);await S.restore(fresh,backup,S.stateKey(before));const after=await S.get(fresh);assert.deepEqual(after,backup.state);assert.equal(after.items[0].archived,true);assert.equal(after.items[0].icon,'box');assert.equal(after.variants[0].location,'测试位置');assert.equal(after.variants[0].quantity,3);assert.equal(after.preferences.view,'list');const rows=await I.transaction(fresh,['recovery'],tx=>I.request(tx.objectStore('recovery').getAll()),'readonly');assert(rows.some(r=>r.simpleState));
});
test('modified backup is rejected without changing the new site inventory',async()=>{
  const db=await initialized();await synthetic(db);const before=await S.get(db),backup=await S.backup(db);backup.state.items[0].name='已被修改';await assert.rejects(()=>S.restore(db,backup,S.stateKey(before)));assert.deepEqual(await S.get(db),before);
});
test('old version backup remains readable on the Pages release',async()=>{
  const db=emptyDb();await I.seed(db,[]);const legacy=await I.backup(db);const decoded=await S.decode(legacy);S.validate(decoded);assert.equal(decoded.items.length,0);
});
test('offline install resolves every precached asset inside the repository path',async()=>{
  const w=worker();await w.lifecycle('install');assert(w.requests.length>10);assert(w.requests.every(u=>u.startsWith('https://example.github.io/tuntun-inventory/')));w.setOffline();assert.match(await w.fetchEvent('https://example.github.io/tuntun-inventory/','navigate'),/CACHED:.*\/index.html$/);assert.match(await w.fetchEvent(new URL(read('index.html').match(/src="(manage-ui[^"]+)"/)[1],'https://example.github.io/tuntun-inventory/').href),/^CACHED:/);
});
test('cache upgrade leaves other repository caches and IndexedDB untouched',async()=>{
  const w=worker();w.stores.set(w.sandbox.prefix+'old',new Map());w.stores.set('tuntun-pages:/other-repository/:old',new Map());w.stores.set('another-app-cache',new Map());await w.lifecycle('install');await w.lifecycle('activate');assert.deepEqual(w.deleted,[w.sandbox.prefix+'old']);assert(w.stores.has('another-app-cache'));assert(w.stores.has('tuntun-pages:/other-repository/:old'));
});
test('worker does not intercept foreign origins, non-GET or another repository assets',async()=>{
  const w=worker();assert.equal(await w.fetchEvent('https://elsewhere.test/data.js'),undefined);assert.equal(await w.fetchEvent('https://example.github.io/other-repository/data.js'),undefined);assert.equal(await w.fetchEvent('https://example.github.io/tuntun-inventory/data.js','cors','POST'),undefined);
});
test('all supported PWA base paths preserve manifest identity and resource scope',()=>{
  const manifest=JSON.parse(read('manifest.webmanifest'));for(const scope of ['https://example.github.io/','https://example.github.io/tuntun-inventory/','https://inventory.example.test/']){const w=worker(scope);assert.equal(new URL(manifest.start_url,scope).href,scope);assert.equal(new URL(manifest.scope,scope).href,scope);assert.equal(new URL(manifest.id,scope).href,scope);assert(w.sandbox.prefix.includes(new URL(scope).pathname));}
});
test('new site UI starts empty and presents the current three requested UI adjustments',async()=>{
  const db=await initialized(),app={innerHTML:''},sandbox={SimpleInventory:S,Inventory:I,ProductArt:Art,database:db,crypto,structuredClone,URL,Blob,Intl,Date,console,setTimeout,clearTimeout,window:{addEventListener(){},scrollTo(){}},document:{querySelector:q=>q==='#app'?app:null,addEventListener(){},body:{classList:{toggle(){}}}}};vm.createContext(sandbox);vm.runInContext(read('manage-ui.js'),sandbox);vm.runInContext(read('simple-app.js').replace(/\nstart\(\);\s*$/,''),sandbox);const run=x=>vm.runInContext(x,sandbox);await run('(async()=>{db=database;await draw()})()');assert(app.innerHTML.includes('我的库存'));assert(app.innerHTML.includes('新增产品'));assert(!run('settingsView()').includes('当前模型'));const form=run('newProductPage()');for(const label of ['产品名称（必填）','数量（必填）','>品牌</label>','>规格</label>','>存放位置</label>'])assert(form.includes(label),label);assert(!form.includes('选填'));await synthetic(db);await run('draw()');await run("action('item',stock.items[0].id)");assert.match(run('dialog()'),/class="delete-batch-button wide"[^>]*>归档该产品/);
});
