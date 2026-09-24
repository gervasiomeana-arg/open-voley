import React, { useState } from 'react';
import { MatchData, ClientUser, TrialInfo } from '../types';
import { generateDVWV2 } from './ExportImportModal';
import { 
  Settings, 
  Download, 
  Upload, 
  RotateCcw, 
  HelpCircle, 
  ShieldCheck, 
  CreditCard, 
  LogOut, 
  FileSearch, 
  Sliders, 
  Database, 
  User, 
  Check, 
  Copy, 
  AlertTriangle 
} from 'lucide-react';
import { ResearchTab } from './ResearchTab';

interface SettingsHubProps {
  match: MatchData;
  currentUser: ClientUser | null;
  trialInfo: TrialInfo | null;
  onLogout: () => void;
  onOpenPlans: () => void;
  onOpenHelp: () => void;
  onResetMatch: () => void;
  onOpenExportModal: () => void;
  isResearchUnlocked: boolean;
  onUnlockResearchSuccess: () => void;
}

export const SettingsHub: React.FC<SettingsHubProps> = ({
  match,
  currentUser,
  trialInfo,
  onLogout,
  onOpenPlans,
  onOpenHelp,
  onResetMatch,
  onOpenExportModal,
  isResearchUnlocked,
  onUnlockResearchSuccess,
}) => {
  const [activeSection, setActiveSection] = useState<'general' | 'export' | 'account' | 'research'>('general');
  const [copiedBackup, setCopiedBackup] = useState(false);

  // Download JSON Backup
  const handleDownloadBackup = () => {
    const backupData = {
      version: '2.4',
      date: new Date().toISOString(),
      match,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OPENVOLEY_${match.homeTeamName}_vs_${match.awayTeamName}_${match.date || 'backup'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(match, null, 2));
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  const handleDownloadDVWV2 = () => {
    const dvwContent = generateDVWV2(match);
    const blob = new Blob([dvwContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${match.homeTeamName}_vs_${match.awayTeamName}_v2.dvw`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Configuración de la Plataforma</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Preferencias de scouting, copias de seguridad, exportaciones .DVW, cuenta y planes
            </p>
          </div>
        </div>

        {/* Quick Nav Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveSection('general')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
              activeSection === 'general' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            General & Scouting
          </button>
          <button
            onClick={() => setActiveSection('export')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
              activeSection === 'export' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Exportaciones & Respaldo
          </button>
          <button
            onClick={() => setActiveSection('account')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
              activeSection === 'account' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cuenta & Licencia
          </button>
          <button
            onClick={() => setActiveSection('research')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
              activeSection === 'research' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Ventas & PRD
          </button>
        </div>
      </div>

      {/* SECTION: GENERAL & SCOUTING */}
      {activeSection === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              <span>Parámetros de Scouting & Consola</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Sintaxis Oficial Data Volley</div>
                  <div className="text-[11px] text-slate-400">
                    Soporte para códigos estándar (*01S#, a04A=, *07R+) y panel táctil
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 font-bold rounded-lg border border-emerald-500/30">
                  Activo
                </span>
              </div>

              <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Auto-Rotación en Punto Ganado</div>
                  <div className="text-[11px] text-slate-400">
                    Rotación horaria automática al recuperar el saque (Sideout)
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 font-bold rounded-lg border border-emerald-500/30">
                  Habilitado
                </span>
              </div>

              <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Consola de Comandos Rápida</div>
                  <div className="text-[11px] text-slate-400">
                    Entrada de texto por teclado físico con autocompletado inteligente
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 font-bold rounded-lg border border-emerald-500/30">
                  Habilitado
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenHelp}
                className="w-full bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-bold text-xs p-3 rounded-2xl flex items-center justify-center gap-2 border border-indigo-500/30 transition"
              >
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                <span>Ver Guía Rápida de Atajos de Teclado y Códigos</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-400" />
                <span>Mantenimiento & Datos de Muestra</span>
              </h3>

              <p className="text-xs text-slate-400">
                Si deseas reiniciar el partido actual para comenzar una sesión de prueba limpia con datos precargados oficiales de la FIVB, puedes hacerlo a continuación.
              </p>

              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Atención</span>
                </div>
                <p>
                  Al reiniciar el partido, las jugadas registradas volverán al set de datos de muestra original.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (confirm('¿Estás seguro de reiniciar el partido actual a los datos de muestra iniciales?')) {
                  onResetMatch();
                }
              }}
              className="w-full bg-slate-800 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 font-bold text-xs p-3 rounded-2xl flex items-center justify-center gap-2 border border-slate-700 hover:border-rose-500/50 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restablecer Partido a Datos de Muestra</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION: EXPORTACIONES & RESPALDO */}
      {activeSection === 'export' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-400" />
              <span>Exportar Archivo Oficial .DVW (Data Volley)</span>
            </h3>

            <p className="text-xs text-slate-400">
              Genera un archivo <code>.DVW</code> compatible con Data Volley 4, VolleyStation y Click&Scout para compartir con otros cuerpos técnicos o ligas oficiales.
            </p>

            <button
              onClick={onOpenExportModal}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs p-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Abrir Generador y Descargador .DVW</span>
            </button>

            <button
              onClick={handleDownloadDVWV2}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs p-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Descargar DVW v2</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              <span>Copia de Seguridad JSON Completa</span>
            </h3>

            <p className="text-xs text-slate-400">
              Descarga un archivo JSON estructurado con todos los datos del partido, listas de jugadores, rotaciones y acciones cronometradas.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownloadBackup}
                className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs p-3 rounded-2xl flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                <span>Descargar .JSON</span>
              </button>

              <button
                onClick={handleCopyJson}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs p-3 rounded-2xl flex items-center justify-center gap-2 border border-slate-700 transition"
              >
                {copiedBackup ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedBackup ? '¡Copiado!' : 'Copiar al Portapapeles'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: CUENTA & LICENCIA */}
      {activeSection === 'account' && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <User className="w-5 h-5 text-amber-400" />
            <span>Perfil de Usuario & Suscripción</span>
          </h3>

          {currentUser ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-800/60 rounded-2xl border border-slate-700">
                {currentUser.picture ? (
                  <img
                    src={currentUser.picture}
                    alt={currentUser.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-700"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="text-base font-black text-white">{currentUser.name}</div>
                  <div className="text-xs text-slate-400 font-mono">{currentUser.email}</div>
                  <div className="text-[11px] text-amber-400 font-bold mt-1">Director Técnico / Scout Autorizado</div>
                </div>
              </div>

              {trialInfo && (
                <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">Periodo de Prueba de 30 Días:</span>
                    <span className="font-bold text-emerald-400">{trialInfo.daysRemaining} días restantes</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${Math.max(5, (trialInfo.daysRemaining / 30) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={onOpenPlans}
                  className="flex-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs p-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Ver Planes Mercado Pago</span>
                </button>

                <button
                  onClick={onLogout}
                  className="bg-slate-800 hover:bg-rose-900/30 text-rose-400 font-bold text-xs px-4 py-3 rounded-2xl flex items-center justify-center gap-2 border border-slate-700 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              No hay sesión activa iniciada.
            </div>
          )}
        </div>
      )}

      {/* SECTION: VENTAS & PRD (RESEARCH TAB) */}
      {activeSection === 'research' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl">
          <ResearchTab
            isUnlocked={isResearchUnlocked}
            onUnlockSuccess={onUnlockResearchSuccess}
          />
        </div>
      )}

    </div>
  );
};
