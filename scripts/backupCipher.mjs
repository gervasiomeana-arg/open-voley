import {createCipheriv,createDecipheriv,randomBytes,scryptSync} from 'node:crypto';
export function encryptBackup(value,password){
 if(typeof password!=='string'||password.length<32)throw new Error('A separate 32+ character backup key is required.');
 const salt=randomBytes(16),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',scryptSync(password,salt,32),iv);
 const body=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);
 return {format:'openvoley-encrypted-backup',version:1,salt:salt.toString('base64'),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:body.toString('base64')};
}
export function decryptBackup(payload,password){
 if(payload.format!=='openvoley-encrypted-backup'||payload.version!==1)throw new Error('Unknown backup format.');
 const decipher=createDecipheriv('aes-256-gcm',scryptSync(password,Buffer.from(payload.salt,'base64'),32),Buffer.from(payload.iv,'base64'));decipher.setAuthTag(Buffer.from(payload.tag,'base64'));
 return JSON.parse(Buffer.concat([decipher.update(Buffer.from(payload.data,'base64')),decipher.final()]).toString('utf8'));
}
