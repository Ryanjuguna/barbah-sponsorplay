/* ============================================================================
   Creator workspace — /creator, /creator/campaigns/:id, /creator/milestones/:id
   ============================================================================ */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader, StatusBadge, ErrorNote, Loading, Notice, EmptyState, KeyValue } from './shared';
import * as wf from '@/lib/workflow';

function nextMilestone(milestones: wf.Milestone[]): wf.Milestone | null {
  return (
    milestones.find((m) =>
      ['IN_PROGRESS', 'REVISION_REQUESTED', 'EVIDENCE_SUBMITTED', 'AI_REVIEWED'].includes(m.status)
    ) ||
    milestones.find((m) => m.status === 'FUNDED') ||
    null
  );
}

export function CreatorHome() {
  const [home, setHome] = useState<wf.CreatorHome | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    wf.creatorHome().then(setHome).catch(setError);
  }, []);

  if (error) return <div className="mx-auto max-w-4xl px-4 py-10"><ErrorNote error={error} /></div>;
  if (!home) return <Loading label="Loading your campaigns" />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <PageHeader
        eyebrow="Creator workspace"
        title={`Welcome, ${home.creator.name}`}
        description="Each campaign unlocks one milestone at a time. Submit the evidence; a human reviewer approves it."
        actions={<Badge variant="gold">{wf.money(home.earnings, home.currency)} earned</Badge>}
      />

      {home.campaigns.length === 0 ? (
        <EmptyState
          title="No active campaigns"
          body="When a brand sends you an offer, the link lands in your inbox. Open it to review the scope and accept."
        />
      ) : (
        <div className="space-y-4">
          {home.campaigns.map((entry) => {
            const next = nextMilestone(entry.milestones);
            return (
              <Card key={entry.offer.id} hoverable>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base">{entry.campaign.brand_name}</CardTitle>
                    <StatusBadge status={entry.proposal.status} family={entry.proposal.status_family} />
                  </div>
                  <CardDescription>{entry.campaign.brief}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm">
                      <p className="text-[hsl(var(--muted-foreground))]">Your allocation</p>
                      <p className="font-bold">{wf.money(entry.offer.allocation, entry.offer.currency)}</p>
                    </div>
                    {next && (
                      <div className="text-sm">
                        <p className="text-[hsl(var(--muted-foreground))]">Next milestone</p>
                        <p className="font-semibold">
                          M{next.seq} · {next.title}
                        </p>
                      </div>
                    )}
                    <Link to={`/creator/campaigns/${entry.proposal.id}`}>
                      <Button size="sm">Open campaign</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CreatorCampaignPage() {
  const { proposalId = '' } = useParams();
  return <CreatorCampaignView proposalId={proposalId} />;
}

export function CreatorMilestonePage() {
  const { milestoneId = '' } = useParams();
  const [home, setHome] = useState<wf.CreatorHome | null>(null);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    wf.creatorHome()
      .then((data) => {
        setHome(data);
        const match = data.campaigns.find((c) =>
          c.milestones.some((m) => m.id === milestoneId)
        );
        if (match) setProposalId(match.proposal.id);
      })
      .catch(setError);
  }, [milestoneId]);

  if (error) return <div className="mx-auto max-w-4xl px-4 py-10"><ErrorNote error={error} /></div>;
  if (!home) return <Loading label="Finding milestone" />;
  if (!proposalId) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <EmptyState title="Milestone not found" body="It may belong to a campaign that is no longer active." />
      </div>
    );
  }

  return <CreatorCampaignView proposalId={proposalId} focus={milestoneId} />;
}

function CreatorCampaignView({ proposalId, focus }: { proposalId: string; focus?: string }) {
  const [view, setView] = useState<wf.CreatorCampaignView | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setView(await wf.creatorCampaign(proposalId));
    } catch (err) {
      setError(err);
    }
  }, [proposalId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!focus) return;
    const el = document.getElementById(`milestone-${focus}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focus, view]);

  if (error) return <div className="mx-auto max-w-4xl px-4 py-10"><ErrorNote error={error} /></div>;
  if (!view) return <Loading label="Loading campaign" />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <Link to="/creator" className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
        ← All campaigns
      </Link>
      <PageHeader
        eyebrow={view.campaign.brand_name}
        title={view.campaign.objective || 'Campaign'}
        description={view.campaign.brief}
        actions={<Badge variant="slate">{wf.money(view.offer.allocation, view.offer.currency)}</Badge>}
      />

      {flash && (
        <div className="mb-4">
          <Notice tone="success">{flash}</Notice>
        </div>
      )}
      <ErrorNote error={error} />

      <div className="space-y-4">
        {view.milestones.map((entry) => (
          <div key={entry.milestone.id} id={`milestone-${entry.milestone.id}`}>
            <MilestoneCard
              entry={entry}
              currency={view.offer.currency}
              busy={busy}
              setBusy={setBusy}
              onChanged={load}
              setFlash={setFlash}
              focus={focus === entry.milestone.id}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function MilestoneCard({
  entry,
  currency,
  busy,
  setBusy,
  onChanged,
  setFlash,
  focus,
}: {
  entry: wf.CreatorMilestoneView;
  currency: string;
  busy: boolean;
  setBusy: (value: boolean) => void;
  onChanged: () => void;
  setFlash: (value: string | null) => void;
  focus?: boolean;
}) {
  const milestone = entry.milestone;
  const [localError, setLocalError] = useState<unknown>(null);
  const open =
    ['IN_PROGRESS', 'REVISION_REQUESTED', 'EVIDENCE_SUBMITTED', 'AI_REVIEWED'].includes(milestone.status) ||
    ['FUNDED', 'LOCKED', 'DRAFT'].includes(milestone.status);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of entry.evidence) {
      const key = item.requirement_key || 'unknown';
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [entry.evidence]);

  const missing = milestone.evidence_requirements.filter(
    (r) => r.required !== false && (counts[r.key] || 0) < (r.min_count || 1)
  );

  const submit = async () => {
    setBusy(true);
    setLocalError(null);
    try {
      const result = await wf.submitMilestone(milestone.id);
      setFlash(`Milestone ${milestone.seq} submitted for review.`);
      onChanged();
      return result;
    } catch (err) {
      setLocalError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className={focus ? 'ring-2 ring-[hsl(var(--primary))]' : undefined}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Milestone {milestone.seq}
            </p>
            <CardTitle className="text-base">{milestone.title}</CardTitle>
            <CardDescription>{milestone.description}</CardDescription>
          </div>
          <div className="text-right">
            <p className="font-black">{wf.money(milestone.amount, currency)}</p>
            <StatusBadge status={milestone.status} family={milestone.status_family} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-[hsl(var(--muted-foreground))]">Due {wf.shortDate(milestone.due_at)}</p>

        {open && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Required evidence
            </p>
            {milestone.evidence_requirements.map((requirement) => (
              <RequirementRow
                key={requirement.key}
                milestoneId={milestone.id}
                requirement={requirement}
                have={counts[requirement.key] || 0}
                items={entry.evidence.filter((e) => e.requirement_key === requirement.key)}
                disabled={busy || !open}
                onChanged={onChanged}
                setError={setLocalError}
              />
            ))}
          </div>
        )}

        {entry.evidence.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Submitted files
            </p>
            <div className="mt-1 space-y-1">
              {entry.evidence.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 text-xs">
                  <span>
                    {item.label || item.kind} · {item.original_filename || item.external_url || ''}
                  </span>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noreferrer" className="underline">
                      View
                    </a>
                  )}
                  {item.external_url && (
                    <a href={item.external_url} target="_blank" rel="noreferrer" className="underline">
                      Open link
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {open && ['IN_PROGRESS', 'REVISION_REQUESTED'].includes(milestone.status) && (
          <div className="flex flex-wrap items-center gap-2">
            <Button isLoading={busy} disabled={missing.length > 0} onClick={submit}>
              Submit for review
            </Button>
            {missing.length > 0 && (
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                {missing.length} item(s) still missing
              </span>
            )}
          </div>
        )}

        {milestone.status === 'REJECTED' && (
          <Notice tone="danger" title="Changes requested">
            {entry.decision?.reason || 'The reviewer asked for changes.'}
          </Notice>
        )}

        {entry.report && (
          <div className="rounded-xl border border-[hsl(var(--border))] p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">Review status</p>
              <Badge
                variant={
                  entry.report.recommended_decision === 'APPROVE'
                    ? 'green'
                    : entry.report.recommended_decision === 'REQUEST_CHANGES'
                    ? 'terracotta'
                    : 'gold'
                }
              >
                {entry.report.recommended_decision.replace(/_/g, ' ').toLowerCase()}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{entry.report.summary}</p>
            {entry.decision && (
              <div className="mt-2">
                <KeyValue label="Decision" value={entry.decision.decision} />
                {entry.decision.reason && <KeyValue label="Reason" value={entry.decision.reason} />}
              </div>
            )}
          </div>
        )}

        {milestone.status === 'PAID' || milestone.status === 'CLOSED' ? (
          <Notice tone="success" title="Paid">
            This milestone has been approved and paid. The invoice is recorded against your tax profile.
          </Notice>
        ) : null}

        <ErrorNote error={localError} />
      </CardContent>
    </Card>
  );
}

function RequirementRow({
  milestoneId,
  requirement,
  have,
  items,
  disabled,
  onChanged,
  setError,
}: {
  milestoneId: string;
  requirement: wf.EvidenceRequirement;
  have: number;
  items: wf.Evidence[];
  disabled: boolean;
  onChanged: () => void;
  setError: (value: unknown) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const needed = Math.max((requirement.min_count || 1) - have, 0);
  const satisfied = needed === 0;

  const uploadFile = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      await wf.uploadEvidence(milestoneId, {
        requirement_key: requirement.key,
        kind: requirement.kind,
        file,
      });
      onChanged();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const uploadLink = async () => {
    setBusy(true);
    setError(null);
    try {
      await wf.uploadEvidence(milestoneId, {
        requirement_key: requirement.key,
        kind: 'URL',
        url: link,
      });
      setLink('');
      onChanged();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">
            {requirement.label}
            {requirement.required !== false && <span className="text-red-400"> *</span>}
          </p>
          {requirement.instructions && (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{requirement.instructions}</p>
          )}
        </div>
        <Badge variant={satisfied ? 'green' : 'slate'}>
          {have}/{requirement.min_count || 1}
        </Badge>
      </div>

      {items.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {items.map((item) => (
            <span key={item.id} className="rounded bg-[hsl(var(--secondary))]/40 px-2 py-1">
              {item.original_filename || 'link'}
            </span>
          ))}
        </div>
      )}

      {!satisfied && !disabled && (
        <div className="mt-2">
          {requirement.kind === 'URL' ? (
            <div className="flex gap-2">
              <input
                className="d-input"
                placeholder="https://…"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
              <Button size="sm" isLoading={busy} disabled={!link} onClick={uploadLink}>
                Add link
              </Button>
            </div>
          ) : (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-xs font-semibold">
              {busy ? 'Uploading…' : `Upload ${requirement.kind.toLowerCase()} (${needed} needed)`}
              <input
                type="file"
                className="hidden"
                accept={(requirement.accepted_types || []).join(',')}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadFile(file);
                  e.target.value = '';
                }}
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}
