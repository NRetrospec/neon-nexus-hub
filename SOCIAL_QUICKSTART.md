# Social Feature Quick Start Guide

## Getting Started

### 1. Start the Development Server
```bash
# Terminal 1: Start Convex backend
npx convex dev

# Terminal 2: Start Vite frontend
npm run dev
```

### 2. Sign Up / Sign In
1. Navigate to `http://localhost:5173`
2. Click "Get Started" or "Sign In"
3. Complete Clerk authentication

### 3. Access the Social Hub
1. Once signed in, you'll see "Social" in the navigation
2. Click "Social" to access the social hub
3. You'll start in the "General" channel

## Testing the Features

### Creating Your First Post
1. Click in the text area that says "What's on your mind, [username]?"
2. Type a message (e.g., "Hello from the Neon Nexus Hub! 🎮")
3. (Optional) Add an image URL in the "Image URL" field
4. Click "Post"
5. Your post appears instantly in the feed

### Liking Posts
1. Click the heart icon on any post
2. The like count increases immediately
3. Click again to unlike

### Adding Comments
1. Click the comment icon on a post
2. The comments section expands below
3. Type your comment in the input field
4. Press Enter or click the send button
5. Your comment appears instantly

### Deleting Posts
1. Find a post you created (it has a trash icon)
2. Click the trash icon
3. The post and all its likes/comments are removed

## Testing PhreshTeam Access

### Granting Access (Admin)
1. Open Convex dashboard: `http://localhost:3000`
2. Go to the "Data" tab
3. Find your user in the "users" table
4. Note your user's `_id`
5. Go to "Functions" tab
6. Run this mutation:
   ```
   Function: users:togglePhreshTeamAccess
   Args: {
     "userId": "YOUR_USER_ID_HERE",
     "phreshTeam": true
   }
   ```
7. Refresh the Social page
8. The PhreshTeam tab should now be unlocked

### Testing PhreshTeam Channel
1. Click the "PhreshTeam" tab
2. Create posts exclusive to PhreshTeam members
3. Notice the sparkle icon and badge on PhreshTeam posts
4. Test with another user without access to verify restriction

## Testing Auth-Conditional Features

### Quests Page (Logged Out)
1. Sign out of your account
2. Navigate to `/quests`
3. You can browse quests but buttons say "Sign In to Start"
4. No personal stats are shown
5. Click "Sign In to Start" redirects to authentication

### Quests Page (Logged In)
1. Sign back in
2. Navigate to `/quests`
3. Personal stats appear (Completed, In Progress)
4. You can start and complete quests
5. Back button goes to Dashboard

### Navigation Changes
1. **Logged Out**: Shows Features, Discover, Rankings, Prizes
2. **Logged In**: Shows Social, Quests, Leaderboard, Prizes
3. Test on both desktop and mobile (responsive menu)

## Sample Image URLs for Testing
```
https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400
https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400
https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400
```

## Common Test Scenarios

### Multi-User Testing
1. Open two browser windows (one incognito)
2. Sign in with different accounts
3. Create posts in one window
4. Watch them appear in real-time in the other window
5. Test likes and comments from both accounts

### Mobile Responsive Testing
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select mobile device preset
4. Test all features on mobile view
5. Check hamburger menu, touch interactions

### Error Handling
1. Try posting without content (button is disabled)
2. Try accessing PhreshTeam without permission (tab is locked)
3. Try liking posts while offline (error toast appears)
4. Test with invalid image URLs (fallback handling)

## Real-Time Updates Verification
1. Open Social page in two tabs
2. Create a post in Tab 1
3. Verify it appears immediately in Tab 2
4. Like a post in Tab 2
5. Watch like count update in Tab 1
6. Add a comment in Tab 1
7. See it appear in Tab 2 without refresh

## Performance Checks
- [ ] Posts load quickly (< 1 second)
- [ ] Animations are smooth (60fps)
- [ ] Images load progressively
- [ ] No lag when scrolling feed
- [ ] Real-time updates don't cause jank

## Troubleshooting

### "Convex backend is not running"
```bash
# Make sure Convex dev is running
npx convex dev
```

### "User not found" error
1. Sign in to create user in database
2. Wait for Clerk webhook to sync
3. Refresh page

### PhreshTeam tab not working
1. Verify mutation ran successfully in Convex dashboard
2. Check browser console for errors
3. Hard refresh (Ctrl+Shift+R)

### Posts not appearing
1. Check Convex dashboard logs
2. Verify user is authenticated (check user icon in navbar)
3. Clear browser cache and reload

## Next Steps After Testing

1. **Invite Team Members**: Share the app with your team
2. **Grant PhreshTeam Access**: Use the mutation to add team members
3. **Customize Channels**: Consider adding more channels if needed
4. **Set Up Moderation**: Implement admin tools for content management
5. **Add File Upload**: Enhance with direct image uploads
6. **Enable Notifications**: Add real-time notifications for interactions

## Development Tips

### Hot Module Replacement (HMR)
- Frontend changes reload instantly
- Convex changes require schema push: `npx convex dev` handles this
- Schema changes may require clearing data

### Debugging
```typescript
// Add console logs in Convex functions
console.log("Post created:", postId);

// Check Convex dashboard logs tab
// Use browser DevTools Network tab for API calls
```

### Database Inspection
1. Open Convex dashboard
2. Go to "Data" tab
3. Browse tables: socialPosts, postLikes, postComments
4. View real-time updates as you interact

## Feature Checklist

- [ ] Sign in successfully
- [ ] Create a post in General channel
- [ ] Like a post
- [ ] Unlike a post
- [ ] Add a comment
- [ ] Delete your own post
- [ ] Grant PhreshTeam access
- [ ] Access PhreshTeam channel
- [ ] Create PhreshTeam post
- [ ] Test logged-out Quests view
- [ ] Test logged-in Quests view
- [ ] Verify navigation changes
- [ ] Test mobile responsiveness
- [ ] Verify real-time updates

## Support

If you encounter issues:
1. Check the console for errors
2. Review Convex dashboard logs
3. Verify all environment variables are set
4. Ensure Clerk and Convex are properly configured
5. See SOCIAL_FEATURE_IMPLEMENTATION.md for detailed docs

Enjoy your new Social Hub! 🎮✨
