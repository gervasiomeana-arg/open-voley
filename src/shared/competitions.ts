import type { Competition, FixtureMatch, StandingEntry } from "../types";

export const COMPETITIONS_KEY = "openvoley_competitions_v1";
export interface Tournament extends Competition {
  teamIds: string[];
  stage: number;
  byeTeams: string[];
  champion?: string;
  tieBreakOrder?: string[];
}
export interface TournamentFixture extends FixtureMatch {
  stage: number;
  group?: "A" | "B";
}
export interface CompetitionData {
  version: 1;
  competitions: Tournament[];
  fixtures: TournamentFixture[];
}
export const emptyCompetitions = (): CompetitionData => ({
  version: 1,
  competitions: [],
  fixtures: [],
});
const text = (v: unknown, max = 200): v is string =>
  typeof v === "string" && v.trim().length > 0 && v.length <= max;
const integer = (v: unknown, min: number, max: number): v is number =>
  Number.isInteger(v) && Number(v) >= min && Number(v) <= max;
export function validSetResult(home: unknown, away: unknown) {
  return (
    integer(home, 0, 3) &&
    integer(away, 0, 3) &&
    ((home === 3 && away < 3) || (away === 3 && home < 3))
  );
}
export function validateCompetitionData(
  value: unknown,
): value is CompetitionData {
  const d = value as CompetitionData;
  if (
    !d ||
    d.version !== 1 ||
    !Array.isArray(d.competitions) ||
    d.competitions.length > 200 ||
    !Array.isArray(d.fixtures) ||
    d.fixtures.length > 25000
  )
    return false;
  const ids = new Set<string>();
  for (const c of d.competitions) {
    if (
      !c ||
      !text(c.id) ||
      ids.has(c.id) ||
      !text(c.name) ||
      !text(c.category) ||
      !["Femenino", "Masculino", "Mixto"].includes(c.gender) ||
      !["round_robin", "groups_playoffs", "single_elimination"].includes(
        c.format,
      ) ||
      !["active", "finished", "upcoming"].includes(c.status) ||
      !["3-1", "2-1"].includes(c.pointsSystem) ||
      !integer(c.courtsCount, 1, 32) ||
      !integer(c.stage, 0, 32) ||
      !Array.isArray(c.teams) ||
      c.teams.length < 2 ||
      c.teams.length > 32 ||
      c.teamsCount !== c.teams.length ||
      !c.teams.every((t) => text(t)) ||
      new Set(c.teams).size !== c.teams.length ||
      !Array.isArray(c.teamIds) ||
      c.teamIds.length !== c.teams.length ||
      !c.teamIds.every((t) => text(t)) ||
      new Set(c.teamIds).size !== c.teamIds.length ||
      !Array.isArray(c.byeTeams) ||
      !c.byeTeams.every((t) => c.teams.includes(t)) ||
      new Set(c.byeTeams).size !== c.byeTeams.length ||
      !/^\d{4}-\d{2}-\d{2}$/.test(c.startDate) ||
      (c.endDate !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(c.endDate)) ||
      (c.champion !== undefined && !c.teams.includes(c.champion))
    )
      return false;
    if (c.format === "groups_playoffs" && c.teams.length < 4) return false;
    if (
      c.tieBreakOrder !== undefined &&
      (!Array.isArray(c.tieBreakOrder) ||
        c.tieBreakOrder.length !== c.teams.length ||
        new Set(c.tieBreakOrder).size !== c.teams.length ||
        !c.tieBreakOrder.every((t) => c.teams.includes(t)))
    )
      return false;
    ids.add(c.id);
  }
  const matches = new Set<string>();
  for (const f of d.fixtures) {
    const c = d.competitions.find((c) => c.id === f?.competitionId);
    if (
      !f ||
      !c ||
      !text(f.id) ||
      matches.has(f.id) ||
      !text(f.roundName) ||
      !text(f.court) ||
      typeof f.date !== "string" ||
      typeof f.time !== "string" ||
      !integer(f.stage, 0, c.stage) ||
      !c.teams.includes(f.homeTeam) ||
      !c.teams.includes(f.awayTeam) ||
      f.homeTeam === f.awayTeam ||
      !["scheduled", "live", "finished"].includes(f.status) ||
      (f.group !== undefined && !["A", "B"].includes(f.group)) ||
      (f.status === "finished" &&
        !validSetResult(f.scoreHomeSets, f.scoreAwaySets))
    )
      return false;
    matches.add(f.id);
  }
  return true;
}
function fixture(
  c: Tournament,
  homeTeam: string,
  awayTeam: string,
  index: number,
  roundName: string,
  group?: "A" | "B",
): TournamentFixture {
  return {
    id: `${c.id}-s${c.stage}-${group || "main"}-${index}`,
    competitionId: c.id,
    stage: c.stage,
    roundName,
    ...(group ? { group } : {}),
    homeTeam,
    awayTeam,
    date: "",
    time: "",
    court: `Cancha ${(index % c.courtsCount) + 1}`,
    status: "scheduled",
  };
}
// Circle schedule: each pair meets once; an odd team count gets one rest per round.
function league(c: Tournament, teams: string[], group?: "A" | "B") {
  const ring: (string | null)[] = [...teams];
  if (ring.length % 2) ring.push(null);
  const output: TournamentFixture[] = [];
  for (let r = 0; r < ring.length - 1; r++) {
    for (let i = 0; i < ring.length / 2; i++) {
      const a = ring[i],
        b = ring[ring.length - 1 - i];
      if (a && b)
        output.push(
          fixture(
            c,
            r % 2 ? b : a,
            r % 2 ? a : b,
            output.length,
            `${group ? `Zona ${group} · ` : ""}Fecha ${r + 1}`,
            group,
          ),
        );
    }
    ring.splice(1, 0, ring.pop()!);
  }
  return output;
}
function knockout(c: Tournament, teams: string[]) {
  const fixtures: TournamentFixture[] = [];
  c.byeTeams = [];
  const bracketSize = 2 ** Math.ceil(Math.log2(teams.length));
  const matchCount = teams.length - bracketSize / 2;
  for (let i = 0; i < matchCount * 2; i += 2)
    fixtures.push(
      fixture(
        c,
        teams[i],
        teams[i + 1],
        i / 2,
        teams.length === 2 ? "Final" : `Eliminatoria ${c.stage + 1}`,
      ),
    );
  c.byeTeams = teams.slice(matchCount * 2);
  return fixtures;
}
export function createTournament(
  input: Omit<
    Tournament,
    "stage" | "byeTeams" | "status" | "teamsCount" | "endDate"
  >,
): CompetitionData {
  const c: Tournament = {
    ...input,
    teamsCount: input.teams.length,
    stage: 0,
    byeTeams: [],
    status: "active",
    endDate: "",
  };
  if (!validateCompetitionData({ version: 1, competitions: [c], fixtures: [] }))
    throw new Error(
      "Revisá los datos del torneo y seleccioná entre 2 y 32 equipos (zonas desde 4).",
    );
  let fixtures: TournamentFixture[] = [];
  if (c.format === "round_robin") fixtures = league(c, c.teams);
  else if (c.format === "groups_playoffs")
    fixtures = ["A", "B"].flatMap((g, i) =>
      league(
        c,
        c.teams.filter((_, j) => j % 2 === i),
        g as "A" | "B",
      ),
    );
  else fixtures = knockout(c, c.teams);
  const data: CompetitionData = { version: 1, competitions: [c], fixtures };
  if (!validateCompetitionData(data))
    throw new Error(
      "Revisá el nombre, los equipos y el formato del torneo (2 a 32 equipos; zonas desde 4).",
    );
  return data;
}
function compareStanding(a: StandingEntry, b: StandingEntry) {
  const points = b.points - a.points || b.won - a.won;
  if (points) return points;
  const ar =
    a.setsLost === 0 ? (a.setsWon ? Infinity : 0) : a.setsWon / a.setsLost;
  const br =
    b.setsLost === 0 ? (b.setsWon ? Infinity : 0) : b.setsWon / b.setsLost;
  return ar === br ? 0 : br > ar ? 1 : -1;
}
export function competitionStandings(
  c: Tournament,
  fixtures: TournamentFixture[],
  group?: "A" | "B",
): StandingEntry[] {
  const teams = group
    ? c.teams.filter((_, i) => i % 2 === (group === "A" ? 0 : 1))
    : c.teams;
  const stats = new Map(
    teams.map((teamName) => [
      teamName,
      {
        position: 0,
        teamName,
        played: 0,
        won: 0,
        lost: 0,
        setsWon: 0,
        setsLost: 0,
        points: 0,
        streak: "",
      },
    ]),
  );
  for (const f of fixtures.filter(
    (f) =>
      f.competitionId === c.id &&
      f.stage === 0 &&
      (!group || f.group === group) &&
      f.status === "finished",
  )) {
    const hs = f.scoreHomeSets!,
      as = f.scoreAwaySets!;
    for (const [name, own, other] of [
      [f.homeTeam, hs, as],
      [f.awayTeam, as, hs],
    ] as const) {
      const s = stats.get(name);
      if (!s) continue;
      const win = own > other;
      s.played++;
      s.won += Number(win);
      s.lost += Number(!win);
      s.setsWon += own;
      s.setsLost += other;
      s.points +=
        c.pointsSystem === "2-1"
          ? win
            ? 2
            : 1
          : win
            ? other === 2
              ? 2
              : 3
            : own === 2
              ? 1
              : 0;
      s.streak = (s.streak + (win ? "G" : "P")).slice(-5);
    }
  }
  return [...stats.values()]
    .sort(
      (a, b) =>
        compareStanding(a, b) ||
        (c.tieBreakOrder
          ? c.tieBreakOrder.indexOf(a.teamName) -
            c.tieBreakOrder.indexOf(b.teamName)
          : a.teamName.localeCompare(b.teamName)),
    )
    .map((s, i) => ({ ...s, position: i + 1 }));
}
export function recordCompetitionResult(
  data: CompetitionData,
  id: string,
  home: number,
  away: number,
): CompetitionData {
  if (!validSetResult(home, away))
    throw new Error(
      "Al mejor de 5: un equipo debe ganar 3 sets y el otro entre 0 y 2.",
    );
  const match = data.fixtures.find((f) => f.id === id),
    c = data.competitions.find((c) => c.id === match?.competitionId);
  if (!match || !c || c.status === "finished" || match.stage !== c.stage)
    throw new Error(
      "Esta fase está cerrada. No se pueden modificar cruces que ya tienen una fase posterior.",
    );
  return {
    ...data,
    competitions: data.competitions.map((v) =>
      v.id === c.id ? { ...v, tieBreakOrder: undefined } : v,
    ),
    fixtures: data.fixtures.map((f) =>
      f.id === id
        ? { ...f, scoreHomeSets: home, scoreAwaySets: away, status: "finished" }
        : f,
    ),
  };
}
export function advanceCompetition(
  data: CompetitionData,
  id: string,
  date = new Date().toISOString().slice(0, 10),
): CompetitionData {
  const old = data.competitions.find((c) => c.id === id);
  if (!old || old.status === "finished")
    throw new Error("El torneo no tiene una fase pendiente.");
  const played = data.fixtures.filter(
    (f) => f.competitionId === id && f.stage === old.stage,
  );
  if (!played.length || played.some((f) => f.status !== "finished"))
    throw new Error(
      "Cargá todos los resultados de esta fase antes de continuar.",
    );
  let teams: string[];
  if (old.format === "round_robin") {
    const ranking = competitionStandings(old, data.fixtures);
    if (!old.tieBreakOrder && compareStanding(ranking[0], ranking[1]) === 0)
      throw new Error(
        "Hay un empate por el primer puesto. Confirmá el orden de desempate en Posiciones según el reglamento.",
      );
    teams = [ranking[0].teamName];
  } else if (old.format === "groups_playoffs" && old.stage === 0) {
    const a = competitionStandings(old, data.fixtures, "A"),
      b = competitionStandings(old, data.fixtures, "B");
    const tied = (rows: StandingEntry[]) =>
      !old.tieBreakOrder &&
      ((rows.length > 2 && compareStanding(rows[1], rows[2]) === 0) ||
        compareStanding(rows[0], rows[1]) === 0);
    if (tied(a) || tied(b))
      throw new Error(
        "Hay un empate en el corte de clasificación. Debe resolverse con el reglamento del torneo antes de generar semifinales.",
      );
    teams = [a[0].teamName, b[1].teamName, b[0].teamName, a[1].teamName];
  } else
    teams = [
      ...played.map((f) =>
        f.scoreHomeSets! > f.scoreAwaySets! ? f.homeTeam : f.awayTeam,
      ),
      ...old.byeTeams,
    ];
  const c: Tournament = { ...old, byeTeams: [] };
  let added: TournamentFixture[] = [];
  if (teams.length === 1) {
    c.status = "finished";
    c.champion = teams[0];
    c.endDate = date;
  } else {
    c.stage++;
    added = knockout(c, teams);
  }
  return {
    ...data,
    competitions: data.competitions.map((v) => (v.id === id ? c : v)),
    fixtures: [...data.fixtures, ...added],
  };
}

export function setCompetitionTieBreak(
  data: CompetitionData,
  id: string,
  order: string[],
): CompetitionData {
  const c = data.competitions.find((c) => c.id === id);
  if (
    !c ||
    c.status === "finished" ||
    c.stage !== 0 ||
    order.length !== c.teams.length ||
    new Set(order).size !== c.teams.length ||
    !order.every((t) => c.teams.includes(t))
  )
    throw new Error(
      "El orden de desempate debe incluir todos los equipos de la fase inicial una sola vez.",
    );
  return {
    ...data,
    competitions: data.competitions.map((v) =>
      v.id === id ? { ...v, tieBreakOrder: [...order] } : v,
    ),
  };
}
