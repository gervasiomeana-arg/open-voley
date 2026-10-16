import assert from "node:assert/strict";
import {
  advanceCompetition,
  CompetitionData,
  competitionStandings,
  COMPETITIONS_KEY,
  createTournament,
  recordCompetitionResult,
  setCompetitionTieBreak,
  validateCompetitionData,
} from "./competitions";
import { validateCloudValue } from "./userDataSchema";
function create(
  n = 4,
  format:
    "round_robin" | "single_elimination" | "groups_playoffs" = "round_robin",
  pointsSystem: "3-1" | "2-1" = "3-1",
) {
  return createTournament({
    id: "test",
    name: "Torneo real",
    category: "Sub 18",
    gender: "Mixto",
    format,
    teams: Array.from({ length: n }, (_, i) => `Equipo ${i + 1}`),
    teamIds: Array.from({ length: n }, (_, i) => `team-${i + 1}`),
    courtsCount: 2,
    pointsSystem,
    startDate: "2026-10-16",
  });
}
for (let n = 2; n <= 32; n++) {
  const d = create(n);
  assert.equal(d.fixtures.length, (n * (n - 1)) / 2);
  assert.equal(
    new Set(d.fixtures.map((f) => [f.homeTeam, f.awayTeam].sort().join("|")))
      .size,
    d.fixtures.length,
  );
  for (const round of new Set(d.fixtures.map((f) => f.roundName))) {
    const names = d.fixtures
      .filter((f) => f.roundName === round)
      .flatMap((f) => [f.homeTeam, f.awayTeam]);
    assert.equal(new Set(names).size, names.length);
  }
  let k = create(n, "single_elimination");
  let cycles = 0;
  while (k.competitions[0].status !== "finished") {
    assert.ok(++cycles < 10);
    const current = k.fixtures.filter(
      (f) => f.stage === k.competitions[0].stage,
    );
    for (const f of current) k = recordCompetitionResult(k, f.id, 3, 0);
    k = advanceCompetition(k, "test");
    assert.ok(validateCompetitionData(k));
  }
  assert.equal(k.fixtures.length, n - 1);
  assert.ok(k.competitions[0].champion);
  assert.throws(() => recordCompetitionResult(k, k.fixtures[0].id, 0, 3));
}
let d = create(2);
assert.throws(() => advanceCompetition(d, "test"));
for (const pair of [
  [3, 3],
  [2, 1],
  [-1, 3],
  [3, 2.5],
  [4, 0],
])
  assert.throws(() =>
    recordCompetitionResult(d, d.fixtures[0].id, ...(pair as [number, number])),
  );
d = recordCompetitionResult(d, d.fixtures[0].id, 3, 2);
assert.deepEqual(
  competitionStandings(d.competitions[0], d.fixtures).map((s) => s.points),
  [2, 1],
);
d = recordCompetitionResult(d, d.fixtures[0].id, 3, 0);
assert.deepEqual(
  competitionStandings(d.competitions[0], d.fixtures).map((s) => s.points),
  [3, 0],
);
d = create(2, "round_robin", "2-1");
d = recordCompetitionResult(d, d.fixtures[0].id, 3, 0);
assert.deepEqual(
  competitionStandings(d.competitions[0], d.fixtures).map((s) => s.points),
  [2, 1],
);
// A three-way tie must not silently choose a champion alphabetically.
d = create(3);
const cycle = [
  ["Equipo 1", "Equipo 2"],
  ["Equipo 2", "Equipo 3"],
  ["Equipo 3", "Equipo 1"],
];
for (const f of d.fixtures) {
  const win = cycle.some(([a, b]) => a === f.homeTeam && b === f.awayTeam);
  d = recordCompetitionResult(d, f.id, win ? 3 : 0, win ? 0 : 3);
}
assert.throws(() => advanceCompetition(d, "test"), /empate/);
assert.throws(() =>
  setCompetitionTieBreak(d, "test", ["Equipo 1", "Equipo 1", "Equipo 2"]),
);
d = setCompetitionTieBreak(d, "test", ["Equipo 3", "Equipo 2", "Equipo 1"]);
assert.equal(
  advanceCompetition(d, "test").competitions[0].champion,
  "Equipo 3",
);
assert.equal(
  recordCompetitionResult(d, d.fixtures[0].id, 3, 0).competitions[0]
    .tieBreakOrder,
  undefined,
);
for (let n = 4; n <= 12; n++) {
  let g = create(n, "groups_playoffs");
  for (const f of g.fixtures) g = recordCompetitionResult(g, f.id, 3, 0);
  g = setCompetitionTieBreak(g, "test", g.competitions[0].teams);
  g = advanceCompetition(g, "test");
  const semis = g.fixtures.filter((f) => f.stage === 1);
  assert.equal(semis.length, 2);
  assert.throws(
    () => recordCompetitionResult(g, g.fixtures[0].id, 3, 2),
    /fase/,
  );
  const winners = semis.map((f) => f.awayTeam);
  for (const f of semis) g = recordCompetitionResult(g, f.id, 0, 3);
  g = advanceCompetition(g, "test");
  const final = g.fixtures.filter((f) => f.stage === 2);
  assert.equal(final.length, 1);
  assert.deepEqual([final[0].homeTeam, final[0].awayTeam], winners);
  g = recordCompetitionResult(g, final[0].id, 3, 1);
  g = advanceCompetition(g, "test");
  assert.equal(g.competitions[0].champion, winners[0]);
  assert.ok(validateCloudValue(COMPETITIONS_KEY, g));
}
assert.ok(validateCloudValue(COMPETITIONS_KEY, create()));
const bad: CompetitionData = structuredClone(create());
bad.fixtures[0].competitionId = "another-account";
assert.equal(validateCompetitionData(bad), false);
assert.equal(
  validateCompetitionData({
    ...create(),
    fixtures: [
      {
        ...create().fixtures[0],
        scoreHomeSets: 3,
        scoreAwaySets: 3,
        status: "finished",
      },
    ],
  }),
  false,
);
console.log(
  "Competitions: schedules 2–32, odd byes, all formats, results, standings, ties and validation passed.",
);
