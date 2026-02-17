import React from 'react';
import { Clock, CheckCircle, Circle, AlertCircle, Pause, X, ArrowRight, ChevronUp, Minus, LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import Tooltip from './Tooltip';

export type TaskStatus = 'pending' | 'in-progress' | 'review' | 'done' | 'deferred' | 'cancelled';
export type TaskPriority = 'high' | 'medium' | 'low' | 'none';

export interface Subtask {
  id: string;
  title: string;
  status: TaskStatus;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority?: TaskPriority;
  parentId?: string;
  dependencies?: string[];
  subtasks?: Subtask[];
}

interface StatusConfig {
  icon: LucideIcon;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  textColor: string;
  statusText: string;
}

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  showParent?: boolean;
  className?: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task,
  onClick,
  showParent = false,
  className = ''
}) => {
  const getStatusConfig = (status: TaskStatus): StatusConfig => {
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
          bgColor: 'bg-accent/10 dark:bg-accent/10',
          borderColor: 'border-primary/30 dark:border-primary/30',
          iconColor: 'text-primary dark:text-primary',
          textColor: 'text-primary dark:text-primary-foreground',
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

  const config = getStatusConfig(task.status);
  const Icon = config.icon;

  const getPriorityIcon = (priority?: TaskPriority) => {
    switch (priority) {
      case 'high':
        return (
          <Tooltip content="High Priority">
            <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 rounded flex items-center justify-center">
              <ChevronUp className="w-2.5 h-2.5 text-red-600 dark:text-red-400" />
            </div>
          </Tooltip>
        );
      case 'medium':
        return (
          <Tooltip content="Medium Priority">
            <div className="w-4 h-4 bg-amber-100 dark:bg-amber-900/30 rounded flex items-center justify-center">
              <Minus className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
            </div>
          </Tooltip>
        );
      case 'low':
        return (
          <Tooltip content="Low Priority">
            <div className="w-4 h-4 bg-accent/20 dark:bg-accent/20/30 rounded flex items-center justify-center">
              <Circle className="w-1.5 h-1.5 text-primary dark:text-primary fill-current" />
            </div>
          </Tooltip>
        );
      default:
        return (
          <Tooltip content="No Priority Set">
            <div className="w-4 h-4 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
              <Circle className="w-1.5 h-1.5 text-gray-400 dark:text-gray-500" />
            </div>
          </Tooltip>
        );
    }
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
        'hover:shadow-md hover:border-primary/40 dark:hover:border-primary transition-all duration-200 cursor-pointer',
        'p-3 space-y-3',
        onClick && 'hover:-translate-y-0.5',
        className
      )}
      onClick={onClick}
    >
      {/* Header with Task ID, Title, and Priority */}
      <div className="flex items-start justify-between gap-2 mb-2">
        {/* Task ID and Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Tooltip content={`Task ID: ${task.id}`}>
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                {task.id}
              </span>
            </Tooltip>
          </div>
          <h3 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 leading-tight">
            {task.title}
          </h3>
          {showParent && task.parentId && (
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Task {task.parentId}
            </span>
          )}
        </div>
        
        {/* Priority Icon */}
        <div className="flex-shrink-0">
          {getPriorityIcon(task.priority)}
        </div>
      </div>

      {/* Footer with Dependencies and Status */}
      <div className="flex items-center justify-between">
        {/* Dependencies */}
        <div className="flex items-center">
          {task.dependencies && Array.isArray(task.dependencies) && task.dependencies.length > 0 && (
            <Tooltip content={`Depends on: ${task.dependencies.map(dep => `Task ${dep}`).join(', ')}`}>
              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <ArrowRight className="w-3 h-3" />
                <span>Depends on: {task.dependencies.join(', ')}</span>
              </div>
            </Tooltip>
          )}
        </div>

        {/* Status Badge */}
        <Tooltip content={`Status: ${config.statusText}`}>
          <div className="flex items-center gap-1">
            <div className={cn('w-2 h-2 rounded-full', config.iconColor.replace('text-', 'bg-'))} />
            <span className={cn('text-xs font-medium', config.textColor)}>
              {config.statusText}
            </span>
          </div>
        </Tooltip>
      </div>

      {/* Subtask Progress (if applicable) */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="ml-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Progress:</span>
            <Tooltip content={`${task.subtasks.filter(st => st.status === 'done').length} of ${task.subtasks.length} subtasks completed`}>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    task.status === 'done' ? 'bg-green-500' : 'bg-primary'
                  )}
                  style={{
                    width: `${Math.round((task.subtasks.filter(st => st.status === 'done').length / task.subtasks.length) * 100)}%`
                  }}
                />
              </div>
            </Tooltip>
            <Tooltip content={`${task.subtasks.filter(st => st.status === 'done').length} completed, ${task.subtasks.filter(st => st.status === 'pending').length} pending, ${task.subtasks.filter(st => st.status === 'in-progress').length} in progress`}>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {task.subtasks.filter(st => st.status === 'done').length}/{task.subtasks.length}
              </span>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
