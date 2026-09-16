import { ScoutCodeAction, TeamSide, VolleySkill, EvaluationSymbol, Player, PlayerStats } from '../types';

export const SKILL_NAMES: Record<VolleySkill, string> = {
  S: 'Saque',
  R: 'Recepción',
  E: 'Colocación/Pase',
  A: 'Ataque',
  B: 'Bloqueo',
  D: 'Defensa',
  F: 'Freeball',
};

export const EVALUATION_NAMES: Record<EvaluationSymbol, string> = {
  '#': 'Punto / Perfecto (#)',
  '+': 'Positivo (+)',
  '!': 'Neutro / Combinación (!)',
  '-': 'Negativo (-)',
  '/': 'Bloqueado por Rival (/)',
  '=': 'Error / Fuera (=)',
};

/**
 * Maps evaluation from respondent (e.g. Reception) to initiator (e.g. Serve)
 */
export function inferInitiatorEval(initiatorSkill: VolleySkill, respondentSkill: VolleySkill, respondentEval: EvaluationSymbol): EvaluationSymbol {
  if (initiatorSkill === 'S') {
    // Serve vs Reception
    switch (respondentEval) {
      case '=': return '#'; // Reception error = Ace for server
      case '/': return '+'; // Poor pass / freeball = Positive serve
      case '-': return '+'; // Negative pass = Positive serve
      case '!': return '!'; // Medium pass = Neutral serve
      case '+': return '-'; // Positive pass = Negative serve
      case '#': return '-'; // Perfect pass = Negative serve
      default: return '!';
    }
  }

  if (initiatorSkill === 'A') {
    // Attack vs Defense or Block
    if (respondentSkill === 'B') {
      if (respondentEval === '#') return '='; // Block point = Attack blocked error
      if (respondentEval === '+') return '/'; // Block touch / soft block
      if (respondentEval === '=') return '#'; // Block error/out = Attack point
    } else {
      // Attack vs Defense
      switch (respondentEval) {
        case '=': return '#'; // Defense error = Attack point / kill
        case '/': return '+'; // Defense freeball = Positive attack
        case '-': return '+'; // Difficult dig = Positive attack
        case '!': return '!'; // In-play dig = Neutral attack
        case '+': return '-'; // Good dig = Ineffective attack
        case '#': return '-'; // Perfect dig = Ineffective attack
        default: return '+';
      }
    }
  }

  return '+';
}

/**
 * Normalizes skill string aliases (e.g. SQ -> S, AT -> A, RE -> R, etc.)
 */
function normalizeSkill(str: string): { skill: VolleySkill; length: number } | null {
  const upper = str.toUpperCase();
  if (upper.startsWith('SQ')) return { skill: 'S', length: 2 };
  if (upper.startsWith('AT')) return { skill: 'A', length: 2 };
  if (upper.startsWith('RE')) return { skill: 'R', length: 2 };
  if (upper.startsWith('BL')) return { skill: 'B', length: 2 };
  if (upper.startsWith('DF')) return { skill: 'D', length: 2 };
  if (upper.startsWith('SE')) return { skill: 'E', length: 2 };
  if (upper.startsWith('S')) return { skill: 'S', length: 1 };
  if (upper.startsWith('R')) return { skill: 'R', length: 1 };
  if (upper.startsWith('A')) return { skill: 'A', length: 1 };
  if (upper.startsWith('B')) return { skill: 'B', length: 1 };
  if (upper.startsWith('D')) return { skill: 'D', length: 1 };
  if (upper.startsWith('E')) return { skill: 'E', length: 1 };
  if (upper.startsWith('F')) return { skill: 'F', length: 1 };
  return null;
}

/**
 * Parses either single or compound Data Volley code (e.g. "a14sq.4#17" -> Serve + Reception)
 */
