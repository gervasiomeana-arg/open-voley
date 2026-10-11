import React,{useState} from 'react';
import {ClientUser,TrialInfo} from '../types';
import {SubscriptionPlansModal} from './SubscriptionPlansModal';
interface Props {user:ClientUser;trial:TrialInfo;onLogout:()=>void;onExtendSuccess:(user:ClientUser,trial:TrialInfo)=>void}
export const TrialExpiredScreen:React.FC<Props>=({user,trial,onLogout})=>{
 const [plans,setPlans]=useState(false);
 return <><div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 text-white"><section className="max-w-md p-6 bg-slate-900 rounded-2xl border border-slate-700 space-y-4"><h2 className="text-2xl font-bold">Tu licencia ha expirado</h2><p>{user.name}, elegí un plan para continuar. La renovación se acredita cuando el servidor verifica el pago.</p><button onClick={()=>setPlans(true)} className="bg-amber-500 text-slate-950 p-3 rounded font-bold">Ver planes y renovar</button><button onClick={onLogout} className="block p-3">Cerrar sesión</button></section></div><SubscriptionPlansModal isOpen={plans} onClose={()=>setPlans(false)} currentUser={user} trialInfo={trial}/></>;
};
