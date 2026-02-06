import React, { useState, useEffect, useRef } from 'react';
import { GitBranch, GitCommit, Plus, Minus, RefreshCw, Check, X, ChevronDown, ChevronRight, Info, History, FileText, Mic, MicOff, Sparkles, Download, RotateCcw, Trash2, AlertTriangle, Upload } from 'lucide-react';
import { MicButton } from './MicButton';
import { authenticatedFetch } from '../utils/api';
import DiffViewer from './DiffViewer';

export interface GitStatus {
  branch?: string;
  modified?: string[];
  added?: string[];
  deleted?: string[];
  untracked?: string[];
  error?: string;
  details?: Record<string, any>;
}

export interface GitPanelProps {
  selectedProject?: { name?: string; path?: string; fullPath?: string };
  isMobile?: boolean;
  onFileOpen?: (filePath: string) => void;
}

const GitPanel: React.FC<GitPanelProps> = ({ selectedProject, isMobile, onFileOpen }) => {
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [gitDiff, setGitDiff] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isCommitting, setIsCommitting] = useState(false);
  const [currentBranch, setCurrentBranch] = useState('');
  const [branches, setBranches] = useState<string[]>([]);
  const [wrapText, setWrapText] = useState(true);
  const [showLegend, setShowLegend] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showNewBranchModal, setShowNewBranchModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [activeView, setActiveView] = useState<'changes' | 'history'>('changes');
  const [recentCommits, setRecentCommits] = useState<any[]>([]);
  const [expandedCommits, setExpandedCommits] = useState<Set<string>>(new Set());
  const [commitDiffs, setCommitDiffs] = useState<Record<string, string>>({});
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [remoteStatus, setRemoteStatus] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCommitAreaCollapsed, setIsCommitAreaCollapsed] = useState(isMobile); // Collapsed by default on mobile
  const [confirmAction, setConfirmAction] = useState<{ type: 'discard' | 'commit' | 'pull' | 'push', file?: string, message?: string } | null>(null);
  const [isCreatingInitialCommit, setIsCreatingInitialCommit] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current provider from localStorage (same as ChatInterface does)
  const [provider, setProvider] = useState(() => {
    return localStorage.getItem('selected-provider') || 'claude';
  });

  // Listen for provider changes in localStorage
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent): void => {
      const newProvider = event.newValue || 'claude';
      setProvider(newProvider);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchGitStatus();
      fetchBranches();
      fetchRemoteStatus();
      if (activeView === 'history') {
        fetchRecentCommits();
      }
    }
  }, [selectedProject, activeView]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowBranchDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchGitStatus = async (): Promise<void> => {
    if (!selectedProject) return;
    
    setIsLoading(true);
    try {
      const response = await authenticatedFetch(`/api/git/status?project=${encodeURIComponent(selectedProject.name)}`);
      const data = await response.json();
      
      if (data.error) {
        console.error('Git status error:', data.error);
        setGitStatus({ error: data.error, details: data.details });
      } else {
        setGitStatus(data);
        setCurrentBranch(data.branch || 'main');
        
        // Auto-select all changed files
        const allFiles = new Set<string>([
          ...(data.modified || []),
          ...(data.added || []),
          ...(data.deleted || []),
          ...(data.untracked || [])
        ]);
        setSelectedFiles(allFiles);
      }
    } catch (error) {
      console.error('Error fetching git status:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };