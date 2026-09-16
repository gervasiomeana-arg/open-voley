import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  ShieldCheck, 
  Clock, 
  CreditCard, 
  Download, 
  RotateCcw, 
  HelpCircle, 
  LogOut, 
  ChevronDown, 
  Check, 
  Sparkles,
  Sliders
} from 'lucide-react';
import { ClientUser, TrialInfo, UserRole } from '../types';

interface UserProfileMenuProps {
  currentUser: ClientUser | null;
  trialInfo: TrialInfo | null;
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  onOpenPlans: () => void;
  onOpenExport: () => void;
  onResetMatch: () => void;
  onOpenHelp: () => void;
  onLogout: () => void;
}

export const ALL_ROLES: { role: UserRole; label: string; desc: string }[] = [
  { role: 'Entrenador', label: 'Entrenador Principal', desc: 'Dirección táctica, alineaciones, entrenamientos y scouting.' },
  { role: 'Jugador', label: 'Jugador / Atleta', desc: 'Estadísticas individuales, Player 360, video clips personales y recomendaciones.' },
  { role: 'Analista', label: 'Analista / Scout', desc: 'Scouting código FIVB, corte de video, filtros avanzados y exportación DVW.' },
  { role: 'Organizador', label: 'Organizador de Torneo', desc: 'Gestión de competición, fixture, resultados, canchas y tablas.' },
  { role: 'Club', label: 'Directivo de Club', desc: 'Visión general de planteles, staff, resultados y licencias de la institución.' },
  { role: 'Asistente', label: 'Entrenador Asistente', desc: 'Apoyo en banca, toma de datos en vivo y control de rotaciones.' },
  { role: 'Administrador', label: 'Administrador Total', desc: 'Acceso irrestricto a todas las funciones y ajustes del sistema.' }
];

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  currentUser,
  trialInfo,
  currentRole,
  onChangeRole,
  onOpenPlans,
  onOpenExport,
  onResetMatch,
  onOpenHelp,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition group"
        title="Perfil y Configuración"
      >
        {currentUser?.picture ? (
          <img
            src={currentUser.picture}
            alt={currentUser.name}
            className="w-7 h-7 rounded-xl object-cover border border-slate-600 shrink-0"
          />
        ) : (
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0 shadow-sm">
            {currentUser ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </div>
        )}

        <div className="hidden md:flex flex-col text-left min-w-0">
          <span className="text-xs font-bold text-white truncate max-w-[110px]">
            {currentUser?.name || 'Usuario'}
          </span>
          <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            {currentRole}
          </span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : ''}`} />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl py-2 z-50 text-xs animate-fadeIn">
          {/* User Header */}
          <div className="px-4 py-2.5 border-b border-slate-800">
            <div className="font-bold text-white text-sm truncate">
              {currentUser?.name || 'Usuario OPEN VOLEY'}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {currentUser?.email || 'Sin correo asociado'}
            </div>
            {trialInfo && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-[10px]">
                <Clock className="w-3 h-3" />
                <span>Licencia activa: {trialInfo.daysRemaining} días restantes</span>
              </div>
            )}
          </div>

          {/* Role Switcher Section */}
          <div className="px-3 py-2 border-b border-slate-800">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 px-1">
              <span>Vista de Rol Activo</span>
              <span className="text-amber-400 font-bold">Personalizada</span>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold text-white text-xs">{currentRole}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isRoleDropdownOpen && (
                <div className="mt-1.5 space-y-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 max-h-48 overflow-y-auto custom-scrollbar">
                  {ALL_ROLES.map((r) => {
                    const isSelected = r.role === currentRole;
                    return (
                      <button
                        key={r.role}
                        onClick={() => {
                          onChangeRole(r.role);
                          setIsRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg transition flex items-start justify-between ${
                          isSelected ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold' : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            {r.label}
                            {isSelected && <Check className="w-3 h-3 text-amber-400" />}
                          </div>
                          <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                            {r.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="py-1 px-1.5 space-y-0.5">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenPlans();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition text-left"
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Planes y Licencias</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenExport();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition text-left"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Exportar / Importar DVW</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenHelp();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition text-left"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Guía Rápida de Códigos FIVB</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onResetMatch();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-amber-300 hover:bg-slate-800 transition text-left"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Reiniciar partido a demo FIVB</span>
            </button>
          </div>

          {/* Logout */}
          <div className="pt-1 mt-1 border-t border-slate-800 px-1.5">
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition text-left font-bold"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
