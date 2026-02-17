import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // API Keys - for external access to Claude Code UI
  apiKeys: defineTable({
    userId: v.id("users"),
    name: v.string(),
    key: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_key", ["key"]),

  // Credentials - stored secrets (Anthropic key, OpenAI key, etc.)
  credentials: defineTable({
    userId: v.id("users"),
    type: v.string(),
    name: v.string(),
    value: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "type"]),

  // Model Settings - user preferences
  modelSettings: defineTable({
    userId: v.id("users"),
    model: v.string(),
    provider: v.string(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // Migration tracking
  userMigrations: defineTable({
    userId: v.id("users"),
    settingsMigrated: v.boolean(),
    migratedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"]),
});
