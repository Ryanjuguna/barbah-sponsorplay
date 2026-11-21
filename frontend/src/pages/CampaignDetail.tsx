import { useState, useEffect } from 'react';
import {
  ArrowRight,
  Users,
  Trophy,
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
import { api } from '@/lib/api';
import { formatUSD, formatKES, getStatusColor } from '@/lib/utils';

interface CampaignDetailProps {
  onNavigate: (path: string) => void;
  campaignId: string;
}

interface CampaignDetailData {
  id: string;
  brand_name: string;
  corporate_pin: string;
  brief: string;
  target_audience: string;
  budget_usd: number;
  status: string;
  created_at: string;
  target_reach?: number;
  required_activities?: string[];
}

interface ProposalSummary {
  id: string;
  status: string;
  total_budget_usd: number;
  platform_fee_usd: number;
  net_creator_disbursement_usd: number;
  milestones: Array<{
    id: string;
    milestone_number: number;
    title: string;
    amount_usd: number;
    status: string;
  }>;
}

export const CampaignDetail = ({
  onNavigate,
  campaignId,
}: CampaignDetailProps) => {
  const [campaign, setCampaign] = useState<CampaignDetailData | null>(null);
  const [proposals, setProposals] = useState<ProposalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const campaigns = await api.listSeedCampaigns();
        const camp = campaigns.find((c) => c.id === campaignId);
        if (camp) {
          setCampaign({
            id: camp.id,
            brand_name: camp.brand_name,
            corporate_pin: camp.corporate_pin,
            brief: camp.brief,
            target_audience: camp.target_audience,
            budget_usd: camp.budget_usd,
            status: camp.status || 'ACTIVE',
            created_at: camp.created_at || new Date().toISOString(),
            target_reach: (camp as any).target_reach,
            required_activities: (camp as any).required_activities,
          });
        }
        setProposals([]);
      } catch (err: any) {
        setError(err.message || 'Failed to load campaign details');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [campaignId]);

  const handleBack = () => {
    onNavigate('/brand');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-4 border-[hsl(var(--primary))]/30 border-t-[hsl(var(--primary))] rounded-full animate-spin" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-2">
            Campaign Not Found
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] mb-6">
            The campaign you're looking for doesn't exist.
          </p>
          <Button variant="secondary" onClick={handleBack}>
            <ArrowRight className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/50 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={handleBack}>
              <ArrowRight className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
              <span className="font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                Back to Dashboard
              </span>
            </div>
            <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">
              Campaign Details
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

        <Card padding="lg" className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex items-center justify-center">
              <Users className="h-6 w-6 text-[hsl(var(--muted-foreground))]" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-[hsl(var(--foreground))]">
                {campaign.brand_name}
              </h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                KRA PIN: {campaign.corporate_pin}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]/30">
              <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1">
                Campaign Brief
              </p>
              <p className="text-sm text-[hsl(var(--foreground))] leading-relaxed">
                {campaign.brief}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1">
                  Target Audience
                </p>
                <p className="text-sm text-[hsl(var(--foreground))]">
                  {campaign.target_audience}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1">
                  Budget
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-[hsl(var(--foreground))]">
                    {formatUSD(campaign.budget_usd)}
                  </span>
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">
                    ≈ {formatKES(campaign.budget_usd * 130)}
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]">
                <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1">
                  Status
                </p>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(campaign.status)}`}
                >
                  {campaign.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>

          {campaign.required_activities && campaign.required_activities.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-3">
                Required Activities
              </p>
              <div className="flex flex-wrap gap-2">
                {campaign.required_activities.map((activity, idx) => (
                  <Badge
                    key={idx}
                    variant="terracotta"
                    className="text-xs"
                  >
                    {activity}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card padding="lg" className="mb-8">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">AI Syndicate Matches</CardTitle>
              <CardDescription>
                Agent 1: Talent & Syndicate Scout recommendations
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {proposals.length > 0 ? (
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <Card key={proposal.id} padding="md" hoverable>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-[hsl(var(--primary))]" />
                        <h4 className="font-bold text-[hsl(var(--foreground))]">
                          Syndicate Match
                        </h4>
                      </div>
                      <Badge variant="green">
                        {proposal.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[hsl(var(--muted-foreground))]">
                          Total Budget
                        </span>
                        <span className="font-medium text-[hsl(var(--foreground))]">
                          {formatUSD(proposal.total_budget_usd)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[hsl(var(--muted-foreground))]">
                          Platform Fee (10%)
                        </span>
                        <span className="font-medium text-[hsl(var(--foreground))]">
                          {formatUSD(proposal.platform_fee_usd)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[hsl(var(--muted-foreground))]">
                          Net to Creators (90%)
                        </span>
                        <span className="font-medium text-[hsl(var(--foreground))]">
                          {formatUSD(proposal.net_creator_disbursement_usd)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-[hsl(var(--border))]">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">
                        Milestones
                      </p>
                      <div className="space-y-2">
                        {proposal.milestones.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between p-2 rounded-lg border border-[hsl(var(--border))]/30 bg-[hsl(var(--background))]/30"
                          >
                            <span className="text-sm text-[hsl(var(--foreground))]">
                              Milestone {m.milestone_number}: {m.title}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-[hsl(var(--primary))]">
                                {formatUSD(m.amount_usd)}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusColor(m.status)}`}
                              >
                                {m.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
                <h3 className="font-bold text-[hsl(var(--foreground))] mb-2">
                  No Syndicate Matches Yet
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
                  Submit a campaign brief to get AI-matched syndicates from Agent 1.
                </p>
                <Button
                  variant="gold"
                  onClick={() => onNavigate('/brand/brief')}
                >
                  Submit Brief
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button variant="secondary" onClick={handleBack}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};