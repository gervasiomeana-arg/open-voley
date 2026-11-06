import assert from 'node:assert/strict';
class MemoryStorage{data=new Map<string,string>();get length(){return this.data.size;}getItem(k:string){return this.data.get(k)??null;}setItem(k:string,v:string){this.data.set(k,v);}removeItem(k:string){this.data.delete(k);}key(n:number){return [...this.data.keys()][n]??null;}}
const memory=new MemoryStorage();(globalThis as any).localStorage=memory;(globalThis as any).window={dispatchEvent(){},addEventListener(){}};
const originalTimeout=globalThis.setTimeout,originalClear=globalThis.clearTimeout;globalThis.setTimeout=((()=>1) as any);globalThis.clearTimeout=((()=>{}) as any);
const {userStorage,setStorageUser}=await import('./userStorage');
const sync=await import('./userDataSync');
const teams='openvoley_saved_teams_v1',remote=new Map<string,Map<string,any>>(),archives:any[]=[];
let offline=false,enabled=true,hold:((value:any)=>void)|undefined;
function bucket(id:string){if(!remote.has(id))remote.set(id,new Map());return remote.get(id)!;}
globalThis.fetch=async(url:any,init:any)=>{
 if(offline)throw new Error('offline');const id=init.headers['X-Openvoley-User'];const path=String(url).slice('/api/user-data'.length),data=bucket(id);
 if(init.method==='GET')return Response.json({enabled,records:[...data.values()]});
 const key=decodeURIComponent(path.slice(1)),body=JSON.parse(init.body);
 if(path.endsWith('/archive')){archives.push({owner:id,...body});return Response.json({success:true});}
 if(hold){await new Promise(resolve=>{const ready=hold!;hold=undefined;ready(resolve);});}
 const old=data.get(key);if((old?.revision||0)!==body.baseRevision)return Response.json({error:'conflict'},{status:409});
 const record={key,value:body.value,revision:(old?.revision||0)+1,updatedAt:new Date().toISOString()};data.set(key,record);return Response.json({success:true,record});
};
const scoped=(owner:string,key:string)=>`ov-user:${owner}:${key}`;
// Only verified scope is imported. Guest and legacy records never leak.
memory.setItem(teams,JSON.stringify([{id:'legacy'}]));memory.setItem(scoped('guest',teams),JSON.stringify([{id:'guest'}]));memory.setItem(scoped('A',teams),JSON.stringify([{id:'A'}]));memory.setItem(scoped('B',teams),JSON.stringify([{id:'B'}]));
setStorageUser('A');await sync.initializeUserDataSync('A');assert.equal(bucket('A').get(teams).value[0].id,'A');assert.equal(bucket('B').size,0);assert.equal(sync.getDataSyncStatus().state,'synced');
// Tournament bundle uses the same durable queue, hydration and account boundary as other collections.
const {createTournament,COMPETITIONS_KEY}=await import('../shared/competitions');
const competition=createTournament({id:'sync-tournament',name:'Liga',category:'Primera',gender:'Mixto',format:'round_robin',teams:['Local','Rival'],teamIds:['a','b'],courtsCount:1,pointsSystem:'3-1',startDate:'2026-10-16'});
userStorage.setItem(COMPETITIONS_KEY,JSON.stringify(competition));await sync.flushUserData();assert.deepEqual(bucket('A').get(COMPETITIONS_KEY).value,competition);
memory.removeItem(scoped('A',COMPETITIONS_KEY));await sync.initializeUserDataSync('A');assert.deepEqual(JSON.parse(userStorage.getItem(COMPETITIONS_KEY)!),competition);assert.equal(bucket('B').has(COMPETITIONS_KEY),false);
// Network failure retains pending writes across a reload/initialization.
offline=true;userStorage.setItem(teams,JSON.stringify([{id:'edited'}]));await sync.flushUserData();assert.equal(sync.getDataSyncStatus().state,'error');assert.match(memory.getItem(scoped('A','openvoley.cloud.pending.v1'))!,/edited/);offline=false;await sync.initializeUserDataSync('A');assert.equal(bucket('A').get(teams).value[0].id,'edited');
// A clean old cache takes a newer cloud version automatically.
bucket('A').set(teams,{...bucket('A').get(teams),value:[{id:'other-device'}],revision:3});await sync.initializeUserDataSync('A');assert.equal(JSON.parse(userStorage.getItem(teams)!)[0].id,'other-device');
// Simultaneous unsent edits never overwrite another device silently.
userStorage.setItem(teams,JSON.stringify([{id:'local-conflict'}]));bucket('A').set(teams,{...bucket('A').get(teams),value:[{id:'cloud-conflict'}],revision:4});await sync.initializeUserDataSync('A');assert.equal(sync.getDataSyncStatus().state,'conflict');assert.equal(JSON.parse(userStorage.getItem(teams)!)[0].id,'local-conflict');await sync.resolveDataConflict(teams,'cloud');assert.equal(archives[0].value[0].id,'local-conflict');assert.equal(JSON.parse(userStorage.getItem(teams)!)[0].id,'cloud-conflict');
// A newer edit while a write is in flight remains pending and is sent afterward.
let release:(v:any)=>void=()=>{};hold=resolve=>{release=resolve;};userStorage.setItem(teams,JSON.stringify([{id:'sending'}]));const inFlight=sync.flushUserData();await new Promise(resolve=>originalTimeout(resolve,5));userStorage.setItem(teams,JSON.stringify([{id:'newer-local'}]));release(null);await inFlight;await sync.flushUserData();assert.equal(bucket('A').get(teams).value[0].id,'newer-local');
// An edit arriving during hashing/initialization cannot be dropped by a stale snapshot.
const originalDigest=crypto.subtle.digest.bind(crypto.subtle);let editDuringHash=true;
crypto.subtle.digest=(async(...args:any[])=>{if(editDuringHash){editDuringHash=false;userStorage.setItem(teams,JSON.stringify([{id:'edited-during-initialization'}]));}return originalDigest(args[0],args[1]);}) as any;
await sync.initializeUserDataSync('A');crypto.subtle.digest=originalDigest;
assert.equal(bucket('A').get(teams).value[0].id,'edited-during-initialization');
// An old account's in-flight response never modifies the next account's local cache.
userStorage.setItem(teams,JSON.stringify([{id:'A-late'}]));hold=resolve=>{release=resolve;};const late=sync.flushUserData();await new Promise(resolve=>originalTimeout(resolve,5));setStorageUser('B');release(null);await late;
assert.equal(JSON.parse(userStorage.getItem(teams)!)[0].id,'B');setStorageUser('A');await sync.initializeUserDataSync('A');
// Plain preferences preserve their original raw-string format.
userStorage.setItem('openvoley.courtView','side');await sync.flushUserData();memory.removeItem(scoped('A','openvoley.courtView'));await sync.initializeUserDataSync('A');assert.equal(userStorage.getItem('openvoley.courtView'),'side');
// A deletion is a versioned tombstone and cannot resurrect after reinitialization.
userStorage.removeItem(teams);await sync.flushUserData();assert.equal(bucket('A').get(teams).value,null);await sync.initializeUserDataSync('A');assert.equal(userStorage.getItem(teams),null);
setStorageUser('B');await sync.initializeUserDataSync('B');assert.equal(bucket('B').get(teams).value[0].id,'B');assert.equal(bucket('A').get(teams).value,null);
// Existing deployments without cloud activation continue using their local data.
enabled=false;setStorageUser('C');await sync.initializeUserDataSync('C');assert.equal(sync.getDataSyncStatus().state,'local');assert.equal(sync.cloudOwnsUserData(),false);
globalThis.setTimeout=originalTimeout;globalThis.clearTimeout=originalClear;
console.log('Cloud sync checks passed: account scopes, offline queue, clean refresh, explicit conflicts, preserved local branch, concurrent edits, raw preferences, tombstones and inactive deployment.');
