import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { clearLegacyIdentityCache, getAuthenticatedSession } from './services/authSession';
import { restoreVerifiedSessionToLegacyState } from './services/securityBootstrap';

async function bootstrap() {
  // Never trust identity left in browser storage from a previous version/session.
  clearLegacyIdentityCache();

  const session = await getAuthenticatedSession();
  if (session) {
    // Transitional UI compatibility: App can read this snapshot only after the server
    // has validated the HttpOnly cookie. It is not accepted by the backend as identity.
    restoreVerifiedSessionToLegacyState(session.user, session.trial);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
