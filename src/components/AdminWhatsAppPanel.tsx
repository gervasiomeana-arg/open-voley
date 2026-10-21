import React, { useEffect, useState } from 'react';
const labels: Record<string, string> = { pending: 'Pendiente', sending: 'Envío iniciado: revisar antes de repetir', accepted: 'Aceptado por Meta', rejected: 'Rechazado por Meta', uncertain: 'Resultado incierto: revisar antes de repetir' };
export const AdminWhatsAppPanel = () => {
  const [data, setData] = useState<any>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const request = async (process = false) => {
    setBusy(true); setError('');
    try {
      const r = await fetch(`/api/commercial/whatsapp${process ? '/process' : ''}`, { method: process ? 'POST' : 'GET' });
      const body = await r.json(); if (!r.ok) throw Error(body.error || 'No se pudo consultar WhatsApp.'); setData(body);
    } catch (e) { setError(e instanceof Error ? e.message : 'Error de conexión'); }
    finally { setBusy(false); }
  };
  useEffect(() => { void request(); }, []);
  return <section className="space-y-3 rounded-xl border border-slate-600 p-4">
    <h3 className="font-bold">Avisos de nuevas pruebas por WhatsApp</h3>
    <p className="text-sm text-slate-300">Un aviso al activar una cuenta nueva con Google. No se envían avisos por visitas anónimas ni por cada ingreso.</p>
    {data && <><p role="status">{data.ready ? `Envío habilitado · destino ${data.recipient}` : data.enabled ? 'Configuración incompleta: los avisos quedan pendientes.' : 'Envío desactivado: los avisos quedan pendientes.'}</p>
      {data.missing?.length > 0 && <p className="break-words text-xs text-amber-300">Falta configurar en los secretos del servidor: {data.missing.join(', ')}</p>}
      <p className="text-xs text-slate-400">Aceptado por Meta no confirma entrega al teléfono. Los envíos con resultado incierto no se repiten automáticamente.</p>
      <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={() => void request()} className="rounded bg-slate-700 p-2 disabled:opacity-50">Actualizar estado</button>
      <button disabled={busy || !data.ready} onClick={() => void request(true)} className="rounded bg-lime-300 p-2 font-bold text-slate-950 disabled:opacity-50">Enviar hasta 5 pendientes / rechazados</button></div>
      <div className="max-h-64 overflow-auto">{data.alerts.map((a: any) => <p key={a.accountId} className="border-t border-slate-700 py-2 text-sm">{a.name} · {a.email}<br/>{labels[a.state] || a.state}{a.errorCode ? ` · ${a.errorCode}` : ''}</p>)}</div>
    </>}
    {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
  </section>;
};
