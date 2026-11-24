/* ============================================================================
   Campaign workspace — /brand/campaigns/:id
   The brand's home for one campaign: match, proposal, money.
   ============================================================================ */

import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  PageHeader,
  StatusBadge,
  ErrorNote,
  Loading,
  Notice,
  EmptyState,
  KeyValue,
} from './shared';
import * as wf from '@/lib/workflow';

type Tab = 'match' | 'proposals' | 'money';

export function CampaignWorkspace() {
  const { campaignId = '' } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('match');

  const [campaign, setCampaign] = useState<wf.Campaign | null>(null);
  const [matches, setMatches] = useState<wf.MatchRun | null>(null);
  const [proposals, setProposals] = useState<wf.Proposal[]>([]);
  const [creators, setCreators] = useState<wf.Creator[]>([]);
  const [money, setMoney] = useState<wf.MoneySummary | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [c, m, p, allCreators] = await Promise.all([
        wf.getCampaign(campaignId),
        wf.getMatches(campaignId),
        wf.listProposals(campaignId),
        wf.listCreators(),
      ]);
      setCampaign(c);
      setMatches(m);
      setProposals(p);
      setCreators(allCreators);
      const active = p.find((x) => x.status !== 'CANCELLED') || p[0];
      if (active) setMoney(await wf.moneySummary(active.id).catch(() => null));
      else setMoney(null);
    } catch (err) {
      setError(err);
    }
  }, [campaignId]);

  useEffect(() => {
    load();
  }, [load]);

  const syndicate = matches?.syndicates?.[0];
  const activeProposal = proposals.find((p) => p.status !== 'CANCELLED') || null;

  const addCreator = async (creatorId: string) => {
    if (!syndicate) return;
    setBusy(true);
    try {
      await wf.patchSyndicate(campaignId, syndicate.id, { add_creator_ids: [creatorId] });
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const removeCreator = async (creatorId: string) => {
    if (!syndicate) return;
    setBusy(true);
    try {
      await wf.patchSyndicate(campaignId, syndicate.id, { remove_creator_ids: [creatorId] });
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const draft = async (creatorIds?: string[]) => {
    setBusy(true);
    setError(null);
    try {
      const proposal = await wf.createProposal(campaignId, {
        syndicate_id: creatorIds ? undefined : syndicate?.id,
        creator_ids: creatorIds,
      });
      navigate(`/brand/proposals/${proposal.id}/edit`);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  if (!campaign) return <Loading label="Loading campaign" />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <Link to="/brand" className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
        ← All campaigns
      </Link>
      <PageHeader
        eyebrow={campaign.brand_name}
        title={campaign.objective || 'Campaign workspace'}
        description={campaign.brief}
        actions={
          <>
            <Badge variant="slate">{wf.money(campaign.budget, campaign.currency)}</Badge>
            <StatusBadge status={campaign.status} />
          </>
        }
      />

      <div className="mb-6 flex gap-1 rounded-xl border border-[hsl(var(--border))] p-1">
        {(
          [
            ['match', 'Match'],
            ['proposals', `Proposal${proposals.length ? ` · ${proposals.length}` : ''}`],
            ['money', 'Money'],
          ] as Array<[Tab, string]>
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              tab === key
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]/40'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ErrorNote error={error} />

      {tab === 'match' && matches && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>What the matcher saw</CardTitle>
              <CardDescription>
                {matches.analysis.recommendation_title || 'Recommendation'} · agent{' '}
                {matches.agent_version} · {matches.model}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {matches.analysis.verdict_rationale}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-[hsl(var(--border))] p-3">
                  <p className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Syndicate reach
                  </p>
                  <p className="text-xl font-black">
                    {(matches.analysis.reach_comparison?.syndicate_reach || 0).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border border-[hsl(var(--border))] p-3">
                  <p className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Best solo reach
                  </p>
                  <p className="text-xl font-black">
                    {(matches.analysis.reach_comparison?.solo_reach || 0).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border border-[hsl(var(--border))] p-3">
                  <p className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Recommended path
                  </p>
                  <p className="text-xl font-black">{matches.analysis.recommended_path || '—'}</p>
                </div>
              </div>
              {matches.analysis.limitations && (
                <ul className="mt-4 space-y-1 text-xs text-[hsl(var(--muted-foreground))]">
                  {matches.analysis.limitations.map((line) => (
                    <li key={line}>• {line}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {syndicate && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{syndicate.title}</CardTitle>
                    <CardDescription>{syndicate.rationale}</CardDescription>
                  </div>
                  <Badge variant="gold">{(syndicate.expected_reach || 0).toLocaleString()} reach</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {syndicate.members.map((member) => (
                  <div
                    key={member.creator.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[hsl(var(--border))] p-3"
                  >
                    <div>
                      <p className="font-semibold">
                        {member.creator.name}{' '}
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          @{member.creator.gamer_tag}
                        </span>
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {member.role_in_syndicate} · {member.creator.location} ·{' '}
                        {member.creator.monthly_reach.toLocaleString()} reach ·{' '}
                        {member.allocation_pct.toFixed(0)}% allocation
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">
                        {wf.money(member.creator.base_rate, member.creator.currency)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy || syndicate.members.length <= 1}
                        onClick={() => removeCreator(member.creator.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Add another creator
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {creators
                      .filter((c) => !syndicate.members.some((m) => m.creator.id === c.id))
                      .slice(0, 8)
                      .map((creator) => (
                        <button
                          key={creator.id}
                          disabled={busy}
                          onClick={() => addCreator(creator.id)}
                          className="rounded-full border border-[hsl(var(--border))] px-3 py-1 text-xs font-medium hover:border-[hsl(var(--primary))]"
                        >
                          + {creator.name}
                        </button>
                      ))}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Button disabled={busy || !!activeProposal} onClick={() => draft()}>
                    {activeProposal ? 'Proposal already drafted' : 'Draft proposal from this syndicate'}
                  </Button>
                  <Button variant="secondary" disabled={busy} onClick={() => draft([syndicate.members[0].creator.id])}>
                    Go solo instead
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Solo options</CardTitle>
              <CardDescription>Ranked by reach, safety and geography. A recommendation, not a decision.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-[hsl(var(--border))]">
              {matches.solo_matches.map((match) => (
                <div key={match.creator.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-semibold">{match.creator.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{match.match_rationale}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="slate">{match.match_score} match</Badge>
                    <span className="text-sm font-bold">{wf.money(match.total_cost, match.currency)}</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busy || !!activeProposal}
                      onClick={() => draft([match.creator.id])}
                    >
                      Draft solo
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'proposals' && (
        <div className="space-y-4">
          {proposals.length === 0 ? (
            <EmptyState
              title="No proposal yet"
              body="Choose a syndicate or a solo creator in the Match tab, then draft a proposal."
              action={<Button onClick={() => setTab('match')}>Open match</Button>}
            />
          ) : (
            proposals.map((proposal) => (
              <Card key={proposal.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base">
                      Proposal v{proposal.version} · {proposal.milestones.length} milestones
                    </CardTitle>
                    <StatusBadge status={proposal.status} family={proposal.status_family} />
                  </div>
                  <CardDescription>
                    {wf.money(proposal.total, proposal.currency)} gross ·{' '}
                    {proposal.offers.length} creator{proposal.offers.length === 1 ? '' : 's'} ·{' '}
                    {proposal.sent_at ? `sent ${wf.shortDate(proposal.sent_at)}` : 'not sent'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {['DRAFT', 'CHANGES_REQUESTED'].includes(proposal.status) && (
                      <Link to={`/brand/proposals/${proposal.id}/edit`}>
                        <Button size="sm">Edit proposal</Button>
                      </Link>
                    )}
                    {proposal.status === 'IN_REVIEW' && (
                      <Link to={`/brand/proposals/${proposal.id}/preview`}>
                        <Button size="sm">Review and send</Button>
                      </Link>
                    )}
                    {proposal.status === 'APPROVED' && (
                      <Link to={`/brand/proposals/${proposal.id}/preview`}>
                        <Button size="sm">Approve and send</Button>
                      </Link>
                    )}
                    {['SENT', 'PARTIALLY_ACCEPTED', 'ACCEPTED'].includes(proposal.status) && (
                      <Link to={`/brand/proposals/${proposal.id}/preview`}>
                        <Button variant="secondary" size="sm">
                          Offer status
                        </Button>
                      </Link>
                    )}
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {proposal.offers.map((offer) => (
                      <div
                        key={offer.id}
                        className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] p-3"
                      >
                        <div>
                          <p className="text-sm font-semibold">{offer.creator?.name}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            {wf.money(offer.allocation, offer.currency)}
                          </p>
                        </div>
                        <StatusBadge status={offer.status} family={offer.status_family} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === 'money' && <MoneyTab proposal={activeProposal} money={money} onChanged={load} />}
    </div>
  );
}

function MoneyTab({
  proposal,
  money,
  onChanged,
}: {
  proposal: wf.Proposal | null;
  money: wf.MoneySummary | null;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [intent, setIntent] = useState<{ id: string; status: string } | null>(null);

  if (!proposal) {
    return <EmptyState title="No proposal to fund" body="Draft a proposal first." />;
  }

  const startFunding = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await wf.createFundingIntent(
        proposal.id,
        `fund:${proposal.id}:${proposal.total_minor}`
      );
      setIntent(created);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const capture = async () => {
    if (!intent) return;
    setBusy(true);
    setError(null);
    try {
      await wf.captureFunding(intent.id);
      setIntent(null);
      onChanged();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Committed balance</CardTitle>
            <StatusBadge status={proposal.status} family={proposal.status_family} />
          </div>
          <CardDescription>
            Funding is simulated in this environment. The ledger and the approval guards are real.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[hsl(var(--border))] p-3">
              <p className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Committed</p>
              <p className="text-xl font-black">{wf.money(money?.committed || 0, proposal.currency)}</p>
            </div>
            <div className="rounded-lg border border-[hsl(var(--border))] p-3">
              <p className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Released</p>
              <p className="text-xl font-black">{wf.money(money?.released || 0, proposal.currency)}</p>
            </div>
            <div className="rounded-lg border border-[hsl(var(--border))] p-3">
              <p className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Remaining</p>
              <p className="text-xl font-black">{wf.money(money?.remaining || 0, proposal.currency)}</p>
            </div>
          </div>

          <div className="mt-4">
            <KeyValue label="Gross" value={wf.money(proposal.total, proposal.currency)} />
            <KeyValue label="Platform fee" value={wf.money(proposal.platform_fee, proposal.currency)} />
            <KeyValue label="Creator pool" value={wf.money(proposal.creator_pool, proposal.currency)} />
            <KeyValue label="Withholding tax" value={wf.money(proposal.withholding, proposal.currency)} />
            <KeyValue label="Net to creators" value={wf.money(proposal.net_creator, proposal.currency)} />
          </div>

          <ErrorNote error={error} />

          <div className="mt-4 flex flex-wrap gap-2">
            {proposal.status === 'ACCEPTED' && !intent && (
              <Button isLoading={busy} onClick={startFunding}>
                Commit funds
              </Button>
            )}
            {intent && intent.status !== 'CAPTURED' && (
              <Button isLoading={busy} onClick={capture}>
                Confirm committed balance
              </Button>
            )}
            {['FUNDED', 'ACTIVE', 'COMPLETED'].includes(proposal.status) && (
              <Notice tone="success">Funds committed. Milestones unlock as each one is approved.</Notice>
            )}
            {['DRAFT', 'IN_REVIEW', 'APPROVED', 'SENT', 'PARTIALLY_ACCEPTED'].includes(proposal.status) && (
              <Notice tone="info">
                Funding opens after every creator has accepted. Current status: {proposal.status.toLowerCase()}.
              </Notice>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ledger</CardTitle>
          <CardDescription>Append-only. Each row is one movement.</CardDescription>
        </CardHeader>
        <CardContent>
          {!money || money.ledger.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No movements yet.</p>
          ) : (
            <div className="divide-y divide-[hsl(var(--border))]">
              {money.ledger.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{entry.description}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {entry.account} · {entry.direction.toLowerCase()} ·{' '}
                      {wf.shortDate(entry.created_at)}
                    </p>
                  </div>
                  <span className={entry.direction === 'DEBIT' ? 'font-bold' : 'font-bold'}>
                    {wf.money(entry.amount, entry.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Simulated eTIMS references — not valid KRA tax invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          {!money || money.invoices.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No invoices yet.</p>
          ) : (
            <div className="divide-y divide-[hsl(var(--border))]">
              {money.invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{invoice.invoice_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{invoice.etims_ref}</p>
                  </div>
                  <span className="font-bold">{wf.money(invoice.amount, invoice.currency)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
