import { Gamepad2, Mail, MapPin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center">
                <Gamepad2 className="h-4 w-4 text-white" />
              </div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-[hsl(var(--accent))] bg-clip-text text-transparent">
                DHAMINI
              </span>
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-xs leading-relaxed">
              Sponsoring the next generation of African gaming talent with verified
              PayPal milestones and KRA eTIMS tax compliance.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[hsl(var(--foreground))] uppercase tracking-wider mb-4">
              For Brands
            </h4>
            <ul className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
              <li className="hover:text-[hsl(var(--foreground))] cursor-pointer transition-colors">
                Submit a Brief
              </li>
              <li className="hover:text-[hsl(var(--foreground))] cursor-pointer transition-colors">
                View Syndicates
              </li>
              <li className="hover:text-[hsl(var(--foreground))] cursor-pointer transition-colors">
                Tax Invoices
              </li>
              <li className="hover:text-[hsl(var(--foreground))] cursor-pointer transition-colors">
                Impact Dossiers
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[hsl(var(--foreground))] uppercase tracking-wider mb-4">
              For Creators
            </h4>
            <ul className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
              <li className="hover:text-[hsl(var(--foreground))] cursor-pointer transition-colors">
                Browse Campaigns
              </li>
              <li className="hover:text-[hsl(var(--foreground))] cursor-pointer transition-colors">
                Accept Offers
              </li>
              <li className="hover:text-[hsl(var(--foreground))] cursor-pointer transition-colors">
                Upload Deliverables
              </li>
              <li className="hover:text-[hsl(var(--foreground))] cursor-pointer transition-colors">
                Skills Passport
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[hsl(var(--foreground))] uppercase tracking-wider mb-4">
              Compliance
            </h4>
            <ul className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
              <li className="hover:text-[hsl(var(--foreground))] cursor-pointer transition-colors">
                PayPal Milestone Ledger
              </li>
              <li className="hover:text-[hsl(var(--foreground))] cursor-pointer transition-colors">
                KRA eTIMS BII Invoicing
              </li>
              <li className="hover:text-[hsl(var(--foreground))] cursor-pointer transition-colors">
                Withholding Tax (5%)
              </li>
              <li className="hover:text-[hsl(var(--foreground))] cursor-pointer transition-colors">
                M-Pesa Off-Ramp
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[hsl(var(--foreground))] uppercase tracking-wider mb-4">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
              <li className="flex items-center gap-2 hover:text-[hsl(var(--foreground))] transition-colors">
                <Mail className="h-4 w-4" />
                proposals@dhamini.ke
              </li>
              <li className="flex items-center gap-2 hover:text-[hsl(var(--foreground))] transition-colors">
                <MapPin className="h-4 w-4" />
                Nairobi, Kenya
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[hsl(var(--border))] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Dhamini — Sponsorship Marketplace for African Gaming Talent
          </p>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors text-sm"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-[hsl(var(--muted-foreground))] hover:text-text-[hsl(var(--foreground))] transition-colors text-sm"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors text-sm"
            >
              Compliance
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};