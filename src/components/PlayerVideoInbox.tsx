import React, { useEffect, useState } from 'react';
import { Film, Inbox, MessageSquare, RefreshCw, Volleyball } from 'lucide-react';
import { SmartSportsMontage, VolleySkill } from '../types';

const SKILL_LABEL: Record<VolleySkill, string> = {
  S:'Saque', R:'Recepción', E:'Armado', A:'Ataque', B:'Bloqueo', D:'Defensa', F:'Freeball',
};

export const PlayerVideoInbox: React.FC = () => {
  const [montages, setMontages] = useState<SmartSportsMontage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/smart-sports-montages/inbox', {
        credentials:'same-origin',
        headers:{ Accept:'application/json' },
        cache:'no-store',
      });
      if (!response.ok) throw new Error('No se pudo cargar Mis Videos');
      const data = await response.json();
      setMontages(Array.isArray(data?.montages) ? data.montages : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar Mis Videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  return (
    <div className="space-y-5">
      <div className="bg-slate-900 border border-cyan-500/20 rounded-3xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-black text-cyan-300 flex items-center gap-2">
              <Inbox className="w-4 h-4" /> Portal del Jugador
            </div>
            <h1 className="text-2xl font-black text-white mt-1">Mis Videos</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Análisis y montajes que tu entrenador publicó específicamente para tu cuenta OPEN VOLEY.
            </p>
          </div>
          <button type="button" onClick={() => void load()} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white" title="Actualizar">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center text-sm text-slate-500">Cargando videos...</div>
      ) : error ? (
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">{error}</div>
      ) : montages.length === 0 ? (
        <div className="bg-slate-900 border border-dashed border-slate-700 rounded-3xl p-12 text-center">
          <Film className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <div className="font-black text-white">Todavía no tienes videos publicados</div>
          <p className="text-xs text-slate-500 mt-1">Cuando tu entrenador publique un montaje para tu cuenta aparecerá aquí.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {montages.map((montage) => (
            <article key={montage.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">{montage.matchTitle}</div>
              <h2 className="text-lg font-black text-white mt-1">{montage.shareTitle || montage.name}</h2>
              {montage.recipientLabel && <div className="text-xs text-cyan-300 mt-1">Para {montage.recipientLabel}</div>}

              <div className="flex flex-wrap gap-2 mt-4">
                {(montage.skills || []).map((skill) => (
                  <span key={skill} className="text-[11px] bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 flex items-center gap-1">
                    <Volleyball className="w-3 h-3" /> {SKILL_LABEL[skill]}
                  </span>
                ))}
                <span className="text-[11px] bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-2 py-1 text-cyan-300">
                  {montage.actionIds.length} clips
                </span>
              </div>

              {montage.coachNote && (
                <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                  <div className="text-[10px] uppercase tracking-wider font-black text-slate-500 flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3" /> Nota del entrenador
                  </div>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed">{montage.coachNote}</p>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500">
                Publicado {montage.publishedAt ? new Date(montage.publishedAt).toLocaleString() : ''}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
