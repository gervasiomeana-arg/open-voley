import fs from 'node:fs/promises';
import path from 'node:path';
import {createReadStream} from 'node:fs';
import {createHash,randomInt} from 'node:crypto';
import {DatabaseSync,backup} from 'node:sqlite';

const jsonFiles=['clients_db.json','visitors_db.json','training_sessions_db.json','smart_sports_montages_db.json'];
const videoRoot='.openvoley-video-renders';
interface Entry {path:string;size:number;sha256:string}
interface Manifest {format:string;version:number;createdAt:string;files:Entry[]}
const permitted=(p:string)=>p==='openvoley.db'||jsonFiles.includes(p)||p.startsWith(videoRoot+'/');
function safePath(root:string,relative:string){
 if(!permitted(relative)||relative.length>1000||relative.includes('\\')||relative.split('/').some(p=>!p||p==='.'||p==='..'))throw new Error('Invalid backup path');
 const resolved=path.resolve(root,relative);if(!resolved.startsWith(path.resolve(root)+path.sep))throw new Error('Path outside backup');return resolved;
}
async function regularFile(root:string,relative:string){
 const target=safePath(root,relative);let current=path.resolve(root);
 for(const part of relative.split('/')){current=path.join(current,part);if((await fs.lstat(current)).isSymbolicLink())throw new Error('Symlinks are not supported');}
 if(!(await fs.stat(target)).isFile())throw new Error('Expected regular file');return target;
}
async function digest(file:string){const hash=createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);return hash.digest('hex');}
async function copy(source:string,target:string){await fs.mkdir(path.dirname(target),{recursive:true,mode:0o700});await fs.copyFile(source,target);await fs.chmod(target,0o600);}
async function integrity(file:string){const db=new DatabaseSync(file,{readOnly:true});try{const rows=db.prepare('PRAGMA integrity_check').all();if(rows.length!==1||Object.values(rows[0])[0]!=='ok')throw new Error('SQLite integrity check failed');}finally{db.close();}}
async function validateJson(file:string){const data=JSON.parse(await fs.readFile(file,'utf8'));if(!Array.isArray(data))throw new Error('Expected JSON array');return data;}
async function exists(file:string){try{await fs.lstat(file);return true}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return false;throw e}}
export async function createBackup(sourceRoot:string,destination:string,dbPath=path.join(sourceRoot,'openvoley.db')){
 sourceRoot=path.resolve(sourceRoot);destination=path.resolve(destination);
 if(destination===sourceRoot||destination.startsWith(sourceRoot+path.sep))throw new Error('Backup must be outside the application data directory');
 await fs.mkdir(destination,{mode:0o700});
 try{
  const files:Entry[]=[];
  const add=async(relative:string,source:string)=>{const target=safePath(destination,relative);await copy(source,target);files.push({path:relative,size:(await fs.stat(target)).size,sha256:await digest(target)});};
  for(const relative of jsonFiles){if(await exists(path.join(sourceRoot,relative))){const file=await regularFile(sourceRoot,relative);await validateJson(file);await add(relative,file);}}
  if(await exists(dbPath)){
   if((await fs.lstat(dbPath)).isSymbolicLink()||!(await fs.stat(dbPath)).isFile())throw new Error('Invalid database file');
   const target=path.join(destination,'openvoley.db');const db=new DatabaseSync(dbPath,{readOnly:true});try{await backup(db,target)}finally{db.close()}
   await fs.chmod(target,0o600);await integrity(target);files.push({path:'openvoley.db',size:(await fs.stat(target)).size,sha256:await digest(target)});
  }
  const walk=async(relative:string)=>{const directory=path.join(sourceRoot,relative);if((await fs.lstat(directory)).isSymbolicLink())throw new Error('Symlinks are not supported');for(const entry of await fs.readdir(directory,{withFileTypes:true})){const child=relative+'/'+entry.name;if(entry.isSymbolicLink())throw new Error('Symlinks are not supported');if(entry.isDirectory())await walk(child);else if(entry.isFile())await add(child,await regularFile(sourceRoot,child));else throw new Error('Unsupported data file');}};
  if(await exists(path.join(sourceRoot,videoRoot)))await walk(videoRoot);
  if(!files.length)throw new Error('No application data found');
  const manifest:Manifest={format:'openvoley-backup',version:1,createdAt:new Date().toISOString(),files};
  await fs.writeFile(path.join(destination,'manifest.json'),JSON.stringify(manifest,null,2),{mode:0o600});await verifyBackup(destination);return manifest;
 }catch(error){await fs.rm(destination,{recursive:true,force:true});throw error;}
}
export async function verifyBackup(root:string){
 if((await fs.lstat(root)).isSymbolicLink())throw new Error('Symlink backup root');
 const manifestFile=path.join(root,'manifest.json');const metadata=await fs.lstat(manifestFile);if(!metadata.isFile()||metadata.isSymbolicLink()||metadata.size>10*1024*1024)throw new Error('Invalid manifest');
 const manifest=JSON.parse(await fs.readFile(manifestFile,'utf8')) as Manifest;
 if(manifest.format!=='openvoley-backup'||manifest.version!==1||!Array.isArray(manifest.files)||!manifest.files.length||manifest.files.length>100000)throw new Error('Invalid manifest');
 const seen=new Set<string>();for(const entry of manifest.files){if(typeof entry.path!=='string'||seen.has(entry.path)||!Number.isSafeInteger(entry.size)||entry.size<0||!/^[a-f0-9]{64}$/.test(entry.sha256))throw new Error('Invalid manifest entry');seen.add(entry.path);const file=await regularFile(root,entry.path);if((await fs.stat(file)).size!==entry.size||await digest(file)!==entry.sha256)throw new Error('Backup checksum mismatch');if(entry.path==='openvoley.db')await integrity(file);if(jsonFiles.includes(entry.path))await validateJson(file);}
 return manifest;
}
export async function restoreBackup(root:string,destination:string){
 const manifest=await verifyBackup(root);destination=path.resolve(destination);await fs.mkdir(destination,{mode:0o700});
 try{for(const entry of manifest.files)await copy(await regularFile(root,entry.path),safePath(destination,entry.path));
  const accounts=path.join(destination,'clients_db.json');if(await exists(accounts)){const data=await validateJson(accounts);for(const account of data){if(!account||typeof account!=='object'||Array.isArray(account))throw new Error('Invalid account record');account.sessionVersion=Date.now()+randomInt(1,1000000);}await fs.writeFile(accounts,JSON.stringify(data,null,2),{mode:0o600});}
  return manifest;
 }catch(error){await fs.rm(destination,{recursive:true,force:true});throw error;}
}
