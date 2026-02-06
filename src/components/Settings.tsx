import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { X, Plus, Settings as SettingsIcon, Shield, AlertTriangle, Moon, Sun, Server, Edit3, Trash2, Globe, Terminal, Zap, FolderOpen, LogIn, Key, GitBranch, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import ClaudeLogo from './ClaudeLogo';
import CursorLogo from './CursorLogo';
import CodexLogo from './CodexLogo';
import PiLogo from './PiLogo';
import CredentialsSettings from './CredentialsSettings';
import GitSettings from './GitSettings';
import TasksSettings from './TasksSettings';
import LoginModal from './LoginModal';
import { authenticatedFetch } from '../utils/api';

// New settings components
import AgentListItem from './settings/AgentListItem';
import AccountContent from './settings/AccountContent';
import PermissionsContent from './settings/PermissionsContent';
import McpServersContent from './settings/McpServersContent';
import LanguageSelector from './LanguageSelector';

export interface McpServer {
  name: string;
  type: 'stdio' | 'http';
  scope: 'user' | 'project';
  projectPath?: string;
  config: {
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    url?: string;
    headers?: Record<string, string>;
    timeout?: number;
  };
}

export interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  projects?: { name?: string; path?: string; fullPath?: string }[];
  initialTab?: string;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, projects = [], initialTab = 'agents' }) => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { t } = useTranslation('settings');
  const [allowedTools, setAllowedTools] = useState<string[]>([]);
  const [disallowedTools, setDisallowedTools] = useState<string[]>([]);
  const [newAllowedTool, setNewAllowedTool] = useState('');
  const [newDisallowedTool, setNewDisallowedTool] = useState('');
  const [skipPermissions, setSkipPermissions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);
  const [projectSortOrder, setProjectSortOrder] = useState<'name' | 'lastActive'>('name');

  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [showMcpForm, setShowMcpForm] = useState(false);
  const [editingMcpServer, setEditingMcpServer] = useState<McpServer | null>(null);
  const [mcpFormData, setMcpFormData] = useState({
    name: '',
    type: 'stdio' as 'stdio' | 'http',
    scope: 'user' as 'user' | 'project',
    projectPath: '', // For local scope
    config: {
      command: '',
      args: [],
      env: {},
      url: '',
      headers: {},
      timeout: 30000
    },
    jsonInput: '', // For JSON import
    importMode: 'form' as 'form' | 'json'
  });
  const [mcpLoading, setMcpLoading] = useState(false);
  const [mcpTestResults, setMcpTestResults] = useState<Record<string, any>>({});
  const [mcpServerTools, setMcpServerTools] = useState<Record<string, any>>({});
  const [mcpToolsLoading, setMcpToolsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [jsonValidationError, setJsonValidationError] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('claude'); // 'claude', 'cursor', or 'codex'
  const [selectedCategory, setSelectedCategory] = useState('account'); // 'account', 'permissions', or 'mcp'

  // Code Editor settings
  const [codeEditorTheme, setCodeEditorTheme] = useState(() =>
    localStorage.getItem('codeEditorTheme') || 'dark'
  );
  const [codeEditorWordWrap, setCodeEditorWordWrap] = useState(() =>
    localStorage.getItem('codeEditorWordWrap') === 'true'
  );
  const [codeEditorShowMinimap, setCodeEditorShowMinimap] = useState(() =>
    localStorage.getItem('codeEditorShowMinimap') !== 'false' // Default true
  );
  const [codeEditorLineNumbers, setCodeEditorLineNumbers] = useState(() =>
    localStorage.getItem('codeEditorLineNumbers') !== 'false' // Default true
  );
  const [codeEditorFontSize, setCodeEditorFontSize] = useState(() =>
    localStorage.getItem('codeEditorFontSize') || '14'
  );
  
  // Cursor-specific states
  const [cursorAllowedCommands, setCursorAllowedCommands] = useState<string[]>([]);
  const [cursorDisallowedCommands, setCursorDisallowedCommands] = useState<string[]>([]);
  const [cursorSkipPermissions, setCursorSkipPermissions] = useState(false);
  const [newCursorCommand, setNewCursorCommand] = useState('');
  const [newCursorDisallowedCommand, setNewCursorDisallowedCommand] = useState('');
  const [cursorMcpServers, setCursorMcpServers] = useState<McpServer[]>([]);

  // Codex-specific states
  const [codexMcpServers, setCodexMcpServers] = useState<McpServer[]>([]);
  const [codexPermissionMode, setCodexPermissionMode] = useState('default');
  const [showCodexMcpForm, setShowCodexMcpForm] = useState(false);
  const [codexMcpFormData, setCodexMcpFormData] = useState({
    name: '',
    type: 'stdio' as 'stdio' | 'http',
    config: {
      command: '',
      args: [],
      env: {}
    }
  });