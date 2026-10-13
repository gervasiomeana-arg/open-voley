// Local cache is account scoped. The durable sync layer subscribes to successful mutations.
let userId='guest';
type Mutation={owner:string;key:string|null;value:string|null;error?:boolean};
const listeners=new Set<(event:Mutation)=>void>();
export function subscribeStorageMutations(listener:(event:Mutation)=>void){listeners.add(listener);return ()=>{listeners.delete(listener);};}
export function setStorageUser(id:string|null){userId=id||'guest';for(const f of listeners)f({owner:userId,key:null,value:null});}
export function getStorageUser(){return userId;}
export const userStorage={
 getItem(key:string){return localStorage.getItem(`ov-user:${encodeURIComponent(userId)}:${key}`);},
 setItem(key:string,value:string){const full=`ov-user:${encodeURIComponent(userId)}:${key}`,old=localStorage.getItem(full);try{localStorage.setItem(full,value);}catch(error){for(const f of listeners)f({owner:userId,key,value,error:true});throw error;}if(old!==value)for(const f of listeners)f({owner:userId,key,value});},
 removeItem(key:string){const full=`ov-user:${encodeURIComponent(userId)}:${key}`;localStorage.removeItem(full);for(const f of listeners)f({owner:userId,key,value:null});}
};
