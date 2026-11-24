/* ============================================================================
   Public offer page — /offer/:token
   The only page a creator sees before they have an account.
   ============================================================================ */

import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge, Notice, ErrorNote, Loading, KeyValue, Field } from './shared';
import * as wf from '@/lib/workflow';

export function OfferPage() {
  const { token = '' } = useParams();
  const [data, setData] = useState<wf.PublicOffer | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'idle' | 'accept' | 'counter' | 'decline'>('idle');
  const [done, setDone] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [payoutRef, setPayoutRef] = useState('');
  const [counterAmount, setCounterAmount] = useState('');
  const [counterNote, setCounterNote] = useState('');
  const [declineReason, setDeclineReason] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await wf.getOffer(token));
    } catch (err) {
      setError(err);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <ErrorNote error={error} />
        <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
          Offer links expire after 14 days. Ask the brand to resend if you still want to review it.
        </p>
      </div>
    );
  }

  if (!data) return <Loading label="Loading your offer" />;

  const { offer, brand_name, milestones, campaign, expires_at, requires_account } = data;
  const gross = offer.allocation;
  const withholding = Math.round(gross * 0.05 * 100) / 100;
  const net = gross - withholding;

  const claimAndAccept = async () => {
    setBusy(true);
    setError(null);
    try {
      if (requires_account || password) {
        await wf.claimOffer(token, {
          full_name: fullName || undefined,
          password: password || undefined,
          confirm_payout_ref: payoutRef || undefined,
        });
      }
      await wf.acceptOffer(token, {
        full_name: fullName || undefined,
        confirm_payout_ref: payoutRef || undefined,
      });
      setDone('accepted');
      window.location.href = '/creator';
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const sendCounter = async () => {
    setBusy(true);
    setError(null);
    try {
      await wf.counterOffer(token, {
        amount: Number(counterAmount),
        message: counterNote || undefined,
      });
      setDone('countered');
      setMode('idle');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const sendDecline = async () => {
    setBusy(true);
    setError(null);
    try {
      await wf.declineOffer(token, { reason: declineReason || undefined });
      setDone('declined');
      setMode('idle');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-sm font-black uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
          SponsorPlay
        </span>
        <StatusBadge status={offer.status} family={offer.status_family} />
      </div>

      <Card padding="lg">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
            Sponsorship offer
          </p>
          <CardTitle className="text-3xl">{brand_name}</CardTitle>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{campaign.brief}</p>
        </CardHeader>

        <div className="my-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/30 p-5">
          <p className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Your net payout</p>
          <p className="mt-1 text-4xl font-black tracking-tight">{wf.money(net, offer.currency)}</p>
          <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
            Gross offer {wf.money(gross, offer.currency)} · withholding tax{' '}
            {wf.money(withholding, offer.currency)}. Paid per approved milestone.
          </p>
        </div>

        {done && (
          <div className="mb-6">
            <Notice tone="success" title={done === 'accepted' ? 'Offer accepted' : done === 'countered' ? 'Counter sent' : 'Offer declined'}>
              {done === 'accepted' && 'Your campaign dashboard is ready. Upload evidence as you complete each milestone.'}
              {done === 'countered' && 'The brand will see your counter and reply. You can keep the link to check back.'}
              {done === 'declined' && 'Thanks for letting the brand know. You can close this page.'}
            </Notice>
          </div>
        )}

        <h3 className="text-sm font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          Milestones and payment schedule
        </h3>
        <div className="mt-3 divide-y divide-[hsl(var(--border))]">
          {milestones.map((m) => (
            <div key={m.id} className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Milestone {m.seq}
                  </p>
                  <p className="font-bold">{m.title}</p>
                  {m.description && (
                    <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{m.description}</p>
                  )}
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    Due {wf.shortDate(m.due_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black">{wf.money(m.amount, m.currency)}</p>
                  <StatusBadge status={m.status} family={m.status_family} />
                </div>
              </div>
              {m.evidence_requirements.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[hsl(var(--muted-foreground))]">
                  {m.evidence_requirements.map((r) => (
                    <li key={r.key}>• {r.label}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-[hsl(var(--border))] p-4 text-sm text-[hsl(var(--muted-foreground))]">
          <p className="font-semibold text-[hsl(var(--foreground))]">How payment works</p>
          <p className="mt-1">
            The brand commits the campaign budget to SponsorPlay before work starts. Each milestone is paid
            after you submit the required evidence and a Barbah reviewer approves it. Uploading evidence does
            not trigger payment on its own.
          </p>
          <p className="mt-2 text-xs">
            Tax documents in this environment are simulated and are not valid KRA tax invoices.
          </p>
        </div>

        {done === 'idle' || done === null ? null : null}

        {!done && (
          <div className="mt-8">
            {mode === 'idle' && (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button className="flex-1" onClick={() => setMode('accept')}>
                  Accept this offer
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => setMode('counter')}>
                  Ask for changes
                </Button>
                <Button variant="ghost" onClick={() => setMode('decline')}>
                  Decline
                </Button>
              </div>
            )}

            {mode === 'accept' && (
              <div className="space-y-4 rounded-xl border border-[hsl(var(--border))] p-4">
                {requires_account && (
                  <Notice tone="info" title="Create your creator account">
                    This is how you come back later to submit evidence and track payments. Use the email the
                    brand has on file.
                  </Notice>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={offer.creator?.name || 'Your name'}
                  />
                  <Input
                    label="Payout reference"
                    value={payoutRef}
                    onChange={(e) => setPayoutRef(e.target.value)}
                    placeholder="PayPal email or M-Pesa number"
                    helper="Needed before the first payout."
                  />
                  <Input
                    label={requires_account ? 'Choose a password' : 'Password (if not set)'}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                  />
                </div>
                <ErrorNote error={error} />
                <div className="flex gap-2">
                  <Button isLoading={busy} onClick={claimAndAccept}>
                    Accept and open my dashboard
                  </Button>
                  <Button variant="ghost" onClick={() => setMode('idle')}>
                    Back
                  </Button>
                </div>
              </div>
            )}

            {mode === 'counter' && (
              <div className="space-y-4 rounded-xl border border-[hsl(var(--border))] p-4">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Current offer: <span className="font-semibold">{wf.money(gross, offer.currency)}</span>. Tell
                  the brand what would make this work.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label={`Your counter (${offer.currency})`}
                    type="number"
                    min={1}
                    value={counterAmount}
                    onChange={(e) => setCounterAmount(e.target.value)}
                  />
                  <Field label="Note to the brand">
                    <textarea
                      className="d-input min-h-[44px]"
                      value={counterNote}
                      onChange={(e) => setCounterNote(e.target.value)}
                      placeholder="Scope, dates, or reasons"
                    />
                  </Field>
                </div>
                <ErrorNote error={error} />
                <div className="flex gap-2">
                  <Button isLoading={busy} disabled={!counterAmount} onClick={sendCounter}>
                    Send counter-offer
                  </Button>
                  <Button variant="ghost" onClick={() => setMode('idle')}>
                    Back
                  </Button>
                </div>
              </div>
            )}

            {mode === 'decline' && (
              <div className="space-y-4 rounded-xl border border-[hsl(var(--border))] p-4">
                <Field label="Reason (optional)">
                  <textarea
                    className="d-input min-h-[44px]"
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="Too low, dates clash, scope mismatch…"
                  />
                </Field>
                <ErrorNote error={error} />
                <div className="flex gap-2">
                  <Button variant="danger" isLoading={busy} onClick={sendDecline}>
                    Decline offer
                  </Button>
                  <Button variant="ghost" onClick={() => setMode('idle')}>
                    Back
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
          Offer expires {wf.shortDate(expires_at)} ·{' '}
          <Link to="/" className="underline">
            What is SponsorPlay?
          </Link>
        </p>
      </Card>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What the brand sees</CardTitle>
          </CardHeader>
          <CardContent>
            <KeyValue label="Brand" value={brand_name} />
            <KeyValue label="KPI" value={campaign.kpi || '—'} />
            <KeyValue label="Audience" value={campaign.target_audience || '—'} />
            <KeyValue label="Geography" value={campaign.geography || '—'} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
