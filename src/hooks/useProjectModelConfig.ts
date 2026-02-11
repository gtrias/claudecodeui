/**
 * Custom hook for managing project-specific model configurations
 * Handles loading, saving, and updating model configurations per project
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { projectConfigManager, ProjectModelConfig } from '../utils/projectConfigManager';
import { CLAUDE_MODELS, CURSOR_MODELS, CODEX_MODELS } from '../../shared/modelConstants';

interface UseProjectModelConfigOptions {
  projectId: string;
  autoSave?: boolean;
  saveDelay?: number;
}

interface UseProjectModelConfigReturn {
  config: ProjectModelConfig | null;
  activeProvider: 'claude' | 'cursor' | 'codex' | 'pi';
  claudeModel: string;
  cursorModel: string;
  codexModel: string;
  codexModelChoice: string;
  piModel: string;
  setActiveProvider: (provider: 'claude' | 'cursor' | 'codex' | 'pi') => void;
  setClaudeModel: (model: string) => void;
  setCursorModel: (model: string) => void;
  setCodexModel: (model: string) => void;
  setCodexModelChoice: (choice: string) => void;
  setPiModel: (model: string) => void;
  saveConfig: () => void;
  resetToDefaults: () => void;
  isLoading: boolean;
}

const CODEX_CUSTOM_MODEL = '__custom__';

export const useProjectModelConfig = ({
  projectId,
  autoSave = true,
  saveDelay = 500
}: UseProjectModelConfigOptions): UseProjectModelConfigReturn => {
  const [config, setConfig] = useState<ProjectModelConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load configuration for the current project
  useEffect(() => {
    setIsLoading(true);
    try {
      const projectConfig = projectConfigManager.getOrCreateProjectConfig(projectId);
      setConfig(projectConfig);
    } catch (error) {
      console.error('Error loading project config:', error);
      // Fallback to defaults
      const defaultConfig = projectConfigManager.getDefaultConfig(projectId);
      setConfig(defaultConfig);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Debounced save function
  const saveConfig = useCallback(() => {
    if (!config || !projectId) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        projectConfigManager.saveProjectConfig(projectId, config);
        // Also sync with legacy localStorage for compatibility
        syncLegacyStorage(config);
      } catch (error) {
        console.error('Error saving project config:', error);
      }
    }, saveDelay);
  }, [config, projectId, saveDelay]);

  // Sync with legacy localStorage for backward compatibility
  const syncLegacyStorage = useCallback((configToSync: ProjectModelConfig) => {
    localStorage.setItem('selected-provider', configToSync.activeProvider);
    localStorage.setItem('claude-model', configToSync.models.claude);
    localStorage.setItem('cursor-model', configToSync.models.cursor);
    localStorage.setItem('codex-model', configToSync.models.codex);
    localStorage.setItem('pi-model', configToSync.models.pi);
    if (configToSync.codexModelChoice) {
      localStorage.setItem('codex-model-choice', configToSync.codexModelChoice);
    }
  }, []);

  // Auto-save when config changes
  useEffect(() => {
    if (autoSave && config) {
      saveConfig();
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [config, autoSave, saveConfig]);

  // Provider setter
  const setActiveProvider = useCallback((provider: 'claude' | 'cursor' | 'codex' | 'pi') => {
    setConfig(prev => prev ? { ...prev, activeProvider: provider } : null);
  }, []);

  // Model setters
  const setClaudeModel = useCallback((model: string) => {
    setConfig(prev => prev ? {
      ...prev,
      models: { ...prev.models, claude: model }
    } : null);
  }, []);

  const setCursorModel = useCallback((model: string) => {
    setConfig(prev => prev ? {
      ...prev,
      models: { ...prev.models, cursor: model }
    } : null);
  }, []);

  const setCodexModel = useCallback((model: string) => {
    setConfig(prev => prev ? {
      ...prev,
      models: { ...prev.models, codex: model }
    } : null);
  }, []);

  const setCodexModelChoice = useCallback((choice: string) => {
    setConfig(prev => prev ? {
      ...prev,
      codexModelChoice: choice,
      models: {
        ...prev.models,
        codex: choice !== CODEX_CUSTOM_MODEL ? choice : prev.models.codex
      }
    } : null);
  }, []);

  const setPiModel = useCallback((model: string) => {
    setConfig(prev => prev ? {
      ...prev,
      models: { ...prev.models, pi: model }
    } : null);
  }, []);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    const defaultConfig = projectConfigManager.getDefaultConfig(projectId);
    setConfig(defaultConfig);
  }, [projectId]);

  return {
    config,
    activeProvider: config?.activeProvider || 'claude',
    claudeModel: config?.models.claude || CLAUDE_MODELS.DEFAULT,
    cursorModel: config?.models.cursor || CURSOR_MODELS.DEFAULT,
    codexModel: config?.models.codex || CODEX_MODELS.DEFAULT,
    codexModelChoice: config?.codexModelChoice || CODEX_MODELS.DEFAULT,
    piModel: config?.models.pi || '',
    setActiveProvider,
    setClaudeModel,
    setCursorModel,
    setCodexModel,
    setCodexModelChoice,
    setPiModel,
    saveConfig,
    resetToDefaults,
    isLoading
  };
};
