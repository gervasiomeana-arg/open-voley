import {decryptBackup} from './backupCipher.mjs';
import fs from 'node:fs';
const [input,output]=process.argv.slice(2),password=process.env.OPENVOLEY_BACKUP_ENCRYPTION_KEY;
if(!input||!output||!password||password.length<32)throw new Error('Provide an encrypted backup file, a new output path and its encryption key via environment.');
const payload=JSON.parse(fs.readFileSync(input,'utf8'));
const clear=JSON.stringify(decryptBackup(payload,password),null,2);
fs.writeFileSync(output,clear,{mode:0o600,flag:'wx'});console.log('Backup decrypted to the requested protected file.');
