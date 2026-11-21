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
import { CampaignDetail } from '@/pages/CampaignDetail';
import { getSessionToken, getSessionRole } from '@/lib/api';

type Route =
  | 'landing'
  | 'login'
  | 'brand'
  | 'creator'
  | 'brand-brief'
  | 'brand-campaigns'
  | 'brand-tax'
  | 'brand-campaign-detail'
  | 'creator-offers'
  | 'creator-deliverables'
  | 'creator-certificates';

export function App() {
  const [route, setRoute] = useState<Route>('landing');
  const [role, setRole] = useState<'brand' | 'creator' | null>(null);

  /* Restore session from cookie or URL on mount */
  useEffect(() => {
    const token = getSessionToken();
    const savedRole = getSessionRole();
    const currentPath = window.location.pathname;

    if (token && savedRole) {
      setRole(savedRole);
      if (currentPath === '/brand/brief') {
        setRoute('brand-brief');
      } else if (currentPath === '/creator/deliverables') {
        setRoute('creator-deliverables');
      } else if (currentPath.match(/^\/brand\/campaigns\/.+/)) {
        setRoute('brand-campaign-detail');
      } else {
        setRoute(savedRole === 'brand' ? 'brand' : 'creator');
      }
    } else if (currentPath.startsWith('/brand')) {
      setRole('brand');
      if (currentPath === '/brand/brief') {
        setRoute('brand-brief');
      } else if (currentPath.match(/^\/brand\/campaigns\/.+/)) {
        setRoute('brand-campaign-detail');
      } else {
        setRoute('brand');
      }
    } else if (currentPath.startsWith('/creator')) {
      setRole('creator');
      setRoute(currentPath === '/creator/deliverables' ? 'creator-deliverables' : 'creator');
    } else if (currentPath === '/login') {
      setRoute('login');
    } else {
      setRoute('landing');
    }
  }, []);

  const handleNavigate = (path: string) => {
    const pathname = path.split('?')[0];

    // Handle dynamic campaign detail route: /brand/campaigns/:id
    const campaignDetailMatch = pathname.match(/^\/brand\/campaigns\/(.+)$/);
    if (campaignDetailMatch) {
      setRoute('brand-campaign-detail');
      window.history.pushState({}, '', path);
      return;
    }

    const map: Record<string, Route> = {
      '/': 'landing',
      '/login': 'login',
      '/brand': 'brand',
      '/creator': 'creator',
      '/brand/brief': 'brand-brief',
      '/brand/campaigns': 'brand',
      '/brand/tax': 'brand',
      '/creator/offers': 'creator',
      '/creator/deliverables': 'creator-deliverables',
      '/creator/certificates': 'creator',
    };
    const r = map[pathname];
    if (r) {
      setRoute(r);
      if (pathname.startsWith('/brand') && !role) {
        setRole('brand');
      } else if (pathname.startsWith('/creator') && !role) {
        setRole('creator');
      }
      window.history.pushState({}, '', path);
    }
  };

  const handleLogin = (userRole: 'brand' | 'creator') => {
    setRole(userRole);
    setRoute(userRole === 'brand' ? 'brand' : 'creator');
    window.history.pushState({}, '', userRole === 'brand' ? '/brand' : '/creator');
  };

  const handleLogout = () => {
    setRole(null);
    setRoute('landing');
    window.history.pushState({}, '', '/');
  };

  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname.split('?')[0];

      // Handle dynamic campaign detail route
      if (pathname.match(/^\/brand\/campaigns\/.+/)) {
        setRoute('brand-campaign-detail');
        return;
      }

      const map: Record<string, Route> = {
        '/': 'landing',
        '/login': 'login',
        '/brand': 'brand',
        '/brand/brief': 'brand-brief',
        '/creator': 'creator',
        '/creator/deliverables': 'creator-deliverables',
      };
      const r = map[pathname];
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
          <Navbar role={null} onRoleChange={handleLogin} onNavigate={handleNavigate} onLogout={handleLogout} />
          <main>
            <Landing onNavigate={handleNavigate} />
          </main>
          <Footer />
        </>
      ) : (
        <>
          <Navbar role={role} onRoleChange={handleLogin} onNavigate={handleNavigate} onLogout={handleLogout} />

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

          {route === 'brand-campaign-detail' && (
            <main className="min-h-[calc(100vh-4rem)]">
              <CampaignDetail
                onNavigate={handleNavigate}
                campaignId={window.location.pathname.split('/').pop() || ''}
              />
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
