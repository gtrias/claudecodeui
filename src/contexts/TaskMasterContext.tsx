import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';
import { useWebSocket } from './WebSocketContext';

interface TaskMasterMetadata {
  taskCount?: number;
  completed?: number;
}

interface TaskMaster {
  hasTaskmaster?: boolean;
  status?: string;
  metadata?: TaskMasterMetadata;
}

interface Project {
  name: string;
  displayName?: string;
  fullPath?: string;
  taskmaster?: TaskMaster;
  taskMasterConfigured?: boolean;
  taskMasterStatus?: string;
  taskCount?: number;
  completedCount?: number;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priority?: number;
  dependencies?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface MCPServerStatus {
  running: boolean;
  error?: string;
}

interface TaskMasterError {
  message: string;
  context: string;
  timestamp: string;
}

interface TaskMasterContextValue {
  // TaskMaster project state
  projects: Project[];
  currentProject: Project | null;
  projectTaskMaster: TaskMaster | null;
  
  // MCP server state
  mcpServerStatus: MCPServerStatus | null;
  
  // Tasks state
  tasks: Task[];
  nextTask: Task | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingTasks: boolean;
  isLoadingMCP: boolean;
  
  // Error state
  error: TaskMasterError | null;
  
  // Actions
  refreshProjects: () => Promise<void>;
  setCurrentProject: (project: Project | null) => Promise<void>;
  refreshTasks: () => Promise<void>;
  refreshMCPStatus: () => Promise<void>;
  clearError: () => void;
}

const TaskMasterContext = createContext<TaskMasterContextValue | undefined>(undefined);

export const useTaskMaster = (): TaskMasterContextValue => {
  const context = useContext(TaskMasterContext);
  if (!context) {
    throw new Error('useTaskMaster must be used within a TaskMasterProvider');
  }
  return context;
};

interface TaskMasterProviderProps {
  children: ReactNode;
}

export const TaskMasterProvider: React.FC<TaskMasterProviderProps> = ({ children }) => {
  // Get WebSocket messages from shared context to avoid duplicate connections
  const { latestMessage } = useWebSocket();
  
  // Authentication context
  const { user, token, isLoading: authLoading } = useAuth();
  
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [projectTaskMaster, setProjectTaskMaster] = useState<TaskMaster | null>(null);
  const [mcpServerStatus, setMCPServerStatus] = useState<MCPServerStatus | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [nextTask, setNextTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState<boolean>(false);
  const [isLoadingMCP, setIsLoadingMCP] = useState<boolean>(false);
  const [error, setError] = useState<TaskMasterError | null>(null);

  // Helper to handle API errors
  const handleError = (error: any, context: string): void => {
    console.error(`TaskMaster ${context} error:`, error);
    setError({
      message: error.message || `Failed to ${context}`,
      context,
      timestamp: new Date().toISOString()
    });
  };

  // Clear error state
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  // Refresh projects with TaskMaster metadata
  const refreshProjects = useCallback(async (): Promise<void> => {
    // Only make API calls if user is authenticated
    if (!user || !token) {
      setProjects([]);
      setCurrentProjectState(null);
      return;
    }

    try {
      setIsLoading(true);
      clearError();
      const response = await api.get('/projects');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.status}`);
      }
      
      const projectsData = await response.json();
      
      // Check if projectsData is an array
      if (!Array.isArray(projectsData)) {
        console.error('Projects API returned non-array data:', projectsData);
        setProjects([]);
        return;
      }
      
      // Filter and enrich projects with TaskMaster data
      const enrichedProjects: Project[] = projectsData.map(project => ({
        ...project,
        taskMasterConfigured: project.taskmaster?.hasTaskmaster || false,
        taskMasterStatus: project.taskmaster?.status || 'not-configured',
        taskCount: project.taskmaster?.metadata?.taskCount || 0,
        completedCount: project.taskmaster?.metadata?.completed || 0
      }));
      
      setProjects(enrichedProjects);
      
      // If current project is set, update its TaskMaster data
      if (currentProject) {
        const updatedCurrent = enrichedProjects.find(p => p.name === currentProject.name);
        if (updatedCurrent) {
          setCurrentProjectState(updatedCurrent);
          setProjectTaskMaster(updatedCurrent.taskmaster || null);
        }
      }
    } catch (err: any) {
      handleError(err, 'load projects');
    } finally {
      setIsLoading(false);
    }
  }, [user, token]); // Remove currentProject dependency to avoid infinite loops

  // Set current project and load its TaskMaster details
  const setCurrentProject = useCallback(async (project: Project | null): Promise<void> => {
    try {
      setCurrentProjectState(project);

      setTasks([]);
      setNextTask(null);

      setProjectTaskMaster(project?.taskmaster || null);
    } catch (err: any) {
      console.error('Error in setCurrentProject:', err);
      handleError(err, 'set current project');
      setProjectTaskMaster(project?.taskmaster || null);
    }
  }, []);

  // Refresh MCP server status
  const refreshMCPStatus = useCallback(async (): Promise<void> => {
    // Only make API calls if user is authenticated
    if (!user || !token) {
      setMCPServerStatus(null);
      return;
    }

    try {
      setIsLoadingMCP(true);
      clearError();
      const mcpStatus = await api.get('/mcp-utils/taskmaster-server');
      setMCPServerStatus(mcpStatus);
    } catch (err: any) {
      handleError(err, 'check MCP server status');
    } finally {
      setIsLoadingMCP(false);
    }
  }, [user, token]);

  // Refresh tasks for current project - load real TaskMaster data
  const refreshTasks = useCallback(async (): Promise<void> => {
    if (!currentProject) {
      setTasks([]);
      setNextTask(null);
      return;
    }

    // Only make API calls if user is authenticated
    if (!user || !token) {
      setTasks([]);
      setNextTask(null);
      return;
    }

    try {
      setIsLoadingTasks(true);
      clearError();
      
      // Load tasks from the TaskMaster API endpoint
      const response = await api.get(`/taskmaster/tasks/${encodeURIComponent(currentProject.name)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load tasks');
      }
      
      const data = await response.json();
      
      setTasks(data.tasks || []);
      
      // Find next task (pending or in-progress)
      const nextTask = data.tasks?.find((task: Task) => 
        task.status === 'pending' || task.status === 'in-progress'
      ) || null;
      setNextTask(nextTask);
      
    } catch (err: any) {
      console.error('Error loading tasks:', err);
      handleError(err, 'load tasks');
      // Set empty state on error
      setTasks([]);
      setNextTask(null);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [currentProject, user, token]);

  // Load initial data on mount or when auth changes
  useEffect(() => {
    if (!authLoading && user && token) {
      refreshProjects();
      refreshMCPStatus();
    } else {
      console.log('Auth not ready or no user, skipping project load:', { authLoading, user: !!user, token: !!token });
    }
  }, [refreshProjects, refreshMCPStatus, authLoading, user, token]);

  // Clear errors when authentication changes
  useEffect(() => {
    if (user && token) {
      clearError();
    }
  }, [user, token, clearError]);

  // Refresh tasks when current project changes
  useEffect(() => {
    if (currentProject?.name && user && token) {
      refreshTasks();
    }
  }, [currentProject?.name, user, token, refreshTasks]);

  // Handle WebSocket latestMessage for TaskMaster updates
  useEffect(() => {
    if (!latestMessage) return;

    switch (latestMessage.type) {
      case 'taskmaster-project-updated':
        // Refresh projects when TaskMaster state changes
        if (latestMessage.projectName) {
          refreshProjects();
        }
        break;
        
      case 'taskmaster-tasks-updated':
        // Refresh tasks for the current project
        if (latestMessage.projectName === currentProject?.name) {
          refreshTasks();
        }
        break;
        
      case 'taskmaster-mcp-status-changed':
        // Refresh MCP server status
        refreshMCPStatus();
        break;
        
      default:
        // Ignore non-TaskMaster messages
        break;
    }
  }, [latestMessage, refreshProjects, refreshTasks, refreshMCPStatus, currentProject]);

  // Context value
  const contextValue: TaskMasterContextValue = {
    // State
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
    
    // Actions
    refreshProjects,
    setCurrentProject,
    refreshTasks,
    refreshMCPStatus,
    clearError
  };

  return (
    <TaskMasterContext.Provider value={contextValue}>
      {children}
    </TaskMasterContext.Provider>
  );
};

export default TaskMasterContext;
