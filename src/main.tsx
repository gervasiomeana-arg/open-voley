import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { getAuthenticatedSession, clearLegacyIdentityCache } from './services/authSession';

// Remove identity snapshots created by older OPEN VOLEY versions.
// App restores authentication only from the server-side HttpOnly session.
clearLegacyIdentityCache();

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
