import React, { Component, Suspense, lazy, useEffect, useState } from 'react';
import { WelcomeLandingPage } from './components/WelcomeLandingPage';

// Keep scouting, video and AI out of a visitor's initial download.
const App = lazy(() => import('./App'));
const GoogleAuthModal = lazy(() => import('./components/GoogleAuthModal').then(m => ({ default: m.GoogleAuthModal })));
const SubscriptionPlansModal = lazy(() => import('./components/SubscriptionPlansModal').then(m => ({ default: m.SubscriptionPlansModal })));

class LoadBoundary extends Component<React.PropsWithChildren, { failed: boolean }> {
  declare props: React.PropsWithChildren;
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <section role="alert" className="p-6 bg-slate-950 text-white">
      <p>No se pudo cargar esta sección. Revisá tu conexión y volvé a intentar.</p>
      <a href={window.location.href}>Recargar OPEN VOLEY</a>
    </section>;
    return this.props.children;
  }
}

export function PublicEntry() {
  const [enterApp, setEnterApp] = useState(false);
  const [auth, setAuth] = useState<'new' | 'existing' | null>(null);
  const [plans, setPlans] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(window.location.search);
    // Preserve payment verification in App, including when the session expired.
    if (['payment_status', 'collection_status', 'status', 'payment_id', 'collection_id', 'data.id'].some(key => params.has(key))) {
      setEnterApp(true);
      return () => controller.abort();
    }
    // This only chooses which code to download. App verifies the session again
    // and initializes the account's cloud storage before showing private data.
    void fetch('/api/auth/me', {
      credentials: 'same-origin', cache: 'no-store',
      headers: { Accept: 'application/json' }, signal: controller.signal,
    }).then(async response => {
      if (!response.ok) return;
      const session = await response.json();
      if (!controller.signal.aborted && session.authenticated && session.user && session.trial) setEnterApp(true);
    }).catch(() => { /* The public page and Google login remain available. */ });
    return () => controller.abort();
  }, []);

  const loading = <p role="status" className="p-6 bg-slate-950 text-white">Cargando OPEN VOLEY…</p>;
  if (enterApp) return <LoadBoundary><Suspense fallback={loading}><App /></Suspense></LoadBoundary>;

  return <>
    <WelcomeLandingPage onStartFreeTrial={() => setAuth('new')} onClientLogin={() => setAuth('existing')} onOpenPlansModal={() => setPlans(true)} />
    {(auth || plans) && <LoadBoundary><Suspense fallback={loading}>
      {auth && <GoogleAuthModal onLoginSuccess={() => setEnterApp(true)} onClose={() => setAuth(null)} isExistingClientLogin={auth === 'existing'} />}
      {plans && <SubscriptionPlansModal isOpen onClose={() => setPlans(false)} />}
    </Suspense></LoadBoundary>}
  </>;
}
