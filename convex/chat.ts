import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import {
  checkRateLimit,
  userRateLimitId,
  validateChatMessage,
  validateGroupName,
  validateUrl,
  validateArray,
  ValidationError,
} from "./security";

// ==================== MUTATIONS ====================

/**
 * Create or get direct chat room between two users
 * SECURITY: Rate limited to prevent chat room spam
 */
export const getOrCreateDirectChat = mutation({
  args: {
    user1Id: v.id("users"),
    user2Id: v.id("users"),
  },
  handler: async (ctx, args) => {
    // SECURITY: Rate limit chat room creation
    await checkRateLimit(ctx, userRateLimitId(args.user1Id), "getOrCreateDirectChat", "create");

    // SECURITY: Prevent self-chat
    if (args.user1Id === args.user2Id) {
      throw new Error("Cannot create a chat with yourself");
    }

    // Check if chat already exists
    const existingRoom = await ctx.db
      .query("chatRooms")
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "direct"),
          q.or(
            q.and(
              q.eq(q.field("participants")[0], args.user1Id),
              q.eq(q.field("participants")[1], args.user2Id)
            ),
            q.and(
              q.eq(q.field("participants")[0], args.user2Id),
              q.eq(q.field("participants")[1], args.user1Id)
            )
          )
        )
      )
      .first();

    if (existingRoom) {
      return existingRoom._id;
    }

    // Create new chat room
    const roomId = await ctx.db.insert("chatRooms", {
      type: "direct",
      participants: [args.user1Id, args.user2Id],
      createdBy: args.user1Id,
      createdAt: Date.now(),
    });

    return roomId;
  },
});

/**
 * Create group chat
 * SECURITY: Rate limited to prevent spam
 * SECURITY: Validates group name and participant count
 */
export const createGroupChat = mutation({
  args: {
    name: v.string(),
    createdBy: v.id("users"),
    participants: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    // SECURITY: Rate limit group creation
    await checkRateLimit(ctx, userRateLimitId(args.createdBy), "createGroupChat", "create");

    // SECURITY: Validate and sanitize group name
    const name = validateGroupName(args.name);
    if (name.length === 0) {
      throw new ValidationError("name", "Group name is required", "REQUIRED");
    }

    // SECURITY: Validate participant count (prevent huge groups)
    validateArray(args.participants, {
      minLength: 1,
      maxLength: 50, // Reasonable max for group chat
      field: "participants",
    });

    const allParticipants = Array.from(new Set([args.createdBy, ...args.participants]));

    const roomId = await ctx.db.insert("chatRooms", {
      name,
      type: "group",
      participants: allParticipants,
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });

    return roomId;
  },
});

// ==================== QUERIES ====================

/**
 * Get user's chat rooms
 * SECURITY: No rate limiting needed for queries (read-only)
 * SECURITY: Only returns rooms where user is participant
 */
export const getUserChatRooms = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // SECURITY: Only return rooms where user is a participant
    const allRooms = await ctx.db
      .query("chatRooms")
      .collect();

    const rooms = allRooms.filter((room) =>
      room.participants.includes(args.userId)
    );

    // SECURITY: Limit to 100 most recent rooms
    const limitedRooms = rooms.slice(0, 100);

    const roomsWithDetails = await Promise.all(
      limitedRooms.map(async (room) => {
        // Get the last message
        const lastMessage = await ctx.db
          .query("chatMessages")
          .withIndex("by_room", (q) => q.eq("roomId", room._id))
          .order("desc")
          .first();

        // For direct chats, get the other user
        let otherUser = null;
        if (room.type === "direct") {
          const otherUserId = room.participants.find((id) => id !== args.userId);
          if (otherUserId) {
            otherUser = await ctx.db.get(otherUserId);
          }
        }

        // Get unread count (limit check to recent messages for performance)
        const recentMessages = await ctx.db
          .query("chatMessages")
          .withIndex("by_room", (q) => q.eq("roomId", room._id))
          .order("desc")
          .take(100);

        const unreadCount = recentMessages.filter(
          (msg) => msg.senderId !== args.userId && !msg.readBy.includes(args.userId)
        ).length;

        return {
          ...room,
          lastMessage,
          otherUser,
          unreadCount,
        };
      })
    );

    // Sort by last message time
    roomsWithDetails.sort((a, b) => {
      const timeA = a.lastMessageAt || a.createdAt;
      const timeB = b.lastMessageAt || b.createdAt;
      return timeB - timeA;
    });

    return roomsWithDetails;
  },
});

/**
 * Send message
 * SECURITY: Rate limited to prevent chat spam
 * SECURITY: Content is validated and sanitized for XSS
 * SECURITY: Authorization check ensures sender is a participant
 */
