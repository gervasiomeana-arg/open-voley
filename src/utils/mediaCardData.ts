import type { MatchData, Player } from '../types';

export function mediaCardData(match: MatchData, player?: Player) {
  const actions = (match.actions || []).filter(a => player && a.team === player.team && a.playerNum === player.number);
  const attacks = actions.filter(a => a.skill === 'A');
  const receptions = actions.filter(a => a.skill === 'R');
  const positive = (rows: typeof actions) => rows.filter(a => a.evaluation === '#' || a.evaluation === '+').length;
  const aces = actions.filter(a => a.skill === 'S' && a.evaluation === '#').length;
  const blocks = actions.filter(a => a.skill === 'B' && a.evaluation === '#').length;
  const attackPoints = attacks.filter(a => a.evaluation === '#').length;
  const attackErrors = attacks.filter(a => a.evaluation === '=' || a.evaluation === '/').length;
  const sets = (match.sets || []).map(s => ({ number: s.setNumber, home: s.scoreHome, away: s.scoreAway }));
  const receptionSets = [...new Set(receptions.map(a => a.setNumber))].sort((a, b) => a - b).map(number => {
    const rows = receptions.filter(a => a.setNumber === number);
    return { number, total: rows.length, percent: Math.round(100 * positive(rows) / rows.length) };
  });
  const team = player?.team || 'home';
  const teamAttacks = (match.actions || []).filter(a => a.team === team && a.skill === 'A');
  const destinations = Array.from({ length: 9 }, (_, i) => ({ zone: i + 1, total: teamAttacks.filter(a => a.endZone === i + 1).length }));
  return {
    points: attackPoints + aces + blocks, attacks: attacks.length, aces, blocks,
    eff: attacks.length ? Math.round(100 * (attackPoints - attackErrors) / attacks.length) : null,
    recPos: receptions.length ? Math.round(100 * positive(receptions) / receptions.length) : null,
    receptions: receptions.length, receptionSets, sets,
    homeSets: (match.sets || []).filter(s => s.winner === 'home').length,
    awaySets: (match.sets || []).filter(s => s.winner === 'away').length,
    teamName: team === 'home' ? match.homeTeamName : match.awayTeamName,
    destinations, attacksWithDestination: destinations.reduce((sum, d) => sum + d.total, 0),
    totalTeamAttacks: teamAttacks.length,
  };
}

export function mediaCardLines(match: MatchData, player: Player | undefined, type: string) {
  const data = mediaCardData(match, player);
  const subject = player ? `#${player.number} ${player.name} · ${data.teamName}` : 'Sin jugador seleccionado';
  if (type === 'top_scorer') return [subject, `Puntos: ${data.points}`, `Ataques: ${data.attacks}`, `Eficiencia de ataque: ${data.eff === null ? 'Sin datos' : data.eff + '%'}`, `Aces: ${data.aces} · Bloqueos: ${data.blocks}`];
  if (type === 'pass_positivity') return [subject, `Recepción positiva: ${data.recPos === null ? 'Sin datos' : data.recPos + '%'}`, `Recepciones: ${data.receptions}`, ...data.receptionSets.map(s => `Set ${s.number}: ${s.percent}% (${s.total} recepciones)`)];
  if (type === 'shot_chart') return [data.teamName, 'Destinos de ataque registrados', `${data.attacksWithDestination} de ${data.totalTeamAttacks} ataques con zona`, ...data.destinations.map(d => `Zona ${d.zone}: ${d.total}`)];
  return [match.isFinished ? 'Partido finalizado' : 'Partido en curso', `${match.homeTeamName} ${data.homeSets} - ${data.awaySets} ${match.awayTeamName}`, ...data.sets.map(s => `Set ${s.number}: ${s.home} - ${s.away}`)];
}

const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]!));
export function mediaCardSvg(match: MatchData, player: Player | undefined, type: string, ratio: string, theme: string, headline: string) {
  const [width, height] = ratio === 'story_9_16' ? [1080, 1920] : ratio === 'landscape_16_9' ? [1920, 1080] : [1080, 1080];
  const light = theme === 'clean_white';
  const background = light ? '#f8fafc' : theme === 'sunset_orange' ? '#7c2d12' : theme === 'dark_neon' ? '#052e25' : '#0f172a';
  const foreground = light ? '#0f172a' : '#f8fafc';
  const lines = [headline, ...mediaCardLines(match, player, type)].flatMap(line => line.match(/.{1,42}(?:\s|$)|.{1,42}/gu) || ['']);
  const gap = Math.min(80, (height - 300) / Math.max(1, lines.length));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${background}"/><g fill="${foreground}" font-family="Arial, sans-serif"><text x="70" y="105" font-size="48" font-weight="bold">OPEN VOLEY</text>${lines.map((line, i) => `<text x="70" y="${200 + i * gap}" font-size="36">${escape(line)}</text>`).join('')}<text x="70" y="${height - 65}" font-size="24">Datos registrados del partido · OPEN VOLEY</text></g></svg>`;
}
