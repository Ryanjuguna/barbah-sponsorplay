import { useState, useEffect } from 'react';
import {
  Briefcase,
  DollarSign,
  ShieldCheck,
  Trophy,
  FileText,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { KPICard } from '@/components/ui/KPICard';
import { api } from '@/lib/api';
import { formatUSD, formatKES, getStatusColor, getDecisionColor } from '@/lib/utils';

interface CreatorDashboardProps {
  onNavigate: (path: string) => void;
}

export const CreatorDashboard = ({ onNavigate }: CreatorDashboardProps) => {
  /* Read creator_id from URL query params */
  const [creatorId, setCreatorId] = useState<string>('creator-001');
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'offers' | 'active' | 'completed' | 'certificates'>('offers');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('creator_id');
    if (id) {
      setCreatorId(id);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await api.getCreatorDashboard(creatorId);
        setDashboard(data);
      } catch (err) {
        console.error('Failed to load creator dashboard', err);
        // Fallback mock data for prototype demo
        setDashboard({
          creator: {
            id: creatorId,
            name: "Brian 'The Beast' Diang'a",
            gamer_tag: 'TheBeast_KE',
            type: 'PRO_PLAYER_STREAMER',
            primary_game: 'EA FC 25 / Mortal Kombat 1',
            location: 'Kibera, Nairobi',
            paypal_email: 'creator-thebeast@barbahgames.com',
            mpesa_phone: '+254712345678',
            base_rate_usd: 350,
            brand_safety_score: 98.5,
            etims_registered: true,
            kra_pin: 'A014982341Z',
            monthly_reach: 12500,
            avatar_text: 'BD',
          },
          pending_offers: [],
          active_deals: [],
          completed_deals: [],
          certificates: [],
          total_earned_usd: 0,
          total_earned_kes: 0,
          ledger_escrow_usd: 0,
          skills_passport: {
            tier: 'REGIONAL RISING STAR',
            credibility_index: 98.5,
            total_campaigns_completed: 3,
            verified_certificates_count: 0,
            badges: [
              { id: 'b1', name: 'Proof-of-Play Certified', issuer: 'Barbah OpenCV 5.0', icon: 'fa-certificate', color: 'emerald' },
              { id: 'b2', name: 'KRA eTIMS Tax Compliant', issuer: 'KRA BII Rail', icon: 'fa-shield-halved', color: 'sky' },
              { id: 'b3', name: 'PayPal Verified Payouts', issuer: 'PayPal Developer Rail', icon: 'fa-paypal', color: 'blue' },
            ],
            passport_hash: 'PASS-DEMO',
          },
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [creatorId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-4 border-[hsl(var(--primary))]/30 border-t-[hsl(var(--primary))] rounded-full animate-spin" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading portal...</p>
        </div>
      </div>
    );
  }

  const c = dashboard!.creator;
  const sp = dashboard!.skills_passport;

  const kpiData = [
    {
      title: 'Total Earned',
      value: formatUSD(dashboard!.total_earned_usd),
      trend: { label: 'KES equivalent', value: formatKES(dashboard!.total_earned_kes), positive: true },
      icon: <DollarSign className="h-5 w-5" />,
      iconColor: 'text-emerald-400',
    },
    {
      title: 'Escrow Balance',
      value: formatUSD(dashboard!.ledger_escrow_usd),
      trend: { label: 'Locked in PayPal ledger', value: 'Secure', positive: true },
      icon: <ShieldCheck className="h-5 w-5" />,
      iconColor: 'text-blue-400',
    },
    {
      title: 'Pending Offers',
      value: dashboard!.pending_offers.length,
      trend: { label: 'Awaiting your review', value: '', positive: true },
      icon: <Briefcase className="h-5 w-5" />,
      iconColor: 'text-amber-400',
    },
    {
      title: 'Active Deals',
      value: dashboard!.active_deals.length,
      trend: { label: 'Milestones in progress', value: '', positive: true },
      icon: <Trophy className="h-5 w-5" />,
      iconColor: 'text-purple-400',
    },
  ];

  const handleAcceptOffer = (proposalId: string) => {
    onNavigate(`/creator/offers/${proposalId}/accept`);
  };

  const handleUploadDeliverable = () => {
    onNavigate('/creator/deliverables');
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Top App Bar */}
      <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/50 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 py-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center">
                <span className="text-white font-bold">{c.avatar_text || 'C'}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">
                  Creator Portal
                </h1>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  @{c.gamer_tag} • {c.location}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full lg:w-auto">
              <Button variant="gold" onClick={handleUploadDeliverable} leftIcon={<Upload className="h-4 w-4" />}>
                Upload Deliverable
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {kpiData.map((kpi) => (
            <KPICard key={kpi.title} {...kpi} />
          ))}
        </div>

        {/* Skills Passport */}
        <Card padding="md" className="mb-8 border-[hsl(var(--secondary))]/30 shadow-[var(--shadow-green)]">
          <CardHeader className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Skills Passport</CardTitle>
              <CardDescription>
                Portable reputation — {sp.tier} • Credibility Index {sp.credibility_index}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant={sp.credibility_index >= 98 ? 'green' : 'terracotta'}>
                {sp.tier}
              </Badge>
              <Badge variant="slate">
                {sp.total_campaigns_completed} Campaigns
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-4 mb-4">
              {sp.badges.map((badge: { id: string; name: string; color: string }) => (
                <span
                  key={badge.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${
                    badge.color === 'emerald'
                      ? 'border-emerald-500/20 bg-emerald-900/10 text-emerald-400'
                      : badge.color === 'sky'
                      ? 'border-sky-500/20 bg-sky-900/10 text-sky-400'
                      : badge.color === 'blue'
                      ? 'border-blue-500/20 bg-blue-900/10 text-blue-400'
                      : badge.color === 'purple'
                      ? 'border-purple-500/20 bg-purple-900/10 text-purple-400'
                      : badge.color === 'amber'
                      ? 'border-amber-500/20 bg-amber-900/10 text-amber-400'
                      : 'border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 text-[hsl(var(--muted-foreground))]'
                  }`}
                >
                  {badge.name}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Passport Hash
                </p>
                <p className="text-sm font-mono text-[hsl(var(--foreground))]">
                  {sp.passport_hash}
                </p>
              </div>
              <Badge variant="gold">Verified</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-[hsl(var(--border))]/50">
          {[
            { id: 'offers', label: 'Pending Offers', count: dashboard!.pending_offers.length },
            { id: 'active', label: 'Active Deals', count: dashboard!.active_deals.length },
            { id: 'completed', label: 'Completed', count: dashboard!.completed_deals.length },
            { id: 'certificates', label: 'Certificates', count: dashboard!.certificates.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-[hsl(var(--primary))] text-[hsl(var(--foreground))]'
                  : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 h-5 w-5 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-[10px] font-bold flex items-center justify-center">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Pending Offers */}
          {activeTab === 'offers' && (
            <div>
              <h3 className="text-lg font-bold text-[hsl(var(--foreground))] mb-4">
                Sponsorship Offers
              </h3>
              {dashboard!.pending_offers.length > 0 ? (
                <div className="space-y-4">
                  {dashboard!.pending_offers.map((offer: any) => (
                    <Card key={offer.id} padding="md" hoverable>
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-[hsl(var(--foreground))]">
                            {offer.campaign?.brand_name || 'Brand Campaign'}
                          </h4>
                          <p className="text-sm text-[hsl(var(--muted-foreground))]">
                            {formatUSD(offer.total_budget_usd)} budget •
                            {offer.milestones.length} milestones
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(offer.status)}`}
                          >
                            {offer.status.replace(/_/g, ' ')}
                          </span>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAcceptOffer(offer.id)}
                          >
                            Accept Offer
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card padding="lg" className="text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Briefcase className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />
                    <h4 className="font-medium text-[hsl(var(--foreground))]">No pending offers</h4>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      When brands send you sponsorship offers, they'll appear here.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Active Deals */}
          {activeTab === 'active' && (
            <div>
              <h3 className="text-lg font-bold text-[hsl(var(--foreground))] mb-4">
                Active Deals
              </h3>
              {dashboard!.active_deals.length > 0 ? (
                <div className="space-y-4">
                  {dashboard!.active_deals.map((deal: any) => (
                    <Card key={deal.id} padding="md" hoverable>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {deal.campaign?.brand_name || 'Active Campaign'}
                        </CardTitle>
                        <CardDescription>
                          {formatUSD(deal.total_budget_usd)} • {deal.milestones.length} milestones
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {deal.milestones.map((m: any, idx: number) => (
                            <div
                              key={m.id}
                              className="flex items-center justify-between p-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]/30"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-full bg-[hsl(var(--card))] flex items-center justify-center">
                                  <span className="text-xs font-bold">{idx + 1}</span>
                                </div>
                                <p className="text-sm text-[hsl(var(--foreground))]">{m.title}</p>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusColor(m.status)}`}
                              >
                                {m.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="ghost" size="sm" onClick={handleUploadDeliverable}>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Deliverable
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card padding="lg" className="text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Trophy className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />
                    <h4 className="font-medium text-[hsl(var(--foreground))]">No active deals</h4>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      Accept an offer to start working on milestones.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Completed Deals */}
          {activeTab === 'completed' && (
            <div>
              <h3 className="text-lg font-bold text-[hsl(var(--foreground))] mb-4">
                Completed Deals
              </h3>
              {dashboard!.completed_deals.length > 0 ? (
                <div className="space-y-4">
                  {dashboard!.completed_deals.map((deal: any) => (
                    <Card key={deal.id} padding="md">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-[hsl(var(--foreground))]">
                            {deal.campaign?.brand_name || 'Completed Campaign'}
                          </h4>
                          <p className="text-sm text-[hsl(var(--muted-foreground))]">
                            Paid: {formatUSD(deal.net_creator_disbursement_usd)}
                          </p>
                        </div>
                        <Badge variant="green">Paid</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card padding="lg" className="text-center">
                  <div className="flex flex-col items-center gap-3">
                    <FileText className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />
                    <h4 className="font-medium text-[hsl(var(--foreground))]">No completed deals yet</h4>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      Complete milestones to build your track record.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Certificates */}
          {activeTab === 'certificates' && (
            <div>
              <h3 className="text-lg font-bold text-[hsl(var(--foreground))] mb-4">
                Proof-of-Play Certificates
              </h3>
              {dashboard!.certificates.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {dashboard!.certificates.map((cert: any) => (
                    <Card key={cert.certificate_id} padding="md">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-[hsl(var(--foreground))]">
                            Certificate of Verification
                          </h4>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            {cert.certificate_id}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded text-[10px] font-bold ${getDecisionColor(cert.verification_decision)}`}
                        >
                          {cert.verification_decision}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[hsl(var(--muted-foreground))]">Logo Screen Time</span>
                          <span className="font-medium text-[hsl(var(--foreground))]">
                            {cert.logo_screen_ratio_percent}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[hsl(var(--muted-foreground))]">Airtime</span>
                          <span className="font-medium text-[hsl(var(--foreground))]">
                            {Math.floor(cert.airtime_seconds / 60)} min
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[hsl(var(--muted-foreground))]">Confidence</span>
                          <span className="font-medium text-[hsl(var(--foreground))]">
                            {cert.overall_confidence_percent}%
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card padding="lg" className="text-center">
                  <div className="flex flex-col items-center gap-3">
                    <ShieldCheck className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />
                    <h4 className="font-medium text-[hsl(var(--foreground))]">No certificates yet</h4>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      Verified deliverables generate cryptographic certificates here.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};