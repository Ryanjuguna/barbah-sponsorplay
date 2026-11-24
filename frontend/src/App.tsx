/* ============================================================================
   DHAMINI — App shell

   Two route families live here:

   1. The product workflow (this is the real application):
      /brand, /brand/campaigns/:id, /brand/proposals/:id/edit|preview,
      /ops, /creator, /offer/:token

   2. The legacy prototype pages, kept reachable so nothing is lost while the
      visual layer is rebuilt around the workflow.
   ============================================================================ */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { BrandBrief } from '@/pages/BrandBrief';
import { CreatorDeliverables } from '@/pages/CreatorDeliverables';
import { getSessionRole } from '@/lib/api';
import { logout as workflowLogout } from '@/lib/workflow';

import { BrandCampaigns } from '@/pages/workflow/BrandCampaigns';
import { CampaignWorkspace } from '@/pages/workflow/CampaignWorkspace';
import { ProposalEditor } from '@/pages/workflow/ProposalEditor';
import { SendGate } from '@/pages/workflow/SendGate';
import { OfferPage } from '@/pages/workflow/OfferPage';
import { OpsQueue } from '@/pages/workflow/OpsQueue';
import { CreatorHome, CreatorCampaignPage, CreatorMilestonePage } from '@/pages/workflow/CreatorWorkspace';

type AppRole = 'brand' | 'creator' | 'ops' | null;

const PUBLIC_PATHS = ['/', '/login'];

function Guard({ allow, role, children }: { allow: 'brand' | 'creator' | 'ops'; role: AppRole; children: React.ReactNode }) {
  if (role === allow) return <>{children}</>;
  if (!role) {
    const loginRole = allow === 'ops' ? 'brand' : allow;
    return <Navigate to={`/login?role=${loginRole}`} replace />;
  }
  const home = role === 'ops' ? '/ops' : role === 'brand' ? '/brand' : '/creator';
  return <Navigate to={home} replace />;
}

function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-black">Page not found</h1>
      <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
        The link may have expired, or the page has moved.
      </p>
      <a href="/" className="mt-6 text-sm font-semibold underline">
        Back to SponsorPlay
      </a>
    </main>
  );
}

function Shell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState<AppRole>(() => getSessionRole() as AppRole);

  useEffect(() => {
    setRole(getSessionRole() as AppRole);
  }, [location.pathname]);

  const onNavigate = (path: string) => {
    const url = path.startsWith('?') ? `${location.pathname}${path}` : path;
    navigate(url);
  };

  const onRoleChange = (next: 'brand' | 'creator') => {
    setRole(next);
  };

  const onLogout = () => {
    workflowLogout();
    setRole(null);
    navigate('/');
  };

  const isPublic = PUBLIC_PATHS.includes(location.pathname) || location.pathname.startsWith('/offer/');
  const navbarRole: 'brand' | 'creator' | 'ops' | null = isPublic ? null : role;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <Navbar
        role={navbarRole}
        onRoleChange={onRoleChange}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing onNavigate={onNavigate} />} />
        <Route path="/login" element={<Login onNavigate={onNavigate} />} />
        <Route path="/offer/:token" element={<OfferPage />} />

        {/* Brand */}
        <Route
          path="/brand"
          element={
            <Guard allow="brand" role={role}>
              <BrandCampaigns />
            </Guard>
          }
        />
        <Route
          path="/brand/campaigns/:campaignId"
          element={
            <Guard allow="brand" role={role}>
              <CampaignWorkspace />
            </Guard>
          }
        />
        <Route
          path="/brand/proposals/:proposalId/edit"
          element={
            <Guard allow="brand" role={role}>
              <ProposalEditor />
            </Guard>
          }
        />
        <Route
          path="/brand/proposals/:proposalId/preview"
          element={
            <Guard allow="brand" role={role}>
              <SendGate />
            </Guard>
          }
        />

        {/* Ops */}
        <Route
          path="/ops"
          element={
            <Guard allow="ops" role={role}>
              <OpsQueue />
            </Guard>
          }
        />

        {/* Creator */}
        <Route
          path="/creator"
          element={
            <Guard allow="creator" role={role}>
              <CreatorHome />
            </Guard>
          }
        />
        <Route
          path="/creator/campaigns/:proposalId"
          element={
            <Guard allow="creator" role={role}>
              <CreatorCampaignPage />
            </Guard>
          }
        />
        <Route
          path="/creator/milestones/:milestoneId"
          element={
            <Guard allow="creator" role={role}>
              <CreatorMilestonePage />
            </Guard>
          }
        />

        {/* Legacy prototype pages */}
        <Route path="/brand/brief" element={<BrandBrief onNavigate={onNavigate} />} />
        <Route path="/brand/campaigns" element={<Navigate to="/brand" replace />} />
        <Route path="/creator/deliverables" element={<CreatorDeliverables onNavigate={onNavigate} />} />

        <Route path="*" element={<NotFound />} />
      </Routes>

      <Footer />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}

export default App;
