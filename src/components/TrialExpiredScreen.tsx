import React, { useState } from 'react';
import { ClientUser, TrialInfo } from '../types';
import { SubscriptionPlansModal } from './SubscriptionPlansModal';
import { getAuthenticatedSession } from '../services/authSession';
import { MERCADO_PAGO_PAYMENT_LINK } from '../shared/paymentLink';
interface Props { user: ClientUser; trial: TrialInfo; onLogout: () => void; onExtendSuccess: (user: ClientUser, trial: TrialInfo) => void }
export const TrialExpiredScreen: React.FC<Props> = ({ user, trial, onLogout, onExtendSuccess }) => {
  const [plans, setPlans] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');
  const initialTrial = user.trialDurationDays === 7 && !user.customGrantedDays;
  const refreshAccess = async () => {
    setChecking(true);
    setMessage('');
    try {
      const session = await getAuthenticatedSession();
      if (!session || session.user.id !== user.id) {
        setMessage('No se pudo confirmar tu acceso. Volvé a iniciar sesión.');
        return;
      }
      onExtendSuccess(session.user, session.trial);
      if (session.trial.isExpired) setMessage('Tu renovación todavía no fue acreditada. Administración debe verificar el pago y habilitar el acceso.');
    } finally { setChecking(false); }
  };
  return <>
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-slate-950/95 text-white">
      <section aria-labelledby="expired-access-title" className="max-w-lg p-6 bg-slate-900 rounded-2xl border border-slate-700 space-y-4">
        <h2 id="expired-access-title" className="text-2xl font-bold">{initialTrial ? 'Tu período de prueba de 7 días terminó' : 'Tu suscripción venció'}</h2>
        <p>{user.name}, para seguir usando OPEN VOLEY debés abonar la suscripción mensual. Tus equipos, jugadores y partidos se conservan.</p>
        <p className="text-sm text-slate-300">Revisá el plan y el importe antes de pagar. Conservá el comprobante e indicá tu correo de cuenta: <strong>{user.email}</strong>.</p>
        <button onClick={() => setPlans(true)} className="block w-full bg-slate-800 p-3 rounded font-bold">Ver planes y precios</button>
        <a href={MERCADO_PAGO_PAYMENT_LINK} target="_blank" rel="noopener noreferrer" className="block text-center bg-sky-400 text-slate-950 p-3 rounded font-bold">Ir a Mercado Pago</a>
        <p className="text-sm text-slate-300">Administración verifica el pago y habilita 30 días de acceso. Abrir el enlace no activa la licencia ni configura un débito automático mensual desde OPEN VOLEY.</p>
        <button disabled={checking} onClick={() => void refreshAccess()} className="block w-full bg-amber-500 text-slate-950 p-3 rounded font-bold disabled:opacity-50">{checking ? 'Verificando acceso…' : 'Ya me habilitaron · Actualizar acceso'}</button>
        {message && <p role="status" className="text-sm text-amber-200">{message}</p>}
        <button onClick={onLogout} className="block p-3">Cerrar sesión</button>
      </section>
    </div>
    <SubscriptionPlansModal isOpen={plans} onClose={() => setPlans(false)} currentUser={user} trialInfo={trial} />
  </>;
};
