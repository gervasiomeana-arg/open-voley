import { getAuthenticatedSession } from './authSession';

const nativeFetch = window.fetch.bind(window);
const nativeRemoveItem = Storage.prototype.removeItem;

function isSameOriginApi(input: RequestInfo | URL, path: string): boolean {
  try {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const url = new URL(raw, window.location.origin);
    return url.origin === window.location.origin && url.pathname === path;
  } catch {
    return false;
  }
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Compatibility bridge while App.tsx is progressively migrated.
// The legacy email login endpoint is never called: identity comes only from /api/auth/me.
window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();

  if (method === 'POST' && isSameOriginApi(input, '/api/clients/login')) {
    const session = await getAuthenticatedSession();
    if (!session) {
      return jsonResponse({ error: 'Authentication required' }, 401);
    }
    return jsonResponse({ client: session.user, trial: session.trial }, 200);
  }

  if (isSameOriginApi(input, '/api/mercadopago/confirm-payment')) {
    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    headers.set('Content-Type', 'application/json');

    let paymentId = '';
    try {
      const sourceBody = init?.body;
      if (typeof sourceBody === 'string') {
        paymentId = String(JSON.parse(sourceBody)?.paymentId || '').trim();
      }
    } catch {
      paymentId = '';
    }

    return nativeFetch(input, {
      ...init,
      method: 'POST',
      credentials: 'same-origin',
      headers,
      body: JSON.stringify({ paymentId }),
    });
  }

  return nativeFetch(input, {
    ...init,
    credentials: init?.credentials || 'same-origin',
  });
}) as typeof window.fetch;

// App.tsx currently clears its local user cache on logout. Mirror that action to the
// server so clearing UI state also destroys the HttpOnly session cookie.
Storage.prototype.removeItem = function secureRemoveItem(key: string) {
  nativeRemoveItem.call(this, key);
  if (this === window.localStorage && key === 'openvoley_user') {
    void nativeFetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    }).catch(() => undefined);
  }
};

export function restoreVerifiedSessionToLegacyState(user: unknown, trial: unknown) {
  // Temporary compatibility only. These values are populated exclusively after /api/auth/me
  // verifies the HttpOnly session and are cleared before every application bootstrap.
  localStorage.setItem('openvoley_user', JSON.stringify(user));
  localStorage.setItem('openvoley_trial', JSON.stringify(trial));
}
