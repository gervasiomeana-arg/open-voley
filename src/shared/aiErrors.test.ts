import assert from 'node:assert/strict';
import {classifyAiError,aiResponseError,AI_MESSAGES} from './aiErrors';
for(const [status,code] of [[401,'AI_ACCESS_DENIED'],[403,'AI_ACCESS_DENIED'],[404,'AI_MODEL_UNAVAILABLE'],[429,'AI_RATE_LIMIT'],[503,'AI_BUSY'],[504,'AI_TIMEOUT'],[500,'AI_UNAVAILABLE']] as const){
 const result=classifyAiError({status,message:'PRIVATE_KEY_AND_PROMPT'});assert.equal(result.code,code);assert.ok(!JSON.stringify(result).includes('PRIVATE_KEY'));
 assert.equal(aiResponseError(result.status,result),AI_MESSAGES[code]);
}
assert.equal(classifyAiError(new Error('AI_EMPTY_RESPONSE')).code,'AI_EMPTY_RESPONSE');
assert.equal(classifyAiError(new Error('AI_NOT_CONFIGURED')).status,503);
assert.equal(classifyAiError({name:'AbortError'}).status,504);
assert.equal(aiResponseError(500,{code:'__proto__',error:'private details'}),AI_MESSAGES.AI_UNAVAILABLE);
assert.match(aiResponseError(413,{}),/menos partidos/);assert.match(aiResponseError(401,{}),/Google/);
console.log('AI diagnostics: safe provider classification, actionable messages and no credential/prompt leakage passed.');
