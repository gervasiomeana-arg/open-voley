import assert from "node:assert/strict";
import { createTournament, COMPETITIONS_KEY } from "../shared/competitions";
import { readCompetitions, writeCompetitions } from "./competitionStorage";
import { userStorage, setStorageUser } from "./userStorage";
import {
  exportCurrentData,
  inspectBackup,
  recoverItems,
} from "./legacyRecovery";
class MemoryStorage {
  data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null;
  }
}
Object.assign(globalThis, {
  localStorage: new MemoryStorage(),
  window: new EventTarget(),
});
const tournament = createTournament({
  id: "real",
  name: "Liga",
  category: "Primera",
  gender: "Femenino",
  format: "round_robin",
  teams: ["Local", "Rival"],
  teamIds: ["a", "b"],
  courtsCount: 1,
  pointsSystem: "3-1",
  startDate: "2026-10-16",
});
setStorageUser("owner-a");
writeCompetitions(tournament);
assert.deepEqual(readCompetitions(), tournament);
const backup = exportCurrentData();
assert.ok(backup.items.some((v) => v.key === COMPETITIONS_KEY));
setStorageUser("owner-b");
assert.equal(readCompetitions().competitions.length, 0);
// Explicit import is reviewed/confirmed by the account owner, unlike automatic cross-account recovery.
assert.throws(() => recoverItems(inspectBackup(JSON.stringify(backup)), false));
recoverItems(inspectBackup(JSON.stringify(backup)), true);
assert.deepEqual(readCompetitions(), tournament);
userStorage.setItem(COMPETITIONS_KEY, "{broken");
assert.throws(() => readCompetitions());
assert.equal(userStorage.getItem(COMPETITIONS_KEY), "{broken");
setStorageUser("owner-a");
assert.deepEqual(readCompetitions(), tournament);
console.log(
  "Competition storage: account isolation, reload, full export/import and no overwrite on corruption passed.",
);
