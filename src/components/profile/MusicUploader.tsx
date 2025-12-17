import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, Play, Pause, Trash2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Id } from "../../../convex/_generated/dataModel";

interface MusicUploaderProps {
  userId: Id<"users">;
  isEditing: boolean;
}

export const MusicUploader = ({ userId, isEditing }: MusicUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const songs = useQuery(api.profile.getProfileSongs, { userId });
  const uploadSong = useMutation(api.profile.uploadSong);
  const deleteSong = useMutation(api.profile.deleteSong);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // CLIENT-SIDE VALIDATION
    if (!['audio/mpeg', 'audio/wav'].includes(file.type)) {
      toast.error("Only MP3 and WAV files are supported");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();
      setUploadProgress(50);

      // Save to user profile
      await uploadSong({ userId, storageId });
      setUploadProgress(100);

      toast.success("Song uploaded successfully!");

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upload song");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (storageId: Id<"_storage">) => {
    try {
      await deleteSong({ userId, storageId });
      toast.success("Song deleted");
      if (currentlyPlaying === storageId) {
        setCurrentlyPlaying(null);
        audioRef.current?.pause();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete song");
    }
  };

  const togglePlay = (storageId: string, url: string) => {
    if (currentlyPlaying === storageId) {
      audioRef.current?.pause();
      setCurrentlyPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setCurrentlyPlaying(storageId);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-gaming font-semibold text-foreground flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-primary" />
          Profile Music ({songs?.length || 0}/2)
        </h3>
      </div>

      {/* Song List */}
      <div className="space-y-3">
        {songs?.map((song, index) => (
          <motion.div
            key={song.storageId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="gaming-card p-4 flex items-center gap-3"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => togglePlay(song.storageId, song.url!)}
              className="flex-shrink-0"
            >
              {currentlyPlaying === song.storageId ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>

            <div className="flex-1 min-w-0">
              <p className="font-cyber text-sm text-foreground truncate">
                Song {index + 1}
              </p>
            </div>

            {isEditing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(song.storageId)}
                className="text-destructive hover:text-destructive/80"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </motion.div>
        ))}

        {(!songs || songs.length === 0) && (
          <div className="text-center py-8 text-muted-foreground font-cyber text-sm">
            No songs uploaded yet
          </div>
        )}
      </div>

      {/* Upload Button - only show in edit mode and when under limit */}
      {isEditing && (!songs || songs.length < 2) && (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mp3,audio/wav"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="cyber"
            className="w-full font-gaming"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Song"}
          </Button>

          {uploading && (
            <Progress value={uploadProgress} className="h-2" />
          )}

          <p className="text-xs text-muted-foreground font-cyber text-center">
            MP3 or WAV, max 10MB
          </p>
        </div>
      )}

      {/* Hidden Audio Element for playback */}
      <audio
        ref={audioRef}
        onEnded={() => setCurrentlyPlaying(null)}
        className="hidden"
      />
    </div>
  );
};
