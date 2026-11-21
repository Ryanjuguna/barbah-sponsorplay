import React from 'react';
import { Gamepad2, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Gamepad2 className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="font-bold text-white text-base">Barbah SponsorPlay</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Autonomous multi-agent sponsorship marketplace with PayPal programmatic milestone ledger and KRA eTIMS tax compliance for Kenyan grassroots gaming.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
              <span>Nairobi, Kenya</span>
              <span>&bull;</span>
              <span>Barbah PlayEconomy</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Integrations</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                <span>PayPal Orders v2 & Payouts</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                <span>KRA eTIMS Fiscal Invoicing</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>WordPress Studio REST API</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                <span>Antigravity MCP Engine</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Local Development</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a
                  href="http://localhost:8881/wp-admin"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-400 flex items-center gap-1"
                >
                  <span>WordPress Admin (Studio)</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:8881/wp-json/wp/v2/posts"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-400 flex items-center gap-1"
                >
                  <span>Live WordPress REST Feed</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="http://127.0.0.1:8000/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-400 flex items-center gap-1"
                >
                  <span>FastAPI Swagger Docs</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>&copy; {new Date().getFullYear()} Barbah SponsorPlay &bull; Barbah Games (Kenya)</p>
          <p className="flex items-center gap-1">
            Built for PayPal Global Hackathon &bull; Powered by WordPress Headless CMS
          </p>
        </div>
      </div>
    </footer>
  );
};
