import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Gamepad2,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { api } from '@/lib/api';

interface LoginProps {
  onNavigate: (path: string) => void;
}

export const Login = ({ onNavigate }: LoginProps) => {
  const [role, setRole] = useState<'brand' | 'creator' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoAccounts, setDemoAccounts] = useState<any[]>([]);

  /* Read role from URL query params */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRole = params.get('role');
    if (urlRole === 'brand' || urlRole === 'creator') {
      setRole(urlRole);
    }
  }, []);

  useEffect(() => {
    api.getDemoAccounts().then((data) => {
      setDemoAccounts(data.creators || []);
    });
  }, []);

  const handleRoleSelect = (r: 'brand' | 'creator') => {
    setRole(r);
    setError(null);
    onNavigate(`/login?role=${r}`);
  };

  const handleDemoLogin = async (account: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.login({
        role: account.role,
        demo_id: account.id || account.demo_id,
      });
      window.location.href = res.redirect_url;
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(e.currentTarget);
      const identifier = formData.get('identifier') as string;
      const password = formData.get('password') as string;
      const res = await api.login({
        role: role!,
        identifier,
        password,
      });
      window.location.href = res.redirect_url;
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const brandDemo = {
    id: 'brand-simulation-account',
    name: 'Safaricom 5G Gaming Hub',
    email: 'brand@sponsorplay.ke',
    role: 'brand' as const,
    avatar_text: 'SAF',
    location: 'Nairobi HQ, Kenya',
    budget_usd: 10000,
    tier: 'ENTERPRISE_SPONSOR',
  };

  const getRoleConfig = () => {
    if (role === 'brand') {
      return {
        title: 'Brand Sponsor Login',
        subtitle:
          'Access campaign management, milestone tracking, and KRA eTIMS tax invoices.',
        icon: Briefcase,
        primaryAction: 'Start Sponsoring',
      };
    }
    if (role === 'creator') {
      return {
        title: 'Creator / Talent Login',
        subtitle:
          'Review offers, upload deliverables, track payouts, and build your Skills Passport.',
        icon: Gamepad2,
        primaryAction: 'Open Creator Portal',
      };
    }
    return null;
  };

  const config = getRoleConfig();

  if (!role || !config) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[hsl(var(--background))]">
        <div className="max-w-md w-full text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center shadow-[var(--shadow-terracotta)]">
              <Gamepad2 className="h-6 w-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-[hsl(var(--accent))] bg-clip-text text-transparent">
              DHAMINI
            </span>
          </div>

          <h1 className="text-3xl font-black text-[hsl(var(--foreground))] mb-4">
            Select your role
          </h1>
          <p className="text-lg text-[hsl(var(--muted-foreground))] mb-10">
            Are you a corporate brand or a gaming creator?
          </p>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => handleRoleSelect('brand')}
              className="border border-[hsl(var(--border))] hover:bg-[hsl(var(--primary))]/10 hover:text-[hsl(var(--primary))]"
            >
              <Briefcase className="h-5 w-5 mr-2" />
              Brand Sponsor
            </Button>
            <Button
              variant="gold"
              size="lg"
              onClick={() => handleRoleSelect('creator')}
            >
              <Gamepad2 className="h-5 w-5 mr-2" />
              Creator / Talent
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="p-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/50">
              <h3 className="font-bold text-[hsl(var(--foreground))] mb-2">
                For Brands
              </h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                Submit briefs, manage campaigns, verify deliverables, download tax invoices.
              </p>
              <ul className="text-xs text-[hsl(var(--muted-foreground))] space-y-1">
                <li>• Campaign briefs</li>
                <li>• Milestone escrow</li>
                <li>• eTIMS invoices</li>
                <li>• Impact dashboards</li>
              </ul>
            </div>
            <div className="p-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/50">
              <h3 className="font-bold text-[hsl(var(--foreground))] mb-2">
                For Creators
              </h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                Browse offers, accept contracts, upload deliverables, get paid.
              </p>
              <ul className="text-xs text-[hsl(var(--muted-foreground))] space-y-1">
                <li>• Offer management</li>
                <li>• Deliverable upload</li>
                <li>• PayPal / M-Pesa</li>
                <li>• Skills Passport</li>
              </ul>
            </div>
          </div>

          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-6 uppercase tracking-wider">
            Dhamini — Sponsoring African Gaming Talent
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[hsl(var(--background))]">
      <div className="max-w-md w-full">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center shadow-[var(--shadow-terracotta)]">
            {config.icon && <config.icon className="h-6 w-6 text-white" />}
          </div>
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-[hsl(var(--accent))] bg-clip-text text-transparent">
            DHAMINI
          </span>
        </div>

        <Card padding="lg">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">{config.title}</CardTitle>
            <CardDescription>{config.subtitle}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-900/20 text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Quick demo login (for piloting/evaluation) */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Quick Access (Demo)
              </p>
              <div className="flex flex-col gap-3">
                {role === 'brand' ? (
                  <Button
                    variant="ghost"
                    className="w-full text-left justify-start border border-[hsl(var(--border))] hover:bg-[hsl(var(--primary))]/10"
                    onClick={() => handleDemoLogin(brandDemo)}
                  >
                    <Lock className="h-4 w-4 mr-3 text-[hsl(var(--muted-foreground))]" />
                    <span className="font-medium">Safaricom 5G Gaming Hub</span>
                    <span className="ml-auto text-xs text-[hsl(var(--muted-foreground))]">
                      brand@sponsorplay.ke
                    </span>
                  </Button>
                ) : (
                  demoAccounts.map((creator) => (
                    <Button
                      key={creator.id}
                      variant="ghost"
                      className="w-full text-left justify-start border border-[hsl(var(--border))] hover:bg-emerald-900/20"
                      onClick={() => handleDemoLogin(creator)}
                    >
                      <Gamepad2 className="h-4 w-4 mr-3 text-emerald-400" />
                      <div className="flex-1">
                        <span className="font-medium text-[hsl(var(--foreground))]">
                          {creator.name} (@{creator.gamer_tag})
                        </span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          {creator.type} • {creator.location}
                        </span>
                      </div>
                      <span className="text-xs text-emerald-400">
                        ${creator.base_rate_usd}
                      </span>
                    </Button>
                  ))
                )}
              </div>
            </div>

            <div className="h-px bg-[hsl(var(--border))] my-2" />

            {/* Manual login form */}
            <form onSubmit={handleManualLogin} className="space-y-4">
              <Input
                label="Email / Gamer Tag / Brand Name"
                placeholder={role === 'brand' ? 'brand@sponsorplay.ke' : 'creator@sponsorplay.ke'}
                name="identifier"
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="demo123"
                name="password"
                required
              />
              <Button
                variant="primary"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {config.primaryAction}
              </Button>
            </form>

            <p className="text-xs text-center text-[hsl(var(--muted-foreground))]">
              Demo credentials: email above / password{' '}
              <span className="font-medium text-[hsl(var(--foreground))]">demo123</span>
            </p>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRole(null);
              onNavigate('/');
            }}
          >
            <ArrowRight className="h-4 w-4 mr-2" /> Back to role selection
          </Button>
        </div>
      </div>
    </div>
  );
};