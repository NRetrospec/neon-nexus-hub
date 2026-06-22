import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  CheckCircle2,
  Clapperboard,
  Eye,
  Lock,
  MailWarning,
  MessageCircle,
  Mic,
  PenLine,
  RotateCcw,
  Send,
  Shield,
  Type,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

// ==================== SIGNATURE PAD ====================

interface SignatureState {
  signatureName: string;
  signatureMethod: "drawn" | "typed";
  // Base64 PNG of the canvas ink — the actual digital signature when drawn
  signatureImage?: string;
  isComplete: boolean;
}

/**
 * Signature capture component.
 * - Draw tab: HTML5 canvas for handwritten signature
 * - Type tab: styled cursive input
 * In both modes the signer must also type their full legal name, which is
 * the binding e-signature artifact stored in the legal record.
 */
const SignaturePad = ({
  onChange,
}: {
  onChange: (state: SignatureState) => void;
}) => {
  const [tab, setTab] = useState<"draw" | "type">("draw");
  const [fullName, setFullName] = useState("");
  const [typedSig, setTypedSig] = useState("");
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signatureImage, setSignatureImage] = useState<string | undefined>(undefined);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  // Initialise / re-init canvas background whenever the draw tab is active
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Backing resolution 2x for crisp rendering on HiDPI screens
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#0f0f18";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#2e2e45";
    ctx.font = "14px monospace";
    ctx.fillText("Sign here ↓", 16, rect.height / 2);
  }, []);

  useEffect(() => {
    if (tab === "draw") {
      // Defer one frame so the canvas is visible before we measure it.
      // This wipes any prior ink, so the captured signature state must
      // reset in lockstep — otherwise a stale image could outlive the
      // blanked canvas the user is now looking at.
      setHasDrawn(false);
      setSignatureImage(undefined);
      const id = requestAnimationFrame(initCanvas);
      return () => cancelAnimationFrame(id);
    }
  }, [tab, initCanvas]);

  const getRelativePos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    lastPosRef.current = getRelativePos(e);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getRelativePos(e);
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#d4d4f0";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPosRef.current = pos;
    if (!hasDrawn) setHasDrawn(true);
  };

  const onPointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    // Capture the actual ink as the binding digital signature artifact
    const canvas = canvasRef.current;
    if (canvas) setSignatureImage(canvas.toDataURL("image/png"));
  };

  const clearCanvas = () => {
    setHasDrawn(false);
    setSignatureImage(undefined);
    initCanvas();
  };

  // Propagate state to parent whenever any input changes
  useEffect(() => {
    const name = fullName.trim();
    const isComplete =
      tab === "draw"
        ? hasDrawn && !!signatureImage && name.length >= 2
        : typedSig.trim().length >= 2 && name.length >= 2;

    onChange({
      signatureName: name,
      signatureMethod: tab === "draw" ? "drawn" : "typed",
      signatureImage: tab === "draw" ? signatureImage : undefined,
      isComplete,
    });
  }, [tab, fullName, typedSig, hasDrawn, signatureImage, onChange]);

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "draw" | "type")}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="draw" className="font-gaming gap-2 text-xs">
            <PenLine className="h-3.5 w-3.5" />
            Draw Signature
          </TabsTrigger>
          <TabsTrigger value="type" className="font-gaming gap-2 text-xs">
            <Type className="h-3.5 w-3.5" />
            Type Signature
          </TabsTrigger>
        </TabsList>

        {/* Draw tab */}
        <TabsContent value="draw" className="mt-3 space-y-2">
          <div className="relative rounded-lg overflow-hidden border-2 border-primary/40 bg-[#0f0f18]">
            <canvas
              ref={canvasRef}
              className="w-full h-[140px] cursor-crosshair touch-none"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            />
            <button
              type="button"
              onClick={clearCanvas}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Clear"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          {!hasDrawn && (
            <p className="text-xs text-muted-foreground font-cyber text-center">
              Draw your signature above using your mouse or finger
            </p>
          )}
        </TabsContent>

        {/* Type tab */}
        <TabsContent value="type" className="mt-3">
          <div className="rounded-lg border-2 border-primary/40 bg-[#0f0f18] px-4 py-3 min-h-[80px] flex items-center">
            <input
              type="text"
              value={typedSig}
              onChange={(e) => setTypedSig(e.target.value)}
              placeholder="Type your signature here..."
              className="w-full bg-transparent text-[28px] text-[#c8c8ff] outline-none placeholder:text-[#2e2e45]"
              style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}
              maxLength={100}
            />
          </div>
          <p className="text-xs text-muted-foreground font-cyber mt-1">
            Your typed signature carries the same legal weight as a handwritten one
          </p>
        </TabsContent>
      </Tabs>

      {/* Full legal name — always required, always visible */}
      <div className="space-y-1.5">
        <label className="text-sm font-gaming text-foreground">
          Full legal name <span className="text-destructive">*</span>
        </label>
        <Input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your full legal name as it appears on official documents"
          className="font-cyber"
          maxLength={200}
        />
        <p className="text-[11px] text-muted-foreground font-cyber">
          This is the binding legal signature stored in our records under ESIGN &
          UETA.
        </p>
      </div>
    </div>
  );
};

