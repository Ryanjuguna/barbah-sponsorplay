/* ============================================================================
   Brand campaign list — /brand
   ============================================================================ */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageHeader, StatusBadge, EmptyState, ErrorNote, Loading, Field, Notice } from './shared';
import * as wf from '@/lib/workflow';

export function BrandCampaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<wf.Campaign[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  const [brief, setBrief] = useState('');
  const [budget, setBudget] = useState('1200');
  const [currency, setCurrency] = useState('USD');
  const [audience, setAudience] = useState('16-28 urban gamers');
  const [objective, setObjective] = useState('Awareness');
  const [kpi, setKpi] = useState('3 live broadcasts, 2 highlights');
  const [geography, setGeography] = useState('Nairobi');

  const load = () => {
    wf.listCampaigns()
      .then(setCampaigns)
      .catch(setError);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const campaign = await wf.createCampaign({
        brief,
        budget: Number(budget),
        currency,
        target_audience: audience,
        objective,
        kpi,
        geography,
      });
      navigate(`/brand/campaigns/${campaign.id}`);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <PageHeader
        eyebrow="Brand workspace"
        title="Campaigns"
        description="Every campaign moves through the same steps: brief, match, proposal, approval, send, fund, deliver, pay."
        actions={
          <Button onClick={() => setCreating((v) => !v)}>
            {creating ? 'Close brief' : 'New campaign'}
          </Button>
        }
      />

      {creating && (
        <Card padding="lg" className="mb-8">
          <CardHeader>
            <CardTitle>Start with the brief</CardTitle>
            <CardDescription>
              Write it the way you would send it to an agency. The matcher drafts a syndicate; you decide who
              stays.
            </CardDescription>
          </CardHeader>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Brief">
              <textarea
                className="d-input min-h-[110px]"
                required
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="What are you launching, who should see it, and what does success look like?"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Input label="Target audience" value={audience} onChange={(e) => setAudience(e.target.value)} />
              <Input label="Objective" value={objective} onChange={(e) => setObjective(e.target.value)} />
              <Input label="KPI" value={kpi} onChange={(e) => setKpi(e.target.value)} />
              <Input label="Geography" value={geography} onChange={(e) => setGeography(e.target.value)} />
              <Input
                label="Budget"
                type="number"
                min={1}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
              <Field label="Currency">
                <select className="d-input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="USD">USD</option>
                  <option value="KES">KES</option>
                </select>
              </Field>
            </div>
            <Notice tone="info">
              Creating the campaign runs the matcher and returns a proposed syndicate and solo options. No
              creator is contacted at this step.
            </Notice>
            <ErrorNote error={error} />
            <Button type="submit" isLoading={busy}>
              Run the match
            </Button>
          </form>
        </Card>
      )}

      {!creating && error !== null && (
        <div className="mb-4">
          <ErrorNote error={error} />
        </div>
      )}

      {!campaigns ? (
        <Loading label="Loading campaigns" />
      ) : campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          body="Start with a brief and the matcher will propose a syndicate."
          action={<Button onClick={() => setCreating(true)}>New campaign</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} hoverable>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">{campaign.brand_name}</CardTitle>
                  <StatusBadge status={campaign.status} />
                </div>
                <CardDescription className="line-clamp-3">{campaign.brief}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">
                    {campaign.geography || '—'} · {campaign.kpi || 'No KPI set'}
                  </span>
                  <span className="font-bold">{wf.money(campaign.budget, campaign.currency)}</span>
                </div>
                <div className="mt-4">
                  <Link to={`/brand/campaigns/${campaign.id}`}>
                    <Button variant="secondary" size="sm">
                      Open workspace
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
