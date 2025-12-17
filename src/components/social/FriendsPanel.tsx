import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Search,
  UserPlus,
  MessageCircle,
  X,
  Check,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { UserProfileModal } from "@/components/profile/UserProfileModal";
import { motion, AnimatePresence } from "framer-motion";

interface FriendsPanelProps {
  currentUserId: Id<"users">;
  onStartChat: (roomId: Id<"chatRooms">) => void;
}

export const FriendsPanel = ({ currentUserId, onStartChat }: FriendsPanelProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);

  const searchResults = useQuery(
    api.users.searchUsers,
    searchTerm.trim() ? { searchTerm } : "skip"
  );
  const friends = useQuery(api.friends.getFriends, { userId: currentUserId });
  const friendRequests = useQuery(api.friends.getPendingFriendRequests, {
    userId: currentUserId,
  });

  const sendFriendRequest = useMutation(api.friends.sendFriendRequest);
  const acceptFriendRequest = useMutation(api.friends.acceptFriendRequest);
  const rejectFriendRequest = useMutation(api.friends.rejectFriendRequest);
  const getOrCreateDirectChat = useMutation(api.chat.getOrCreateDirectChat);

  const handleSendFriendRequest = async (receiverId: Id<"users">) => {
    try {
      await sendFriendRequest({
        senderId: currentUserId,
        receiverId,
      });
      toast.success("Friend request sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send friend request");
    }
  };

  const handleAcceptRequest = async (requestId: Id<"friendRequests">) => {
    try {
      await acceptFriendRequest({ requestId });
      toast.success("Friend request accepted!");
    } catch (error: any) {
      toast.error(error.message || "Failed to accept request");
    }
  };

  const handleRejectRequest = async (requestId: Id<"friendRequests">) => {
    try {
      await rejectFriendRequest({ requestId });
      toast.success("Friend request rejected");
    } catch (error: any) {
      toast.error(error.message || "Failed to reject request");
    }
  };

  const handleStartChat = async (friendId: Id<"users">) => {
    try {
      const roomId = await getOrCreateDirectChat({
        user1Id: currentUserId,
        user2Id: friendId,
      });
      onStartChat(roomId);
    } catch (error: any) {
      toast.error(error.message || "Failed to start chat");
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="gaming-card p-3 sm:p-4 h-fit lg:sticky lg:top-24 !transform-none"
      >
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <h2 className="text-lg sm:text-xl font-gaming text-gradient">FRIENDS</h2>
        </div>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-3 sm:mb-4">
            <TabsTrigger value="friends" className="font-cyber text-[10px] sm:text-xs">
              Friends
              {friends && friends.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {friends.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="font-cyber text-[10px] sm:text-xs">
              Requests
              {friendRequests && friendRequests.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {friendRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="search" className="font-cyber text-[10px] sm:text-xs">
              Search
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-2 max-h-[60vh] sm:max-h-96 overflow-y-auto">
            {friends && friends.length > 0 ? (
              friends.map((friend) => (
                <div
                  key={friend._id}
                  className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  <button
                    onClick={() => setSelectedUserId(friend._id)}
                    className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0"
                  >
                    <Avatar className="w-7 h-7 sm:w-8 sm:h-8 border border-primary/30 flex-shrink-0">
                      <AvatarFallback className="bg-primary/20 text-primary font-gaming text-[10px] sm:text-xs">
                        {friend.avatar || "🎮"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-1">
                        <span className="font-cyber text-xs sm:text-sm text-foreground truncate">
                          {friend.username}
                        </span>
                        {friend.phreshTeam && (
                          <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        Lvl {friend.level}
                      </span>
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleStartChat(friend._id)}
                    className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
                  >
                    <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-6 sm:py-8 text-muted-foreground font-cyber text-xs sm:text-sm">
                No friends yet
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-2 max-h-96 overflow-y-auto">
            {friendRequests && friendRequests.length > 0 ? (
              friendRequests.map((request) => (
                <div
                  key={request._id}
                  className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20"
                >
                  <Avatar className="w-8 h-8 border border-primary/30">
                    <AvatarFallback className="bg-primary/20 text-primary font-gaming text-xs">
                      {request.sender?.avatar || "🎮"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-cyber text-sm text-foreground truncate">
                      {request.sender?.username || "Unknown"}
                    </div>
                    <div className="flex gap-1 mt-1">
                      <Button
                        variant="neon"
                        size="sm"
                        onClick={() => handleAcceptRequest(request._id)}
                        className="h-6 px-2 text-xs"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Accept
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRejectRequest(request._id)}
                        className="h-6 px-2 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground font-cyber text-sm">
                No pending requests
              </div>
            )}
          </TabsContent>

          <TabsContent value="search" className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 font-cyber"
              />
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {searchResults && searchResults.length > 0 ? (
                searchResults
                  .filter((user) => user._id !== currentUserId)
                  .map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      <button
                        onClick={() => setSelectedUserId(user._id)}
                        className="flex items-center gap-2 flex-1 min-w-0"
                      >
                        <Avatar className="w-8 h-8 border border-primary/30">
                          <AvatarFallback className="bg-primary/20 text-primary font-gaming text-xs">
                            {user.avatar || "🎮"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-1">
                            <span className="font-cyber text-sm text-foreground truncate">
                              {user.username}
                            </span>
                            {user.phreshTeam && (
                              <Sparkles className="h-3 w-3 text-primary" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Lvl {user.level}
                          </span>
                        </div>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSendFriendRequest(user._id)}
                        className="h-8 w-8"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
              ) : searchTerm.trim() ? (
                <div className="text-center py-8 text-muted-foreground font-cyber text-sm">
                  No users found
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground font-cyber text-sm">
                  Search for users
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      <UserProfileModal
        userId={selectedUserId}
        open={!!selectedUserId}
        onOpenChange={(open) => !open && setSelectedUserId(null)}
        onSendFriendRequest={handleSendFriendRequest}
        onStartChat={handleStartChat}
      />
    </>
  );
};
