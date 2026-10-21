import React, { useEffect, useState } from 'react';
const keyBytes = (value: string) => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')), c => c.charCodeAt(0));
export const AdminPushPanel = () => {
  const [config, setConfig] = useState<any>(null), [deviceId, setDeviceId] = useState(''), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const supported = typeof window !== 'undefined' && window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const api = async (suffix: string, body?: any) => {
    const r = await fetch(`/api/commercial/push/${suffix}`, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
    const data = await r.json(); if (!r.ok) throw Error(data.error || 'No se pudo configurar el aviso.'); return data;
  };
  const refresh = async () => {
    try {
      const data = await api('config'); setConfig(data);
      if (supported) {
        const registration = await navigator.serviceWorker.getRegistration('/');
        const subscription = await registration?.pushManager.getSubscription();
        if (subscription) {
          const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(subscription.endpoint));
          const id = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
          setDeviceId(data.devices.some((d: any) => d.id === id) ? id : '');
        } else setDeviceId('');
      }
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Error de conexión.'); }
  };
  useEffect(() => { void refresh(); }, []);
  const activate = async () => {
    setBusy(true); setMessage('');
    try {
      // The permission prompt is triggered only by this explicit button press.
      if (await Notification.requestPermission() !== 'granted') throw Error('Permiso no habilitado. Revisá las notificaciones de este sitio en Chrome.');
      await navigator.serviceWorker.register('/admin-push-sw.js', { scope: '/' });
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(config.publicKey) });
      const saved = await api('subscribe', { subscription: subscription.toJSON() }); setDeviceId(saved.id);
      setMessage('Avisos activados. Pulsá «Enviar prueba» y comprobá la notificación en el celular.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'No se pudo activar.'); }
    finally { setBusy(false); }
  };
  const disable = async () => {
    setBusy(true);
    try {
      await api('unsubscribe', { id: deviceId });
      const registration = await navigator.serviceWorker.getRegistration('/');
      await (await registration?.pushManager.getSubscription())?.unsubscribe(); setDeviceId(''); setMessage('Avisos desactivados en este dispositivo.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'No se pudo desactivar.'); }
    finally { setBusy(false); }
  };
  const test = async () => {
    setBusy(true);
    try {
      const result = await api('test', { id: deviceId });
      if (result.expired) { setDeviceId(''); setMessage('El permiso venció. Volvé a activar los avisos.'); }
      else setMessage(result.accepted ? 'Prueba enviada al servicio del navegador. Comprobá si apareció en tu celular.' : 'No se pudo enviar la prueba. Revisá conexión y permisos.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Error al probar.'); }
    finally { setBusy(false); }
  };
  return <section className="space-y-3 rounded-xl border border-lime-500/40 bg-slate-950/40 p-4">
    <h3 className="font-bold">Avisos al celular · Sin WhatsApp</h3>
    <p className="text-sm text-slate-300">Recibí «OPEN VOLEY: un nuevo cliente activó su prueba». Solo administración. Sin otro número ni servicio de mensajería de pago.</p>
    {!supported ? <p className="text-sm text-amber-300">Abrí la web publicada con Chrome en tu Android. Este navegador o vista integrada no permite activar notificaciones.</p> : <div className="flex flex-wrap gap-2">
      {!deviceId ? <button disabled={busy || !config} onClick={() => void activate()} className="min-h-11 rounded-lg bg-lime-300 px-3 font-bold text-slate-950 disabled:opacity-50">Activar avisos en este dispositivo</button> : <><button disabled={busy} onClick={() => void test()} className="min-h-11 rounded-lg bg-lime-300 px-3 font-bold text-slate-950 disabled:opacity-50">Enviar prueba</button><button disabled={busy} onClick={() => void disable()} className="min-h-11 rounded-lg bg-slate-700 px-3">Desactivar en este dispositivo</button></>}
    </div>}
    <p className="text-xs text-slate-400">Necesita Internet y permiso del navegador y Android. El ahorro de batería o No molestar pueden retrasar u ocultar avisos. Activá el botón desde el celular donde quieras recibirlos.</p>
    <p role="status" aria-live="polite" className="text-sm">{message || (deviceId ? 'Este dispositivo está registrado para recibir avisos.' : '')}</p>
  </section>;
};
