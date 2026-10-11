import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createBackup,verifyBackup,restoreBackup} from './recoveryBackup';
const root=await fs.mkdtemp(path.join(os.tmpdir(),'ov-recovery-'));
try{
 const source=path.join(root,'source'),copy=path.join(root,'backup'),restored=path.join(root,'restored');await fs.mkdir(source);
 await fs.writeFile(path.join(source,'clients_db.json'),JSON.stringify([{id:'a',email:'a@test.invalid',sessionVersion:0},{id:'b',email:'b@test.invalid',sessionVersion:4}]));
 await fs.writeFile(path.join(source,'.env'),'SESSION_SECRET=never-export');
 await fs.mkdir(path.join(source,'.openvoley-video-renders','a'),{recursive:true});await fs.writeFile(path.join(source,'.openvoley-video-renders','a','clip.mp4'),'test-video');
 const db=new DatabaseSync(path.join(source,'openvoley.db'));db.exec('PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0; CREATE TABLE training(user_id TEXT, title TEXT); INSERT INTO training VALUES (\'a\',\'private-a\'),(\'b\',\'private-b\')');
 const manifest=await createBackup(source,copy);assert.equal(manifest.files.length,3);assert.equal(manifest.files.some(f=>f.path==='.env'),false);assert.equal((await fs.stat(copy)).mode&0o777,0o700);
 await assert.rejects(createBackup(source,copy));await assert.rejects(createBackup(source,path.join(source,'nested')));
 await restoreBackup(copy,restored);await assert.rejects(restoreBackup(copy,restored));
 const restoredDb=new DatabaseSync(path.join(restored,'openvoley.db'));assert.deepEqual(restoredDb.prepare('SELECT title FROM training WHERE user_id=?').all('a').map(r=>r.title),['private-a']);assert.deepEqual(restoredDb.prepare('SELECT title FROM training WHERE user_id=?').all('b').map(r=>r.title),['private-b']);restoredDb.close();db.close();
 const accounts=JSON.parse(await fs.readFile(path.join(restored,'clients_db.json'),'utf8'));assert.ok(accounts.every((a:any)=>a.sessionVersion>4));assert.equal(JSON.parse(await fs.readFile(path.join(source,'clients_db.json'),'utf8'))[0].sessionVersion,0);
 await fs.writeFile(path.join(copy,'.openvoley-video-renders','a','clip.mp4'),'corrupted');await assert.rejects(verifyBackup(copy),/checksum/);const failed=path.join(root,'failed');await assert.rejects(restoreBackup(copy,failed));await assert.rejects(fs.stat(failed));
 await fs.writeFile(path.join(copy,'manifest.json'),JSON.stringify({...manifest,files:[{path:'../outside',size:0,sha256:'0'.repeat(64)}]}));await assert.rejects(verifyBackup(copy),/path/);
 const symlinkSource=path.join(root,'symlink-source');await fs.mkdir(symlinkSource);await fs.symlink(path.join(source,'clients_db.json'),path.join(symlinkSource,'clients_db.json'));const symlinkBackup=path.join(root,'symlink-backup');await assert.rejects(createBackup(symlinkSource,symlinkBackup),/Symlinks/);await assert.rejects(fs.stat(symlinkBackup));
 console.log('Backup integrity, WAL snapshot, account isolation, session revocation and failure tests passed.');
}finally{await fs.rm(root,{recursive:true,force:true});}
