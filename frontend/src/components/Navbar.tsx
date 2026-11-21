import React from 'react';
import { Gamepad2, ExternalLink, Sparkles } from 'lucide-react';

interface NavbarProps {
  onOpenBriefModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenBriefModal }) => {
  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Gamepad2 className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
                  BARBAH SPONSORPLAY
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  WP Connected
                </span>
              </div>
              <p className="text-[11px] text-slate-400">PayPal Milestone Ledger & KRA eTIMS</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#creators" className="hover:text-emerald-400 transition-colors">Creators</a>
            <a href="#campaigns" className="hover:text-emerald-400 transition-colors">Campaigns</a>
            <a href="#agents" className="hover:text-emerald-400 transition-colors">AI Swarm</a>
            <a href="#impact" className="hover:text-emerald-400 transition-colors">Tax & Impact</a>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <a
              href="http://localhost:8881/wp-admin"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 transition-colors"
              title="Open WordPress Studio Admin"
            >
              <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
              <span>WordPress Admin</span>
            </a>

            <button
              onClick={onOpenBriefModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/25 active:scale-95"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Launch Sponsorship</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