// ==================== MAIN PODCAST PAGE ====================

const Podcast = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState<Id<"podcastEpisodes"> | null>(null);
  const [castFormOpen, setCastFormOpen] = useState(false);
  const userCreationAttempted = useRef(false);

  const dbUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const episodes = useQuery(api.podcast.getEpisodes, {});
  const availability = useQuery(api.podcast.getCastFormAvailability, {});
  const mySignature = useQuery(
    api.podcast.getMySignature,
    dbUser ? { userId: dbUser._id } : "skip"
  );

  const createUser = useMutation(api.users.createUser);
  const retryReleaseEmail = useMutation(api.podcast.retryReleaseEmail);

  // Create user in database if not exists (same pattern as Social)
  useEffect(() => {
    if (user && !dbUser && !userCreationAttempted.current) {
      userCreationAttempted.current = true;
      createUser({
        clerkId: user.id,
        username: user.username || user.firstName || "Player",
        email: user.emailAddresses[0]?.emailAddress || "",
        avatar: user.imageUrl || "🎮",
      });
    }
  }, [user, dbUser, createUser]);

  const castFormEnabled = availability?.isEnabled === true;

  const handleOpenCastForm = () => {
    if (!castFormEnabled || !dbUser) return;
    setCastFormOpen(true);
  };

  const handleRetryEmail = async () => {
    if (!dbUser || !mySignature) return;
    try {
      await retryReleaseEmail({ userId: dbUser._id, signatureId: mySignature._id });
      toast.success("Confirmation email re-queued!");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to resend email";
      toast.error(msg);
    }
  };

  const formatDate = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="fixed inset-0 animated-gradient opacity-20 pointer-events-none" />
        <div className="fixed inset-0 cyber-grid opacity-10 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/home")}
              className="mb-4 font-cyber"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-gaming font-bold mb-2">
              <span className="text-foreground">POD</span>
              <span className="text-gradient">CAST</span>
            </h1>
            <p className="text-muted-foreground font-cyber text-sm sm:text-base lg:text-lg">
              Watch episodes, join the discourse, and apply to be on the show
            </p>
          </motion.div>

          {/* CastForm Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="gaming-card p-4 sm:p-6 mb-6 sm:mb-8 border-2 border-primary/30"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <Clapperboard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-gaming font-semibold text-foreground">
                    Want to be on the podcast?
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground font-cyber">
                    Sign the digital release authorizing use of your likeness and materials.
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground/70 font-cyber mt-1">
                    Release version: {availability?.releaseVersion ?? "..."}
                  </p>
                </div>
              </div>

              {mySignature ? (
                <div className="flex items-center gap-2 text-neon-green font-cyber text-sm shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                  You&apos;re signed
                </div>
              ) : (
                <Button
                  variant="neon"
                  size="lg"
                  onClick={handleOpenCastForm}
                  disabled={!castFormEnabled || !dbUser}
                  className="font-gaming shrink-0"
                  title={!castFormEnabled ? "CastForm currently unavailable" : undefined}
                >
                  <Mic className="mr-2 h-4 w-4" />
                  CastForm
                </Button>
              )}
            </div>

            {!castFormEnabled && !mySignature && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border text-muted-foreground">
                <Lock className="h-4 w-4 shrink-0" />
                <p className="font-cyber text-xs sm:text-sm">
                  CastForm currently unavailable. Applications open periodically — check back later.
                </p>
              </div>
            )}

            {mySignature && (
              <div className="mt-4 pt-4 border-t border-border space-y-1 font-cyber text-xs text-muted-foreground">
                <p>
                  Signature reference:{" "}
                  <span className="font-mono text-foreground">{mySignature._id}</span>
                </p>
                <p>
                  Signed {new Date(mySignature.acceptedAt).toLocaleString()} ·{" "}
                  {mySignature.releaseVersion}
                </p>
                {mySignature.emailStatus === "sent" && (
                  <p className="text-neon-green">
                    Confirmation email sent — a copy of your signed release is in your inbox.
                  </p>
                )}
                {mySignature.emailStatus === "pending" && (
                  <p>Confirmation email is on its way...</p>
                )}
                {mySignature.emailStatus === "failed" && (
                  <div className="flex items-center gap-2 text-destructive">
                    <MailWarning className="h-4 w-4 shrink-0" />
                    <span>Confirmation email failed to send.</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRetryEmail}
                      className="font-cyber text-xs h-7"
                    >
                      Resend
                    </Button>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Episodes Feed */}
          <div className="space-y-4 sm:space-y-6">
            {episodes?.map((episode) => (
              <div key={episode._id} className="gaming-card overflow-hidden">
                <video
                  controls
                  preload="metadata"
                  src={episode.videoUrl}
                  poster={episode.thumbnailUrl}
                  className="w-full aspect-video bg-black"
                />
                <div className="p-3 sm:p-4 md:p-6">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-gaming font-bold text-foreground text-base sm:text-lg">
                      {episode.title}
                    </h3>
                    <span className="text-[10px] sm:text-xs text-muted-foreground font-cyber shrink-0">
                      {formatDate(episode.publishedAt)}
                    </span>
                  </div>
                  <p className="text-muted-foreground font-cyber text-sm whitespace-pre-wrap mb-3 sm:mb-4">
                    {episode.description}
                  </p>

                  <div className="pt-3 sm:pt-4 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setShowComments(showComments === episode._id ? null : episode._id)
                      }
                      className="font-cyber gap-1 sm:gap-2 text-xs sm:text-sm"
                    >
                      <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      Discussion
                    </Button>
                  </div>

                  {showComments === episode._id && dbUser && (
                    <EpisodeComments episodeId={episode._id} userId={dbUser._id} />
                  )}
                </div>
              </div>
            ))}

            {episodes && episodes.length === 0 && (
              <div className="text-center py-16 gaming-card">
                <div className="text-6xl mb-4">🎙️</div>
                <h3 className="text-xl font-gaming text-foreground mb-2">
                  No episodes yet
                </h3>
                <p className="text-muted-foreground font-cyber">
                  Episodes are coming soon. Stay tuned!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* CastForm modal — only ever mounted while the form is server-enabled */}
      {dbUser && user && castFormEnabled && availability && (
        <CastFormModal
          open={castFormOpen}
          onOpenChange={setCastFormOpen}
          userId={dbUser._id}
          clerkId={user.id}
          availability={availability}
        />
      )}

      <Footer />
    </div>
  );
};

