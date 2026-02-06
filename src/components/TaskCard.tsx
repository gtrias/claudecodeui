import React from 'react';
import { Clock, CheckCircle, Circle, AlertCircle, Pause, X, ArrowRight, ChevronUp, Minus, Flag } from 'lucide-react';
import { cn } from '../lib/utils';
import Tooltip from './Tooltip';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  created_at?: string;
  updated_at?: string;
  project_id?: string;
  parent_id?: number;
}

export interface TaskCardProps {
  task?: Task;
  onClick?: (task: Task) => void;
  showParent?: boolean;
  className?: string;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onClick,
  showParent = false,
  className = ''
}) => {
  const getStatusConfig = (status: string) => {
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