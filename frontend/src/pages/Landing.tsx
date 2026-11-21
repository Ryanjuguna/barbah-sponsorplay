import { useEffect, useCallback, useRef } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  DollarSign,
  Bot,
  Trophy,
  Zap,
  Play,
  Link,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface LandingProps {
  onNavigate: (path: string) => void;
}

export const Landing = ({ onNavigate }: LandingProps) => {
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleLoginAs = (role: 'brand' | 'creator') => {
    onNavigate(`/login?role=${role}`);
  };

  const statItems = [
    {
      label: 'Market Size',
      value: '$137M',
      sub: 'Kenya gaming & esports audience',
      icon: DollarSign,
      color: 'text-[hsl(var(--primary))]',
    },
    {
      label: 'Tax Compliant',
      value: '100%',
      sub: 'Automated KRA eTIMS BII invoicing',
      icon: ShieldCheck,
      color: 'text-[hsl(var(--secondary))]',
    },
    {
      label: 'Platform Fee',
      value: '10%',
      sub: 'PayPal milestone ledger escrow',
      icon: Zap,
      color: 'text-blue-400',
    },
    {
      label: 'AI Agents',
      value: '6',
      sub: 'Verification & matching swarm',
      icon: Bot,
      color: 'text-purple-400',
    },
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Submit Brief',
      description:
        'Corporate brands submit a campaign brief with budget and target audience.',
    },
    {
      step: '02',
      title: 'AI Matching',
      description:
        'Agent swarm bundles creators into synergistic sponsorship syndicates.',
    },
    {
      step: '03',
      title: 'Fund & Verify',
      description:
        'PayPal milestone ledger locks funds; AI verifies stream deliverables.',
    },
    {
      step: '04',
      title: 'Tax & Payout',
      description:
        'KRA eTIMS invoice issued; creator paid instantly to PayPal / M-Pesa.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col text-[hsl(var(--foreground))]">
      <style>
        {`
          .ambient-canvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: -1;
            overflow: hidden;
            background: radial-gradient(ellipse 800px 600px at 20% -10%, rgba(194, 65, 12, 0.08), transparent 50%),
                        radial-gradient(ellipse 700px 500px at 80% 0%, rgba(20, 83, 45, 0.06), transparent 50%),
                        radial-gradient(ellipse 600px 400px at 50% 100%, rgba(217, 119, 6, 0.05), transparent 50%);
          }
          .glow-dot {
            position: absolute;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            pointer-events: none;
            z-index: -1;
          }
        `}
      </style>

      {/* Ambient background canvas */}
      <div className="ambient-canvas" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className="glow-dot"
            style={{
              left: `${20 + i * 12}%`,
              top: `${30 + i * 8}%`,
              backgroundColor:
                i % 3 === 0
                  ? 'rgba(194, 65, 12, 0.4)'
                  : i % 3 === 1
                  ? 'rgba(20, 83, 45, 0.3)'
                  : 'rgba(217, 119, 6, 0.35)',
              boxShadow: `0 0 40px ${
                i % 3 === 0
                  ? 'rgba(194, 65, 12, 0.6)'
                  : i % 3 === 1
                  ? 'rgba(20, 83, 45, 0.5)'
                  : 'rgba(217, 119, 6, 0.55)'
              }`,
              transform: `translate(${mouseRef.current.x / 50}px, ${mouseRef.current.y / 50}px)`,
              transition: 'transform 0.1s ease-out',
            }}
          />
        ))}
      </div>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative px-4 pt-20 pb-32 sm:pt-24 sm:pb-36 lg:pt-40 lg:pb-48 overflow-hidden">
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-[hsl(var(--foreground))] mb-6 leading-tight">
              Sponsor the next{' '}
              <span className="text-gradient-terracotta">
                generation of African
              </span>{' '}
              gaming talent
            </h1>

            <p className="text-lg sm:text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto mb-10 leading-relaxed">
              The first sponsorship marketplace built for African gaming. Brands
              reach verified grassroots talent through AI-matched syndicates,
              PayPal milestone escrow, and certified KRA eTIMS tax invoices —
              competent, compliant, and built to scale.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button
                variant="gold"
                size="lg"
                onClick={() => handleLoginAs('brand')}
                leftIcon={<Play className="h-5 w-5" />}
              >
                Start Sponsoring
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => handleLoginAs('creator')}
                rightIcon={<ArrowRight className="h-5 w-5" />}
              >
                Join as Creator
              </Button>
            </div>

            {/* Trust signals row */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-[hsl(var(--muted-foreground))] text-sm font-medium border border-[hsl(var(--border))]/40 p-6 rounded-2xl bg-[hsl(var(--card))]/40 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[hsl(var(--secondary))]" />
                <span>KRA eTIMS Tax Compliant</span>
              </div>
              <div className="w-px h-4 bg-[hsl(var(--border))]" />
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-400" />
                <span>PayPal Milestone Escrow</span>
              </div>
              <div className="w-px h-4 bg-[hsl(var(--border))]" />
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-400" />
                <span>6 AI Verification Agents</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-y border-[hsl(var(--border))]/40 bg-[hsl(var(--card))]/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-16 sm:py-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {statItems.map((stat) => (
                <Card key={stat.label} padding="md" hoverable>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-xl bg-[hsl(var(--secondary))]/10 ${stat.color}`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      {stat.label}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-[hsl(var(--foreground))] mb-1">
                    {stat.value}
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{stat.sub}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 sm:py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] text-[10px] font-semibold tracking-wider uppercase mb-4">
                How It Works
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[hsl(var(--foreground))] tracking-tight mb-6">
                From brief to payout in four steps
              </h2>
              <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
                Every sponsorship is verified, tax-compliant, and milestone-based.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {howItWorks.map((step) => (
                <Card key={step.step} padding="md" hoverable className="group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 flex items-center justify-center text-[hsl(var(--primary))] group-hover:bg-[hsl(var(--primary))]/20 transition-colors">
                      <span className="text-sm font-bold">{step.step}</span>
                    </div>
                    <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                    {step.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* For Brands */}
        <section id="for-brands" className="py-20 sm:py-24 bg-[hsl(var(--background))]/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] text-[10px] font-semibold tracking-wider uppercase mb-4">
                  For Procurement Officers
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-[hsl(var(--foreground))] tracking-tight mb-6">
                  Sponsorship that survives audit
                </h2>
                <p className="text-lg text-[hsl(var(--muted-foreground))] mb-8 leading-relaxed max-w-lg">
                  Corporate sponsors need more than vanity metrics. Dhamini delivers
                  certified KRA eTIMS tax invoices on every campaign, PayPal milestone
                  escrow with AI-verified deliverables, and full impact reporting — so
                  every shilling is accounted for.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-900/20 text-emerald-400 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[hsl(var(--foreground))]">100% Tax Deductible</h4>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        KRA Section 16 compliant eTIMS invoices on every expense.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-900/20 text-blue-400 flex items-center justify-center">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[hsl(var(--foreground))]">Milestone Escrow</h4>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        Funds released only after AI-verified Proof-of-Play.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-purple-900/20 text-purple-400 flex items-center justify-center">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[hsl(var(--foreground))]">Verified Syndicates</h4>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        AI-bundled creator groups with authentic community density.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <Card padding="lg" className="border-[hsl(var(--primary))]/30 shadow-[var(--shadow-terracotta)]">
                  <CardHeader>
                    <CardTitle className="text-xl">Launch a Campaign</CardTitle>
                    <CardDescription>
                      Get started with a 15-minute brief setup.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-[hsl(var(--muted-foreground))]">Brand name</span>
                        <span className="text-xs font-medium text-[hsl(var(--primary))]">e.g. Safaricom 5G</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-[hsl(var(--muted-foreground))]">Budget</span>
                        <span className="text-xs font-medium text-[hsl(var(--primary))]">KES 100,000+</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-[hsl(var(--muted-foreground))]">Timeline</span>
                        <span className="text-xs font-medium text-[hsl(var(--primary))]">4-8 weeks</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-[hsl(var(--muted-foreground))]">Tax handling</span>
                        <span className="text-xs font-medium text-[hsl(var(--primary))]">Automatic eTIMS</span>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => handleLoginAs('brand')}
                    >
                      Submit Brief
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* For Creators */}
        <section id="for-creators" className="py-20 sm:py-24 border-y border-[hsl(var(--border))]/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center reverse-mobile">
              <div className="relative">
                <Card padding="lg" className="border-[hsl(var(--secondary))]/30 shadow-[var(--shadow-green)]">
                  <CardHeader>
                    <CardTitle className="text-xl">Creator Dashboard</CardTitle>
                    <CardDescription>
                      Track offers, deliverables, and payouts in one place.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[hsl(var(--muted-foreground))]">Pending Offers</span>
                        <Badge variant="terracotta">3</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[hsl(var(--muted-foreground))]">Active Deals</span>
                        <Badge variant="green">2</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[hsl(var(--muted-foreground))]">Total Earned</span>
                        <span className="font-bold text-[hsl(var(--foreground))]">$0.00</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[hsl(var(--muted-foreground))]">Escrow Balance</span>
                        <span className="font-bold text-[hsl(var(--foreground))]">$0.00</span>
                      </div>
                    </div>
                    <Button variant="gold" className="w-full" onClick={() => handleLoginAs('creator')}>
                      Open Portal
                    </Button>
                  </CardContent>
                </Card>
              </div>
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--secondary))]/10 border border-[hsl(var(--secondary))]/20 text-[hsl(var(--secondary))] text-[10px] font-semibold tracking-wider uppercase mb-4">
                  For Gaming Talent
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-[hsl(var(--foreground))] tracking-tight mb-6">
                  Get paid fairly, fast, and verified
                </h2>
                <p className="text-lg text-[hsl(var(--muted-foreground))] mb-8 leading-relaxed max-w-lg">
                  No more Net-90 payment terms or ghosting brands. Dhamini matches
                  you with corporate sponsors, verifies your deliverables with AI,
                  and releases instant payouts to PayPal with M-Pesa off-ramp.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-900/20 text-emerald-400 flex items-center justify-center">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[hsl(var(--foreground))]">Skills Passport</h4>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        Portable reputation that unlocks higher-tier sponsorships.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-900/20 text-blue-400 flex items-center justify-center">
                      <Link className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[hsl(var(--foreground))]">Instant Payouts</h4>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        Verified milestones paid to PayPal, withdrawable to M-Pesa.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Compliance */}
        <section id="compliance" className="py-20 sm:py-24 bg-[hsl(var(--card))]/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--accent))]/10 border border-[hsl(var(--accent))]/20 text-[hsl(var(--accent))] text-[10px] font-semibold tracking-wider uppercase mb-4">
                  Dual-Rail Finance
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-[hsl(var(--foreground))] tracking-tight mb-4">
                  PayPal + KRA eTIMS
                </h2>
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-4 text-sm text-[hsl(var(--muted-foreground))]">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-400" />
                    <span>International Payments</span>
                  </div>
                  <div className="w-px h-5 bg-[hsl(var(--border))]" />
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[hsl(var(--secondary))]" />
                    <span>Kenyan Tax Compliance</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card padding="md">
                <CardHeader>
                  <CardTitle className="text-lg">PayPal Orders v2</CardTitle>
                  <CardDescription>
                    Multiparty payment instructions with milestone-ledger budget locks.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card padding="md">
                <CardHeader>
                  <CardTitle className="text-lg">KRA eTIMS BII</CardTitle>
                  <CardDescription>
                    Buyer-Initiated Invoicing for grassroots creators without corporate structure.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card padding="md">
                <CardHeader>
                  <CardTitle className="text-lg">5% WHT Deducted</CardTitle>
                  <CardDescription>
                    Statutory Kenyan withholding tax withheld and remitted automatically.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 sm:py-32">
          <div className="max-w-4xl mx-auto px-4">
            <Card padding="lg" className="text-center border-[hsl(var(--primary))]/30 shadow-[var(--shadow-terracotta)] relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-[hsl(var(--accent))]/10 rounded-full blur-2xl" />
              <h2 className="text-3xl sm:text-4xl font-black text-[hsl(var(--foreground))] mb-6">
                Ready to sponsor African gaming talent?
              </h2>
              <p className="text-lg text-[hsl(var(--muted-foreground))] mb-10 max-w-lg mx-auto">
                Join the procurement officers and brands already running compliant,
                verified esports sponsorships in Kenya.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  variant="gold"
                  size="lg"
                  onClick={() => handleLoginAs('brand')}
                >
                  Start a Campaign
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => handleLoginAs('creator')}
                >
                  Join as Creator
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
};