// ==================== EPISODE COMMENTS ====================

const EpisodeComments = ({
  episodeId,
  userId,
}: {
  episodeId: Id<"podcastEpisodes">;
  userId: Id<"users">;
}) => {
  const [commentContent, setCommentContent] = useState("");
  const comments = useQuery(api.podcast.getCommentsByEpisode, { episodeId });
  const addComment = useMutation(api.podcast.addComment);

  const handleAddComment = async () => {
    if (!commentContent.trim()) return;
    try {
      await addComment({ userId, episodeId, content: commentContent });
      setCommentContent("");
      toast.success("Comment added!");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to add comment";
      toast.error(msg);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mt-4 pt-4 border-t border-border space-y-4"
    >
      {/* Add Comment */}
      <div className="flex gap-2">
        <Input
          placeholder="Join the discussion..."
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAddComment();
            }
          }}
          className="flex-1 font-cyber"
        />
        <Button
          onClick={handleAddComment}
          disabled={!commentContent.trim()}
          variant="cyber"
          size="sm"
          className="font-gaming"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Comments List (oldest first, chat-like) */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments?.map((comment) => (
          <div key={comment._id} className="flex gap-3 text-sm">
            <Avatar className="w-8 h-8 border border-primary/30">
              <AvatarFallback className="bg-primary/20 text-primary font-gaming text-xs">
                {comment.user?.avatar || "🎮"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-gaming font-semibold text-foreground text-xs">
                  {comment.user?.username || "Unknown"}
                </span>
                <Badge variant="outline" className="text-xs">
                  Lvl {comment.user?.level || 1}
                </Badge>
              </div>
              <p className="text-foreground font-cyber text-sm">{comment.content}</p>
            </div>
          </div>
        ))}
        {comments && comments.length === 0 && (
          <p className="text-muted-foreground font-cyber text-sm text-center py-4">
            No comments yet. Be the first!
          </p>
        )}
      </div>
    </motion.div>
  );
};

