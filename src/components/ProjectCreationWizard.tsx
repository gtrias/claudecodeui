import React, { useState, useEffect } from 'react';
import { X, FolderPlus, GitBranch, Key, ChevronRight, ChevronLeft, Check, Loader2, AlertCircle, FolderOpen, Eye, EyeOff, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { api } from '../utils/api';
import { useTranslation } from 'react-i18next';

export interface GitHubToken {
  id: string;
  name: string;
  is_active: boolean;
  created_at?: string;
}

export interface PathSuggestion {
  path: string;
  type: 'file' | 'directory';
}

export interface ProjectCreationWizardProps {
  onClose: () => void;
  onProjectCreated?: () => void;
}

const ProjectCreationWizard: React.FC<ProjectCreationWizardProps> = ({ onClose, onProjectCreated }) => {
  const { t } = useTranslation();
  // Wizard state
  const [step, setStep] = useState(1); // 1: Choose type, 2: Configure, 3: Confirm
  const [workspaceType, setWorkspaceType] = useState<'existing' | 'new'>('existing'); // 'existing' or 'new' - default to 'existing'

  // Form state
  const [workspacePath, setWorkspacePath] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [selectedGithubToken, setSelectedGithubToken] = useState('');
  const [tokenMode, setTokenMode] = useState<'stored' | 'new' | 'none'>('stored'); // 'stored' | 'new' | 'none'
  const [newGithubToken, setNewGithubToken] = useState('');

  // UI state
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTokens, setAvailableTokens] = useState<GitHubToken[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [pathSuggestions, setPathSuggestions] = useState<PathSuggestion[]>([]);
  const [showPathDropdown, setShowPathDropdown] = useState(false);
  const [showFolderBrowser, setShowFolderBrowser] = useState(false);
  const [browserCurrentPath, setBrowserCurrentPath] = useState('~');
  const [browserFolders, setBrowserFolders] = useState<PathSuggestion[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [showHiddenFolders, setShowHiddenFolders] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [cloneProgress, setCloneProgress] = useState('');

  // Load available GitHub tokens when needed
  useEffect(() => {
    if (step === 2 && workspaceType === 'new' && githubUrl) {
      loadGithubTokens();
    }
  }, [step, workspaceType, githubUrl]);

  // Load path suggestions
  useEffect(() => {
    if (workspacePath.length > 2) {
      loadPathSuggestions(workspacePath);
    } else {
      setPathSuggestions([]);
      setShowPathDropdown(false);
    }
  }, [workspacePath]);

  const loadGithubTokens = async (): Promise<void> => {
    try {
      setLoadingTokens(true);
      const response = await api.get('/settings/credentials?type=github_token');
      const data = await response.json();

      const activeTokens = (data.credentials || []).filter((t: GitHubToken) => t.is_active);
      setAvailableTokens(activeTokens);

      // Auto-select first token if available
      if (activeTokens.length > 0 && !selectedGithubToken) {
        setSelectedGithubToken(activeTokens[0].id.toString());
      }
    } catch (error) {
      console.error('Error loading GitHub tokens:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoadingTokens(false);
    }
  };

  const loadPathSuggestions = async (inputPath: string): Promise<void> => {
    try {
      // Extract the directory to browse (parent of input)
      const lastSlash = inputPath.lastIndexOf('/');
      const dirPath = lastSlash > 0 ? inputPath.substring(0, lastSlash) : '~';

      const response = await api.browseFilesystem(dirPath);
      const data = await response.json();

      if (data.suggestions) {
        // Filter suggestions based on the input, excluding exact match
        const filtered = data.suggestions.filter((s: PathSuggestion) =>
          s.path.toLowerCase().startsWith(inputPath.toLowerCase()) &&
          s.path.toLowerCase() !== inputPath.toLowerCase()
        );
        setPathSuggestions(filtered.slice(0, 5));
        setShowPathDropdown(filtered.length > 0);
      }
    } catch (error) {
      console.error('Error loading path suggestions:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleNext = (): void => {
    setError(null);