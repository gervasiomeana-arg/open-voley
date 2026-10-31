import React, { useCallback, useEffect, useState } from 'react';
import { getAuthenticatedSession } from '../services/authSession';
import type { ClientUser, TrialInfo } from '../types';
export async function billingRequest(path: string, body?: object) {
  const r = await fetch(`/api/mercadopago/subscription${path}`, { method: body ? 'POST' : 'GET', credentials: 'same-origin',
    ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'No se pudo consultar la suscripción.');
  return data;
}
const labels: Record<string, string> = { failed: 'No se pudo crear la suscripción. Podés reintentar desde los planes.', creating: 'Creación pendiente de confirmar', pending: 'Falta autorizar en Mercado Pago', authorized: 'Débito mensual autorizado', paused: 'Suscripción pausada', cancelled: 'Suscripción cancelada' };
export function RecurringSubscriptionPanel({ onAccessUpdated }: { onAccessUpdated?: (user: ClientUser, trial: TrialInfo) => void }) {
  const [data, setData] = useState<any>(null), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const load = useCallback(async () => {
    try { setData(await billingRequest('')); } catch (e) { setMessage((e as Error).message); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const act = async (path: string) => {
    setBusy(true); setMessage('');
    try {
      setData(await billingRequest(path, {}));
      const session = await getAuthenticatedSession();
      if (session) onAccessUpdated?.(session.user, session.trial);
      setMessage(path === '/cancel' ? 'Cancelación confirmada. No se harán nuevas renovaciones de esta suscripción.' : 'Estado actualizado. El acceso se habilita con un pago aprobado.');
    } catch (e) { setMessage((e as Error).message); } finally { setBusy(false); }
  };
  if (!data?.subscription && !message) return null;
  const s = data?.subscription;
  return <section aria-label="Mi suscripción mensual" className="rounded-xl border border-slate-600 p-4 space-y-3 text-sm">
    <h3 className="font-bold">Mi suscripción mensual</h3>
    {s && <>
      <p>{labels[s.status] || s.status} · ${Number(s.amount).toLocaleString('es-AR')} ARS / mes</p>
      {s.nextPaymentDate && s.status === 'authorized' && <p>Próximo cobro previsto: {new Date(s.nextPaymentDate).toLocaleDateString('es-AR')}</p>}
      {data.paidUntil && <p>Período pagado hasta: {new Date(data.paidUntil).toLocaleDateString('es-AR')}</p>}
      {s.checkoutUrl && <a className="block underline text-sky-300" href={s.checkoutUrl}>Completar autorización en Mercado Pago</a>}
      <div className="flex flex-wrap gap-3">
        <button disabled={busy} onClick={() => void act('/recheck')} className="rounded bg-slate-700 p-2 disabled:opacity-50">{busy ? 'Consultando…' : 'Actualizar pagos y acceso'}</button>
        {s.id && s.status !== 'cancelled' && <button disabled={busy} onClick={() => {
          if (window.confirm('¿Cancelar la renovación automática? Conservás el período ya pagado y tus datos.')) void act('/cancel');
        }} className="rounded border border-rose-400 p-2 disabled:opacity-50">Cancelar suscripción</button>}
      </div>
    </>}
    {message && <p role="status">{message}</p>}
  </section>;
}
