/**
 * Component Type Definitions for Claude Code UI
 * TypeScript definitions for React components
 */

import type { ReactElement, ReactNode, ComponentType, FC } from 'react';

// ==========================================
// Common Prop Types
// ==========================================

export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  title?: string;
  children?: ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  isLoading?: boolean;
  icon?: ReactNode;
}

export interface InputProps extends BaseComponentProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: 'text' | 'password' | 'email' | 'number';
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
}

export interface SelectProps extends BaseComponentProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  footer?: ReactNode;
}

export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  onClick?: () => void;
  hover?: boolean;
}

// ==========================================
// Chat Component Props
// ==========================================

export interface MessageProps {
  message: {
    type: 'user' | 'assistant' | 'tool' | 'error';
    content: string;
    timestamp: string;
    images?: { data: string; name: string }[];
    toolName?: string;
    toolId?: string;
    toolInput?: string;
    toolResult?: string;
    isToolUse?: boolean;
  };
  index: number;
  prevMessage?: MessageProps['message'];
  createDiff?: (oldStr: string, newStr: string) => { type: 'added' | 'removed' | 'unchanged'; content: string }[];
  onFileOpen?: (filePath: string, diff?: { old_string: string; new_string: string }) => void;
  onShowSettings?: () => void;
  onGrantToolPermission?: (entry: string) => void;
  autoExpandTools?: boolean;
  showRawParameters?: boolean;
  showThinking?: boolean;
  selectedProject?: { name: string; path: string };
  provider: 'claude' | 'cursor' | 'codex' | 'pi';
}

export interface ChatInputProps {
  onSend: (message: string, options?: ChatOptions) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export interface ChatOptions {
  projectPath?: string;
  sessionId?: string;
  resume?: boolean;
  model?: string;
}

export interface ChatMessageProps {
  messages: MessageProps['message'][];
  onSend: ChatInputProps['onSend'];
  onFileOpen?: ChatInputProps['onChange'];
  onShowSettings?: () => void;
  autoExpandTools?: boolean;
}

// ==========================================
// Sidebar Component Props
// ==========================================

export interface SidebarProps {
  projects: { name: string; displayName: string; path: string; lastSession?: string }[];
  activeProject?: string;
  onSelectProject: (project: string) => void;
  onCreateProject?: () => void;
  onRenameProject?: (project: string, newName: string) => void;
  onDeleteProject?: (project: string) => void;
  isLoading?: boolean;
}

export interface ProjectItemProps {
  project: { name: string; displayName: string; path: string };
  isActive: boolean;
  onClick: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
}

// ==========================================
// Context Provider Props
// ==========================================

export interface AuthProviderProps {
  children: ReactNode;
}

export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: 'light' | 'dark';
}

export interface WebSocketProviderProps {
  children: ReactNode;
  url?: string;
  token?: string;
}

// ==========================================
// File Tree Props
// ==========================================

export interface FileTreeProps {
  path: string;
  onSelectFile: (filePath: string) => void;
  onOpenFile?: (filePath: string) => void;
  depth?: number;
  showHidden?: boolean;
}

export interface FileTreeItemProps {
  item: {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: FileTreeItemProps['item'][];
  };
  depth: number;
  onSelectFile: FileTreeProps['onSelectFile'];
}

// ==========================================
// Settings Component Props
// ==========================================

export interface SettingsFormProps {
  onSave: (values: Record<string, unknown>) => void;
  onCancel?: () => void;
}

export interface ApiKeySettingsProps {
  userId: number;
  onAddKey?: (keyName: string) => void;
  onDeleteKey?: (keyId: number) => void;
  onToggleKey?: (keyId: number, isActive: boolean) => void;
}

export interface AgentSettingsProps {
  onAddAgent?: () => void;
  onEditAgent?: (agentId: string) => void;
  onDeleteAgent?: (agentId: string) => void;
}

export interface McpServerProps {
  server: {
    id: string;
    name: string;
    url: string;
    enabled: boolean;
    settings?: Record<string, unknown>;
  };
  onEnable?: () => void;
  onDisable?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

// ==========================================
// Shell/Terminal Props
// ==========================================

export interface ShellProps {
  projectPath: string;
  sessionId?: string;
  provider?: 'claude' | 'cursor' | 'codex' | 'pi' | 'plain-shell';
  initialCommand?: string;
  onExit?: () => void;
  onMessage?: (message: string) => void;
}

export interface ShellOutputProps {
  output: string;
  onCopy?: (text: string) => void;
}

// ==========================================
// UI Component Props (shadcn-like)
// ==========================================

export interface BadgeProps extends BaseComponentProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export interface ScrollAreaProps extends BaseComponentProps {
  direction?: 'vertical' | 'horizontal' | 'both';
  type?: 'auto' | 'always' | 'scroll' | 'hover';
  viewportClassName?: string;
}

export interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: ReactNode;
  content: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delayDuration?: number;
}
