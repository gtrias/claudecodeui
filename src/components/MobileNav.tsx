import React from 'react';
import { MessageSquare, Folder, Terminal, GitBranch, Globe, CheckSquare } from 'lucide-react';
import { useTasksSettings } from '../contexts/TasksSettingsContext';

export interface NavItem {
  id: string;
  icon: React.FC<{ className?: string }>;
  onClick: () => void;
}

export interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isInputFocused: boolean;
}

const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  isInputFocused
}) => {
  const { tasksEnabled } = useTasksSettings();
  const navItems: NavItem[] = [
    {
      id: 'chat',
      icon: MessageSquare,
      onClick: () => setActiveTab('chat')
    },
    {
      id: 'shell',
      icon: Terminal,
      onClick: () => setActiveTab('shell')
    },
    {
      id: 'files',
      icon: Folder,
      onClick: () => setActiveTab('files')
    },
    {
      id: 'git',
      icon: GitBranch,
      onClick: () => setActiveTab('git')
    },
    // Conditionally add tasks tab if enabled
    ...(tasksEnabled ? [{
      id: 'tasks',
      icon: CheckSquare,
      onClick: () => setActiveTab('tasks')
    }] : [])
  ];

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 ios-bottom-safe transform transition-transform duration-300 ease-in-out shadow-lg ${
        isInputFocused ? 'translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="flex items-center justify-around py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={item.onClick}