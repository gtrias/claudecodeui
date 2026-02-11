import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { ArrowRight, List, Flag, CheckCircle, Circle, Plus, FileText, Settings, X, Terminal, Eye, Play, Zap, Target } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTaskMaster } from '../contexts/TaskMasterContext';
import { api } from '../utils/api';
import Shell from './Shell';
import TaskDetail from './TaskDetail';
const NextTaskBanner = ({ onShowAllTasks, onStartTask, className = '' }) => {
    const { nextTask, tasks, currentProject, isLoadingTasks, projectTaskMaster, refreshTasks, refreshProjects } = useTaskMaster();
    const [showDetails, setShowDetails] = useState(false);
    const [showTaskOptions, setShowTaskOptions] = useState(false);
    const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [showCLI, setShowCLI] = useState(false);
    const [showTaskDetail, setShowTaskDetail] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    // Handler functions
    const handleInitializeTaskMaster = async () => {
        if (!currentProject)
            return;
        setIsLoading(true);
        try {
            const response = await api.taskmaster.init(currentProject.name);
            if (response.ok) {
                await refreshProjects();
                setShowTaskOptions(false);
            }
            else {
                const error = await response.json();
                console.error('Failed to initialize TaskMaster:', error);
                alert(`Failed to initialize TaskMaster: ${error.message}`);
            }
        }
        catch (error) {
            console.error('Error initializing TaskMaster:', error);
            alert('Error initializing TaskMaster. Please try again.');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleCreateManualTask = () => {
        setShowCreateTaskModal(true);
        setShowTaskOptions(false);
    };
    const handleParsePRD = () => {
        setShowTemplateSelector(true);
        setShowTaskOptions(false);
    };
    // Don't show if no project or still loading
    if (!currentProject || isLoadingTasks) {
        return null;
    }
    let bannerContent;
    // Show setup message only if no tasks exist AND TaskMaster is not configured
    if ((!tasks || tasks.length === 0) && !projectTaskMaster?.hasTaskmaster) {
        bannerContent = (_jsxs("div", { className: cn('bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4', className), children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(List, { className: "w-4 h-4 text-blue-600 dark:text-blue-400" }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white", children: "TaskMaster AI is not configured" }), _jsx("div", { className: "text-xs text-gray-600 dark:text-gray-400 mt-0.5" })] })] }), _jsx("div", { className: "flex items-center gap-1", children: _jsxs("button", { onClick: () => setShowTaskOptions(!showTaskOptions), className: "text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center gap-1", children: [_jsx(Settings, { className: "w-3 h-3" }), "Initialize TaskMaster AI"] }) })] }), showTaskOptions && (_jsxs("div", { className: "mt-3 pt-3 border-t border-blue-200 dark:border-blue-800", children: [!projectTaskMaster?.hasTaskmaster && (_jsxs("div", { className: "mb-3 p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg", children: [_jsx("h4", { className: "text-sm font-medium text-blue-900 dark:text-blue-100 mb-2", children: "\uD83C\uDFAF What is TaskMaster?" }), _jsxs("div", { className: "text-xs text-blue-800 dark:text-blue-200 space-y-1", children: [_jsxs("p", { children: ["\u2022 ", _jsx("strong", { children: "AI-Powered Task Management:" }), " Break complex projects into manageable subtasks"] }), _jsxs("p", { children: ["\u2022 ", _jsx("strong", { children: "PRD Templates:" }), " Generate tasks from Product Requirements Documents"] }), _jsxs("p", { children: ["\u2022 ", _jsx("strong", { children: "Dependency Tracking:" }), " Understand task relationships and execution order"] }), _jsxs("p", { children: ["\u2022 ", _jsx("strong", { children: "Progress Visualization:" }), " Kanban boards and detailed task analytics"] }), _jsxs("p", { children: ["\u2022 ", _jsx("strong", { children: "CLI Integration:" }), " Use taskmaster commands for advanced workflows"] })] })] })), _jsx("div", { className: "flex flex-col gap-2", children: !projectTaskMaster?.hasTaskmaster ? (_jsxs("button", { className: "text-xs px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded transition-colors text-left flex items-center gap-2", onClick: () => setShowCLI(true), children: [_jsx(Terminal, { className: "w-3 h-3" }), "Initialize TaskMaster"] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "mb-2 p-2 bg-green-50 dark:bg-green-900/30 rounded text-xs text-green-800 dark:text-green-200", children: [_jsx("strong", { children: "Add more tasks:" }), " Create additional tasks manually or generate them from a PRD template"] }), _jsxs("button", { className: "text-xs px-3 py-2 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-800 dark:text-green-200 rounded transition-colors text-left flex items-center gap-2 disabled:opacity-50", onClick: handleCreateManualTask, disabled: isLoading, children: [_jsx(Plus, { className: "w-3 h-3" }), "Create a new task manually"] }), _jsxs("button", { className: "text-xs px-3 py-2 bg-purple-100 dark:bg-purple-900 hover:bg-purple-200 dark:hover:bg-purple-800 text-purple-800 dark:text-purple-200 rounded transition-colors text-left flex items-center gap-2 disabled:opacity-50", onClick: handleParsePRD, disabled: isLoading, children: [_jsx(FileText, { className: "w-3 h-3" }), isLoading ? 'Parsing...' : 'Generate tasks from PRD template'] })] })) })] }))] }));
    }
    else if (nextTask) {
        // Show next task if available
        bannerContent = (_jsx("div", { className: cn('bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-4', className), children: _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("div", { className: "w-5 h-5 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0", children: _jsx(Target, { className: "w-3 h-3 text-blue-600 dark:text-blue-400" }) }), _jsxs("span", { className: "text-xs text-slate-600 dark:text-slate-400 font-medium", children: ["Task ", nextTask.id] }), nextTask.priority === 'high' && (_jsx("div", { className: "w-4 h-4 rounded bg-red-100 dark:bg-red-900/50 flex items-center justify-center", title: "High Priority", children: _jsx(Zap, { className: "w-2.5 h-2.5 text-red-600 dark:text-red-400" }) })), nextTask.priority === 'medium' && (_jsx("div", { className: "w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center", title: "Medium Priority", children: _jsx(Flag, { className: "w-2.5 h-2.5 text-amber-600 dark:text-amber-400" }) })), nextTask.priority === 'low' && (_jsx("div", { className: "w-4 h-4 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center", title: "Low Priority", children: _jsx(Circle, { className: "w-2.5 h-2.5 text-gray-400 dark:text-gray-500" }) }))] }), _jsx("p", { className: "text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-1", children: nextTask.title })] }), _jsxs("div", { className: "flex items-center gap-1 flex-shrink-0", children: [_jsxs("button", { onClick: () => onStartTask?.(), className: "text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors shadow-sm flex items-center gap-1", children: [_jsx(Play, { className: "w-3 h-3" }), "Start Task"] }), _jsx("button", { onClick: () => setShowTaskDetail(true), className: "text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md transition-colors flex items-center gap-1", title: "View task details", children: _jsx(Eye, { className: "w-3 h-3" }) }), onShowAllTasks && (_jsx("button", { onClick: onShowAllTasks, className: "text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md transition-colors flex items-center gap-1", title: "View all tasks", children: _jsx(List, { className: "w-3 h-3" }) }))] })] }) }));
    }
    else if (tasks && tasks.length > 0) {
        // Show completion message only if there are tasks and all are done
        const completedTasks = tasks.filter(task => task.status === 'done').length;
        const totalTasks = tasks.length;
        bannerContent = (_jsx("div", { className: cn('bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-3 mb-4', className), children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-purple-600 dark:text-purple-400" }), _jsx("span", { className: "text-sm font-medium text-gray-900 dark:text-white", children: completedTasks === totalTasks ? "All done! 🎉" : "No pending tasks" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-xs text-gray-600 dark:text-gray-400", children: [completedTasks, "/", totalTasks] }), _jsx("button", { onClick: onShowAllTasks, className: "text-xs px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors", children: "Review" })] })] }) }));
    }
    else {
        // TaskMaster is configured but no tasks exist - don't show anything in chat
        bannerContent = null;
    }
    return (_jsxs(_Fragment, { children: [bannerContent, showCreateTaskModal && (_jsx(CreateTaskModal, { currentProject: currentProject, onClose: () => setShowCreateTaskModal(false), onTaskCreated: () => {
                    refreshTasks();
                    setShowCreateTaskModal(false);
                } })), showTemplateSelector && (_jsx(TemplateSelector, { currentProject: currentProject, onClose: () => setShowTemplateSelector(false), onTemplateApplied: () => {
                    refreshTasks();
                    setShowTemplateSelector(false);
                } })), showCLI && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm", children: _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl h-[600px] flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center", children: _jsx(Terminal, { className: "w-4 h-4 text-blue-600 dark:text-blue-400" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "TaskMaster Setup" }), _jsxs("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: ["Interactive CLI for ", currentProject?.displayName] })] })] }), _jsx("button", { onClick: () => setShowCLI(false), className: "p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsx("div", { className: "flex-1 p-4", children: _jsx("div", { className: "h-full bg-black rounded-lg overflow-hidden", children: _jsx(Shell, { selectedProject: currentProject, selectedSession: null, isActive: true, initialCommand: "npx task-master init", isPlainShell: true }) }) }), _jsx("div", { className: "p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "text-sm text-gray-600 dark:text-gray-400", children: "TaskMaster initialization will start automatically" }), _jsx("button", { onClick: () => setShowCLI(false), className: "px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors", children: "Close" })] }) })] }) })), showTaskDetail && nextTask && (_jsx(TaskDetail, { task: nextTask, isOpen: showTaskDetail, onClose: () => setShowTaskDetail(false), onStatusChange: () => refreshTasks?.(), onTaskClick: undefined }))] }));
};
// Simple Create Task Modal Component
const CreateTaskModal = ({ currentProject, onClose, onTaskCreated }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        useAI: false,
        prompt: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentProject)
            return;
        setIsSubmitting(true);
        try {
            const taskData = formData.useAI
                ? { prompt: formData.prompt, priority: formData.priority }
                : { title: formData.title, description: formData.description, priority: formData.priority };
            const response = await api.taskmaster.addTask(currentProject.name, taskData);
            if (response.ok) {
                onTaskCreated();
            }
            else {
                const error = await response.json();
                console.error('Failed to create task:', error);
                alert(`Failed to create task: ${error.message}`);
            }
        }
        catch (error) {
            console.error('Error creating task:', error);
            alert('Error creating task. Please try again.');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleCheckboxChange = (e) => {
        setFormData(prev => ({ ...prev, useAI: e.target.checked }));
    };
    const handlePromptChange = (e) => {
        setFormData(prev => ({ ...prev, prompt: e.target.value }));
    };
    const handleTitleChange = (e) => {
        setFormData(prev => ({ ...prev, title: e.target.value }));
    };
    const handleDescriptionChange = (e) => {
        setFormData(prev => ({ ...prev, description: e.target.value }));
    };
    const handlePriorityChange = (e) => {
        setFormData(prev => ({ ...prev, priority: e.target.value }));
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Create New Task" }), _jsx("button", { onClick: onClose, className: "p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded", children: _jsx(X, { className: "w-4 h-4" }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsx("div", { children: _jsxs("label", { className: "flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [_jsx("input", { type: "checkbox", checked: formData.useAI, onChange: handleCheckboxChange }), "Use AI to generate task details"] }) }), formData.useAI ? (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Task Description (AI will generate details)" }), _jsx("textarea", { value: formData.prompt, onChange: handlePromptChange, className: "w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white", rows: 3, placeholder: "Describe what you want to accomplish...", required: true })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Task Title" }), _jsx("input", { type: "text", value: formData.title, onChange: handleTitleChange, className: "w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white", placeholder: "Enter task title...", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Description" }), _jsx("textarea", { value: formData.description, onChange: handleDescriptionChange, className: "w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white", rows: 3, placeholder: "Describe the task...", required: true })] })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Priority" }), _jsxs("select", { value: formData.priority, onChange: handlePriorityChange, className: "w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white", children: [_jsx("option", { value: "low", children: "Low" }), _jsx("option", { value: "medium", children: "Medium" }), _jsx("option", { value: "high", children: "High" })] })] }), _jsxs("div", { className: "flex gap-2 pt-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300", disabled: isSubmitting, children: "Cancel" }), _jsx("button", { type: "submit", className: "flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50", disabled: isSubmitting || (formData.useAI && !formData.prompt.trim()) || (!formData.useAI && (!formData.title.trim() || !formData.description.trim())), children: isSubmitting ? 'Creating...' : 'Create Task' })] })] })] }) }));
};
// Template Selector Modal Component
const TemplateSelector = ({ currentProject, onClose, onTemplateApplied }) => {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [customizations, setCustomizations] = useState({});
    const [fileName, setFileName] = useState('prd.txt');
    const [isLoading, setIsLoading] = useState(true);
    const [isApplying, setIsApplying] = useState(false);
    const [step, setStep] = useState('select');
    useEffect(() => {
        const loadTemplates = async () => {
            try {
                const response = await api.taskmaster.getTemplates();
                if (response.ok) {
                    const data = await response.json();
                    setTemplates(data.templates);
                }
            }
            catch (error) {
                console.error('Error loading templates:', error);
            }
            finally {
                setIsLoading(false);
            }
        };
        loadTemplates();
    }, []);
    const handleSelectTemplate = (template) => {
        setSelectedTemplate(template);
        // Find placeholders in template content
        const placeholders = template.content.match(/\[([^\]]+)\]/g) || [];
        const uniquePlaceholders = [...new Set(placeholders.map(p => p.slice(1, -1)))];
        const initialCustomizations = {};
        uniquePlaceholders.forEach(placeholder => {
            initialCustomizations[placeholder] = '';
        });
        setCustomizations(initialCustomizations);
        setStep('customize');
    };
    const handleApplyTemplate = async () => {
        if (!selectedTemplate || !currentProject)
            return;
        setIsApplying(true);
        try {
            // Apply template
            const applyResponse = await api.taskmaster.applyTemplate(currentProject.name, {
                templateId: selectedTemplate.id,
                fileName,
                customizations
            });
            if (!applyResponse.ok) {
                const error = await applyResponse.json();
                throw new Error(error.message || 'Failed to apply template');
            }
            // Parse PRD to generate tasks
            const parseResponse = await api.taskmaster.parsePRD(currentProject.name, {
                fileName,
                numTasks: 10
            });
            if (!parseResponse.ok) {
                const error = await parseResponse.json();
                throw new Error(error.message || 'Failed to generate tasks');
            }
            setStep('generate');
            setTimeout(() => {
                onTemplateApplied();
            }, 2000);
        }
        catch (error) {
            console.error('Error applying template:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setIsApplying(false);
        }
    };
    const handleFileNameChange = (e) => {
        setFileName(e.target.value);
    };
    const handleCustomizationChange = (key, value) => {
        setCustomizations(prev => ({ ...prev, [key]: value }));
    };
    if (isLoading) {
        return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" }), _jsx("span", { className: "text-gray-900 dark:text-white", children: "Loading templates..." })] }) }) }));
    }
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: step === 'select' ? 'Select PRD Template' :
                                step === 'customize' ? 'Customize Template' :
                                    'Generating Tasks' }), _jsx("button", { onClick: onClose, className: "p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded", children: _jsx(X, { className: "w-4 h-4" }) })] }), step === 'select' && (_jsx("div", { className: "space-y-3", children: templates.map((template) => (_jsx("div", { className: "p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors", onClick: () => handleSelectTemplate(template), children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "font-medium text-gray-900 dark:text-white", children: template.name }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mt-1", children: template.description }), _jsx("span", { className: "inline-block text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded mt-2", children: template.category })] }), _jsx(ArrowRight, { className: "w-4 h-4 text-gray-400 mt-1" })] }) }, template.id))) })), step === 'customize' && selectedTemplate && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "File Name" }), _jsx("input", { type: "text", value: fileName, onChange: handleFileNameChange, className: "w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white", placeholder: "prd.txt" })] }), Object.keys(customizations).length > 0 && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Customize Template" }), _jsx("div", { className: "space-y-3", children: Object.entries(customizations).map(([key, value]) => (_jsxs("div", { children: [_jsx("label", { className: "block text-xs text-gray-600 dark:text-gray-400 mb-1", children: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) }), _jsx("input", { type: "text", value: value, onChange: (e) => handleCustomizationChange(key, e.target.value), className: "w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white", placeholder: `Enter ${key.toLowerCase()}` })] }, key))) })] })), _jsxs("div", { className: "flex gap-2 pt-4", children: [_jsx("button", { onClick: () => setStep('select'), className: "flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300", children: "Back" }), _jsx("button", { onClick: handleApplyTemplate, className: "flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded disabled:opacity-50", disabled: isApplying, children: isApplying ? 'Applying...' : 'Apply & Generate Tasks' })] })] })), step === 'generate' && (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(CheckCircle, { className: "w-8 h-8 text-green-600 dark:text-green-400" }) }), _jsx("h4", { className: "text-lg font-medium text-gray-900 dark:text-white mb-2", children: "Template Applied Successfully!" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Your PRD has been created and tasks are being generated..." })] }))] }) }));
};
export default NextTaskBanner;
