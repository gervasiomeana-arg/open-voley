export interface CloudRecord { key:string; value:any; revision:number; updatedAt:string }
export class CloudStorageError extends Error { constructor(public status:number, message='No se pudo confirmar el guardado permanente.') {super(message);} }
export function durableStorageEnabled(){return process.env.OPENVOLEY_PERSISTENCE?.trim()==='supabase';}
export function cloudConfiguration(){
 const raw=process.env.SUPABASE_URL?.trim(),key=process.env.SUPABASE_SECRET_KEY?.trim()||process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
 if(!raw||!key)throw new CloudStorageError(503,'Falta configurar el almacenamiento permanente.');
 let url:URL;try{url=new URL(raw);}catch{throw new CloudStorageError(503);}
 if(url.protocol!=='https:'||!url.hostname.endsWith('.supabase.co')||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw new CloudStorageError(503,'La dirección de Supabase no es válida.');
 return {url:url.origin,key};
}
export async function cloudRpc<T>(name:string,args:object):Promise<T>{
 const {url,key}=cloudConfiguration();let response:Response;
 try{response=await fetch(`${url}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:key,...(key.startsWith('sb_secret_')?{}:{Authorization:`Bearer ${key}`}),'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(15000)});}catch{throw new CloudStorageError(503);}
 const data=await response.json().catch(()=>null);
 if(!response.ok)throw new CloudStorageError(data?.code==='40001'||data?.code==='23505'?409:503,data?.code==='40001'||data?.code==='23505'?'Hay una versión más reciente. Revisá el conflicto antes de guardar.':undefined);
 if(data===null)throw new CloudStorageError(503);return data;
}
export async function readCloud(namespace:string,owner:string,key:string|null=null):Promise<CloudRecord[]>{return cloudRpc('ov_read_records',{p_namespace:namespace,p_owner:owner,p_key:key});}
export async function writeCloud(namespace:string,owner:string,key:string,value:any,baseRevision:number){
 const rows=await cloudRpc<CloudRecord[]>('ov_commit_records',{p_writes:[{namespace,owner,key,value,baseRevision}]});return rows[0];
}
export async function updateCloud(namespace:string,owner:string,key:string,update:(previous:any)=>any){
 for(let n=0;n<3;n++){
  const previous=(await readCloud(namespace,owner,key))[0],value=update(previous?.value??null);
  if(previous&&JSON.stringify(previous.value)===JSON.stringify(value))return previous;
  try{return await writeCloud(namespace,owner,key,value,previous?.revision||0);}catch(error){if(!(error instanceof CloudStorageError)||error.status!==409||n===2)throw error;}
 }
 throw new CloudStorageError(409);
}
