import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
export const LeadRegistrationForm = ({ variant = 'default' }: {
    variant?: 'default' | 'landing';
}) => {
    const [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
    const submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        setBusy(true);
        setMessage('');
        try {
            const response = await fetch('/api/commercial/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: data.get('name'), email: data.get('email'), club: data.get('club'), phone: data.get('phone'), consent: data.get('consent') === 'on' }) });
            const result = await response.json();
            if (!response.ok)
                throw new Error(result.error || 'No se pudo guardar la solicitud. Reintentá.');
            setMessage('Tu solicitud quedó registrada. Gracias por tu interés.');
            form.reset();
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : 'No se pudo guardar. Reintentá.');
        }
        finally {
            setBusy(false);
        }
    };
    const inputClass = variant === 'default' ? 'block w-full bg-slate-800 rounded p-3' : undefined;
    const fields = <><label>Nombre<input className={inputClass} name="name" required maxLength={150} autoComplete="name"/></label><label>Correo<input className={inputClass} name="email" type="email" required maxLength={320} autoComplete="email"/></label><label>Club o institución<input className={inputClass} name="club" maxLength={150} autoComplete="organization"/></label><label>Teléfono (opcional)<input className={inputClass} name="phone" type="tel" maxLength={60} autoComplete="tel"/></label></>;
    if (variant === 'landing')
        return <section className="ov-lead-form" aria-labelledby="ov-lead-heading"><h3 id="ov-lead-heading">Solicitar una demo</h3><form onSubmit={submit}>{fields}<label className="ov-consent"><input name="consent" type="checkbox" required/><span>Autorizo a OPEN VOLEY a guardar estos datos y contactarme por esta consulta. Puedo solicitar su eliminación.</span></label><button disabled={busy} type="submit">{busy ? 'Guardando solicitud…' : 'Enviar solicitud'}<ArrowUpRight size={17}/></button><p role="status" className="ov-lead-status">{message}</p></form></section>;
    return <section className="max-w-2xl mx-auto p-6 my-8 rounded-2xl bg-slate-900 text-white border border-slate-700"><h2 className="text-2xl font-bold">Quiero conocer OPEN VOLEY</h2><p className="text-slate-300 my-3">Dejanos tus datos para coordinar una demo o consultar por la app.</p><form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">{fields}<label className="sm:col-span-2 text-sm"><input name="consent" type="checkbox" required className="mr-2"/>Autorizo a OPEN VOLEY a guardar estos datos y contactarme por esta consulta. Puedo solicitar su eliminación.</label><button disabled={busy} className="bg-amber-500 text-slate-950 font-bold p-3 rounded sm:col-span-2">{busy ? 'Guardando…' : 'Registrar interés'}</button><p role="status" className="sm:col-span-2">{message}</p></form></section>;
};
