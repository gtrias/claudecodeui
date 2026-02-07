import React, { useState } from 'react';
import { X, Flag, User, ArrowRight, CheckCircle, Circle, AlertCircle, Pause, Edit, Save, Copy, ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import TaskIndicator from './TaskIndicator';
import { api } from '../utils/api';
import { useTaskMaster } from '../contexts/TaskMasterContext';

export interface Task {
  id: string;
  title: string;
  description?: string;
  details?: string;
  status: string;
  priority?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  dueDate?: string;
}

export interface TaskDetailProps {
  task?: Task;
  onClose?: () => void;
  onEdit?: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: string) => void;
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
  const [editedTask, setEditedTask] = useState<Task | null>(task || null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showTestStrategy, setShowTestStrategy] = useState(false);
  const { currentProject, refreshTasks } = useTaskMaster();

  if (!isOpen || !task) return null;

  const handleSave = async () => {
    if (!currentProject) return;
    
    setIsSaving(true);
    try {
      // Only include changed fields
      const updates: Partial<Task> = {};
      if (editedTask?.title !== task.title) updates.title = editedTask?.title;
      if (editedTask?.description !== task.description) updates.description = editedTask?.description;
      if (editedTask?.details !== task.details) updates.details = editedTask?.details;
      
      if (Object.keys(updates).length > 0) {
        const response = await api.taskmaster.updateTask(currentProject.name, task.id, updates);
        
        if (response.ok) {
          // Refresh tasks to get updated data
          refreshTasks?.();
          onEdit?.(editedTask || task);
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
      console.error('Error updating task:', error);
      alert('Error updating task. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
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
      console.error('Error updating task status:', error);
      alert('Error updating task status. Please try again.');
    }
  };