import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { useTranslation } from 'react-i18next';

import { FolderOpen, Folder, Plus, MessageSquare, Clock, ChevronDown, ChevronRight, Edit3, Check, X, Trash2, Settings, FolderPlus, RefreshCw, Sparkles, Edit2, Star, Search, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import ClaudeLogo from './ClaudeLogo';
import CursorLogo from './CursorLogo';
import CodexLogo from './CodexLogo';
import PiLogo from './PiLogo';
import TaskIndicator from './TaskIndicator';
import ProjectCreationWizard from './ProjectCreationWizard';
import { api } from '../utils/api';
import { useTaskMaster } from '../contexts/TaskMasterContext';
import { useTasksSettings } from '../contexts/TasksSettingsContext';
import { IS_PLATFORM } from '../constants/config';

export interface Project {
  name: string;
  path?: string;
  fullPath?: string;
  displayName?: string;
  lastActive?: string;
  sessionCount?: number;
  sessions?: Session[];
  taskmaster?: { hasTaskmaster?: boolean; metadata?: { taskCount?: number; completed?: number } };
}

export interface Session {
  id: string;
  title: string;
  createdAt: string;
  __provider?: string;
}

export interface ReleaseInfo {
  version: string;
  url: string;
  changelog?: string;
}

export interface SidebarProps {
  projects: Project[];
  selectedProject?: Project;
  selectedSession?: Session;
  onProjectSelect: (project: Project) => void;
  onSessionSelect: (session: Session) => void;
  onNewSession: () => void;
  onSessionDelete: (sessionId: string) => void;
  onProjectDelete: (projectName: string) => void;
  isLoading: boolean;
  loadingProgress: number;
  onRefresh: () => void;
  onShowSettings: () => void;
  updateAvailable?: boolean;
  latestVersion?: string;
  currentVersion?: string;
  releaseInfo?: ReleaseInfo;
  onShowVersionModal: () => void;
  isPWA: boolean;
  isMobile: boolean;
  onToggleSidebar: () => void;
}

const formatTimeAgo = (dateString: string, currentTime: Date, t: any): string => {
  const date = new Date(dateString);
  const now = currentTime;

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return t ? t('status.unknown') : 'Unknown';
  }

  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInSeconds < 60) return t ? t('time.justNow') : 'Just now';
  if (diffInMinutes === 1) return t ? t('time.oneMinuteAgo') : '1 min ago';
  if (diffInMinutes < 60) return t ? t('time.minutesAgo', { count: diffInMinutes }) : `${diffInMinutes} mins ago`;
  if (diffInHours === 1) return t ? t('time.oneHourAgo') : '1 hour ago';
  if (diffInHours < 24) return t ? t('time.hoursAgo', { count: diffInHours }) : `${diffInHours} hours ago`;
  if (diffInDays === 1) return t ? t('time.oneDayAgo') : '1 day ago';
  if (diffInDays < 7) return t ? t('time.daysAgo', { count: diffInDays }) : `${diffInDays} days ago`;
  return date.toLocaleDateString();
};

const Sidebar: React.FC<SidebarProps> = ({
  projects,
  selectedProject,
  selectedSession,
  onProjectSelect,
  onSessionSelect,
  onNewSession,
  onSessionDelete,
  onProjectDelete,
  isLoading,
  loadingProgress,
  onRefresh,
  onShowSettings,
  updateAvailable,
  latestVersion,
  currentVersion,
  releaseInfo,
  onShowVersionModal,
  isPWA,
  isMobile,
  onToggleSidebar
}) => {
  const { t } = useTranslation('sidebar');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [loadingSessions, setLoadingSessions] = useState<Record<string, boolean>>({});
  const [additionalSessions, setAdditionalSessions] = useState<Record<string, Session[]>>({});
  const [initialSessionsLoaded, setInitialSessionsLoaded] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [projectSortOrder, setProjectSortOrder] = useState<'name' | 'lastActive'>('name');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [editingSessionName, setEditingSessionName] = useState('');
  const [generatingSummary, setGeneratingSummary] = useState<Record<string, boolean>>({});
  const [searchFilter, setSearchFilter] = useState('');
  const [deletingProjects, setDeletingProjects] = useState<Set<string>>(new Set());
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ project: Project; sessionCount: number } | null>(null);
  const [sessionDeleteConfirmation, setSessionDeleteConfirmation] = useState<{ projectName: string; sessionId: string; sessionTitle: string; provider: string } | null>(null);

  // TaskMaster context
  const { setCurrentProject, mcpServerStatus } = useTaskMaster();
  const { tasksEnabled } = useTasksSettings();

  // Starred projects state - persisted in localStorage
  const [starredProjects, setStarredProjects] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('starredProjects');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (error) {
      console.error('Error loading starred projects:', error instanceof Error ? error.message : 'Unknown error');