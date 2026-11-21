import React from 'react';
import { Bot, Search, FileText, CheckCircle, ShieldAlert, Sparkles, Receipt } from 'lucide-react';

export const AgentSwarmShowcase: React.FC = () => {
  const agents = [
    {
      num: '01',
      name: 'Talent Scout Agent',
      icon: Search,
      color: 'text-emerald-400',
      borderColor: 'border-emerald-500/20',
      bgColor: 'bg-emerald-500/10',
      desc: 'Deconstructs sponsor briefs, deduplicates cross-channel reach, and automatically bundles grassroots gaming lounges into scalable micro-syndicates.',
      detail: 'Analyzes footfall, console count, and authentic local engagement.',
    },
    {
      num: '02',
      name: 'Campaign Architect',
      icon: FileText,
      color: 'text-blue-400',
      borderColor: 'border-blue-500/20',
      bgColor: 'bg-blue-500/10',
      desc: 'Synthesizes 3-phase milestone contracts (30/40/30) and calculates fair-market sponsorship pricing aligned with Kenyan youth gamer purchasing power.',
      detail: 'Automates contract milestones and deliverable checkpoints.',
    },
    {
      num: '03',
      name: 'Multimodal Verifier',
      icon: CheckCircle,
      color: 'text-cyan-400',
      borderColor: 'border-cyan-500/20',
      bgColor: 'bg-cyan-500/10',
      desc: 'Runs computer vision to verify sponsor logo presence (≥3.5% screen occupancy) and uses Whisper STT to audit spoken audio slogans in tournament streams.',
      detail: 'Eliminates vanity metrics and unverified brand claims.',
    },
    {
      num: '04',
      name: 'Financial & Tax Agent',
      icon: Receipt,
      color: 'text-amber-400',
      borderColor: 'border-amber-500/20',
      bgColor: 'bg-amber-500/10',
      desc: 'Orchestrates PayPal Orders v2 multiparty splits and generates KRA eTIMS Buyer-Initiated Invoices (BII) to satisfy Section 16 corporate deductibility.',
      detail: 'Resolves the Kenyan corporate 30% tax penalty hurdle.',
    },
    {
      num: '05',
      name: 'Brand Guardian',
      icon: ShieldAlert,
      color: 'text-red-400',
      borderColor: 'border-red-500/20',
      bgColor: 'bg-red-500/10',
      desc: 'Monitors real-time live chat sentiment, toxicity thresholds, and prevents competitor brand clashes during sponsored esports broadcasts.',
      detail: 'Provides brand-safety safeguards in grassroots gaming spaces.',
    },
    {
      num: '06',
      name: 'MetaTwin ESG Agent',
      icon: Sparkles,
      color: 'text-purple-400',
      borderColor: 'border-purple-500/20',
      bgColor: 'bg-purple-500/10',
      desc: 'Compiles C-Suite ESG and youth empowerment dossiers showing capital flow into urban grassroots communities and digital skill development.',
      detail: 'Provides measurable CSR impact reporting for board review.',
    },
  ];

  return (
    <section id="agents" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-purple-400 font-semibold mb-3">
          <Bot className="h-3.5 w-3.5" />
          <span>Autonomous Multi-Agent Architecture</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          How the SponsorPlay Swarm Works
        </h2>
        <p className="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed">
          Six specialized agents operate as a deterministic state machine, ensuring seamless verification, automated payments, and complete fiscal transparency without human intermediaries.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => {
          const Icon = agent.icon;
          return (
            <div
              key={agent.num}
              className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`h-10 w-10 rounded-xl ${agent.bgColor} ${agent.borderColor} border flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${agent.color}`} />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">AGENT {agent.num}</span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{agent.name}</h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">{agent.desc}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/60 text-xs text-slate-400 font-mono">
                {agent.detail}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
