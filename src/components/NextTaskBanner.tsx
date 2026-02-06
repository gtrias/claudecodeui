import React, { useState } from 'react';
import { ArrowRight, List, Clock, Flag, CheckCircle, Circle, AlertCircle, Pause, ChevronDown, ChevronUp, Plus, FileText, Settings, X, Terminal, Eye, Play, Zap, Target } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTaskMaster } from '../contexts/TaskMasterContext';
import { api } from '../utils/api';
import Shell from './Shell';
import TaskDetail from './TaskDetail';

export interface NextTaskBannerProps {
  onShowAllTasks?: () => void;
  onStartTask?: () => void;
  className?: string;
}

const NextTaskBanner: React.FC<NextTaskBannerProps> = ({
  onShowAllTasks,
  onStartTask,
  className = ''
}) => {
  const { nextTask, tasks, currentProject, isLoadingTasks, projectTaskMaster, refreshTasks, refreshProjects } = useTaskMaster();
  const [showDetails, setShowDetails] = useState(false);
  const [showTaskOptions, setShowTaskOptions] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showCLI, setShowCLI] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Handler functions
  const handleInitializeTaskMaster = async (): Promise<void> => {
    if (!currentProject) return;
    
    setIsLoading(true);
    try {
      const response = await api.taskmaster.init(currentProject.name);
      if (response.ok) {
        await refreshProjects();
        setShowTaskOptions(false);
      } else {
        const error = await response.json();
        console.error('Failed to initialize TaskMaster:', error);
        alert(`Failed to initialize TaskMaster: ${error.message}`);
      }
    } catch (error) {
      console.error('Error initializing TaskMaster:', error instanceof Error ? error.message : 'Unknown error');
      alert('Error initializing TaskMaster. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateManualTask = (): void => {
    setShowCreateTaskModal(true);
    setShowTaskOptions(false);
  };

  const handleParsePRD = (): void => {
    setShowTemplateSelector(true);
    setShowTaskOptions(false);
  };

  // Don't show if no project or still loading
  if (!currentProject || isLoadingTasks) {
    return null;
  }

  let bannerContent;