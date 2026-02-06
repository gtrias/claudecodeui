import React from 'react';
import { Zap } from 'lucide-react';
import { useTasksSettings } from '../contexts/TasksSettingsContext';
import { useTranslation } from 'react-i18next';

export interface TasksSettingsProps {
  className?: string;
}

const TasksSettings: React.FC<TasksSettingsProps> = ({ className = '' }) => {
  const { t } = useTranslation('settings');
  const {
    tasksEnabled,
    setTasksEnabled,
    isTaskMasterInstalled,
    isCheckingInstallation
  } = useTasksSettings();