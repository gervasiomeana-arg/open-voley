import React from 'react';
import { 
  Home, 
  Users, 
  Trophy, 
  Volleyball, 
  TrendingUp, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  LogOut, 
  X,
  Plus,
  Search,
  Sliders,
  Settings,
  Inbox
} from 'lucide-react';
import { ClientUser, TrialInfo, UserRole } from '../types';

export type GlobalTab = 'home' | 'team' | 'competition' | 'match' | 'analysis' | 'ai' | 'my-videos' | 'settings';
export type TabType = GlobalTab;

interface SidebarProps {
  activeTab: GlobalTab;
  setActiveTab: (tab: GlobalTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  currentUser: ClientUser | null;
  trialInfo: TrialInfo | null;
  currentRole?: UserRole;
  onChangeRole?: (role: UserRole) => void;
  onLogout: () => void;
  onOpenQuickAction?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenPlans?: () => void;
  onOpenNewMatch?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  currentUser,
  trialInfo,
  currentRole = 'Entrenador',
  onLogout,
  onOpenQuickAction,
  onOpenCommandPalette,
  onOpenPlans,
  onOpenNewMatch,
}) => {
  const navItems = [
    {
      id: 'home' as GlobalTab,
      label: 'Inicio',
      icon: Home,
    },
    {
      id: 'team' as GlobalTab,
      label: 'Equipo',
      icon: Users,
    },
    {
      id: 'competition' as GlobalTab,
      label: 'Competición',
      icon: Trophy,
    },
    {
      id: 'match' as GlobalTab,
      label: 'Partido',
      icon: Volleyball,
    },
    {
      id: 'analysis' as GlobalTab,
      label: 'Análisis',
      icon: TrendingUp,
    },
    {
      id: 'ai' as GlobalTab,
      label: 'OPEN AI',
      icon: Sparkles,
      badge: 'IA',
    },
    {
      id: 'my-videos' as GlobalTab,
      label: 'Mis Videos',
      icon: Inbox,
    },
    {
      id: 'settings' as GlobalTab,
      label: 'Configuración',
      icon: Settings,
    },
  ];

  const handleSelectTab = (tab: GlobalTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 border-r border-slate-800 shadow-2xl transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0 w-72 max-w-[85vw]' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-60'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/90 bg-slate-900">
          <div 
            onClick={() => handleSelectTab('home')}
            className="flex items-center gap-3 cursor-pointer overflow-hidden group"
          >
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-xl shadow-md shadow-orange-500/20 text-slate-950 shrink-0 group-hover:scale-105 transition-transform">
              <Volleyball className="w-5 h-5" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col min-w-0">
                <span className="font-black text-sm tracking-tight text-white leading-none">
                  OPEN VOLEY
                </span>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mt-0.5">
                  HIGH PERFORMANCE
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition"
            title={isCollapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            aria-label="Cerrar menú"
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Quick Action "+ CREAR" Button */}
        <div className="px-3 pt-3">
          {(!isCollapsed || isMobileOpen) ? (
            <button
              onClick={() => {
                if (onOpenQuickAction) {
                  onOpenQuickAction();
                } else if (onOpenNewMatch) {
                  onOpenNewMatch();
                }
                setIsMobileOpen(false);
              }}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="tracking-wide uppercase text-[11px]">CREAR</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (onOpenQuickAction) {
                  onOpenQuickAction();
                } else if (onOpenNewMatch) {
                  onOpenNewMatch();
                }
              }}
              title="Crear (Partido, Entrenamiento, Jugador, Equipo, Competición, Video)"
              className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center justify-center transition shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
            </button>
          )}
        </div>

        {/* Quick Search Shortcut */}
        <div className="px-3 pt-2">
          {(!isCollapsed || isMobileOpen) ? (
            <button
              onClick={() => onOpenCommandPalette && onOpenCommandPalette()}
              className="w-full bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-xs transition"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px]">Buscar...</span>
              </div>
              <kbd className="text-[10px] bg-slate-900 border border-slate-700 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                ⌘K
              </kbd>
            </button>
          ) : (
            <button
              onClick={() => onOpenCommandPalette && onOpenCommandPalette()}
              title="Buscar (⌘K)"
              className="w-full h-8 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition border border-slate-700/60"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Items (The exact 6 requested sections) */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1.5 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isAiTab = item.id === 'ai';
            const isSettingsTab = item.id === 'settings';

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                title={isCollapsed && !isMobileOpen ? item.label : undefined}
                className={`w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? isAiTab
                      ? 'bg-purple-500 text-white font-black shadow-lg shadow-purple-500/25'
                      : isSettingsTab
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/25'
                        : 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                    : isSettingsTab
                      ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/15 bg-emerald-500/10 border border-emerald-500/30 shadow-sm shadow-emerald-900/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                } ${isCollapsed && !isMobileOpen ? 'justify-center px-2' : ''}`}
              >
                <div className={`p-1.5 rounded-xl transition-all shrink-0 ${
                  isActive
                    ? isAiTab
                      ? 'bg-purple-900/40 text-white'
                      : isSettingsTab
                        ? 'bg-emerald-950/20 text-slate-950'
                        : 'bg-black/10 text-slate-950'
                    : isAiTab
                      ? 'text-purple-400 group-hover:text-purple-300'
                      : isSettingsTab
                        ? 'text-emerald-400 group-hover:text-emerald-300 bg-emerald-500/20'
                        : 'text-slate-400 group-hover:text-amber-400'
                }`}>
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                </div>

                {(!isCollapsed || isMobileOpen) && (
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <span className="truncate tracking-wide text-xs">
                      {item.label}
                    </span>

                    {item.badge && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-black uppercase tracking-wider shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}

                {/* Collapsed active dot */}
                {isCollapsed && !isMobileOpen && isActive && (
                  <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-slate-900 ${
                    isAiTab
                      ? 'bg-purple-400 animate-pulse'
                      : isSettingsTab
                        ? 'bg-emerald-400 animate-pulse'
                        : 'bg-amber-400 animate-pulse'
                  }`} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Active Role Indicator in Sidebar */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="px-3 py-2 border-t border-slate-800/60 bg-slate-950/40">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-[10px] uppercase font-bold text-slate-500">Rol activo:</span>
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {currentRole}
              </span>
            </div>
          </div>
        )}

        {/* User Account & License Footer */}
        {currentUser && (
          <div className="p-3 bg-slate-950/80 border-t border-slate-800/80">
            {(!isCollapsed || isMobileOpen) ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {currentUser.picture ? (
                      <img
                        src={currentUser.picture}
                        alt={currentUser.name}
                        className="w-7 h-7 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs shrink-0">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                      {trialInfo && (
                        <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 truncate">
                          <Clock className="w-3 h-3" />
                          <span>{trialInfo.daysRemaining}d licencia</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={onLogout}
                    title="Cerrar sesión"
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition shrink-0"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                {currentUser.picture ? (
                  <img
                    src={currentUser.picture}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-xl object-cover border border-slate-700"
                    title={currentUser.name}
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs"
                    title={currentUser.name}
                  >
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={onLogout}
                  title="Cerrar sesión"
                  className="p-1 text-slate-400 hover:text-rose-400 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
};
