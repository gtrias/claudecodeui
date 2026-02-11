/**
 * Migration utility for converting global model configurations to project-specific ones
 * This handles the one-time migration from global localStorage settings to per-project configurations
 */

import { projectConfigManager, ProjectModelConfig } from './projectConfigManager';
import { CLAUDE_MODELS, CURSOR_MODELS, CODEX_MODELS } from '../../shared/modelConstants';

export interface Project {
  name: string;
  path?: string;
  fullPath?: string;
  displayName?: string;
  [key: string]: any;
}

/**
 * Migrate existing global settings to a specific project
 */
export function migrateGlobalToProjectSpecific(projectPath: string): boolean {
  try {
    // Check if migration already done for this project
    const existingConfig = projectConfigManager.getProjectConfig(projectPath);
    if (existingConfig && existingConfig.timestamp > 0) {
      console.log(`Project ${projectPath} already has a configuration, skipping migration`);
      return false;
    }

    // Gather existing global settings
    const globalSettings = {
      provider: localStorage.getItem('selected-provider') || 'claude',
      claudeModel: localStorage.getItem('claude-model') || CLAUDE_MODELS.DEFAULT,
      cursorModel: localStorage.getItem('cursor-model') || CURSOR_MODELS.DEFAULT,
      codexModel: localStorage.getItem('codex-model') || CODEX_MODELS.DEFAULT,
      codexModelChoice: localStorage.getItem('codex-model-choice') || CODEX_MODELS.DEFAULT,
      piModel: localStorage.getItem('pi-model') || '',
      piProvider: localStorage.getItem('pi-provider') || ''
    };

    // Create project configuration
    const projectConfig: ProjectModelConfig = {
      projectId: projectPath,
      timestamp: Date.now(),
      activeProvider: globalSettings.provider as ProjectModelConfig['activeProvider'],
      models: {
        claude: globalSettings.claudeModel,
        cursor: globalSettings.cursorModel,
        codex: globalSettings.codexModel,
        pi: globalSettings.piModel
      },
      codexModelChoice: globalSettings.codexModelChoice
    };

    // Save the project configuration
    projectConfigManager.saveProjectConfig(projectPath, projectConfig);

    console.log(`✅ Migrated global settings to project: ${projectPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error migrating project ${projectPath}:`, error);
    return false;
  }
}

/**
 * Migrate all projects from global settings
 */
export function migrateAllGlobalProjects(projects: Project[]): {
  success: number;
  failed: number;
  skipped: number;
  details: Array<{ project: string; status: string; error?: string }>;
} {
  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    details: [] as Array<{ project: string; status: string; error?: string }>
  };

  if (!projects || projects.length === 0) {
    console.log('No projects to migrate');
    return results;
  }

  console.log(`🚀 Starting migration for ${projects.length} projects...`);

  projects.forEach((project) => {
    const projectPath = project.path || project.fullPath || project.name;

    try {
      const migrated = migrateGlobalToProjectSpecific(projectPath);

      if (migrated) {
        results.success++;
        results.details.push({ project: projectPath, status: 'migrated' });
      } else {
        results.skipped++;
        results.details.push({ project: projectPath, status: 'skipped' });
      }
    } catch (error) {
      results.failed++;
      results.details.push({
        project: projectPath,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Mark migration as complete
  projectConfigManager.setMigrated();

  console.log(`\n📊 Migration Summary:`);
  console.log(`   ✅ Success: ${results.success}`);
  console.log(`   ⏭️  Skipped: ${results.skipped}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   📁 Total: ${projects.length}`);

  return results;
}

/**
 * Check if migration is needed
 */
export function isMigrationNeeded(): boolean {
  return !projectConfigManager.hasMigrated();
}

/**
 * Force re-migration (useful for testing or reset)
 */
export function forceRemigration(projects: Project[]): void {
  console.log('🔄 Forcing re-migration of all projects...');
  projectConfigManager.clearAllConfigs();
  localStorage.removeItem('project-config-migrated');
  migrateAllGlobalProjects(projects);
}

/**
 * Rollback migration (restore global settings from project configs)
 */
export function rollbackMigration(projects: Project[]): void {
  console.log('⏪ Rolling back migration...');

  // Get the most recently used project configuration
  const configs = projectConfigManager.getAllConfigs();
  const configEntries = Object.entries(configs)
    .sort(([, a], [, b]) => b.timestamp - a.timestamp);

  if (configEntries.length > 0) {
    const [_, mostRecentConfig] = configEntries[0];

    // Restore global settings from the most recent config
    localStorage.setItem('selected-provider', mostRecentConfig.activeProvider);
    localStorage.setItem('claude-model', mostRecentConfig.models.claude);
    localStorage.setItem('cursor-model', mostRecentConfig.models.cursor);
    localStorage.setItem('codex-model', mostRecentConfig.models.codex);
    localStorage.setItem('pi-model', mostRecentConfig.models.pi);

    if (mostRecentConfig.codexModelChoice) {
      localStorage.setItem('codex-model-choice', mostRecentConfig.codexModelChoice);
    }

    console.log('✅ Global settings restored from most recent project configuration');
  }

  // Clear project configurations
  projectConfigManager.clearAllConfigs();
  localStorage.removeItem('project-config-migrated');

  console.log('✅ Migration rollback complete');
}

/**
 * Get migration status
 */
export function getMigrationStatus(): {
  hasMigrated: boolean;
  projectCount: number;
  lastMigrationTime: number;
} {
  const stats = projectConfigManager.getConfigStats();

  return {
    hasMigrated: projectConfigManager.hasMigrated(),
    projectCount: stats.count,
    lastMigrationTime: stats.newestTimestamp
  };
}
