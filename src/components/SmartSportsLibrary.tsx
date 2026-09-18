import React, { useEffect, useMemo, useState } from 'react';
import { Film, Search, Scissors, Trash2, User, Volleyball, Send, MessageSquare } from 'lucide-react';
import { SmartSportsMontage, VolleySkill } from '../types';
import { deleteMontageLocallyFirst, syncSmartSportsMontages } from '../services/smartSportsMontageSync';

const SKILL_LABEL: Record<VolleySkill, string> = {
  S: 'Saque', R: 'Recepción', E: 'Armado', A: 'Ataque', B: 'Bloqueo', D: 'Defensa', F: 'Freeball',
};

interface Props {
  currentMatchId: string;
  onOpenMontage: (montage: SmartSportsMontage) => void;
}

export const SmartSportsLibrary: React.FC<Props> = ({ currentMatchId, onOpenMontage }) => {
  const [montages, setMontages] = useState<SmartSportsMontage[]>([]);
  const [query, setQuery] = useState('');
  const [skill, setSkill] = useState<'all' | VolleySkill>('all');

  useEffect(() => {
    let active = true;
    void syncSmartSportsMontages().then((items) => {
      if (active) setMontages(items);
    });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return montages.filter((montage) => {
      if (skill !== 'all' && !(montage.skills || []).includes(skill)) return false;
      if (!q) return true;
      const haystack = [
        montage.name,
        montage.matchTitle,
        ...(montage.playerNames || []),
        ...(montage.playerNums || []).map((num) => `#${num}`),
        ...(montage.skills || []).map((item) => SKILL_LABEL[item]),
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [montages, query, skill]);

  const remove = (id: string) => {
    setMontages(deleteMontageLocallyFirst(id));
  };

  return (
    <div className="space-y-3 sm:space-y-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5">
        <div className="flex items-start lg:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-violet-400 flex items-center gap-2">
              <Film className="w-4 h-4" /> Biblioteca deportiva
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white mt-1">Mis montajes</h2>
            <p className="hidden sm:block text-xs text-slate-400 mt-1">
              Montajes guardados y sincronizados con tu cuenta. Busca por nombre, partido, jugador o fundamento.
            </p>
          </div>
          <div className="text-xs text-slate-400 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            <strong className="text-white">{montages.length}</strong> montajes guardados
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-2 sm:gap-3 mt-3 sm:mt-5">
          <label className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar: Juan, #8, saque, rival..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white"
            />
          </label>
          <select
            value={skill}
            onChange={(event) => setSkill(event.target.value as 'all' | VolleySkill)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
          >
            <option value="all">Todos los fundamentos</option>
            {(Object.entries(SKILL_LABEL) as Array<[VolleySkill,string]>).map(([key,label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-dashed border-slate-700 rounded-2xl sm:rounded-3xl p-7 sm:p-10 text-center">
          <Scissors className="w-9 h-9 text-slate-600 mx-auto mb-3" />
          <div className="font-black text-white">No hay montajes para mostrar</div>
          <p className="text-xs text-slate-500 mt-1">Crea y guarda un montaje desde el Editor Deportivo Inteligente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map((montage) => (
            <article key={montage.id} className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">{montage.matchTitle}</div>
                  <h3 className="font-black text-white truncate mt-1">{montage.name}</h3>
                </div>
                <span className="shrink-0 text-[10px] font-mono bg-violet-500/10 text-violet-300 border border-violet-500/20 px-2 py-1 rounded-lg">
                  {montage.actionIds.length} clips
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mt-4 text-[11px]">
                {(montage.playerNames || []).slice(0,3).map((name) => (
                  <span key={name} className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 flex items-center gap-1">
                    <User className="w-3 h-3" /> {name}
                  </span>
                ))}
                {(montage.skills || []).map((item) => (
                  <span key={item} className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 flex items-center gap-1">
                    <Volleyball className="w-3 h-3" /> {SKILL_LABEL[item]}
                  </span>
                ))}
                {montage.recipientLabel && (
                  <span className="bg-violet-500/10 border border-violet-500/20 rounded-lg px-2 py-1 text-violet-300 flex items-center gap-1">
                    <Send className="w-3 h-3" /> {montage.recipientLabel}
                  </span>
                )}
              </div>

              {(montage.shareTitle || montage.coachNote) && (
                <div className="mt-4 rounded-2xl bg-slate-950 border border-slate-800 p-3">
                  {montage.shareTitle && <div className="text-xs font-black text-white">{montage.shareTitle}</div>}
                  {montage.coachNote && (
                    <div className="text-[11px] text-slate-400 mt-1 flex gap-1.5">
                      <MessageSquare className="w-3 h-3 shrink-0 mt-0.5" />
                      <span>{montage.coachNote}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-800">
                <div className="text-[10px] text-slate-500">
                  {new Date(montage.updatedAt).toLocaleDateString()} · {montage.preRoll}s antes / {montage.postRoll}s después
                </div>
                <div className="flex gap-2 self-end sm:self-auto">
                  <button type="button" onClick={() => remove(montage.id)} className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10" title="Eliminar montaje">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenMontage(montage)}
                    className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black flex items-center gap-1.5"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    {montage.matchId === currentMatchId ? 'Abrir editor' : 'Ver montaje'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
