import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {importServerMigration} from '../src/server/storageMigration';
import {cloudRpc,durableStorageEnabled,CloudStorageError} from '../src/server/supabaseStore';

// Owner-operated preparation command; it is never exposed as a public API.
export async function runMigrationCli(args:string[]){
 const [file,mode='--check']=args;
 if(args.length>2||!file||!['--check','--apply'].includes(mode))throw new CloudStorageError(400,'Uso: node --import tsx scripts/importServerMigration.ts archivo.json --check|--apply');
 if(durableStorageEnabled())throw new CloudStorageError(409,'La migración inicial requiere OPENVOLEY_PERSISTENCE sin activar. No se importó información.');
 const stat=fs.statSync(file);
 if(!stat.isFile()||stat.size>20*1024*1024)throw new CloudStorageError(400,'El respaldo debe ser un archivo JSON de hasta 20 MB.');
 let input:any;try{input=JSON.parse(fs.readFileSync(file,'utf8'));}catch{throw new CloudStorageError(400,'El archivo no es un respaldo JSON válido.');}
 const ready=await cloudRpc<any>('ov_storage_ready',{});
 if(ready?.schemaVersion!==1||ready?.durable!==true||ready?.backups!==true)throw new CloudStorageError(503,'La base permanente todavía no está preparada.');
 const result=await importServerMigration(input,{dryRun:mode==='--check'});
 return {success:true,mode,...result};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 try{console.log(JSON.stringify(await runMigrationCli(process.argv.slice(2))));}
 catch(error){console.error(error instanceof CloudStorageError?error.message:'No se pudo completar la migración. No se mostraron datos privados.');process.exitCode=1;}
}
