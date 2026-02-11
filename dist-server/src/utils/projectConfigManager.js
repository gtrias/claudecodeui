/**
 * Project-specific model configuration manager
 * Manages persistence of model configurations per project using localStorage
 */
import { CLAUDE_MODELS, CURSOR_MODELS, CODEX_MODELS } from '../../shared/modelConstants';
class ProjectConfigManager {
    constructor() {
        Object.defineProperty(this, "STORAGE_KEY", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'project-model-configs'
        });
        Object.defineProperty(this, "GLOBAL_CONFIG_KEY", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'global-model-config'
        });
        Object.defineProperty(this, "MIGRATION_KEY", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'project-config-migrated'
        });
    }
    /**
     * Get configuration for a specific project
     */
    getProjectConfig(projectId) {
        try {
            const configs = this.getAllConfigs();
            return configs[projectId] || null;
        }
        catch (error) {
            console.error('Error getting project config:', error);
            return null;
        }
    }
    /**
     * Save configuration for a specific project
     */
    saveProjectConfig(projectId, config) {
        try {
            const configs = this.getAllConfigs();
            configs[projectId] = {
                ...configs[projectId],
                ...config,
                projectId,
                timestamp: Date.now()
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
        }
        catch (error) {
            console.error('Error saving project config:', error);
            // Handle quota exceeded error
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                console.warn('LocalStorage quota exceeded, attempting to clean up old configs');
                this.cleanupOldConfigs();
                // Retry saving
                try {
                    const configs = this.getAllConfigs();
                    configs[projectId] = {
                        ...configs[projectId],
                        ...config,
                        projectId,
                        timestamp: Date.now()
                    };
                    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
                }
                catch (retryError) {
                    console.error('Failed to save config after cleanup:', retryError);
                }
            }
        }
    }
    /**
     * Get all project configurations
     */
    getAllConfigs() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        }
        catch (error) {
            console.error('Error parsing project configs:', error);
            return {};
        }
    }
    /**
     * Get or create default config for a project
     */
    getOrCreateProjectConfig(projectId) {
        const existing = this.getProjectConfig(projectId);
        if (existing) {
            return existing;
        }
        // Return default config
        return this.getDefaultConfig(projectId);
    }
    /**
     * Get default configuration for a project
     * Falls back to existing global localStorage values
     */
    getDefaultConfig(projectId) {
        return {
            projectId,
            timestamp: Date.now(),
            activeProvider: localStorage.getItem('selected-provider') || 'claude',
            models: {
                claude: localStorage.getItem('claude-model') || CLAUDE_MODELS.DEFAULT,
                cursor: localStorage.getItem('cursor-model') || CURSOR_MODELS.DEFAULT,
                codex: this.getSavedCodexModel(),
                pi: localStorage.getItem('pi-model') || ''
            },
            codexModelChoice: this.getSavedCodexModelChoice()
        };
    }
    /**
     * Get saved Codex model from localStorage
     */
    getSavedCodexModel() {
        const saved = localStorage.getItem('codex-model');
        if (saved)
            return saved;
        // Check if there's a saved choice and use it if it's a preset
        const savedChoice = this.getSavedCodexModelChoice();
        if (savedChoice && savedChoice !== 'custom') {
            return savedChoice;
        }
        return CODEX_MODELS.DEFAULT;
    }
    /**
     * Get saved Codex model choice from localStorage
     */
    getSavedCodexModelChoice() {
        return localStorage.getItem('codex-model-choice') || CODEX_MODELS.DEFAULT;
    }
    /**
     * Clear configuration for a specific project
     */
    clearProjectConfig(projectId) {
        try {
            const configs = this.getAllConfigs();
            delete configs[projectId];
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
        }
        catch (error) {
            console.error('Error clearing project config:', error);
        }
    }
    /**
     * Clear all project configurations
     */
    clearAllConfigs() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        }
        catch (error) {
            console.error('Error clearing all configs:', error);
        }
    }
    /**
     * Cleanup old configurations to free up space
     * Removes configurations older than 30 days and keeps only the 50 most recent
     */
    cleanupOldConfigs() {
        try {
            const configs = this.getAllConfigs();
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            // Filter out old configs
            const recentConfigs = Object.entries(configs)
                .filter(([_, config]) => config.timestamp > thirtyDaysAgo)
                .sort(([, a], [, b]) => b.timestamp - a.timestamp)
                .slice(0, 50);
            const cleanedConfigs = recentConfigs.reduce((acc, [id, config]) => {
                acc[id] = config;
                return acc;
            }, {});
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cleanedConfigs));
            console.log(`Cleaned up ${Object.keys(configs).length - recentConfigs.length} old configurations`);
        }
        catch (error) {
            console.error('Error cleaning up configs:', error);
        }
    }
    /**
     * Check if migration has been completed
     */
    hasMigrated() {
        return localStorage.getItem(this.MIGRATION_KEY) === 'true';
    }
    /**
     * Mark migration as complete
     */
    setMigrated() {
        localStorage.setItem(this.MIGRATION_KEY, 'true');
    }
    /**
     * Export all configurations as JSON
     */
    exportConfigs() {
        const configs = this.getAllConfigs();
        return JSON.stringify(configs, null, 2);
    }
    /**
     * Import configurations from JSON
     */
    importConfigs(jsonString) {
        try {
            const configs = JSON.parse(jsonString);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
            return true;
        }
        catch (error) {
            console.error('Error importing configs:', error);
            return false;
        }
    }
    /**
     * Get statistics about stored configurations
     */
    getConfigStats() {
        const configs = this.getAllConfigs();
        const timestamps = Object.values(configs).map(c => c.timestamp);
        return {
            count: Object.keys(configs).length,
            oldestTimestamp: timestamps.length > 0 ? Math.min(...timestamps) : 0,
            newestTimestamp: timestamps.length > 0 ? Math.max(...timestamps) : 0
        };
    }
}
// Export singleton instance
export const projectConfigManager = new ProjectConfigManager();
