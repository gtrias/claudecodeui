import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// ============ Environment Variables ============

export const getGlobalEnvironmentVariables = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const vars = await ctx.db
      .query("environmentVariables")
      .withIndex("by_user_scope", (q) => q.eq("userId", userId).eq("scope", "global"))
      .collect();

    return vars;
  },
});

export const getProjectEnvironmentVariables = query({
  args: { projectId: v.string() },
  handler: async (ctx, { projectId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return { global: [], project: [] };

    const globalVars = await ctx.db
      .query("environmentVariables")
      .withIndex("by_user_scope", (q) => q.eq("userId", userId).eq("scope", "global"))
      .collect();

    const projectScope = `project:${projectId}`;
    const projectVars = await ctx.db
      .query("environmentVariables")
      .withIndex("by_user_scope", (q) => q.eq("userId", userId).eq("scope", projectScope))
      .collect();

    return { global: globalVars, project: projectVars };
  },
});

export const getMergedEnvironmentVariables = query({
  args: { projectId: v.string() },
  handler: async (ctx, { projectId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return {};

    const globalVars = await ctx.db
      .query("environmentVariables")
      .withIndex("by_user_scope", (q) => q.eq("userId", userId).eq("scope", "global"))
      .collect();

    const projectScope = `project:${projectId}`;
    const projectVars = await ctx.db
      .query("environmentVariables")
      .withIndex("by_user_scope", (q) => q.eq("userId", userId).eq("scope", projectScope))
      .collect();

    // Merge: global first, project overrides
    const merged: Record<string, string> = {};
    for (const envVar of globalVars) {
      merged[envVar.key] = envVar.value;
    }
    for (const envVar of projectVars) {
      merged[envVar.key] = envVar.value;
    }
    return merged;
  },
});

export const createEnvironmentVariable = mutation({
  args: {
    key: v.string(),
    value: v.string(),
    scope: v.string(),
    isSensitive: v.boolean(),
  },
  handler: async (ctx, { key, value, scope, isSensitive }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    const id = await ctx.db.insert("environmentVariables", {
      userId,
      key,
      value,
      scope,
      isSensitive,
      createdAt: now,
      updatedAt: now,
    });

    return { id };
  },
});

export const updateEnvironmentVariable = mutation({
  args: {
    id: v.id("environmentVariables"),
    value: v.string(),
    isSensitive: v.boolean(),
  },
  handler: async (ctx, { id, value, isSensitive }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Environment variable not found");
    }

    await ctx.db.patch(id, { value, isSensitive, updatedAt: Date.now() });
    return { success: true };
  },
});

export const deleteEnvironmentVariable = mutation({
  args: { id: v.id("environmentVariables") },
  handler: async (ctx, { id }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Environment variable not found");
    }

    await ctx.db.delete(id);
    return { success: true };
  },
});
