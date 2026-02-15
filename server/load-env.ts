/**
 * Environment Variable Loader - TypeScript Version
 * Load .env file for Claude Code UI
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
export const loadEnvFile = (envPath: string = path.join(__dirname, '../.env')): void => {
  try {
    if (!fs.existsSync(envPath)) {
      return;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      // Parse KEY=VALUE
      const eqIndex = trimmedLine.indexOf('=');
      if (eqIndex === -1) {
        continue;
      }

      const key = trimmedLine.slice(0, eqIndex).trim();
      const value = trimmedLine.slice(eqIndex + 1).trim();

      // Only set if not already set
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    console.error('Error loading .env file:', error instanceof Error ? error.message : 'Unknown error');
  }
};

export default loadEnvFile;

// Auto-execute on import
loadEnvFile();