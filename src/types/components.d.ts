// Type definitions for React components

export interface Project {
  id: string;
  name: string;
  path: string;
  displayName?: string;
}

export interface Session {
  id: string;
  createdAt: string;
  messages: number;
}

export interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sessionId?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{ type: string; text?: string }>;
  timestamp: string;
  sessionId?: string;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ProjectSettings {
  defaultModel: string;
  defaultProvider: string;
  theme: 'light' | 'dark';
  enableTaskMaster: boolean;
}

export interface WebSocketMessage {
  type: string;
  data?: unknown;
  error?: string;
  sessionId?: string;
}

export interface ChatInterfaceProps {
  initialProject?: string;
  onProjectChange?: (project: string) => void;
  onSessionChange?: (sessionId: string) => void;
}

export interface SidebarProps {
  projects: Project[];
  selectedProject?: string;
  onProjectSelect?: (project: string) => void;
  onSessionSelect?: (sessionId: string) => void;
}

export interface MessageBubbleProps {
  message: ChatMessage;
  isLast: boolean;
  onCopy?: (text: string) => void;
  onRegenerate?: (messageId: string) => void;
}

export interface SidebarItemProps {
  project: Project;
  isSelected: boolean;
  onClick: () => void;
}

export interface ChatInputProps {
  onSend: (message: string) => void;
  isEnabled: boolean;
  isTyping?: boolean;
}

export interface ProviderLogoProps {
  provider: string;
  className?: string;
}

export interface ClaudeLogoProps {
  className?: string;
}

export interface CursorLogoProps {
  className?: string;
}

export interface CodexLogoProps {
  className?: string;
}

export interface PiLogoProps {
  className?: string;
}

export interface NextTaskBannerProps {
  task?: {
    id: string;
    type: string;
    description: string;
  };
  onExecute: (taskId: string) => void;
}

export interface TokenUsagePieProps {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface MicButtonProps {
  isRecording: boolean;
  onToggle: () => void;
}

export interface ThinkingModeSelectorProps {
  selectedMode: string;
  onSelect: (mode: string) => void;
}

// Context types
export interface AuthContextType {
  user: { id: number; username: string; created_at: string } | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  needsSetup: boolean;
  hasCompletedOnboarding: boolean;
  refreshOnboardingStatus: () => Promise<void>;
  error: string | null;
}

export interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export interface TaskMasterContextType {
  projects: Project[];
  currentProject: Project | null;
  projectTaskMaster: any | null;
  mcpServerStatus: any | null;
  tasks: any[];
  nextTask: any | null;
  isLoading: boolean;
  isLoadingTasks: boolean;
  isLoadingMCP: boolean;
  error: any;
  refreshProjects: () => void;
  setCurrentProject: (project: Project | null) => void;
  refreshTasks: () => void;
  refreshMCPStatus: () => void;
  clearError: () => void;
}

export interface TasksSettingsContextType {
  tasksEnabled: boolean;
  setTasksEnabled: (enabled: boolean) => void;
  toggleTasksEnabled: () => void;
  isTaskMasterInstalled: boolean | null;
  isTaskMasterReady: boolean | null;
  installationStatus: any;
  isCheckingInstallation: boolean;
}

export interface WebSocketContextType {
  messages: WebSocketMessage[];
  latestMessage: WebSocketMessage | null;
  connect: () => void;
  disconnect: () => void;
  isConnected: boolean;
  send: (message: WebSocketMessage) => boolean;
}