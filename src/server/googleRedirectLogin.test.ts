import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { OAuth2Client } from 'google-auth-library';
import { googleLoginPage, validGoogleRedirectCsrf } from './googleRedirectLogin';
const originalCwd=process.cwd(), temp=mkdtempSync(path.join(tmpdir(),'ov-google-redirect-'));
process.chdir(temp);
process.env.OPENVOLEY_DB_PATH=path.join(temp,'accounts.db');
process.env.SESSION_SECRET='test-google-redirect-session-secret-32-plus';
process.env.GOOGLE_CLIENT_ID='official-client-id';
process.env.ADMIN_EMAILS='admin@example.test';
const {authMeRouter}=await import('./authMeRouter');
const {loadAccounts,saveAccounts}=await import('./accountStore');
const {requestProtection}=await import('./requestProtection');
const {securityMiddleware}=await import('./securityMiddleware');
const originalVerify=OAuth2Client.prototype.verifyIdToken;
let verificationCalls=0;
let payload:any={sub:'verified-sub',email:'coach@example.test',email_verified:true,name:'Coach'};
let invalidSignature=false;
OAuth2Client.prototype.verifyIdToken=(async(options:any)=>{
  verificationCalls++;assert.equal(options.audience,'official-client-id');
  if(invalidSignature)throw Error('Rejected signature or expired token in test');
  return {getPayload:()=>payload};
}) as any;
const response=()=>({code:200,headers:{} as Record<string,any>,data:null as any,status(code:number){this.code=code;return this;},setHeader(k:string,v:any){this.headers[k]=v;return this;},json(data:any){this.data=data;return this;},send(data:any){this.data=data;return this;},redirect(code:number,location:string){this.code=code;this.headers.Location=location;return this;}});
async function route(url:string,body:any,headers:any={}) {
  const layer=(authMeRouter as any).stack.find((l:any)=>l.route?.path===url&&l.route.methods.post);
  const res=response();await layer.route.stack[0].handle({body,headers,path:url},res,()=>{});return res;
}
try {
  assert.equal(validGoogleRedirectCsrf({body:{g_csrf_token:'abc'},headers:{cookie:'g_csrf_token=abc'}}),true);
  assert.equal(validGoogleRedirectCsrf({body:{g_csrf_token:'a b'},headers:{cookie:'other=1; g_csrf_token=a%20b'}}),true);
  for(const [body,cookie] of [[{},'g_csrf_token=abc'],[{g_csrf_token:'abc'},''],[{g_csrf_token:'abc'},'g_csrf_token=def'],[{g_csrf_token:['abc']},'g_csrf_token=abc'],[{g_csrf_token:'abc'},'g_csrf_token=abc; g_csrf_token=abc'],[{g_csrf_token:'abc'},'g_csrf_token=%zz'],[{g_csrf_token:'a'.repeat(1025)},'g_csrf_token='+'a'.repeat(1025)]]) {
    assert.equal(validGoogleRedirectCsrf({body,headers:{cookie:cookie as string}}),false);
  }
  const missingCsrf=await route('/google/redirect',{credential:'fake'});assert.equal(missingCsrf.code,403);assert.equal(verificationCalls,0);
  assert.equal((await loadAccounts()).length,0);
  const body={credential:'test-credential',g_csrf_token:'csrf',returnTo:'https://evil.example'};
  const headers={cookie:'g_csrf_token=csrf'};
  invalidSignature=true;
  const invalid=await route('/google/redirect',body,headers);assert.equal(invalid.code,303);assert.equal(invalid.headers.Location,'/ingresar?error=login');assert.equal(invalid.headers['Set-Cookie'],undefined);
  assert.equal((await loadAccounts()).length,0);
  invalidSignature=false;payload.email_verified=false;
  assert.equal((await route('/google/redirect',body,headers)).headers['Set-Cookie'],undefined);
  payload.email_verified=true;
  const success=await route('/google/redirect',body,headers);
  assert.equal(success.code,303);assert.equal(success.headers.Location,'/');
  assert.match(success.headers['Set-Cookie'][0],/^ov_session=.*HttpOnly; SameSite=Lax/);
  const first=(await loadAccounts())[0];assert.equal(first.trialDurationDays,7);assert.equal(first.googleSub,'verified-sub');
  const oldDate='2025-01-01T00:00:00.000Z';await saveAccounts([{...first,firstLoginDate:oldDate}]);
  await route('/google/redirect',body,headers);
  const again=(await loadAccounts())[0];assert.equal(again.firstLoginDate,oldDate);assert.equal(again.trialDurationDays,7,'redirect cannot reset expired trials');
  await saveAccounts([{...again,isBlocked:true}]);
  assert.equal((await route('/google/redirect',body,headers)).headers['Set-Cookie'],undefined);
  await saveAccounts([{...again,googleSub:'different-sub'}]);
  assert.equal((await route('/google/redirect',body,headers)).headers['Set-Cookie'],undefined);
  await saveAccounts([again]);
  assert.equal((await route('/google',body,headers)).code,200,'popup JSON login still works');
  const page=response();googleLoginPage({query:{error:'<script>untrusted</script>'}} as any,page as any);
  assert.equal(page.code,200);assert.match(page.data,/ux_mode:'redirect'/);assert.match(page.data,/location.origin\+'\/api\/auth\/google\/redirect'/);
  assert.doesNotMatch(page.data,/<script>untrusted/);assert.equal(page.headers['Cache-Control'],'no-store');
  process.env.GOOGLE_CLIENT_ID='</script><img src=x onerror=alert(1)>';
  const escaped=response();googleLoginPage({query:{}} as any,escaped as any);assert.doesNotMatch(escaped.data,/<img src=x/);
  delete process.env.GOOGLE_CLIENT_ID;
  const unavailable=response();googleLoginPage({query:{}} as any,unavailable as any);assert.equal(unavailable.code,503);assert.doesNotMatch(unavailable.data,/src="https:\/\/accounts.google.com/);
  process.env.GOOGLE_CLIENT_ID='official-client-id';
  const guarded=response();await requestProtection({method:'POST',path:'/api/auth/google/redirect',ip:'new-redirect-test',body:{credential:'x'}} as any,guarded as any,()=>assert.fail('invalid token cannot pass'));assert.equal(guarded.code,400);
  for(let i=0;i<20;i++) {let pass=false;await requestProtection({method:'POST',path:i%2?'/API/AUTH/GOOGLE/REDIRECT/':'/api/auth/google',ip:'shared-redirect-test',body:{credential:'x'.repeat(100)}} as any,response() as any,()=>{pass=true;});assert.equal(pass,true);}
  const limited=response();await requestProtection({method:'POST',path:'/api/auth/google/redirect',ip:'shared-redirect-test',body:{credential:'x'.repeat(100)}} as any,limited as any,()=>assert.fail('shared rate limit'));assert.equal(limited.code,429);
  const crossOrigin=response();await securityMiddleware({method:'POST',path:'/api/auth/google/redirect',headers:{host:'app.example',origin:'https://evil.example'}} as any,crossOrigin as any,()=>assert.fail('CSRF route must not weaken origin guard'));assert.equal(crossOrigin.code,403);
  // Browser redirects may carry Origin:null or no Origin/Referer at all.
  // Exercise middleware AND handler, rather than testing the handler alone.
  for(const origin of ['null',undefined,'https://accounts.google.com']) {
    const req={method:'POST',path:'/api/auth/google/redirect',body,headers:{...headers,host:'app.example',...(origin?{origin}:{})}};
    let passed=false;await securityMiddleware(req as any,response() as any,()=>{passed=true;});assert.equal(passed,true);
    const loggedIn=await route('/google/redirect',body,req.headers);assert.equal(loggedIn.code,303);assert.ok(loggedIn.headers['Set-Cookie']);
    const rejected=response();await securityMiddleware({...req,body:{...body,g_csrf_token:'wrong'}} as any,rejected as any,()=>assert.fail('mismatched CSRF'));assert.equal(rejected.code,403);
  }
  const otherRoute=response();await securityMiddleware({method:'POST',path:'/api/auth/google',body,headers:{...headers,host:'app.example',origin:'null'}} as any,otherRoute as any,()=>assert.fail('only redirect gets GIS CSRF handling'));assert.equal(otherRoute.code,403);
  console.log('Google redirect: CSRF, verified token, blocked accounts, trial continuity, safe return, shared rate limits and popup compatibility OK');
} finally {OAuth2Client.prototype.verifyIdToken=originalVerify;process.chdir(originalCwd);rmSync(temp,{recursive:true,force:true});}
