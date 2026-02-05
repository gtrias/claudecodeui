import React, { useState } from 'react';
import { X, Flag, User, ArrowRight, CheckCircle, Circle, AlertCircle, Pause, Edit, Save, Copy, ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import TaskIndicator from './TaskIndicator';
import { api } from '../utils/api';
import { useTaskMaster } from '../contexts/TaskMasterContext';

export interface Task {
  id: string;
  title: string;
  description: string;
  details?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskDetailProps {
  task?: Task;
  onClose: () => void;
  onEdit?: (task: Task) => void;
  onStatusChange?: (taskId: string, status: string) => void;
  onTaskClick?: (task: Task) => void;
  isOpen?: boolean;
  className?: string;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ 
  task, 
  onClose, 
  onEdit,
  onStatusChange,
  onTaskClick,
  isOpen = true,
  className = ''
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editedTask, setEditedTask] = useState<Task | undefined>(task);
  const [isSaving, setIsSaving] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showTestStrategy, setShowTestStrategy] = useState(false);
  const { currentProject, refreshTasks } = useTaskMaster();

  if (!isOpen || !task) return null;

  const handleSave = async (): Promise<void> => {
    if (!currentProject) return;
    
    setIsSaving(true);
    try {
      // Only include changed fields
      const updates: Partial<Task> = {};
      if (editedTask?.title !== task.title) updates.title = editedTask.title;
      if (editedTask?.description !== task.description) updates.description = editedTask.description;
      if (editedTask?.details !== task.details) updates.details = editedTask.details;
      
      if (Object.keys(updates).length > 0) {
        const response = await api.taskmaster.updateTask(currentProject.name, task.id, updates);
        
        if (response.ok) {
          // Refresh tasks to get updated data
          refreshTasks?.();
          onEdit?.(editedTask);
          setEditMode(false);
        } else {
          const error = await response.json();
          console.error('Failed to update task:', error);
          alert(`Failed to update task: ${error.message}`);
        }
      } else {
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error updating task:', error instanceof Error ? error.message : 'Unknown error');
      alert('Error updating task. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string): Promise<void> => {
    if (!currentProject) return;
    
    try {
      const response = await api.taskmaster.updateTask(currentProject.name, task.id, { status: newStatus });
      
      if (response.ok) {
        refreshTasks?.();
        onStatusChange?.(task.id, newStatus);
      } else {
        const error = await response.json();
        console.error('Failed to update task status:', error);
        alert(`Failed to update task status: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating task status:', error instanceof Error ? error.message : 'Unknown error');
      alert('Error updating task status. Please try again.');
    }
  };

  const priorityColors = {
    low: 'text-gray-400 dark:text-gray-500',
    medium: 'text-amber-600 dark:text-amber-400',
    high: 'text-red-600 dark:text-red-400',
  };

  const priorityIcons = {
    low: <Circle className="w-4 h-4" />,
    medium: <Flag className="w-4 h-4" />,
    high: <AlertCircle className="w-4 h-4" />,
  };

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm',
      className
    )}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Task {task.id}</h2>
            <TaskIndicator status="fully-configured" />
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Priority */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`font-medium ${priorityColors[task.priority || 'medium']}`}>
              {task.priority === 'high' ? 'High Priority' : task.priority === 'medium' ? 'Medium Priority' : 'Low Priority'}
            </span>
          </div>

          {/* Title */}
          {editMode ? (
            <input
              type="text"
              value={editedTask?.title || ''}
              onChange={(e) => setEditedTask(prev => prev ? { ...prev, title: e.target.value } : undefined)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Task title"
              autoFocus
            />
          ) : (
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{task.title}</h3>
          )}

          {/* Description */}
          {editMode ? (
            <textarea
              value={editedTask?.description || ''}
              onChange={(e) => setEditedTask(prev => prev ? { ...prev, description: e.target.value } : undefined)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              rows={4}
              placeholder="Task description"
            />
          ) : (
            <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">{task.description}</p>
          )}

          {/* Details */}
          {task.details && (
            <div className="mb-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {showDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                {showDetails ? 'Hide details' : 'Show details'}
              </button>
              {showDetails && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{task.details}</p>
                </div>
              )}
            </div>
          )}

          {/* Status */}
          <div className="mb-4">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStatusChange('todo')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${
                  task.status === 'todo' 
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Circle className="w-3 h-3" />
                Todo
              </button>
              <button
                onClick={() => handleStatusChange('in-progress')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${
                  task.status === 'in-progress' 
                    ? 'bg-blue-200 dark:bg-blue-700 text-blue-900 dark:text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                }`}
              >
                <Clock className="w-3 h-3" />
                In Progress
              </button>
              <button
                onClick={() => handleStatusChange('done')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${
                  task.status === 'done' 
                    ? 'bg-green-200 dark:bg-green-700 text-green-900 dark:text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                }`}
              >
                <CheckCircle className="w-3 h-3" />
                Done
              </button>
            </div>
          </div>

          {/* Edit mode controls */}
          {editMode && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setEditMode(false);
                  setEditedTask(task);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Edit button */}
          {!editMode && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setEditMode(true)}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded transition-colors flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Task
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;