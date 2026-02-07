import React from 'react';
import { Zap } from 'lucide-react';
import { useTasksSettings } from '../contexts/TasksSettingsContext';
import { useTranslation } from 'react-i18next';

export interface TasksSettingsProps {}

const TasksSettings: React.FC<TasksSettingsProps> = () => {
  const { t } = useTranslation('settings');
  const {
    tasksEnabled,
    setTasksEnabled,
    isTaskMasterInstalled,
    isCheckingInstallation
  } = useTasksSettings();

  return (
    <div className="space-y-8">
      {/* Installation Status Check */}
      {isCheckingInstallation ? (
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-sm text-muted-foreground">{t('tasks.checking')}</span>
          </div>
        </div>
      ) : (
        <>
          {/* TaskMaster Not Installed Warning */}
          {!isTaskMasterInstalled && (
            <div className="bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-orange-900 dark:text-orange-100 mb-2">
                    {t('tasks.notInstalled.title')}
                  </div>
                  <div className="text-sm text-orange-800 dark:text-orange-200 space-y-3">
                    <p>{t('tasks.notInstalled.description')}</p>

                    <div className="bg-orange-100 dark:bg-orange-900/50 rounded-lg p-3 font-mono text-sm">
                      <code>{t('tasks.notInstalled.installCommand')}</code>
                    </div>

                    <div>
                      <a
                        href="https://github.com/eyaltoledo/claude-task-master"
                        target="_blank"
                        rel="noopener noreferrer"