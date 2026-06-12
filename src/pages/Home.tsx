import { useEffect, useState, lazy, Suspense } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
  Zap,
  Users,
  Crown,
  ArrowRight,
  Sparkles,
  Search,
  Bell,
  Mail,
  Plus,
  MessageSquare,
  CalendarDays,
  ChevronRight,
  Gamepad2,
  ShoppingBag,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import HoloSidebar, {
  SectionKey,
} from "@/components/experience/HoloSidebar";
import HoloModal from "@/components/experience/HoloModal";
import AmbientBackground from "@/components/experience/AmbientBackground";
import IntroSequence, {
  shouldShowIntro,
} from "@/components/experience/IntroSequence";
import { playUI } from "@/lib/sound";

// Lazy-load the 3D scene so it never blocks first paint
const PTScene = lazy(() => import("@/components/experience/PTScene"));

// Lazy-load section pages — embedded in HoloModals so the user never
// leaves the hub. Code-split: each loads on first open only.
const SocialPage = lazy(() => import("@/pages/Social"));
const QuestsPage = lazy(() => import("@/pages/Quests"));
const PollsPage = lazy(() => import("@/pages/Polls"));
const PodcastPage = lazy(() => import("@/pages/Podcast"));
const LeaderboardPage = lazy(() => import("@/pages/Leaderboard"));
const PrizesPage = lazy(() => import("@/pages/Prizes"));
const TermsPage = lazy(() => import("@/pages/legal/TermsOfService"));

/** Section -> modal config. "home" means no modal (the dashboard itself). */
const SECTION_MODALS: Record<
  Exclude<SectionKey, "home">,
  { title: string; Component: React.LazyExoticComponent<() => JSX.Element> }
> = {
  community: { title: "Community", Component: SocialPage },
  games: { title: "Games & Quests", Component: QuestsPage },
  events: { title: "Events", Component: PollsPage },
  media: { title: "PhreshCast", Component: PodcastPage },
  rankings: { title: "Rankings", Component: LeaderboardPage },
  shop: { title: "Shop", Component: PrizesPage },
  support: { title: "Support", Component: TermsPage },
};

/* ---------------------------------------------------------------- */
/* helpers                                                          */
/* ---------------------------------------------------------------- */

const getDirectImageUrl = (url: string) => {
  if (!url || typeof url !== "string") return url;
  if (url.includes("drive.google.com/uc?")) return url;
  if (url.includes("drive.google.com/file/d/")) {
    const m = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (m) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
  }
  if (url.includes("drive.google.com/open?id=")) {
    const m = url.match(/id=([a-zA-Z0-9-_]+)/);
    if (m) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
  }
  return url;
};

const renderAvatar = (avatar: string | undefined, sizeClass = "w-9 h-9") => {
  if (!avatar) return <span className="text-xl">🎮</span>;
  const isUrl = avatar.startsWith("http://") || avatar.startsWith("https://");
  if (isUrl) {
    return (
      <img
        src={avatar}
        alt=""
        className={`${sizeClass} rounded-lg object-cover`}
      />
    );
  }
  return <span className="text-xl">{avatar}</span>;
};

