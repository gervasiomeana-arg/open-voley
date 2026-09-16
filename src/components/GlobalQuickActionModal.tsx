import React from 'react';
import { 
  X, 
  Volleyball, 
  Dumbbell, 
  UserPlus, 
  Shield, 
  Trophy, 
  Video,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface GlobalQuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (actionKey: 'match' | 'training' | 'player' | 'team' | 'competition' | 'video') => void;
}

export const GlobalQuickActionModal: React.FC<GlobalQuickActionModalProps> = ({
  isOpen,
  onClose,
  onAction,
}) => {
  if (!isOpen) return null;

  const actions = [
    {
      key: 'match' as const,
      title: 'Nuevo Partido',
      desc: 'Iniciar asistente guiado de 60s con rival, alineación y scouting.',
      icon: Volleyball,
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30 group-hover:bg-amber-500 group-hover:text-slate-950',
      badge: '60 Segundos',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      key: 'training' as const,
      title: 'Nuevo Entrenamiento',
      desc: 'Diseñar sesión táctica o generarla automáticamente con OPEN AI según déficit del último partido.',
      icon: Dumbbell,
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/30 group-hover:bg-purple-500 group-hover:text-white',
      badge: 'Con OPEN AI',
      badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    },
    {
      key: 'player' as const,
      title: 'Nuevo Jugador',
      desc: 'Registrar atleta al plantel con ficha biométrica, posición y seguimiento Player 360.',
      icon: UserPlus,
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30 group-hover:bg-blue-500 group-hover:text-white',
      badge: 'Player 360',
      badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    },
    {
      key: 'team' as const,
      title: 'Nuevo Equipo',
      desc: 'Crear equipo propio o rival en la biblioteca permanente para cargar en partidos.',
      icon: Shield,
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-white',
      badge: 'Biblioteca',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      key: 'competition' as const,
      title: 'Nueva Competición',
      desc: 'Crear torneo con wizard inteligente de 5 pasos y recomendación de formato según canchas.',
      icon: Trophy,
      color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 group-hover:bg-yellow-500 group-hover:text-slate-950',
      badge: 'Wizard IA',
      badgeColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
    },
    {
      key: 'video' as const,
      title: 'Subir Video',
      desc: 'Cargar partido o entrenamiento para sincronización de código y detección de rallies.',
      icon: Video,
      color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 group-hover:bg-cyan-500 group-hover:text-slate-950',
      badge: 'Video AI',
      badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
              +
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                ¿Qué deseas crear hoy?
              </h3>
              <p className="text-xs text-slate-400">
                Selecciona la acción para iniciar el asistente guiado correspondiente.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions Grid */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.key}
                onClick={() => {
                  onClose();
                  onAction(act.key);
                }}
                className="flex flex-col text-left p-3.5 rounded-2xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl border transition-all ${act.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${act.badgeColor}`}>
                    {act.badge}
                  </span>
                </div>
                <div className="font-bold text-white text-sm group-hover:text-amber-300 transition flex items-center justify-between">
                  <span>{act.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  {act.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px]">OPEN VOLEY guía cada paso automáticamente</span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white font-medium text-xs"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
