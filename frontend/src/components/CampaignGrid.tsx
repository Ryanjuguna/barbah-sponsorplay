import React from 'react';
import type { WPPost } from '../types/wordpress';
import { Trophy, ShieldCheck, ArrowUpRight, Clock } from 'lucide-react';

interface CampaignGridProps {
  campaigns: WPPost[];
  loading: boolean;
  onSelectCampaign: (post: WPPost) => void;
  onApplyForCampaign: (post: WPPost) => void;
}

export const CampaignGrid: React.FC<CampaignGridProps> = ({
  campaigns,
  loading,
  onSelectCampaign,
  onApplyForCampaign,
}) => {
  return (
    <section id="campaigns" className="py-16 bg-slate-950/60 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Trophy className="h-4 w-4" />
              <span>Enterprise Brand Opportunities (Managed via WordPress)</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Active Sponsorship Campaigns
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Corporate campaigns featuring programmed 3-phase milestone funding (30/40/30) and automated KRA eTIMS compliance receipts.
            </p>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((n) => (
              <div key={n} className="h-72 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse p-6" />
            ))}
          </div>
        )}

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {campaigns.map((camp) => {
            const title = camp.title.rendered.replace(/&#038;/g, '&');
            const cleanExcerpt = camp.excerpt.rendered.replace(/<[^>]*>?/gm, '');

            return (
              <article
                key={camp.id}
                className="card flex flex-col justify-between p-6 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-blue-500/50 shadow-sm transition-all"
              >
                {/* Header Tag / Escrow Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Committed Balance</span>
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">30 / 40 / 30% Split</span>
                </div>

                {/* Header */}
                <header className="mb-3">
                  <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                    <a
                      href={`#campaign-${camp.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectCampaign(camp);
                      }}
                      className="card-link inline-flex items-center gap-1.5 focus:outline-none"
                    >
                      <span>{title}</span>
                      <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400" />
                    </a>
                  </h3>
                </header>

                {/* Content */}
                <div className="flex-1 text-sm text-slate-300 leading-relaxed mb-6">
                  <p className="line-clamp-3">{cleanExcerpt}</p>

                  {/* Milestone breakdown mini-timeline */}
                  <div className="mt-5 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                    <div className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider mb-2">
                      Automated Milestone Ledger
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Phase 1 (30%)</span>
                        <span className="font-semibold text-emerald-400">Asset Staging</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Phase 2 (40%)</span>
                        <span className="font-semibold text-blue-400">Stream Execution</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Phase 3 (30%)</span>
                        <span className="font-semibold text-purple-400">eTIMS Signoff</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer with Isolated Interactive Controls */}
                <footer className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>KRA Section 16 Deductible</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectCampaign(camp)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                      View Brief
                    </button>
                    <button
                      onClick={() => onApplyForCampaign(camp)}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm"
                    >
                      Apply via Scout
                    </button>
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
