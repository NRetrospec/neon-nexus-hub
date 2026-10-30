import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2,
  Play,
  ArrowLeft,
  Trophy,
  RotateCw,
  Maximize2,
  Crown,
  Swords,
  Sparkles,
  Loader2,
  Star,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { playUI } from "@/lib/sound";

const QuestsPage = lazy(() => import("@/pages/Quests"));

/**
 * Games — the PhreshTeam arcade.
 *
 * Each title is a self-contained build served from /games/<slug>/ and rendered
 * in an <iframe>, so a game keeps its own engine and assets and can be updated
 * by re-syncing that folder (`npm run game:sync -- <slug>`). The site owns
 * identity and scoring: when a run ends the game posts a `run-end` message
 * (see the game's src/net/bridge.js), we validate it, and write it to Convex
 * with the signed-in player attached.
 *
 * The file is split on purpose:
 *   Games      — data layer (Clerk user, Convex queries/mutations)
 *   GamesView  — pure presentation, takes props (so it can be previewed/tested
 *                without a backend)
 */

type Tab = "arcade" | "quests";

export interface ArcadeGame {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  thumbnail: string;
  embedPath: string;
  scoreLabel: string;
  comingSoon?: boolean;
}

export interface LeaderRow {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  level: number;
  score: number;
  round: number;
  kills: number;
  character: string;
  createdAt: number;
  isCurrentUser: boolean;
}

export interface ArcadeBoard {
  players: LeaderRow[];
  totalPlayers: number;
}

export interface ArcadeStats {
  plays: number;
  bestScore: number;
  bestRound: number;
  bestKills: number;
  totalTimeSec: number;
  lastPlayedAt: number | null;
  rank: number | null;
  totalPlayers: number;
}

export interface RunResult {
  score: number;
  improved: boolean;
  xp: number;
  rank: number | null;
}

const holoCardStyle: React.CSSProperties = {
  background:
    "linear-gradient(160deg, hsl(248 26% 9% / 0.82) 0%, hsl(252 32% 5% / 0.9) 100%)",
  backdropFilter: "blur(14px)",
  boxShadow: "0 8px 32px hsl(250 35% 2% / 0.45)",
};

const fmt = (n: number | undefined | null) =>
  typeof n === "number" ? n.toLocaleString("en-US") : "0";

const renderAvatar = (avatar: string | undefined) => {
  if (!avatar) return <span className="text-lg">🎮</span>;
  const isUrl = avatar.startsWith("http://") || avatar.startsWith("https://");
  if (isUrl) {
    return <img src={avatar} alt="" className="w-8 h-8 rounded-lg object-cover" />;
  }
  return <span className="text-lg">{avatar}</span>;
};

/* ------------------------------------------------------------------ */
/* leaderboard rail                                                    */
/* ------------------------------------------------------------------ */

