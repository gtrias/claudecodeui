import React from 'react';
import { X } from 'lucide-react';
import StandaloneShell from './StandaloneShell';
import { IS_PLATFORM } from '../constants/config';

export type LoginProvider = 'claude' | 'cursor' | 'codex' | 'pi';

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider?: LoginProvider;
  project?: { name: string; path?: string; fullPath?: string };
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
      case 'codex':
        return 'Codex CLI Login';
      case 'pi':
        return 'Pi CLI Login';
      default:
        return 'CLI Login';
    }
  };

  const handleComplete = (exitCode: number): void => {
    if (onComplete) {
      onComplete(exitCode);
    }
    if (exitCode === 0) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] max-md:items-stretch max-md:justify-stretch">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col md:max-w-4xl md:h-3/4 md:rounded-lg md:m-4 max-md:max-w-none max-md:h-full max-md:rounded-none max-md:m-0">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {getTitle()}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close login modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <StandaloneShell
            project={project}
            command={getCommand()}
            onComplete={handleComplete}
            minimal={true}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginModal;