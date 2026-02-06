import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ChatInterface from './ChatInterface';
import FileTree from './FileTree';
import CodeEditor from './CodeEditor';
import StandaloneShell from './StandaloneShell';
import GitPanel from './GitPanel';
import ErrorBoundary from './ErrorBoundary';
import ClaudeLogo from './ClaudeLogo';
import CursorLogo from './CursorLogo';
import CodexLogo from './CodexLogo';
import PiLogo from './PiLogo';
import TaskList, { Task } from './TaskList';
import TaskDetail from './TaskDetail';
import PRDEditor from './PRDEditor';
import Tooltip from './Tooltip';
import { useTaskMaster } from '../contexts/TaskMasterContext';
import { useTasksSettings } from '../contexts/TasksSettingsContext';
import { api } from '../utils/api';

export interface MainContentProps {
  selectedProject?: { name?: string; path?: string; fullPath?: string };
  selectedSession?: { __provider?: string; id?: string };
  activeTab: string;
  setActiveTab: (tab: string) => void;
  ws?: WebSocket;
  sendMessage: (message: string) => void;
  latestMessage?: string;
  isMobile: boolean;
  isPWA: boolean;
  onMenuClick: () => void;
  isLoading: boolean;
  onInputFocusChange: (isFocused: boolean) => void;
  onSessionActive: () => void;
  onSessionInactive: () => void;
  onSessionProcessing: () => void;
  onSessionNotProcessing: () => void;
  processingSessions: Set<string>;
  onReplaceTemporarySession: (tempId: string, realId: string) => void;
  onNavigateToSession: (sessionId: string) => void;
  onShowSettings: () => void;
  autoExpandTools: boolean;
  showRawParameters: boolean;
  showThinking: boolean;
  autoScrollToBottom: boolean;
  sendByCtrlEnter: boolean;
  externalMessageUpdate: number;
}

const MainContent: React.FC<MainContentProps> = ({
  selectedProject,
  selectedSession,
  activeTab,
  setActiveTab,
  ws,
  sendMessage,
  latestMessage,
  isMobile,
  isPWA,
  onMenuClick,
  isLoading,
  onInputFocusChange,
  onSessionActive,
  onSessionInactive,
  onSessionProcessing,
  onSessionNotProcessing,
  processingSessions,
  onReplaceTemporarySession,
  onNavigateToSession,
  onShowSettings,
  autoExpandTools,
  showRawParameters,
  showThinking,
  autoScrollToBottom,
  sendByCtrlEnter,
  externalMessageUpdate
}) => {
  const { t } = useTranslation();
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [editorWidth, setEditorWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const [editorExpanded, setEditorExpanded] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  
  // PRD Editor state
  const [showPRDEditor, setShowPRDEditor] = useState(false);
  const [selectedPRD, setSelectedPRD] = useState<PRD | null>(null);
  const [existingPRDs, setExistingPRDs] = useState<PRD[]>([]);
  const [prdNotification, setPRDNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // TaskMaster context
  const { tasks, currentProject, refreshTasks, setCurrentProject } = useTaskMaster();
  const { tasksEnabled, isTaskMasterInstalled, isTaskMasterReady } = useTasksSettings();
  
  // Only show tasks tab if TaskMaster is installed and enabled
  const shouldShowTasksTab = tasksEnabled && isTaskMasterInstalled;

  // Sync selectedProject with TaskMaster context
  useEffect(() => {
    if (selectedProject && selectedProject !== currentProject) {
      setCurrentProject(selectedProject);
    }
  }, [selectedProject, currentProject, setCurrentProject]);

  // Switch away from tasks tab when tasks are disabled or TaskMaster is not installed
  useEffect(() => {
    if (!shouldShowTasksTab && activeTab === 'tasks') {
      setActiveTab('chat');
    }
  }, [shouldShowTasksTab, activeTab, setActiveTab]);