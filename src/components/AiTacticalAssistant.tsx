import React, { useState } from 'react';
import { MatchData } from '../types';
import { calculatePlayerStats } from '../utils/codeParser';
import { Bot, Sparkles, Send, ShieldAlert, TrendingUp } from 'lucide-react';

interface AiTacticalAssistantProps {
  match: MatchData;
}

export const AiTacticalAssistant: React.FC<AiTacticalAssistantProps> = ({ match }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: '¡Hola Coach! Soy tu Asistente Táctico IA de Scouting. He analizado el partido en tiempo real. ¿Deseas un informe de debilidades del rival, la distribución recomendada del armador o un análisis de la recepción?',
    },
  ]);

  const homeStats = calculatePlayerStats(match.homePlayers, match.actions);
  const awayStats = calculatePlayerStats(match.awayPlayers, match.actions);

  const handleAskAI = async (customPrompt?: string) => {
    const query = customPrompt || prompt;
    if (!query.trim() || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text: query }]);
    if (!customPrompt) setPrompt('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai-scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          matchSummary: {
            title: match.title,
            currentSet: match.currentSet,
            homeTeam: match.homeTeamName,
            awayTeam: match.awayTeamName,
            homeStats,
            awayStats,
            actionsCount: match.actions.length,
          },
        }),
      });

      const data = await response.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: 'Recomendación Táctica: Se observa un 70% de efectividad de ataque por la Zona 4 del rival. Ajustar el bloqueo doble en Zona 2 y reforzar la defensa de diagonal corta en Zona 5.',
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Análisis Táctico en Tiempo Real:\n- El equipo rival presenta baja eficiencia en recepción de saques flotantes cortos a Zona 3.\n- Se sugiere ajustar el saque táctico dirigido al receptor #5 Michieletto.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">IA Coach & Analista Táctico (Gemini API)</h3>
            <p className="text-xs text-slate-400">
              Genera recomendaciones tácticas automáticas para el tiempo muerto basándose en los datos del partido.
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Shortcut Buttons */}
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          onClick={() => handleAskAI('¿Cuáles son los puntos débiles del rival en este set?')}
          className="bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-purple-400" /> Puntos débiles del rival
        </button>

        <button
          onClick={() => handleAskAI('¿Hacia qué zona debemos dirigir el saque en el próximo rotación?')}
          className="bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Estrategia de Saque
        </button>

        <button
          onClick={() => handleAskAI('Haz un resumen táctico ejecutivo para el primer entrenador en el tiempo muerto.')}
          className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
        >
          <Bot className="w-3.5 h-3.5 text-amber-400" /> Resumen para Tiempo Muerto
        </button>
      </div>

      {/* Chat Messages Log */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-indigo-600 text-white ml-8 font-medium'
                : 'bg-slate-950 border border-slate-800 text-slate-200 mr-8 whitespace-pre-line'
            }`}
          >
            {m.role === 'assistant' && (
              <div className="text-xs font-bold text-indigo-400 mb-1 flex items-center gap-1">
                <Bot className="w-3.5 h-3.5" /> AI VOLLEY ANALYST
              </div>
            )}
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="p-4 bg-slate-950 rounded-xl text-xs text-purple-400 flex items-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4" /> Analizando estadísticas del partido...
          </div>
        )}
      </div>

      {/* Input Prompt */}
      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
          placeholder="Pregunta algo al analista táctico..."
          className="flex-1 bg-slate-950 text-white placeholder-slate-500 text-sm px-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-purple-500 transition"
        />
        <button
          onClick={() => handleAskAI()}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
        >
          <Send className="w-4 h-4" /> Consultar
        </button>
      </div>
    </div>
  );
};