export function parseScoutCodes(
  rawCode: string,
  homePlayers: Player[],
  awayPlayers: Player[],
  currentSet: number,
  scoreHome: number,
  scoreAway: number,
  rotationHome: number[],
  rotationAway: number[],
  videoTimestamp: number = 0
): ScoutCodeAction[] {
  const clean = rawCode.trim().toUpperCase();
  if (!clean) return [];

  // Check if it's a compound code with dot '.'
  if (clean.includes('.')) {
    const parts = clean.split('.');
    const part1 = parts[0].trim();
    const part2 = parts[1].trim();

    if (!part1 || !part2) return [];

    // Part 1: Primary Action (Serve or Attack)
    let team1: TeamSide = 'home';
    let rest1 = part1;

    if (rest1.startsWith('*')) {
      team1 = 'home';
      rest1 = rest1.substring(1);
    } else if (rest1.startsWith('A') && !isNaN(Number(rest1.charAt(1)))) {
      team1 = 'away';
      rest1 = rest1.substring(1);
    } else {
      team1 = 'home';
    }

    const matchPlayer1 = rest1.match(/^(\d{1,2})/);
    if (!matchPlayer1) return [];
    const playerNum1 = parseInt(matchPlayer1[1], 10);
    rest1 = rest1.substring(matchPlayer1[1].length);

    let skill1: VolleySkill = 'S'; // Default to serve if not specified in compound code
    const skillNorm1 = normalizeSkill(rest1);
    if (skillNorm1) {
      skill1 = skillNorm1.skill;
      rest1 = rest1.substring(skillNorm1.length);
    }

    // Optional hit type / zone
    let startZone1: number | undefined;
    let endZone1: number | undefined;
    let eval1: EvaluationSymbol | null = null;

    if (rest1.length > 0 && ['#', '+', '!', '-', '/', '='].includes(rest1.charAt(0))) {
      eval1 = rest1.charAt(0) as EvaluationSymbol;
      rest1 = rest1.substring(1);
    }

    const zone1Match = rest1.match(/(\d)(\d)?/);
    if (zone1Match) {
      if (zone1Match[1]) startZone1 = parseInt(zone1Match[1], 10);
      if (zone1Match[2]) endZone1 = parseInt(zone1Match[2], 10);
    }

    // Part 2: Opposing Reaction (Reception or Defense/Block)
    const team2: TeamSide = team1 === 'home' ? 'away' : 'home';
    let rest2 = part2;

    const matchPlayer2 = rest2.match(/^(\d{1,2})/);
    if (!matchPlayer2) return [];
    const playerNum2 = parseInt(matchPlayer2[1], 10);
    rest2 = rest2.substring(matchPlayer2[1].length);

    // If initiator is Serve (S), respondent is Reception (R)
    // If initiator is Attack (A), respondent is Defense (D) or Block (B)
    let skill2: VolleySkill = skill1 === 'S' ? 'R' : 'D';
    const skillNorm2 = normalizeSkill(rest2);
    if (skillNorm2) {
      skill2 = skillNorm2.skill;
      rest2 = rest2.substring(skillNorm2.length);
    }

    // Evaluation symbol of respondent (e.g. #, +, !, -, /, =)
    let eval2: EvaluationSymbol = '+';
    if (rest2.length > 0 && ['#', '+', '!', '-', '/', '='].includes(rest2.charAt(0))) {
      eval2 = rest2.charAt(0) as EvaluationSymbol;
      rest2 = rest2.substring(1);
    }

    // Zones for respondent
    let startZone2: number | undefined;
    let endZone2: number | undefined;
    const zone2Match = rest2.match(/(\d)(\d)?/);
    if (zone2Match) {
      if (zone2Match[1]) startZone2 = parseInt(zone2Match[1], 10);
      if (zone2Match[2]) endZone2 = parseInt(zone2Match[2], 10);
    }

    // Infer initiator evaluation if not explicitly provided
    if (!eval1) {
      eval1 = inferInitiatorEval(skill1, skill2, eval2);
    }

    // Player metadata
    const players1 = (team1 === 'home' ? homePlayers : awayPlayers) || [];
    const found1 = players1.find((p) => p.number === playerNum1);
    const name1 = found1 ? found1.name : `Jugador #${playerNum1}`;

    const players2 = (team2 === 'home' ? homePlayers : awayPlayers) || [];
    const found2 = players2.find((p) => p.number === playerNum2);
    const name2 = found2 ? found2.name : `Jugador #${playerNum2}`;

    const team1Label = team1 === 'home' ? 'Local' : 'Visitante';
    const team2Label = team2 === 'home' ? 'Local' : 'Visitante';

    // Descriptions
    let desc1 = `${team1Label} #${playerNum1} (${name1}) - ${SKILL_NAMES[skill1]} [${eval1}]`;
    if (startZone1 && endZone1) desc1 += ` (Z${startZone1} ➔ Z${endZone1})`;
    else if (startZone1) desc1 += ` (Z${startZone1})`;

    let desc2 = `${team2Label} #${playerNum2} (${name2}) - ${SKILL_NAMES[skill2]} [${eval2}]`;
    if (startZone2 && endZone2) desc2 += ` (Z${startZone2} ➔ Z${endZone2})`;
    else if (startZone2) desc2 += ` (Z${startZone2})`;

    const action1: ScoutCodeAction = {
      id: `act_${Date.now()}_1_${Math.random().toString(36).substring(2, 6)}`,
      rawCode: part1,
      team: team1,
      playerNum: playerNum1,
      playerName: name1,
      skill: skill1,
      evaluation: eval1,
      startZone: startZone1,
      endZone: endZone1,
      timestamp: videoTimestamp,
      setNumber: currentSet,
      scoreHome,
      scoreAway,
      rotationHome: [...rotationHome],
      rotationAway: [...rotationAway],
      description: desc1,
    };

    const action2: ScoutCodeAction = {
      id: `act_${Date.now()}_2_${Math.random().toString(36).substring(2, 6)}`,
      rawCode: part2,
      team: team2,
      playerNum: playerNum2,
      playerName: name2,
      skill: skill2,
      evaluation: eval2,
      startZone: startZone2,
      endZone: endZone2,
      timestamp: videoTimestamp,
      setNumber: currentSet,
      scoreHome,
      scoreAway,
      rotationHome: [...rotationHome],
      rotationAway: [...rotationAway],
      description: desc2,
    };

    return [action1, action2];
  }

  // Single Action code fallback
  const single = parseSingleScoutCode(
    clean,
    homePlayers,
    awayPlayers,
    currentSet,
    scoreHome,
    scoreAway,
    rotationHome,
    rotationAway,
    videoTimestamp
  );

  return single ? [single] : [];
}

