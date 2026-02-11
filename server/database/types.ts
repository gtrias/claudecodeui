/**
 * Database Type Definitions for Claude Code UI
 */

import type { User, ApiKeyRow, CredentialRow, EnvironmentVariable } from '../../shared/types.js';

// ==========================================
// Database Connection Types
// ==========================================

export interface DatabaseConfig {
  path: string;
  readonly?: boolean;
  fileMustExist?: boolean;
}

export interface DatabaseStatement<T = unknown> {
  all(): T[];
  get<T = T>(): T | undefined;
  run(...params: unknown[]): { changes: number; lastInsertRowid: number };
  pluck(): unknown;
  iterator(): IterableIterator<T>;
}

export interface DatabaseTransaction {
  run(sql: string, ...params: unknown[]): DatabaseStatement;
  all(sql: string, ...params: unknown[]): DatabaseStatement;
  get<T = unknown>(sql: string, ...params: unknown[]): DatabaseStatement<T>;
}

// ==========================================
// User Database Types
// ==========================================

export interface UserDbOperations {
  hasUsers(): boolean;
  createUser(username: string, passwordHash: string): { id: number; username: string };
  getUserByUsername(username: string): User | undefined;
  getUserById(id: number): User | undefined;
  getFirstUser(): User | undefined;
  updateLastLogin(userId: number): void;
  updateGitConfig(userId: number, gitName: string, gitEmail: string): void;
  getGitConfig(userId: number): { git_name: string; git_email: string } | undefined;
  completeOnboarding(userId: number): void;
  hasCompletedOnboarding(userId: number): boolean;
}

export interface UserDbResult {
  id: number;
  username: string;
}

// ==========================================
// API Keys Database Types
// ==========================================

export interface ApiKeyDbOperations {
  generateApiKey(): string;
  createApiKey(userId: number, keyName: string): { id: number; keyName: string; apiKey: string };
  getApiKeys(userId: number): ApiKeyRow[];
  validateApiKey(apiKey: string): { id: number; username: string; api_key_id: number } | undefined;
  deleteApiKey(userId: number, apiKeyId: number): boolean;
  toggleApiKey(userId: number, apiKeyId: number, isActive: boolean): boolean;
}

export interface ApiKeyValidationResult {
  id: number;
  username: string;
  api_key_id: number;
}

// ==========================================
// Credentials Database Types
// ==========================================

export interface CredentialDbOperations {
  createCredential(
    userId: number,
    credentialName: string,
    credentialType: string,
    credentialValue: string,
    description?: string | null
  ): { id: number; credentialName: string; credentialType: string };
  getCredentials(userId: number, credentialType?: string | null): CredentialRow[];
  getActiveCredential(userId: number, credentialType: string): string | null;
  deleteCredential(userId: number, credentialId: number): boolean;
  toggleCredential(userId: number, credentialId: number, isActive: boolean): boolean;
}

export interface CredentialCreateParams {
  userId: number;
  credentialName: string;
  credentialType: string;
  credentialValue: string;
  description?: string | null;
}

export interface CredentialUpdateParams {
  userId: number;
  credentialId: number;
  isActive: boolean;
}

// ==========================================
// GitHub Tokens (Backward Compatibility)
// ==========================================

export interface GithubTokensDbOperations {
  createGithubToken(
    userId: number,
    tokenName: string,
    githubToken: string,
    description?: string | null
  ): { id: number; credentialName: string };
  getGithubTokens(userId: number): CredentialRow[];
  getActiveGithubToken(userId: number): string | null;
  deleteGithubToken(userId: number, tokenId: number): boolean;
  toggleGithubToken(userId: number, tokenId: number, isActive: boolean): boolean;
}

// ==========================================
// Environment Variables Types
// ==========================================

export interface EnvironmentVariableDbOperations {
  // Global environment variables
  getGlobalEnvironmentVariables(): EnvironmentVariable[];
  createGlobalEnvironmentVariable(key: string, value: string, is_sensitive: boolean): EnvironmentVariable;
  updateGlobalEnvironmentVariable(id: number, value: string, is_sensitive: boolean): boolean;
  deleteGlobalEnvironmentVariable(id: number): boolean;

  // Project environment variables
  getProjectEnvironmentVariables(projectId: string): { global: EnvironmentVariable[]; project: EnvironmentVariable[] };
  createProjectEnvironmentVariable(projectId: string, key: string, value: string, is_sensitive: boolean): EnvironmentVariable;
  updateProjectEnvironmentVariable(projectId: string, id: number, value: string, is_sensitive: boolean): boolean;
  deleteProjectEnvironmentVariable(projectId: string, id: number): boolean;

  // For runners - get merged environment variables for a project
  getMergedEnvironmentVariables(projectId: string): Record<string, string>;
}

// ==========================================
// Database Migration Types
// ==========================================

export interface DatabaseMigration {
  name: string;
  version: number;
  up(db: Database): void;
  down?(db: Database): void;
}

export interface MigrationResult {
  success: boolean;
  migration?: DatabaseMigration;
  error?: Error;
}

// ==========================================
// Database Interface
// ==========================================

export interface Database {
  // SQLite3 Database methods
  prepare(sql: string): DatabaseStatement;
  exec(sql: string): void;
  close(): void;

  // Transaction methods
  transaction<T>(fn: (tx: DatabaseTransaction) => T): T;
  batch<T>(stmts: DatabaseStatement[]): T;

  // Utility methods
  loadExtension(path: string): void;
  function(name: string, fn: (...args: unknown[]) => unknown): void;
  aggregate<T, R>(
    name: string,
    options: {
      start: () => T;
      step: (acc: T, value: unknown) => void;
      finalize: (acc: T) => R;
    }
  ): void;
}