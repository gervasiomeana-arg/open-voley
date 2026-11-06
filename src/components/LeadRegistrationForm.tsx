import React, { useState, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
export const LeadRegistrationForm = ({ variant = 'default', locale = 'es' }: {
    variant?: 'default' | 'landing';
    locale?: 'es' | 'pt-BR';
}) => {
    const pt = locale === 'pt-BR';
    const tr = (es: string, br: string) => pt ? br : es;
    const [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
    const submitting = useRef(false);
    const submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (submitting.current) return;
        submitting.current = true;
        const form = e.currentTarget;
        const data = new FormData(form);
        setBusy(true);
        setMessage('');
        try {
            const response = await fetch('/api/commercial/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: data.get('name'), email: data.get('email'), club: data.get('club'), phone: data.get('phone'), consent: data.get('consent') === 'on' }) });
            const result = await response.json().catch(() => null);
            if (!result || typeof result !== 'object')
                throw new Error('No se pudo confirmar la solicitud. Reintentá en unos minutos.');
            if (!response.ok)
                throw new Error(typeof result.error === 'string' ? result.error : 'No se pudo guardar la solicitud. Reintentá.');
            if (result.success !== true)
                throw new Error('No se pudo confirmar la solicitud. Reintentá en unos minutos.');
            setMessage(tr("Tu solicitud quedó registrada. Gracias por tu interés.", "Sua solicitação foi registrada. Obrigado pelo interesse."));
            form.reset();
        }
        catch (error) {
            setMessage(error instanceof TypeError ? 'No se pudo conectar. Revisá tu conexión y reintentá.' : error instanceof Error ? error.message : 'No se pudo guardar. Reintentá.');
        }
        finally {
            submitting.current = false;
            setBusy(false);
        }
    };
    const inputClass = variant === 'default' ? 'block w-full bg-slate-800 rounded p-3' : undefined;
    const fields = <><label>{tr("Nombre", "Nome")}<input disabled={busy} className={inputClass} name="name" required maxLength={150} autoComplete="name"/></label><label>{tr("Correo", "E-mail")}<input disabled={busy} className={inputClass} name="email" type="email" required maxLength={320} autoComplete="email"/></label><label>{tr("Club o institución (opcional)", "Clube ou instituição (opcional)")}<input disabled={busy} className={inputClass} name="club" maxLength={150} autoComplete="organization"/></label><label>{tr("Teléfono (opcional)", "Telefone (opcional)")}<input disabled={busy} className={inputClass} name="phone" type="tel" maxLength={60} autoComplete="tel"/></label></>;
    if (variant === 'landing')
        return <section className="ov-lead-form" aria-labelledby="ov-lead-heading"><h3 id="ov-lead-heading">{tr("Solicitar una demo", "Solicitar uma demonstração")}</h3><form aria-busy={busy} onSubmit={submit}>{fields}<label className="ov-consent"><input disabled={busy} name="consent" type="checkbox" required/><span>{tr("Autorizo a OPEN VOLEY a guardar estos datos y contactarme por esta consulta. Puedo solicitar su eliminación.", "Autorizo a OPEN VOLEY a armazenar estes dados e entrar em contato sobre esta solicitação. Posso solicitar sua exclusão.")}</span></label><button disabled={busy} type="submit">{busy ? tr("Guardando solicitud…", "Enviando solicitação…") : tr("Enviar solicitud", "Enviar solicitação")}<ArrowUpRight size={17}/></button><p role="status" className="ov-lead-status">{message}</p></form></section>;
    return <section className="max-w-2xl mx-auto p-6 my-8 rounded-2xl bg-slate-900 text-white border border-slate-700"><h2 className="text-2xl font-bold">Quiero conocer OPEN VOLEY</h2><p className="text-slate-300 my-3">Dejanos tus datos para coordinar una demo o consultar por la app.</p><form aria-busy={busy} onSubmit={submit} className="grid gap-3 sm:grid-cols-2">{fields}<label className="sm:col-span-2 text-sm"><input disabled={busy} name="consent" type="checkbox" required className="mr-2"/>{tr("Autorizo a OPEN VOLEY a guardar estos datos y contactarme por esta consulta. Puedo solicitar su eliminación.", "Autorizo a OPEN VOLEY a armazenar estes dados e entrar em contato sobre esta solicitação. Posso solicitar sua exclusão.")}</label><button disabled={busy} className="bg-amber-500 text-slate-950 font-bold p-3 rounded sm:col-span-2">{busy ? 'Guardando…' : 'Registrar interés'}</button><p role="status" className="sm:col-span-2">{message}</p></form></section>;
};
