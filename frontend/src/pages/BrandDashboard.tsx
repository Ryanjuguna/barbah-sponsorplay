import { useState, useEffect } from 'react';
import {
  Briefcase,
  DollarSign,
  ArrowRight,
  Users,
  FileText,
  Plus,
  Search,
  Download,
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
import { Input } from '@/components/ui/Input';
import { KPICard } from '@/components/ui/KPICard';
import { api } from '@/lib/api';
import { formatUSD, formatKES, formatDate, getStatusColor } from '@/lib/utils';

interface BrandDashboardProps {
  onNavigate: (path: string) => void;
}

interface CampaignCardProps {
  id: string;
  brand_name: string;
  budget_usd: number;
  status: string;
  target_audience: string;
  created_at: string;
  creator_count?: number;
}

export const BrandDashboard = ({ onNavigate }: BrandDashboardProps) => {
  const [campaigns, setCampaigns] = useState<CampaignCardProps[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const kpiData = [
    {
      title: 'Active Campaigns',
      value: campaigns.length,
      trend: { label: 'vs last month', value: '+12%', positive: true },
      icon: <Briefcase className="h-5 w-5" />,
      iconColor: 'text-[hsl(var(--primary))]',
    },
    {
      title: 'Budget Committed',
      value: formatUSD(
        campaigns.reduce((sum, c) => sum + c.budget_usd, 0)
      ),
      trend: {
        label: 'KES equivalent',
        value: formatKES(campaigns.reduce((sum, c) => sum + c.budget_usd, 0) * 130),
        positive: true,
      },
      icon: <DollarSign className="h-5 w-5" />,
      iconColor: 'text-[hsl(var(--primary))]',
    },
    {
      title: 'Tax Invoices Issued',
      value: 0,
      trend: { label: 'KRA eTIMS compliant', value: '100%', positive: true },
      icon: <FileText className="h-5 w-5" />,
      iconColor: 'text-[hsl(var(--secondary))]',
    },
    {
      title: 'Creators Sponsored',
      value: creators.length,
      trend: { label: 'Active syndicates', value: '3', positive: true },
      icon: <Users className="h-5 w-5" />,
      iconColor: 'text-[hsl(var(--accent))]',
    },
  ];

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.brand_name.toLowerCase().includes(search.toLowerCase()) ||
      c.target_audience.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || c.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [creatorsData, campaignsData] = await Promise.all([
          api.listCreators(),
          api.listSeedCampaigns(),
        ]);
        setCreators(creatorsData);
        setCampaigns(
          campaignsData.map((c) => ({
            id: c.id,
            brand_name: c.brand_name,
            budget_usd: c.budget_usd,
            status: c.status || 'ACTIVE',
            target_audience: c.target_audience,
            created_at: c.created_at || new Date().toISOString(),
            creator_count: 3,
          }))
        );
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSubmitBrief = () => {
    onNavigate('/brand/brief');
  };

  const handleViewCampaign = (id: string) => {
    onNavigate(`/brand/campaigns/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-4 border-[hsl(var(--primary))]/30 border-t-[hsl(var(--primary))] rounded-full animate-spin" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Top App Bar */}
      <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/50 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 py-6">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">
                Brand Dashboard
              </h1>
              <Badge variant="terracotta">Safemode: Live</Badge>
            </div>

            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="relative w-full lg:w-64">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]"
                />
                <Input
                  placeholder="Search campaigns, brands, creators..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  label={undefined}
                />
              </div>
              <Button variant="gold" onClick={handleSubmitBrief} leftIcon={<Plus className="h-4 w-4" />}>
                New Campaign
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

        {/* Campaigns Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">
              Active Campaigns
            </h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Track budget, milestones, and verification status.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={statusFilter === 'active' ? 'bg-[hsl(var(--secondary))]/10 text-[hsl(var(--secondary))]' : ''}
              onClick={() => setStatusFilter('active')}
            >
              Active
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={statusFilter === 'draft' ? 'bg-red-500/20 text-red-400' : ''}
              onClick={() => setStatusFilter('draft')}
            >
              Draft
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[hsl(var(--border))]">
                <th className="pb-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Campaign
                </th>
                <th className="pb-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Budget
                </th>
                <th className="pb-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Audience
                </th>
                <th className="pb-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Status
                </th>
                <th className="pb-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Created
                </th>
                <th className="pb-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.length > 0 ? (
                filteredCampaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="border-b border-[hsl(var(--border))]/50 hover:bg-[hsl(var(--card))]/30 transition-colors cursor-pointer group"
                    onClick={() => handleViewCampaign(campaign.id)}
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex items-center justify-center">
                          <Users className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                        </div>
                        <div>
                          <p className="font-medium text-[hsl(var(--foreground))]">{campaign.brand_name}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            {campaign.creator_count} creators matched
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <p className="font-medium text-[hsl(var(--foreground))]">
                        {formatUSD(campaign.budget_usd)}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {formatKES(campaign.budget_usd * 130)}
                      </p>
                    </td>
                    <td className="py-4">
                      <p className="text-sm text-[hsl(var(--foreground))]">
                        {campaign.target_audience}
                      </p>
                    </td>
                    <td className="py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(campaign.status)}`}
                      >
                        {campaign.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-4">
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {formatDate(campaign.created_at)}
                      </p>
                    </td>
                    <td className="py-4 text-right">
                      <Button variant="ghost" size="sm" className="p-2">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <p className="text-[hsl(var(--muted-foreground))]">
                      No campaigns found.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Card padding="md" hoverable>
            <CardHeader>
              <CardTitle className="text-lg">Submit Brief</CardTitle>
              <CardDescription>
                AI-matched syndicates within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full" onClick={handleSubmitBrief}>
                Create Brief
              </Button>
            </CardContent>
          </Card>

          <Card padding="md" hoverable>
            <CardHeader>
              <CardTitle className="text-lg">Tax Invoices</CardTitle>
              <CardDescription>
                Download certified KRA eTIMS BII receipts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                View Invoices
              </Button>
            </CardContent>
          </Card>

          <Card padding="md" hoverable>
            <CardHeader>
              <CardTitle className="text-lg">Impact Dossier</CardTitle>
              <CardDescription>
                C-suite sustainability and reach reporting.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};