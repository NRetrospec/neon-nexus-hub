import { useEffect, useState, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus, MessageCircle, Trophy, Star, Volume2, Play, Pause } from "lucide-react";

interface UserProfileModalProps {
  userId: Id<"users"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendFriendRequest?: (userId: Id<"users">) => void;
  onStartChat?: (userId: Id<"users">) => void;
}

export const UserProfileModal = ({
  userId,
  open,
  onOpenChange,
  onSendFriendRequest,
  onStartChat,
}: UserProfileModalProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const user = useQuery(
    api.users.getUserById,
    userId ? { userId } : "skip"
  );

  const songs = useQuery(
    api.profile.getProfileSongs,
    userId ? { userId } : "skip"
  );

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!user) return null;

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

  const profileContent = (
    <>

        <div className="space-y-4 sm:space-y-6">
          {/* User Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-primary/30">
              <AvatarFallback className="bg-primary/20 text-primary font-gaming text-xl sm:text-2xl">
                {user.avatar || "🎮"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left w-full">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <h2 className="text-xl sm:text-2xl font-gaming font-bold text-foreground">
                  {user.username}
                </h2>
                <Badge variant="outline" className="text-xs sm:text-sm">
                  Lvl {user.level}
                </Badge>
                {user.phreshTeam && (
                  <Badge className="text-xs bg-primary/20 text-primary border-primary/30">
                    <Star className="mr-1 h-3 w-3" />
                    PhreshTeam
                  </Badge>
                )}
              </div>
              {user.status && (
                <p className="text-muted-foreground font-cyber mb-3 text-sm">
                  {user.status}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-2">
                {onSendFriendRequest && (
                  <Button
                    variant="neon"
                    size="sm"
                    onClick={() => onSendFriendRequest(user._id)}
                    className="font-gaming w-full sm:w-auto"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Friend
                  </Button>
                )}
                {onStartChat && (
                  <Button
                    variant="cyber"
                    size="sm"
                    onClick={() => onStartChat(user._id)}
                    className="font-gaming w-full sm:w-auto"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Message
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="gaming-card p-4 !transform-none">
              <h3 className="font-gaming text-sm text-muted-foreground mb-2">
                BIO
              </h3>
              <p className="text-foreground font-cyber">{user.bio}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="gaming-card p-2 sm:p-4 text-center !transform-none">
              <div className="text-lg sm:text-2xl font-gaming text-gradient mb-1">
                {user.xp}
              </div>
              <div className="text-[10px] sm:text-xs font-cyber text-muted-foreground">
                Total XP
              </div>
            </div>
            <div className="gaming-card p-2 sm:p-4 text-center !transform-none">
              <div className="text-lg sm:text-2xl font-gaming text-gradient mb-1">
                {user.points}
              </div>
              <div className="text-[10px] sm:text-xs font-cyber text-muted-foreground">
                Points
              </div>
            </div>
            <div className="gaming-card p-2 sm:p-4 text-center !transform-none">
              <div className="text-lg sm:text-2xl font-gaming text-gradient mb-1">
                {user.completedQuests?.length || 0}
              </div>
              <div className="text-[10px] sm:text-xs font-cyber text-muted-foreground">
                Quests
              </div>
            </div>
          </div>

          {/* Music/Songs */}
          {songs && songs.length > 0 && (
            <div className="gaming-card p-4 !transform-none">
              <h3 className="font-gaming text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                MUSIC ({songs.length}/2)
              </h3>
              <div className="space-y-2">
                {songs.map((song, index) => (
                  <div
                    key={song.storageId}
                    className="flex items-center gap-3 p-2 rounded-lg bg-background/50 hover:bg-background/70 transition-colors"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => song.url && togglePlay(song.storageId, song.url)}
                      className="flex-shrink-0 h-8 w-8"
                    >
                      {currentlyPlaying === song.storageId ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className="font-cyber text-xs sm:text-sm text-foreground truncate">
                        Song {index + 1}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Badges */}
          {user.badges && user.badges.length > 0 && (
            <div className="gaming-card p-4 !transform-none">
              <h3 className="font-gaming text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                BADGES
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.badges.map((badge, index) => (
                  <Badge key={index} variant="outline" className="text-lg px-3 py-1">
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          {user.socialLinks && user.socialLinks.length > 0 && (
            <div className="gaming-card p-4 !transform-none">
              <h3 className="font-gaming text-sm text-muted-foreground mb-3">
                SOCIAL LINKS
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.socialLinks.map((link, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(link.url, "_blank")}
                    className="font-cyber"
                  >
                    {link.icon} {link.platform}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hidden Audio Element for playback */}
        <audio
          ref={audioRef}
          onEnded={() => setCurrentlyPlaying(null)}
          className="hidden"
        />
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-[95vw] sm:w-[90vw] p-4 sm:p-6 overflow-y-auto gaming-card"
        >
          <SheetHeader className="pb-4">
            <SheetTitle className="text-2xl font-gaming text-gradient">
              PLAYER PROFILE
            </SheetTitle>
          </SheetHeader>
          {profileContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[80vw] lg:max-w-2xl max-h-[90vh] overflow-y-auto gaming-card hover:!translate-y-[-50%] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-gaming text-gradient">
            PLAYER PROFILE
          </DialogTitle>
        </DialogHeader>
        {profileContent}
      </DialogContent>
    </Dialog>
  );
};
