/**
 * Database Operations - TypeScript Version
 * Type-safe database operations for Claude Code UI
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type {
  Database as DBInterface,
  DatabaseStatement,
  DatabaseTransaction,
  User,
  ApiKeyRow,
  CredentialRow,
  UserDbOperations,
  ApiKeyDbOperations,
  CredentialDbOperations,
  GithubTokensDbOperations,
  EnvironmentVariableDbOperations,
  UserDbResult,
  ApiKeyValidationResult,
  DatabaseMigration,
} from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

const c = {
  info: (text: string) => `${colors.cyan}${text}${colors.reset}`,
  bright: (text: string) => `${colors.bright}${text}${colors.reset}`,
  dim: (text: string) => `${colors.dim}${text}${colors.reset}`,
};

// Use DATABASE_PATH environment variable if set
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'auth.db');
const INIT_SQL_PATH = path.join(__dirname, 'init.sql');

// Ensure database directory exists
if (process.env.DATABASE_PATH) {
  const dbDir = path.dirname(DB_PATH);
  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log(`Created database directory: ${dbDir}`);
    }
  } catch (error) {
    console.error(`Failed to create database directory ${dbDir}:`, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

// Create database connection
const db = new Database(DB_PATH) as DBInterface;

// Show app installation path
const appInstallPath = path.join(__dirname, '../..');
console.log('');
console.log(c.dim('═'.repeat(60)));
console.log(`${c.info('[INFO]')} App Installation: ${c.bright(appInstallPath)}`);
console.log(`${c.info('[INFO]')} Database: ${c.dim(path.relative(appInstallPath, DB_PATH))}`);
if (process.env.DATABASE_PATH) {
  console.log(`       ${c.dim('(Using custom DATABASE_PATH from environment)')}`);
}
console.log(c.dim('═'.repeat(60)));
console.log('');

// ==========================================
// Database Migrations
// ==========================================

const runMigrations = (): void => {
  try {
    const tableInfo = db.prepare("PRAGMA table_info(users)").all();
    const columnNames = tableInfo.map((col: { name: string }) => col.name);

    if (!columnNames.includes('git_name')) {
      console.log('Running migration: Adding git_name column');
      db.exec('ALTER TABLE users ADD COLUMN git_name TEXT');
    }

    if (!columnNames.includes('git_email')) {
      console.log('Running migration: Adding git_email column');
      db.exec('ALTER TABLE users ADD COLUMN git_email TEXT');
    }

    if (!columnNames.includes('has_completed_onboarding')) {
      console.log('Running migration: Adding has_completed_onboarding column');
      db.exec('ALTER TABLE users ADD COLUMN has_completed_onboarding BOOLEAN DEFAULT 0');
    }

    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

// ==========================================
// Initialize Database
// ==========================================

const initializeDatabase = async (): Promise<void> => {
  try {
    const initSQL = fs.readFileSync(INIT_SQL_PATH, 'utf8');
    db.exec(initSQL);
    console.log('Database initialized successfully');
    runMigrations();
  } catch (error) {
    console.error('Error initializing database:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

// ==========================================
// User Database Operations
// ==========================================

const userDb: UserDbOperations = {
  hasUsers: (): boolean => {
    try {
      const row = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
      return row.count > 0;
    } catch (err) {
      throw err;
    }
  },

  createUser: (username: string, passwordHash: string): UserDbResult => {
    try {
      const stmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
      const result = stmt.run(username, passwordHash) as { lastInsertRowid: number };
      return { id: result.lastInsertRowid, username };
    } catch (err) {
      throw err;
    }
  },

  getUserByUsername: (username: string): User | undefined => {
    try {
      const row = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username) as User | undefined;
      return row;
    } catch (err) {
      throw err;
    }
  },

  getUserById: (userId: number): User | undefined => {
    try {
      const row = db.prepare('SELECT id, username, created_at, last_login FROM users WHERE id = ? AND is_active = 1').get(userId) as User | undefined;
      return row;
    } catch (err) {
      throw err;
    }
  },

  getFirstUser: (): User | undefined => {
    try {
      const row = db.prepare('SELECT id, username, created_at, last_login FROM users WHERE is_active = 1 LIMIT 1').get() as User | undefined;
      return row;
    } catch (err) {
      throw err;
    }
  },

  updateLastLogin: (userId: number): void => {
    try {
      db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(userId);
    } catch (err) {
      throw err;
    }
  },

  updateGitConfig: (userId: number, gitName: string, gitEmail: string): void => {
    try {
      const stmt = db.prepare('UPDATE users SET git_name = ?, git_email = ? WHERE id = ?');
      stmt.run(gitName, gitEmail, userId);
    } catch (err) {
      throw err;
    }
  },

  getGitConfig: (userId: number): { git_name: string; git_email: string } | undefined => {
    try {
      const row = db.prepare('SELECT git_name, git_email FROM users WHERE id = ?').get(userId) as { git_name: string; git_email: string } | undefined;
      return row;
    } catch (err) {
      throw err;
    }
  },

  completeOnboarding: (userId: number): void => {
    try {
      const stmt = db.prepare('UPDATE users SET has_completed_onboarding = 1 WHERE id = ?');
      stmt.run(userId);
    } catch (err) {
      throw err;
    }
  },

  hasCompletedOnboarding: (userId: number): boolean => {
    try {
      const row = db.prepare('SELECT has_completed_onboarding FROM users WHERE id = ?').get(userId) as { has_completed_onboarding: boolean };
      return row?.has_completed_onboarding === true;
    } catch (err) {
      throw err;
    }
  },
};

// ==========================================
// API Keys Database Operations
// ==========================================

const apiKeysDb: ApiKeyDbOperations = {
  generateApiKey: (): string => {
    return 'ck_' + crypto.randomBytes(32).toString('hex');
  },

  createApiKey: (userId: number, keyName: string): { id: number; keyName: string; apiKey: string } => {
    try {
      const apiKey = apiKeysDb.generateApiKey();
      const stmt = db.prepare('INSERT INTO api_keys (user_id, key_name, api_key) VALUES (?, ?, ?)');
      const result = stmt.run(userId, keyName, apiKey) as { lastInsertRowid: number };
      return { id: result.lastInsertRowid, keyName, apiKey };
    } catch (err) {
      throw err;
    }
  },

  getApiKeys: (userId: number): ApiKeyRow[] => {
    try {
      const rows = db.prepare('SELECT id, key_name, api_key, created_at, last_used, is_active FROM api_keys WHERE user_id = ? ORDER BY created_at DESC').all(userId) as ApiKeyRow[];
      return rows;
    } catch (err) {
      throw err;
    }
  },

  validateApiKey: (apiKey: string): ApiKeyValidationResult | undefined => {
    try {
      const row = db.prepare(`
        SELECT u.id, u.username, ak.id as api_key_id
        FROM api_keys ak
        JOIN users u ON ak.user_id = u.id
        WHERE ak.api_key = ? AND ak.is_active = 1 AND u.is_active = 1
      `).get(apiKey) as ApiKeyValidationResult | undefined;

      if (row) {
        db.prepare('UPDATE api_keys SET last_used = CURRENT_TIMESTAMP WHERE id = ?').run(row.api_key_id);
      }

      return row;
    } catch (err) {
      throw err;
    }
  },

  deleteApiKey: (userId: number, apiKeyId: number): boolean => {
    try {
      const stmt = db.prepare('DELETE FROM api_keys WHERE id = ? AND user_id = ?');
      const result = stmt.run(apiKeyId, userId);
      return result.changes > 0;
    } catch (err) {
      throw err;
    }
  },

  toggleApiKey: (userId: number, apiKeyId: number, isActive: boolean): boolean => {
    try {
      const stmt = db.prepare('UPDATE api_keys SET is_active = ? WHERE id = ? AND user_id = ?');
      const result = stmt.run(isActive ? 1 : 0, apiKeyId, userId);
      return result.changes > 0;
    } catch (err) {
      throw err;
    }
  },
};

// ==========================================
// Credentials Database Operations
// ==========================================

const credentialsDb: CredentialDbOperations = {
  createCredential: (
    userId: number,
    credentialName: string,
    credentialType: string,
    credentialValue: string,
    description?: string | null
  ): { id: number; credentialName: string; credentialType: string } => {
    try {
      const stmt = db.prepare('INSERT INTO user_credentials (user_id, credential_name, credential_type, credential_value, description) VALUES (?, ?, ?, ?, ?)');
      const result = stmt.run(userId, credentialName, credentialType, credentialValue, description) as { lastInsertRowid: number };
      return { id: result.lastInsertRowid, credentialName, credentialType };
    } catch (err) {
      throw err;
    }
  },

  getCredentials: (userId: number, credentialType?: string | null): CredentialRow[] => {
    try {
      let query = 'SELECT id, credential_name, credential_type, description, created_at, is_active FROM user_credentials WHERE user_id = ?';
      const params = [userId];

      if (credentialType) {
        query += ' AND credential_type = ?';
        params.push(credentialType);
      }

      query += ' ORDER BY created_at DESC';

      const rows = db.prepare(query).all(...params) as CredentialRow[];
      return rows;
    } catch (err) {
      throw err;
    }
  },

  getActiveCredential: (userId: number, credentialType: string): string | null => {
    try {
      const row = db.prepare('SELECT credential_value FROM user_credentials WHERE user_id = ? AND credential_type = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1').get(userId, credentialType) as { credential_value: string } | undefined;
      return row?.credential_value || null;
    } catch (err) {
      throw err;
    }
  },

  deleteCredential: (userId: number, credentialId: number): boolean => {
    try {
      const stmt = db.prepare('DELETE FROM user_credentials WHERE id = ? AND user_id = ?');
      const result = stmt.run(credentialId, userId);
      return result.changes > 0;
    } catch (err) {
      throw err;
    }
  },

  toggleCredential: (userId: number, credentialId: number, isActive: boolean): boolean => {
    try {
      const stmt = db.prepare('UPDATE user_credentials SET is_active = ? WHERE id = ? AND user_id = ?');
      const result = stmt.run(isActive ? 1 : 0, credentialId, userId);
      return result.changes > 0;
    } catch (err) {
      throw err;
    }
  },
};

// ==========================================
// Backward Compatibility - GitHub Tokens
// ==========================================

const githubTokensDb: GithubTokensDbOperations = {
  createGithubToken: (userId: number, tokenName: string, githubToken: string, description?: string | null): { id: number; credentialName: string } => {
    return credentialsDb.createCredential(userId, tokenName, 'github_token', githubToken, description);
  },
  getGithubTokens: (userId: number): CredentialRow[] => {
    return credentialsDb.getCredentials(userId, 'github_token');
  },
  getActiveGithubToken: (userId: number): string | null => {
    return credentialsDb.getActiveCredential(userId, 'github_token');
  },
  deleteGithubToken: (userId: number, tokenId: number): boolean => {
    return credentialsDb.deleteCredential(userId, tokenId);
  },
  toggleGithubToken: (userId: number, tokenId: number, isActive: boolean): boolean => {
    return credentialsDb.toggleCredential(userId, tokenId, isActive);
  },
};

// ==========================================
// Environment Variables Database Operations
// ==========================================

const environmentVariablesDb: EnvironmentVariableDbOperations = {
  // Global environment variables
  getGlobalEnvironmentVariables: (): EnvironmentVariable[] => {
    try {
      const rows = db.prepare(
        'SELECT id, key, value, scope, is_sensitive, created_at, updated_at FROM environment_variables WHERE scope = ? ORDER BY key'
      ).all('global') as EnvironmentVariable[];
      return rows;
    } catch (err) {
      throw err;
    }
  },

  createGlobalEnvironmentVariable: (key: string, value: string, is_sensitive: boolean): EnvironmentVariable => {
    try {
      const stmt = db.prepare(
        'INSERT INTO environment_variables (key, value, scope, is_sensitive) VALUES (?, ?, ?, ?)'
      );
      const result = stmt.run(key, value, 'global', is_sensitive ? 1 : 0) as { lastInsertRowid: number };
      const created = db.prepare(
        'SELECT id, key, value, scope, is_sensitive, created_at, updated_at FROM environment_variables WHERE id = ?'
      ).get(result.lastInsertRowid) as EnvironmentVariable;
      return created;
    } catch (err) {
      throw err;
    }
  },

  updateGlobalEnvironmentVariable: (id: number, value: string, is_sensitive: boolean): boolean => {
    try {
      const stmt = db.prepare(
        'UPDATE environment_variables SET value = ?, is_sensitive = ?, updated_at = strftime(\'%s\', \'sub\') WHERE id = ? AND scope = ?'
      );
      const result = stmt.run(value, is_sensitive ? 1 : 0, id, 'global');
      return result.changes > 0;
    } catch (err) {
      throw err;
    }
  },

  deleteGlobalEnvironmentVariable: (id: number): boolean => {
    try {
      const stmt = db.prepare('DELETE FROM environment_variables WHERE id = ? AND scope = ?');
      const result = stmt.run(id, 'global');
      return result.changes > 0;
    } catch (err) {
      throw err;
    }
  },

  // Project environment variables
  getProjectEnvironmentVariables: (projectId: string): { global: EnvironmentVariable[]; project: EnvironmentVariable[] } => {
    try {
      const globalRows = db.prepare(
        'SELECT id, key, value, scope, is_sensitive, created_at, updated_at FROM environment_variables WHERE scope = ? ORDER BY key'
      ).all('global') as EnvironmentVariable[];

      const projectScope = `project:${projectId}`;
      const projectRows = db.prepare(
        'SELECT id, key, value, scope, is_sensitive, created_at, updated_at FROM environment_variables WHERE scope = ? ORDER BY key'
      ).all(projectScope) as EnvironmentVariable[];

      return { global: globalRows, project: projectRows };
    } catch (err) {
      throw err;
    }
  },

  createProjectEnvironmentVariable: (projectId: string, key: string, value: string, is_sensitive: boolean): EnvironmentVariable => {
    try {
      const scope = `project:${projectId}`;
      const stmt = db.prepare(
        'INSERT INTO environment_variables (key, value, scope, is_sensitive) VALUES (?, ?, ?, ?)'
      );
      const result = stmt.run(key, value, scope, is_sensitive ? 1 : 0) as { lastInsertRowid: number };
      const created = db.prepare(
        'SELECT id, key, value, scope, is_sensitive, created_at, updated_at FROM environment_variables WHERE id = ?'
      ).get(result.lastInsertRowid) as EnvironmentVariable;
      return created;
    } catch (err) {
      throw err;
    }
  },

  updateProjectEnvironmentVariable: (projectId: string, id: number, value: string, is_sensitive: boolean): boolean => {
    try {
      const scope = `project:${projectId}`;
      const stmt = db.prepare(
        'UPDATE environment_variables SET value = ?, is_sensitive = ?, updated_at = strftime(\'%s\', \'sub\') WHERE id = ? AND scope = ?'
      );
      const result = stmt.run(value, is_sensitive ? 1 : 0, id, scope);
      return result.changes > 0;
    } catch (err) {
      throw err;
    }
  },

  deleteProjectEnvironmentVariable: (projectId: string, id: number): boolean => {
    try {
      const scope = `project:${projectId}`;
      const stmt = db.prepare('DELETE FROM environment_variables WHERE id = ? AND scope = ?');
      const result = stmt.run(id, scope);
      return result.changes > 0;
    } catch (err) {
      throw err;
    }
  },

  // For runners - get merged environment variables for a project
  getMergedEnvironmentVariables: (projectId: string): Record<string, string> => {
    try {
      const globalRows = db.prepare(
        'SELECT key, value FROM environment_variables WHERE scope = ?'
      ).all('global') as { key: string; value: string }[];

      const projectScope = `project:${projectId}`;
      const projectRows = db.prepare(
        'SELECT key, value FROM environment_variables WHERE scope = ?'
      ).all(projectScope) as { key: string; value: string }[];

      // Merge: global (lower priority) -> project (higher priority)
      const merged: Record<string, string> = {};
      for (const row of globalRows) {
        merged[row.key] = row.value;
      }
      for (const row of projectRows) {
        merged[row.key] = row.value;
      }
      return merged;
    } catch (err) {
      // If table doesn't exist yet, return empty object
      if (err instanceof Error && err.message.includes('no such table')) {
        return {};
      }
      throw err;
    }
  },
};

// ==========================================
// Export
// ==========================================

export {
  db,
  initializeDatabase,
  userDb,
  apiKeysDb,
  credentialsDb,
  githubTokensDb,
  environmentVariablesDb,
};
