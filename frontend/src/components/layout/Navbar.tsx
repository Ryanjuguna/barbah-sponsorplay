import React, { useState } from 'react';
import {
  Menu,
  X,
  Gamepad2,
  Briefcase,
  User,
  LogOut,
  ShieldCheck,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface NavbarProps {
  role?: 'brand' | 'creator' | null;
  onRoleChange?: (role: 'brand' | 'creator') => void;
  onNavigate?: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  role,
  onRoleChange,
  onNavigate,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    // Clear session cookies
    document.cookie =
      'dhamini_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie =
      'dhamini_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setIsMobileMenuOpen(false);
    onNavigate?.('/');
  };

  const handleLoginAs = (userRole: 'brand' | 'creator') => {
    setIsMobileMenuOpen(false);
    onRoleChange?.(userRole);
    onNavigate?.(`/login?role=${userRole}`);
  };

  const brandLinks = [
    { label: 'Dashboard', href: '/brand', icon: Briefcase },
    { label: 'Campaigns', href: '/brand/campaigns', icon: Trophy },
    { label: 'Proposals', href: '/brand/proposals', icon: ShieldCheck },
    { label: 'Tax & Payments', href: '/brand/tax', icon: ShieldCheck },
  ];

  const creatorLinks = [
    { label: 'Dashboard', href: '/creator', icon: Gamepad2 },
    { label: 'Offers', href: '/creator/offers', icon: Briefcase },
    { label: 'Deliverables', href: '/creator/deliverables', icon: User },
    { label: 'Certificates', href: '/creator/certificates', icon: Trophy },
  ];

  const isAuthenticated = !!role;

  const navigateTo = (href: string) => {
    setIsMobileMenuOpen(false);
    onNavigate?.(href);
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigateTo('/')}
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[hsl(var(--primary))] to-[hsl(var(--accent))] p-0.5 flex items-center justify-center shadow-lg shadow-[var(--shadow-terracotta)] group-hover:shadow-[var(--shadow-gold)] transition-shadow">
              <div className="h-full w-full bg-[hsl(var(--background))] rounded-[10px] flex items-center justify-center">
                <Gamepad2 className="h-5 w-5 text-[hsl(var(--primary))]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-[hsl(var(--accent))] bg-clip-text text-transparent">
                  DHAMINI
                </span>
              </div>
              {isAuthenticated && (
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  {role === 'brand' ? 'Brand Sponsor Portal' : 'Creator Portal'}
                </p>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6 text-sm font-medium text-[hsl(var(--muted-foreground))]">
              {isAuthenticated
                ? role === 'brand'
                  ? brandLinks.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        className="hover:text-[hsl(var(--foreground))] transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          navigateTo(link.href);
                        }}
                      >
                        {link.label}
                      </a>
                    ))
                  : creatorLinks.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        className="hover:text-[hsl(var(--foreground))] transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          navigateTo(link.href);
                        }}
                      >
                        {link.label}
                      </a>
                    ))
                : [
                    { label: 'For Brands', href: '#for-brands' },
                    { label: 'For Creators', href: '#for-creators' },
                    { label: 'How It Works', href: '#how-it-works' },
                  ].map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="hover:text-[hsl(var(--foreground))] transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        // Hash links scroll to sections on the same page
                        if (link.href.startsWith('#')) {
                          const el = document.getElementById(link.href.slice(1));
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth' });
                            return;
                          }
                        }
                        navigateTo(link.href);
                      }}
                    >
                      {link.label}
                    </a>
                  ))}
            </div>

            <div className="flex items-center gap-3">
              {!isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLoginAs('brand')}
                  >
                    Brand Login
                  </Button>
                  <Button variant="gold" size="sm" onClick={() => handleLoginAs('creator')}>
                    Creator Login
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" /> Sign Out
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => handleLoginAs('brand')}>
              Brand
            </Button>
            <Button variant="gold" size="sm" onClick={() => handleLoginAs('creator')}>
              Creator
            </Button>
            <button
              className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[hsl(var(--card))] border-b border-[hsl(var(--border))]">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
            {isAuthenticated ? (
              <>
                {(role === 'brand' ? brandLinks : creatorLinks).map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="block px-4 py-2 rounded-xl text-sm hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateTo(link.href);
                    }}
                  >
                    {link.label}
                  </a>
                ))}
                <div className="pt-4 border-t border-[hsl(var(--border))]">
                  <Button variant="ghost" className="w-full" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="px-4 py-2 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Login as
                </div>
                <Button variant="secondary" className="w-full" onClick={() => handleLoginAs('brand')}>
                  Brand Sponsor
                </Button>
                <Button variant="gold" className="w-full mt-2" onClick={() => handleLoginAs('creator')}>
                  Creator / Talent
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};