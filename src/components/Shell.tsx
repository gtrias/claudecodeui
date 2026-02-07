import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { useTranslation } from 'react-i18next';
import { IS_PLATFORM } from '../constants/config';

const xtermStyles = `
  .xterm .xterm-screen {
    outline: none !important;
  }
  .xterm:focus .xterm-screen {
    outline: none !important;
  }
  .xterm-screen:focus {
    outline: none !important;
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = xtermStyles;
  document.head.appendChild(styleSheet);
}

export interface Project {
  name: string;
  path?: string;
  fullPath?: string;
}

export interface Session {
  id?: string;
  __provider?: string;
}

export interface ShellProps {
  selectedProject?: Project;
  selectedSession?: Session;
  initialCommand?: string;
  isPlainShell?: boolean;
  onProcessComplete?: (exitCode: number) => void;
  minimal?: boolean;
  autoConnect?: boolean;
}

const Shell: React.FC<ShellProps> = ({
  selectedProject,
  selectedSession,
  initialCommand,
  isPlainShell = false,
  onProcessComplete,
  minimal = false,
  autoConnect = false
}) => {
  const { t } = useTranslation('chat');
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const selectedProjectRef = useRef<Project | undefined>(selectedProject);
  const selectedSessionRef = useRef<Session | undefined>(selectedSession);
  const initialCommandRef = useRef<string | undefined>(initialCommand);
  const isPlainShellRef = useRef(isPlainShell);
  const onProcessCompleteRef = useRef<(exitCode: number) => void | undefined>(onProcessComplete);

  const provider = useMemo(() => {
    if (isPlainShell) return 'plain-shell';
    return selectedSession?.__provider || localStorage.getItem('selected-provider') || 'claude';
  }, [isPlainShell, selectedSession?.__provider]);

  const providerLabel = useMemo(() => {
    if (provider === 'cursor') return 'Cursor';
    if (provider === 'codex') return 'Codex';
    if (provider === 'pi') return 'Pi';
    if (provider === 'plain-shell') return 'Shell';
    return 'Claude';
  }, [provider]);

  useEffect(() => {
    selectedProjectRef.current = selectedProject;
    selectedSessionRef.current = selectedSession;
    initialCommandRef.current = initialCommand;
    isPlainShellRef.current = isPlainShell;
    onProcessCompleteRef.current = onProcessComplete;
  }, [selectedProject, selectedSession, initialCommand, isPlainShell, onProcessComplete]);

  const connectWebSocket = useCallback(async (): Promise<void> => {
    if (isConnecting || isConnected) return;

    try {
      let wsUrl;

      if (IS_PLATFORM) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${window.location.host}/shell`;
      } else {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          console.error('No authentication token found for Shell WebSocket connection');