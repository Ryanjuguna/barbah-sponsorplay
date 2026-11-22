import { useState, useEffect, useRef, useCallback } from 'react';
import type { VerificationUpdate, VerifyStatus } from '@/lib/websocket';
import { verificationWS } from '@/lib/websocket';
import { Badge } from '@/components/ui/Badge';
import {
  AlertCircle,
  Loader2,
  CheckCircle2,
  Play,
  Smartphone,
  Monitor,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface VerificationStatusProps {
  creatorId: string;
  streamUrl?: string;
  proposalId?: string;
  milestoneId?: string;
}

const statusColors: Record<VerifyStatus, string> = {
  IN_PROGRESS: 'bg-[hsl(var(--primary))]/30 text-[hsl(var(--primary))] border-[hsl(var(--primary))]/40 animate-pulse',
  VERIFIED: 'bg-[hsl(var(--secondary))]/30 text-[hsl(var(--secondary))] border-[hsl(var(--secondary))]/40',
  REQUIRES_REVISION: 'bg-[hsl(var(--accent))]/30 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/40',
  FAILED: 'bg-red-900/30 text-red-300 border-red-500/40',
};

const statusLabels: Record<VerifyStatus, string> = {
  IN_PROGRESS: 'Verifying Stream',
  VERIFIED: 'Proof-of-Play Verified',
  REQUIRES_REVISION: 'Requires Revision',
  FAILED: 'Verification Failed',
};

const statusIcons: Record<VerifyStatus, React.ReactNode> = {
  IN_PROGRESS: <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--primary))]" />,
  VERIFIED: <CheckCircle2 className="h-5 w-5 text-[hsl(var(--secondary))]" />,
  REQUIRES_REVISION: <AlertCircle className="h-5 w-5 text-[hsl(var(--accent))]" />,
  FAILED: <AlertCircle className="h-5 w-5 text-red-400" />,
};

const defaultColor = 'bg-slate-800/30 text-slate-300 border-slate-600/40';
const defaultLabel = 'Waiting to Start';
const defaultIcon = <Play className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />;

