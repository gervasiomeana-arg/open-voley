import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Mail, 
  Send, 
  Sparkles, 
  FileText, 
  Share2, 
  Laptop, 
  Bot, 
  Video, 
  BarChart2, 
  FileCode, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  Edit3,
  RotateCcw,
  Sliders,
  MessageSquare
} from 'lucide-react';

export const SalesProposalsSection: React.FC = () => {
  const publishedAppUrl = 'https://ais-pre-kt6hfic6tuulm5htjtwofg-84460130822.us-east5.run.app';

  // Templates
  const templateFormal = `Estimado/a Cuerpo Técnico y Comisión Directiva,

Me pongo en contacto para presentarles OPEN VOLEY, la nueva plataforma integral de Scouting Profesional, Análisis Táctico FIVB y Asistencia con Inteligencia Artificial diseñada específicamente para cuerpos técnicos de vóley de alto rendimiento y clubes en desarrollo.

A diferencia de los softwares tradicionales que requieren costosas llaves físicas (dongles USB), instalaciones complejas y curvas de aprendizaje lentas, OPEN VOLEY funciona de forma 100% web en cualquier computadora, tablet o iPad, integrando todas las herramientas en una sola plataforma:

🏐 SERVICIOS Y CAPACIDADES DE OPEN VOLEY:
1. Scouting FIVB Oficial en Vivo y Diferido: Código estándar internacional de registro de fundamentos (saque, recepción, colocación, ataque por zonas, bloqueo y defensa).
2. Planilla BoxScore FIVB en Tiempo Real: Estadísticas automáticas homologadas con porcentajes de eficiencia (+ / # / ! / - / =), puntos por rotación y desglose individual por set.
3. Sincronización de Video y Montajes Automáticos: Vinculación instantánea del video del partido con filtros por jugador o acción para crear clips tácticos para las charlas de equipo.
4. Asistente Táctico con Inteligencia Artificial (VolleyStation Next AI): Detección automática de patrones del rival, predicción de distribución de armado y recomendaciones estratégicas en tiempo real.
5. Compatibilidad Universal DVW (Data Volley): Importa y exporta archivos .dvw sin pérdida de información para intercambiar con cualquier liga nacional o internacional.

⚡ VENTAJAS COMPARATIVAS FRENTE A OTRAS APPS DEL MERCADO:
• Acceso Multi-dispositivo en la Nube: Olvídese de perder licencias por rotura de laptop o transferencias engorrosas de dongles. Ingrese desde cualquier navegador.
• Inteligencia Artificial Real: Mientras los programas tradicionales solo muestran tablas estáticas, OPEN VOLEY analiza el juego y genera diagnósticos tácticos predictivos.
• Interfaz Moderna e Intuitiva: Diseñada para que cualquier entrenador o asistente comience a scoutear y generar informes desde el primer día.
• Colaboración en Tiempo Real: Comparta reportes y montajes de video con jugadores y staff al instante.

🎁 ACCESO DE PRUEBA GRATUITA POR 30 DÍAS (FULL ACCESS):
Para que puedan experimentar el impacto de OPEN VOLEY en sus entrenamientos y partidos, hemos habilitado un período de prueba gratuita de 30 días con todas las funciones desbloqueadas.

Pueden ingresar directamente desde el siguiente enlace con su cuenta de Google:
👉 ${publishedAppUrl}

Quedo a su entera disposición para coordinar una breve demostración o resolver cualquier inquietud sobre la plataforma.

Saludos cordiales,

[Tu Nombre / Cargo]
[Club / Institución]
[Teléfono de Contacto]`;

  const templateShort = `Hola [Nombre del Entrenador/a],

Te escribo para compartirte OPEN VOLEY, la nueva plataforma de scouting y análisis táctico de voleibol con Inteligencia Artificial que simplifica todo el trabajo de scouting y videoanálisis.

¿Por qué es superior a lo que venimos usando?
✅ 100% en la Nube (PC, Mac, iPad o Tablet) sin necesidad de llaves USB ni instalaciones.
✅ Scouting FIVB en vivo + BoxScore automático homologado.
✅ Video sincronizado con cortes tácticos inmediatos.
✅ IA Táctica integrada: detecta tendencias de distribución del rival y sugiere ajustes defensivos.
✅ Compatible con archivos .dvw de Data Volley.

Te dejo el link para que actives tus 30 DÍAS DE PRUEBA GRATUITA (acceso completo con tu cuenta Google):
👉 ${publishedAppUrl}

¡Probalo en tu próximo partido o entrenamiento y contame qué te parece!

Abrazo grande,
[Tu Nombre]`;

  const templateExecutive = `RESUMEN EJECUTIVO: OPEN VOLEY - PLATAFORMA DE SCOUTING & ANÁLISIS FIVB

1. PROPÓSITO:
Revolucionar la captura de datos y el análisis táctico en el voleibol mediante una solución cloud moderna con Inteligencia Artificial que reemplaza la complejidad y limitaciones del software tradicional.

2. MÓDULOS INCLUIDOS:
• Módulo de Scouting Táctico FIVB en vivo y diferido.
• Generador Oficial de BoxScore y Estadísticas Avanzadas por Rotación.
• Reproductor de Video Sincronizado y Editor de Montajes de Jugadas.
• Motor de IA Táctica (VolleyStation Next AI) para predicción de armado y patrones.
• Importador/Exportador universal de archivos .dvw (Data Volley).

3. COMPARATIVA TECNOLÓGICA:
• OPEN VOLEY: Multi-plataforma Web, IA predictiva, Video Cloud, Sin dongles, Interfaz ágil.
• Software Tradicional: Monoplataforma Windows, Sin IA, Dependiente de USB física, Curva empinada.

4. PERÍODO DE EVALUACIÓN:
Acceso ilimitado durante 30 días a todas las funciones sin compromiso:
Enlace de prueba: ${publishedAppUrl}`;

  // States
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<'formal' | 'short' | 'executive'>('formal');
  const [editableText, setEditableText] = useState(templateFormal);
  const [copied, setCopied] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subjectInput, setSubjectInput] = useState('OPEN VOLEY - Plataforma Profesional de Scouting FIVB e Inteligencia Artificial (Prueba 30 Días)');

  const handleSelectTemplate = (key: 'formal' | 'short' | 'executive') => {
    setSelectedTemplateKey(key);
    if (key === 'formal') {
      setEditableText(templateFormal);
      setSubjectInput('OPEN VOLEY - Plataforma Profesional de Scouting FIVB e Inteligencia Artificial (Prueba 30 Días)');
    } else if (key === 'short') {
      setEditableText(templateShort);
      setSubjectInput('Prueba gratis por 30 días OPEN VOLEY - Scouting con Inteligencia Artificial');
    } else {
      setEditableText(templateExecutive);
      setSubjectInput('Resumen Ejecutivo OPEN VOLEY - Scouting & Análisis Táctico');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editableText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenMailClient = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subjectInput)}&body=${encodeURIComponent(editableText)}`;
    window.open(mailtoUrl, '_blank');
  };

  const handleResetTemplate = () => {
    handleSelectTemplate(selectedTemplateKey);
  };

  return (
    <div className="space-y-6 text-slate-800 animate-fadeIn">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-amber-500/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs tracking-wider uppercase mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Material Comercial y Propuesta de Venta</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Propuestas Comerciales para Clubes y Entrenadores
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 mt-1.5 max-w-2xl leading-relaxed">
              Textos persuasivos listos para enviar por correo electrónico o WhatsApp, destacando todos los servicios de <strong>OPEN VOLEY</strong>, sus ventajas frente a la competencia y el enlace de acceso con <strong>30 días de prueba gratuita</strong>.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3.5 rounded-2xl text-xs space-y-1 text-center shrink-0">
            <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider block">Link de Prueba Configurado:</span>
            <div className="font-mono text-white bg-slate-950/60 px-2.5 py-1 rounded-lg text-[11px] border border-white/10 flex items-center gap-1.5">
              <span className="truncate max-w-[200px]">{publishedAppUrl}</span>
              <a href={publishedAppUrl} target="_blank" rel="noreferrer" title="Abrir en pestaña nueva">
                <ExternalLink className="w-3.5 h-3.5 text-amber-400 hover:text-amber-300" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Scouting FIVB & BoxScore</div>
            <div className="text-[11px] text-slate-500">Planillas oficiales en vivo</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 text-purple-600 rounded-xl">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">IA Táctica Predictiva</div>
            <div className="text-[11px] text-slate-500">Detección de patrones rivales</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Video Sincronizado</div>
            <div className="text-[11px] text-slate-500">Montajes y cortes de jugadas</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Prueba de 30 Días</div>
            <div className="text-[11px] text-slate-500">Sin costo ni tarjeta</div>
          </div>
        </div>
      </div>

      {/* Main Workspace Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-5">
        {/* Template Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5" /> Formato:
            </span>
            <button
              onClick={() => handleSelectTemplate('formal')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                selectedTemplateKey === 'formal'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Carta Completa (Clubes y Federaciones)</span>
            </button>
            <button
              onClick={() => handleSelectTemplate('short')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                selectedTemplateKey === 'short'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Mensaje Directo (WhatsApp / Entrenador)</span>
            </button>
            <button
              onClick={() => handleSelectTemplate('executive')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                selectedTemplateKey === 'executive'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Resumen Ejecutivo & Comparativa</span>
            </button>
          </div>

          <button
            onClick={handleResetTemplate}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
            title="Restablecer plantilla original"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restaurar texto
          </button>
        </div>

        {/* Quick Send Controls (Optional Recipient & Subject) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Destinatario (Opcional para abrir cliente de correo):
            </label>
            <input
              type="email"
              placeholder="entrenador@club.com, federacion@voley.org"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-inner"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Asunto del Correo:
            </label>
            <input
              type="text"
              value={subjectInput}
              onChange={(e) => setSubjectInput(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-inner"
            />
          </div>
        </div>

        {/* Editable Proposal Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
              Puedes editar o personalizar el texto antes de copiarlo o enviarlo:
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {editableText.length} caracteres
            </span>
          </div>

          <textarea
            value={editableText}
            onChange={(e) => setEditableText(e.target.value)}
            rows={18}
            className="w-full bg-slate-900 text-slate-100 font-mono text-xs sm:text-[13px] leading-relaxed p-4 sm:p-5 rounded-2xl border border-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-inner resize-y transition"
          />
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Link de 30 días incluido automáticamente en el cuerpo del texto.</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>¡Copiado al Portapapeles!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-400" />
                  <span>Copiar Nota de Venta</span>
                </>
              )}
            </button>

            {/* Direct Mail Client Button */}
            <button
              onClick={handleOpenMailClient}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Abrir en mi Correo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comparative Advantages Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          Cuadro Resumen de Ventajas Comparativas (Para Argumentación)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="p-3">Característica / Servicio</th>
                <th className="p-3 bg-amber-50 text-amber-900">OPEN VOLEY</th>
                <th className="p-3 text-slate-500">Data Volley 4</th>
                <th className="p-3 text-slate-500">Otras Apps Básicas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="p-3 font-semibold text-slate-900">Instalación y Dispositivos</td>
                <td className="p-3 bg-amber-50/50 font-bold text-emerald-700">100% Web (PC, Mac, iPad, Android)</td>
                <td className="p-3 text-slate-500">Solo Windows + Dongle USB</td>
                <td className="p-3 text-slate-500">Solo Tablets fijas</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900">Inteligencia Artificial Táctica</td>
                <td className="p-3 bg-amber-50/50 font-bold text-emerald-700">Integrada (Patrones & Predicción)</td>
                <td className="p-3 text-slate-500">No posee IA (Manual)</td>
                <td className="p-3 text-slate-500">No posee</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900">Sincronización de Video</td>
                <td className="p-3 bg-amber-50/50 font-bold text-emerald-700">Automática con cortes en nube</td>
                <td className="p-3 text-slate-500">Compleja (requiere módulos extra)</td>
                <td className="p-3 text-slate-500">Muy básica / Inexistente</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900">Compatibilidad de Archivos</td>
                <td className="p-3 bg-amber-50/50 font-bold text-emerald-700">Importación y Exportación .DVW total</td>
                <td className="p-3 text-slate-500">Propietario .DVW</td>
                <td className="p-3 text-slate-500">No compatible</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900">Curva de Aprendizaje</td>
                <td className="p-3 bg-amber-50/50 font-bold text-emerald-700">Inmediata e intuitiva</td>
                <td className="p-3 text-slate-500">Meses de capacitación técnica</td>
                <td className="p-3 text-slate-500">Baja pero limitada</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900">Prueba Gratuita</td>
                <td className="p-3 bg-amber-50/50 font-bold text-emerald-700">30 Días Full Access con Google</td>
                <td className="p-3 text-slate-500">Sin demo completa</td>
                <td className="p-3 text-slate-500">Versión recortada</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