// ==================== CASTFORM RELEASE MODAL ====================

type CastFormAvailability = {
  isEnabled: boolean;
  releaseVersion: string;
  releaseText: string;
  requireTypedConfirmation: boolean;
  confirmationPhrase: string | null;
};

const CastFormModal = ({
  open,
  onOpenChange,
  userId,
  clerkId,
  availability,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: Id<"users">;
  clerkId: string;
  availability: CastFormAvailability;
}) => {
  const [releaseScrolled, setReleaseScrolled] = useState(false);
  const [likenessConsent, setLikenessConsent] = useState(false);
  const [recordingConsent, setRecordingConsent] = useState(false);
  const [distributionConsent, setDistributionConsent] = useState(false);
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const [sigState, setSigState] = useState<SignatureState>({
    signatureName: "",
    signatureMethod: "drawn",
    isComplete: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startedLogged = useRef(false);

  const submitCastForm = useMutation(api.podcast.submitCastForm);
  const logCastFormEvent = useMutation(api.podcast.logCastFormEvent);

  // Stable callback so SignaturePad's useEffect dep doesn't fire every render
  const handleSigChange = useCallback((s: SignatureState) => setSigState(s), []);

  // Audit: log "viewed" each time the modal opens
  useEffect(() => {
    if (open) {
      logCastFormEvent({
        userId,
        clerkId,
        eventType: "podcast_release_viewed",
        ipAddress: "CLIENT_IP",
        userAgent: navigator.userAgent,
      }).catch(() => {});
    } else {
      // Reset form state on close
      setReleaseScrolled(false);
      setLikenessConsent(false);
      setRecordingConsent(false);
      setDistributionConsent(false);
      setTypedConfirmation("");
      startedLogged.current = false;
    }
  }, [open, userId, clerkId, logCastFormEvent]);

  // Audit: log "started" on first consent checkbox interaction
  const logStarted = () => {
    if (startedLogged.current) return;
    startedLogged.current = true;
    logCastFormEvent({
      userId,
      clerkId,
      eventType: "podcast_release_started",
      ipAddress: "CLIENT_IP",
      userAgent: navigator.userAgent,
    }).catch(() => {});
  };

  const handleReleaseScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const scrollHeight = el.scrollHeight - el.clientHeight;
    if (scrollHeight <= 10 || (el.scrollTop / scrollHeight) * 100 > 70) {
      setReleaseScrolled(true);
    }
  };

  const confirmationOk =
    !availability.requireTypedConfirmation ||
    typedConfirmation.trim() === (availability.confirmationPhrase ?? "I AGREE");

  const allConsents = likenessConsent && recordingConsent && distributionConsent;

  const canSubmit =
    releaseScrolled &&
    allConsents &&
    confirmationOk &&
    sigState.isComplete &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      const result = await submitCastForm({
        userId,
        clerkId,
        ipAddress: "CLIENT_IP",
        userAgent: navigator.userAgent,
        consents: {
          likenessConsent,
          recordingConsent,
          distributionConsent,
        },
        signatureName: sigState.signatureName,
        signatureMethod: sigState.signatureMethod,
        signatureImage: sigState.signatureMethod === "drawn" ? sigState.signatureImage : undefined,
        typedConfirmation: availability.requireTypedConfirmation
          ? typedConfirmation.trim()
          : undefined,
      });

      toast.success(
        result.alreadySigned
          ? "You had already signed this release."
          : "Release signed! A confirmation email with your copy is on its way."
      );
      onOpenChange(false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to submit release";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto gaming-card">
        <DialogHeader>
          <DialogTitle className="font-gaming text-foreground">
            Podcast Release Form
          </DialogTitle>
          <DialogDescription className="font-cyber">
            Version {availability.releaseVersion} — read the full release before signing.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Scrollable legal release text */}
        <div className="space-y-2">
          <h3 className="font-gaming text-sm text-foreground">
            Step 1 — Read the Release
          </h3>
          <ScrollArea
            className="h-[220px] w-full rounded-md border border-border p-4 bg-muted/30"
            onScrollCapture={handleReleaseScroll}
          >
            <pre className="whitespace-pre-wrap font-cyber text-xs leading-relaxed text-foreground">
              {availability.releaseText}
            </pre>
          </ScrollArea>

          {!releaseScrolled && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-cyber">
                <Eye className="h-4 w-4" />
                <span>Scroll to the bottom to continue</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReleaseScrolled(true)}
                className="font-cyber text-xs"
              >
                Mark as Read
              </Button>
            </div>
          )}
        </div>

        {/* Step 2: Consent checkboxes */}
        <div className="space-y-3 p-4 bg-muted/20 rounded-lg border border-border">
          <h3 className="font-gaming text-sm text-foreground">Step 2 — Confirm Consents</h3>

          {[
            {
              id: "likeness",
              checked: likenessConsent,
              set: setLikenessConsent,
              label: "I authorize use of my name, voice, image, and likeness",
            },
            {
              id: "recording",
              checked: recordingConsent,
              set: setRecordingConsent,
              label: "I consent to being recorded, filmed, and photographed",
            },
            {
              id: "distribution",
              checked: distributionConsent,
              set: setDistributionConsent,
              label:
                "I agree to the editing, distribution, and promotional use described above",
            },
          ].map(({ id, checked, set, label }) => (
            <div key={id} className="flex items-start space-x-3">
              <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={(v) => {
                  logStarted();
                  set(v as boolean);
                }}
                disabled={!releaseScrolled}
                className="mt-1"
              />
              <label
                htmlFor={id}
                className="text-sm font-cyber leading-relaxed cursor-pointer"
              >
                <strong className="text-foreground">{label}</strong>{" "}
                <span className="text-destructive">*</span>
              </label>
            </div>
          ))}

          {availability.requireTypedConfirmation && (
            <div className="pt-3 border-t border-border space-y-2">
              <label className="text-sm font-cyber text-foreground">
                Type{" "}
                <span className="font-mono text-primary">
                  {availability.confirmationPhrase ?? "I AGREE"}
                </span>{" "}
                to confirm <span className="text-destructive">*</span>
              </label>
              <Input
                value={typedConfirmation}
                onChange={(e) => setTypedConfirmation(e.target.value)}
                disabled={!releaseScrolled}
                placeholder={availability.confirmationPhrase ?? "I AGREE"}
                className="font-mono"
              />
            </div>
          )}
        </div>

        {/* Step 3: Digital signature */}
        <div className="space-y-2 p-4 bg-muted/20 rounded-lg border border-border">
          <h3 className="font-gaming text-sm text-foreground">Step 3 — Sign</h3>
          <SignaturePad onChange={handleSigChange} />
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription className="font-cyber text-xs leading-relaxed">
            <strong>Legal Notice:</strong> Submitting this form electronically signs the
            release above and creates a legally binding agreement under ESIGN & UETA.
            A copy will be emailed to you for your records.
          </AlertDescription>
        </Alert>

        {/* Completion checklist */}
        {!canSubmit && (
          <div className="text-xs font-cyber text-muted-foreground space-y-1 pl-1">
            {!releaseScrolled && <p className="text-destructive/80">· Read the release (scroll or mark as read)</p>}
            {!allConsents && <p className="text-destructive/80">· Check all three consent boxes</p>}
            {!sigState.isComplete && (
              <p className="text-destructive/80">
                {sigState.signatureMethod === "drawn"
                  ? "· Draw your signature and type your full legal name"
                  : "· Type your signature and full legal name"}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <Button
            variant="neon"
            size="lg"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 font-gaming"
          >
            {isSubmitting ? "Submitting..." : "Sign & Submit Release"}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="font-gaming"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Podcast;
