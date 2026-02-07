import React, { useState, useCallback, useMemo } from 'react';
import Shell from './Shell';

export interface Project {
  id: string;
  name: string;
  path: string;
  fullPath?: string;
  displayName?: string;
}

export interface Session {
  id: string;
  projectId: string;
  sessionId: string;
}

export interface StandaloneShellProps {
  project?: Project;
  session?: Session | null;
  command?: string | null;
  isPlainShell?: boolean | null;
  autoConnect?: boolean;
  onComplete?: (exitCode: number) => void;
  onClose?: () => void;
  title?: string | null;
  className?: string;
  showHeader?: boolean;
  compact?: boolean;
  minimal?: boolean;
}

const StandaloneShell: React.FC<StandaloneShellProps> = ({
  project,
  session = null,
  command = null,
  isPlainShell = null,
  autoConnect = true,
  onComplete = null,
  onClose = null,
  title = null,
  className = "",
  showHeader = true,
  compact = false,
  minimal = false
}) => {
  const [isCompleted, setIsCompleted] = useState(false);

  const shouldUsePlainShell = isPlainShell !== null ? isPlainShell : (command !== null);

  const handleProcessComplete = useCallback((exitCode: number) => {
    setIsCompleted(true);
    if (onComplete) {
      onComplete(exitCode);
    }
  }, [onComplete]);

  if (!project) {
    return (
      <div className={`h-full flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">