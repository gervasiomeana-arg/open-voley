import React, { useState } from 'react';
import { 
  HelpCircle, 
  X, 
  Users, 
  PlusCircle, 
  Video, 
  Printer, 
  Save, 
  Download, 
  Share2, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  RotateCcw,
  Sparkles,
  ClipboardPaste,
  Shield
} from 'lucide-react';

interface QuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTeamsManager: () => void;
  onOpenNewMatch: () => void;
  onGoToBoxScore: () => void;
  onSaveCurrentMatch: () => void;
}

export const QuickGuideModal: React.FC<QuickGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenTeamsManager,
  onOpenNewMatch,
  onGoToBoxScore,
  onSaveCurrentMatch,
}) => {
  const [activeTab, setActiveTab] = useState<'flow' | 'teams' | 'new_match' | 'video_scout' | 'save_print'>('flow');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                Guía de Ayuda: Equipos, Partidos & Planilla
              </h2>
              <p className="text-xs text-slate-400">
                Aprende cómo gestionar tus planteles, iniciar nuevos encuentros, cargar videos e imprimir estadísticas.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-2 bg-slate-950/50 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('flow')}
            className={`py-2 px-3.5 rounded-xl font-black text-xs whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'flow'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Flujo en 4 Pasos</span>
          </button>

          <button
            onClick={() => setActiveTab('teams')}
            className={`py-2 px-3.5 rounded-xl font-black text-xs whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'teams'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>1. Biblioteca de Equipos</span>
          </button>

          <button
            onClick={() => setActiveTab('new_match')}
            className={`py-2 px-3.5 rounded-xl font-black text-xs whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'new_match'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>2. Iniciar Nuevo Partido</span>
          </button>

          <button
            onClick={() => setActiveTab('video_scout')}
            className={`py-2 px-3.5 rounded-xl font-black text-xs whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'video_scout'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>3. Video y Estadísticas</span>
          </button>

          <button
            onClick={() => setActiveTab('save_print')}
            className={`py-2 px-3.5 rounded-xl font-black text-xs whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'save_print'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>4. Guardar, Imprimir & Siguiente</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
          
          {/* TAB: FLOW SUMMARY */}
          {activeTab === 'flow' && (
            <div className="space-y-6">
              <div className="text-sm text-slate-300 font-medium leading-relaxed">
                El sistema está organizado para que nunca tengas que reescribir jugadores ni perder datos de partidos anteriores. Este es el ciclo recomendado:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Step 1 */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-mono">1</div>
                    <span>Cargar tus Equipos en la Biblioteca</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-normal">
                    Entra en <strong>"Mis Equipos"</strong>. Crea tu club (ej. "Club Ciudad de Campana") y los rivales a los que te vas a enfrentar. Puedes escribir jugador por jugador o <strong>pegar la lista de WhatsApp o Excel</strong> en 1 segundo.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenTeamsManager();
                    }}
                    className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 mt-2"
                  >
                    <span>Ir a Biblioteca de Equipos</span> <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-mono">2</div>
                    <span>Crear un Partido Nuevo</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-normal">
                    Presiona el botón dorado <strong>"+ Nuevo Partido"</strong> en la barra superior. Selecciona a tu equipo como Local y al rival como Visitante, añade el link de video de YouTube o MP4 (o elígelo en vivo), y pulsa <strong>"¡Empezar Partido!"</strong>.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenNewMatch();
                    }}
                    className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 mt-2"
                  >
                    <span>Crear Nuevo Partido ahora</span> <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-mono">3</div>
                    <span>Scouting Táctico y Video HD</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-normal">
                    En la pestaña <strong>Scouting Táctico</strong> haz clic en la cancha o toca los botones de la consola táctil. Cada jugada computa puntos, rotaciones y estadísticas automáticamente sincronizadas con el video.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-mono">4</div>
                    <span>Guardar, Imprimir Planilla P2 & Siguiente</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-normal">
                    Pulsa <strong>"Guardar Partido"</strong> para archivarlo en tu historial. Pasa a <strong>"Planilla FIVB P2"</strong> para imprimir o descargar en PDF las estadísticas completas. Luego pulsa "+ Nuevo Partido" para el siguiente rival.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onGoToBoxScore();
                    }}
                    className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 mt-2"
                  >
                    <span>Ver Planilla P2</span> <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB: TEAMS LIBRARY */}
          {activeTab === 'teams' && (
            <div className="space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                Cómo administrar y guardar tus equipos y rivales
              </h3>
              
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>1. Abre "Mis Equipos":</strong> Haz clic en el botón <strong>"👥 Mis Equipos"</strong> en la cabecera superior.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>2. Pestaña "Mis Equipos Propios":</strong> Aquí guardas los planteles de tu club o categorías (ej. Sub 18, Primera División, Sub 16).
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>3. Pestaña "Rivales Guardados":</strong> Guarda los equipos contrincantes con sus dorsales y posiciones para tenerlos listos en cada fecha.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>4. Carga Rápida ("Pegar Lista"):</strong> Si el entrenador o capitán te pasa la lista por WhatsApp, no tienes que tipear uno por uno. Haz clic en <strong>"Pegar Lista"</strong> y pega el texto directo. El sistema detecta los números y nombres al instante.
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    onClose();
                    onOpenTeamsManager();
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition"
                >
                  <Users className="w-4 h-4" />
                  <span>Abrir Biblioteca de Equipos Ahora</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: NEW MATCH */}
          {activeTab === 'new_match' && (
            <div className="space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                Cómo iniciar un nuevo partido en 3 clics
              </h3>

              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">1</div>
                  <div>
                    <strong>Paso 1 - Selección de Equipos:</strong> Elige tu equipo local de la lista desplegable y el equipo rival. Selecciona el nombre del torneo y la fecha.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">2</div>
                  <div>
                    <strong>Paso 2 - Video (Opcional):</strong> Si tienes el partido subido a YouTube, pega el link. Si lo tienes en tu computadora o teléfono, sube el archivo .MP4. Si estás en la cancha scouteando en vivo, elige "Sin video".
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">3</div>
                  <div>
                    <strong>Paso 3 - Formación Inicial:</strong> Revisa quiénes arrancan de titulares en la rotación (P1 a P6). El sistema los preselecciona según los titulares de tu equipo.
                  </div>
                </div>

                <div className="flex items-start gap-2 text-emerald-400 font-bold pt-1">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Al hacer clic en "¡Empezar Partido!", el marcador arranca limpio en 0-0, Set 1, sin sobreescribir tus equipos guardados.</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    onClose();
                    onOpenNewMatch();
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Crear Nuevo Partido Ahora</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: VIDEO AND STATS */}
          {activeTab === 'video_scout' && (
            <div className="space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-amber-400" />
                Cargar videos y sincronizar jugadas
              </h3>

              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-3">
                <p>
                  Puedes vincular el video en cualquier momento:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="font-bold text-amber-400">📹 YouTube o MP4 Local</div>
                    <p className="text-[11px] text-slate-400">
                      En la pestaña <strong>"Sincronización Video HD"</strong> puedes cambiar el video, saltar automáticamente a cada remate o bloqueo haciendo clic sobre la jugada en la lista.
                    </p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="font-bold text-purple-400">🤖 IA Coach & Visión</div>
                    <p className="text-[11px] text-slate-400">
                      En la pestaña <strong>"IA Coach"</strong> la inteligencia artificial analiza la distribución de las armadoras, zonas calientes de ataque y telemetría de jugadas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SAVE, PRINT & NEXT */}
          {activeTab === 'save_print' && (
            <div className="space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                Guardar, Imprimir Planilla P2 y Continuar con el Siguiente Partido
              </h3>

              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-3">
                <div className="flex items-start gap-2">
                  <Save className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Guardar Partido en Historial:</strong> Haz clic en <strong>"💾 Guardar Partido"</strong> en la barra superior. Se almacena con fecha, resultado y todas las jugadas registradas.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Printer className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Imprimir Planilla Oficial FIVB P2:</strong> En la pestaña <strong>"Planilla FIVB P2"</strong> presiona el botón <strong>"🖨️ Imprimir / PDF"</strong> para obtener el informe técnico con porcentajes de saque, recepción y ataque listo para entregar al cuerpo técnico.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Download className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Exportar .DVW (DataVolley):</strong> Presiona <strong>"Exportar .DVW"</strong> para descargar el archivo compatible con DataVolley y compartir con otros analistas.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Iniciar Siguiente Partido:</strong> Una vez guardado e impreso, simplemente pulsa <strong>"+ Nuevo Partido"</strong> para seleccionar al próximo rival y comenzar el siguiente encuentro desde cero.
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => {
                    onSaveCurrentMatch();
                    alert('¡Partido guardado con éxito en tu historial!');
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 flex items-center gap-2 transition"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>Guardar Partido Actual</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onGoToBoxScore();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Ver Planilla P2 para Imprimir</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>💡 Puedes volver a abrir esta guía en cualquier momento pulsando el botón <strong>"❓ Ayuda"</strong>.</span>
          <button
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-2 rounded-xl transition cursor-pointer"
          >
            Entendido / Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
