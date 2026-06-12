import { useState, useEffect, useRef } from "react";
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
  Send,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

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
  }, [user, dbUser]);

  const castFormEnabled = availability?.isEnabled === true;

  const handleOpenCastForm = () => {
    // Guard: a disabled CastForm can never open the modal, even if the
    // disabled attribute were tampered with in the DOM
    if (!castFormEnabled || !dbUser) return;
    setCastFormOpen(true);
  };

  const handleRetryEmail = async () => {
    if (!dbUser || !mySignature) return;
    try {
      await retryReleaseEmail({
        userId: dbUser._id,
        signatureId: mySignature._id,
      });
      toast.success("Confirmation email re-queued!");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend email");
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
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
                    Sign the digital release form to authorize use of your likeness.
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground/70 font-cyber mt-1">
                    Release version: {availability?.releaseVersion ?? "..."}
                  </p>
                </div>
              </div>

              {mySignature ? (
                <div className="flex items-center gap-2 text-neon-green font-cyber text-sm shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                  You're signed
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
                  CastForm currently unavailable. Check back later — applications
                  open periodically.
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
                        setShowComments(
                          showComments === episode._id ? null : episode._id
                        )
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

      {/* CastForm modal — only ever mounted while the form is enabled */}
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
    } catch (error: any) {
      toast.error(error.message || "Failed to add comment");
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
  const [scrolled, setScrolled] = useState(false);
  const [likenessConsent, setLikenessConsent] = useState(false);
  const [recordingConsent, setRecordingConsent] = useState(false);
  const [distributionConsent, setDistributionConsent] = useState(false);
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startedLogged = useRef(false);

  const submitCastForm = useMutation(api.podcast.submitCastForm);
  const logCastFormEvent = useMutation(api.podcast.logCastFormEvent);

  // Audit: log "viewed" each time the release is opened
  useEffect(() => {
    if (open) {
      logCastFormEvent({
        userId,
        clerkId,
        eventType: "podcast_release_viewed",
        ipAddress: "CLIENT_IP", // Get from server in production
        userAgent: navigator.userAgent,
      }).catch(() => {});
    } else {
      // Reset form state when closing
      setScrolled(false);
      setLikenessConsent(false);
      setRecordingConsent(false);
      setDistributionConsent(false);
      setTypedConfirmation("");
      startedLogged.current = false;
    }
  }, [open]);

  // Audit: log "started" on first interaction with a consent checkbox
  const logStarted = () => {
    if (startedLogged.current) return;
    startedLogged.current = true;
    logCastFormEvent({
      userId,
      clerkId,
      eventType: "podcast_release_started",
      ipAddress: "CLIENT_IP", // Get from server in production
      userAgent: navigator.userAgent,
    }).catch(() => {});
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrollHeight = element.scrollHeight - element.clientHeight;
    if (scrollHeight <= 10 || (element.scrollTop / scrollHeight) * 100 > 70) {
      setScrolled(true);
    }
  };

  const confirmationOk =
    !availability.requireTypedConfirmation ||
    typedConfirmation.trim() === (availability.confirmationPhrase ?? "I AGREE");

  const canSubmit =
    likenessConsent &&
    recordingConsent &&
    distributionConsent &&
    confirmationOk &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      const result = await submitCastForm({
        userId,
        clerkId,
        ipAddress: "CLIENT_IP", // In production, get from server
        userAgent: navigator.userAgent,
        consents: {
          likenessConsent,
          recordingConsent,
          distributionConsent,
        },
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
    } catch (error: any) {
      toast.error(error.message || "Failed to submit release");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto gaming-card">
        <DialogHeader>
          <DialogTitle className="font-gaming text-foreground">
            Podcast Release Form
          </DialogTitle>
          <DialogDescription className="font-cyber">
            Version {availability.releaseVersion} — please read the full release
            before signing.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable legal text */}
        <ScrollArea
          className="h-[300px] w-full rounded-md border border-border p-4 bg-muted/30"
          onScrollCapture={handleScroll}
        >
          <pre className="whitespace-pre-wrap font-cyber text-xs sm:text-sm leading-relaxed text-foreground">
            {availability.releaseText}
          </pre>
        </ScrollArea>

        {!scrolled && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-cyber">
              <Eye className="h-4 w-4" />
              <span>Please scroll to the bottom to continue</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setScrolled(true)}
              className="font-cyber text-xs"
            >
              Mark as Read
            </Button>
          </div>
        )}

        {/* Required consents */}
        <div className="space-y-4 p-4 bg-muted/20 rounded-lg border border-border">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="likeness"
              checked={likenessConsent}
              onCheckedChange={(checked) => {
                logStarted();
                setLikenessConsent(checked as boolean);
              }}
              disabled={!scrolled}
              className="mt-1"
            />
            <label htmlFor="likeness" className="text-sm font-cyber leading-relaxed cursor-pointer">
              <strong className="text-foreground">
                I authorize use of my name, voice, image, and likeness
              </strong>{" "}
              <span className="text-destructive">*</span>
            </label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="recording"
              checked={recordingConsent}
              onCheckedChange={(checked) => {
                logStarted();
                setRecordingConsent(checked as boolean);
              }}
              disabled={!scrolled}
              className="mt-1"
            />
            <label htmlFor="recording" className="text-sm font-cyber leading-relaxed cursor-pointer">
              <strong className="text-foreground">
                I consent to being recorded, filmed, and photographed
              </strong>{" "}
              <span className="text-destructive">*</span>
            </label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="distribution"
              checked={distributionConsent}
              onCheckedChange={(checked) => {
                logStarted();
                setDistributionConsent(checked as boolean);
              }}
              disabled={!scrolled}
              className="mt-1"
            />
            <label htmlFor="distribution" className="text-sm font-cyber leading-relaxed cursor-pointer">
              <strong className="text-foreground">
                I agree to the editing, distribution, and promotional use described above
              </strong>{" "}
              <span className="text-destructive">*</span>
            </label>
          </div>

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
                disabled={!scrolled}
                placeholder={availability.confirmationPhrase ?? "I AGREE"}
                className="font-mono"
              />
            </div>
          )}
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription className="font-cyber text-xs leading-relaxed">
            <strong>Legal Notice:</strong> Submitting this form electronically
            signs the release above and creates a legally binding agreement.
            You will receive a copy by email for your records.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row gap-3">
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
