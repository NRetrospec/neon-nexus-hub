import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import {
  checkRateLimit,
  userRateLimitId,
  sanitizeString,
  validateNumber,
} from "./security";

/**
 * GAME ARCADE
 * -----------
 * PhreshTeam's own games live in `public/games/<slug>/` and are played inside
 * an <iframe> in the hub. When a run ends the game posts
 * `{ source: "phreshsmoothie", type: "run-end", score, round, kills, ... }`
 * to the parent (see the game's src/net/bridge.js); the hub validates the
 * payload again here and stores it.
 *
 * SECURITY: like the rest of this project the client identifies itself with a
 * Clerk id, so treat every submitted number as untrusted input. We clamp hard,
 * rate limit, and only award XP for a genuine personal best — that caps the
 * blast radius of a forged run to one leaderboard row.
 */

/**
 * Path/URL fields must NOT go through sanitizeString(): its escapeHtml() turns
 * "/" into "&#x2F;", which silently corrupts stored asset paths (the iframe then
 * requests "/&" and shows a 404). Validate the shape instead of escaping it.
 */
function validateAssetPath(value: string, field: string): string {
  const v = String(value ?? "").trim();
  if (v.length === 0 || v.length > 300) {
    throw new Error(`${field} must be 1-300 characters`);
  }
  if (/[<>"'`\s]/.test(v)) {
    throw new Error(`${field} contains invalid characters`);
  }
  if (v.includes("..")) {
    throw new Error(`${field} must not contain ".."`);
  }
  if (!(v.startsWith("/") || v.startsWith("http://") || v.startsWith("https://"))) {
    throw new Error(`${field} must start with "/" or be a full URL`);
  }
  return v;
}

const MAX_SCORE = 50_000_000;
const MAX_ROUND = 999;
const MAX_KILLS = 200_000;
const MAX_DURATION_SEC = 60 * 60 * 6; // nobody plays a single run for 6h
const LEADERBOARD_SCAN = 500; // rows scanned to build a top-N (may include repeats)
const RANK_SCAN = 2000; // rows scanned to compute a global rank

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

async function gameBySlug(ctx: QueryCtx, slug: string) {
  return await ctx.db
    .query("games")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .first();
}

/** Collapse run rows into one best row per user, sorted high → low. */
function bestPerUser(rows: Doc<"gameScores">[]) {
  const best = new Map<Id<"users">, Doc<"gameScores">>();
  for (const row of rows) {
    const seen = best.get(row.userId);
    if (!seen || row.score > seen.score) best.set(row.userId, row);
  }
  return Array.from(best.values()).sort((a, b) => b.score - a.score);
}

async function rankFor(
  ctx: QueryCtx,
  gameId: Id<"games">,
  userId: Id<"users">
) {
  const rows = await ctx.db
    .query("gameScores")
    .withIndex("by_game_and_score", (q) => q.eq("gameId", gameId))
    .order("desc")
    .take(RANK_SCAN);

  const best = bestPerUser(rows);
  const index = best.findIndex((r) => r.userId === userId);
  return { rank: index >= 0 ? index + 1 : null, totalPlayers: best.length };
}

/* ------------------------------------------------------------------ */
/* queries                                                             */
/* ------------------------------------------------------------------ */

/** Every playable title, in shelf order. */
export const listGames = query({
  args: {},
  handler: async (ctx) => {
    const games = await ctx.db
      .query("games")
      .withIndex("by_active_and_order", (q) => q.eq("isActive", true))
      .collect();
    return games.sort((a, b) => a.order - b.order);
  },
});

export const getGameBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const slug = String(args.slug || "").slice(0, 64);
    if (!slug) return null;
    return await gameBySlug(ctx, slug);
  },
});

/**
 * Community leaderboard: the best run per player, highest first.
 * Pass currentUserId to also get "where am I" when you're outside the top N.
 */
