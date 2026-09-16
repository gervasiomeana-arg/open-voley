import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Calendar, 
  List, 
  Table, 
  Users, 
  BarChart2, 
  Plus, 
  Check, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  X,
  Play,
  CheckCircle2,
  Clock,
  Shield,
  ArrowRight
} from 'lucide-react';
import { Competition, FixtureMatch, StandingEntry } from '../types';
import { sampleCompetitions, sampleFixtures, sampleStandings } from '../data/sampleCompetitionAndTraining';

interface CompetitionCenterProps {
  onOpenMatch?: (matchId: string) => void;
  onOpenTeamRoster?: (teamName: string) => void;
  isWizardOpenExternal?: boolean;
  onCloseWizardExternal?: () => void;
}

export const CompetitionCenter: React.FC<CompetitionCenterProps> = ({
  onOpenMatch,
  onOpenTeamRoster,
  isWizardOpenExternal = false,
  onCloseWizardExternal,
}) => {
  const [competitions, setCompetitions] = useState<Competition[]>(sampleCompetitions);
  const [activeCompId, setActiveCompId] = useState<string>(sampleCompetitions[0].id);
  const [fixtures, setFixtures] = useState<FixtureMatch[]>(sampleFixtures);

  // Sub tab: 'fixture' | 'tabla' | 'equipos'
  const [subTab, setSubTab] = useState<'fixture' | 'tabla' | 'equipos'>('fixture');
  const [fixtureView, setFixtureView] = useState<'list' | 'calendar'>('list');

  // Wizard state
  const [isWizardOpen, setIsWizardOpen] = useState(isWizardOpenExternal);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardName, setWizardName] = useState('');
  const [wizardCategory, setWizardCategory] = useState('Primera División');
  const [wizardGender, setWizardGender] = useState<'Femenino' | 'Masculino' | 'Mixto'>('Femenino');
  const [wizardTeamsCount, setWizardTeamsCount] = useState<number>(8);
  const [wizardCourtsCount, setWizardCourtsCount] = useState<number>(2);
  const [wizardFormat, setWizardFormat] = useState<'round_robin' | 'groups_playoffs' | 'single_elimination'>('groups_playoffs');
  const [wizardPointsSystem, setWizardPointsSystem] = useState<'3-1' | '2-1'>('3-1');
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);

  // Sync external wizard trigger
  React.useEffect(() => {
    if (isWizardOpenExternal) {
      setIsWizardOpen(true);
      setWizardStep(1);
    }
  }, [isWizardOpenExternal]);

  const activeComp = competitions.find((c) => c.id === activeCompId) || competitions[0];
  const activeFixtures = fixtures.filter((f) => f.competitionId === activeComp.id);

  const standings = useMemo<StandingEntry[]>(() => {
    if (activeComp.id === 'comp_metro_2026') {
      return sampleStandings;
    }

    const finishedMatches = fixtures.filter(
      (f) => f.competitionId === activeComp.id && f.status === 'finished'
    );

    const teamStatsMap = new Map<
      string,
      {
        played: number;
        won: number;
        lost: number;
        setsWon: number;
        setsLost: number;
        points: number;
        streak: string[];
      }
    >();

    (activeComp.teams || []).forEach((t) => {
      teamStatsMap.set(t, {
        played: 0,
        won: 0,
        lost: 0,
        setsWon: 0,
        setsLost: 0,
        points: 0,
        streak: [],
      });
    });

    finishedMatches.forEach((f) => {
      const homeSets = f.scoreHomeSets ?? 0;
      const awaySets = f.scoreAwaySets ?? 0;
      const home = teamStatsMap.get(f.homeTeam);
      const away = teamStatsMap.get(f.awayTeam);

      if (home) {
        home.played += 1;
        home.setsWon += homeSets;
        home.setsLost += awaySets;
        if (homeSets > awaySets) {
          home.won += 1;
          home.points += homeSets === 3 && (awaySets === 0 || awaySets === 1) ? 3 : 2;
          home.streak.push('G');
        } else {
          home.lost += 1;
          home.points += awaySets === 3 && homeSets === 2 ? 1 : 0;
          home.streak.push('P');
        }
      }

      if (away) {
        away.played += 1;
        away.setsWon += awaySets;
        away.setsLost += homeSets;
        if (awaySets > homeSets) {
          away.won += 1;
          away.points += awaySets === 3 && (homeSets === 0 || homeSets === 1) ? 3 : 2;
          away.streak.push('G');
        } else {
          away.lost += 1;
          away.points += homeSets === 3 && awaySets === 2 ? 1 : 0;
          away.streak.push('P');
        }
      }
    });

    const entries: StandingEntry[] = Array.from(teamStatsMap.entries()).map(([teamName, stats]) => ({
      position: 1,
      teamName,
      played: stats.played,
      won: stats.won,
      lost: stats.lost,
      setsWon: stats.setsWon,
      setsLost: stats.setsLost,
      points: stats.points,
      streak: stats.streak.slice(-5).join('-'),
    }));

    entries.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const diffA = a.setsWon - a.setsLost;
      const diffB = b.setsWon - b.setsLost;
      if (diffB !== diffA) return diffB - diffA;
      return a.teamName.localeCompare(b.teamName);
    });

    return entries.map((e, idx) => ({ ...e, position: idx + 1 }));
  }, [activeComp, fixtures]);

  const handleAskAiRecommendation = () => {
    if (wizardTeamsCount <= 6) {
      setAiRecommendation(
        `Para ${wizardTeamsCount} equipos y ${wizardCourtsCount} cancha(s), recomendamos "Todos contra Todos (Round Robin)" a una sola rueda. Requiere 5 fechas y asegura que todos jueguen la misma cantidad de partidos.`
      );
      setWizardFormat('round_robin');
    } else if (wizardTeamsCount <= 12) {
      setAiRecommendation(
        `Tenés ${wizardTeamsCount} equipos y ${wizardCourtsCount} canchas. Recomendamos "2 Zonas de ${wizardTeamsCount / 2} + Semifinales y Final". Optimiza el tiempo en cancha y clasifica a los 2 mejores de cada zona.`
      );
      setWizardFormat('groups_playoffs');
    } else {
      setAiRecommendation(
        `Con ${wizardTeamsCount} equipos y alta densidad, recomendamos "4 Zonas de 4 + Playoffs (Oro y Plata)". Evita saturación de horarios en ${wizardCourtsCount} canchas.`
      );
      setWizardFormat('groups_playoffs');
    }
  };

  const handleFinishWizard = () => {
    const newComp: Competition = {
      id: `comp_${Date.now()}`,
      name: wizardName || 'Nuevo Torneo Oficial',
      category: wizardCategory,
      gender: wizardGender,
      format: wizardFormat,
      teamsCount: wizardTeamsCount,
      courtsCount: wizardCourtsCount,
      status: 'active',
      pointsSystem: wizardPointsSystem,
      teams: [
        'Club Ciudad de Campana',
        'Vélez Sarsfield',
        'Boca Juniors',
        'Gimnasia y Esgrima LP',
        'River Plate',
        'San Lorenzo',
        'Banco Provincia',
        'Estudiantes LP'
      ].slice(0, wizardTeamsCount),
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-12-20'
    };

    setCompetitions([newComp, ...competitions]);
    setActiveCompId(newComp.id);
    setIsWizardOpen(false);
    if (onCloseWizardExternal) onCloseWizardExternal();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">{activeComp.name}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                {activeComp.status === 'active' ? 'En Curso' : 'Próximo'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeComp.category} • Rama {activeComp.gender} • {activeComp.teamsCount} Equipos • Sistema {activeComp.pointsSystem}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Tournament Switcher */}
          <select
            value={activeCompId}
            onChange={(e) => setActiveCompId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400"
          >
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setIsWizardOpen(true);
              setWizardStep(1);
            }}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Competición</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          {[
            { id: 'fixture', label: 'Fixture & Resultados', icon: Calendar },
            { id: 'tabla', label: 'Tabla de Posiciones', icon: Table },
            { id: 'equipos', label: 'Equipos Participantes', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {subTab === 'fixture' && (
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setFixtureView('list')}
              className={`p-1.5 rounded-lg text-xs font-bold transition ${
                fixtureView === 'list' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
              title="Vista Lista"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFixtureView('calendar')}
              className={`p-1.5 rounded-lg text-xs font-bold transition ${
                fixtureView === 'calendar' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
              title="Vista Calendario"
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* SUB-TAB 1: FIXTURE */}
      {subTab === 'fixture' && (
        <div className="space-y-4">
          {fixtureView === 'list' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeFixtures.map((f) => (
                <div
                  key={f.id}
                  className="p-4 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl shadow-md transition space-y-3"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-bold text-amber-400">{f.roundName}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {f.date} • {f.time} hs
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    {/* Home */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-xs shrink-0">
                        {f.homeTeam.charAt(0)}
                      </div>
                      <span className="font-bold text-white text-xs truncate max-w-[130px]">
                        {f.homeTeam}
                      </span>
                    </div>

                    {/* Result or VS */}
                    <div className="px-3 text-center">
                      {f.status === 'finished' ? (
                        <div>
                          <div className="text-base font-black font-mono text-amber-400">
                            {f.scoreHomeSets} - {f.scoreAwaySets}
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono">
                            {f.setScores}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          VS
                        </span>
                      )}
                    </div>

                    {/* Away */}
                    <div className="flex items-center gap-2 min-w-0 justify-end">
                      <span className="font-bold text-white text-xs truncate max-w-[130px] text-right">
                        {f.awayTeam}
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-black flex items-center justify-center text-xs shrink-0">
                        {f.awayTeam.charAt(0)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Sede: {f.court}</span>
                    {f.status === 'scheduled' && onOpenMatch && (
                      <button
                        onClick={() => onOpenMatch(f.id)}
                        className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                      >
                        <span>Cargar Partido</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Calendario de Fechas de Competición</span>
                <span className="text-amber-400">Septiembre 2026</span>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center text-xs">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                  <div key={d} className="p-2 bg-slate-950 font-bold text-slate-400 rounded-lg">
                    {d}
                  </div>
                ))}
                {Array.from({ length: 30 }).map((_, i) => {
                  const day = i + 1;
                  const isMatchDay = day === 5 || day === 12 || day === 19;
                  return (
                    <div
                      key={day}
                      className={`p-3 rounded-xl border min-h-[64px] flex flex-col justify-between text-left ${
                        isMatchDay 
                          ? 'bg-amber-500/10 border-amber-500/30 text-white' 
                          : 'bg-slate-800/30 border-slate-800/60 text-slate-400'
                      }`}
                    >
                      <span className="font-mono font-bold text-xs">{day}</span>
                      {isMatchDay && (
                        <span className="text-[9px] font-bold text-amber-400 truncate">
                          {day === 12 ? 'Fecha 6' : day === 5 ? 'Fecha 5' : 'Fecha 7'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: TABLA DE POSICIONES */}
      {subTab === 'tabla' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">Pos</th>
                <th className="py-3.5 px-4">Equipo</th>
                <th className="py-3.5 px-3 text-center">PJ</th>
                <th className="py-3.5 px-3 text-center text-emerald-400">PG</th>
                <th className="py-3.5 px-3 text-center text-rose-400">PP</th>
                <th className="py-3.5 px-3 text-center">Sets</th>
                <th className="py-3.5 px-4 text-center text-amber-400 font-bold">Puntos</th>
                <th className="py-3.5 px-4 text-center">Racha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {standings.map((row) => (
                <tr 
                  key={row.position} 
                  className={`hover:bg-slate-800/50 transition ${row.position <= 4 ? 'bg-emerald-500/5' : ''}`}
                >
                  <td className="py-3 px-4 text-center font-mono font-bold">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg ${
                      row.position <= 4 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'text-slate-400'
                    }`}>
                      {row.position}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-white flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-xs text-amber-400 font-black">
                      {row.teamName.charAt(0)}
                    </div>
                    <span>{row.teamName}</span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-300">{row.played}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">{row.won}</td>
                  <td className="py-3 px-3 text-center font-mono text-rose-400">{row.lost}</td>
                  <td className="py-3 px-3 text-center font-mono text-slate-300">{row.setsWon}-{row.setsLost}</td>
                  <td className="py-3 px-4 text-center font-mono font-black text-amber-400 text-sm">{row.points}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {row.streak ? (
                        row.streak.split('-').filter(Boolean).map((char, i) => (
                          <span
                            key={i}
                            className={`w-4 h-4 rounded text-[9px] font-black flex items-center justify-center font-mono ${
                              char === 'G' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {char}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-600 font-mono text-xs">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Puestos 1 al 4 clasifican a Playoffs de Oro (FIVB)</span>
            </div>
            <span>Regla de puntuación: 3-0 y 3-1 (3 pts al ganador, 0 al perdedor) • 3-2 (2 pts al ganador, 1 al perdedor)</span>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: EQUIPOS */}
      {subTab === 'equipos' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {activeComp.teams.map((teamName, i) => (
            <div
              key={i}
              className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-base border border-amber-500/30">
                  {teamName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">{teamName}</h4>
                  <span className="text-[10px] text-slate-400">{activeComp.category}</span>
                </div>
              </div>

              {onOpenTeamRoster && (
                <button
                  onClick={() => onOpenTeamRoster(teamName)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold py-2 rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ver Roster</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* WIZARD CREAR COMPETICIÓN (5 PASOS CON OPEN AI) */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            {/* Wizard Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  Asistente de Competición • Paso {wizardStep} de 5
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  {wizardStep === 1 && 'Paso 1: Información Básica'}
                  {wizardStep === 2 && 'Paso 2: Equipos Participantes'}
                  {wizardStep === 3 && 'Paso 3: Formato de Competencia & IA'}
                  {wizardStep === 4 && 'Paso 4: Reglas y Sistema de Puntos'}
                  {wizardStep === 5 && 'Paso 5: Confirmar y Generar Fixture'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsWizardOpen(false);
                  if (onCloseWizardExternal) onCloseWizardExternal();
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Wizard Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* PASO 1 */}
              {wizardStep === 1 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Nombre del Torneo</label>
                    <input
                      type="text"
                      value={wizardName}
                      onChange={(e) => setWizardName(e.target.value)}
                      placeholder="Ej: Liga Metropolitana Clausura 2026"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Categoría</label>
                      <select
                        value={wizardCategory}
                        onChange={(e) => setWizardCategory(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
                      >
                        <option>Primera División</option>
                        <option>Sub 21</option>
                        <option>Sub 18</option>
                        <option>Sub 16</option>
                        <option>Maxivoley</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Rama</label>
                      <select
                        value={wizardGender}
                        onChange={(e) => setWizardGender(e.target.value as any)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
                      >
                        <option value="Femenino">Femenino</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Mixto">Mixto</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 2 */}
              {wizardStep === 2 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Cantidad de Equipos</label>
                      <input
                        type="number"
                        min={4}
                        max={32}
                        value={wizardTeamsCount}
                        onChange={(e) => setWizardTeamsCount(parseInt(e.target.value) || 8)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Canchas Disponibles</label>
                      <input
                        type="number"
                        min={1}
                        max={8}
                        value={wizardCourtsCount}
                        onChange={(e) => setWizardCourtsCount(parseInt(e.target.value) || 2)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold"
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-400">
                    Se asignarán {wizardTeamsCount} equipos desde la biblioteca de clubes disponibles para confeccionar la grilla inicial.
                  </div>
                </div>
              )}

              {/* PASO 3 */}
              {wizardStep === 3 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold">Formato del Torneo</label>
                    <button
                      onClick={handleAskAiRecommendation}
                      className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Recomendar con OPEN AI</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'round_robin', label: 'Todos contra Todos' },
                      { id: 'groups_playoffs', label: 'Zonas + Playoffs' },
                      { id: 'single_elimination', label: 'Playoff Directo' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setWizardFormat(f.id as any)}
                        className={`p-3 rounded-xl border text-center font-bold transition ${
                          wizardFormat === f.id
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {aiRecommendation && (
                    <div className="p-3.5 bg-purple-950/30 border border-purple-800/50 rounded-xl space-y-1.5 animate-fadeIn">
                      <div className="flex items-center gap-1.5 text-purple-400 font-black">
                        <Sparkles className="w-4 h-4" />
                        <span>Sugerencia Inteligente OPEN AI</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {aiRecommendation}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* PASO 4 */}
              {wizardStep === 4 && (
                <div className="space-y-3">
                  <label className="block text-slate-300 font-bold">Sistema de Puntuación FIVB</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setWizardPointsSystem('3-1')}
                      className={`p-3.5 rounded-xl border text-left font-bold transition ${
                        wizardPointsSystem === '3-1'
                          ? 'bg-amber-500/15 border-amber-400 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="text-amber-400 font-black">Sistema 3-1 (FIVB Oficial)</div>
                      <div className="text-[10px] text-slate-300 mt-1">3 pts (3-0/3-1), 2 pts (3-2 ganador), 1 pt (3-2 perdedor).</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWizardPointsSystem('2-1')}
                      className={`p-3.5 rounded-xl border text-left font-bold transition ${
                        wizardPointsSystem === '2-1'
                          ? 'bg-amber-500/15 border-amber-400 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="text-amber-400 font-black">Sistema 2-1 Tradicional</div>
                      <div className="text-[10px] text-slate-300 mt-1">2 puntos por victoria, 1 punto por derrota.</div>
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 5 */}
              {wizardStep === 5 && (
                <div className="space-y-3 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400 font-black">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Listo para crear la competición</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Se creará <strong>{wizardName || 'Torneo Oficial'}</strong> con {wizardTeamsCount} equipos, formato {wizardFormat === 'groups_playoffs' ? 'Zonas + Playoffs' : 'Todos contra todos'} y sistema de puntos {wizardPointsSystem}.
                  </p>
                </div>
              )}
            </div>

            {/* Wizard Navigation Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <button
                type="button"
                disabled={wizardStep === 1}
                onClick={() => setWizardStep((p) => p - 1)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-bold disabled:opacity-30 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              {wizardStep < 5 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep((p) => p + 1)}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-1 transition shadow-md shadow-amber-500/20"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishWizard}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center gap-1 transition shadow-md shadow-emerald-500/20"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Crear Competición</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
