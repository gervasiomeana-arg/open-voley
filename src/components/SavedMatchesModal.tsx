import React from 'react';
import { SavedMatchRecord, deleteSavedMatchRecord } from '../services/teamStorage';
import { 
  FolderKanban, 
  Play, 
  Trash2, 
  Calendar, 
  Trophy, 
  X, 
  Download, 
  FileText, 
  PlusCircle, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';
import { MatchData } from '../types';

interface SavedMatchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches?: SavedMatchRecord[];
  onMatchesUpdated?: (matches: SavedMatchRecord[]) => void;
  onLoadMatch: (record: SavedMatchRecord) => void;
  onOpenNewMatch?: () => void;
}

export const SavedMatchesModal: React.FC<SavedMatchesModalProps> = ({
  isOpen,
  onClose,
  matches = [],
  onMatchesUpdated,
  onLoadMatch,
  onOpenNewMatch,
}) => {
  if (!isOpen) return null;

  const safeMatches = matches || [];

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Estás seguro de eliminar este partido de tu historial?')) {
      const updated = deleteSavedMatchRecord(id);
      if (onMatchesUpdated) {
        onMatchesUpdated(updated);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Mis Partidos Guardados ({safeMatches.length})
              </h2>
              <p className="text-xs text-slate-400">
                Historial de encuentros scouteados. Cárgalos para continuar o exportar sus estadísticas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                if (onOpenNewMatch) onOpenNewMatch();
              }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Nuevo Partido</span>
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-3">
          {safeMatches.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3 border border-dashed border-slate-800 rounded-3xl bg-slate-950/40">
              <FolderKanban className="w-12 h-12 mx-auto opacity-30 text-amber-400" />
              <div className="space-y-1">
                <h4 className="text-white font-bold text-base">Aún no has guardado partidos</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Cuando termines de scoutear un partido, pulsa el botón <strong>"💾 Guardar Partido"</strong> en la barra superior para archivarlo aquí.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  if (onOpenNewMatch) onOpenNewMatch();
                }}
                className="bg-amber-500 text-slate-950 font-black text-xs px-4 py-2 rounded-xl"
              >
                + Iniciar un Partido Ahora
              </button>
            </div>
          ) : (
            safeMatches.map((record) => (
              <div
                key={record.id}
                onClick={() => {
                  onLoadMatch(record);
                  onClose();
                }}
                className="bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-amber-500/60 p-4 rounded-2xl flex items-center justify-between gap-4 transition cursor-pointer group"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-base group-hover:text-amber-400 transition truncate">
                      {record.homeTeamName} vs {record.awayTeamName}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded font-bold">
                      {record.finalScore}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" /> {record.competition}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" /> {record.date}
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {record.matchData.actions?.length || 0} jugadas
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      onLoadMatch(record);
                      onClose();
                    }}
                    className="bg-slate-800 hover:bg-amber-500 text-slate-200 hover:text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Cargar</span>
                  </button>
                  <button
                    onClick={(e) => handleDelete(record.id, e)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                    title="Eliminar partido"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>💡 Puedes cambiar entre partidos guardados en cualquier momento sin perder datos.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
