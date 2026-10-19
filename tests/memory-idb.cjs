// Test double only: models asynchronous requests, serialized transactions and rollback.
// Does not replace Safari / native IndexedDB acceptance testing.
const clone=x=>structuredClone(x);
class Database {
 constructor(names){this.data=Object.fromEntries(names.map(t=>[t,new Map()]));this.tail=Promise.resolve();this.failTable=null;}
 transaction(names,mode){const tx=new Transaction(this,names,mode);this.tail=this.tail.then(()=>tx.start());return tx;}
}
class Transaction {
 constructor(db,names,mode){this.db=db;this.names=names;this.mode=mode;this.queue=[];this.active=false;this.ended=false;}
 start(){return new Promise(resolve=>{this.release=resolve;this.copy=clone(this.db.data);this.active=true;this.pump();});}
 abort(){if(this.ended)return;this.ended=true;setImmediate(()=>{this.onabort?.();this.release?.();});}
 objectStore(t){if(!this.names.includes(t))throw Error('outside scope');const call=(fn,write=false)=>{if(write&&this.mode==='readonly')throw Error('readonly');if(this.ended)throw Error('inactive');const r={};this.queue.push({fn,r});if(this.active)this.pump();return r;};return {
 get:key=>call(()=>clone(this.copy[t].get(key))),getAll:()=>call(()=>[...this.copy[t].values()].map(clone)),
 put:r=>call(()=>{if(this.db.failTable===t)throw Error('quota simulated');this.copy[t].set(r.id,clone(r));return r.id},true),
 add:r=>call(()=>{if(this.db.failTable===t)throw Error('quota simulated');if(this.copy[t].has(r.id))throw Error('duplicate');this.copy[t].set(r.id,clone(r));return r.id},true),
 clear:()=>call(()=>this.copy[t].clear(),true)};}
 pump(){if(this.scheduled||this.ended)return;this.scheduled=true;setImmediate(()=>{this.scheduled=false;if(this.ended)return;const op=this.queue.shift();if(!op){this.ended=true;if(this.mode!=='readonly')for(const n of this.names)this.db.data[n]=this.copy[n];this.oncomplete?.();this.release();return;}try{op.r.result=op.fn();op.r.onsuccess?.();}catch(e){this.error=e;op.r.error=e;op.r.onerror?.();this.abort();}this.pump();});}
}
module.exports={Database};
