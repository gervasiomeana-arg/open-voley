import {AdminPushPanel} from './AdminPushPanel';
import {AdminWhatsAppPanel} from './AdminWhatsAppPanel';
import {StorageMigrationPanel} from './StorageMigrationPanel';
import {LaunchReadinessPanel} from './LaunchReadinessPanel';
import {AdminPaymentPanel} from './AdminPaymentPanel';
import {LegacyRecoveryPanel} from './LegacyRecoveryPanel';
import React,{useEffect,useState} from 'react';
export const AdminCommercialPanel=()=>{
 const [prices,setPrices]=useState<any>(null),[leads,setLeads]=useState<any[]>([]),[visits,setVisits]=useState<any[]>([]),[total,setTotal]=useState(0),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const load=async()=>{try{const responses=await Promise.all([fetch('/api/commercial/prices'),fetch('/api/commercial/leads')]);if(responses.some(r=>!r.ok))throw new Error('No se pudo cargar administración.');const [p,l]=await Promise.all(responses.map(r=>r.json()));setPrices(p.prices);setLeads(l.leads);setVisits(l.visits);setTotal(l.total)}catch(e){setMessage(e instanceof Error?e.message:'Error al cargar')}};
 useEffect(()=>{void load()},[]);
 const save=async()=>{setBusy(true);setMessage('');try{const r=await fetch('/api/commercial/prices',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({prices})});const data=await r.json();if(!r.ok)throw new Error(data.error);setPrices(data.prices);setMessage('Precios guardados. Se aplican a los nuevos cobros.')}catch(e){setMessage(e instanceof Error?e.message:'Error al guardar')}finally{setBusy(false)}};
 const exportLeads=()=>{const quote=(v:any)=>'"'+String(v??'').replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"';const csv=[['Nombre','Correo','Club','Teléfono','Origen','Correo verificado','Autorizó contacto','Primer registro','Último registro'],...leads.map(l=>[l.name,l.email,l.club,l.phone,l.source,l.verified?'Sí':'No',l.consent?'Sí':'No',l.firstSeen,l.lastSeen])].map(row=>row.map(quote).join(';')).join('\r\n');const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='OPEN_VOLEY_interesados.csv';link.click();URL.revokeObjectURL(url)};
 const remove=async(email:string)=>{if(!window.confirm('¿Eliminar los datos de este interesado?'))return;const r=await fetch('/api/commercial/leads/'+encodeURIComponent(email),{method:'DELETE'});if(r.ok)await load();else setMessage('No se pudo eliminar.')};
 return <section className="space-y-5 bg-slate-900 p-5 rounded-2xl border border-slate-700"><h2 className="text-2xl font-bold">Administración comercial</h2>
 <StorageMigrationPanel/><LaunchReadinessPanel />
 <AdminPushPanel />
 <AdminWhatsAppPanel />
 <AdminPaymentPanel />
 <LegacyRecoveryPanel />
 <h3 className="font-bold">Precio de uso de la app</h3><p className="text-sm text-slate-300">Definí el pago mensual por plan y moneda. Los cobros ya iniciados conservan su importe.</p>
 {prices&&Object.entries(prices).map(([id,plan]:[string,any])=><fieldset key={id} className="border border-slate-700 rounded p-3"><legend>{plan.name}</legend><div className="grid sm:grid-cols-2 gap-3">{(['monthly'] as const).flatMap(cycle=>(['ARS','USD'] as const).map(currency=><label key={cycle+currency} className="text-sm">{cycle==='monthly'?'Mensual':'Anual'} {currency}<input type="number" min="0.01" step="0.01" value={plan[cycle][currency]} onChange={e=>setPrices({...prices,[id]:{...plan,[cycle]:{...plan[cycle],[currency]:Number(e.target.value)}}})} className="block bg-slate-800 p-2 rounded w-full"/></label>))}</div></fieldset>)}
 <p role="status" aria-live="polite">{message}</p>
 <button disabled={busy||!prices} onClick={save} className="bg-amber-500 text-slate-950 rounded p-3 font-bold">{busy?'Guardando…':'Guardar precios'}</button>
 <div className="flex flex-wrap items-center gap-3"><h3 className="font-bold">Interesados y cuentas: {leads.length}</h3><button onClick={()=>void load()} className="bg-slate-700 rounded p-2">Actualizar</button><button onClick={exportLeads} className="bg-slate-700 rounded p-2">Exportar CSV</button></div><p className="text-sm text-slate-300">Las solicitudes de demo no prueban la identidad. Las cuentas Google se muestran como verificadas. Una visita anónima no informa nombre ni correo.</p>
 <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr>{['Nombre / correo','Club / teléfono','Registro','Contacto',''].map((h,i)=><th key={i} className="p-2">{h}</th>)}</tr></thead><tbody>{leads.map(l=><tr key={l.email} className="border-t border-slate-700"><td className="p-2">{l.name}<br/>{l.email}</td><td className="p-2">{l.club}<br/>{l.phone}</td><td className="p-2">{l.verified?'Cuenta verificada':'Solicitud de demo'}<br/>{new Date(l.lastSeen).toLocaleString('es-AR')}</td><td className="p-2">{l.consent?'Autorizado':'Sin autorización comercial'}</td><td><button onClick={()=>void remove(l.email)} className="text-rose-300 p-2">Eliminar</button></td></tr>)}</tbody></table></div>
 <h3 className="font-bold">Visitas registradas: {total}</h3><p className="text-sm text-slate-400">Últimas 500 visitas. Se conserva el total registrado.</p><div className="max-h-64 overflow-auto">{visits.map((v,i)=><p key={i} className="text-sm p-2 border-t border-slate-800">{new Date(v.date).toLocaleString('es-AR')} · {v.page} · {v.deviceType}</p>)}</div>
 </section>;
};
