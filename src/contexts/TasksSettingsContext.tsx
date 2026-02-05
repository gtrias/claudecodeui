import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../utils/api';

// Type definitions
export interface TaskMasterInstallation {
  isInstalled: boolean;
  version?: string;
  path?: string;
}

export interface TasksSettingsContextType {
  tasksEnabled: boolean;
  setTasksEnabled: (enabled: boolean) => void;
  toggleTasksEnabled: () => void;
  isTaskMasterInstalled: boolean | null;
  isTaskMasterReady: boolean | null;
  installationStatus: TaskMasterInstallation | null;
  isCheckingInstallation: boolean;
}

const TasksSettingsContext = createContext<TasksSettingsContextType>({
  tasksEnabled: true,
  setTasksEnabled: () => {},
  toggleTasksEnabled: () => {},
  isTaskMasterInstalled: null,
  isTaskMasterReady: null,
  installationStatus: null,
  isCheckingInstallation: true,
});

export const useTasksSettings = () => {
  const context = useContext(TasksSettingsContext);
  if (!context) {
    throw new Error('useTasksSettings must be used within a TasksSettingsProvider');
  }
  return context;
};

export const TasksSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [tasksEnabled, setTasksEnabledState] = useState<boolean>(() => {
    // Load from localStorage on initialization
    const saved = localStorage.getItem('tasks-enabled');
    return saved !== null ? JSON.parse(saved) : true; // Default to true
  });
  
  const [isTaskMasterInstalled, setIsTaskMasterInstalled] = useState<boolean | null>(null);
  const [isTaskMasterReady, setIsTaskMasterReady] = useState<boolean | null>(null);
  const [installationStatus, setInstallationStatus] = useState<TaskMasterInstallation | null>(null);
  const [isCheckingInstallation, setIsCheckingInstallation] = useState(true);

  const setTasksEnabled = (enabled: boolean): void => {
    setTasksEnabledState(enabled);
    localStorage.setItem('tasks-enabled', JSON.stringify(enabled));
  };

  const toggleTasksEnabled = (): void => {
    setTasksEnabled(!tasksEnabled);
  };

  // Check TaskMaster installation status asynchronously on component mount
  useEffect(() => {
    const checkInstallation = async (): Promise<void> => {
      try {
        const response = await api.get('/taskmaster/installation-status');
        if (response.ok) {
          const data = await response.json();
          setInstallationStatus(data.installation || { isInstalled: false });
          setIsTaskMasterInstalled(data.installation?.isInstalled || false);
          setIsTaskMasterReady(data.isReady || false);
          
          // If TaskMaster is not installed and user hasn't explicitly enabled tasks,
          // disable tasks automatically
          const userEnabledTasks = localStorage.getItem('tasks-enabled');
          if (!data.installation?.isInstalled && userEnabledTasks === null) {
            setTasksEnabled(false);
          }
        } else {
          console.error('Failed to check TaskMaster installation status');
          setIsTaskMasterInstalled(false);
          setIsTaskMasterReady(false);
        }
      } catch (error) {
        console.error('Error checking TaskMaster installation:', error instanceof Error ? error.message : 'Unknown error');
        setIsTaskMasterInstalled(false);
        setIsTaskMasterReady(false);
      } finally {
        setIsCheckingInstallation(false);
      }
    };

    checkInstallation();
  }, []);

  const value = {
    tasksEnabled,
    setTasksEnabled,
    toggleTasksEnabled,
    isTaskMasterInstalled,
    isTaskMasterReady,
    installationStatus,
    isCheckingInstallation,
  };

  return <TasksSettingsContext.Provider value={value}>{children}</TasksSettingsContext.Provider>;
};

export default TasksSettingsContext;