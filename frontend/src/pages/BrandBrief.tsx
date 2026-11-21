import { useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  Trophy,
  DollarSign,
  Play,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { formatUSD, formatKES } from '@/lib/utils';


interface BrandBriefProps {
  onNavigate: (path: string) => void;
}

interface SyndicateRecommendation {
  syndicate_id: string;
  name: string;
  description: string;
  total_budget_usd: number;
  members: Array<{
    creator_id: string;
    name: string;
    gamer_tag: string;
    type: string;
    role_in_syndicate: string;
    rate_usd: number;
  }>;
  match_score: number;
  audience_overlap: number;
  community_density: number;
}

export const BrandBrief = ({ onNavigate }: BrandBriefProps) => {
  const [step, setStep] = useState<'form' | 'matches' | 'proposal'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syndicates, setSyndicates] = useState<SyndicateRecommendation[]>([]);
  const [selectedSyndicate, setSelectedSyndicate] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    brand_name: '',
    corporate_pin: '',
    brief: '',
    target_audience: '',
    budget_usd: '',
  });

  const handleInputChange = (
    key: keyof typeof formData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmitBrief = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const brief = {
        brand_name: formData.brand_name,
        corporate_pin: formData.corporate_pin,
        brief: formData.brief,
        target_audience: formData.target_audience,
        budget_usd: parseFloat(formData.budget_usd) || 0,
      };

      const recommendations = await api.submitBrief({
        ...brief,
        id: `CAMP-${Date.now().toString(36)}`,
      });
      setSyndicates(recommendations);
      setStep('matches');
    } catch (err: any) {
      setError(err.message || 'Failed to submit brief. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSyndicate = (syndicateId: string) => {
    setSelectedSyndicate(syndicateId);
    setStep('proposal');
  };

  const handleBackToForm = () => {
    setStep('form');
    setSelectedSyndicate(null);
  };

  const handleCreateProposal = async () => {
    if (!selectedSyndicate) return;
    setIsLoading(true);
    try {
      await api.createProposal({
        campaign_id: `CAMP-${Date.now().toString(36)}`,
        syndicate_id: selectedSyndicate,
        beneficiary_email: undefined,
      });
      // Navigate to proposal view - for now, go back to brand dashboard
      onNavigate('/brand');
    } catch (err: any) {
      setError(err.message || 'Failed to create proposal.');
    } finally {
      setIsLoading(false);
    }
  };

  const syndicate = syndicates.find((s) => s.syndicate_id === selectedSyndicate);

  /* ============ STEP 1: Brief Form ============ */
  if (step === 'form') {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))]">
        <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/50 backdrop-blur sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-6">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('/brand')}>
                <ArrowRight className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                <span className="font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                  Back to Dashboard
                </span>
              </div>
              <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">
                Submit Campaign Brief
              </h1>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-900/20 text-red-300 text-sm">
              {error}
            </div>
          )}

          <Card padding="lg">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="h-5 w-5 text-[hsl(var(--primary))]" />
                <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">
                  Tell us about your campaign
                </h2>
              </div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                AI will match you with verified creator syndicates within minutes.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmitBrief} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[hsl(var(--foreground))]">
                      Brand Name
                    </label>
                    <Input
                      value={formData.brand_name}
                      onChange={(e) => handleInputChange('brand_name', e.target.value)}
                      placeholder="e.g. Safaricom 5G"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[hsl(var(--foreground))]">
                      Corporate PIN (KRA)
                    </label>
                    <Input
                      value={formData.corporate_pin}
                      onChange={(e) => handleInputChange('corporate_pin', e.target.value)}
                      placeholder="e.g. P051234567A"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[hsl(var(--foreground))]">
                    Campaign Brief
                  </label>
                    <textarea
                    value={formData.brief}
                    onChange={(e) => handleInputChange('brief', e.target.value)}
                    placeholder="Describe your campaign goals, target audience, and desired activities..."
                    className="w-full min-h-[120px] rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2 text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))]/60 transition-all focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[hsl(var(--foreground))]">
                      Target Audience
                    </label>
                    <Input
                      value={formData.target_audience}
                      onChange={(e) => handleInputChange('target_audience', e.target.value)}
                      placeholder="e.g. 16-25 urban youth gamers in Nairobi"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[hsl(var(--foreground))]">
                      Budget (USD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]">$</span>
                      <Input
                        value={formData.budget_usd}
                        onChange={(e) => handleInputChange('budget_usd', e.target.value)}
                        placeholder="e.g. 769.23"
                        className="pl-8"
                        type="number"
                        required
                      />
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {formData.budget_usd ? `≈ ${formatKES(parseFloat(formData.budget_usd) * 130)}` : ''}
                    </p>
                  </div>
                </div>

                <div className="bg-[hsl(var(--secondary))]/10 border border-[hsl(var(--secondary))]/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-[hsl(var(--secondary))] mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-bold text-[hsl(var(--foreground))] mb-1">
                        What happens next
                      </h4>
                      <ul className="text-sm text-[hsl(var(--muted-foreground))] space-y-1 list-disc pl-4">
                        <li>AI Scout Agent analyzes your brief</li>
                        <li>Matched creator syndicates returned</li>
                        <li>Select a syndicate or solo creator</li>
                        <li>Milestone contract generated with fee splits</li>
                        <li>Fund via PayPal milestone ledger</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-full"
                  isLoading={isLoading}
                  disabled={isLoading}
                  leftIcon={<Play className="h-4 w-4" />}
                >
                  Submit Brief & Get AI Matches
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  /* ============ STEP 2: Syndicate Matches ============ */
  if (step === 'matches') {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))]">
        <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/50 backdrop-blur sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-6">
              <div className="flex items-center gap-3 cursor-pointer" onClick={handleBackToForm}>
                <ArrowRight className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                <span className="font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                  Edit Brief
                </span>
              </div>
              <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">
                AI-Matched Syndicates
              </h1>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">
                Recommended Sponsorship Syndicates
              </h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Bundled by Agent 1: Talent & Syndicate Scout
              </p>
            </div>
            <Badge variant="terracotta">
              {syndicates.length} matches
            </Badge>
          </div>

          <div className="space-y-4">
            {syndicates.map((syndicate) => (
              <Card
                key={syndicate.syndicate_id}
                padding="md"
                hoverable
                className={`cursor-pointer group ${
                  selectedSyndicate === syndicate.syndicate_id
                    ? 'border-[hsl(var(--primary))] shadow-[var(--shadow-terracotta)] bg-[hsl(var(--card))]/95'
                    : ''
                }`}
                onClick={() => handleSelectSyndicate(syndicate.syndicate_id)}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={syndicate.match_score >= 90 ? 'green' : 'terracotta'}>
                        {Math.round(syndicate.match_score)}% Match
                      </Badge>
                      <Badge variant="gold">
                        {syndicate.members.length} Creators
                      </Badge>
                    </div>
                    <h3 className="font-bold text-lg text-[hsl(var(--foreground))] mb-1">
                      {syndicate.name}
                    </h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">
                      {syndicate.description}
                    </p>

                    <div className="space-y-3 mb-4">
                      {syndicate.members.map((member) => (
                        <div
                          key={member.creator_id}
                          className="flex items-center justify-between px-3 py-2 rounded-lg border border-[hsl(var(--border))]/50 bg-[hsl(var(--background))]/30"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[hsl(var(--foreground))]">
                              {member.name}
                            </span>
                            <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                              @{member.gamer_tag}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[hsl(var(--foreground))]">
                              ${member.rate_usd}
                            </span>
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">
                              {member.role_in_syndicate}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[hsl(var(--border))]">
                      <div className="text-center">
                        <div className="text-xs font-bold text-[hsl(var(--foreground))]">
                          {syndicate.total_budget_usd}
                        </div>
                        <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                          Total Budget
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-bold text-[hsl(var(--foreground))]">
                          {syndicate.audience_overlap}%
                        </div>
                        <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                          Audience Overlap
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-bold text-[hsl(var(--foreground))]">
                          {syndicate.community_density}
                        </div>
                        <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                          Community Density
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSelectSyndicate(syndicate.syndicate_id)}
                      className={selectedSyndicate === syndicate.syndicate_id ? 'opacity-100' : 'opacity-60'}
                    >
                      Select Syndicate
                    </Button>
                    {selectedSyndicate === syndicate.syndicate_id && (
                      <CheckMark className="h-5 w-5 text-emerald-400" />
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <Button variant="secondary" onClick={handleCreateProposal} disabled={!selectedSyndicate}>
              Create Proposal & Contract
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ============ STEP 3: Proposal / Contract ============ */
  if (step === 'proposal') {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))]">
        <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/50 backdrop-blur sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-6">
              <div className="flex items-center gap-3 cursor-pointer" onClick={handleBackToForm}>
                <ArrowRight className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                <span className="font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                  Select Different Syndicate
                </span>
              </div>
              <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">
                Review & Create Contract
              </h1>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card padding="lg">
            <CardHeader>
              <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">
                Milestone Contract Preview
              </h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Agent 2: Campaign Architect will generate the executable contract.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {syndicate && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-[hsl(var(--foreground))]">
                          {syndicate.name}
                        </h3>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                          Syndicate ID: {syndicate.syndicate_id}
                        </p>
                      </div>
                      <Badge variant="terracotta">Ready to Fund</Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-[hsl(var(--muted-foreground))]">
                          Total Campaign Budget
                        </span>
                        <span className="font-medium text-[hsl(var(--foreground))]">
                          {formatUSD(syndicate.total_budget_usd)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[hsl(var(--muted-foreground))]">
                          Platform Fee (10%)
                        </span>
                        <span className="font-medium text-[hsl(var(--foreground))]">
                          {formatUSD(syndicate.total_budget_usd * 0.1)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[hsl(var(--muted-foreground))]">
                          Net to Creators (90%)
                        </span>
                        <span className="font-medium text-[hsl(var(--foreground))]">
                          {formatUSD(syndicate.total_budget_usd * 0.9)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[hsl(var(--muted-foreground))]">
                          Withholding Tax (5% on net)
                        </span>
                        <span className="font-medium text-[hsl(var(--foreground))]">
                          {formatUSD(syndicate.total_budget_usd * 0.9 * 0.05)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[hsl(var(--border))]">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-3">
                        Syndicate Members
                      </h4>
                      <div className="space-y-2">
                        {syndicate.members.map((member) => (
                          <div key={member.creator_id} className="flex items-center justify-between p-2 rounded-lg border border-[hsl(var(--border))]/30">
                            <div className="flex items-center gap-2">
                              <Trophy className="h-4 w-4 text-[hsl(var(--primary))]" />
                              <span className="text-sm text-[hsl(var(--foreground))]">
                                {member.name} (@{member.gamer_tag})
                              </span>
                            </div>
                            <span className="text-sm font-mono text-[hsl(var(--primary))]">
                              ${member.rate_usd}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[hsl(var(--secondary))]/10 border border-[hsl(var(--secondary))]/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-[hsl(var(--secondary))] mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-bold text-[hsl(var(--foreground))] mb-1">
                          Compliance Included
                        </h4>
                        <ul className="text-sm text-[hsl(var(--muted-foreground))] space-y-1 list-disc pl-4">
                          <li>KRA eTIMS BII tax invoice generated automatically</li>
                          <li>5% withholding tax deducted and remitted</li>
                          <li>PayPal milestone ledger with programmatic escrow</li>
                          <li>Instant M-Pesa off-ramp for creators</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="gold"
                    className="w-full"
                    isLoading={isLoading}
                    disabled={isLoading}
                    onClick={handleCreateProposal}
                    leftIcon={<Briefcase className="h-4 w-4" />}
                  >
                    Generate Contract & Fund Ledger
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};

/* Small checkmark icon since lucide CheckCircle2 wasn't imported */
function CheckMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}