import React, { useState } from 'react';
import type { WPPost } from '../types/wordpress';
import { Users, MapPin, Gamepad, CheckCircle2, ArrowUpRight, Search } from 'lucide-react';

interface CreatorMarketplaceProps {
  creators: WPPost[];
  loading: boolean;
  onSelectCreator: (post: WPPost) => void;
  onSponsorDirect: (post: WPPost) => void;
}

export const CreatorMarketplace: React.FC<CreatorMarketplaceProps> = ({
  creators,
  loading,
  onSelectCreator,
  onSponsorDirect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCreators = creators.filter((c) =>
    c.title.rendered.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.excerpt.rendered.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section id="creators" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Users className="h-4 w-4" />
            <span>Curated Roster (Managed via WordPress)</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Kenyan Esports Talent & Gaming Lounges
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Pre-screened by our Talent Scout Agent for verified footfall, authentic audience demographics, and PayPal milestone payout eligibility.
          </p>
        </div>

        {/* Search Filter */}
        <div className="relative min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search creators, games, lounges..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 transition-colors"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-80 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse p-6" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredCreators.length === 0 && (
        <div className="text-center py-16 rounded-2xl border border-slate-800 bg-slate-900/30">
          <p className="text-slate-400 text-base">No creators matched your search query.</p>
          <p className="text-xs text-slate-400 mt-2">
            You can create new creators anytime directly from your WordPress Studio admin dashboard!
          </p>
        </div>
      )}

      {/* Cards Grid: Follows modern-web-guidance for <article class="card"> */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCreators.map((creator) => {
          const title = creator.title.rendered.replace(/&#038;/g, '&');
          const cleanExcerpt = creator.excerpt.rendered.replace(/<[^>]*>?/gm, '');

          return (
            <article
              key={creator.id}
              className="card flex flex-col justify-between p-6 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-emerald-500/50 shadow-sm transition-all"
            >
              {/* Region 1: Media / Header Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Verified Syndicate</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">WP #{creator.id}</span>
              </div>

              {/* Region 2: Header with Stretched Primary Link */}
              <header className="mb-3">
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                  <a
                    href={`#creator-${creator.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectCreator(creator);
                    }}
                    className="card-link inline-flex items-center gap-1 focus:outline-none"
                  >
                    <span>{title}</span>
                    <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 transition-transform" />
                  </a>
                </h3>
              </header>

              {/* Region 3: Content */}
              <div className="flex-1 text-sm text-slate-300 leading-relaxed mb-6">
                <p className="line-clamp-3">{cleanExcerpt}</p>

                {/* Quick metadata chips */}
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                    <Gamepad className="h-3 w-3 text-emerald-400" />
                    <span>EA FC 25 / Tekken</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                    <MapPin className="h-3 w-3 text-blue-400" />
                    <span>Nairobi, Kenya</span>
                  </span>
                </div>
              </div>

              {/* Region 4: Footer with Isolated Interactive Controls */}
              <footer className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Milestone Escrow</span>
                  <span className="text-emerald-400 font-bold">PayPal Eligible</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectCreator(creator)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => onSponsorDirect(creator)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-sm"
                  >
                    Sponsor
                  </button>
                </div>
              </footer>
            </article>
          );
        })}
      </div>
    </section>
  );
};
