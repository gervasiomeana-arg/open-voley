import { SmartSportsMontage } from '../types';

export const SMART_SPORTS_MONTAGES_KEY = 'openvoley_smart_sports_montages_v1';

function isMontage(value: unknown): value is SmartSportsMontage {
  if (!value || typeof value !== 'object') return false;
  const montage = value as Partial<SmartSportsMontage>;
  return Boolean(
    typeof montage.id === 'string' &&
    typeof montage.name === 'string' &&
    typeof montage.matchId === 'string' &&
    typeof montage.matchTitle === 'string' &&
    typeof montage.createdAt === 'string' &&
    typeof montage.updatedAt === 'string' &&
    typeof montage.preRoll === 'number' &&
    typeof montage.postRoll === 'number' &&
    Array.isArray(montage.actionIds)
  );
}

export function getSavedSmartSportsMontages(): SmartSportsMontage[] {
  try {
    const raw = localStorage.getItem(SMART_SPORTS_MONTAGES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isMontage);
  } catch (error) {
    console.warn('Error reading smart sports montages:', error);
    return [];
  }
}

export function saveSmartSportsMontage(montage: SmartSportsMontage): SmartSportsMontage[] {
  const current = getSavedSmartSportsMontages();
  const updated = current.some((item) => item.id === montage.id)
    ? current.map((item) => (item.id === montage.id ? montage : item))
    : [montage, ...current];

  try {
    localStorage.setItem(SMART_SPORTS_MONTAGES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving smart sports montage:', error);
  }
  return updated;
}

export function deleteSmartSportsMontage(id: string): SmartSportsMontage[] {
  const updated = getSavedSmartSportsMontages().filter((item) => item.id !== id);
  try {
    localStorage.setItem(SMART_SPORTS_MONTAGES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error deleting smart sports montage:', error);
  }
  return updated;
}