const LeaderboardRail = ({
  rows,
  myStats,
  scoreLabel,
  totalPlayers,
  loading,
}: {
  rows: LeaderRow[];
  myStats: ArcadeStats | null | undefined;
  scoreLabel: string;
  totalPlayers: number;
  loading: boolean;
}) => (
  <div
    className="relative rounded-2xl border border-white/[0.07] overflow-hidden"
    style={holoCardStyle}
  >
    <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-white/[0.06]">
      <h3 className="font-gaming font-bold text-[11px] tracking-[0.22em] text-foreground/80 uppercase flex items-center gap-2">
        <Trophy className="h-3.5 w-3.5 text-primary" />
        Top Blenders
      </h3>
      <span className="font-cyber text-[10px] text-muted-foreground">
        {totalPlayers} player{totalPlayers === 1 ? "" : "s"}
      </span>
    </div>

    {loading ? (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-5 w-5 text-primary animate-spin" />
      </div>
    ) : rows.length === 0 ? (
      <div className="p-6 text-center">
        <p className="font-cyber text-sm text-muted-foreground">
          No scores yet. Be the first name up here. 👑
        </p>
      </div>
    ) : (
      <ol className="divide-y divide-white/[0.04]">
        {rows.map((row) => (
          <li
            key={row.userId}
            className={`flex items-center gap-3 px-3.5 py-2.5 ${
              row.isCurrentUser ? "bg-primary/10" : ""
            }`}
          >
            <span
              className={`w-6 text-center font-gaming text-xs ${
                row.rank === 1
                  ? "text-yellow-300"
                  : row.rank === 2
                  ? "text-slate-300"
                  : row.rank === 3
                  ? "text-amber-500"
                  : "text-muted-foreground"
              }`}
            >
              {row.rank === 1 ? <Crown className="h-3.5 w-3.5 mx-auto" /> : row.rank}
            </span>
            {renderAvatar(row.avatar)}
            <div className="min-w-0 flex-1">
              <p
                className={`font-cyber text-xs truncate ${
                  row.isCurrentUser ? "text-primary font-semibold" : "text-foreground/90"
                }`}
              >
                {row.username}
                {row.isCurrentUser && " (you)"}
              </p>
              <p className="font-cyber text-[10px] text-muted-foreground">
                round {row.round} · {fmt(row.kills)} blended
              </p>
            </div>
            <div className="text-right">
              <p className="font-gaming text-sm text-primary tabular-nums">
                {fmt(row.score)}
              </p>
              <p className="font-cyber text-[9px] text-muted-foreground uppercase tracking-wider">
                {scoreLabel}
              </p>
            </div>
          </li>
        ))}
      </ol>
    )}

    {myStats && myStats.plays > 0 && (
      <div className="px-4 py-3 border-t border-white/[0.06] flex items-center justify-between">
        <span className="font-cyber text-[10px] uppercase tracking-wider text-muted-foreground">
          Your best
        </span>
        <span className="font-gaming text-sm text-foreground tabular-nums">
          {fmt(myStats.bestScore)}{" "}
          {myStats.rank && (
            <span className="font-cyber text-[10px] text-primary">
              #{myStats.rank}/{myStats.totalPlayers}
            </span>
          )}
        </span>
      </div>
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/* pure view                                                           */
/* ------------------------------------------------------------------ */

interface GamesViewProps {
  games: ArcadeGame[] | undefined;
  board: ArcadeBoard | undefined;
  myStats: ArcadeStats | null | undefined;
  lastResult: RunResult | null;
  /** Slug of the game currently open in the player, or null for the shelf. */
  activeSlug: string | null;
  onSelectGame: (slug: string | null) => void;
  onRunEnd: (payload: Record<string, unknown>) => void;
  canSubmitScores: boolean;
}

export const GamesView = ({
  games,
  board,
  myStats,
  lastResult,
  activeSlug,
  onSelectGame,
  onRunEnd,
  canSubmitScores,
}: GamesViewProps) => {
  const [tab, setTab] = useState<Tab>("arcade");
  const [frameKey, setFrameKey] = useState(0);
  const [booting, setBooting] = useState(true);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const activeGame = useMemo(
    () => games?.find((g) => g.slug === activeSlug) ?? null,
    [games, activeSlug]
  );

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      // Only trust our own game frame, on our own origin.
      if (e.origin !== window.location.origin) return;
      if (iframeRef.current && e.source !== iframeRef.current.contentWindow) return;

      const data = e.data as Record<string, unknown> | null;
      if (!data || data.source !== "phreshsmoothie") return;

      if (data.type === "ready") setBooting(false);
      if (data.type === "run-end") onRunEnd(data);
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onRunEnd]);

  const openGame = (slug: string) => {
    playUI("select");
    onSelectGame(slug);
    setBooting(true);
    setFrameKey((k) => k + 1);
  };

  const closeGame = () => {
    playUI("select");
    onSelectGame(null);
  };

  const relaunch = () => {
    playUI("select");
    setBooting(true);
    setFrameKey((k) => k + 1);
  };

  const fullscreen = () => {
    playUI("select");
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="fixed inset-0 animated-gradient opacity-20 pointer-events-none" />
        <div className="fixed inset-0 cyber-grid opacity-10 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Gamepad2 className="h-4 w-4 text-primary" />
                <span className="font-cyber text-[10px] tracking-[0.3em] text-primary uppercase">
                  PhreshTeam Arcade
                </span>
              </div>
              <h1 className="font-gaming font-bold text-2xl sm:text-3xl text-foreground">
                Games &amp; Quests
              </h1>
              <p className="font-cyber text-sm text-muted-foreground mt-1">
                Play our games, post a score, take the top of the board.
              </p>
            </div>

            {/* Tabs */}
            <div className="inline-flex rounded-xl border border-white/[0.08] p-1 bg-white/[0.02]">
              {(
                [
                  { id: "arcade", label: "Arcade", icon: Gamepad2 },
                  { id: "quests", label: "Quests", icon: Swords },
                ] as const
              ).map((t) => {
                const Icon = t.icon;
                const on = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      playUI("select");
                      setTab(t.id);
                    }}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-cyber text-xs tracking-wide transition-all ${
                      on
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {tab === "quests" ? (
              <motion.div
                key="quests"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="pt-embed"
              >
                <Suspense
                  fallback={
                    <div className="py-20 flex justify-center">
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    </div>
                  }
                >
                  <QuestsPage />
                </Suspense>
              </motion.div>
            ) : (
              <motion.div
                key="arcade"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {/* ---------- PLAYER ---------- */}
                {activeGame ? (
                  <div className="grid lg:grid-cols-[1fr_320px] gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <button
                          onClick={closeGame}
                          className="flex items-center gap-1.5 font-cyber text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" /> All games
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={relaunch}
                            title="Restart the game"
                            className="p-2 rounded-lg text-muted-foreground hover:text-primary border border-white/[0.07] hover:border-primary/40 transition-all"
                          >
                            <RotateCw className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={fullscreen}
                            title="Fullscreen"
                            className="p-2 rounded-lg text-muted-foreground hover:text-primary border border-white/[0.07] hover:border-primary/40 transition-all"
                          >
                            <Maximize2 className="h-3.5 w-3.5" />
                          </button>
                          <a
                            href={activeGame.embedPath}
                            target="_blank"
                            rel="noreferrer"
                            title="Open the game in a new tab"
                            className="p-2 rounded-lg text-muted-foreground hover:text-primary border border-white/[0.07] hover:border-primary/40 transition-all"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>

                      <div
                        ref={stageRef}
                        className="relative rounded-2xl overflow-hidden border border-primary/25 bg-black"
                        style={{
                          boxShadow:
                            "0 0 44px hsl(var(--primary) / 0.16), 0 18px 60px hsl(250 35% 1% / 0.7)",
                        }}
                      >
                        {booting && (
                          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/85">
                            <span
                              className="font-gaming font-black italic text-4xl text-primary animate-pulse"
                              style={{ textShadow: "0 0 30px hsl(var(--primary) / 0.6)" }}
                            >
                              PT
                            </span>
                            <span className="font-cyber text-[11px] tracking-[0.25em] text-muted-foreground uppercase">
                              blending…
                            </span>
                          </div>
                        )}
                        <iframe
                          key={frameKey}
                          ref={iframeRef}
                          src={activeGame.embedPath}
                          title={activeGame.title}
                          onLoad={() => {
                            // Fail-safe: never leave the user on a spinner if the
                            // game never reports in.
                            window.setTimeout(() => setBooting(false), 6000);
                            iframeRef.current?.focus();
                          }}
                          className="w-full block aspect-video bg-black"
                          allow="autoplay; fullscreen; gamepad"
                        />
                      </div>

                      {/* Run summary */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="font-cyber text-xs text-muted-foreground">
                          {activeGame.title} · {activeGame.scoreLabel}
                        </span>
                        {myStats && myStats.plays > 0 && (
                          <>
                            <span className="text-muted-foreground/40">|</span>
                            <span className="font-cyber text-xs text-foreground/80">
                              Best {fmt(myStats.bestScore)}
                            </span>
                            <span className="text-muted-foreground/40">|</span>
                            <span className="font-cyber text-xs text-foreground/80">
                              {myStats.plays} run{myStats.plays === 1 ? "" : "s"}
                            </span>
                          </>
                        )}
                        {lastResult && (
                          <span
                            className={`ml-auto font-cyber text-xs px-2 py-1 rounded-lg ${
                              lastResult.improved
                                ? "bg-primary/15 text-primary"
                                : "bg-white/[0.05] text-muted-foreground"
                            }`}
                          >
                            {lastResult.improved ? "🔥 New best " : "Last run "}
                            {fmt(lastResult.score)}
                            {lastResult.xp ? ` · +${lastResult.xp} XP` : ""}
                          </span>
                        )}
                        {!canSubmitScores && (
                          <span className="ml-auto font-cyber text-xs text-muted-foreground">
                            Sign in to post scores
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <LeaderboardRail
                        rows={board?.players ?? []}
                        myStats={myStats}
                        scoreLabel={activeGame.scoreLabel}
                        totalPlayers={board?.totalPlayers ?? 0}
                        loading={board === undefined}
                      />

                      <div
                        className="rounded-2xl border border-white/[0.07] p-4"
                        style={holoCardStyle}
                      >
                        <h3 className="font-gaming font-bold text-[11px] tracking-[0.22em] text-foreground/80 uppercase mb-2 flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-primary" /> How it scores
                        </h3>
                        <p className="font-cyber text-xs text-muted-foreground leading-relaxed">
                          {activeGame.description}
                        </p>
                        <p className="font-cyber text-[11px] text-primary/80 mt-2">
                          Every finished run is submitted automatically. Only your best
                          run counts on the board — and a new personal best pays XP.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ---------- SHELF ---------- */
                  <div>
                    {games === undefined ? (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="h-56 rounded-2xl border border-white/[0.05] bg-white/[0.02] animate-pulse"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {games.map((game, i) => (
                          <motion.button
                            key={game.slug}
                            onClick={() => openGame(game.slug)}
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 + i * 0.06 }}
                            whileHover={{ y: -6, scale: 1.015 }}
                            className="group relative text-left rounded-2xl overflow-hidden border border-white/[0.07] h-56"
                            style={holoCardStyle}
                          >
                            {game.thumbnail && (
                              <img
                                src={game.thumbnail}
                                alt=""
                                loading="lazy"
                                onError={(e) => {
                                  // Thumbnails live in Convex as plain paths, so a
                                  // typo/missing file is a silent 404. Drop the
                                  // image instead of rendering a broken icon —
                                  // the card's gradient still reads fine.
                                  e.currentTarget.style.display = "none";
                                }}
                                className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:opacity-65 group-hover:scale-105 transition-all duration-700"
                              />
                            )}
                            <div
                              className="absolute inset-0"
                              style={{
                                background:
                                  "linear-gradient(180deg, hsl(252 35% 3% / 0.15) 0%, hsl(252 35% 3% / 0.92) 78%)",
                              }}
                            />
                            <div className="absolute inset-x-0 bottom-0 p-4">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-cyber text-[9px] tracking-[0.22em] uppercase px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                                  Playable
                                </span>
                                {game.comingSoon && (
                                  <span className="font-cyber text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground">
                                    Soon
                                  </span>
                                )}
                              </div>
                              <h3 className="font-gaming font-bold text-lg text-foreground">
                                {game.title}
                              </h3>
                              <p className="font-cyber text-xs text-muted-foreground line-clamp-2">
                                {game.tagline}
                              </p>
                              <span className="mt-2.5 inline-flex items-center gap-1.5 font-cyber text-xs text-primary">
                                <Play className="h-3.5 w-3.5" /> Insert coin
                              </span>
                            </div>
                            <div
                              className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-primary animate-pulse"
                              style={{ boxShadow: "0 0 10px hsl(var(--primary))" }}
                            />
                          </motion.button>
                        ))}

                        {/* Future titles */}
                        <div
                          className="relative rounded-2xl border border-dashed border-white/[0.1] h-56 flex flex-col items-center justify-center text-center p-6"
                          style={{ background: "hsl(250 26% 7% / 0.4)" }}
                        >
                          <Star className="h-6 w-6 text-primary/40 mb-2" />
                          <p className="font-gaming text-sm text-foreground/70">
                            More games loading
                          </p>
                          <p className="font-cyber text-[11px] text-muted-foreground mt-1">
                            This shelf is where every PhreshTeam game lands.
                          </p>
                        </div>
                      </div>
                    )}

                    {games !== undefined && games.length === 0 && (
                      <p className="font-cyber text-xs text-muted-foreground mt-4">
                        No games are live yet. Add one by running{" "}
                        <code className="text-primary">npx convex run games:seedGames</code>.
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* data layer                                                          */
/* ------------------------------------------------------------------ */

const Games = () => {
  const { user } = useUser();
  const dbUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<RunResult | null>(null);

  const games = useQuery(api.games.listGames);
  const submitScore = useMutation(api.games.submitScore);

  const board = useQuery(
    api.games.getLeaderboard,
    activeSlug
      ? {
          slug: activeSlug,
          limit: 10,
          ...(dbUser?._id ? { currentUserId: dbUser._id } : {}),
        }
      : "skip"
  );

  const myStats = useQuery(
    api.games.getPlayerStats,
    activeSlug && dbUser ? { slug: activeSlug, userId: dbUser._id } : "skip"
  );

  const handleRunEnd = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!activeSlug || !user) return;

      const score = Math.max(0, Math.floor(Number(payload.score) || 0));
      const round = Math.max(1, Math.floor(Number(payload.round) || 1));
      const kills = Math.max(0, Math.floor(Number(payload.kills) || 0));
      const durationSec = Math.max(0, Math.floor(Number(payload.timeSec) || 0));
      const character =
        typeof payload.character === "string" ? payload.character : "phresh";
      const perks = Array.isArray(payload.perks)
        ? (payload.perks as unknown[]).filter((p): p is string => typeof p === "string")
        : [];

      try {
        const res = await submitScore({
          clerkId: user.id,
          slug: activeSlug,
          score,
          round,
          kills,
          durationSec,
          character,
          perks,
        });

        setLastResult({
          score: res.score,
          improved: res.improved,
          xp: res.xpAwarded,
          rank: res.rank,
        });

        if (res.improved) {
          toast.success(
            `New personal best: ${fmt(res.score)}` +
              (res.xpAwarded ? ` · +${res.xpAwarded} XP` : ""),
            {
              description: res.rank
                ? `You're #${res.rank} of ${res.totalPlayers} on the board.`
                : undefined,
            }
          );
        } else {
          toast.message(`Run banked: ${fmt(res.score)}`, {
            description: `Personal best stays at ${fmt(res.personalBest)}.`,
          });
        }
      } catch (err) {
        console.error("[arcade] score submit failed", err);
        toast.error("Couldn't save that run — your next one will still count.");
      }
    },
    [activeSlug, submitScore, user]
  );

  return (
    <GamesView
      games={games as ArcadeGame[] | undefined}
      board={board as ArcadeBoard | undefined}
      myStats={myStats as ArcadeStats | null | undefined}
      lastResult={lastResult}
      activeSlug={activeSlug}
      onSelectGame={setActiveSlug}
      onRunEnd={handleRunEnd}
      canSubmitScores={!!user}
    />
  );
};

export default Games;