/**
 * Parses single scout code like "*12AH#15", "a05SM=91", "14SQ#", "*08R+"
 */
export function parseSingleScoutCode(
  rawCode: string,
  homePlayers: Player[],
  awayPlayers: Player[],
  currentSet: number,
  scoreHome: number,
  scoreAway: number,
  rotationHome: number[],
  rotationAway: number[],
  videoTimestamp: number = 0
): ScoutCodeAction | null {
  const clean = rawCode.trim().toUpperCase();
  if (!clean) return null;

  let team: TeamSide = 'home';
  let rest = clean;

  if (clean.startsWith('*')) {
    team = 'home';
    rest = clean.substring(1);
  } else if (clean.startsWith('A') && !isNaN(Number(clean.charAt(1)))) {
    team = 'away';
    rest = clean.substring(1);
  } else {
    team = 'home';
  }

  const matchPlayer = rest.match(/^(\d{1,2})/);
  if (!matchPlayer) return null;

  const playerNum = parseInt(matchPlayer[1], 10);
  rest = rest.substring(matchPlayer[1].length);

  let skill: VolleySkill = 'A';
  const norm = normalizeSkill(rest);
  if (norm) {
    skill = norm.skill;
    rest = rest.substring(norm.length);
  }

  // Optional hit type
  if (rest.length > 0 && ['H', 'M', 'Q', 'T', 'P', 'N'].includes(rest.charAt(0))) {
    rest = rest.substring(1);
  }

  // Evaluation symbol
  let evaluation: EvaluationSymbol = '+';
  if (rest.length > 0 && ['#', '+', '!', '-', '/', '='].includes(rest.charAt(0))) {
    evaluation = rest.charAt(0) as EvaluationSymbol;
    rest = rest.substring(1);
  }

  let startZone: number | undefined;
  let endZone: number | undefined;
  const zoneMatch = rest.match(/(\d)(\d)?/);
  if (zoneMatch) {
    if (zoneMatch[1]) startZone = parseInt(zoneMatch[1], 10);
    if (zoneMatch[2]) endZone = parseInt(zoneMatch[2], 10);
  }

  const players = (team === 'home' ? homePlayers : awayPlayers) || [];
  const foundPlayer = players.find((p) => p.number === playerNum);
  const playerName = foundPlayer ? foundPlayer.name : `Jugador #${playerNum}`;

  const skillName = SKILL_NAMES[skill] || 'Acción';
  const teamName = team === 'home' ? 'Local' : 'Visitante';

  let description = `${teamName} #${playerNum} (${playerName}) - ${skillName} [${evaluation}]`;
  if (startZone && endZone) {
    description += ` (Zona ${startZone} ➔ Zona ${endZone})`;
  } else if (startZone) {
    description += ` (Zona ${startZone})`;
  }

  return {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    rawCode: clean,
    team,
    playerNum,
    playerName,
    skill,
    evaluation,
    startZone,
    endZone,
    timestamp: videoTimestamp,
    setNumber: currentSet,
    scoreHome,
    scoreAway,
    rotationHome: [...rotationHome],
    rotationAway: [...rotationAway],
    description,
  };
}

