import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// ============ User Profile ============

export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return profile;
  },
});

export const getGitConfig = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) return null;
    return { gitName: profile.gitName, gitEmail: profile.gitEmail };
  },
});

export const updateGitConfig = mutation({
  args: {
    gitName: v.string(),
    gitEmail: v.string(),
  },
  handler: async (ctx, { gitName, gitEmail }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { gitName, gitEmail, updatedAt: now });
    } else {
      await ctx.db.insert("userProfiles", {
        userId,
        gitName,
        gitEmail,
        hasCompletedOnboarding: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

export const hasCompletedOnboarding = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return false;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return profile?.hasCompletedOnboarding ?? false;
  },
});

export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { hasCompletedOnboarding: true, updatedAt: now });
    } else {
      await ctx.db.insert("userProfiles", {
        userId,
        hasCompletedOnboarding: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});
