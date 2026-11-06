import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { PublicEntry } from './PublicEntry';
import './index.css';

// Remove identity snapshots created by older OPEN VOLEY versions.
// App restores authentication only from the server-side HttpOnly session.
try {
  for (const key of ['openvoley_user', 'openvoley_trial', 'openvoley_session_token']) localStorage.removeItem(key);
} catch { /* Storage may be unavailable; the server still verifies identity. */ }

const rootElement = document.getElementById('root');
if (rootElement) {
  const entry = (
    <StrictMode>
      <PublicEntry />
    </StrictMode>
  );
  // Reuse the public HTML instead of clearing and rebuilding it on startup.
  if (rootElement.hasChildNodes()) hydrateRoot(rootElement, entry);
  else createRoot(rootElement).render(entry);
}
