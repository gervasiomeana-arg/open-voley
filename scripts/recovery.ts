import path from 'node:path';
import {createBackup,verifyBackup,restoreBackup} from '../src/server/recoveryBackup';
const [command,...args]=process.argv.slice(2);
const option=(name:string)=>{const i=args.indexOf(name);return i>=0?args[i+1]:undefined;};
try{
 let result;
 if(command==='verify'){const input=option('--input');if(!input)throw new Error('Use verify --input BACKUP');result=await verifyBackup(path.resolve(input));}
 else{
  if(!args.includes('--offline-confirmed'))throw new Error('Stop the application, then add --offline-confirmed.');
  const output=option('--output');if(!output)throw new Error('A new --output directory is required.');
  if(command==='backup'){const source=path.resolve(option('--source')||process.cwd());result=await createBackup(source,output,process.env.OPENVOLEY_DB_PATH?path.resolve(process.env.OPENVOLEY_DB_PATH):undefined);}
  else if(command==='restore'){const input=option('--input');if(!input)throw new Error('Use restore --input BACKUP --output NEW_DIRECTORY');result=await restoreBackup(path.resolve(input),output);}
  else throw new Error('Commands: backup, verify, restore');
 }
 console.log(`Completed ${command}: ${result.files.length} verified files.`);
}catch(error){console.error(error instanceof Error?error.message:'Recovery failed');process.exitCode=1;}
