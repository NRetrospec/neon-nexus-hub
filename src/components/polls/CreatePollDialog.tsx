import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import CategoryScoreInputs, { POLL_CATEGORIES } from "./CategoryScoreInputs";
import LetterGradeBadge from "./LetterGradeBadge";

interface CreatePollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

/**
 * Calculate letter grade from total score
 */
function calculateGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export default function CreatePollDialog({
  open,
  onOpenChange,
  userId,
}: CreatePollDialogProps) {
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageStorageId, setImageStorageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category scores state
  const [scores, setScores] = useState<Record<string, number>>(
    POLL_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.key]: 0 }), {})
  );

  // Mutations
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createPoll = useMutation(api.polls.createPoll);

  // Calculate total score
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const letterGrade = calculateGrade(totalScore);

  // Handle score change
  const handleScoreChange = (key: string, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }));
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) return null;

    try {
      setUploading(true);
      setUploadProgress(10);

      // Get upload URL
      const uploadUrl = await generateUploadUrl();
      setUploadProgress(30);

      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      setUploadProgress(70);

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();
      setUploadProgress(100);
      setImageStorageId(storageId);

      toast.success("Image uploaded successfully");
      return storageId;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image. Please try again.");
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      toast.error("Please enter a poll title");
      return;
    }

    if (title.length > 100) {
      toast.error("Title must be 100 characters or less");
      return;
    }

    if (!selectedFile && !imageStorageId) {
      toast.error("Please select an image");
      return;
    }

    if (totalScore === 0) {
      toast.error("Please rate at least one category");
      return;
    }

    try {
      // Upload image if not already uploaded
      let storageId = imageStorageId;
      if (!storageId && selectedFile) {
        storageId = await handleUpload();
        if (!storageId) {
          return; // Upload failed
        }
      }

      // Create poll
      const result = await createPoll({
        userId: userId as any,
        title: title.trim(),
        imageStorageId: storageId as any,
        categoryGraphics: scores.categoryGraphics,
        categoryGameplay: scores.categoryGameplay,
        categoryFun: scores.categoryFun,
        categoryStory: scores.categoryStory,
        categorySound: scores.categorySound,
        categoryPerformance: scores.categoryPerformance,
        categoryInnovation: scores.categoryInnovation,
        categoryContent: scores.categoryContent,
        categoryUI: scores.categoryUI,
        categoryWorld: scores.categoryWorld,
      });

      toast.success("Poll created successfully!");

      // Reset form
      setTitle("");
      setSelectedFile(null);
      setPreviewUrl(null);
      setImageStorageId(null);
      setScores(
        POLL_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.key]: 0 }), {})
      );

      // Close dialog
      onOpenChange(false);
    } catch (error: any) {
      console.error("Create poll error:", error);
      toast.error(error.message || "Failed to create poll");
    }
  };

  // Handle remove image
  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageStorageId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-gaming text-primary">
            Create New Poll
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-sm font-cyber font-semibold">
              Poll Title *
            </label>
            <Input
              placeholder="Enter poll title (e.g., 'Cyberpunk 2077 Rating')"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="font-cyber"
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/100 characters
            </p>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-cyber font-semibold">
              Poll Image *
            </label>

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-primary transition-colors text-center"
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-foreground font-cyber">
                  Click to upload image
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, WEBP (max 5MB)
                </p>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {uploading && (
              <div className="space-y-1">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Category Scores */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-cyber font-semibold">
                Rate Categories (0-10) *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-cyber text-muted-foreground">
                  Total:
                </span>
                <LetterGradeBadge grade={letterGrade} score={totalScore} size="sm" />
              </div>
            </div>

            <CategoryScoreInputs
              scores={scores}
              onChange={handleScoreChange}
              disabled={uploading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              variant="neon"
              onClick={handleSubmit}
              disabled={uploading || !title || !selectedFile}
            >
              Create Poll
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
