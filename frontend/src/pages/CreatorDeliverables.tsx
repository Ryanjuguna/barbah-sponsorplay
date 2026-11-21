import { useState, useCallback } from 'react';
import {
  ArrowRight,
  Play,
  Smartphone,
  ShieldCheck,
  Clock,
  Download,
  Upload,
  Monitor,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { VerificationStatus } from '@/components/VerificationStatus';

interface CreatorDeliverablesProps {
  onNavigate: (path: string) => void;
}

interface DeliverableFile {
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
}

export const CreatorDeliverables = ({ onNavigate }: CreatorDeliverablesProps) => {
  /* Read creator_id from URL query params */
  const creatorId =
    new URLSearchParams(window.location.search).get('creator_id') || 'creator-001';

  const [streamUrl, setStreamUrl] = useState('');
  const [proposalId, setProposalId] = useState('');
  const [milestoneId, setMilestoneId] = useState('');
  const [notes, setNotes] = useState('');
  const [imageFile, setImageFile] = useState<DeliverableFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [simulateMode, setSimulateMode] = useState(
    import.meta.env.VITE_WS_SIMULATE === 'true'
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, WEBP)');
      return;
    }
    const preview = URL.createObjectURL(file);
    setImageFile({
      file,
      preview,
      status: 'pending',
    });
  };

  const removeImage = () => {
    if (imageFile?.preview) {
      URL.revokeObjectURL(imageFile.preview);
    }
    setImageFile(null);
  };

  const imageToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }, []);

  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      let imageBase64: string | undefined;
      if (imageFile) {
        imageBase64 = await imageToBase64(imageFile.file);
      }

      const result = await api.submitDeliverable({
        proposal_id: proposalId,
        creator_id: creatorId,
        milestone_id: milestoneId,
        deliverable_type: imageFile ? 'IMAGE_UPLOAD' : 'STREAM_LINK',
        media_url: streamUrl || undefined,
        image_base64: imageBase64,
        notes,
      });
      setSubmissionResult(result);
    } catch (err: any) {
      setSubmissionResult({ error: err.message || 'Submission failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    onNavigate(`/creator?creator_id=${creatorId}`);
  };

  const isFormValid = !!(proposalId && milestoneId && (streamUrl || imageFile));

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Top App Bar */}
      <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/50 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 py-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={handleBack}>
              <ArrowRight className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
              <span className="font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                Back to Dashboard
              </span>
            </div>

            <div className="flex items-center gap-4 w-full lg:w-auto">
              <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">
                Upload Deliverable
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Simulation Mode Toggle */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <span>Demo Mode</span>
            <button
              onClick={() => setSimulateMode(!simulateMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 ${
                simulateMode
                  ? 'bg-[hsl(var(--primary))]'
                  : 'bg-slate-800'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  simulateMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {simulateMode && (
            <Badge variant="terracotta" className="text-xs">
              VITE_WS_SIMULATE active
            </Badge>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Submission Form */}
          <Card padding="md">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Upload className="h-5 w-5 text-[hsl(var(--primary))]" />
                <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">
                  Submit Deliverable
                </h2>
              </div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Provide your stream link or upload a screenshot/frame. Agent 3
                will verify logo visibility, verbal brand mentions, and brand safety.
              </p>
            </CardHeader>

            <CardContent className="space-y-5">
              <form onSubmit={handleSubmitDeliverable} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[hsl(var(--foreground))]">
                    Proposal ID
                  </label>
                  <Input
                    value={proposalId}
                    onChange={(e) => setProposalId(e.target.value)}
                    placeholder="e.g. PROP-abc123"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[hsl(var(--foreground))]">
                    Milestone ID
                  </label>
                  <Input
                    value={milestoneId}
                    onChange={(e) => setMilestoneId(e.target.value)}
                    placeholder="e.g. MLS-01"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[hsl(var(--foreground))]">
                    Stream Link (Twitch / YouTube / TikTok)
                  </label>
                  <Input
                    value={streamUrl}
                    onChange={(e) => setStreamUrl(e.target.value)}
                    placeholder="https://twitch.tv/thebeast_ke"
                  />
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                    Optional if uploading an image instead
                  </p>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[hsl(var(--foreground))]">
                    Stream Screenshot / Frame (Optional)
                  </label>
                  <div className="border-2 border-dashed rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--background))]/30 p-4 text-center hover:border-[hsl(var(--primary))]/50 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {imageFile ? (
                      <div className="flex flex-col items-center gap-3">
                        <img
                          src={imageFile.preview}
                          alt="Preview"
                          className="w-24 h-24 rounded-lg object-cover border border-[hsl(var(--border))]"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="text-xs text-red-400 hover:text-red-300 underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-6 w-6 text-[hsl(var(--muted-foreground))]" />
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                          Click to upload image
                        </p>
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                          JPG, PNG, WEBP (max 5MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[hsl(var(--foreground))]">
                    Notes (Optional)
                  </label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any context for the verifier..."
                  />
                </div>

                <Button
                  variant="gold"
                  className="w-full"
                  isLoading={isSubmitting}
                  disabled={isSubmitting || !isFormValid}
                  leftIcon={<Play className="h-4 w-4" />}
                >
                  {imageFile ? 'Submit Image for Verification' : 'Submit Stream Link'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Submission Result */}
          {submissionResult && (
            <Card
              padding="md"
              className={`border-[hsl(var(--secondary))]/30 shadow-[var(--shadow-green)] ${
                submissionResult.decision === 'FAILED'
                  ? 'border-[hsl(var(--destructive))]/30 shadow-[var(--shadow-terracotta)]'
                  : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  {submissionResult.decision === 'PASSED' ? (
                    <ShieldCheck className="h-6 w-6 text-emerald-400" />
                  ) : (
                    <FileText className="h-6 w-6 text-amber-400" />
                  )}
                  <span className="font-bold text-[hsl(var(--foreground))]">
                    Verification Result
                  </span>
                </div>
                <CardDescription>
                  Agent 3 has reviewed your deliverable.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      submissionResult.decision === 'PASSED'
                        ? 'green'
                        : submissionResult.decision === 'FAILED'
                        ? 'terracotta'
                        : 'terracotta'
                    }
                  >
                    {submissionResult.decision}
                  </Badge>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    {submissionResult.next_step}
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--muted-foreground))]">Decision</span>
                    <span className="font-medium text-[hsl(var(--foreground))]">
                      {submissionResult.decision}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--muted-foreground))]">Next Step</span>
                    <span className="font-medium text-[hsl(var(--foreground))]">
                      {submissionResult.next_step}
                    </span>
                  </div>
                </div>

                {submissionResult.certificate && (
                  <div className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                    <h4 className="text-sm font-bold text-[hsl(var(--foreground))] mb-2">
                      Proof-of-Play Certificate
                    </h4>
                    <div className="space-y-1 text-xs text-[hsl(var(--muted-foreground))]">
                      <div>ID: {submissionResult.certificate.certificate_id}</div>
                      <div>Confidence: {submissionResult.certificate.overall_confidence_percent}%</div>
                      <div>Logo Occupancy: {submissionResult.certificate.logo_screen_ratio_percent}%</div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setSubmissionResult(null)}
                    className="flex-1"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    New Submission
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      onNavigate(`/creator?creator_id=${creatorId}`);
                    }}
                    className="flex-1"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Real-time Verification Status (WebSocket + Simulation) */}
          {(proposalId && milestoneId && (streamUrl || imageFile)) && (
            <Card padding="md">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Monitor className="h-5 w-5 text-[hsl(var(--primary))]" />
                  <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">
                    Live Verification
                  </h2>
                </div>
                <CardDescription>
                  Watch Agent 3 verify your deliverable in real time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VerificationStatus
                  creatorId={creatorId}
                  streamUrl={streamUrl}
                  proposalId={proposalId}
                  milestoneId={milestoneId}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <InfoCard
            icon={Smartphone}
            iconColor="text-blue-400"
            bg="bg-blue-900/20"
            title="Paste Stream Link"
            desc="Twitch, YouTube, TikTok, or any public stream URL."
          />
          <InfoCard
            icon={Upload}
            iconColor="text-purple-400"
            bg="bg-purple-900/20"
            title="Upload Screenshot"
            desc="JPG, PNG, or WEBP frame from your stream."
          />
          <InfoCard
            icon={Download}
            iconColor="text-emerald-400"
            bg="bg-emerald-900/20"
            title="Get Paid"
            desc="Verified milestones trigger instant PayPal payout + M-Pesa."
          />
        </div>
      </div>
    </div>
  );
};

interface InfoCardProps {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  bg: string;
  title: string;
  desc: string;
}

function InfoCard({
  icon: Icon,
  iconColor,
  bg,
  title,
  desc,
}: InfoCardProps) {
  return (
    <Card padding="md" className="text-center">
      <div className={`h-10 w-10 rounded-lg ${bg} flex items-center justify-center mx-auto mb-3`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <h4 className="font-bold text-[hsl(var(--foreground))] mb-2">{title}</h4>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">{desc}</p>
    </Card>
  );
}