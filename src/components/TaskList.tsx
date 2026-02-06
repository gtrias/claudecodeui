import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, List, Grid, ChevronDown, Columns, Plus, Settings, Terminal, FileText, HelpCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';
import TaskCard, { Task } from './TaskCard';
import CreateTaskModal from './CreateTaskModal';
import { useTaskMaster } from '../contexts/TaskMasterContext';
import Shell from './Shell';
import { api } from '../utils/api';

export interface TaskListProps {
  tasks?: Task[];
  onTaskClick?: (task: Task) => void;
  className?: string;
  showParentTasks?: boolean;
  defaultView?: 'list' | 'grid' | 'kanban';
  currentProject?: { name?: string; path?: string; fullPath?: string };
  onTaskCreated?: () => void;
  onShowPRDEditor?: () => void;
  existingPRDs?: { id?: string; title?: string; content?: string }[];
  onRefreshPRDs?: () => void;
}

const TaskList: React.FC<TaskListProps> = ({ 
  tasks = [], 
  onTaskClick, 
  className = '',
  showParentTasks = false,
  defaultView = 'kanban', // 'list', 'grid', or 'kanban'
  currentProject,
  onTaskCreated,
  onShowPRDEditor,
  existingPRDs = [],
  onRefreshPRDs
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'id' | 'title' | 'status' | 'priority' | 'updated'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'kanban'>(defaultView);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCLI, setShowCLI] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [isTaskMasterComplete, setIsTaskMasterComplete] = useState(false);
  const [showPRDDropdown, setShowPRDDropdown] = useState(false);
  
  const { projectTaskMaster, refreshProjects, refreshTasks, setCurrentProject } = useTaskMaster();

  // Close PRD dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (showPRDDropdown && !(event.target as HTMLElement).closest('.relative')) {
        setShowPRDDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPRDDropdown]);

  // Get unique status values from tasks
  const statuses = useMemo(() => {
    const statusSet = new Set(tasks.map(task => task.status).filter(Boolean));
    return Array.from(statusSet).sort();
  }, [tasks]);

  // Get unique priority values from tasks
  const priorities = useMemo(() => {
    const prioritySet = new Set(tasks.map(task => task.priority).filter(Boolean));
    return Array.from(prioritySet).sort();
  }, [tasks]);

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      // Text search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.id.toString().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

      // Priority filter
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'status':
          // Custom status ordering: pending, in-progress, done, blocked, deferred, cancelled
          const statusOrder = { pending: 1, 'in-progress': 2, done: 3, blocked: 4, deferred: 5, cancelled: 6 };
          aVal = statusOrder[a.status] || 99;
          bVal = statusOrder[b.status] || 99;
          break;
        case 'priority':
          // Custom priority ordering: high should be sorted first in descending
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aVal = priorityOrder[a.priority] || 0;
          bVal = priorityOrder[b.priority] || 0;
          break;