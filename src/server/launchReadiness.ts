import fs from 'node:fs';
import path from 'node:path';
export interface ClientBuild {version:1;builtAt:string;googleClientId:string}
export function readClientBuild(root=process.cwd()):ClientBuild|null{
 try{const data=JSON.parse(fs.readFileSync(path.join(root,'server-build/client-build.json'),'utf8'));return data.version===1&&typeof data.builtAt==='string'&&Number.isFinite(Date.parse(data.builtAt))&&typeof data.googleClientId==='string'?data:null;}catch{return null;}
}
export function validPublicUrl(value:string|undefined){try{const url=new URL(value||'');return url.protocol==='https:'&&!!url.hostname&&!url.username&&!url.password&&!url.search&&!url.hash;}catch{return false;}}
const adminsValid=(value:string|undefined)=>!!value?.trim()&&value.split(',').every(email=>/^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(email.trim()));
export function productionConfigurationErrors(env:NodeJS.ProcessEnv=process.env){
 const errors:string[]=[];if((env.SESSION_SECRET?.trim().length||0)<32)errors.push('SESSION_SECRET (32+ caracteres)');if(!env.GOOGLE_CLIENT_ID?.trim())errors.push('GOOGLE_CLIENT_ID');if(!adminsValid(env.ADMIN_EMAILS))errors.push('ADMIN_EMAILS (correos completos)');if(!validPublicUrl(env.APP_URL))errors.push('APP_URL (HTTPS sin credenciales, consulta ni fragmento)');return errors;
}
export const MANUAL_LAUNCH_CHECKS={
 isolation:'Se probaron dos cuentas independientes y una cuenta vencida/bloqueada.',
 payments:'Se probó un cobro sandbox aprobado y pendiente.',
 webhook:'Se probaron webhook firmado, duplicado, reembolso y contracargo.',
 persistence:'Se comprobó que los datos persisten tras reiniciar y volver a desplegar.',
 restore:'Se realizó una restauración real desde una copia externa.',
 privacy:'Se publicaron contacto de soporte, privacidad, condiciones y procedimiento de eliminación de datos.',
 devices:'Se probaron login, registro y scouting en celular y tablet.',
 dependencies:'Se revisaron vulnerabilidades de las dependencias exactas del despliegue.',
 plans:'Se verificó que las funciones y accesos ofrecidos por cada plan corresponden al producto.',
};
export function launchConfiguration(env:NodeJS.ProcessEnv=process.env,build=readClientBuild(),storage?:{healthy:boolean;activeDriver:string;fallbackActive:boolean;verified?:boolean;durable?:boolean}){
 const item=(id:string,label:string,ok:boolean,detail:string)=>({id,label,ok,detail});
 return {checkedAt:new Date().toISOString(),builtAt:build?.builtAt||null,checks:[
  item('production','Modo producción',env.NODE_ENV==='production','Configurar NODE_ENV=production en el servidor publicado.'),
  item('session','Firma de sesiones',(env.SESSION_SECRET?.trim().length||0)>=32,'Se comprueba presencia y longitud; usar un secreto aleatorio propio.'),
  item('google','Google en servidor',!!env.GOOGLE_CLIENT_ID?.trim(),'Configurar el cliente Web de Google y autorizar el dominio publicado.'),
  item('client-google','Google en la compilación',!!build?.googleClientId&&build.googleClientId===env.GOOGLE_CLIENT_ID?.trim(),'VITE_GOOGLE_CLIENT_ID de la compilación debe coincidir con GOOGLE_CLIENT_ID del servidor. Reconstruir si cambió.'),
  item('admins','Administradores configurados',adminsValid(env.ADMIN_EMAILS),'Configurar ADMIN_EMAILS con correos completos separados por coma.'),
  item('url','URL pública HTTPS',validPublicUrl(env.APP_URL),'APP_URL debe ser HTTPS, sin credenciales, consulta ni fragmento.'),
  item('payment-token','Credencial de Mercado Pago',!!env.MERCADOPAGO_ACCESS_TOKEN?.trim(),'Solo se comprueba presencia. Validar su funcionamiento con un cobro sandbox.'),
  item('webhook-secret','Firma de notificaciones',!!env.MERCADOPAGO_WEBHOOK_SECRET?.trim(),'Configurar el secreto del webhook y probar una notificación firmada.'),
  item('ai','Credencial de IA',!!env.GEMINI_API_KEY?.trim(),'Solo se comprueba presencia. Validar una consulta real y sus límites.'),
  item('frame','Protección frente a sitios externos',env.ALLOW_IFRAME_PREVIEW!=='true','Desactivar ALLOW_IFRAME_PREVIEW fuera del entorno de vista previa.'),
  item('storage','Almacenamiento de datos',!!storage?.healthy&&!storage.fallbackActive&&(storage.activeDriver==='supabase'?storage.verified===true&&storage.durable===true:storage.activeDriver==='sqlite'),storage?.activeDriver==='supabase'?'Se verifica la conexión y el esquema de Supabase. El respaldo externo y su restauración requieren pruebas separadas.':'Se comprueba el almacén activo. La persistencia del volumen requiere un ensayo de reinicio.'),
 ]};
}
