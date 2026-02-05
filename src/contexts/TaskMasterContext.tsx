import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';
import { useWebSocket } from './WebSocketContext';

// Type definitions
export interface Project {
  id: string;
  name: string;
  path: string;
  taskmaster?: {
    enabled: boolean;
    lastTask?: string;
  };
}

export interface MCPStatus {
  status: 'connected' | 'disconnected' | 'error';
  servers?: { name: string; enabled: boolean }[];
  error?: string;
}

export interface Task {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: unknown;
  createdAt: string;
}

export interface TaskMasterContextType {
  // TaskMaster project state
  projects: Project[];
  currentProject: Project | null;
  projectTaskMaster: any | null;
  
  // MCP server state
  mcpServerStatus: MCPStatus | null;
  
  // Tasks state
  tasks: Task[];
  nextTask: Task | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingTasks: boolean;
  isLoadingMCP: boolean;
  
  // Error state
  error: { message: string; context: string; timestamp: string } | null;
  
  // Actions
  refreshProjects: () => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  refreshTasks: () => Promise<void>;
  refreshMCPStatus: () => Promise<void>;
  clearError: () => void;
}

const TaskMasterContext = createContext<TaskMasterContextType>({
  projects: [],
  currentProject: null,
  projectTaskMaster: null,
  mcpServerStatus: null,
  tasks: [],
  nextTask: null,
  isLoading: false,
  isLoadingTasks: false,
  isLoadingMCP: false,
  error: null,
  refreshProjects: () => Promise.resolve(),
  setCurrentProject: () => {},
  refreshTasks: () => Promise.resolve(),
  refreshMCPStatus: () => Promise.resolve(),
  clearError: () => {},
});

export const useTaskMaster = () => {
  const context = useContext(TaskMasterContext);
  if (!context) {
    throw new Error('useTaskMaster must be used within a TaskMasterProvider');
  }
  return context;
};

export const TaskMasterProvider = ({ children }: { children: ReactNode }) => {
  // Get WebSocket messages from shared context to avoid duplicate connections
  const { latestMessage } = useWebSocket();
  
  // Authentication context
  const { user, token, isLoading: authLoading } = useAuth();
  
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [projectTaskMaster, setProjectTaskMaster] = useState<any | null>(null);
  const [mcpServerStatus, setMCPServerStatus] = useState<MCPStatus | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [nextTask, setNextTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isLoadingMCP, setIsLoadingMCP] = useState(false);
  const [error, setError] = useState<{ message: string; context: string; timestamp: string } | null>(null);

  // Helper to handle API errors
  const handleError = (error: Error, context: string): void => {
    console.error(`TaskMaster ${context} error:`, error);
    setError({
      message: error.message || `Failed to ${context}`,
      context,
      timestamp: new Date().toISOString(),
    });
  };

  // Clear error state
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  // Refresh projects with TaskMaster metadata
  const refreshProjects = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await api.taskmaster.projects();
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Unknown error'), 'refreshProjects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set current project
  const setCurrentProject = useCallback((project: Project | null): void => {
    setCurrentProjectState(project);
  }, []);

  // Refresh tasks
  const refreshTasks = useCallback(async (): Promise<void> => {
    try {
      setIsLoadingTasks(true);
      const response = await api.taskmaster.tasks();
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
        setNextTask(data.nextTask || null);
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Unknown error'), 'refreshTasks');
    } finally {
      setIsLoadingTasks(false);
    }
  }, []);

  // Refresh MCP status
  const refreshMCPStatus = useCallback(async (): Promise<void> => {
    try {
      setIsLoadingMCP(true);
      const response = await api.mcp.status();
      if (response.ok) {
        const data = await response.json();
        setMCPServerStatus(data.status || { status: 'disconnected' });
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Unknown error'), 'refreshMCPStatus');
    } finally {
      setIsLoadingMCP(false);
    }
  }, []);

  // Effect to handle WebSocket messages
  useEffect(() => {
    if (latestMessage && latestMessage.type === 'taskmaster') {
      // Handle TaskMaster messages
      console.log('TaskMaster message:', latestMessage);
    }
  }, [latestMessage]);

  // Effect to refresh projects on auth change
  useEffect(() => {
    if (!authLoading && token) {
      refreshProjects();
    }
  }, [authLoading, token, refreshProjects]);

  const value = {
    projects,
    currentProject,
    projectTaskMaster,
    mcpServerStatus,
    tasks,
    nextTask,
    isLoading,
    isLoadingTasks,
    isLoadingMCP,
    error,
    refreshProjects,
    setCurrentProject,
    refreshTasks,
    refreshMCPStatus,
    clearError,
  };

  return <TaskMasterContext.Provider value={value}>{children}</TaskMasterContext.Provider>;
};

export default TaskMasterContext;