import type { ClientUser, TrialInfo } from '../types';

export interface AuthSession {
  user: ClientUser;
  trial: TrialInfo;
}

export async function getAuthenticatedSession(): Promise<AuthSession | null> {
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (response.status === 401) return null;
    if (!response.ok) throw new Error(`Session check failed (${response.status})`);

    const data = await response.json();
    if (!data?.authenticated || !data?.user || !data?.trial) return null;

    return { user: data.user as ClientUser, trial: data.trial as TrialInfo };
  } catch (error) {
    console.error('Could not verify OPEN VOLEY session:', error);
    return null;
  }
}

export async function logoutAuthenticatedSession(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
  } finally {
    // Remove legacy identity caches. They must never be accepted as authentication.
    localStorage.removeItem('openvoley_user');
    localStorage.removeItem('openvoley_trial');
    localStorage.removeItem('openvoley_session_token');
  }
}

export function clearLegacyIdentityCache(): void {
  localStorage.removeItem('openvoley_user');
  localStorage.removeItem('openvoley_trial');
  localStorage.removeItem('openvoley_session_token');
}
