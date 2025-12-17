import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  Edit3,
  Save,
  X,
  Star,
  Zap,
  Trophy,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { ThemePicker } from "./ThemePicker";
import { MusicUploader } from "./MusicUploader";
import { SocialLinksEditor } from "./SocialLinksEditor";

interface ProfileContentProps {
  onClose?: () => void;
}

export const ProfileContent = ({ onClose }: ProfileContentProps) => {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState("");
  const [socialLinks, setSocialLinks] = useState<any[]>([]);

  const dbUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const userStats = useQuery(
    api.users.getUserStats,
    dbUser ? { userId: dbUser._id } : "skip"
  );

  const updateProfile = useMutation(api.profile.updateProfileInfo);

  // Load initial data from dbUser
  useEffect(() => {
    if (dbUser) {
      setBio(dbUser.bio || "");
      setStatus(dbUser.status || "");
      setSocialLinks(dbUser.socialLinks || []);
    }
  }, [dbUser]);

  const handleSave = async () => {
    if (!dbUser) return;

    try {
      await updateProfile({
        userId: dbUser._id,
        bio,
        status,
        socialLinks,
      });

      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    }
  };

  const handleCancel = () => {
    // Reset to original values
    if (dbUser) {
      setBio(dbUser.bio || "");
      setStatus(dbUser.status || "");
      setSocialLinks(dbUser.socialLinks || []);
    }
    setIsEditing(false);
  };

  if (!dbUser || !userStats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-muted-foreground font-cyber">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start gap-4 justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-primary/30">
            <AvatarFallback className="bg-primary/20 text-primary font-gaming text-2xl sm:text-3xl">
              {dbUser.avatar || "🎮"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl sm:text-3xl font-gaming font-bold text-gradient">
              {dbUser.username}
            </h2>
            {status && !isEditing && (
              <p className="text-sm text-muted-foreground font-cyber italic">
                "{status}"
              </p>
            )}
            {dbUser.phreshTeam && (
              <Badge className="mt-1 bg-primary/20 text-primary border-primary/30">
                <Star className="mr-1 h-3 w-3" />
                PhreshTeam
              </Badge>
            )}
          </div>
        </div>

        {/* Edit/Save/Cancel Buttons */}
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="font-cyber"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                variant="cyber"
                size="sm"
                onClick={handleSave}
                className="font-gaming"
              >
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </>
          ) : (
            <Button
              variant="neon"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="font-gaming"
            >
              <Edit3 className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="gaming-card p-3 sm:p-4 text-center">
          <Star className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400 mx-auto mb-1 sm:mb-2" />
          <div className="text-lg sm:text-2xl font-gaming font-bold text-yellow-400">
            {userStats.level}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground font-cyber">Level</div>
        </div>
        <div className="gaming-card p-3 sm:p-4 text-center">
          <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-1 sm:mb-2" />
          <div className="text-lg sm:text-2xl font-gaming font-bold text-primary">
            {userStats.xp.toLocaleString()}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground font-cyber">Total XP</div>
        </div>
        <div className="gaming-card p-3 sm:p-4 text-center">
          <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-accent mx-auto mb-1 sm:mb-2" />
          <div className="text-lg sm:text-2xl font-gaming font-bold text-accent">
            {userStats.points.toLocaleString()}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground font-cyber">Points</div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="gaming-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-cyber text-muted-foreground">
            Level Progress
          </span>
          <span className="text-sm font-gaming text-foreground">
            {(userStats.xp % 1000)} / 1000 XP
          </span>
        </div>
        <Progress value={(userStats.xp % 1000) / 10} className="h-2" />
      </div>

      {/* Bio Section */}
      <div className="gaming-card p-6 space-y-3">
        <Label className="font-gaming text-lg">Bio</Label>
        {isEditing ? (
          <>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              maxLength={500}
              className="min-h-[100px] font-cyber resize-none"
            />
            <p className="text-xs text-muted-foreground font-cyber text-right">
              {bio.length}/500 characters
            </p>
          </>
        ) : (
          <p className="font-cyber text-muted-foreground whitespace-pre-wrap">
            {bio || "No bio yet. Click Edit Profile to add one!"}
          </p>
        )}
      </div>

      {/* Status Section (edit mode only) */}
      {isEditing && (
        <div className="gaming-card p-6 space-y-3">
          <Label className="font-gaming text-lg">Status</Label>
          <Input
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="What's your current vibe?"
            maxLength={100}
            className="font-cyber"
          />
          <p className="text-xs text-muted-foreground font-cyber text-right">
            {status.length}/100 characters
          </p>
        </div>
      )}

      {/* Theme Picker Section */}
      <div className="gaming-card p-6">
        <ThemePicker />
      </div>

      {/* Music Uploader Section */}
      <div className="gaming-card p-6">
        <MusicUploader userId={dbUser._id} isEditing={isEditing} />
      </div>

      {/* Social Links Section */}
      <div className="gaming-card p-6">
        <SocialLinksEditor
          links={socialLinks}
          onChange={setSocialLinks}
          isEditing={isEditing}
        />
      </div>

      {/* Badges Section */}
      <div className="gaming-card p-6">
        <h3 className="text-lg font-gaming font-semibold text-foreground mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Badges ({dbUser.badges?.length || 0})
        </h3>
        {dbUser.badges && dbUser.badges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {dbUser.badges.map((badge, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Badge className="text-lg px-3 py-2 badge-glow">
                  {badge}
                </Badge>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground font-cyber text-sm text-center py-4">
            No badges earned yet. Complete quests to earn badges!
          </p>
        )}
      </div>
    </div>
  );
};
