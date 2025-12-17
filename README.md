# Neon Nexus Hub 🎮✨

A fully functional cyberpunk-themed gaming platform with authentication, user dashboard, quests system, and leaderboard. Built with React, TypeScript, Clerk, and Convex.

![Neon Nexus Hub](https://img.shields.io/badge/Status-Ready%20to%20Deploy-success?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React-18.3-61dafb?style=for-the-badge&logo=react)

## ✨ Features

### 🔐 Authentication (Clerk)
- Sign up / Sign in with email & password
- OAuth providers (Google, GitHub)
- Protected routes
- User profile management
- Themed authentication UI matching the neon cyberpunk aesthetic

### 🏠 Home Dashboard
- **Personalized Welcome:** Greet users by name with animated effects
- **User Stats Cards:** Level, Total XP, Points, Quests Completed
- **XP Progress Bar:** Visual progress to next level
- **Quick Actions:** Direct links to Quests and Leaderboard
- **Active Quests Preview:** See available quests at a glance
- **Top Players Preview:** Quick view of leaderboard rankings
- **Framer Motion Animations:** Smooth, engaging transitions throughout

### 🎯 Quests System
- Browse all available quests
- Filter by difficulty (Easy, Medium, Hard)
- Start quests with one click
- Track progress with visual progress bars
- Complete quests to earn XP and Points
- Real-time reward distribution
- Beautiful quest cards with emoji thumbnails
- Difficulty-based color coding

### 🏆 Leaderboard
- Top 3 podium with special styling and animations
- Full global rankings
- User's current position highlighted
- Real-time XP tracking
- Level and badge display
- Crown for #1, medals for #2 and #3
- Smooth scroll animations

### 💾 Database (Convex)
- User profiles with XP, levels, and points
- Quest management system
- Progress tracking for user quests
- Leaderboard rankings
- Real-time updates
- Type-safe queries and mutations

## 🚀 Quick Start

**See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed setup instructions.**

### Quick Overview:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Clerk:**
   - Create account at [clerk.com](https://clerk.com)
   - Get your Publishable Key

3. **Set up Convex:**
   ```bash
   npx convex dev
   ```
   - Follow prompts to create/link project
   - Seed initial quests via dashboard

4. **Configure environment:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your keys
   ```

5. **Run the app:**
   ```bash
   # Terminal 1
   npx convex dev

   # Terminal 2
   npm run dev
   ```

6. **Open browser:**
   - Navigate to `http://localhost:5173`
   - Sign up and start gaming!

## 📁 Project Structure

```
src/
├── components/
│   ├── landing/          # Landing page components
│   │   ├── Navbar.tsx    # Navigation with auth buttons
│   │   ├── HeroSection.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── QuestsSection.tsx
│   │   ├── LeaderboardSection.tsx
│   │   └── Footer.tsx
│   └── ui/               # shadcn/ui components
├── pages/
│   ├── Index.tsx         # Landing page
│   ├── Home.tsx          # User dashboard (protected)
│   ├── Quests.tsx        # Quests page (protected)
│   └── Leaderboard.tsx   # Leaderboard page (protected)
├── App.tsx               # Main app with routing & providers
└── index.css             # Cyberpunk theme styles

convex/
├── schema.ts             # Database schema
├── users.ts              # User queries & mutations
├── quests.ts             # Quest queries & mutations
└── leaderboard.ts        # Leaderboard queries & mutations
```

## 🎨 Theme & Design

### Color Palette
- **Primary:** Rose Pink `#e88a97` (hsl(348 48% 58%))
- **Accent:** Purple `#a855f7` (hsl(280 100% 65%))
- **Neon Colors:**
  - Pink: `hsl(348 100% 65%)`
  - Purple: `hsl(280 100% 65%)`
  - Blue: `hsl(200 100% 60%)`
  - Green: `hsl(120 100% 50%)`
  - Orange: `hsl(25 100% 55%)`

### Typography
- **Gaming:** Orbitron - Bold, futuristic headings
- **Cyber:** Rajdhani - Clean, modern body text
- **Sans:** Inter - General UI text

### Visual Effects
- Neon glows and shadows
- Animated gradient backgrounds
- Cyber grid patterns
- Pulse animations
- Hover transformations
- Smooth page transitions (Framer Motion)

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | UI components |
| **Framer Motion** | Animations |
| **Clerk** | Authentication |
| **Convex** | Database & backend |
| **React Router** | Routing |
| **Lucide React** | Icons |
| **Sonner** | Toast notifications |

## 📊 Database Schema

### Users
- `clerkId`, `username`, `email`, `avatar`
- `xp`, `level`, `points`
- `completedQuests`, `badges`

### Quests
- `title`, `description`, `thumbnail`
- `difficulty`, `reward`, `xp`, `duration`
- `category`, `isActive`

### UserQuests
- `userId`, `questId`
- `progress`, `status`
- `startedAt`, `completedAt`

### Leaderboard
- `userId`, `rank`, `xp`, `weeklyXp`
- `trend`, `lastUpdated`

## 🎯 Future Enhancements

- [ ] Social Feed (posts, likes, comments)
- [ ] Real-time Chat
- [ ] Prize Store (redeem points)
- [ ] Polls & Voting system
- [ ] Music Integration
- [ ] Achievement badges system
- [ ] Friends & Following
- [ ] Real-time notifications
- [ ] Mobile responsive improvements
- [ ] Dark/Light theme toggle

## 📝 Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npx convex dev       # Start Convex dev server
npx convex deploy    # Deploy Convex to production
```

## 🐛 Troubleshooting

Common issues and solutions are covered in [SETUP_GUIDE.md](./SETUP_GUIDE.md#troubleshooting).

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 🌟 Show Your Support

Give a ⭐️ if you like this project!

---

Built with 💜 by the Neon Nexus team

**Ready to game? Let's go! 🎮🚀**
