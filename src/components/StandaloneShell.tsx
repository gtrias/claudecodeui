import React, { useState, useCallback } from 'react';
import Shell from './Shell';

/**
 * Generic Shell wrapper that can be used in tabs, modals, and other contexts.
 * Provides a flexible API for both standalone and session-based usage.
 */
export interface Project {
  name: string;
  fullPath?: string;
  path?: string;
  displayName?: string;
}

export interface Session {
  id?: string;
  __provider?: string;
}

export interface StandaloneShellProps {
  project?: Project;
  session?: Session;
  command?: string;
  isPlainShell?: boolean;
  autoConnect?: boolean;
  onComplete?: (exitCode: number) => void;
  onClose?: () => void;
  title?: string;
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

  const handleProcessComplete = useCallback((exitCode: number): void => {
    setIsCompleted(true);
    if (onComplete) {
      onComplete(exitCode);
    }
  }, [onComplete]);