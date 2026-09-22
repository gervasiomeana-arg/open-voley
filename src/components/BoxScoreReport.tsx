import React, { useState } from 'react';
import { MatchData, TeamSide } from '../types';
import { calculatePlayerStats } from '../utils/codeParser';
import { 
  Award, 
  FileText, 
  Download, 
  Printer, 
  ArrowLeft, 
  SlidersHorizontal, 
  Check, 
  Info,
  ChevronDown
} from 'lucide-react';

interface BoxScoreReportProps {
  match: MatchData;
  onOpenNewMatch?: () => void;
  onBackToMatchCenter?: () => void;
}

export const BoxScoreReport: React.FC<BoxScoreReportProps> = ({ 
  match, 
  onOpenNewMatch,
  onBackToMatchCenter 
}) => {
  const [selectedTeamTab, setSelectedTeamTab] = useState<TeamSide>('home');

  // Column visibility state (Persisted in localStorage)
  const [columnsConfig, setColumnsConfig] = useState<{
    serve: boolean;
    reception: boolean;
    attack: boolean;
    block: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem('openvoley_boxscore_cols');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return { serve: true, reception: true, attack: true, block: true };
  });

  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const toggleColumnGroup = (group: keyof typeof columnsConfig) => {
    const updated = { ...columnsConfig, [group]: !columnsConfig[group] };
    // Ensure at least one section remains visible
    if (!updated.serve && !updated.reception && !updated.attack && !updated.block) {
      return;
    }
    setColumnsConfig(updated);
    try {
      localStorage.setItem('openvoley_boxscore_cols', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const applyPreset = (preset: 'all' | 'essential' | 'attack_block' | 'serve_pass') => {
    let updated = { serve: true, reception: true, attack: true, block: true };
    if (preset === 'essential') {
      updated = { serve: true, reception: true, attack: true, block: true };
    } else if (preset === 'attack_block') {
      updated = { serve: false, reception: false, attack: true, block: true };
    } else if (preset === 'serve_pass') {
      updated = { serve: true, reception: true, attack: false, block: false };
    }
    setColumnsConfig(updated);
    try {
      localStorage.setItem('openvoley_boxscore_cols', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const homeStats = calculatePlayerStats(match.homePlayers, match.actions);
  const awayStats = calculatePlayerStats(match.awayPlayers, match.actions);

  const activeStats = selectedTeamTab === 'home' ? homeStats : awayStats;
  const teamName = selectedTeamTab === 'home' ? match.homeTeamName : match.awayTeamName;

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Export to CSV (preserves all data regardless of visual column toggles)
  const handleExportCSV = () => {
    const headers = [
      'Numero',
      'Nombre',
      'Posicion',
      'Saque Tot',
      'Saque Aces',
      'Saque Err',
      'Rec Tot',
      'Rec Pos %',
      'Rec Perf %',
      'Ataque Tot',
      'Ataque Pts',
      'Ataque Err',
      'Ataque Bloqueado',
      'Ataque Eficiencia %',
      'Bloqueos Pts',
    ];

    const rows = activeStats.map((s) => [
      s.playerNum,
      `"${s.name}"`,
      s.position,
      s.serveTotal,
      s.serveAce,
      s.serveErr,
      s.recTotal,
      `${s.recPosPct}%`,
      `${s.recPerfPct}%`,
      s.attTotal,
      s.attPts,
      s.attErr,
      s.attBlocked,
      `${s.attEffPct}%`,
      s.blockPts,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FIVB_BoxScore_${selectedTeamTab}_${match.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-slate-900 font-black text-lg">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>Planilla Estadística del Partido</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Rendimiento por jugador computado en tiempo real desde la consola de scouting.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onBackToMatchCenter && (
            <button
              onClick={onBackToMatchCenter}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 transition print:hidden cursor-pointer"
              title="Volver al Centro del Partido"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-600" />
              <span>← Centro</span>
            </button>
          )}

          {/* Team Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setSelectedTeamTab('home')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                selectedTeamTab === 'home'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {match.homeTeamName}
            </button>
            <button
              onClick={() => setSelectedTeamTab('away')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                selectedTeamTab === 'away'
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {match.awayTeamName}
            </button>
          </div>

          {/* Column Selector Dropdown */}
          <div className="relative print:hidden">
            <button
              onClick={() => setShowColumnMenu((prev) => !prev)}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 transition cursor-pointer"
              title="Seleccionar qué columnas mostrar"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Columnas</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showColumnMenu && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 text-xs text-slate-700 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Grupos de Fundamentos
                </div>
                {[
                  { key: 'serve' as const, label: 'Saque (Tot, Ace, Err)' },
                  { key: 'reception' as const, label: 'Recepción (Tot, Pos %, Perf %)' },
                  { key: 'attack' as const, label: 'Ataque (Tot, Pts, Err, Blq, Efic %)' },
                  { key: 'block' as const, label: 'Bloqueo (Pts)' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => toggleColumnGroup(key)}
                    className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-slate-100 rounded-lg text-left cursor-pointer"
                  >
                    <span>{label}</span>
                    {columnsConfig[key] && <Check className="w-3.5 h-3.5 text-indigo-600 font-bold" />}
                  </button>
                ))}

                <div className="border-t border-slate-100 pt-1 mt-1 flex items-center justify-between px-1">
                  <button
                    onClick={() => applyPreset('all')}
                    className="text-[10px] font-bold text-indigo-600 hover:underline p-1 cursor-pointer"
                  >
                    Ver Todas
                  </button>
                  <button
                    onClick={() => setShowColumnMenu(false)}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black px-3.5 py-1.5 rounded-xl transition shadow-xs cursor-pointer print:hidden"
            title="Imprimir planilla oficial o guardar como PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>[ IMPRIMIR / PDF ]</span>
          </button>

          {/* Secondary Action */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 transition cursor-pointer print:hidden"
            title="Descargar archivo en formato CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Match Details Banner (visible in print too) */}
      <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-black text-slate-800 text-sm">{match.homeTeamName} vs {match.awayTeamName}</span>
          <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-[11px] border border-indigo-100">{match.competition}</span>
          <span className="text-slate-500">{match.date}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-500 text-[11px]">Total Acciones: <strong className="text-slate-700">{match.actions.length}</strong></span>
        </div>
      </div>

      {/* Stats Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            {/* Super Header */}
            <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
              <th colSpan={3} className="p-2 rounded-tl-lg border-r border-slate-800">
                Jugador
              </th>
              {columnsConfig.attack && (
                <th colSpan={5} className="p-2 text-center border-r border-slate-800">
                  Ataque
                </th>
              )}
              {columnsConfig.reception && (
                <th colSpan={3} className="p-2 text-center border-r border-slate-800">
                  Recepción
                </th>
              )}
              {columnsConfig.serve && (
                <th colSpan={3} className="p-2 text-center border-r border-slate-800">
                  Saque
                </th>
              )}
              {columnsConfig.block && (
                <th className="p-2 text-center rounded-tr-lg">
                  Bloqueo
                </th>
              )}
            </tr>
            {/* Sub Header */}
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <th className="p-2">#</th>
              <th className="p-2">Nombre</th>
              <th className="p-2 border-r border-slate-200">Pos</th>

              {columnsConfig.attack && (
                <>
                  <th className="p-2 text-center">Tot</th>
                  <th className="p-2 text-center text-emerald-700">Pts</th>
                  <th className="p-2 text-center text-rose-600">Err</th>
                  <th className="p-2 text-center text-amber-600">Blq</th>
                  <th className="p-2 text-center font-extrabold text-indigo-900 border-r border-slate-200">Efic %</th>
                </>
              )}

              {columnsConfig.reception && (
                <>
                  <th className="p-2 text-center">Tot</th>
                  <th className="p-2 text-center text-blue-700">Pos %</th>
                  <th className="p-2 text-center text-emerald-700 border-r border-slate-200">Perf %</th>
                </>
              )}

              {columnsConfig.serve && (
                <>
                  <th className="p-2 text-center">Tot</th>
                  <th className="p-2 text-center text-emerald-700">Ace</th>
                  <th className="p-2 text-center text-rose-600 border-r border-slate-200">Err</th>
                </>
              )}

              {columnsConfig.block && (
                <th className="p-2 text-center text-emerald-700 font-extrabold">Pts</th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {activeStats.map((s) => {
              const isHighScorer = s.attPts + s.serveAce + s.blockPts >= 3;
              return (
                <tr key={s.playerNum} className="hover:bg-slate-50 text-slate-800">
                  <td className="p-2 font-mono font-bold text-slate-900">#{s.playerNum}</td>
                  <td className="p-2 font-semibold flex items-center gap-1.5">
                    {s.name}
                    {isHighScorer && (
                      <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                        <Award className="w-3 h-3 text-amber-600" /> Key
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-slate-500 font-mono border-r border-slate-200">{s.position}</td>

                  {/* Attack */}
                  {columnsConfig.attack && (
                    <>
                      <td className="p-2 text-center font-mono">{s.attTotal}</td>
                      <td className="p-2 text-center font-mono font-bold text-emerald-600">{s.attPts}</td>
                      <td className="p-2 text-center font-mono text-rose-600">{s.attErr}</td>
                      <td className="p-2 text-center font-mono text-amber-600">{s.attBlocked}</td>
                      <td className="p-2 text-center font-mono font-extrabold text-indigo-900 bg-indigo-50/50 border-r border-slate-200">
                        {s.attEffPct}%
                      </td>
                    </>
                  )}

                  {/* Reception */}
                  {columnsConfig.reception && (
                    <>
                      <td className="p-2 text-center font-mono">{s.recTotal}</td>
                      <td className="p-2 text-center font-mono font-bold text-blue-700">{s.recPosPct}%</td>
                      <td className="p-2 text-center font-mono font-bold text-emerald-600 border-r border-slate-200">
                        {s.recPerfPct}%
                      </td>
                    </>
                  )}

                  {/* Serve */}
                  {columnsConfig.serve && (
                    <>
                      <td className="p-2 text-center font-mono">{s.serveTotal}</td>
                      <td className="p-2 text-center font-mono font-bold text-emerald-600">{s.serveAce}</td>
                      <td className="p-2 text-center font-mono text-rose-600 border-r border-slate-200">{s.serveErr}</td>
                    </>
                  )}

                  {/* Block */}
                  {columnsConfig.block && (
                    <td className="p-2 text-center font-mono font-bold text-emerald-600">{s.blockPts}</td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Formulas Explanation Footer (Low contrast, secondary info) */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-0.5">
        <div className="font-bold text-slate-700">Fórmulas estadísticas utilizadas:</div>
        <div>• <strong>Eficiencia de Ataque (Efic %):</strong> ((Puntos - Errores - Ataques Bloqueados) / Total de Ataques) × 100</div>
        <div>• <strong>Recepción Positiva (Pos %):</strong> ((Pases Perfectos [#] + Pases Positivos [+]) / Total de Recepciones) × 100</div>
      </div>
    </div>
  );
};
