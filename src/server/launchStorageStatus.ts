import { cloudRpc, durableStorageEnabled } from './supabaseStore';
import { getTrainingRepositoryStatus } from './trainingRepository';

export async function getLaunchStorageStatus() {
  const status = getTrainingRepositoryStatus();
  if (!durableStorageEnabled()) return { ...status, verified: false, durable: false };
  try {
    const ready = await cloudRpc<{ schemaVersion: number; durable: boolean; backups: boolean }>('ov_storage_ready', {});
    const verified = ready.schemaVersion === 1 && ready.durable === true && ready.backups === true;
    return { ...status, healthy: verified, verified, durable: verified };
  } catch {
    return { ...status, healthy: false, verified: false, durable: false };
  }
}
