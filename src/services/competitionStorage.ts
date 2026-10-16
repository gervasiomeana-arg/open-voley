import {
  COMPETITIONS_KEY,
  CompetitionData,
  emptyCompetitions,
  validateCompetitionData,
} from "../shared/competitions";
import { userStorage } from "./userStorage";
export function readCompetitions(): CompetitionData {
  const raw = userStorage.getItem(COMPETITIONS_KEY);
  if (raw === null) return emptyCompetitions();
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error(
      "No se pudieron leer los torneos guardados. Revisá los respaldos de esta sección; no se reemplazaron tus datos.",
    );
  }
  if (!validateCompetitionData(value))
    throw new Error(
      "Los torneos guardados requieren revisión. No se reemplazaron tus datos.",
    );
  return value;
}
export function writeCompetitions(value: CompetitionData) {
  if (!validateCompetitionData(value))
    throw new Error("No se guardaron cambios: datos de competición inválidos.");
  userStorage.setItem(COMPETITIONS_KEY, JSON.stringify(value));
  window.dispatchEvent(new Event("openvoley:competitions-changed"));
}
