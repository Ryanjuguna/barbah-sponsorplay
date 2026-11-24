import React from 'react';
import { ArrowRight, ShieldCheck, DollarSign, Bot, Trophy, Zap } from 'lucide-react';

interface HeroProps {
  onExploreCreators: () => void;
  onExploreCampaigns: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreCreators, onExploreCampaigns }) => {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-900">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[250px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Top Tagline Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 mb-8 shadow-inner">
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold text-[10px] tracking-wide uppercase">
            Kenya Esports Ecosystem
          </span>
          <span className="text-slate-400">Overcoming the KRA Section 16 Tax Wall</span>
          <ArrowRight className="h-3 w-3 text-emerald-400" />
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          Autonomous AI Sponsorships for{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Grassroots Gaming
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
          Connecting major corporate sponsors with Nairobi's gaming lounges, campus clubs, and competitive streamers via automated multi-agent AI verification,{' '}
          <span className="text-blue-400 font-semibold">Committed Campaign Balance</span>, and{' '}
          <span className="text-red-400 font-semibold">KRA eTIMS Tax Compliance</span>.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onExploreCreators}
            className="px-6 py-3.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95 flex items-center gap-2"
          >
            <span>Explore Creator Roster</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={onExploreCampaigns}
            className="px-6 py-3.5 rounded-xl text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white border border-slate-700/80 transition-all hover:border-slate-600 active:scale-95 flex items-center gap-2"
          >
            <Trophy className="h-4 w-4 text-emerald-400" />
            <span>Active Brand Campaigns</span>
          </button>
        </div>

        {/* Key Metrics Grid */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto text-left">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Market Size</span>
            </div>
            <div className="text-2xl font-black text-white">$137 Million</div>
            <p className="text-xs text-slate-400 mt-1">Kenya gaming & esports audience</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">PayPal Ledger</span>
            </div>
            <div className="text-2xl font-black text-white">30 / 40 / 30%</div>
            <p className="text-xs text-slate-400 mt-1">Milestone-based committed funding</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-red-400 mb-1">
              <Zap className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Tax Engine</span>
            </div>
            <div className="text-2xl font-black text-white">100% Compliant</div>
            <p className="text-xs text-slate-400 mt-1">Automated KRA eTIMS BII invoicing</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-purple-400 mb-1">
              <Bot className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Verification</span>
            </div>
            <div className="text-2xl font-black text-white">6 AI Agents</div>
            <p className="text-xs text-slate-400 mt-1">Computer vision & audio brand audit</p>
          </div>
        </div>
      </div>
    </section>
  );
};
