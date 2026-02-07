/*
 * MainContent.tsx - Main Content Area with Session Protection Props Passthrough
 * 
 * SESSION PROTECTION PASSTHROUGH:
 * ===============================
 * 
 * This component serves as a passthrough layer for Session Protection functions:
 * - Receives session management functions from App.tsx
 * - Passes them down to ChatInterface.tsx
 * 
 * No session protection logic is implemented here - it's purely a props bridge.
 */

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
import TaskList from './TaskList';
import TaskDetail from './TaskDetail';
import PRDEditor from './PRDEditor';
import Tooltip from './Tooltip';
import { useTaskMaster } from '../contexts/TaskMasterContext';
import { useTasksSettings } from '../contexts/TasksSettingsContext';
import { api } from '../utils/api';

export interface MainContentProps {
  selectedProject: { id: string; name: string; path: string } | null;
  selectedSession: string | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  ws?: WebSocket | null;
  sendMessage?: (message: string) => void;
  latestMessage?: string;
  isMobile: boolean;
  isPWA?: boolean;
  onMenuClick?: () => void;
  isLoading?: boolean;
  onInputFocusChange?: (focused: boolean) => void;
  // Session Protection Props: Functions passed down from App.tsx to manage active session state
  onSessionActive?: () => void;
  onSessionInactive?: () => void;
  onSessionProcessing?: () => void;
  onSessionNotProcessing?: () => void;
  processingSessions?: Set<string>;
  onReplaceTemporarySession?: (tempSessionId: string, realSessionId: string) => void;
  onNavigateToSession?: (sessionId: string) => void;
  onShowSettings?: () => void;
  autoExpandTools?: boolean;
  showRawParameters?: boolean;
  showThinking?: boolean;
  autoScrollToBottom?: boolean;
  sendByCtrlEnter?: boolean;
  externalMessageUpdate?: number;
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
  isPWA = false,
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
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [editorWidth, setEditorWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const [editorExpanded, setEditorExpanded] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  
  // PRD Editor state
  const [showPRDEditor, setShowPRDEditor] = useState(false);
  const [selectedPRD, setSelectedPRD] = useState<string | null>(null);
  const [existingPRDs, setExistingPRDs] = useState<string[]>([]);
  const [prdNotification, setPRDNotification] = useState<string | null>(null);
  
  // TaskMaster context
  const { tasks, currentProject, refreshTasks, setCurrentProject } = useTaskMaster();