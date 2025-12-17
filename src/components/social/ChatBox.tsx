import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Send, Image as ImageIcon, Users, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ChatBoxProps {
  roomId: Id<"chatRooms"> | null;
  currentUserId: Id<"users">;
  onClose: () => void;
}

export const ChatBox = ({ roomId, currentUserId, onClose }: ChatBoxProps) => {
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatRooms = useQuery(api.chat.getUserChatRooms, { userId: currentUserId });
  const currentRoom = chatRooms?.find((room) => room._id === roomId);
  const messages = useQuery(
    api.chat.getChatMessages,
    roomId ? { roomId } : "skip"
  );
  const friends = useQuery(api.friends.getFriends, { userId: currentUserId });

  const sendMessage = useMutation(api.chat.sendMessage);
  const markMessagesAsRead = useMutation(api.chat.markMessagesAsRead);
  const convertToGroup = useMutation(api.chat.convertToGroupAndAddParticipant);

  useEffect(() => {
    if (roomId) {
      markMessagesAsRead({ roomId, userId: currentUserId });
    }
  }, [roomId, messages?.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!roomId || (!message.trim() && !imageUrl.trim())) return;

    try {
      await sendMessage({
        roomId,
        senderId: currentUserId,
        content: message,
        mediaUrl: imageUrl || undefined,
      });
      setMessage("");
      setImageUrl("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    }
  };

  const handleAddUser = async (friendId: Id<"users">) => {
    if (!roomId) return;

    try {
      await convertToGroup({
        roomId,
        newParticipantId: friendId,
      });
      toast.success("User added to chat!");
      setShowAddUserDialog(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to add user");
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Filter out friends already in the chat
  const availableFriends = friends?.filter(
    (friend) => friend && !currentRoom?.participants.includes(friend._id)
  );

  if (!roomId || !currentRoom) return null;

  const chatTitle =
    currentRoom.type === "direct"
      ? currentRoom.otherUser?.username || "Unknown"
      : currentRoom.name || "Group Chat";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="gaming-card flex flex-col h-[70vh] sm:h-[600px] lg:sticky lg:top-24 !transform-none"
    >
      {/* Chat Header */}
      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 sm:h-8 sm:w-8">
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>

        {currentRoom.type === "direct" && currentRoom.otherUser ? (
          <>
            <Avatar className="w-7 h-7 sm:w-8 sm:h-8 border border-primary/30">
              <AvatarFallback className="bg-primary/20 text-primary font-gaming text-[10px] sm:text-xs">
                {currentRoom.otherUser.avatar || "🎮"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-gaming text-xs sm:text-sm text-foreground truncate">
                {chatTitle}
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">
                Lvl {currentRoom.otherUser.level}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAddUserDialog(true)}
              className="h-7 w-7 sm:h-8 sm:w-8"
              title="Add user to chat"
            >
              <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </>
        ) : (
          <>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-gaming text-xs sm:text-sm text-foreground truncate">
                {chatTitle}
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">
                {currentRoom.participants.length} members
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAddUserDialog(true)}
              className="h-7 w-7 sm:h-8 sm:w-8"
              title="Add user to group"
            >
              <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3">
        {messages && messages.length > 0 ? (
          messages.map((msg) => {
            const isOwn = msg.senderId === currentUserId;
            return (
              <div
                key={msg._id}
                className={`flex gap-1.5 sm:gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
              >
                {!isOwn && (
                  <Avatar className="w-6 h-6 sm:w-7 sm:h-7 border border-primary/30">
                    <AvatarFallback className="bg-primary/20 text-primary font-gaming text-[10px] sm:text-xs">
                      {msg.sender?.avatar || "🎮"}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`flex flex-col ${
                    isOwn ? "items-end" : "items-start"
                  } max-w-[80%] sm:max-w-[75%]`}
                >
                  {!isOwn && (
                    <span className="text-[10px] sm:text-xs font-cyber text-muted-foreground mb-0.5 sm:mb-1">
                      {msg.sender?.username}
                    </span>
                  )}
                  <div
                    className={`rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 ${
                      isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.mediaUrl && (
                      <img
                        src={msg.mediaUrl}
                        alt="Shared media"
                        className="max-w-full rounded mb-1.5 sm:mb-2 max-h-36 sm:max-h-48 object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    <p className="text-xs sm:text-sm font-cyber whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground font-cyber text-xs sm:text-sm">
            No messages yet. Start the conversation!
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 border-t border-border space-y-1.5 sm:space-y-2">
        {imageUrl && (
          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
            <ImageIcon className="h-3 w-3" />
            <span className="truncate flex-1">{imageUrl}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setImageUrl("")}
              className="h-5 px-2 text-[10px]"
            >
              Clear
            </Button>
          </div>
        )}
        <div className="flex gap-1.5 sm:gap-2">
          <Input
            placeholder={imageUrl ? "Add a caption..." : "Type a message..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 font-cyber text-sm sm:text-base"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const url = prompt("Enter image URL:");
              if (url) setImageUrl(url);
            }}
            className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10"
          >
            <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="neon"
            size="icon"
            onClick={handleSendMessage}
            disabled={!message.trim() && !imageUrl.trim()}
            className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10"
          >
            <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-gaming text-foreground">Add User to Chat</DialogTitle>
            <DialogDescription className="font-cyber">
              Select a friend to add to this conversation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {availableFriends && availableFriends.length > 0 ? (
              availableFriends.map((friend) => (
                <div
                  key={friend._id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleAddUser(friend._id)}
                >
                  <Avatar className="w-10 h-10 border border-primary/30">
                    <AvatarFallback className="bg-primary/20 text-primary font-gaming">
                      {friend.avatar || "🎮"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-gaming text-sm text-foreground truncate">
                      {friend.username}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Level {friend.level} • {friend.xp} XP
                    </div>
                  </div>
                  <Button variant="neon" size="sm" className="font-cyber">
                    Add
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground font-cyber text-sm">
                No friends available to add
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
