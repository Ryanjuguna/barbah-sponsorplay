/* ============================================================================
   Proposal editor — /brand/proposals/:id/edit
   The brand owns every number and every requirement here. The agent only drafted.
   ============================================================================ */

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageHeader, StatusBadge, ErrorNote, Loading, Notice, KeyValue, Field } from './shared';
import * as wf from '@/lib/workflow';

type DraftMilestone = {
  id?: string;
  seq: number;
  title: string;
  description: string;
  amount: number;
  due_at: string;
  evidence_requirements: wf.EvidenceRequirement[];
  acceptance_criteria: string[];
  review_sla_hours: number;
  revision_window_hours: number;
};

const PLATFORM_FEE = 0.1;
const WHT = 0.05;

function toDraft(milestones: wf.Milestone[]): DraftMilestone[] {
  return milestones.map((m) => ({
    id: m.id,
    seq: m.seq,
    title: m.title,
    description: m.description || '',
    amount: m.amount,
    due_at: (m.due_at || '').slice(0, 10),
    evidence_requirements: m.evidence_requirements.map((r) => ({ ...r })),
    acceptance_criteria: [...m.acceptance_criteria],
    review_sla_hours: m.review_sla_hours,
    revision_window_hours: m.revision_window_hours,
  }));
}

export function ProposalEditor() {
  const { proposalId = '' } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<wf.Proposal | null>(null);
  const [rows, setRows] = useState<DraftMilestone[]>([]);
  const [clauses, setClauses] = useState<string[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [validation, setValidation] = useState<wf.ValidationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = async () => {
    setError(null);
    try {
      const p = await wf.getProposal(proposalId);
      setProposal(p);
      setRows(toDraft(p.milestones));
      setClauses(p.legal_clauses);
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId]);

  const pool = useMemo(() => rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0), [rows]);
  const gross = pool / (1 - PLATFORM_FEE);
  const fee = gross - pool;
  const wht = pool * WHT;
  const net = pool - wht;
  const currency = proposal?.currency || 'USD';

  const updateRow = (index: number, patch: Partial<DraftMilestone>) => {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
    setDirty(true);
    setValidation(null);
  };

  const updateRequirement = (rowIndex: number, reqIndex: number, patch: Partial<wf.EvidenceRequirement>) => {
    setRows((current) =>
      current.map((row, i) =>
        i === rowIndex
          ? {
              ...row,
              evidence_requirements: row.evidence_requirements.map((r, j) =>
                j === reqIndex ? { ...r, ...patch } : r
              ),
            }
          : row
      )
    );
    setDirty(true);
    setValidation(null);
  };

  const addRequirement = (rowIndex: number) => {
    const key = `custom_${Date.now().toString(36).slice(-4)}`;
    setRows((current) =>
      current.map((row, i) =>
        i === rowIndex
          ? {
              ...row,
              evidence_requirements: [
                ...row.evidence_requirements,
                {
                  key,
                  label: 'New evidence item',
                  kind: 'IMAGE',
                  required: true,
                  min_count: 1,
                  accepted_types: ['image/png', 'image/jpeg'],
                  instructions: 'Describe what the creator should submit.',
                },
              ],
            }
          : row
      )
    );
    setDirty(true);
  };

  const removeRequirement = (rowIndex: number, reqIndex: number) => {
    setRows((current) =>
      current.map((row, i) =>
        i === rowIndex
          ? { ...row, evidence_requirements: row.evidence_requirements.filter((_, j) => j !== reqIndex) }
          : row
      )
    );
    setDirty(true);
  };

  const addMilestone = () => {
    setRows((current) => [
      ...current,
      {
        seq: current.length + 1,
        title: `Milestone ${current.length + 1}`,
        description: '',
        amount: 0,
        due_at: '',
        evidence_requirements: [
          {
            key: 'proof',
            label: 'Proof',
            kind: 'IMAGE',
            required: true,
            min_count: 1,
            accepted_types: ['image/png', 'image/jpeg'],
          },
        ],
        acceptance_criteria: [],
        review_sla_hours: 48,
        revision_window_hours: 72,
      },
    ]);
    setDirty(true);
    setValidation(null);
  };

  const removeMilestone = (index: number) => {
    setRows((current) => current.filter((_, i) => i !== index).map((row, i) => ({ ...row, seq: i + 1 })));
    setDirty(true);
    setValidation(null);
  };

  const save = async (then?: 'validate' | 'submit') => {
    setBusy(true);
    setError(null);
    try {
      const saved = await wf.patchProposal(proposalId, {
        milestones: rows.map((row) => ({
          ...row,
          due_at: row.due_at ? `${row.due_at}T23:59:00+00:00` : null,
        })),
        legal_clauses: clauses,
      });
      setProposal(saved);
      setRows(toDraft(saved.milestones));
      setDirty(false);

      if (then === 'validate') {
        setValidation(await wf.validateProposal(proposalId));
      }
      if (then === 'submit') {
        const result = await wf.validateProposal(proposalId);
        setValidation(result);
        if (result.ok) {
          await wf.submitProposal(proposalId);
          navigate(`/brand/proposals/${proposalId}/preview`);
        }
      }
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const submitDirect = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await wf.validateProposal(proposalId);
      setValidation(result);
      if (result.ok) {
        await wf.submitProposal(proposalId);
        navigate(`/brand/proposals/${proposalId}/preview`);
      }
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  if (!proposal) return <Loading label="Loading proposal" />;

  const editingAllowed = ['DRAFT', 'CHANGES_REQUESTED'].includes(proposal.status);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <Link
        to={`/brand/campaigns/${proposal.campaign_id}`}
        className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]"
      >
        ← Campaign
      </Link>
      <PageHeader
        eyebrow={`Proposal v${proposal.version}`}
        title="Edit the draft"
        description="The agent's draft is a starting point. Change any number, any requirement, any date."
        actions={<StatusBadge status={proposal.status} family={proposal.status_family} />}
      />

      {!editingAllowed && (
        <div className="mb-4">
          <Notice tone="warning" title="This proposal is no longer editable">
            It is {proposal.status.toLowerCase()}. Use a change order for anything that has already been sent.
          </Notice>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {rows.map((row, index) => (
            <Card key={row.id || index}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">Milestone {row.seq}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{wf.money(row.amount, currency)}</span>
                    {editingAllowed && rows.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeMilestone(index)}>
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Title"
                    value={row.title}
                    disabled={!editingAllowed}
                    onChange={(e) => updateRow(index, { title: e.target.value })}
                  />
                  <Input
                    label={`Amount (${currency})`}
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.amount}
                    disabled={!editingAllowed}
                    onChange={(e) => updateRow(index, { amount: Number(e.target.value) })}
                  />
                </div>
                <Field label="Description">
                  <textarea
                    className="d-input min-h-[64px]"
                    value={row.description}
                    disabled={!editingAllowed}
                    onChange={(e) => updateRow(index, { description: e.target.value })}
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input
                    label="Due date"
                    type="date"
                    value={row.due_at}
                    disabled={!editingAllowed}
                    onChange={(e) => updateRow(index, { due_at: e.target.value })}
                  />
                  <Input
                    label="Review SLA (hours)"
                    type="number"
                    value={row.review_sla_hours}
                    disabled={!editingAllowed}
                    onChange={(e) => updateRow(index, { review_sla_hours: Number(e.target.value) })}
                  />
                  <Input
                    label="Revision window (hours)"
                    type="number"
                    value={row.revision_window_hours}
                    disabled={!editingAllowed}
                    onChange={(e) => updateRow(index, { revision_window_hours: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Required evidence
                  </p>
                  <div className="mt-2 space-y-2">
                    {row.evidence_requirements.map((requirement, reqIndex) => (
                      <div
                        key={`${requirement.key}-${reqIndex}`}
                        className="grid gap-2 rounded-lg border border-[hsl(var(--border))] p-3 sm:grid-cols-[1fr_110px_90px_auto]"
                      >
                        <Input
                          value={requirement.label}
                          disabled={!editingAllowed}
                          onChange={(e) => updateRequirement(index, reqIndex, { label: e.target.value })}
                        />
                        <select
                          className="d-input"
                          value={requirement.kind}
                          disabled={!editingAllowed}
                          onChange={(e) => updateRequirement(index, reqIndex, { kind: e.target.value })}
                        >
                          <option value="IMAGE">Image</option>
                          <option value="FILE">File</option>
                          <option value="URL">Link</option>
                        </select>
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={requirement.required !== false}
                            disabled={!editingAllowed}
                            onChange={(e) =>
                              updateRequirement(index, reqIndex, { required: e.target.checked })
                            }
                          />
                          Required
                        </label>
                        {editingAllowed && (
                          <Button variant="ghost" size="sm" onClick={() => removeRequirement(index, reqIndex)}>
                            ×
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  {editingAllowed && (
                    <Button variant="ghost" size="sm" className="mt-2" onClick={() => addRequirement(index)}>
                      + Add evidence item
                    </Button>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Acceptance criteria
                  </p>
                  <ul className="mt-1 list-inside list-disc text-sm text-[hsl(var(--muted-foreground))]">
                    {row.acceptance_criteria.map((criterion) => (
                      <li key={criterion}>{criterion}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}

          {editingAllowed && (
            <Button variant="secondary" onClick={addMilestone}>
              + Add milestone
            </Button>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Legal clauses</CardTitle>
              <CardDescription>Edit the wording your legal team needs. One clause per line.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {clauses.map((clause, index) => (
                <div key={index} className="flex gap-2">
                  <textarea
                    className="d-input min-h-[48px]"
                    value={clause}
                    disabled={!editingAllowed}
                    onChange={(e) => {
                      setClauses((current) => current.map((c, i) => (i === index ? e.target.value : c)));
                      setDirty(true);
                    }}
                  />
                  {editingAllowed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setClauses((current) => current.filter((_, i) => i !== index));
                        setDirty(true);
                      }}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              {editingAllowed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setClauses((current) => [...current, 'New clause.']);
                    setDirty(true);
                  }}
                >
                  + Add clause
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Live totals</CardTitle>
              <CardDescription>Recalculated from the milestone table.</CardDescription>
            </CardHeader>
            <CardContent>
              <KeyValue label="Creator pool" value={wf.money(pool, currency)} />
              <KeyValue label="Platform fee (10%)" value={wf.money(fee, currency)} />
              <KeyValue label="Gross budget" value={wf.money(gross, currency)} />
              <KeyValue label="Withholding (5%)" value={wf.money(wht, currency)} />
              <KeyValue label="Net to creators" value={wf.money(net, currency)} />
              <div className="mt-3 border-t border-[hsl(var(--border))] pt-3">
                <p className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Recipients
                </p>
                {proposal.offers.map((offer) => (
                  <p key={offer.id} className="mt-1 flex items-center justify-between text-sm">
                    <span>{offer.creator?.name}</span>
                    <span className="font-semibold">{wf.money(offer.allocation, currency)}</span>
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          {validation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {validation.ok ? 'Ready for review' : 'Blocking issues'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {validation.blocking.map((issue) => (
                  <p key={issue.code + issue.message} className="text-sm text-red-300">
                    • {issue.message}
                  </p>
                ))}
                {validation.warnings.map((issue) => (
                  <p key={issue.code + issue.message} className="text-sm text-amber-300">
                    • {issue.message}
                  </p>
                ))}
              </CardContent>
            </Card>
          )}

          <ErrorNote error={error} />

          {editingAllowed && (
            <div className="space-y-2">
              <Button className="w-full" isLoading={busy} onClick={() => save()} disabled={!dirty}>
                Save draft
              </Button>
              <Button variant="secondary" className="w-full" isLoading={busy} onClick={() => save('validate')}>
                Save and check
              </Button>
              <Button variant="gold" className="w-full" isLoading={busy} onClick={dirty ? () => save('submit') : submitDirect}>
                Submit for approval
              </Button>
              <p className="text-center text-xs text-[hsl(var(--muted-foreground))]">
                Submitting does not email anyone. You review the rendered email next.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
