import {encryptBackup} from './backupCipher.mjs';
import fs from 'node:fs';
import path from 'node:path';
const dir=path.resolve(process.argv[2]||'encrypted-backup');
const password=process.env.OPENVOLEY_BACKUP_ENCRYPTION_KEY;
const key=process.env.SUPABASE_SECRET_KEY?.trim()||process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),url=new URL(process.env.SUPABASE_URL||'');
if(!password||password.length<32||!key||url.protocol!=='https:'||!url.hostname.endsWith('.supabase.co')||url.pathname!=='/'||url.search||url.hash||url.username||url.password)throw new Error('Configure the server URL, service key and a separate 32+ character backup encryption key.');
fs.mkdirSync(dir,{recursive:true,mode:0o700});
async function rpc(name,args){const response=await fetch(`${url.origin}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:key,...(key.startsWith('sb_secret_')?{}:{Authorization:`Bearer ${key}`}),'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(60000)});if(!response.ok)throw new Error('Backup database request failed.');return response.json();}
const encrypted=value=>JSON.stringify(encryptBackup(value,password));
const snapshot=await rpc('ov_prepare_export',{});let cursor=0,count=0,page=0;
try{
 for(;;){const result=await rpc('ov_export_page',{p_export_id:snapshot.exportId,p_after:cursor,p_limit:10});if(!Array.isArray(result.rows))throw new Error('Invalid export response.');if(!result.rows.length)break;if(result.next<=cursor)throw new Error('Invalid export cursor.');cursor=result.next;count+=result.rows.length;fs.writeFileSync(path.join(dir,`page-${String(++page).padStart(6,'0')}.ovbak`),encrypted({snapshot,page,rows:result.rows}),{mode:0o600});}
 if(count!==snapshot.count)throw new Error('Incomplete backup.');
 fs.writeFileSync(path.join(dir,'manifest.ovbak'),encrypted({snapshot,pages:page,rows:count}),{mode:0o600});
 console.log(`Encrypted backup complete: ${page} pages. No unencrypted user data written.`);
}finally{await rpc('ov_finish_export',{p_export_id:snapshot.exportId});}
