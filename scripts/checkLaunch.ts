import 'dotenv/config';
import {launchConfiguration} from '../src/server/launchReadiness';
import {getTrainingRepositoryStatus} from '../src/server/trainingRepository';
const report=launchConfiguration(process.env,undefined,getTrainingRepositoryStatus());
for(const check of report.checks)console.log(`${check.ok?'OK':'PENDIENTE'}: ${check.label}${check.ok?'':'. '+check.detail}`);
console.log('Esta comprobación no valida credenciales externas, volumen persistente, pagos ni restauraciones reales. Revisar las pruebas manuales en administración.');
if(report.checks.some(c=>!c.ok))process.exitCode=1;
