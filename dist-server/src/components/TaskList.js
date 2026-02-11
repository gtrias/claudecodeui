import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Filter, ArrowUpDown, Grid, List, Columns, X, FileText, Settings, Terminal, ArrowUp, ArrowDown, ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTaskMaster } from '../contexts/TaskMasterContext';
import TaskCard from './TaskCard';
import CreateTaskModal from './CreateTaskModal';
import Shell from './Shell';
import { api } from '../utils/api';
const TaskList = ({ tasks = [], onTaskClick, className = '', showParentTasks = false, defaultView = 'kanban', currentProject, onTaskCreated, onShowPRDEditor, existingPRDs = [], onRefreshPRDs }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [sortBy, setSortBy] = useState('id');
    const [sortOrder, setSortOrder] = useState('asc');
    const [viewMode, setViewMode] = useState(defaultView);
    const [showFilters, setShowFilters] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCLI, setShowCLI] = useState(false);
    const [showHelpGuide, setShowHelpGuide] = useState(false);
    const [isTaskMasterComplete, setIsTaskMasterComplete] = useState(false);
    const [showPRDDropdown, setShowPRDDropdown] = useState(false);
    // Get TaskMaster context
    const { projectTaskMaster, refreshProjects, setCurrentProject } = useTaskMaster();
    // Close PRD dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showPRDDropdown && !event.target.closest('.relative')) {
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
                case 'updated':
                    aVal = new Date(a.updatedAt || a.createdAt || 0);
                    bVal = new Date(b.updatedAt || b.createdAt || 0);
                    break;
                case 'id':
                default:
                    // Handle numeric and dotted IDs (1, 1.1, 1.2, 2, 2.1, etc.)
                    const parseId = (id) => {
                        const parts = id.toString().split('.');
                        return parts.map(part => parseInt(part, 10));
                    };
                    const aIds = parseId(a.id);
                    const bIds = parseId(b.id);
                    // Compare each part
                    for (let i = 0; i < Math.max(aIds.length, bIds.length); i++) {
                        const aId = aIds[i] || 0;
                        const bId = bIds[i] || 0;
                        if (aId !== bId) {
                            aVal = aId;
                            bVal = bId;
                            break;
                        }
                    }
                    break;
            }
            if (sortBy === 'updated') {
                return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
            }
            if (typeof aVal === 'string') {
                return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });
        return filtered;
    }, [tasks, searchTerm, statusFilter, priorityFilter, sortBy, sortOrder]);
    // Organize tasks by status for Kanban view
    const kanbanColumns = useMemo(() => {
        const allColumns = [
            {
                id: 'pending',
                title: '📋 To Do',
                status: 'pending',
                color: 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700',
                headerColor: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
            },
            {
                id: 'in-progress',
                title: '🚀 In Progress',
                status: 'in-progress',
                color: 'bg-blue-50 dark:bg-blue-900/50 border-blue-200 dark:border-blue-700',
                headerColor: 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
            },
            {
                id: 'done',
                title: '✅ Done',
                status: 'done',
                color: 'bg-emerald-50 dark:bg-emerald-900/50 border-emerald-200 dark:border-emerald-700',
                headerColor: 'bg-emerald-100 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200'
            },
            {
                id: 'blocked',
                title: '🚫 Blocked',
                status: 'blocked',
                color: 'bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-700',
                headerColor: 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
            },
            {
                id: 'deferred',
                title: '⏳ Deferred',
                status: 'deferred',
                color: 'bg-amber-50 dark:bg-amber-900/50 border-amber-200 dark:border-amber-700',
                headerColor: 'bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200'
            },
            {
                id: 'cancelled',
                title: '❌ Cancelled',
                status: 'cancelled',
                color: 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700',
                headerColor: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
            }
        ];
        // Only show columns that have tasks or are part of the main workflow
        const mainWorkflowStatuses = ['pending', 'in-progress', 'done'];
        const columnsWithTasks = allColumns.filter(column => {
            const hasTask = filteredAndSortedTasks.some(task => task.status === column.status);
            const isMainWorkflow = mainWorkflowStatuses.includes(column.status);
            return hasTask || isMainWorkflow;
        });
        return columnsWithTasks.map(column => ({
            ...column,
            tasks: filteredAndSortedTasks.filter(task => task.status === column.status)
        }));
    }, [filteredAndSortedTasks]);
    const handleSortChange = (newSortBy) => {
        if (sortBy === newSortBy) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        }
        else {
            setSortBy(newSortBy);
            setSortOrder('asc');
        }
    };
    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setPriorityFilter('all');
    };
    const getSortIcon = (field) => {
        if (sortBy !== field)
            return _jsx(ArrowUpDown, { className: "w-4 h-4" });
        return sortOrder === 'asc' ? _jsx(ArrowUp, { className: "w-4 h-4" }) : _jsx(ArrowDown, { className: "w-4 h-4" });
    };
    if (tasks.length === 0) {
        // Check if TaskMaster is configured by looking for .taskmaster directory
        const hasTaskMasterDirectory = currentProject?.taskMasterConfigured ||
            currentProject?.taskmaster?.hasTaskmaster ||
            projectTaskMaster?.hasTaskmaster;
        return (_jsxs("div", { className: cn('text-center py-12', className), children: [!hasTaskMasterDirectory ? (
                // TaskMaster not configured
                _jsxs("div", { className: "max-w-md mx-auto", children: [_jsx("div", { className: "text-blue-600 dark:text-blue-400 mb-4", children: _jsx(Settings, { className: "w-12 h-12 mx-auto mb-4" }) }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-2", children: "TaskMaster AI is not configured" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-6", children: "TaskMaster helps break down complex projects into manageable tasks with AI-powered assistance" }), _jsxs("div", { className: "mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-left", children: [_jsx("h4", { className: "text-sm font-medium text-blue-900 dark:text-blue-100 mb-3", children: "\uD83C\uDFAF What is TaskMaster?" }), _jsxs("div", { className: "text-xs text-blue-800 dark:text-blue-200 space-y-1", children: [_jsxs("p", { children: ["\u2022 ", _jsx("strong", { children: "AI-Powered Task Management:" }), " Break complex projects into manageable subtasks"] }), _jsxs("p", { children: ["\u2022 ", _jsx("strong", { children: "PRD Templates:" }), " Generate tasks from Product Requirements Documents"] }), _jsxs("p", { children: ["\u2022 ", _jsx("strong", { children: "Dependency Tracking:" }), " Understand task relationships and execution order"] }), _jsxs("p", { children: ["\u2022 ", _jsx("strong", { children: "Progress Visualization:" }), " Kanban boards and detailed task analytics"] }), _jsxs("p", { children: ["\u2022 ", _jsx("strong", { children: "CLI Integration:" }), " Use taskmaster commands for advanced workflows"] })] })] }), _jsxs("button", { onClick: () => {
                                setIsTaskMasterComplete(false); // Reset completion state
                                setShowCLI(true);
                            }, className: "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto", children: [_jsx(Terminal, { className: "w-4 h-4" }), "Initialize TaskMaster AI"] })] })) : (
                // TaskMaster configured but no tasks - show Getting Started guide
                _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-xl border border-blue-200 dark:border-blue-800 p-6 mb-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center", children: _jsx(FileText, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: "Getting Started with TaskMaster" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "TaskMaster is initialized! Here's what to do next:" })] })] }), _jsxs("div", { className: "space-y-4 text-left", children: [_jsxs("div", { className: "grid gap-3", children: [_jsxs("div", { className: "flex gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg border border-blue-100 dark:border-blue-800/50", children: [_jsx("div", { className: "flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-xs font-semibold rounded-full flex items-center justify-center", children: "1" }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 dark:text-white mb-1", children: "Create a Product Requirements Document (PRD)" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-2", children: "Discuss your project idea and create a PRD that describes what you want to build." }), _jsxs("button", { onClick: () => {
                                                                        onShowPRDEditor?.();
                                                                    }, className: "inline-flex items-center gap-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors", children: [_jsx(FileText, { className: "w-3 h-3" }), "Add PRD"] }), existingPRDs.length > 0 && (_jsxs("div", { className: "mt-3 pt-3 border-t border-gray-200 dark:border-gray-700", children: [_jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-2", children: "Existing PRDs:" }), _jsx("div", { className: "flex flex-wrap gap-2", children: existingPRDs.map((prd) => (_jsxs("button", { onClick: async () => {
                                                                                    try {
                                                                                        // Load the PRD content from the API
                                                                                        const response = await api.get(`/taskmaster/prd/${encodeURIComponent(currentProject.name)}/${encodeURIComponent(prd.name)}`);
                                                                                        if (response.ok) {
                                                                                            const prdData = await response.json();
                                                                                            onShowPRDEditor?.({
                                                                                                name: prd.name,
                                                                                                content: prdData.content,
                                                                                                isExisting: true
                                                                                            });
                                                                                        }
                                                                                        else {
                                                                                            console.error('Failed to load PRD:', response.statusText);
                                                                                        }
                                                                                    }
                                                                                    catch (error) {
                                                                                        console.error('Error loading PRD:', error);
                                                                                    }
                                                                                }, className: "inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors", children: [_jsx(FileText, { className: "w-3 h-3" }), prd.name] }, prd.name))) })] }))] })] }), _jsxs("div", { className: "flex gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg border border-blue-100 dark:border-blue-800/50", children: [_jsx("div", { className: "flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-xs font-semibold rounded-full flex items-center justify-center", children: "2" }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 dark:text-white mb-1", children: "Generate Tasks from PRD" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Once you have a PRD, ask your AI assistant to parse it and TaskMaster will automatically break it down into manageable tasks with implementation details." })] })] }), _jsxs("div", { className: "flex gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg border border-blue-100 dark:border-blue-800/50", children: [_jsx("div", { className: "flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-xs font-semibold rounded-full flex items-center justify-center", children: "3" }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 dark:text-white mb-1", children: "Analyze & Expand Tasks" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Ask your AI assistant to analyze task complexity and expand them into detailed subtasks for easier implementation." })] })] }), _jsxs("div", { className: "flex gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg border border-blue-100 dark:border-blue-800/50", children: [_jsx("div", { className: "flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-xs font-semibold rounded-full flex items-center justify-center", children: "4" }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 dark:text-white mb-1", children: "Start Building" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Ask your AI assistant to begin working on tasks, update their status, and add new tasks as your project evolves." })] })] })] }), _jsx("div", { className: "flex gap-3 pt-4 border-t border-blue-200 dark:border-blue-700", children: _jsxs("button", { onClick: (e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    onShowPRDEditor?.();
                                                }, className: "flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors cursor-pointer", style: { zIndex: 10 }, children: [_jsx(FileText, { className: "w-4 h-4" }), "Add PRD"] }) })] })] }), _jsx("div", { className: "text-center", children: _jsxs("div", { className: "text-sm text-gray-500 dark:text-gray-400 mb-2", children: ["\uD83D\uDCA1 ", _jsx("strong", { children: "Tip:" }), " Start with a PRD to get the most out of TaskMaster's AI-powered task generation"] }) })] })), showCLI && (_jsx("div", { className: "fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-black/50 backdrop-blur-sm", children: _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl h-[600px] flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center", children: _jsx(Terminal, { className: "w-4 h-4 text-blue-600 dark:text-blue-400" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "TaskMaster Setup" }), _jsxs("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: ["Interactive CLI for ", currentProject?.displayName] })] })] }), _jsx("button", { onClick: () => {
                                            setShowCLI(false);
                                            // Refresh project data after closing CLI to detect TaskMaster initialization
                                            setTimeout(() => {
                                                refreshProjects();
                                                // Also refresh the current project's TaskMaster status
                                                if (currentProject) {
                                                    setCurrentProject(currentProject);
                                                }
                                            }, 1000);
                                        }, className: "p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800", children: _jsx(Plus, { className: "w-5 h-5 rotate-45" }) })] }), _jsx("div", { className: "flex-1 p-4", children: _jsx("div", { className: "h-full bg-black rounded-lg overflow-hidden", onClick: (e) => {
                                        // Focus the terminal when clicked
                                        const terminalElement = e.currentTarget.querySelector('.xterm-screen');
                                        if (terminalElement) {
                                            terminalElement.focus();
                                        }
                                    }, children: _jsx(Shell, { selectedProject: currentProject, selectedSession: null, isActive: true, initialCommand: "npx task-master init", isPlainShell: true, onProcessComplete: (exitCode) => {
                                            setIsTaskMasterComplete(true);
                                            if (exitCode === 0) {
                                                // Auto-refresh after successful completion
                                                setTimeout(() => {
                                                    refreshProjects();
                                                    if (currentProject) {
                                                        setCurrentProject(currentProject);
                                                    }
                                                }, 1000);
                                            }
                                        } }) }) }), _jsx("div", { className: "p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "text-sm text-gray-600 dark:text-gray-400", children: isTaskMasterComplete ? (_jsxs("span", { className: "flex items-center gap-2 text-green-600 dark:text-green-400", children: [_jsx("div", { className: "w-2 h-2 bg-green-500 rounded-full" }), "TaskMaster setup completed! You can now close this window."] })) : ("TaskMaster initialization will start automatically") }), _jsx("button", { onClick: () => {
                                                setShowCLI(false);
                                                setIsTaskMasterComplete(false); // Reset state
                                                // Refresh project data after closing CLI to detect TaskMaster initialization
                                                setTimeout(() => {
                                                    refreshProjects();
                                                    // Also refresh the current project's TaskMaster status
                                                    if (currentProject) {
                                                        setCurrentProject(currentProject);
                                                    }
                                                }, 1000);
                                            }, className: cn("px-4 py-2 text-sm font-medium rounded-md transition-colors", isTaskMasterComplete
                                                ? "bg-green-600 hover:bg-green-700 text-white"
                                                : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"), children: isTaskMasterComplete ? "Close & Continue" : "Close" })] }) })] }) }))] }));
    }
    return (_jsxs("div", { className: cn('space-y-4', className), children: [_jsxs("div", { className: "flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between", children: [_jsxs("div", { className: "relative flex-1 max-w-md", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx("input", { type: "text", placeholder: "Search tasks...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsxs("div", { className: "flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1", children: [_jsx("button", { onClick: () => setViewMode('kanban'), className: cn('p-2 rounded-md transition-colors', viewMode === 'kanban'
                                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'), title: "Kanban view", children: _jsx(Columns, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => setViewMode('list'), className: cn('p-2 rounded-md transition-colors', viewMode === 'list'
                                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'), title: "List view", children: _jsx(List, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => setViewMode('grid'), className: cn('p-2 rounded-md transition-colors', viewMode === 'grid'
                                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'), title: "Grid view", children: _jsx(Grid, { className: "w-4 h-4" }) })] }), _jsxs("button", { onClick: () => setShowFilters(!showFilters), className: cn('flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors', showFilters
                                    ? 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'), children: [_jsx(Filter, { className: "w-4 h-4" }), _jsx("span", { className: "hidden sm:inline", children: "Filters" }), _jsx(ChevronDown, { className: cn('w-4 h-4 transition-transform', showFilters && 'rotate-180') })] }), currentProject && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setShowHelpGuide(true), className: "p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-300 dark:border-gray-600", title: "TaskMaster Getting Started Guide", children: _jsx(HelpCircle, { className: "w-4 h-4" }) }), _jsx("div", { className: "relative", children: existingPRDs.length > 0 ? (
                                        // Dropdown when PRDs exist
                                        _jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: () => setShowPRDDropdown(!showPRDDropdown), className: "flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium", title: `${existingPRDs.length} PRD${existingPRDs.length > 1 ? 's' : ''} available`, children: [_jsx(FileText, { className: "w-4 h-4" }), _jsx("span", { className: "hidden sm:inline", children: "PRDs" }), _jsx("span", { className: "px-1.5 py-0.5 text-xs bg-purple-500 rounded-full min-w-[1.25rem] text-center", children: existingPRDs.length }), _jsx(ChevronDown, { className: cn('w-3 h-3 transition-transform hidden sm:block', showPRDDropdown && 'rotate-180') })] }), showPRDDropdown && (_jsx("div", { className: "absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-30", children: _jsxs("div", { className: "p-2", children: [_jsxs("button", { onClick: () => {
                                                                    onShowPRDEditor?.();
                                                                    setShowPRDDropdown(false);
                                                                }, className: "w-full text-left px-3 py-2 text-sm font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded flex items-center gap-2", children: [_jsx(Plus, { className: "w-4 h-4" }), "Create New PRD"] }), _jsx("div", { className: "border-t border-gray-200 dark:border-gray-700 my-1" }), _jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 px-3 py-1 font-medium", children: "Existing PRDs:" }), existingPRDs.map((prd) => (_jsxs("button", { onClick: async () => {
                                                                    try {
                                                                        const response = await api.get(`/taskmaster/prd/${encodeURIComponent(currentProject.name)}/${encodeURIComponent(prd.name)}`);
                                                                        if (response.ok) {
                                                                            const prdData = await response.json();
                                                                            onShowPRDEditor?.({
                                                                                name: prd.name,
                                                                                content: prdData.content,
                                                                                isExisting: true
                                                                            });
                                                                            setShowPRDDropdown(false);
                                                                        }
                                                                    }
                                                                    catch (error) {
                                                                        console.error('Error loading PRD:', error);
                                                                    }
                                                                }, className: "w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2", title: `Modified: ${new Date(prd.modified).toLocaleDateString()}`, children: [_jsx(FileText, { className: "w-4 h-4" }), _jsx("span", { className: "truncate", children: prd.name })] }, prd.name)))] }) }))] })) : (
                                        // Simple button when no PRDs exist
                                        _jsxs("button", { onClick: () => {
                                                onShowPRDEditor?.();
                                            }, className: "flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium", title: "Create Product Requirements Document", children: [_jsx(FileText, { className: "w-4 h-4" }), _jsx("span", { className: "hidden sm:inline", children: "Add PRD" })] })) }), ((currentProject?.taskMasterConfigured || currentProject?.taskmaster?.hasTaskmaster || projectTaskMaster?.hasTaskmaster) || tasks.length > 0) && (_jsxs("button", { onClick: () => setShowCreateModal(true), className: "flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium", title: "Add a new task", children: [_jsx(Plus, { className: "w-4 h-4" }), _jsx("span", { className: "hidden sm:inline", children: "Add Task" })] }))] }))] })] }), showFilters && (_jsxs("div", { className: "bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Status" }), _jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "all", children: "All Statuses" }), statuses.map(status => (_jsx("option", { value: status, children: status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ') }, status)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Priority" }), _jsxs("select", { value: priorityFilter, onChange: (e) => setPriorityFilter(e.target.value), className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "all", children: "All Priorities" }), priorities.map(priority => (_jsx("option", { value: priority, children: priority.charAt(0).toUpperCase() + priority.slice(1) }, priority)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Sort By" }), _jsxs("select", { value: `${sortBy}-${sortOrder}`, onChange: (e) => {
                                            const [field, order] = e.target.value.split('-');
                                            setSortBy(field);
                                            setSortOrder(order);
                                        }, className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "id-asc", children: "ID (Ascending)" }), _jsx("option", { value: "id-desc", children: "ID (Descending)" }), _jsx("option", { value: "title-asc", children: "Title (A-Z)" }), _jsx("option", { value: "title-desc", children: "Title (Z-A)" }), _jsx("option", { value: "status-asc", children: "Status (Pending First)" }), _jsx("option", { value: "status-desc", children: "Status (Done First)" }), _jsx("option", { value: "priority-asc", children: "Priority (High First)" }), _jsx("option", { value: "priority-desc", children: "Priority (Low First)" })] })] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "text-sm text-gray-600 dark:text-gray-400", children: ["Showing ", filteredAndSortedTasks.length, " of ", tasks.length, " tasks"] }), _jsx("button", { onClick: clearFilters, className: "text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium", children: "Clear Filters" })] })] })), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsxs("button", { onClick: () => handleSortChange('id'), className: cn('flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors', sortBy === 'id'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'), children: ["ID ", getSortIcon('id')] }), _jsxs("button", { onClick: () => handleSortChange('status'), className: cn('flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors', sortBy === 'status'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'), children: ["Status ", getSortIcon('status')] }), _jsxs("button", { onClick: () => handleSortChange('priority'), className: cn('flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors', sortBy === 'priority'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'), children: ["Priority ", getSortIcon('priority')] })] }), filteredAndSortedTasks.length === 0 ? (_jsx("div", { className: "text-center py-12", children: _jsxs("div", { className: "text-gray-500 dark:text-gray-400", children: [_jsx(Search, { className: "w-12 h-12 mx-auto mb-4 opacity-50" }), _jsx("h3", { className: "text-lg font-medium mb-2", children: "No tasks match your filters" }), _jsx("p", { className: "text-sm", children: "Try adjusting your search or filter criteria." })] }) })) : viewMode === 'kanban' ? (
            /* Kanban Board Layout - Dynamic grid based on column count */
            _jsx("div", { className: cn("grid gap-6", kanbanColumns.length === 1 && "grid-cols-1 max-w-md mx-auto", kanbanColumns.length === 2 && "grid-cols-1 md:grid-cols-2", kanbanColumns.length === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3", kanbanColumns.length === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4", kanbanColumns.length === 5 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5", kanbanColumns.length >= 6 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"), children: kanbanColumns.map((column) => (_jsxs("div", { className: cn('rounded-xl border shadow-sm transition-shadow hover:shadow-md', column.color), children: [_jsx("div", { className: cn('px-4 py-3 rounded-t-xl border-b', column.headerColor), children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "font-semibold text-sm", children: column.title }), _jsx("div", { className: "flex items-center gap-2", children: _jsx("span", { className: "text-xs font-medium px-2 py-1 bg-white/60 dark:bg-black/20 rounded-full", children: column.tasks.length }) })] }) }), _jsx("div", { className: "p-3 space-y-3 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto", children: column.tasks.length === 0 ? (_jsxs("div", { className: "text-center py-8 text-gray-400 dark:text-gray-500", children: [_jsx("div", { className: "w-8 h-8 mx-auto mb-2 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center", children: _jsx("div", { className: "w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" }) }), _jsx("div", { className: "text-xs font-medium text-gray-500 dark:text-gray-400", children: "No tasks yet" }), _jsx("div", { className: "text-xs text-gray-400 dark:text-gray-500 mt-1", children: column.status === 'pending' ? 'Tasks will appear here' :
                                            column.status === 'in-progress' ? 'Move tasks here when started' :
                                                column.status === 'done' ? 'Completed tasks appear here' :
                                                    'Tasks with this status will appear here' })] })) : (column.tasks.map((task) => (_jsx("div", { className: "transform transition-transform hover:scale-[1.02]", children: _jsx(TaskCard, { task: task, onClick: () => onTaskClick?.(task), showParent: showParentTasks, className: "w-full shadow-sm hover:shadow-md transition-shadow cursor-pointer" }) }, task.id)))) })] }, column.id))) })) : (_jsx("div", { className: cn('gap-4', viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                    : 'space-y-4'), children: filteredAndSortedTasks.map((task) => (_jsx(TaskCard, { task: task, onClick: () => onTaskClick?.(task), showParent: showParentTasks, className: viewMode === 'grid' ? 'h-full' : '' }, task.id))) })), showCreateModal && (_jsx(CreateTaskModal, { currentProject: currentProject, onClose: () => setShowCreateModal(false), onTaskCreated: () => {
                    setShowCreateModal(false);
                    if (onTaskCreated)
                        onTaskCreated();
                } })), showHelpGuide && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm", children: _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center", children: _jsx(FileText, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: "Getting Started with TaskMaster" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Your guide to productive task management" })] })] }), _jsx("button", { onClick: () => setShowHelpGuide(false), className: "p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsx("div", { className: "p-6 overflow-y-auto max-h-[calc(90vh-120px)]", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-lg border border-blue-200 dark:border-blue-800", children: [_jsx("div", { className: "flex-shrink-0 w-8 h-8 bg-blue-600 text-white text-sm font-semibold rounded-full flex items-center justify-center", children: "1" }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 dark:text-white mb-2", children: "Create a Product Requirements Document (PRD)" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-3", children: "Discuss your project idea and create a PRD that describes what you want to build." }), _jsxs("button", { onClick: () => {
                                                            onShowPRDEditor?.();
                                                            setShowHelpGuide(false);
                                                        }, className: "inline-flex items-center gap-2 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors", children: [_jsx(FileText, { className: "w-4 h-4" }), "Add PRD"] })] })] }), _jsxs("div", { className: "flex gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-lg border border-green-200 dark:border-green-800", children: [_jsx("div", { className: "flex-shrink-0 w-8 h-8 bg-green-600 text-white text-sm font-semibold rounded-full flex items-center justify-center", children: "2" }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 dark:text-white mb-2", children: "Generate Tasks from PRD" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-3", children: "Once you have a PRD, ask your AI assistant to parse it and TaskMaster will automatically break it down into manageable tasks with implementation details." }), _jsxs("div", { className: "bg-white dark:bg-gray-800/50 rounded border border-green-200 dark:border-green-700/50 p-3 mb-2", children: [_jsx("p", { className: "text-xs font-medium text-gray-600 dark:text-gray-400 mb-1", children: "\uD83D\uDCAC Example:" }), _jsx("p", { className: "text-xs text-gray-900 dark:text-white font-mono", children: "\"I've just initialized a new project with Claude Task Master. I have a PRD at .taskmaster/docs/prd.txt. Can you help me parse it and set up the initial tasks?\"" })] })] })] }), _jsxs("div", { className: "flex gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 rounded-lg border border-amber-200 dark:border-amber-800", children: [_jsx("div", { className: "flex-shrink-0 w-8 h-8 bg-amber-600 text-white text-sm font-semibold rounded-full flex items-center justify-center", children: "3" }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 dark:text-white mb-2", children: "Analyze & Expand Tasks" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-3", children: "Ask your AI assistant to analyze task complexity and expand them into detailed subtasks for easier implementation." }), _jsxs("div", { className: "bg-white dark:bg-gray-800/50 rounded border border-amber-200 dark:border-amber-700/50 p-3 mb-2", children: [_jsx("p", { className: "text-xs font-medium text-gray-600 dark:text-gray-400 mb-1", children: "\uD83D\uDCAC Example:" }), _jsx("p", { className: "text-xs text-gray-900 dark:text-white font-mono", children: "\"Task 5 seems complex. Can you break it down into subtasks?\"" })] })] })] }), _jsxs("div", { className: "flex gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-lg border border-purple-200 dark:border-purple-800", children: [_jsx("div", { className: "flex-shrink-0 w-8 h-8 bg-purple-600 text-white text-sm font-semibold rounded-full flex items-center justify-center", children: "4" }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 dark:text-white mb-2", children: "Start Building" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-3", children: "Ask your AI assistant to begin working on tasks, update their status, and add new tasks as your project evolves." }), _jsxs("div", { className: "bg-white dark:bg-gray-800/50 rounded border border-purple-200 dark:border-purple-700/50 p-3 mb-3", children: [_jsx("p", { className: "text-xs font-medium text-gray-600 dark:text-gray-400 mb-1", children: "\uD83D\uDCAC Example:" }), _jsx("p", { className: "text-xs text-gray-900 dark:text-white font-mono", children: "\"Please add a new task to implement user profile image uploads using Cloudinary, research the best approach.\"" })] }), _jsx("a", { href: "https://github.com/eyaltoledano/claude-task-master/blob/main/docs/examples.md", target: "_blank", rel: "noopener noreferrer", className: "inline-block text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline", children: "View more examples and usage patterns \u2192" })] })] }), _jsxs("div", { className: "mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700", children: [_jsx("h4", { className: "font-medium text-gray-900 dark:text-white mb-3", children: "\uD83D\uDCA1 Pro Tips" }), _jsxs("ul", { className: "space-y-2 text-sm text-gray-600 dark:text-gray-400", children: [_jsxs("li", { className: "flex items-start gap-2", children: [_jsx("span", { className: "w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" }), "Use the search bar to quickly find specific tasks"] }), _jsxs("li", { className: "flex items-start gap-2", children: [_jsx("span", { className: "w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" }), "Switch between Kanban, List, and Grid views using the view toggles"] }), _jsxs("li", { className: "flex items-start gap-2", children: [_jsx("span", { className: "w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" }), "Use filters to focus on specific task statuses or priorities"] }), _jsxs("li", { className: "flex items-start gap-2", children: [_jsx("span", { className: "w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" }), "Click on any task to view detailed information and manage subtasks"] })] })] }), _jsxs("div", { className: "mt-6 p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800", children: [_jsx("h4", { className: "font-medium text-blue-900 dark:text-blue-100 mb-3", children: "\uD83D\uDCDA Learn More" }), _jsx("p", { className: "text-sm text-blue-800 dark:text-blue-200 mb-3", children: "TaskMaster AI is an advanced task management system built for developers. Get documentation, examples, and contribute to the project." }), _jsxs("a", { href: "https://github.com/eyaltoledano/claude-task-master", target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors", children: [_jsx("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z", clipRule: "evenodd" }) }), "View on GitHub", _jsx("svg", { className: "w-3 h-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" }) })] })] })] }) })] }) }))] }));
};
export default TaskList;