export function VerificationStatus({
  creatorId,
  streamUrl,
  proposalId,
  milestoneId,
}: VerificationStatusProps) {
  const [status, setStatus] = useState<VerifyStatus | null>(null);
  const [update, setUpdate] = useState<VerificationUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateRef = useRef<VerificationUpdate | null>(null);

  useEffect(() => {
    // Connect WebSocket
    verificationWS.connect(creatorId);

    const unsubConnect = verificationWS.onConnect(() => {
      setIsConnected(true);
      setIsSimulating(import.meta.env.VITE_WS_SIMULATE === 'true');
    });

    const unsubDisconnect = verificationWS.onDisconnect(() => {
      setIsConnected(false);
      verificationWS.stopSimulation();
    });

    const unsubError = verificationWS.onError(() => setError('WebSocket connection error'));

    const unsubUpdate = verificationWS.onUpdate((verificationUpdate) => {
      setUpdate(verificationUpdate);
      setStatus(verificationUpdate.status);
      updateRef.current = verificationUpdate;
    });

    // Start simulation stream if in simulate mode
    if (
      import.meta.env.VITE_WS_SIMULATE === 'true' &&
      streamUrl &&
      proposalId &&
      milestoneId
    ) {
      verificationWS.startSimulationStream(
        (verificationUpdate) => {
          setUpdate(verificationUpdate);
          setStatus(verificationUpdate.status);
          updateRef.current = verificationUpdate;
        },
        milestoneId
      );
    }

    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubError();
      unsubUpdate();
      if (import.meta.env.VITE_WS_SIMULATE === 'true') {
        verificationWS.stopSimulation();
      }
    };
  }, [creatorId, streamUrl, proposalId, milestoneId]);

  const handleManualVerify = useCallback(() => {
    if (!streamUrl || !proposalId || !milestoneId) return;
    verificationWS.startSimulationStream(
      (verificationUpdate) => {
        setUpdate(verificationUpdate);
        setStatus(verificationUpdate.status);
        updateRef.current = verificationUpdate;
      },
      milestoneId
    );
    setIsSimulating(true);
  }, [streamUrl, proposalId, milestoneId]);

  if (!streamUrl || !proposalId || !milestoneId) {
    return (
      <div className="d-card p-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Smartphone className="h-6 w-6 text-[hsl(var(--muted-foreground))]" />
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            Ready to verify stream
          </span>
        </div>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-6">
          Submit a stream link to begin real-time AI verification.
        </p>
      </div>
    );
  }

  return (
    <div className="d-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Monitor className="h-4 w-4 text-[hsl(var(--primary))]" />
            <h3 className="font-bold text-[hsl(var(--foreground))]">
              Real-Time Verification
            </h3>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Agent 3: Multimodal Verifier • {isSimulating ? 'Demo Mode' : 'Live'}
          </p>
        </div>
        <Badge variant={isConnected ? 'green' : 'slate'}>
          {isSimulating ? 'Demo' : isConnected ? 'Live' : 'Connecting…'}
        </Badge>
      </div>

      <div className="space-y-5">
        {/* Status */}
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
            status ? statusColors[status] : defaultColor
          }`}
        >
          {status ? statusIcons[status] : defaultIcon}
          <div>
            <p className="font-medium text-[hsl(var(--foreground))]">
              {status ? statusLabels[status] : defaultLabel}
            </p>
            {update && (
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {update.verification_decision
                  ? `Decision: {update.verification_decision}`
                  : ''}
                {update.overall_confidence_percent !== undefined
                  ? ` • Confidence: {update.overall_confidence_percent}%`
                  : ''}
              </p>
            )}
          </div>
          {status === 'IN_PROGRESS' && (
            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-[hsl(var(--primary))] animate-pulse w-[70%]"
              />
            </div>
          )}
        </div>

        {/* Metrics Grid */}
        {update && (
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Logo Screen Time"
              value={`${(update.logo_screen_ratio_percent ?? 0).toFixed(2)}%`}
              threshold="≥ 3.5%"
              icon={Monitor}
              passing={(update.logo_screen_ratio_percent ?? 0) >= 3.5}
            />
            <MetricCard
              label="Audio Confidence"
              value={`${Math.round((update.audio_confidence ?? 0) * 100)}%`}
              threshold="Clear speech"
              icon={Shield}
              passing={(update.audio_confidence ?? 0) >= 0.8}
            />
          </div>
        )}

        {/* Brand Safety */}
        {update && update.brand_safety_status && (
          <div className="flex items-center justify-between p-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                Brand Safety
              </span>
            </div>
            <Badge
              variant={
                update.brand_safety_status === 'SAFE' ? 'green' : 'terracotta'
              }
            >
              {update.brand_safety_status}
            </Badge>
          </div>
        )}

        {/* Verbal Slogans */}
        {update && update.verbal_slogans_detected && update.verbal_slogans_detected.length > 0 && (
          <div className="p-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2 uppercase tracking-wider font-semibold">
              Verbal Brand Mentions Detected
            </p>
            <div className="flex flex-wrap gap-2">
              {update.verbal_slogans_detected.map((slogan, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 rounded text-[10px] font-semibold bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/30 text-[hsl(var(--primary))]"
                >
                  “{slogan}”
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Simulation Controls */}
        {isSimulating && status !== 'VERIFIED' && status !== 'FAILED' && (
          <div className="flex items-center justify-between p-3 rounded-xl border border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/10">
            <span className="text-xs text-[hsl(var(--accent))] font-semibold flex items-center gap-2">
              <Monitor className="h-3 w-3" /> Simulating real-time verification…
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualVerify}
              className="text-xs text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/30"
            >
              Restart Simulation
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl border border-red-500/30 bg-red-900/20 text-red-300 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

interface MetricCardProps {
  label?: string;
  value: string;
  threshold: string;
  icon: React.ComponentType<{ className?: string }>;
  passing: boolean;
}

function MetricCard({
  label,
  value,
  threshold,
  icon: Icon,
  passing,
}: MetricCardProps) {
  return (
    <div className="p-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="flex items-center justify-between mb-1">
        <Icon className={`h-4 w-4 ${passing ? 'text-[hsl(var(--secondary))]' : 'text-[hsl(var(--muted-foreground))]'}`} />
        <span className={`text-[10px] font-semibold ${passing ? 'text-[hsl(var(--secondary))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
          {passing ? 'PASS' : 'PENDING'}
        </span>
      </div>
      {label && <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">{label}</p>}
      <p className="font-bold text-lg text-[hsl(var(--foreground))]">{value}</p>
      <p className="text-xs text-[hsl(var(--muted-foreground))]">{threshold}</p>
    </div>
  );
}