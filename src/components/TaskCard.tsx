import React from 'react';
import { Clock, CheckCircle, Circle, AlertCircle, Pause, X, ArrowRight, ChevronUp, Minus, Flag } from 'lucide-react';
import { cn } from '../lib/utils';
import Tooltip from './Tooltip';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'done' | 'in-progress' | 'review' | 'deferred' | 'cancelled' | 'pending';
  priority?: 'high' | 'medium' | 'low';
  parentTaskId?: string;
  dueDate?: string;
  tags?: string[];
}

export interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  showParent?: boolean;
  className?: string;
}

interface StatusConfig {
  icon: React.FC<{ className?: string }>;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  textColor: string;
  statusText: string;
}

const getStatusConfig = (status: string): StatusConfig => {
  switch (status) {
    case 'done':
      return {
        icon: CheckCircle,
        bgColor: 'bg-green-50 dark:bg-green-950',
        borderColor: 'border-green-200 dark:border-green-800',
        iconColor: 'text-green-600 dark:text-green-400',
        textColor: 'text-green-900 dark:text-green-100',
        statusText: 'Done'
      };
    
    case 'in-progress':
      return {
        icon: Clock,
        bgColor: 'bg-blue-50 dark:bg-blue-950',
        borderColor: 'border-blue-200 dark:border-blue-800',
        iconColor: 'text-blue-600 dark:text-blue-400',
        textColor: 'text-blue-900 dark:text-blue-100',
        statusText: 'In Progress'
      };
    
    case 'review':
      return {
        icon: AlertCircle,
        bgColor: 'bg-amber-50 dark:bg-amber-950',
        borderColor: 'border-amber-200 dark:border-amber-800',
        iconColor: 'text-amber-600 dark:text-amber-400',
        textColor: 'text-amber-900 dark:text-amber-100',
        statusText: 'Review'
      };
    
    case 'deferred':
      return {
        icon: Pause,
        bgColor: 'bg-gray-50 dark:bg-gray-800',
        borderColor: 'border-gray-200 dark:border-gray-700',
        iconColor: 'text-gray-500 dark:text-gray-400',
        textColor: 'text-gray-700 dark:text-gray-300',
        statusText: 'Deferred'
      };
    
    case 'cancelled':
      return {
        icon: X,
        bgColor: 'bg-red-50 dark:bg-red-950',
        borderColor: 'border-red-200 dark:border-red-800',
        iconColor: 'text-red-600 dark:text-red-400',
        textColor: 'text-red-900 dark:text-red-100',
        statusText: 'Cancelled'
      };
    
    case 'pending':
    default:
      return {
        icon: Circle,
        bgColor: 'bg-slate-50 dark:bg-slate-800',
        borderColor: 'border-slate-200 dark:border-slate-700',
        iconColor: 'text-slate-500 dark:text-slate-400',
        textColor: 'text-slate-900 dark:text-slate-100',
        statusText: 'Pending'
      };
  }
};

const TaskCard: React.FC<TaskCardProps> = ({ 
  task,
  onClick,
  showParent = false,
  className = ''
}) => {
  const config = getStatusConfig(task.status);
  const Icon = config.icon;

  const getPriorityIcon = (priority?: string): React.ReactNode => {