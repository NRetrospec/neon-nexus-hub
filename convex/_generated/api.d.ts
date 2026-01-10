/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as chat from "../chat.js";
import type * as files from "../files.js";
import type * as friends from "../friends.js";
import type * as leaderboard from "../leaderboard.js";
import type * as legal from "../legal.js";
import type * as polls from "../polls.js";
import type * as prizes from "../prizes.js";
import type * as profile from "../profile.js";
import type * as quests from "../quests.js";
import type * as seedLegal from "../seedLegal.js";
import type * as social from "../social.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  chat: typeof chat;
  files: typeof files;
  friends: typeof friends;
  leaderboard: typeof leaderboard;
  legal: typeof legal;
  polls: typeof polls;
  prizes: typeof prizes;
  profile: typeof profile;
  quests: typeof quests;
  seedLegal: typeof seedLegal;
  social: typeof social;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
