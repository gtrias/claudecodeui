import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// ============ Helper Functions ============

function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "ccui_";
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

function maskApiKey(key: string): string {
  return key.substring(0, 10) + "...";
}

// ============ API Keys ============

export const getApiKeys = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return keys.map((key) => ({
      ...key,
      key: maskApiKey(key.key),
    }));
  },
});

export const validateApiKey = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const apiKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (!apiKey || !apiKey.isActive) return null;

    return { userId: apiKey.userId, name: apiKey.name };
  },
});

export const createApiKey = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const key = generateApiKey();
    const id = await ctx.db.insert("apiKeys", {
      userId,
      name,
      key,
      isActive: true,
      createdAt: Date.now(),
    });

    return { id, name, key };
  },
});

export const deleteApiKey = mutation({
  args: { id: v.id("apiKeys") },
  handler: async (ctx, { id }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const apiKey = await ctx.db.get(id);
    if (!apiKey || apiKey.userId !== userId) {
      throw new Error("API key not found");
    }

    await ctx.db.delete(id);
    return { success: true };
  },
});

export const toggleApiKey = mutation({
  args: { id: v.id("apiKeys"), isActive: v.boolean() },
  handler: async (ctx, { id, isActive }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const apiKey = await ctx.db.get(id);
    if (!apiKey || apiKey.userId !== userId) {
      throw new Error("API key not found");
    }

    await ctx.db.patch(id, { isActive });
    return { success: true };
  },
});

// ============ Credentials ============

export const getCredentials = query({
  args: { type: v.optional(v.string()) },
  handler: async (ctx, { type }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const credentials = await ctx.db
      .query("credentials")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Filter by type if provided
    const filtered = type
      ? credentials.filter((c) => c.type === type)
      : credentials;

    // Don't return the actual value for security
    return filtered.map((c) => ({
      _id: c._id,
      type: c.type,
      name: c.name,
      description: c.description,
      isActive: c.isActive,
      createdAt: c.createdAt,
    }));
  },
});

export const getActiveCredential = query({
  args: { type: v.string() },
  handler: async (ctx, { type }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const credentials = await ctx.db
      .query("credentials")
      .withIndex("by_user_type", (q) => q.eq("userId", userId).eq("type", type))
      .collect();

    const active = credentials.find((c) => c.isActive);
    return active?.value || null;
  },
});

export const createCredential = mutation({
  args: {
    type: v.string(),
    name: v.string(),
    value: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { type, name, value, description }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const id = await ctx.db.insert("credentials", {
      userId,
      type,
      name,
      value,
      description,
      isActive: true,
      createdAt: Date.now(),
    });

    return { id, type, name };
  },
});

export const updateCredential = mutation({
  args: { id: v.id("credentials"), value: v.string() },
  handler: async (ctx, { id, value }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const credential = await ctx.db.get(id);
    if (!credential || credential.userId !== userId) {
      throw new Error("Credential not found");
    }

    await ctx.db.patch(id, { value });
    return { success: true };
  },
});

export const deleteCredential = mutation({
  args: { id: v.id("credentials") },
  handler: async (ctx, { id }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const credential = await ctx.db.get(id);
    if (!credential || credential.userId !== userId) {
      throw new Error("Credential not found");
    }

    await ctx.db.delete(id);
    return { success: true };
  },
});

export const toggleCredential = mutation({
  args: { id: v.id("credentials"), isActive: v.boolean() },
  handler: async (ctx, { id, isActive }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const credential = await ctx.db.get(id);
    if (!credential || credential.userId !== userId) {
      throw new Error("Credential not found");
    }

    await ctx.db.patch(id, { isActive });
    return { success: true };
  },
});

// ============ Model Settings ============

export const getModelSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const settings = await ctx.db
      .query("modelSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return settings;
  },
});

export const updateModelSettings = mutation({
  args: { model: v.string(), provider: v.string() },
  handler: async (ctx, { model, provider }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("modelSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { model, provider, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("modelSettings", {
        userId,
        model,
        provider,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// ============ Migration ============

export const checkMigrationStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return { migrated: false };

    const migration = await ctx.db
      .query("userMigrations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return { migrated: migration?.settingsMigrated || false };
  },
});

export const migrateSettings = mutation({
  args: {
    apiKeys: v.array(
      v.object({
        name: v.string(),
        key: v.string(),
        isActive: v.boolean(),
      })
    ),
    credentials: v.array(
      v.object({
        type: v.string(),
        name: v.string(),
        value: v.string(),
        description: v.optional(v.string()),
        isActive: v.boolean(),
      })
    ),
    modelSettings: v.optional(
      v.object({
        model: v.string(),
        provider: v.string(),
      })
    ),
  },
  handler: async (ctx, { apiKeys, credentials, modelSettings }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if already migrated
    const existing = await ctx.db
      .query("userMigrations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing?.settingsMigrated) {
      return { success: true, message: "Already migrated" };
    }

    // Migrate API keys
    for (const key of apiKeys) {
      await ctx.db.insert("apiKeys", {
        userId,
        name: key.name,
        key: key.key,
        isActive: key.isActive,
        createdAt: Date.now(),
      });
    }

    // Migrate credentials
    for (const cred of credentials) {
      await ctx.db.insert("credentials", {
        userId,
        type: cred.type,
        name: cred.name,
        value: cred.value,
        description: cred.description,
        isActive: cred.isActive,
        createdAt: Date.now(),
      });
    }

    // Migrate model settings
    if (modelSettings) {
      await ctx.db.insert("modelSettings", {
        userId,
        model: modelSettings.model,
        provider: modelSettings.provider,
        updatedAt: Date.now(),
      });
    }

    // Mark migration complete
    if (existing) {
      await ctx.db.patch(existing._id, {
        settingsMigrated: true,
        migratedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("userMigrations", {
        userId,
        settingsMigrated: true,
        migratedAt: Date.now(),
      });
    }

    return { success: true, message: "Migration complete" };
  },
});
