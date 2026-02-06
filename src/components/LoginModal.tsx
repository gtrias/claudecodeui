import React from 'react';
import { X } from 'lucide-react';
import StandaloneShell from './StandaloneShell';
import { IS_PLATFORM } from '../constants/config';

export type Provider = 'claude' | 'cursor' | 'codex' | 'pi';

export interface Project {
  name: string;
  path?: string;
  fullPath?: string;
}

export interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  provider?: Provider;
  project?: Project;
  onComplete?: (exitCode: number) => void;
  customCommand?: string;
  isAuthenticated?: boolean;
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  provider = 'claude',
  project,
  onComplete,
  customCommand,
  isAuthenticated = false
}) => {
  if (!isOpen) return null;

  const getCommand = (): string => {
    if (customCommand) return customCommand;

    switch (provider) {
      case 'claude':
        return isAuthenticated ? 'claude setup-token --dangerously-skip-permissions' : 'claude /exit --dangerously-skip-permissions';
      case 'cursor':
        return 'cursor-agent login';
      case 'codex':
        return IS_PLATFORM ? 'codex login --device-auth' : 'codex login';
      case 'pi':
        return 'pi';
      default:
        return isAuthenticated ? 'claude setup-token --dangerously-skip-permissions' : 'claude /exit --dangerously-skip-permissions';
    }
  };

  const getTitle = (): string => {
    switch (provider) {
      case 'claude':
        return 'Claude CLI Login';
      case 'cursor':
        return 'Cursor CLI Login';