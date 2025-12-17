import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Heart,
  MessageCircle,
  Send,
  Image as ImageIcon,
  Trash2,
  Lock,
  Users,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { FriendsPanel } from "@/components/social/FriendsPanel";
import { ChatBox } from "@/components/social/ChatBox";
import { UserProfileModal } from "@/components/profile/UserProfileModal";
import { MobileFriendsDrawer } from "@/components/social/MobileFriendsDrawer";

type Channel = "General" | "PhreshTeam";

const Social = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [activeChannel, setActiveChannel] = useState<Channel>("General");
  const [postContent, setPostContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showComments, setShowComments] = useState<Id<"socialPosts"> | null>(null);
  const [commentContent, setCommentContent] = useState("");
  const [activeChatRoom, setActiveChatRoom] = useState<Id<"chatRooms"> | null>(null);
  const [viewingUserId, setViewingUserId] = useState<Id<"users"> | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const userCreationAttempted = useRef(false);

  const dbUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const posts = useQuery(api.social.getPostsByChannel, { channel: activeChannel });
  const hasPhreshTeamAccess = useQuery(
    api.social.hasPhreshTeamAccess,
    dbUser ? { userId: dbUser._id } : "skip"
  );

  const createUser = useMutation(api.users.createUser);

  // Create user in database if not exists
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

  const createPost = useMutation(api.social.createPost);
  const toggleLike = useMutation(api.social.toggleLike);
  const addComment = useMutation(api.social.addComment);
  const deletePost = useMutation(api.social.deletePost);
  const sendFriendRequest = useMutation(api.friends.sendFriendRequest);
  const getOrCreateDirectChat = useMutation(api.chat.getOrCreateDirectChat);

  const handleCreatePost = async () => {
    if (!dbUser || !postContent.trim()) return;

    try {
      await createPost({
        userId: dbUser._id,
        content: postContent,
        channel: activeChannel,
        mediaUrl: imageUrl || undefined,
      });
      setPostContent("");
      setImageUrl("");
      toast.success("Post created successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to create post");
    }
  };

  const handleToggleLike = async (postId: Id<"socialPosts">) => {
    if (!dbUser) return;

    try {
      const result = await toggleLike({ userId: dbUser._id, postId });
      toast.success(result.liked ? "Post liked!" : "Post unliked!");
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle like");
    }
  };

  const handleAddComment = async (postId: Id<"socialPosts">) => {
    if (!dbUser || !commentContent.trim()) return;

    try {
      await addComment({
        userId: dbUser._id,
        postId,
        content: commentContent,
      });
      setCommentContent("");
      toast.success("Comment added!");
    } catch (error: any) {
      toast.error(error.message || "Failed to add comment");
    }
  };

  const handleDeletePost = async (postId: Id<"socialPosts">) => {
    if (!dbUser) return;

    try {
      await deletePost({ userId: dbUser._id, postId });
      toast.success("Post deleted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete post");
    }
  };

  const handleSendFriendRequest = async (receiverId: Id<"users">) => {
    if (!dbUser) return;

    try {
      await sendFriendRequest({
        senderId: dbUser._id,
        receiverId,
      });
      toast.success("Friend request sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send friend request");
    }
  };

  const handleStartChat = async (friendId: Id<"users">) => {
    if (!dbUser) return;

    try {
      const roomId = await getOrCreateDirectChat({
        user1Id: dbUser._id,
        user2Id: friendId,
      });
      setActiveChatRoom(roomId);
      setViewingUserId(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to start chat");
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="fixed inset-0 animated-gradient opacity-20 pointer-events-none" />
        <div className="fixed inset-0 cyber-grid opacity-10 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 max-w-7xl">
          <div className="flex gap-6">
            {/* Main Content */}
            <div className="flex-1 max-w-4xl">
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

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-gaming font-bold mb-2">
                  <span className="text-foreground">SOCIAL </span>
                  <span className="text-gradient">HUB</span>
                </h1>
                <p className="text-muted-foreground font-cyber text-sm sm:text-base lg:text-lg">
                  Connect with the gaming community
                </p>
              </div>

              {/* Mobile Friends/Chat Toggle */}
              <Button
                variant="neon"
                size="sm"
                onClick={() => setMobileDrawerOpen(true)}
                className="lg:hidden font-gaming"
              >
                <Users className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          <Tabs
            defaultValue="General"
            value={activeChannel}
            onValueChange={(value) => setActiveChannel(value as Channel)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 md:mb-8 gaming-card">
              <TabsTrigger value="General" className="font-gaming">
                <Users className="mr-2 h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger
                value="PhreshTeam"
                className="font-gaming"
              >
                {hasPhreshTeamAccess ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    PhreshTeam
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    PhreshTeam
                  </>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="General" className="focus:outline-none">
              {/* Create Post Section */}
              <div className="gaming-card p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
                <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
                  <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-primary/30">
                    <AvatarFallback className="bg-primary/20 text-primary font-gaming text-xs sm:text-base">
                      {dbUser?.avatar || "🎮"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2 sm:space-y-3">
                    <Textarea
                      placeholder={`What's on your mind, ${dbUser?.username || "gamer"}?`}
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      className="min-h-[80px] sm:min-h-[100px] font-cyber resize-none text-sm sm:text-base"
                    />
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                      <Input
                        placeholder="Image URL (optional)"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="flex-1 font-cyber text-sm sm:text-base"
                      />
                      <Button
                        onClick={handleCreatePost}
                        disabled={!postContent.trim()}
                        variant="neon"
                        className="font-gaming w-full sm:w-auto"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Posts Feed */}
              <div className="space-y-4 sm:space-y-6">
                {posts?.map((post) => (
                  <div key={post._id} className="gaming-card p-3 sm:p-4 md:p-6">
                    {/* Post Header */}
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <button
                        onClick={() => post.userId && post.userId !== dbUser?._id && setViewingUserId(post.userId)}
                        className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
                        disabled={post.userId === dbUser?._id}
                      >
                        <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-primary/30">
                          <AvatarFallback className="bg-primary/20 text-primary font-gaming text-xs sm:text-base">
                            {post.user?.avatar || "🎮"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <span className="font-gaming font-semibold text-foreground text-sm sm:text-base">
                              {post.user?.username || "Unknown"}
                            </span>
                            <Badge variant="outline" className="text-[10px] sm:text-xs">
                              Lvl {post.user?.level || 1}
                            </Badge>
                            {activeChannel === "PhreshTeam" && (
                              <Badge className="text-xs bg-primary/20 text-primary border-primary/30">
                                <Sparkles className="mr-1 h-3 w-3" />
                                PhreshTeam
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] sm:text-xs text-muted-foreground font-cyber">
                            {formatDate(post.createdAt)}
                          </span>
                        </div>
                      </button>
                      {post.userId === dbUser?._id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePost(post._id)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Post Content */}
                    <p className="text-foreground font-cyber mb-3 sm:mb-4 whitespace-pre-wrap text-sm sm:text-base">
                      {post.content}
                    </p>

                    {/* Post Image */}
                    {post.mediaUrl && (
                      <div className="mb-4 rounded-lg overflow-hidden border border-border">
                        <img
                          src={post.mediaUrl}
                          alt="Post media"
                          className="w-full h-auto object-cover max-h-96"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex items-center gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleLike(post._id)}
                        className="font-cyber gap-1 sm:gap-2 text-xs sm:text-sm"
                      >
                        <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                        {post.likes}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setShowComments(showComments === post._id ? null : post._id)
                        }
                        className="font-cyber gap-1 sm:gap-2 text-xs sm:text-sm"
                      >
                        <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        {post.commentCount}
                      </Button>
                    </div>

                    {/* Comments Section */}
                    {showComments === post._id && (
                      <CommentsSection
                        postId={post._id}
                        commentContent={commentContent}
                        setCommentContent={setCommentContent}
                        onAddComment={() => handleAddComment(post._id)}
                      />
                    )}
                  </div>
                ))}

                {posts && posts.length === 0 && (
                  <div className="text-center py-16 gaming-card">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-xl font-gaming text-foreground mb-2">
                      No posts yet
                    </h3>
                    <p className="text-muted-foreground font-cyber">
                      Be the first to share something!
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="PhreshTeam" className="focus:outline-none">
              {/* Create Post Section - Only for PhreshTeam members */}
              {hasPhreshTeamAccess ? (
                <div className="gaming-card p-6 mb-6">
                  <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
                    <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-primary/30">
                      <AvatarFallback className="bg-primary/20 text-primary font-gaming text-xs sm:text-base">
                        {dbUser?.avatar || "🎮"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2 sm:space-y-3">
                      <Textarea
                        placeholder={`What's on your mind, ${dbUser?.username || "gamer"}?`}
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        className="min-h-[80px] sm:min-h-[100px] font-cyber resize-none text-sm sm:text-base"
                      />
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        <Input
                          placeholder="Image URL (optional)"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          className="flex-1 font-cyber text-sm sm:text-base"
                        />
                        <Button
                          onClick={handleCreatePost}
                          disabled={!postContent.trim()}
                          variant="neon"
                          className="font-gaming w-full sm:w-auto"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Post
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="gaming-card p-4 mb-6 border-2 border-primary/30">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Lock className="h-5 w-5" />
                    <p className="font-cyber text-sm">
                      Only PhreshTeam members can post in this channel. You can view all messages below.
                    </p>
                  </div>
                </div>
              )}

              {/* Posts Feed */}
              <div className="space-y-4 sm:space-y-6">
                {posts?.map((post) => (
                  <div key={post._id} className="gaming-card p-3 sm:p-4 md:p-6">
                    {/* Post Header */}
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <button
                        onClick={() => post.userId && post.userId !== dbUser?._id && setViewingUserId(post.userId)}
                        className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
                        disabled={post.userId === dbUser?._id}
                      >
                        <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-primary/30">
                          <AvatarFallback className="bg-primary/20 text-primary font-gaming text-xs sm:text-base">
                            {post.user?.avatar || "🎮"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <span className="font-gaming font-semibold text-foreground text-sm sm:text-base">
                              {post.user?.username || "Unknown"}
                            </span>
                            <Badge variant="outline" className="text-[10px] sm:text-xs">
                              Lvl {post.user?.level || 1}
                            </Badge>
                            {activeChannel === "PhreshTeam" && (
                              <Badge className="text-xs bg-primary/20 text-primary border-primary/30">
                                <Sparkles className="mr-1 h-3 w-3" />
                                PhreshTeam
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] sm:text-xs text-muted-foreground font-cyber">
                            {formatDate(post.createdAt)}
                          </span>
                        </div>
                      </button>
                      {post.userId === dbUser?._id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePost(post._id)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Post Content */}
                    <p className="text-foreground font-cyber mb-3 sm:mb-4 whitespace-pre-wrap text-sm sm:text-base">
                      {post.content}
                    </p>

                    {/* Post Image */}
                    {post.mediaUrl && (
                      <div className="mb-4 rounded-lg overflow-hidden border border-border">
                        <img
                          src={post.mediaUrl}
                          alt="Post media"
                          className="w-full h-auto object-cover max-h-96"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex items-center gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleLike(post._id)}
                        className="font-cyber gap-1 sm:gap-2 text-xs sm:text-sm"
                      >
                        <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                        {post.likes}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setShowComments(showComments === post._id ? null : post._id)
                        }
                        className="font-cyber gap-1 sm:gap-2 text-xs sm:text-sm"
                      >
                        <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        {post.commentCount}
                      </Button>
                    </div>

                    {/* Comments Section */}
                    {showComments === post._id && (
                      <CommentsSection
                        postId={post._id}
                        commentContent={commentContent}
                        setCommentContent={setCommentContent}
                        onAddComment={() => handleAddComment(post._id)}
                      />
                    )}
                  </div>
                ))}

                {posts && posts.length === 0 && (
                  <div className="text-center py-16 gaming-card">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-xl font-gaming text-foreground mb-2">
                      No posts yet
                    </h3>
                    <p className="text-muted-foreground font-cyber">
                      Be the first to share something!
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
            </div>

            {/* Friends/Chat Aside */}
            <aside className="w-80 hidden lg:block">
              {activeChatRoom ? (
                <ChatBox
                  roomId={activeChatRoom}
                  currentUserId={dbUser?._id!}
                  onClose={() => setActiveChatRoom(null)}
                />
              ) : (
                dbUser && (
                  <FriendsPanel
                    currentUserId={dbUser._id}
                    onStartChat={(roomId) => setActiveChatRoom(roomId)}
                  />
                )
              )}
            </aside>
          </div>
        </div>
      </main>

      <UserProfileModal
        userId={viewingUserId}
        open={!!viewingUserId}
        onOpenChange={(open) => !open && setViewingUserId(null)}
        onSendFriendRequest={handleSendFriendRequest}
        onStartChat={handleStartChat}
      />

      {/* Mobile Friends Drawer */}
      {dbUser && (
        <MobileFriendsDrawer
          currentUserId={dbUser._id}
          open={mobileDrawerOpen}
          onOpenChange={setMobileDrawerOpen}
        />
      )}

      <Footer />
    </div>
  );
};

// Comments Section Component
const CommentsSection = ({
  postId,
  commentContent,
  setCommentContent,
  onAddComment,
}: {
  postId: Id<"socialPosts">;
  commentContent: string;
  setCommentContent: (content: string) => void;
  onAddComment: () => void;
}) => {
  const comments = useQuery(api.social.getComments, { postId });

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-4 pt-4 border-t border-border space-y-4"
    >
      {/* Add Comment */}
      <div className="flex gap-2">
        <Input
          placeholder="Write a comment..."
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onAddComment();
            }
          }}
          className="flex-1 font-cyber"
        />
        <Button
          onClick={onAddComment}
          disabled={!commentContent.trim()}
          variant="cyber"
          size="sm"
          className="font-gaming"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Comments List */}
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

export default Social;
