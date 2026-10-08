import { useEffect, useState } from 'react';
import { EvaluationSymbol } from '../types';

export const EVALUATIONS: EvaluationSymbol[] = ['#', '+', '!', '-', '/', '='];
export interface ScoutButtonPreferences {
  keys: Record<EvaluationSymbol, string>;
  order: EvaluationSymbol[];
}
export const DEFAULT_SCOUT_BUTTONS: ScoutButtonPreferences = {
  keys: { '#': 'P', '+': 'C', '!': 'N', '-': '-', '/': '/', '=': 'X' },
  order: EVALUATIONS,
};
const STORAGE_KEY = 'openvoley.scoutButtons.v1';
const CHANGE_EVENT = 'openvoley:scoutButtons';

export function validateScoutButtons(value: ScoutButtonPreferences): string | null {
  const used = new Set<string>();
  for (const symbol of EVALUATIONS) {
    const key = value.keys[symbol]?.trim().toUpperCase();
    if (!key || key.length !== 1) return 'Elegí una tecla por evaluación.';
    if (!/^[A-Z#+!\-/=]$/.test(key)) return 'Usá una letra o el símbolo de la evaluación.';
    if ('ASREBD'.includes(key)) return `La tecla ${key} está reservada para un fundamento.`;
    if (EVALUATIONS.includes(key as EvaluationSymbol) && key !== symbol) return `El símbolo ${key} está reservado para su propia evaluación.`;
    if (used.has(key)) return `La tecla ${key} está repetida.`;
    used.add(key);
  }
  if (value.order.length !== EVALUATIONS.length || new Set(value.order).size !== EVALUATIONS.length || value.order.some(s => !EVALUATIONS.includes(s))) return 'El orden debe incluir las seis evaluaciones.';
  return null;
}

export function readScoutButtons(): ScoutButtonPreferences {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (value && !validateScoutButtons(value)) return value;
  } catch { /* Invalid or unavailable storage uses defaults. */ }
  return DEFAULT_SCOUT_BUTTONS;
}

export function saveScoutButtons(value: ScoutButtonPreferences): void {
  const error = validateScoutButtons(value);
  if (error) throw new Error(error);
  const normalized = { ...value, keys: Object.fromEntries(EVALUATIONS.map(s => [s, value.keys[s].trim().toUpperCase()])) };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useScoutButtons(): ScoutButtonPreferences {
  const [value, setValue] = useState(readScoutButtons);
  useEffect(() => {
    const refresh = () => setValue(readScoutButtons());
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  return value;
}

export function evaluationForKey(key: string, preferences: ScoutButtonPreferences): EvaluationSymbol | undefined {
  return EVALUATIONS.find(symbol => key === symbol || key.toUpperCase() === preferences.keys[symbol]);
}
