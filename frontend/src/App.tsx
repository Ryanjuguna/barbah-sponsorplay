/* ============================================================================
   DHAMINI — App Shell
   Client-side routing with role-based dashboards
   ============================================================================ */

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { BrandDashboard } from '@/pages/BrandDashboard';
import { CreatorDashboard } from '@/pages/CreatorDashboard';
import { CreatorDeliverables } from '@/pages/CreatorDeliverables';
import { BrandBrief } from '@/pages/BrandBrief';
import { getSessionToken, getSessionRole } from '@/lib/api';

type Route =
  | 'landing'
  | 'login'
  | 'brand'
  | 'creator'
  | 'brand-brief'
  | 'brand-campaigns'
  | 'brand-tax'
  | 'creator-offers'
  | 'creator-deliverables'
  | 'creator-certificates';

export function App() {
  const [route, setRoute] = useState<Route>('landing');
  const [role, setRole] = useState<'brand' | 'creator' | null>(null);

  /* Restore session from cookie on mount */
  useEffect(() => {
    const token = getSessionToken();
    const savedRole = getSessionRole();
    if (token && savedRole) {
      setRole(savedRole);
      setRoute(savedRole === 'brand' ? 'brand' : 'creator');
    }
  }, []);

  const handleNavigate = (path: string) => {
    const map: Record<string, Route> = {
      '/': 'landing',
      '/login': 'login',
      '/brand': 'brand',
      '/creator': 'creator',
      '/brand/brief': 'brand-brief',
      '/brand/campaigns': 'brand-campaigns',
      '/brand/tax': 'brand-tax',
      '/creator/offers': 'creator-offers',
      '/creator/deliverables': 'creator-deliverables',
      '/creator/certificates': 'creator-certificates',
    };
    const r = map[path];
    if (r) {
      setRoute(r);
      window.history.pushState({}, '', path);
    }
  };

  const handleLogin = (userRole: 'brand' | 'creator') => {
    setRole(userRole);
    setRoute(userRole === 'brand' ? 'brand' : 'creator');
    window.history.pushState({}, '', userRole === 'brand' ? '/brand' : '/creator');
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const map: Record<string, Route> = {
        '/': 'landing',
        '/login': 'login',
        '/brand': 'brand',
        '/brand/brief': 'brand-brief',
        '/creator': 'creator',
        '/creator/deliverables': 'creator-deliverables',
      };
      const r = map[path];
      if (r) setRoute(r);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isAuthenticated = !!role;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {!isAuthenticated && route === 'landing' ? (
        <>
          <Navbar role={null} onRoleChange={handleLogin} onNavigate={handleNavigate} />
          <main>
            <Landing onNavigate={handleNavigate} />
          </main>
          <Footer />
        </>
      ) : (
        <>
          <Navbar role={role} onRoleChange={handleLogin} onNavigate={handleNavigate} />

          {route === 'login' && (
            <main className="min-h-[calc(100vh-4rem)]">
              <Login onNavigate={handleNavigate} />
            </main>
          )}

          {route === 'brand' && (
            <main className="min-h-[calc(100vh-4rem)]">
              <BrandDashboard onNavigate={handleNavigate} />
            </main>
          )}

          {route === 'brand-brief' && (
            <main className="min-h-[calc(100vh-4rem)]">
              <BrandBrief onNavigate={handleNavigate} />
            </main>
          )}

          {route === 'creator' && (
            <main className="min-h-[calc(100vh-4rem)]">
              <CreatorDashboard onNavigate={handleNavigate} />
            </main>
          )}

          {route === 'creator-deliverables' && (
            <main className="min-h-[calc(100vh-4rem)]">
              <CreatorDeliverables onNavigate={handleNavigate} />
            </main>
          )}

          {!isAuthenticated && (route === 'brand' || route === 'creator') && (
            <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Please log in</h2>
                <p className="text-[hsl(var(--muted-foreground))] mb-6">
                  You need to select a role to access the dashboard.
                </p>
                <button
                  onClick={() => {
                    setRoute('landing');
                    window.history.pushState({}, '', '/');
                  }}
                  className="text-[hsl(var(--primary))] hover:underline font-medium"
                >
                  Back to home
                </button>
              </div>
            </main>
          )}
        </>
      )}
    </div>
  );
}

export default App;