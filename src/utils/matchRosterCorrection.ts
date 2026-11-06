import { MatchData, Player, TeamSide } from '../types';

/** Correct a jersey number in an active match while keeping its scouting history attached. */
export function correctMatchRoster(match: MatchData, team: TeamSide, players: Player[]): MatchData {
  const key = team === 'home' ? 'homePlayers' : 'awayPlayers';
  const previous = match[key];
  const changes = previous.flatMap((old) => {
    const next = players.find((player) => player.id === old.id);
    return next && (old.number !== next.number || old.name !== next.name)
      ? [{ old, next }]
      : [];
  });
  const renumber = (number: number) => changes.find(({ old }) => old.number === number)?.next.number ?? number;
  const rotationKey = team === 'home' ? 'homeRotation' : 'awayRotation';

  return {
    ...match,
    [key]: players,
    [rotationKey]: match[rotationKey].map(renumber),
    server: match.server.team === team ? { ...match.server, playerNum: renumber(match.server.playerNum) } : match.server,
    liberoReplacements: match.liberoReplacements?.[team]
      ? {
          ...match.liberoReplacements,
          [team]: {
            liberoNum: renumber(match.liberoReplacements[team]!.liberoNum),
            replacedPlayerNum: renumber(match.liberoReplacements[team]!.replacedPlayerNum),
          },
        }
      : match.liberoReplacements,
    actions: match.actions.map((action) => {
      if (action.team !== team && !changes.some(({ old }) =>
        (team === 'home' ? action.rotationHome : action.rotationAway).includes(old.number)
      )) return action;
      const correction = action.team === team
        ? changes.find(({ old }) => old.number === action.playerNum)
        : undefined;
      return {
        ...action,
        playerNum: correction?.next.number ?? action.playerNum,
        playerName: correction?.next.name ?? action.playerName,
        description: correction
          ? action.description.replace(`#${correction.old.number} (`, `#${correction.next.number} (`)
              .replace(`(${correction.old.name})`, `(${correction.next.name})`)
          : action.description,
        rotationHome: team === 'home' ? action.rotationHome.map(renumber) : action.rotationHome,
        rotationAway: team === 'away' ? action.rotationAway.map(renumber) : action.rotationAway,
        serverNum: action.servingTeam === team && action.serverNum !== undefined
          ? renumber(action.serverNum) : action.serverNum,
        liberoReplacements: action.liberoReplacements?.[team]
          ? {
              ...action.liberoReplacements,
              [team]: {
                liberoNum: renumber(action.liberoReplacements[team]!.liberoNum),
                replacedPlayerNum: renumber(action.liberoReplacements[team]!.replacedPlayerNum),
              },
            }
          : action.liberoReplacements,
      };
    }),
  };
}
