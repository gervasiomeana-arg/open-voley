/**
 * Tactical Intelligence Engine for OPEN VOLEY
 * Provides structured tactical scouting reports directly grounded in match evidence and data.
 * Used both directly and as a fail-safe fallback when external AI services experience temporary outages.
 */

export interface TacticalTeamStats {
  actions?: number;
  attack?: {
    total?: number;
    points?: number;
    errors?: number;
    blocked?: number;
    efficiencyPct?: number | null;
  };
  serve?: {
    total?: number;
    aces?: number;
    errors?: number;
  };
  reception?: {
    total?: number;
    positive?: number;
    errors?: number;
    positivePct?: number | null;
  };
  blockPoints?: number;
  digs?: number;
}

export interface TacticalContext {
  match?: {
    id?: string;
    title?: string;
    date?: string;
    competition?: string;
    homeTeam?: string;
    awayTeam?: string;
    sets?: Array<{ home: number; away: number }>;
    currentSet?: number;
  };
  current?: {
    home?: TacticalTeamStats;
    away?: TacticalTeamStats;
  };
  players?: Array<{
    number: number;
    name: string;
    team: 'home' | 'away';
    position?: string;
    actions: number;
    points: number;
  }>;
  evidence?: Array<{
    title: string;
    description: string;
    evidenceCount?: number;
    rallyIds?: string[];
  }>;
  history?: Array<unknown>;
}

export function generateLocalTacticalAnalysis(query: string, context: TacticalContext | undefined): string {
  const home = context?.current?.home;
  const away = context?.current?.away;
  const match = context?.match || {};
  const evidence = Array.isArray(context?.evidence) ? context.evidence : [];
  const players = Array.isArray(context?.players) ? context.players : [];

  const homeName = match.homeTeam || 'Equipo Local';
  const awayName = match.awayTeam || 'Equipo Rival';

  const lines: string[] = [];
  lines.push(`**Informe Táctico OPEN AI — ${homeName} vs ${awayName}**`);
  lines.push('');

  // 1. Balance Observado
  lines.push('### 1. Diagnóstico Técnico del Partido');
  if (home?.attack || away?.attack) {
    const homeEff = home?.attack?.efficiencyPct != null ? `${home.attack.efficiencyPct}%` : 'N/D';
    const awayEff = away?.attack?.efficiencyPct != null ? `${away.attack.efficiencyPct}%` : 'N/D';
    const homeRecPos = home?.reception?.positivePct != null ? `${home.reception.positivePct}%` : 'N/D';
    const awayRecPos = away?.reception?.positivePct != null ? `${away.reception.positivePct}%` : 'N/D';

    lines.push(`- **Ataque ${homeName}:** Eficiencia neta del ${homeEff} (${home?.attack?.points || 0} puntos ganados, ${home?.attack?.errors || 0} errores no forzados, ${home?.attack?.blocked || 0} bloqueados en ${home?.attack?.total || 0} remates).`);
    lines.push(`- **Ataque ${awayName}:** Eficiencia neta del ${awayEff} (${away?.attack?.points || 0} puntos ganados, ${away?.attack?.errors || 0} errores en ${away?.attack?.total || 0} remates).`);
    lines.push(`- **Recepción:** ${homeName} positiva en ${homeRecPos} (n=${home?.reception?.total || 0}) vs ${awayName} positiva en ${awayRecPos} (n=${away?.reception?.total || 0}).`);
    lines.push(`- **Saque:** ${homeName} ${home?.serve?.aces || 0} aces / ${home?.serve?.errors || 0} errores vs ${awayName} ${away?.serve?.aces || 0} aces / ${away?.serve?.errors || 0} errores.`);
    lines.push(`- **Fase de Bloqueo y Defensa:** ${homeName} ${home?.blockPoints || 0} bloqueos directos y ${home?.digs || 0} defensas.`);
  } else {
    lines.push('- *Sin suficientes acciones registradas en el set actual para calcular métricas acumuladas.*');
  }
  lines.push('');

  // 2. Hallazgos y Evidencias de Scouting
  if (evidence.length > 0) {
    lines.push('### 2. Evidencias Clave Registradas');
    for (const ev of evidence.slice(0, 4)) {
      const count = ev.evidenceCount ? ` (n=${ev.evidenceCount} jugadas)` : '';
      lines.push(`- **${ev.title}:** ${ev.description}${count}`);
    }
    lines.push('');
  }

  // 3. Recomendaciones Tácticas
  lines.push('### 3. Ajustes y Recomendaciones para el Cuerpo Técnico');
  const homeRecPct = home?.reception?.positivePct ?? 50;
  const awayRecPct = away?.reception?.positivePct ?? 50;
  const homeAtkEff = home?.attack?.efficiencyPct ?? 25;
  const awayAtkEff = away?.attack?.efficiencyPct ?? 25;

  // Saque y K2 (contraataque)
  if (awayRecPct < 60) {
    lines.push(`- **Explotar Saque Táctico:** La recepción de ${awayName} registra fragilidad (${awayRecPct}% positiva). Mantener saque flotante profundo a zonas de conflicto 1 y 5 o saque corto entre receptores para forzar ataque predecible.`);
  } else {
    lines.push(`- **Ajustar Dirección de Saque:** La recepción rival es estable (${awayRecPct}% positiva). Cargar el saque sobre su atacante principal receptor para desgastarlo físicamente y retrasar su aproximación ofensiva.`);
  }

  // Recepción y K1 (salida de recepción)
  if (homeRecPct >= 65) {
    lines.push(`- **Acelerar Distribución en K1:** Con recepción positiva en ${homeRecPct}%, el colocador dispone de balón en 3 metros; priorizar combinaciones con centrales y ataque zaguero por zona 6 para dividir el bloqueo rival.`);
  } else {
    lines.push(`- **Gestión de Pelota Separada:** Ante recepción irregular (${homeRecPct}%), dar altura y parábola a balones altos por zona 4 y 2, ordenando cobertura cerrada para buscar manos y reutilizar la jugada.`);
  }

  // Bloqueo y Defensa
  if (awayAtkEff > 30) {
    lines.push(`- **Ajuste de Bloqueo:** El ataque rival tiene alta eficacia (${awayAtkEff}%). Cerrar el bloqueo doble a la diagonal principal y defender la paralela para frenar su efectividad.`);
  } else {
    lines.push(`- **Disciplina Defensiva:** El rival presenta baja efectividad de ataque (${awayAtkEff}%). No precipitar el bloqueo con faltas en la red; contener toques en bloqueo y salir al contraataque.`);
  }

  // 4. Jugadores destacados si existen
  if (players.length > 0) {
    const topScorers = [...players].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 3);
    lines.push('');
    lines.push('### 4. Rendimiento Individual Destacado');
    for (const p of topScorers) {
      lines.push(`- **#${p.number} ${p.name}** (${p.team === 'home' ? homeName : awayName}): ${p.points} puntos generados en ${p.actions} intervenciones.`);
    }
  }

  lines.push('');
  lines.push(`*Análisis generado a partir del contexto del partido registrado en OPEN VOLEY para la consulta: "${query}".*`);
  return lines.join('\n');
}
