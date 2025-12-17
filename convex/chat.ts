import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create or get direct chat room between two users
export const getOrCreateDirectChat = mutation({
  args: {
    user1Id: v.id("users"),
    user2Id: v.id("users"),
  },
  handler: async (ctx, args) => {
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

// Create group chat
export const createGroupChat = mutation({
  args: {
    name: v.string(),
    createdBy: v.id("users"),
    participants: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const allParticipants = Array.from(new Set([args.createdBy, ...args.participants]));

    const roomId = await ctx.db.insert("chatRooms", {
      name: args.name,
      type: "group",
      participants: allParticipants,
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });

    return roomId;
  },
});

// Get user's chat rooms
export const getUserChatRooms = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all chat rooms and filter in JavaScript
    const allRooms = await ctx.db
      .query("chatRooms")
      .collect();

    const rooms = allRooms.filter((room) =>
      room.participants.includes(args.userId)
    );

    const roomsWithDetails = await Promise.all(
      rooms.map(async (room) => {
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

        // Get unread count
        const allMessages = await ctx.db
          .query("chatMessages")
          .withIndex("by_room", (q) => q.eq("roomId", room._id))
          .collect();

        const unreadCount = allMessages.filter(
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

// Send message
export const sendMessage = mutation({
  args: {
    roomId: v.id("chatRooms"),
    senderId: v.id("users"),
    content: v.string(),
    mediaUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Chat room not found");

    if (!room.participants.includes(args.senderId)) {
      throw new Error("You are not a participant in this chat");
    }

    const messageId = await ctx.db.insert("chatMessages", {
      roomId: args.roomId,
      senderId: args.senderId,
      content: args.content,
      mediaUrl: args.mediaUrl,
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

// Get messages for a chat room
export const getChatMessages = query({
  args: { roomId: v.id("chatRooms") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("asc")
      .collect();

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

// Mark messages as read
export const markMessagesAsRead = mutation({
  args: {
    roomId: v.id("chatRooms"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

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

// Add participant to group chat
export const addParticipantToGroupChat = mutation({
  args: {
    roomId: v.id("chatRooms"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Chat room not found");

    if (room.type !== "group") {
      throw new Error("Can only add participants to group chats");
    }

    if (room.participants.includes(args.userId)) {
      throw new Error("User is already a participant");
    }

    await ctx.db.patch(args.roomId, {
      participants: [...room.participants, args.userId],
    });

    return { success: true };
  },
});

// Convert direct chat to group and add participant
export const convertToGroupAndAddParticipant = mutation({
  args: {
    roomId: v.id("chatRooms"),
    newParticipantId: v.id("users"),
    groupName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Chat room not found");

    if (room.participants.includes(args.newParticipantId)) {
      throw new Error("User is already in this chat");
    }

    // If it's already a group chat, just add the participant
    if (room.type === "group") {
      await ctx.db.patch(args.roomId, {
        participants: [...room.participants, args.newParticipantId],
      });
      return { success: true, roomId: args.roomId };
    }

    // Convert direct chat to group chat
    const participants = [...room.participants, args.newParticipantId];

    // Generate default group name from usernames if not provided
    let groupName = args.groupName;
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