export const getLeaderboard = query({
  args: {
    slug: v.string(),
    limit: v.optional(v.number()),
    currentUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const game = await gameBySlug(ctx, args.slug);
    if (!game) return { game: null, players: [], current: null, totalPlayers: 0 };

    const limit = Math.min(Math.max(args.limit ?? 10, 1), 50);
    const rows = await ctx.db
      .query("gameScores")
      .withIndex("by_game_and_score", (q) => q.eq("gameId", game._id))
      .order("desc")
      .take(LEADERBOARD_SCAN);

    const best = bestPerUser(rows);

    const players = await Promise.all(
      best.slice(0, limit).map(async (row, i) => {
        const user = await ctx.db.get(row.userId);
        return {
          rank: i + 1,
          userId: row.userId,
          username: user?.username ?? "Unknown",
          avatar: user?.avatar ?? "🎮",
          level: user?.level ?? 1,
          score: row.score,
          round: row.round,
          kills: row.kills,
          durationSec: row.durationSec,
          character: row.character,
          createdAt: row.createdAt,
          isCurrentUser: args.currentUserId === row.userId,
        };
      })
    );

    let current = null;
    if (args.currentUserId) {
      const index = best.findIndex((r) => r.userId === args.currentUserId);
      if (index >= 0) {
        const row = best[index];
        const user = await ctx.db.get(row.userId);
        current = {
          rank: index + 1,
          userId: row.userId,
          username: user?.username ?? "You",
          avatar: user?.avatar ?? "🎮",
          level: user?.level ?? 1,
          score: row.score,
          round: row.round,
          kills: row.kills,
          durationSec: row.durationSec,
          character: row.character,
          createdAt: row.createdAt,
          isCurrentUser: true,
        };
      }
    }

    return { game, players, current, totalPlayers: best.length };
  },
});

/** A player's history on one game: personal best, plays, global rank. */
export const getPlayerStats = query({
  args: { slug: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    const game = await gameBySlug(ctx, args.slug);
    if (!game) return null;

    const runs = await ctx.db
      .query("gameScores")
      .withIndex("by_game_and_user", (q) =>
        q.eq("gameId", game._id).eq("userId", args.userId)
      )
      .collect();

    if (runs.length === 0) {
      return {
        plays: 0,
        bestScore: 0,
        bestRound: 0,
        bestKills: 0,
        totalTimeSec: 0,
        lastPlayedAt: null,
        rank: null,
        totalPlayers: 0,
      };
    }

    const bestScore = Math.max(...runs.map((r) => r.score));
    const bestRound = Math.max(...runs.map((r) => r.round));
    const { rank, totalPlayers } = await rankFor(ctx, game._id, args.userId);

    return {
      plays: runs.length,
      bestScore,
      bestRound,
      bestKills: Math.max(...runs.map((r) => r.kills)),
      totalTimeSec: runs.reduce((sum, r) => sum + r.durationSec, 0),
      lastPlayedAt: Math.max(...runs.map((r) => r.createdAt)),
      rank,
      totalPlayers,
    };
  },
});

/** Cross-game rollup for a profile page ("total arcade XP", best scores). */
export const getUserArcadeSummary = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 10, 1), 50);
    const runs = await ctx.db
      .query("gameScores")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(500);

    const byGame = new Map<
      Id<"games">,
      { bestScore: number; bestRound: number; plays: number; gameId: Id<"games"> }
    >();
    for (const run of runs) {
      const cur = byGame.get(run.gameId);
      if (!cur) {
        byGame.set(run.gameId, {
          gameId: run.gameId,
          bestScore: run.score,
          bestRound: run.round,
          plays: 1,
        });
      } else {
        cur.bestScore = Math.max(cur.bestScore, run.score);
        cur.bestRound = Math.max(cur.bestRound, run.round);
        cur.plays += 1;
      }
    }

    const out = await Promise.all(
      Array.from(byGame.values()).map(async (entry) => {
        const game = await ctx.db.get(entry.gameId);
        return {
          slug: game?.slug ?? "",
          title: game?.title ?? "",
          thumbnail: game?.thumbnail ?? "🎮",
          ...entry,
        };
      })
    );

    return out.sort((a, b) => b.bestScore - a.bestScore).slice(0, limit);
  },
});

/* ------------------------------------------------------------------ */
/* mutations                                                           */
/* ------------------------------------------------------------------ */

/**
 * Record a finished run. Called by the hub (never by the game directly).
 * Returns the updated personal best + rank so the UI can celebrate instantly.
 */
