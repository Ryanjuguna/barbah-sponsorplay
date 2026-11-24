import React, { useState } from 'react';
import { X, Sparkles, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

interface BriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTitle?: string;
}

export const SponsorshipBriefModal: React.FC<BriefModalProps> = ({ isOpen, onClose, targetTitle }) => {
  const [brandName, setBrandName] = useState('');
  const [budget, setBudget] = useState('150000');
  const [game, setGame] = useState('EA FC 25 & Tekken 8');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Sparkles className="h-4 w-4" />
              </span>
              <h2 className="text-xl font-bold text-white">
                {targetTitle ? `Sponsor ${targetTitle}` : 'Launch a Sponsorship Brief'}
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Our Campaign Architect & Financial Agents will auto-generate your 3-phase milestone ledger and KRA eTIMS invoice.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Corporate Brand Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Safaricom PLC, Red Bull, KCB Bank"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Campaign Budget (KES)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Featured Gaming Titles</label>
                <select
                  value={game}
                  onChange={(e) => setGame(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="EA FC 25 & Tekken 8">EA FC 25 & Tekken 8</option>
                  <option value="Apex Legends & Valorant">Apex Legends & Valorant</option>
                  <option value="PUBG Mobile">PUBG Mobile</option>
                  <option value="Sim Racing / Gran Turismo 7">Sim Racing / GT7</option>
                </select>
              </div>
            </div>

            {/* Split breakdown info */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 space-y-1.5">
              <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                <span>Programmatic 3-Phase Milestone Structure</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Phase 1 (30%): Mobilization & Logo Detection</span>
                <span className="font-mono text-white">KES {(Number(budget) * 0.3).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Phase 2 (40%): Live Stream & Slogan Audit</span>
                <span className="font-mono text-white">KES {(Number(budget) * 0.4).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Phase 3 (30%): KRA eTIMS Tax Clearance</span>
                <span className="font-mono text-white">KES {(Number(budget) * 0.3).toLocaleString()}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <span>Submit to Talent Scout Agent</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Brief Dispatched to AI Agent Swarm!</h3>
            <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
              Agent 01 (Talent Scout) and Agent 02 (Campaign Architect) are currently mapping verified grassroots creator syndicates for <strong className="text-white">{brandName}</strong>.
            </p>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400">
              PayPal Orders v2 Milestone Draft Created &bull; KRA Section 16 Pending
            </div>
            <button
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              Back to Marketplace
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
