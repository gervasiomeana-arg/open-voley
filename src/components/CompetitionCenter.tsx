import React, { useEffect, useState } from "react";
import { Plus, Trophy, X } from "lucide-react";
import {
  advanceCompetition,
  CompetitionData,
  competitionStandings,
  createTournament,
  emptyCompetitions,
  recordCompetitionResult,
  setCompetitionTieBreak,
  Tournament,
} from "../shared/competitions";
import {
  readCompetitions,
  writeCompetitions,
} from "../services/competitionStorage";
import { getStorageUser, userStorage } from "../services/userStorage";
import type { SavedTeam } from "../services/teamStorage";

interface CompetitionCenterProps {
  onOpenMatch?: (matchId: string) => void;
  onOpenTeamRoster?: (teamName: string) => void;
  isWizardOpenExternal?: boolean;
  onCloseWizardExternal?: () => void;
}
const formats = {
  round_robin: "Todos contra todos",
  single_elimination: "Eliminación directa",
  groups_playoffs: "Dos zonas + semifinales y final",
};
const field =
  "w-full rounded-lg border border-slate-600 bg-slate-950 p-2 text-white";
const button =
  "rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-bold disabled:opacity-40";
export const CompetitionCenter: React.FC<CompetitionCenterProps> = ({
  onOpenTeamRoster,
  isWizardOpenExternal = false,
  onCloseWizardExternal,
}) => {
  const [data, setData] = useState<CompetitionData>(emptyCompetitions),
    [teams, setTeams] = useState<SavedTeam[]>([]),
    [activeId, setActiveId] = useState("");
  const [error, setError] = useState(""),
    [loaded, setLoaded] = useState(false),
    [notice, setNotice] = useState("");
  const [open, setOpen] = useState(isWizardOpenExternal),
    [tab, setTab] = useState<"fixture" | "tabla" | "equipos">("fixture");
  const [name, setName] = useState(""),
    [category, setCategory] = useState("Primera División"),
    [gender, setGender] = useState<Tournament["gender"]>("Femenino");
  const [format, setFormat] = useState<Tournament["format"]>("round_robin"),
    [points, setPoints] = useState<Tournament["pointsSystem"]>("3-1"),
    [courts, setCourts] = useState(1),
    [selected, setSelected] = useState<string[]>([]);
  const [tieOrder, setTieOrder] = useState<string[]>([]),
    [resultId, setResultId] = useState(""),
    [home, setHome] = useState(3),
    [away, setAway] = useState(0);
  const close = () => {
    setOpen(false);
    onCloseWizardExternal?.();
  };
  useEffect(() => {
    if (isWizardOpenExternal) setOpen(true);
  }, [isWizardOpenExternal]);
  useEffect(() => {
    const refresh = () => {
      try {
        const stored = readCompetitions();
        const raw = JSON.parse(
          userStorage.getItem("openvoley_saved_teams_v1") || "[]",
        );
        if (!Array.isArray(raw))
          throw new Error("No se pudo leer la biblioteca de equipos.");
        setData(stored);
        setTeams(raw);
        setLoaded(true);
        setError("");
        setResultId("");
        setSelected([]);
      } catch (e) {
        setLoaded(false);
        setError(
          e instanceof Error ? e.message : "No se pudieron cargar los torneos.",
        );
      }
    };
    refresh();
    window.addEventListener("openvoley:cloud-hydrated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("openvoley:cloud-hydrated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const active =
    data.competitions.find((c) => c.id === activeId) || data.competitions[0];
  const fixtures = data.fixtures.filter((f) => f.competitionId === active?.id);
  // Read again at mutation time so a restored/cloud-hydrated version is never replaced by stale React state.
  function change(edit: (current: CompetitionData) => CompetitionData) {
    try {
      if (!loaded || getStorageUser() === "guest")
        throw new Error("Ingresá con tu cuenta antes de guardar un torneo.");
      const next = edit(readCompetitions());
      writeCompetitions(next);
      setData(next);
      setError("");
      setNotice(
        "Cambio guardado en este dispositivo. Consultá el indicador de nube para confirmar la sincronización.",
      );
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo guardar el torneo.",
      );
      return false;
    }
  }
  function create(event: React.FormEvent) {
    event.preventDefault();
    const ownTeams: SavedTeam[] = JSON.parse(
      userStorage.getItem("openvoley_saved_teams_v1") || "[]",
    );
    const chosen = selected
      .map((id) => ownTeams.find((t) => t.id === id))
      .filter((t): t is SavedTeam => !!t);
    const id = `comp_${crypto.randomUUID()}`;
    if (
      change((current) => {
        const added = createTournament({
          id,
          name: name.trim(),
          category: category.trim(),
          gender,
          format,
          teams: chosen.map((t) => t.name),
          teamIds: chosen.map((t) => t.id),
          courtsCount: courts,
          pointsSystem: points,
          startDate: new Date().toISOString().slice(0, 10),
        });
        return {
          ...current,
          competitions: [...added.competitions, ...current.competitions],
          fixtures: [...current.fixtures, ...added.fixtures],
        };
      })
    ) {
      setActiveId(id);
      setSelected([]);
      setName("");
      close();
    }
  }
  function table(group?: "A" | "B") {
    if (!active) return null;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="py-3 text-left font-bold">
            {group ? `Zona ${group}` : "Tabla de posiciones"} ·{" "}
            {pointsLabel(active.pointsSystem)}
          </caption>
          <thead>
            <tr>
              {["#", "Equipo", "PJ", "PG", "PP", "SF", "SC", "Pts"].map((h) => (
                <th className="p-2" key={h}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {competitionStandings(active, data.fixtures, group).map((row) => (
              <tr className="border-t border-slate-700" key={row.teamName}>
                {[
                  row.position,
                  row.teamName,
                  row.played,
                  row.won,
                  row.lost,
                  row.setsWon,
                  row.setsLost,
                  row.points,
                ].map((v, i) => (
                  <td className="p-2" key={i}>
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <section className="space-y-4 text-slate-100" aria-label="Competiciones">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-black">
          <Trophy className="text-amber-400" />
          Competiciones
        </h2>
        <button
          disabled={!loaded}
          className={button}
          onClick={() => setOpen(true)}
        >
          <Plus className="inline w-4" /> Nuevo torneo
        </button>
      </header>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-500 p-3 text-red-200"
        >
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-slate-300">
          {notice}
        </p>
      )}
      {loaded && !active && (
        <div className="rounded-2xl border border-slate-700 p-6">
          <h3 className="font-bold">Todavía no creaste torneos</h3>
          <p className="mt-2 text-slate-300">
            Seleccioná equipos de tu biblioteca para generar el fixture. Los
            resultados y las tablas se guardan en tu cuenta.
          </p>
        </div>
      )}
      {active && (
        <>
          <label className="block">
            Torneo
            <select
              className={field}
              value={active.id}
              onChange={(e) => {
                setActiveId(e.target.value);
                setResultId("");
              }}
            >
              {data.competitions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ·{" "}
                  {c.status === "finished" ? "Finalizado" : "En curso"}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-xl bg-slate-900 p-4">
            <h3 className="font-bold">{active.name}</h3>
            <p className="text-sm text-slate-300">
              {active.category} · {active.gender} · {formats[active.format]} ·{" "}
              {active.teamsCount} equipos
            </p>
            {active.champion && (
              <p className="mt-2 text-amber-300">
                Primer puesto: {active.champion}
              </p>
            )}
            <p className="mt-2 text-xs text-slate-400">
              Partidos al mejor de 5 sets. Desempates de tabla: puntos,
              victorias y cociente de sets. Los empates sin resolver requieren
              aplicar el reglamento antes de cerrar la fase.
            </p>
          </div>
          <nav
            className="flex flex-wrap gap-2"
            aria-label="Secciones del torneo"
          >
            {(["fixture", "tabla", "equipos"] as const).map((t) => (
              <button
                aria-pressed={tab === t}
                className={`${button} ${tab === t ? "text-amber-300" : ""}`}
                key={t}
                onClick={() => setTab(t)}
              >
                {t === "fixture"
                  ? "Fixture"
                  : t === "tabla"
                    ? "Posiciones"
                    : "Equipos"}
              </button>
            ))}
          </nav>
          {tab === "fixture" && (
            <div className="space-y-3">
              {active.byeTeams.length > 0 && (
                <p className="text-sm text-amber-200">
                  Pasa libre en esta fase: {active.byeTeams.join(", ")}.
                </p>
              )}
              {fixtures.map((f) => (
                <article
                  key={f.id}
                  className="rounded-xl border border-slate-700 bg-slate-900 p-3"
                >
                  <p className="text-xs text-slate-400">
                    {f.roundName} · {f.court}
                  </p>
                  <div className="my-2 flex flex-wrap items-center justify-between gap-2">
                    <strong className="min-w-0 break-words">
                      {f.homeTeam} — {f.awayTeam}
                    </strong>
                    <span>
                      {f.status === "finished"
                        ? `${f.scoreHomeSets} – ${f.scoreAwaySets}`
                        : "Pendiente"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="text-xs">
                      Fecha
                      <input
                        aria-label={`Fecha ${f.homeTeam} vs ${f.awayTeam}`}
                        type="date"
                        className={field}
                        value={f.date}
                        disabled={
                          active.status === "finished" ||
                          f.stage !== active.stage
                        }
                        onChange={(e) => {
                          const date = e.target.value;
                          change((d) => ({
                            ...d,
                            fixtures: d.fixtures.map((v) =>
                              v.id === f.id ? { ...v, date } : v,
                            ),
                          }));
                        }}
                      />
                    </label>
                    <label className="text-xs">
                      Hora
                      <input
                        type="time"
                        className={field}
                        value={f.time}
                        disabled={
                          active.status === "finished" ||
                          f.stage !== active.stage
                        }
                        onChange={(e) => {
                          const time = e.target.value;
                          change((d) => ({
                            ...d,
                            fixtures: d.fixtures.map((v) =>
                              v.id === f.id ? { ...v, time } : v,
                            ),
                          }));
                        }}
                      />
                    </label>
                    {active.status !== "finished" &&
                      f.stage === active.stage && (
                        <button
                          className={button}
                          onClick={() => {
                            setResultId(f.id);
                            setHome(f.scoreHomeSets ?? 3);
                            setAway(f.scoreAwaySets ?? 0);
                          }}
                        >
                          Cargar / corregir resultado
                        </button>
                      )}
                  </div>
                  {resultId === f.id && (
                    <form
                      className="mt-3 flex flex-wrap items-end gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (
                          change((d) =>
                            recordCompetitionResult(d, f.id, home, away),
                          )
                        )
                          setResultId("");
                      }}
                    >
                      <label>
                        Sets {f.homeTeam}
                        <input
                          className={field}
                          type="number"
                          min="0"
                          max="3"
                          value={home}
                          onChange={(e) => setHome(Number(e.target.value))}
                        />
                      </label>
                      <label>
                        Sets {f.awayTeam}
                        <input
                          className={field}
                          type="number"
                          min="0"
                          max="3"
                          value={away}
                          onChange={(e) => setAway(Number(e.target.value))}
                        />
                      </label>
                      <button className={button} type="submit">
                        Guardar resultado
                      </button>
                      <button
                        className={button}
                        type="button"
                        onClick={() => setResultId("")}
                      >
                        Cancelar
                      </button>
                    </form>
                  )}
                </article>
              ))}
              {active.status !== "finished" && (
                <button
                  className={button}
                  onClick={() => {
                    if (
                      window.confirm(
                        "¿Cerrar esta fase con los resultados cargados? Después no se podrán corregir sus resultados.",
                      )
                    )
                      change((d) => advanceCompetition(d, active.id));
                  }}
                >
                  {active.format === "round_robin"
                    ? "Cerrar torneo"
                    : "Cerrar fase / generar siguiente cruce"}
                </button>
              )}
            </div>
          )}
          {tab === "tabla" &&
            active.stage === 0 &&
            active.status !== "finished" &&
            active.format !== "single_elimination" && (
              <details className="rounded-lg border border-slate-700 p-3">
                <summary
                  onClick={() =>
                    setTieOrder(active.tieBreakOrder || active.teams)
                  }
                >
                  Desempates según el reglamento
                </summary>
                <p className="my-2 text-sm">
                  Ordená los equipos de mayor a menor prioridad y confirmá. Este
                  orden sólo decide posiciones con iguales puntos, victorias y
                  cociente de sets. Corregir un resultado borra esta
                  confirmación.
                </p>
                {tieOrder.map((t, i) => (
                  <div key={t} className="flex items-center gap-2 py-1">
                    <span className="flex-1">
                      {i + 1}. {t}
                    </span>
                    <button
                      className={button}
                      disabled={i === 0}
                      onClick={() =>
                        setTieOrder((v) => {
                          const n = [...v];
                          [n[i - 1], n[i]] = [n[i], n[i - 1]];
                          return n;
                        })
                      }
                      aria-label={`Subir ${t}`}
                    >
                      ↑
                    </button>
                  </div>
                ))}
                <button
                  className={button}
                  disabled={tieOrder.length !== active.teams.length}
                  onClick={() => {
                    if (
                      window.confirm(
                        "¿Confirmar este orden para resolver los empates conforme al reglamento del torneo?",
                      )
                    )
                      change((d) =>
                        setCompetitionTieBreak(d, active.id, tieOrder),
                      );
                  }}
                >
                  Confirmar desempates
                </button>
                {active.tieBreakOrder && (
                  <p className="text-emerald-300">Orden confirmado.</p>
                )}
              </details>
            )}
          {tab === "tabla" &&
            (active.format === "single_elimination" ? (
              <p>
                Este formato se define por los cruces del fixture, sin tabla por
                puntos.
              </p>
            ) : active.format === "groups_playoffs" ? (
              <>
                {table("A")}
                {table("B")}
              </>
            ) : (
              table()
            ))}
          {tab === "equipos" && (
            <ul className="space-y-2">
              {active.teams.map((team, i) => (
                <li
                  className="rounded-lg bg-slate-900 p-3"
                  key={active.teamIds[i]}
                >
                  {team}
                  {onOpenTeamRoster && (
                    <button
                      className={`${button} ml-3`}
                      onClick={() => onOpenTeamRoster(team)}
                    >
                      Ver planteles
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {open && (
        <div
          className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="competition-title"
        >
          <form
            onSubmit={create}
            className="mx-auto my-4 max-w-2xl space-y-4 rounded-2xl border border-slate-600 bg-slate-900 p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 id="competition-title" className="text-xl font-bold">
                Nuevo torneo
              </h3>
              <button type="button" aria-label="Cerrar" onClick={close}>
                <X />
              </button>
            </div>
            {error && (
              <p role="alert" className="text-red-200">
                {error}
              </p>
            )}
            <label className="block">
              Nombre
              <input
                required
                maxLength={200}
                className={field}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                Categoría
                <input
                  required
                  maxLength={200}
                  className={field}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </label>
              <label>
                Rama
                <select
                  className={field}
                  value={gender}
                  onChange={(e) =>
                    setGender(e.target.value as Tournament["gender"])
                  }
                >
                  {["Femenino", "Masculino", "Mixto"].map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block">
              Formato
              <select
                className={field}
                value={format}
                onChange={(e) =>
                  setFormat(e.target.value as Tournament["format"])
                }
              >
                {Object.entries(formats).map(([id, title]) => (
                  <option value={id} key={id}>
                    {title}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-sm text-slate-300">
              {format === "groups_playoffs"
                ? "Se alternan los equipos seleccionados entre zonas A y B. Clasifican los dos mejores de cada zona: A1–B2 y B1–A2."
                : format === "single_elimination"
                  ? "Los cruces siguen el orden de selección. Los pases libres necesarios para completar la llave se asignan a los últimos equipos seleccionados en la primera fase."
                  : "Una rueda: cada equipo juega una vez contra cada rival."}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                Canchas
                <input
                  type="number"
                  min="1"
                  max="32"
                  required
                  className={field}
                  value={courts}
                  onChange={(e) => setCourts(Number(e.target.value))}
                />
              </label>
              <label>
                Puntuación
                <select
                  className={field}
                  value={points}
                  onChange={(e) =>
                    setPoints(e.target.value as Tournament["pointsSystem"])
                  }
                >
                  <option value="3-1">3/0 en 3–0 o 3–1; 2/1 en 3–2</option>
                  <option value="2-1">2 al ganador; 1 al perdedor</option>
                </select>
              </label>
            </div>
            <fieldset>
              <legend className="font-bold">
                Equipos registrados · {selected.length} seleccionados
              </legend>
              <p className="my-2 text-xs text-slate-300">
                Elegí entre 2 y 32 equipos (mínimo 4 para zonas). Los nombres
                deben ser distintos; podés diferenciarlos por categoría en la
                biblioteca.
              </p>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {teams.map((t) => (
                  <label
                    key={t.id}
                    className="flex items-center gap-3 rounded-lg bg-slate-800 p-3"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(t.id)}
                      onChange={(e) =>
                        setSelected((v) =>
                          e.target.checked
                            ? [...v, t.id]
                            : v.filter((id) => id !== t.id),
                        )
                      }
                    />
                    <span>
                      {t.name} · {t.category} · {t.gender}
                      {selected.includes(t.id)
                        ? ` · Orden ${selected.indexOf(t.id) + 1}`
                        : ""}
                    </span>
                  </label>
                ))}
              </div>
              {!teams.length && (
                <p>Primero cargá los equipos en Equipos y Planteles.</p>
              )}
            </fieldset>
            <div className="flex gap-2">
              <button type="button" className={button} onClick={close}>
                Cancelar
              </button>
              <button
                disabled={
                  !loaded ||
                  selected.length < (format === "groups_playoffs" ? 4 : 2) ||
                  selected.length > 32
                }
                className="rounded-lg bg-amber-400 px-4 py-2 font-bold text-slate-950"
                type="submit"
              >
                Crear torneo y fixture
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};
function pointsLabel(system: Tournament["pointsSystem"]) {
  return system === "3-1"
    ? "3/0 o 2/1 según sets"
    : "2 al ganador, 1 al perdedor";
}
