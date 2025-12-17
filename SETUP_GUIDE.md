# Neon Nexus Hub - Setup Guide

Welcome to Neon Nexus Hub! This guide will help you set up and run your fully functional gaming platform with authentication, database, and interactive features.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Clerk account (for authentication)
- A Convex account (for database)

## Step 1: Install Dependencies

All dependencies are already installed, but if you need to reinstall:

```bash
npm install
```

## Step 2: Set Up Clerk Authentication

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application or use an existing one
3. Copy your **Publishable Key** from the API Keys section
4. Keep this key handy for the next step

### Clerk Configuration

- **Recommended Settings:**
  - Enable Email & Password authentication
  - Enable Google/GitHub OAuth (optional but recommended)
  - Customize the sign-in/sign-up appearance to match the neon theme (optional)

## Step 3: Set Up Convex Database

1. Go to [Convex Dashboard](https://dashboard.convex.dev/)
2. Create a new project
3. Run the following command in your terminal:

```bash
npx convex dev
```

4. Follow the prompts to:
   - Log in to your Convex account
   - Link to your Convex project
   - This will create a `convex.json` file and start the Convex dev server

5. The command will output your **Convex Deployment URL** (looks like: `https://your-project.convex.cloud`)
6. Keep this URL for the next step

### Seed Initial Data

After Convex is running, seed the database with initial quests:

1. Open the Convex dashboard
2. Go to the "Functions" tab
3. Run the `quests:seedQuests` mutation (click the function and press "Run")
4. This will populate your database with 6 initial quests

## Step 4: Configure Environment Variables

1. Create a `.env.local` file in the root directory:

```bash
# Copy the example file
cp .env.local.example .env.local
```

2. Edit `.env.local` and add your keys:

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here

# Convex Database
VITE_CONVEX_URL=https://your-project.convex.cloud
```

**Important:** Replace the placeholder values with your actual keys!

## Step 5: Run the Development Server

### Terminal 1 - Convex Dev Server

```bash
npx convex dev
```

Keep this running in the background. This watches for changes to your Convex functions.

### Terminal 2 - Vite Dev Server

```bash
npm run dev
```

Your app will be available at `http://localhost:5173`

## Step 6: Test the Application

1. Open `http://localhost:5173` in your browser
2. Click "Get Started" to create an account
3. Complete the sign-up flow with Clerk
4. You'll be redirected to `/home` - your dashboard!
5. Explore the features:
   - **Home Dashboard:** View your stats, XP, and quick actions
   - **Quests:** Browse, start, and complete quests
   - **Leaderboard:** See top players and your ranking

## Features Overview

### Authentication (Clerk)
- ✅ Sign up / Sign in with email
- ✅ OAuth providers (Google, GitHub)
- ✅ User profile management
- ✅ Protected routes
- ✅ Themed authentication UI

### Home Dashboard
- ✅ Personalized welcome message
- ✅ User stats (Level, XP, Points, Quests)
- ✅ XP progress bar with level tracking
- ✅ Quick actions to Quests and Leaderboard
- ✅ Preview of active quests
- ✅ Preview of top players
- ✅ Framer Motion animations throughout

### Quests System
- ✅ Browse all available quests
- ✅ Filter by difficulty (Easy, Medium, Hard)
- ✅ Start quests
- ✅ Track progress with progress bars
- ✅ Complete quests and earn rewards (XP + Points)
- ✅ Visual feedback for completed quests
- ✅ Real-time database integration

### Leaderboard
- ✅ Top 3 podium with special styling
- ✅ Full leaderboard rankings
- ✅ User's current position highlighted
- ✅ Real-time XP tracking
- ✅ Level and badge display
- ✅ Smooth animations

### Database (Convex)
- ✅ User profiles
- ✅ Quest management
- ✅ Progress tracking
- ✅ Leaderboard rankings
- ✅ Real-time updates
- ✅ Type-safe queries and mutations

## Architecture

```
src/
├── components/
│   ├── landing/          # Landing page components (Navbar, Footer, etc.)
│   └── ui/               # shadcn/ui components
├── pages/
│   ├── Index.tsx         # Landing page
│   ├── Home.tsx          # User dashboard (protected)
│   ├── Quests.tsx        # Quests page (protected)
│   └── Leaderboard.tsx   # Leaderboard page (protected)
└── App.tsx               # Main app with routing and providers

convex/
├── schema.ts             # Database schema
├── users.ts              # User queries and mutations
├── quests.ts             # Quest queries and mutations
└── leaderboard.ts        # Leaderboard queries and mutations
```

## Customization

### Theme Colors

The app uses a cyberpunk/neon theme defined in `src/index.css`:
- Primary: Rose Pink (#e88a97)
- Accent: Purple (#a855f7)
- Neon colors: Pink, Purple, Blue, Green, Orange

### Fonts

- **Gaming:** Orbitron (headings, titles)
- **Cyber:** Rajdhani (body text, descriptions)
- **Sans:** Inter (general text)

### Adding New Quests

1. Open Convex dashboard
2. Go to "Data" tab
3. Add new documents to the `quests` table with:
   - title, description, thumbnail (emoji)
   - difficulty: "Easy" | "Medium" | "Hard"
   - reward (points), xp
   - duration, category
   - isActive: true

### Adding New Features

The codebase is structured for easy expansion:
- Add new Convex tables in `convex/schema.ts`
- Create new queries/mutations in `convex/`
- Add new pages in `src/pages/`
- Update routes in `src/App.tsx`

## Troubleshooting

### "Missing Clerk Publishable Key" Error
- Make sure `.env.local` exists
- Check that `VITE_CLERK_PUBLISHABLE_KEY` is set correctly
- Restart the dev server after adding env variables

### "Missing Convex URL" Error
- Make sure `.env.local` exists
- Check that `VITE_CONVEX_URL` is set correctly
- Ensure `npx convex dev` is running

### Convex Functions Not Found
- Run `npx convex dev` to generate types
- Check that convex functions are properly exported
- Restart both servers

### Authentication Not Working
- Verify Clerk publishable key is correct
- Check Clerk dashboard for application status
- Ensure your domain is added to allowed origins in Clerk

### No Quests Showing
- Run the `seedQuests` mutation in Convex dashboard
- Check that quests have `isActive: true`
- Verify Convex connection is working

## Deployment

### Convex Deployment

```bash
npx convex deploy
```

This will give you a production Convex URL. Update your production environment variables.

### Vite Build

```bash
npm run build
```

Deploy the `dist` folder to your hosting provider (Vercel, Netlify, etc.).

### Environment Variables for Production

Make sure to set these in your hosting provider's environment settings:
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_CONVEX_URL` (production URL from `npx convex deploy`)

## Next Steps

1. **Add More Quests:** Populate your database with diverse challenges
2. **Implement Social Features:** Add the social feed, chat, and polls
3. **Prize Store:** Create a redemption system for points
4. **Real-time Updates:** Add live notifications for quest completion
5. **Achievements System:** Implement badges and special rewards
6. **Mobile App:** Consider building a React Native version

## Support

If you encounter any issues:
1. Check the Convex logs in the dashboard
2. Check the browser console for errors
3. Verify all environment variables are set
4. Ensure both dev servers are running

## Technologies Used

- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS, Custom Neon Theme
- **UI Components:** shadcn/ui
- **Animations:** Framer Motion
- **Authentication:** Clerk
- **Database:** Convex
- **Routing:** React Router
- **Icons:** Lucide React

---

Enjoy building your gaming platform! 🎮✨