const timeAgo = (ts: number) => {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K` : `${n}`;

/* ---------------------------------------------------------------- */
/* shared card shell                                                */
/* ---------------------------------------------------------------- */

const holoCard =
  "relative rounded-2xl border border-white/[0.07] overflow-hidden";
const holoCardStyle: React.CSSProperties = {
  background:
    "linear-gradient(160deg, hsl(248 26% 9% / 0.82) 0%, hsl(252 32% 5% / 0.9) 100%)",
  backdropFilter: "blur(14px)",
  boxShadow: "0 8px 32px hsl(250 35% 2% / 0.45)",
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" as const },
  },
};

const PanelTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-gaming font-bold text-[11px] tracking-[0.22em] text-foreground/80 uppercase mb-3 flex items-center gap-2">
    <span
      className="w-1 h-3 rounded-full bg-primary"
      style={{ boxShadow: "0 0 8px hsl(var(--primary))" }}
    />
    {children}
  </h3>
);

/* ---------------------------------------------------------------- */
/* live clock card (PHRESH TIME)                                    */
/* ---------------------------------------------------------------- */

const PhreshClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const hours = now.getHours();
  const mood =
    hours < 6 ? "🌙 Late Night Grind" :
    hours < 12 ? "☀️ Morning Warmup" :
    hours < 18 ? "🎮 Prime Time Soon" :
    "🔥 Prime Time";
  return (
    <div className={`${holoCard} p-4`} style={holoCardStyle}>
      <PanelTitle>Phresh Time</PanelTitle>
      <div className="flex items-end justify-between">
        <div>
          <p className="font-gaming font-bold text-3xl text-foreground">
            {now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </p>
          <p className="font-cyber text-xs text-muted-foreground mt-1">
            {now.toLocaleDateString([], {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        <span className="font-cyber text-xs text-primary/90 text-right">
          {mood}
        </span>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- */
/* Home                                                             */
/* ---------------------------------------------------------------- */

const Home = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [showIntro, setShowIntro] = useState(shouldShowIntro());
  const [activeSection, setActiveSection] = useState<SectionKey>("home");

  const openSection = (section: SectionKey) => {
    setActiveSection(section);
  };
  const closeSection = () => setActiveSection("home");

  const dbUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );
  const createUser = useMutation(api.users.createUser);
  const userStats = useQuery(
    api.users.getUserStats,
    dbUser ? { userId: dbUser._id } : "skip"
  );
  const userRank = useQuery(
    api.leaderboard.getUserRank,
    dbUser ? { userId: dbUser._id } : "skip"
  );

  // LIVE DATA — keeps the hub alive
  const topPlayers = useQuery(api.leaderboard.getTopPlayers, { limit: 50 });
  const activeQuests = useQuery(api.quests.getActiveQuests);
  const recentPosts = useQuery(api.social.getPostsByChannel, {
    channel: "General",
  });
  const polls = useQuery(api.polls.getAllPolls);

  useEffect(() => {
    if (user && !dbUser) {
      createUser({
        clerkId: user.id,
        username: user.username || user.firstName || "Player",
        email: user.emailAddresses[0]?.emailAddress || "",
        avatar: user.imageUrl || "🎮",
      });
    }
  }, [user, dbUser, createUser]);

  const memberCount = topPlayers?.length ?? 0;
  const openPolls = (polls ?? []).filter((p) => p.status !== "closed").slice(0, 3);
  const feed = (recentPosts ?? []).slice(0, 6);
  const featured = (activeQuests ?? []).slice(0, 6);

  const currentXP = (userStats?.xp || 0) % 1000;
  const xpPct = Math.min(100, Math.round((currentXP / 1000) * 100));

  const displayName = (
    dbUser?.username ||
    user?.firstName ||
    user?.username ||
    "Player"
  ).toUpperCase();

  return (
    <div className="min-h-screen relative">
      {showIntro && <IntroSequence onComplete={() => setShowIntro(false)} />}

      <AmbientBackground />
      <HoloSidebar onOpenSection={openSection} activeSection={activeSection} />

      <main className="relative z-10 lg:pl-64 px-4 lg:pr-6 pb-12 pt-4">
        {/* ===== top bar ===== */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-end gap-2 mb-5 pl-12 lg:pl-0"
        >
          {[
            { icon: Search, label: "Search", to: "rankings" as SectionKey },
            { icon: Bell, label: "Notifications", to: "community" as SectionKey },
            { icon: Mail, label: "Messages", to: "community" as SectionKey },
          ].map(({ icon: Icon, label, to }) => (
            <button
              key={label}
              aria-label={label}
              onClick={() => openSection(to)}
              onMouseEnter={() => playUI("hover")}
              className="p-2.5 rounded-xl text-muted-foreground hover:text-primary border border-white/[0.06] hover:border-primary/40 transition-all duration-200 hover:shadow-[0_0_14px_hsl(var(--primary)/0.25)]"
              style={{ background: "hsl(248 26% 9% / 0.7)" }}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
          <Button
            variant="neon"
            size="sm"
            className="font-cyber font-semibold ml-1"
            onClick={() => {
              playUI("select");
              openSection("community");
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Create
          </Button>
        </motion.header>

        {/* ===== grid: main + right rail ===== */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.07 } },
          }}
          className="grid grid-cols-1 xl:grid-cols-[1fr_minmax(280px,340px)] gap-5 max-w-[1400px] mx-auto"
        >
          {/* ================= MAIN COLUMN ================= */}
          <div className="space-y-5 min-w-0">
            {/* ---- HERO ---- */}
            <motion.section
              variants={itemVariants}
              className={`${holoCard} group`}
              style={{
                ...holoCardStyle,
                background:
                  "linear-gradient(120deg, hsl(252 32% 6% / 0.92) 0%, hsl(265 45% 12% / 0.85) 55%, hsl(270 60% 16% / 0.75) 100%)",
              }}
            >
              {/* purple planet glow */}
              <div
                className="absolute -top-24 -right-16 w-72 h-72 rounded-full pointer-events-none opacity-60"
                style={{
                  background:
                    "radial-gradient(circle, hsl(270 100% 65% / 0.35) 0%, transparent 70%)",
                }}
              />
              <div className="relative grid grid-cols-1 md:grid-cols-[1.2fr_1fr] items-center">
                <div className="p-6 sm:p-8">
                  <p className="font-cyber tracking-[0.3em] text-xs text-foreground/60 mb-1">
                    WELCOME BACK,
                  </p>
                  <h1
                    className="font-gaming font-black text-4xl sm:text-5xl text-primary leading-tight"
                    style={{
                      textShadow:
                        "0 0 24px hsl(var(--primary) / 0.55), 0 0 70px hsl(var(--primary) / 0.25)",
                    }}
                  >
                    {displayName}
                  </h1>
                  <p className="font-cyber tracking-[0.35em] text-sm text-foreground/70 mt-2">
                    PLAY. CONNECT. LEVEL UP.
                  </p>

                  {/* stat chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6">
                    {[
                      {
                        icon: Crown,
                        label: "LEVEL",
                        value: userStats ? `${userStats.level}` : "—",
                      },
                      {
                        icon: Zap,
                        label: "XP",
                        value: userStats ? fmt(userStats.xp) : "—",
                      },
                      {
                        icon: Users,
                        label: "MEMBERS",
                        value: topPlayers ? fmt(memberCount) : "—",
                      },
                      {
                        icon: Trophy,
                        label: "RANK",
                        value: userRank ? `#${userRank.rank ?? "—"}` : "—",
                      },
                    ].map(({ icon: Icon, label, value }) => (
                      <motion.div
                        key={label}
                        whileHover={{ y: -3 }}
                        className="rounded-xl border border-white/[0.08] px-3 py-2.5 transition-shadow hover:shadow-[0_0_18px_hsl(var(--primary)/0.15)]"
                        style={{ background: "hsl(250 30% 4% / 0.55)" }}
                      >
                        <div className="flex items-center gap-1.5 text-primary/90">
                          <Icon className="h-3 w-3" />
                          <span className="font-cyber text-[10px] tracking-[0.2em] text-muted-foreground">
                            {label}
                          </span>
                        </div>
                        <p className="font-gaming font-bold text-lg text-foreground mt-0.5">
                          {value}
                        </p>
                      </motion.div>
                    ))}
                  </div>

                  {/* XP progress */}
                  <div className="mt-5 max-w-sm">
                    <div className="flex justify-between font-cyber text-[11px] text-muted-foreground mb-1.5">
                      <span>NEXT LEVEL</span>
                      <span className="text-primary">{currentXP} / 1000 XP</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-white/[0.06]">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: "var(--gradient-primary)",
                          boxShadow: "0 0 12px hsl(var(--primary) / 0.7)",
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${xpPct}%` }}
                        transition={{ duration: 1.1, ease: "easeOut", delay: 0.4 }}
                      />
                    </div>
                  </div>
                </div>

                {/* 3D centerpiece */}
                <div className="relative h-64 md:h-80 hidden sm:block">
                  <Suspense
                    fallback={
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span
                          className="font-gaming font-black italic text-7xl text-primary/60 animate-pulse"
                          style={{
                            textShadow: "0 0 40px hsl(var(--primary) / 0.5)",
                          }}
                        >
                          PT
                        </span>
                      </div>
                    }
                  >
                    <PTScene />
                  </Suspense>
                </div>
              </div>
            </motion.section>

            {/* ---- FEATURED GAMES / QUESTS ---- */}
            <motion.section variants={itemVariants}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-gaming font-bold text-sm tracking-[0.2em] text-foreground/90 uppercase flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4 text-primary" />
                  Featured Quests
                </h2>
                <button
                  onClick={() => openSection("games")}
                  className="font-cyber text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                >
                  View All <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {!activeQuests ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-40 rounded-2xl" />
                  ))}
                </div>
              ) : featured.length === 0 ? (
                <div className={`${holoCard} p-6 text-center`} style={holoCardStyle}>
                  <p className="font-cyber text-sm text-muted-foreground">
                    New quests dropping soon. Stay phresh. 👑
                  </p>
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x [-ms-overflow-style:none] [scrollbar-width:thin]">
                  {featured.map((q, i) => (
                    <motion.button
                      key={q._id}
                      onClick={() => {
                        playUI("select");
                        openSection("games");
                      }}
                      onMouseEnter={() => playUI("hover")}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.08 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                      className={`${holoCard} relative shrink-0 w-52 sm:w-60 h-40 snap-start text-left group/card`}
                      style={holoCardStyle}
                    >
                      {q.thumbnail && (
                        <img
                          src={getDirectImageUrl(q.thumbnail)}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover/card:opacity-70 group-hover/card:scale-105 transition-all duration-500"
                        />
                      )}
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(180deg, transparent 20%, hsl(252 35% 3% / 0.92) 100%)",
                        }}
                      />
                      <div className="absolute inset-x-0 bottom-0 p-3.5">
                        <span
                          className={`font-cyber text-[10px] tracking-wider px-1.5 py-0.5 rounded ${
                            q.difficulty === "Hard"
                              ? "bg-accent/25 text-accent"
                              : q.difficulty === "Medium"
                              ? "bg-orange-500/20 text-orange-300"
                              : "bg-primary/20 text-primary"
                          }`}
                        >
                          {q.difficulty}
                        </span>
                        <h3 className="font-gaming font-bold text-sm text-foreground mt-1.5 line-clamp-1">
                          {q.title}
                        </h3>
                        <p className="font-cyber text-xs text-primary mt-0.5">
                          +{q.xp} XP · {q.duration}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.section>

            {/* ---- UPCOMING EVENTS (live polls) ---- */}
            <motion.section variants={itemVariants}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-gaming font-bold text-sm tracking-[0.2em] text-foreground/90 uppercase flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Live Events & Polls
                </h2>
                <button
                  onClick={() => openSection("events")}
                  className="font-cyber text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                >
                  View All <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {!polls ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-28 rounded-2xl" />
                  ))}
                </div>
              ) : openPolls.length === 0 ? (
                <div className={`${holoCard} p-6 text-center`} style={holoCardStyle}>
                  <p className="font-cyber text-sm text-muted-foreground">
                    No live events right now — check back soon or start one in
                    the community.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {openPolls.map((p, i) => (
                    <motion.div
                      key={p._id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      whileHover={{ y: -4 }}
                      className={`${holoCard} p-4 cursor-pointer group/ev`}
                      style={holoCardStyle}
                      onClick={() => {
                        playUI("select");
                        openSection("events");
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center border border-primary/25"
                          style={{ background: "hsl(78 100% 56% / 0.08)" }}
                        >
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-cyber font-semibold text-sm text-foreground line-clamp-1">
                            {p.title}
                          </h3>
                          <p className="font-cyber text-xs text-muted-foreground mt-0.5">
                            by {p.creator?.username ?? "PhreshTeam"}
                          </p>
                          <span className="inline-block font-cyber text-[11px] text-primary mt-2 group-hover/ev:translate-x-1 transition-transform">
                            Join Event →
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.section>
          </div>

          {/* ================= RIGHT RAIL ================= */}
          <div className="space-y-5 min-w-0">
            {/* ---- LIVE FEED ---- */}
            <motion.div
              variants={itemVariants}
              className={`${holoCard} p-4`}
              style={holoCardStyle}
            >
              <PanelTitle>Live Feed</PanelTitle>
              {!recentPosts ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-10 rounded-lg" />
                  ))}
                </div>
              ) : feed.length === 0 ? (
                <p className="font-cyber text-xs text-muted-foreground py-3">
                  Quiet in here... be the first to post! 🎤
                </p>
              ) : (
                <div className="space-y-1">
                  {feed.map((post, i) => (
                    <motion.button
                      key={post._id}
                      onClick={() => openSection("community")}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.07 }}
                      className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left group/feed"
                    >
                      <div className="shrink-0 w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center border border-white/[0.08] bg-white/[0.03]">
                        {renderAvatar(post.user?.avatar, "w-8 h-8")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-cyber font-semibold text-xs text-foreground truncate">
                            {post.user?.username ?? "Member"}
                          </span>
                          <span className="font-cyber text-[10px] text-muted-foreground shrink-0">
                            {timeAgo(post._creationTime)}
                          </span>
                        </div>
                        <p className="font-cyber text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {post.content}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
              <button
                onClick={() => openSection("community")}
                className="w-full mt-2 font-cyber text-xs text-primary hover:text-primary/80 py-1.5 transition-colors"
              >
                See All
              </button>
            </motion.div>

            {/* ---- MEMBERS ---- */}
            <motion.div
              variants={itemVariants}
              className={`${holoCard} p-4`}
              style={holoCardStyle}
            >
              <PanelTitle>Top Members</PanelTitle>
              {!topPlayers ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-9 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {topPlayers.slice(0, 5).map((p, i) => (
                    <motion.div
                      key={p.userId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
                    >
                      <span className="font-gaming text-[10px] w-4 text-muted-foreground">
                        {p.rank}
                      </span>
                      <div className="shrink-0 w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center border border-white/[0.08] bg-white/[0.03]">
                        {renderAvatar(p.avatar, "w-8 h-8")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-cyber font-semibold text-xs text-foreground truncate">
                          {p.username}
                        </p>
                        <p className="font-cyber text-[10px] text-muted-foreground">
                          Level {p.level} · {fmt(p.xp)} XP
                        </p>
                      </div>
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"
                        style={{ boxShadow: "0 0 5px hsl(var(--primary))" }}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
              <button
                onClick={() => openSection("rankings")}
                className="w-full mt-2 font-cyber text-xs text-primary hover:text-primary/80 py-1.5 transition-colors"
              >
                View All Members
              </button>
            </motion.div>

            {/* ---- REP THE TEAM ---- */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -3 }}
              className={`${holoCard} p-5 text-center cursor-pointer group/merch`}
              style={{
                ...holoCardStyle,
                background:
                  "linear-gradient(160deg, hsl(248 26% 9% / 0.9) 0%, hsl(78 80% 20% / 0.18) 100%)",
              }}
              onClick={() => {
                playUI("select");
                openSection("shop");
              }}
            >
              <PanelTitle>Rep The Team</PanelTitle>
              <div
                className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-3 border border-primary/25 group-hover/merch:scale-105 transition-transform duration-300"
                style={{
                  background: "hsl(250 30% 4% / 0.6)",
                  boxShadow: "0 0 24px hsl(var(--primary) / 0.15)",
                }}
              >
                <ShoppingBag className="h-8 w-8 text-primary" />
              </div>
              <p className="font-cyber text-xs text-muted-foreground mb-3">
                Earn points. Claim official PhreshTeam prizes.
              </p>
              <Button variant="neon" size="sm" className="font-cyber w-full">
                Shop Now
              </Button>
            </motion.div>

            {/* ---- LEVEL UP ---- */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -3 }}
              className={`${holoCard} p-5 text-center cursor-pointer`}
              style={{
                ...holoCardStyle,
                background:
                  "linear-gradient(160deg, hsl(248 26% 9% / 0.9) 0%, hsl(270 70% 25% / 0.25) 100%)",
              }}
              onClick={() => {
                playUI("select");
                openSection("games");
              }}
            >
              <PanelTitle>Level Up</PanelTitle>
              <Crown
                className="h-10 w-10 mx-auto text-accent mb-2"
                style={{
                  filter: "drop-shadow(0 0 12px hsl(var(--accent) / 0.7))",
                }}
              />
              <p className="font-gaming font-bold text-lg text-foreground">
                YOUR EXPERIENCE
              </p>
              <p className="font-cyber text-xs text-muted-foreground mt-1 mb-3">
                {userStats
                  ? `${1000 - currentXP} XP to Level ${(userStats.level ?? 1) + 1}`
                  : "Complete quests to earn XP"}
              </p>
              <Button
                size="sm"
                className="font-cyber w-full bg-accent text-accent-foreground hover:bg-accent/90"
                style={{ boxShadow: "0 0 18px hsl(var(--accent) / 0.4)" }}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Start a Quest
              </Button>
            </motion.div>

            {/* ---- PHRESH TIME ---- */}
            <motion.div variants={itemVariants}>
              <PhreshClock />
            </motion.div>
          </div>
        </motion.div>

        {/* footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-10 pb-4"
        >
          <span className="font-gaming text-xs tracking-[0.3em] text-muted-foreground">
            PHRESHTEAMTV <span className="text-primary">♛</span>
          </span>
        </motion.footer>
      </main>

      {/* ===== Section modals — every tab opens in-place, never leaves the hub ===== */}
      {(Object.keys(SECTION_MODALS) as Exclude<SectionKey, "home">[]).map(
        (key) => {
          const { title, Component } = SECTION_MODALS[key];
          return (
            <HoloModal
              key={key}
              open={activeSection === key}
              title={title}
              onClose={closeSection}
            >
              {activeSection === key && <Component />}
            </HoloModal>
          );
        }
      )}
    </div>
  );
};

export default Home;