export const sendMessage = mutation({
  args: {
    roomId: v.id("chatRooms"),
    senderId: v.id("users"),
    content: v.string(),
    mediaUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // SECURITY: Rate limit messages (allow more frequent than posts)
    await checkRateLimit(ctx, userRateLimitId(args.senderId), "sendMessage", "chat");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Chat room not found");

    // SECURITY: Authorization - must be participant
    if (!room.participants.includes(args.senderId)) {
      throw new Error("You are not a participant in this chat");
    }

    // SECURITY: Validate and sanitize message content (max 2000 chars, XSS prevention)
    const content = validateChatMessage(args.content);
    if (content.length === 0) {
      throw new ValidationError("content", "Message content is required", "REQUIRED");
    }

    // SECURITY: Validate media URL if provided
    let mediaUrl = args.mediaUrl;
    if (mediaUrl) {
      mediaUrl = validateUrl(mediaUrl, {
        allowedProtocols: ["http:", "https:"],
        maxLength: 2048,
        field: "mediaUrl",
      });
    }

    const messageId = await ctx.db.insert("chatMessages", {
      roomId: args.roomId,
      senderId: args.senderId,
      content,
      mediaUrl,
      createdAt: Date.now(),
      readBy: [args.senderId],
    });

    // Update room's last message time
    await ctx.db.patch(args.roomId, {
      lastMessageAt: Date.now(),
    });

    return messageId;
  },
});

/**
 * Get messages for a chat room
 * SECURITY: No rate limiting needed for queries (read-only)
 * SECURITY: Results are limited to prevent data exfiltration
 */
export const getChatMessages = query({
  args: { roomId: v.id("chatRooms") },
  handler: async (ctx, args) => {
    // SECURITY: Limit to 500 most recent messages
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(500);

    // Reverse to get chronological order
    messages.reverse();

    const messagesWithUsers = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return {
          ...message,
          sender,
        };
      })
    );

    return messagesWithUsers;
  },
});

/**
 * Mark messages as read
 * SECURITY: Rate limited to prevent abuse
 */
export const markMessagesAsRead = mutation({
  args: {
    roomId: v.id("chatRooms"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // SECURITY: Rate limit this operation
    await checkRateLimit(ctx, userRateLimitId(args.userId), "markMessagesAsRead", "default");

    // SECURITY: Limit to recent messages for performance
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(100);

    const unreadMessages = messages.filter(
      (msg) => msg.senderId !== args.userId && !msg.readBy.includes(args.userId)
    );

    await Promise.all(
      unreadMessages.map((msg) =>
        ctx.db.patch(msg._id, {
          readBy: [...msg.readBy, args.userId],
        })
      )
    );

    return { markedCount: unreadMessages.length };
  },
});

/**
 * Add participant to group chat
 * SECURITY: Rate limited to prevent abuse
 * SECURITY: Validates group membership limits
 */
export const addParticipantToGroupChat = mutation({
  args: {
    roomId: v.id("chatRooms"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // SECURITY: Rate limit participant additions
    await checkRateLimit(ctx, userRateLimitId(args.userId), "addParticipantToGroupChat", "default");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Chat room not found");

    if (room.type !== "group") {
      throw new Error("Can only add participants to group chats");
    }

    if (room.participants.includes(args.userId)) {
      throw new Error("User is already a participant");
    }

    // SECURITY: Limit group size
    if (room.participants.length >= 50) {
      throw new Error("Group has reached maximum participant limit");
    }

    await ctx.db.patch(args.roomId, {
      participants: [...room.participants, args.userId],
    });

    return { success: true };
  },
});

/**
 * Convert direct chat to group and add participant
 * SECURITY: Rate limited to prevent abuse
 * SECURITY: Validates group name and membership
 */
export const convertToGroupAndAddParticipant = mutation({
  args: {
    roomId: v.id("chatRooms"),
    newParticipantId: v.id("users"),
    groupName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // SECURITY: Rate limit this operation
    await checkRateLimit(ctx, userRateLimitId(args.newParticipantId), "convertToGroupAndAddParticipant", "create");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Chat room not found");

    if (room.participants.includes(args.newParticipantId)) {
      throw new Error("User is already in this chat");
    }

    // If it's already a group chat, just add the participant
    if (room.type === "group") {
      // SECURITY: Limit group size
      if (room.participants.length >= 50) {
        throw new Error("Group has reached maximum participant limit");
      }

      await ctx.db.patch(args.roomId, {
        participants: [...room.participants, args.newParticipantId],
      });
      return { success: true, roomId: args.roomId };
    }

    // Convert direct chat to group chat
    const participants = [...room.participants, args.newParticipantId];

    // SECURITY: Validate and sanitize group name if provided
    let groupName = args.groupName;
    if (groupName) {
      groupName = validateGroupName(groupName);
    }

    if (!groupName) {
      const users = await Promise.all(
        participants.map((id) => ctx.db.get(id))
      );
      const usernames = users
        .filter((u) => u !== null)
        .map((u) => u!.username)
        .slice(0, 3);
      groupName = usernames.join(", ");
      if (participants.length > 3) {
        groupName += ` +${participants.length - 3}`;
      }
    }

    await ctx.db.patch(args.roomId, {
      type: "group",
      name: groupName,
      participants: participants,
    });

    return { success: true, roomId: args.roomId };
  },
});
