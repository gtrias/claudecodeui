import React from 'react';
import { CheckCircle, Settings, X, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export type TaskStatus = 'fully-configured' | 'taskmaster-only' | 'mcp-only' | 'not-configured' | 'error';

export interface TaskIndicatorProps {
  status?: TaskStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

interface IndicatorConfig {
  icon: React.FC<{ className?: string }>;
  color: string;
  bgColor: string;
  label: string;
  title: string;
}

const TaskIndicator: React.FC<TaskIndicatorProps> = ({ 
  status = 'not-configured', 
  size = 'sm',
  className = '',
  showLabel = false 
}) => {
  const getIndicatorConfig = (): IndicatorConfig => {
    switch (status) {
      case 'fully-configured':
        return {
          icon: CheckCircle,
          color: 'text-green-500 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-950',
          label: 'TaskMaster Ready',
          title: 'TaskMaster fully configured with MCP server'
        };
      
      case 'taskmaster-only':
        return {
          icon: Settings,
          color: 'text-blue-500 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-950',
          label: 'TaskMaster Init',
          title: 'TaskMaster initialized, MCP server needs setup'
        };
        
      case 'mcp-only':
        return {
          icon: AlertCircle,
          color: 'text-amber-500 dark:text-amber-400',
          bgColor: 'bg-amber-50 dark:bg-amber-950',
          label: 'MCP Ready',
          title: 'MCP server configured, TaskMaster needs initialization'
        };
      
      case 'not-configured':
      case 'error':
      default:
        return {
          icon: X,