export const submitScore = mutation({
  args: {
    clerkId: v.string(),
    slug: v.string(),
    score: v.number(),
    round: v.number(),
    kills: v.optional(v.number()),
    durationSec: v.optional(v.number()),
    character: v.optional(v.string()),
    perks: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const clerkId = String(args.clerkId || "").slice(0, 100);
    if (!clerkId) throw new Error("Not signed in");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();
    if (!user) throw new Error("Player profile not found");

    await checkRateLimit(
      ctx,
      userRateLimitId(user._id),
      "submitGameScore",
      "default"
    );

    const game = await gameBySlug(ctx, args.slug);
    if (!game || !game.isActive) throw new Error("Game not found");

    const score = validateNumber(args.score, {
      min: 0,
      max: MAX_SCORE,
      integer: true,
      field: "score",
    });
    const round = validateNumber(args.round, {
      min: 1,
      max: MAX_ROUND,
      integer: true,
      field: "round",
    });
    const kills = validateNumber(args.kills ?? 0, {
      min: 0,
      max: MAX_KILLS,
      integer: true,
      field: "kills",
    });
    const durationSec = validateNumber(args.durationSec ?? 0, {
      min: 0,
      max: MAX_DURATION_SEC,
      integer: true,
      field: "durationSec",
    });
    const character = sanitizeString(args.character ?? "phresh", {
      maxLength: 32,
      trim: true,
      field: "character",
    });
    const perks = (args.perks ?? [])
      .slice(0, 32)
      .map((p) => sanitizeString(p, { maxLength: 32, trim: true, field: "perk" }));

    const previousRuns = await ctx.db
      .query("gameScores")
      .withIndex("by_game_and_user", (q) =>
        q.eq("gameId", game._id).eq("userId", user._id)
      )
      .collect();
    const previousBest = previousRuns.reduce((max, r) => Math.max(max, r.score), 0);
    const improved = score > previousBest;

    await ctx.db.insert("gameScores", {
      gameId: game._id,
      userId: user._id,
      score,
      round,
      kills,
      durationSec,
      character,
      perks,
      createdAt: Date.now(),
    });

    // XP only for a genuine personal best — a replay farm shouldn't print XP.
    let xpAwarded = 0;
    if (improved) {
      xpAwarded = Math.min(300, 10 + round * 5 + Math.floor(score / 1000));
      const newXp = Math.min(user.xp + xpAwarded, 999_999_999);
      await ctx.db.patch(user._id, {
        xp: newXp,
        level: Math.floor(newXp / 1000) + 1,
      });
    }

    const { rank, totalPlayers } = await rankFor(ctx, game._id, user._id);

    return {
      ok: true,
      improved,
      score,
      previousBest,
      personalBest: Math.max(previousBest, score),
      xpAwarded,
      rank,
      totalPlayers,
    };
  },
});

/** Register a title on the shelf (idempotent on slug). Run via `npx convex run`. */
export const upsertGame = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    tagline: v.string(),
    description: v.string(),
    thumbnail: v.string(),
    embedPath: v.string(),
    scoreLabel: v.string(),
    accent: v.optional(v.string()),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    comingSoon: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await checkRateLimit(ctx, "games:upsert", "upsertGame", "admin");

    const slug = sanitizeString(args.slug, { maxLength: 64, trim: true, field: "slug" });
    const existing = await gameBySlug(ctx, slug);

    const payload = {
      slug,
      title: sanitizeString(args.title, { maxLength: 80, trim: true, field: "title" }),
      tagline: sanitizeString(args.tagline, { maxLength: 140, trim: true, field: "tagline" }),
      description: sanitizeString(args.description, {
        maxLength: 600,
        trim: true,
        field: "description",
      }),
      thumbnail: validateAssetPath(args.thumbnail, "thumbnail"),
      embedPath: validateAssetPath(args.embedPath, "embedPath"),
      scoreLabel: sanitizeString(args.scoreLabel, {
        maxLength: 24,
        trim: true,
        field: "scoreLabel",
      }),
      accent: args.accent
        ? sanitizeString(args.accent, { maxLength: 40, trim: true, field: "accent" })
        : undefined,
      isActive: args.isActive ?? true,
      comingSoon: args.comingSoon ?? false,
      order: args.order ?? 100,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return { updated: true, slug };
    }

    await ctx.db.insert("games", { ...payload, createdAt: Date.now() });
    return { created: true, slug };
  },
});

/** The launch shelf. Idempotent — safe to call on every environment. */
export const seedGames = mutation({
  args: {},
  handler: async (ctx) => {
    const shelf = [
      {
        slug: "phresh-smoothie",
        title: "Phresh Smoothie",
        tagline: "Blend the bad fruit. Keep the squad alive.",
        description:
          "A roguelite run-and-gun through neon Vice City. Tag between Phresh and Que, bank rounds for a bigger score, and stack perks until the smoothie machine wins — or the raisins do.",
        thumbnail: "/games/phresh-smoothie/assets/level1/bg_city.png",
        embedPath: "/games/phresh-smoothie/index.html",
        scoreLabel: "SCORE",
        accent: "#ff6b9d",
        order: 10,
      },
    ];

    const results: string[] = [];
    for (const game of shelf) {
      const existing = await gameBySlug(ctx, game.slug);
      if (existing) {
        results.push(`${game.slug}: already present`);
        continue;
      }
      await ctx.db.insert("games", {
        ...game,
        isActive: true,
        comingSoon: false,
        createdAt: Date.now(),
      });
      results.push(`${game.slug}: created`);
    }
    return results;
  },
});
