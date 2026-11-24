/* ============================================================================
   Ops review queue — /ops
   Evidence first, agent report second, named human decision last.
   ============================================================================ */

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader, StatusBadge, ErrorNote, Loading, Notice, EmptyState, KeyValue } from './shared';
import * as wf from '@/lib/workflow';

const RECOMMENDATION_LABEL: Record<string, string> = {
  APPROVE: 'Approve',
  REQUEST_CHANGES: 'Request changes',
  HUMAN_REVIEW: 'Human review needed',
};

export function OpsQueue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const milestoneId = searchParams.get('milestone');
  const offerId = searchParams.get('offer');

  const [queue, setQueue] = useState<wf.ReviewCase[] | null>(null);
  const [selected, setSelected] = useState<wf.ReviewCase | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState<'APPROVE' | 'REQUEST_CHANGES' | 'REJECT'>('APPROVE');
  const [reason, setReason] = useState('');
  const [result, setResult] = useState<wf.ReviewCase | null>(null);

  const loadQueue = useCallback(async () => {
    setError(null);
    try {
      setQueue(await wf.opsQueue());
    } catch (err) {
      setError(err);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    if (!milestoneId || !offerId) {
      setSelected(null);
      setResult(null);
      return;
    }
    wf.opsCase(milestoneId, offerId)
      .then((c) => {
        setSelected(c);
        setResult(null);
        setDecision(
          c.report?.recommended_decision === 'REQUEST_CHANGES' ? 'REQUEST_CHANGES' : 'APPROVE'
        );
      })
      .catch(setError);
  }, [milestoneId, offerId]);

  const submitDecision = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const decided = await wf.opsDecide(selected.milestone.id, {
        offer_id: selected.offer_id,
        decision,
        reason: reason || undefined,
      });
      setResult(decided);
      setReason('');
      await loadQueue();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <PageHeader
        eyebrow="Barbah ops"
        title="Review queue"
        description="Nothing pays out without a decision here. The agent only recommends."
        actions={<Badge variant="slate">{queue?.length ?? 0} waiting</Badge>}
      />

      <ErrorNote error={error} />

      {!queue ? (
        <Loading label="Loading queue" />
      ) : queue.length === 0 ? (
        <EmptyState title="Queue is clear" body="No milestone is waiting for a human decision." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="space-y-2">
            {queue.map((item) => {
              const active = milestoneId === item.milestone.id && offerId === item.offer_id;
              return (
                <button
                  key={`${item.milestone.id}:${item.offer_id}`}
                  onClick={() => {
                    setSearchParams({ milestone: item.milestone.id, offer: item.offer_id });
                  }}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    active
                      ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10'
                      : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">
                      M{item.milestone.seq} · {item.milestone.title}
                    </span>
                    {item.sla_breached ? (
                      <Badge variant="terracotta">Overdue</Badge>
                    ) : (
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        {item.age_hours}h
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    {item.creator?.name} · {item.campaign.brand_name}
                  </p>
                  <p className="mt-2 text-xs">
                    <span className="font-semibold">
                      {RECOMMENDATION_LABEL[item.report?.recommended_decision || 'HUMAN_REVIEW']}
                    </span>{' '}
                    <span className="text-[hsl(var(--muted-foreground))]">
                      · {wf.money(item.milestone.amount, item.milestone.currency)}
                    </span>
                  </p>
                </button>
              );
            })}
          </div>

          <div>
            {!selected ? (
              <EmptyState title="Select a case" body="Open a row to see the evidence and the report." />
            ) : (
              <CaseDetail
                data={result || selected}
                decision={decision}
                setDecision={setDecision}
                reason={reason}
                setReason={setReason}
                busy={busy}
                onDecide={submitDecision}
                decided={!!result || !!selected.decision}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CaseDetail({
  data,
  decision,
  setDecision,
  reason,
  setReason,
  busy,
  onDecide,
  decided,
}: {
  data: wf.ReviewCase;
  decision: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT';
  setDecision: (value: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT') => void;
  reason: string;
  setReason: (value: string) => void;
  busy: boolean;
  onDecide: () => void;
  decided: boolean;
}) {
  const report = data.report;
  const recommendation = report?.recommended_decision || 'HUMAN_REVIEW';
  const override = decision !== recommendation;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>
              M{data.milestone.seq} · {data.milestone.title}
            </CardTitle>
            <StatusBadge status={data.milestone.status} family={data.milestone.status_family} />
          </div>
          <CardDescription>
            {data.creator?.name} · {data.campaign.brand_name} ·{' '}
            {wf.money(data.milestone.amount, data.milestone.currency)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{data.milestone.description}</p>
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Acceptance criteria
            </p>
            <ul className="mt-1 list-inside list-disc text-sm text-[hsl(var(--muted-foreground))]">
              {data.milestone.acceptance_criteria.map((criterion) => (
                <li key={criterion}>{criterion}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evidence</CardTitle>
          <CardDescription>Hashes prove the file received, not that the event happened.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.evidence.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[hsl(var(--border))] p-3"
            >
              <div>
                <p className="text-sm font-semibold">{item.label || item.kind}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {item.original_filename || 'link'} · {wf.shortDate(item.submitted_at || item.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {item.sha256 && (
                  <code className="text-[10px] text-[hsl(var(--muted-foreground))]">
                    {item.sha256.slice(0, 12)}…
                  </code>
                )}
                {item.url && (
                  <a href={item.url} target="_blank" rel="noreferrer">
                    <Button variant="secondary" size="sm">
                      Open
                    </Button>
                  </a>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Agent report</CardTitle>
            <Badge variant={recommendation === 'APPROVE' ? 'green' : recommendation === 'REQUEST_CHANGES' ? 'terracotta' : 'gold'}>
              {RECOMMENDATION_LABEL[recommendation]}
            </Badge>
          </div>
          <CardDescription>{report?.summary || 'No report was produced for this submission.'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {report?.checks.map((check) => (
            <div key={check.key} className="rounded-lg border border-[hsl(var(--border))] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{check.label}</p>
                <Badge
                  variant={
                    check.result === 'PASS' ? 'green' : check.result === 'FAIL' ? 'terracotta' : 'gold'
                  }
                >
                  {check.result.toLowerCase()}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                {check.detail} <span className="opacity-70">({check.method})</span>
              </p>
            </div>
          ))}
          {report?.limitations && (
            <Notice tone="warning" title="What the report could not establish">
              <ul className="list-inside list-disc space-y-1">
                {report.limitations.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </Notice>
          )}
        </CardContent>
      </Card>

      {decided ? (
        <Notice tone="success" title="Decision recorded">
          {data.decision?.decision ? (
            <p>
              {data.decision.decision.replace(/_/g, ' ').toLowerCase()} by {data.decision.reviewer_id} on{' '}
              {wf.shortDate(data.decision.decided_at)}
              {data.decision.overrode_recommendation ? ' (overrode the agent)' : ''}.
            </p>
          ) : (
            <p>Decision saved.</p>
          )}
          {data.payout && (
            <div className="mt-2">
              <KeyValue label="Payout" value={wf.money(data.payout.amount, data.payout.currency)} />
              <KeyValue label="Status" value={data.payout.status} />
              <KeyValue label="Provider ref" value={data.payout.provider_ref || '—'} />
              <KeyValue label="Invoice" value={data.payout.invoice?.etims_ref || '—'} />
            </div>
          )}
        </Notice>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your decision</CardTitle>
            <CardDescription>
              The recommendation is {RECOMMENDATION_LABEL[recommendation].toLowerCase()}. You can disagree — a
              reason is then required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(['APPROVE', 'REQUEST_CHANGES', 'REJECT'] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setDecision(value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                    decision === value
                      ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/15'
                      : 'border-[hsl(var(--border))]'
                  }`}
                >
                  {value.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            {override && (
              <Notice tone="warning">
                You are overriding the agent. The reason is stored with your name.
              </Notice>
            )}
            <textarea
              className="d-input min-h-[80px]"
              placeholder="What did you check? What did you find?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <Button
              isLoading={busy}
              disabled={override && !reason.trim()}
              onClick={onDecide}
            >
              Record decision
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
