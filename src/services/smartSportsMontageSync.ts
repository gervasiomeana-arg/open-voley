import { SmartSportsMontage } from '../types';
import {
  getSavedSmartSportsMontages,
  saveSmartSportsMontage,
  deleteSmartSportsMontage,
} from './smartSportsMontageStorage';

function replaceLocalMontages(montages: SmartSportsMontage[]) {
  try {
    localStorage.setItem('openvoley_smart_sports_montages_v1', JSON.stringify(montages));
  } catch (error) {
    console.error('Error replacing smart sports montages:', error);
  }
}

export async function fetchServerMontages(): Promise<SmartSportsMontage[]> {
  try {
    const response = await fetch('/api/smart-sports-montages', {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data?.montages) ? data.montages : [];
  } catch {
    return [];
  }
}

export async function pushMontageToServer(montage: SmartSportsMontage): Promise<boolean> {
  try {
    const response = await fetch(`/api/smart-sports-montages/${encodeURIComponent(montage.id)}`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(montage),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function deleteMontageFromServer(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/smart-sports-montages/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function syncSmartSportsMontages(): Promise<SmartSportsMontage[]> {
  const local = getSavedSmartSportsMontages();
  const remote = await fetchServerMontages();
  const byId = new Map<string, SmartSportsMontage>();
  remote.forEach((item) => byId.set(item.id, item));
  local.forEach((item) => {
    const remoteItem = byId.get(item.id);
    if (!remoteItem || String(item.updatedAt) >= String(remoteItem.updatedAt)) byId.set(item.id, item);
  });
  const merged = [...byId.values()].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  await Promise.all(local.map((item) => pushMontageToServer(item)));
  replaceLocalMontages(merged);
  return merged;
}

export function saveMontageLocallyFirst(montage: SmartSportsMontage) {
  const updated = saveSmartSportsMontage(montage);
  void pushMontageToServer(montage);
  return updated;
}

export async function publishMontageConfirmed(montage: SmartSportsMontage): Promise<{ ok: boolean; montages: SmartSportsMontage[] }> {
  const updated = saveSmartSportsMontage(montage);
  const ok = await pushMontageToServer(montage);
  return { ok, montages: updated };
}

export function deleteMontageLocallyFirst(id: string) {
  const updated = deleteSmartSportsMontage(id);
  void deleteMontageFromServer(id);
  return updated;
}