/**
 * Backward-compatible single code parser
 */
export function parseScoutCode(
  rawCode: string,
  homePlayers: Player[],
  awayPlayers: Player[],
  currentSet: number,
  scoreHome: number,
  scoreAway: number,
  rotationHome: number[],
  rotationAway: number[],
  videoTimestamp: number = 0
): ScoutCodeAction | null {
  const actions = parseScoutCodes(
    rawCode,
    homePlayers,
    awayPlayers,
    currentSet,
    scoreHome,
    scoreAway,
    rotationHome,
    rotationAway,
    videoTimestamp
  );
  return actions.length > 0 ? actions[0] : null;
}

/**
 * Calculate player stats from list of actions
 */
export function calculatePlayerStats(players: Player[] = [], actions: ScoutCodeAction[] = []): PlayerStats[] {
  const safePlayers = Array.isArray(players) ? players : [];
  const safeActions = Array.isArray(actions) ? actions : [];

  return safePlayers.map((player) => {
    const playerActions = safeActions.filter((a) => a && a.team === player.team && a.playerNum === player.number);

    // Serves
    const serves = playerActions.filter((a) => a.skill === 'S');
    const serveTotal = serves.length;
    const serveAce = serves.filter((a) => a.evaluation === '#').length;
    const serveErr = serves.filter((a) => a.evaluation === '=').length;

    // Receptions
    const recs = playerActions.filter((a) => a.skill === 'R');
    const recTotal = recs.length;
    const recPerfect = recs.filter((a) => a.evaluation === '#').length;
    const recPositive = recs.filter((a) => a.evaluation === '+' || a.evaluation === '#').length;
    const recErr = recs.filter((a) => a.evaluation === '=').length;
    const recPosPct = recTotal > 0 ? Math.round((recPositive / recTotal) * 100) : 0;
    const recPerfPct = recTotal > 0 ? Math.round((recPerfect / recTotal) * 100) : 0;

    // Attacks
    const attacks = playerActions.filter((a) => a.skill === 'A');
    const attTotal = attacks.length;
    const attPts = attacks.filter((a) => a.evaluation === '#').length;
    const attErr = attacks.filter((a) => a.evaluation === '=').length;
    const attBlocked = attacks.filter((a) => a.evaluation === '/').length;
    const attEffPct = attTotal > 0 ? Math.round(((attPts - attErr - attBlocked) / attTotal) * 100) : 0;

    // Blocks
    const blocks = playerActions.filter((a) => a.skill === 'B');
    const blockPts = blocks.filter((a) => a.evaluation === '#').length;

    // Digs
    const digs = playerActions.filter((a) => a.skill === 'D');
    const digTotal = digs.length;

    return {
      playerNum: player.number,
      name: player.name,
      position: player.position,
      team: player.team,
      serveTotal,
      serveAce,
      serveErr,
      recTotal,
      recPerfect,
      recPositive,
      recErr,
      recPosPct,
      recPerfPct,
      attTotal,
      attPts,
      attErr,
      attBlocked,
      attEffPct,
      blockPts,
      digTotal,
    };
  });
}
