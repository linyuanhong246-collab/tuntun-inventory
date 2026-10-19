const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const expected=['.nojekyll','index.html','data.js','simple-data.js','product-art.js','manage-ui.js','simple-app.js','style.css','theme.css','simple.css','seed.json','manifest.webmanifest','sw.js',...[32,180,192,512].map(n=>`icon-hamster-${n}.png`)];
assert.deepEqual(fs.readdirSync(dist).sort(),expected.sort(),'Unexpected/missing public files: only approved runtime assets may be deployed');
assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dist,'seed.json'),'utf8')),[],'Public release must start empty; never publish personal inventory');
for(const file of expected)assert(fs.lstatSync(path.join(dist,file)).isFile(),`Not a regular file: ${file}`);
const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
const sandbox={URL,self:{registration:{scope:'https://example.github.io/tuntun-inventory/'},addEventListener(){}}};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(dist,'sw.js'),'utf8')+';globalThis.assets=ASSETS;',sandbox);
const base=new URL(sandbox.self.registration.scope);
for(const ref of [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m=>m[1])){
  assert(!ref.startsWith('/')&&!/^[a-z]+:/i.test(ref),`Resource must be relative: ${ref}`);
  assert(sandbox.assets.includes('./'+ref),`Not precached: ${ref}`);
}
for(const ref of sandbox.assets){const url=new URL(ref,base);assert.equal(url.origin,base.origin);assert(url.pathname.startsWith(base.pathname));const rel=decodeURIComponent(url.pathname.slice(base.pathname.length))||'index.html';assert(fs.existsSync(path.join(dist,rel)),`Missing asset: ${rel}`);}
const manifest=JSON.parse(fs.readFileSync(path.join(dist,'manifest.webmanifest'),'utf8'));
for(const key of ['id','start_url','scope'])assert.equal(manifest[key],'./',`${key} must support repository subpaths`);
for(const i of manifest.icons)assert(fs.existsSync(path.join(dist,i.src)));
assert(html.includes('viewport-fit=cover')&&html.includes('apple-touch-icon'));
assert(!html.includes('src="app.js')&&!html.includes('src="catalog.js'));
assert(fs.readFileSync(path.join(dist,'simple-app.js'),'utf8').includes("register('./sw.js')"));
console.log('Release checks passed: empty seed, approved files, subpath URLs, PWA assets and offline cache.');
