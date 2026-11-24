/* ============================================================================
   The send gate — /brand/proposals/:id/preview
   Nothing leaves the building until a named human approves what is on screen.
   ============================================================================ */

import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  PageHeader,
  StatusBadge,
  ErrorNote,
  Loading,
  Notice,
  KeyValue,
  EmptyState,
} from './shared';
import * as wf from '@/lib/workflow';

export function SendGate() {
  const { proposalId = '' } = useParams();
  const [proposal, setProposal] = useState<wf.Proposal | null>(null);
  const [validation, setValidation] = useState<wf.ValidationResult | null>(null);
  const [preview, setPreview] = useState<wf.EmailPreview | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<string | undefined>(undefined);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const p = await wf.getProposal(proposalId);
      setProposal(p);
      setValidation(await wf.validateProposal(proposalId).catch(() => null));
      const offerId = selectedOffer || p.offers[0]?.id;
      if (offerId) setPreview(await wf.emailPreview(proposalId, offerId));
    } catch (err) {
      setError(err);
    }
  }, [proposalId, selectedOffer]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async () => {
    setBusy(true);
    setError(null);
    try {
      setProposal(await wf.approveProposal(proposalId));
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const sent = await wf.sendProposal(proposalId);
      setProposal(sent);
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const decideCounter = async (offerId: string, action: 'accept' | 'decline') => {
    setBusy(true);
    setError(null);
    try {
      const updated =
        action === 'accept'
          ? await wf.acceptCounter(proposalId, offerId)
          : await wf.declineCounter(proposalId, offerId);
      setProposal(updated);
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  if (!proposal) return <Loading label="Loading proposal" />;

  const alreadySent = ['SENT', 'PARTIALLY_ACCEPTED', 'ACCEPTED', 'FUNDED', 'ACTIVE', 'COMPLETED'].includes(
    proposal.status
  );
  const canApprove = ['IN_REVIEW', 'CHANGES_REQUESTED'].includes(proposal.status);
  const canSend = proposal.status === 'APPROVED';
  const blocking = validation?.blocking || [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <Link
        to={`/brand/campaigns/${proposal.campaign_id}`}
        className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]"
      >
        ← Campaign
      </Link>
      <PageHeader
        eyebrow={`Proposal v${proposal.version}`}
        title={alreadySent ? 'Offers and responses' : 'Review before sending'}
        description={
          alreadySent
            ? 'Every recipient, every response. Magic links are shown here because this is a simulated inbox.'
            : 'This is exactly what the creator will receive. Check the money, the milestones and the list.'
        }
        actions={<StatusBadge status={proposal.status} family={proposal.status_family} />}
      />

      <ErrorNote error={error} />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {preview ? (
            <Card padding="none" className="overflow-hidden">
              <div className="border-b border-[hsl(var(--border))] px-5 py-3">
                <p className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]">To</p>
                <p className="text-sm font-semibold">{preview.recipient}</p>
                <p className="mt-2 text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Subject
                </p>
                <p className="text-sm font-semibold">{preview.subject}</p>
                {!preview.sent && <Badge variant="gold" className="mt-2">Draft — not sent</Badge>}
              </div>
              <div className="bg-white">
                <iframe
                  title="Offer email preview"
                  srcDoc={preview.html}
                  className="h-[620px] w-full border-0"
                  sandbox=""
                />
              </div>
            </Card>
          ) : (
            <EmptyState title="No recipients yet" body="Add creators to the proposal before previewing an email." />
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recipients</CardTitle>
              <CardDescription>One offer per creator. Not a single contract.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {proposal.offers.map((offer) => (
                <div key={offer.id} className="rounded-lg border border-[hsl(var(--border))] p-3">
                  <button
                    className="w-full text-left"
                    onClick={() => {
                      setSelectedOffer(offer.id);
                      wf.emailPreview(proposalId, offer.id).then(setPreview).catch(setError);
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{offer.creator?.name}</span>
                      <StatusBadge status={offer.status} family={offer.status_family} />
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {wf.money(offer.allocation, offer.currency)}
                      {offer.viewed_at ? ' · viewed' : ''}
                      {offer.accepted_at ? ' · accepted' : ''}
                    </p>
                  </button>
                  {offer.magic_link && (
                    <a
                      href={offer.magic_link}
                      className="mt-2 block break-all rounded bg-[hsl(var(--secondary))]/40 px-2 py-1 text-[11px] underline"
                    >
                      {offer.magic_link}
                    </a>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">The money</CardTitle>
            </CardHeader>
            <CardContent>
              <KeyValue label="Gross budget" value={wf.money(proposal.total, proposal.currency)} />
              <KeyValue label="Platform fee" value={wf.money(proposal.platform_fee, proposal.currency)} />
              <KeyValue label="Creator pool" value={wf.money(proposal.creator_pool, proposal.currency)} />
              <KeyValue label="Withholding" value={wf.money(proposal.withholding, proposal.currency)} />
              <KeyValue label="Net to creators" value={wf.money(proposal.net_creator, proposal.currency)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {blocking.length ? `${blocking.length} blocking issue(s)` : 'Ready to approve'}
              </CardTitle>
              {validation && validation.warnings.length > 0 && (
                <CardDescription>{validation.warnings.length} warning(s) — review before sending.</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {blocking.map((issue) => (
                <p key={issue.code + issue.message} className="text-sm text-red-300">
                  • {issue.message}
                </p>
              ))}
              {validation?.warnings.map((issue) => (
                <p key={issue.code + issue.message} className="text-sm text-amber-300">
                  • {issue.message}
                </p>
              ))}
              {validation?.ok && !alreadySent && (
                <Notice tone="success">All checks pass. Approving records your name and the time.</Notice>
              )}
            </CardContent>
          </Card>

          {!alreadySent && (
            <div className="space-y-2">
              {canApprove && (
                <Button className="w-full" isLoading={busy} disabled={!!blocking.length} onClick={approve}>
                  Approve this proposal
                </Button>
              )}
              {canSend && (
                <Button variant="gold" className="w-full" isLoading={busy} onClick={send}>
                  Send {proposal.offers.length} offer{proposal.offers.length === 1 ? '' : 's'}
                </Button>
              )}
              <Button variant="ghost" className="w-full" disabled={busy || proposal.status !== 'DRAFT'}>
                <Link to={`/brand/proposals/${proposalId}/edit`}>Back to editor</Link>
              </Button>
              <p className="text-center text-xs text-[hsl(var(--muted-foreground))]">
                Nothing is emailed until you press send. This environment logs the email instead of delivering it.
              </p>
            </div>
          )}

          {alreadySent && (
            <Notice tone="info" title="Offers are with the creators">
              You are seeing the logged email, not a live mailbox. Accept or decline any counter-offer below.
            </Notice>
          )}
        </div>
      </div>

      {alreadySent && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Responses</CardTitle>
              <CardDescription>Accept a counter to update the allocation and bump the proposal version.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {proposal.offers.map((offer) => (
                <div
                  key={offer.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[hsl(var(--border))] p-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{offer.creator?.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {wf.money(offer.allocation, offer.currency)} · {offer.status.toLowerCase()}
                    </p>
                  </div>
                  {offer.status === 'COUNTERED' && (
                    <div className="flex gap-2">
                      <Button size="sm" isLoading={busy} onClick={() => decideCounter(offer.id, 'accept')}>
                        Accept counter
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={busy}
                        onClick={() => decideCounter(offer.id, 'decline')}
                      >
                        Decline counter
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
