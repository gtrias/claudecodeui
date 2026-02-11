import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/*
 * MainContent.tsx - Main Content Area with Session Protection Props Passthrough
 *
 * SESSION PROTECTION PASSTHROUGH:
 * ===============================
 *
 * This component serves as a passthrough layer for Session Protection functions:
 * - Receives session management functions from App.tsx
 * - Passes them down to ChatInterface.tsx
 *
 * No session protection logic is implemented here - it's purely a props bridge.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ChatInterface from './ChatInterface';
import FileTree from './FileTree';
import CodeEditor from './CodeEditor';
import StandaloneShell from './StandaloneShell';
import GitPanel from './GitPanel';
import ErrorBoundary from './ErrorBoundary';
import ClaudeLogo from './ClaudeLogo';
import CursorLogo from './CursorLogo';
import CodexLogo from './CodexLogo';
import PiLogo from './PiLogo';
import TaskList from './TaskList';
import TaskDetail from './TaskDetail';
import PRDEditor from './PRDEditor';
import Tooltip from './Tooltip';
import { useTaskMaster } from '../contexts/TaskMasterContext';
import { useTasksSettings } from '../contexts/TasksSettingsContext';
import { api } from '../utils/api';
function MainContent({ selectedProject, selectedSession, activeTab, setActiveTab, ws, sendMessage, latestMessage, isMobile, isPWA, onMenuClick, isLoading, onInputFocusChange, onSessionActive, onSessionInactive, onSessionProcessing, onSessionNotProcessing, processingSessions, onReplaceTemporarySession, onNavigateToSession, onShowSettings, autoExpandTools, showRawParameters, showThinking, autoScrollToBottom, sendByCtrlEnter, externalMessageUpdate }) {
    const { t } = useTranslation();
    const [editingFile, setEditingFile] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showTaskDetail, setShowTaskDetail] = useState(false);
    const [editorWidth, setEditorWidth] = useState(600);
    const [isResizing, setIsResizing] = useState(false);
    const [editorExpanded, setEditorExpanded] = useState(false);
    const resizeRef = useRef(null);
    // PRD Editor state
    const [showPRDEditor, setShowPRDEditor] = useState(false);
    const [selectedPRD, setSelectedPRD] = useState(null);
    const [existingPRDs, setExistingPRDs] = useState([]);
    const [prdNotification, setPRDNotification] = useState(null);
    // TaskMaster context
    const { tasks, currentProject, refreshTasks, setCurrentProject } = useTaskMaster();
    const { tasksEnabled, isTaskMasterInstalled, isTaskMasterReady } = useTasksSettings();
    // Only show tasks tab if TaskMaster is installed and enabled
    const shouldShowTasksTab = tasksEnabled && isTaskMasterInstalled;
    // Sync selectedProject with TaskMaster context
    useEffect(() => {
        if (selectedProject && selectedProject !== currentProject) {
            setCurrentProject(selectedProject);
        }
    }, [selectedProject, currentProject, setCurrentProject]);
    // Switch away from tasks tab when tasks are disabled or TaskMaster is not installed
    useEffect(() => {
        if (!shouldShowTasksTab && activeTab === 'tasks') {
            setActiveTab('chat');
        }
    }, [shouldShowTasksTab, activeTab, setActiveTab]);
    // Load existing PRDs when current project changes
    useEffect(() => {
        const loadExistingPRDs = async () => {
            if (!currentProject?.name) {
                setExistingPRDs([]);
                return;
            }
            try {
                const response = await api.get(`/taskmaster/prd/${encodeURIComponent(currentProject.name)}`);
                if (response.ok) {
                    const data = await response.json();
                    setExistingPRDs(data.prdFiles || []);
                }
                else {
                    setExistingPRDs([]);
                }
            }
            catch (error) {
                console.error('Failed to load existing PRDs:', error);
                setExistingPRDs([]);
            }
        };
        loadExistingPRDs();
    }, [currentProject?.name]);
    const handleFileOpen = (filePath, diffInfo = null) => {
        // Create a file object that CodeEditor expects
        const fileName = filePath ? filePath.split('/').pop() || '' : '';
        const file = {
            name: fileName,
            path: filePath || '',
            projectName: selectedProject?.name,
            diffInfo: diffInfo // Pass along diff information if available
        };
        setEditingFile(file);
    };
    const handleCloseEditor = () => {
        setEditingFile(null);
        setEditorExpanded(false);
    };
    const handleToggleEditorExpand = () => {
        setEditorExpanded(!editorExpanded);
    };
    const handleTaskClick = (task) => {
        // If task is just an ID (from dependency click), find the full task object
        if (typeof task === 'object' && task.id && !task.title) {
            const fullTask = tasks?.find((t) => t.id === task.id);
            if (fullTask) {
                setSelectedTask(fullTask);
                setShowTaskDetail(true);
            }
        }
        else if (typeof task === 'object') {
            setSelectedTask(task);
            setShowTaskDetail(true);
        }
    };
    const handleTaskDetailClose = () => {
        setShowTaskDetail(false);
        setSelectedTask(null);
    };
    const handleTaskStatusChange = (taskId, newStatus) => {
        // This would integrate with TaskMaster API to update task status
        console.log('Update task status:', taskId, newStatus);
        refreshTasks?.();
    };
    // Handle resize functionality
    const handleMouseDown = (e) => {
        if (isMobile)
            return; // Disable resize on mobile
        setIsResizing(true);
        e.preventDefault();
    };
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing)
                return;
            const container = resizeRef.current?.parentElement;
            if (!container)
                return;
            const containerRect = container.getBoundingClientRect();
            const newWidth = containerRect.right - e.clientX;
            // Min width: 300px, Max width: 80% of container
            const minWidth = 300;
            const maxWidth = containerRect.width * 0.8;
            if (newWidth >= minWidth && newWidth <= maxWidth) {
                setEditorWidth(newWidth);
            }
        };
        const handleMouseUp = () => {
            setIsResizing(false);
        };
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing]);
    if (isLoading) {
        return (_jsxs("div", { className: "h-full flex flex-col", children: [isMobile && (_jsx("div", { className: "bg-background border-b border-border p-2 sm:p-3 pwa-header-safe flex-shrink-0", children: _jsx("button", { onClick: onMenuClick, className: "p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 pwa-menu-button", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 12h16M4 18h16" }) }) }) })), _jsx("div", { className: "flex-1 flex items-center justify-center", children: _jsxs("div", { className: "text-center text-gray-500 dark:text-gray-400", children: [_jsx("div", { className: "w-12 h-12 mx-auto mb-4", children: _jsx("div", { className: "w-full h-full rounded-full border-4 border-gray-200 border-t-blue-500", style: {
                                        animation: 'spin 1s linear infinite',
                                        WebkitAnimation: 'spin 1s linear infinite',
                                        MozAnimation: 'spin 1s linear infinite'
                                    } }) }), _jsx("h2", { className: "text-xl font-semibold mb-2", children: t('mainContent.loading') }), _jsx("p", { children: t('mainContent.settingUpWorkspace') })] }) })] }));
    }
    if (!selectedProject) {
        return (_jsxs("div", { className: "h-full flex flex-col", children: [isMobile && (_jsx("div", { className: "bg-background border-b border-border p-2 sm:p-3 pwa-header-safe flex-shrink-0", children: _jsx("button", { onClick: onMenuClick, className: "p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 pwa-menu-button", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 12h16M4 18h16" }) }) }) })), _jsx("div", { className: "flex-1 flex items-center justify-center", children: _jsxs("div", { className: "text-center text-gray-500 dark:text-gray-400 max-w-md mx-auto px-6", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center", children: _jsx("svg", { className: "w-8 h-8 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" }) }) }), _jsx("h2", { className: "text-2xl font-semibold mb-3 text-gray-900 dark:text-white", children: t('mainContent.chooseProject') }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 mb-6 leading-relaxed", children: t('mainContent.selectProjectDescription') }), _jsx("div", { className: "bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800", children: _jsxs("p", { className: "text-sm text-blue-700 dark:text-blue-300", children: ["\uD83D\uDCA1 ", _jsxs("strong", { children: [t('mainContent.tip'), ":"] }), " ", isMobile ? t('mainContent.createProjectMobile') : t('mainContent.createProjectDesktop')] }) })] }) })] }));
    }
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsx("div", { className: "bg-background border-b border-border p-2 sm:p-3 pwa-header-safe flex-shrink-0", children: _jsxs("div", { className: "flex items-center justify-between relative", children: [_jsxs("div", { className: "flex items-center space-x-2 min-w-0 flex-1", children: [isMobile && (_jsx("button", { onClick: onMenuClick, onTouchStart: (e) => {
                                        e.preventDefault();
                                        onMenuClick();
                                    }, className: "p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 touch-manipulation active:scale-95 pwa-menu-button flex-shrink-0", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 12h16M4 18h16" }) }) })), _jsxs("div", { className: "min-w-0 flex items-center gap-2 flex-1 overflow-x-auto scrollbar-hide", children: [activeTab === 'chat' && selectedSession && (_jsx("div", { className: "w-5 h-5 flex-shrink-0 flex items-center justify-center", children: selectedSession.__provider === 'cursor' ? (_jsx(CursorLogo, { className: "w-4 h-4" })) : selectedSession.__provider === 'codex' ? (_jsx(CodexLogo, { className: "w-4 h-4" })) : selectedSession.__provider === 'pi' ? (_jsx(PiLogo, { className: "w-4 h-4" })) : (_jsx(ClaudeLogo, { className: "w-4 h-4" })) })), _jsx("div", { className: "min-w-0 flex-1", children: activeTab === 'chat' && selectedSession ? (_jsxs("div", { className: "min-w-0", children: [_jsx("h2", { className: "text-sm sm:text-base font-semibold text-gray-900 dark:text-white whitespace-nowrap overflow-x-auto scrollbar-hide", children: selectedSession.__provider === 'cursor'
                                                            ? (selectedSession.name || 'Untitled Session')
                                                            : selectedSession.__provider === 'codex'
                                                                ? (selectedSession.summary || 'Codex Session')
                                                                : selectedSession.__provider === 'pi'
                                                                    ? (selectedSession.summary || 'Pi Session')
                                                                    : (selectedSession.summary || 'New Session') }), _jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 truncate", children: selectedProject.displayName })] })) : activeTab === 'chat' && !selectedSession ? (_jsxs("div", { className: "min-w-0", children: [_jsx("h2", { className: "text-sm sm:text-base font-semibold text-gray-900 dark:text-white", children: t('mainContent.newSession') }), _jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 truncate", children: selectedProject.displayName })] })) : (_jsxs("div", { className: "min-w-0", children: [_jsx("h2", { className: "text-sm sm:text-base font-semibold text-gray-900 dark:text-white", children: activeTab === 'files' ? t('mainContent.projectFiles') :
                                                            activeTab === 'git' ? t('tabs.git') :
                                                                (activeTab === 'tasks' && shouldShowTasksTab) ? 'TaskMaster' :
                                                                    'Project' }), _jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 truncate", children: selectedProject.displayName })] })) })] })] }), _jsx("div", { className: "flex-shrink-0 hidden sm:block", children: _jsxs("div", { className: "relative flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1", children: [_jsx(Tooltip, { content: t('tabs.chat'), position: "bottom", children: _jsx("button", { onClick: () => setActiveTab('chat'), className: `relative px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md ${activeTab === 'chat'
                                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'}`, children: _jsxs("span", { className: "flex items-center gap-1 sm:gap-1.5", children: [_jsx("svg", { className: "w-3 sm:w-3.5 h-3 sm:h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" }) }), _jsx("span", { className: "hidden md:hidden lg:inline", children: t('tabs.chat') })] }) }) }), _jsx(Tooltip, { content: t('tabs.shell'), position: "bottom", children: _jsx("button", { onClick: () => setActiveTab('shell'), className: `relative px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'shell'
                                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'}`, children: _jsxs("span", { className: "flex items-center gap-1 sm:gap-1.5", children: [_jsx("svg", { className: "w-3 sm:w-3.5 h-3 sm:h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" }) }), _jsx("span", { className: "hidden md:hidden lg:inline", children: t('tabs.shell') })] }) }) }), _jsx(Tooltip, { content: t('tabs.files'), position: "bottom", children: _jsx("button", { onClick: () => setActiveTab('files'), className: `relative px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'files'
                                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'}`, children: _jsxs("span", { className: "flex items-center gap-1 sm:gap-1.5", children: [_jsx("svg", { className: "w-3 sm:w-3.5 h-3 sm:h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" }) }), _jsx("span", { className: "hidden md:hidden lg:inline", children: t('tabs.files') })] }) }) }), _jsx(Tooltip, { content: t('tabs.git'), position: "bottom", children: _jsx("button", { onClick: () => setActiveTab('git'), className: `relative px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'git'
                                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'}`, children: _jsxs("span", { className: "flex items-center gap-1 sm:gap-1.5", children: [_jsx("svg", { className: "w-3 sm:w-3.5 h-3 sm:h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 10V3L4 14h7v7l9-11h-7z" }) }), _jsx("span", { className: "hidden md:hidden lg:inline", children: t('tabs.git') })] }) }) }), shouldShowTasksTab && (_jsx(Tooltip, { content: t('tabs.tasks'), position: "bottom", children: _jsx("button", { onClick: () => setActiveTab('tasks'), className: `relative px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'tasks'
                                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'}`, children: _jsxs("span", { className: "flex items-center gap-1 sm:gap-1.5", children: [_jsx("svg", { className: "w-3 sm:w-3.5 h-3 sm:h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" }) }), _jsx("span", { className: "hidden md:hidden lg:inline", children: t('tabs.tasks') })] }) }) }))] }) })] }) }), _jsxs("div", { className: "flex-1 flex min-h-0 overflow-hidden", children: [_jsxs("div", { className: `flex-1 flex flex-col min-h-0 overflow-hidden ${editingFile ? 'mr-0' : ''} ${editorExpanded ? 'hidden' : ''}`, children: [_jsx("div", { className: `h-full ${activeTab === 'chat' ? 'block' : 'hidden'}`, children: _jsx(ErrorBoundary, { showDetails: true, children: _jsx(ChatInterface, { selectedProject: selectedProject, selectedSession: selectedSession, ws: ws, sendMessage: sendMessage, latestMessage: latestMessage, onFileOpen: handleFileOpen, onInputFocusChange: onInputFocusChange, onSessionActive: onSessionActive, onSessionInactive: onSessionInactive, onSessionProcessing: onSessionProcessing, onSessionNotProcessing: onSessionNotProcessing, processingSessions: processingSessions, onReplaceTemporarySession: onReplaceTemporarySession, onNavigateToSession: onNavigateToSession, onShowSettings: onShowSettings, autoExpandTools: autoExpandTools, showRawParameters: showRawParameters, showThinking: showThinking, autoScrollToBottom: autoScrollToBottom, sendByCtrlEnter: sendByCtrlEnter, externalMessageUpdate: externalMessageUpdate, onShowAllTasks: tasksEnabled ? () => setActiveTab('tasks') : undefined }) }) }), activeTab === 'files' && (_jsx("div", { className: "h-full overflow-hidden", children: _jsx(FileTree, { selectedProject: selectedProject }) })), activeTab === 'shell' && (_jsx("div", { className: "h-full w-full overflow-hidden", children: _jsx(StandaloneShell, { project: selectedProject, session: selectedSession, showHeader: false }) })), activeTab === 'git' && (_jsx("div", { className: "h-full overflow-hidden", children: _jsx(GitPanel, { selectedProject: selectedProject, isMobile: isMobile, onFileOpen: handleFileOpen }) })), shouldShowTasksTab && (_jsx("div", { className: `h-full ${activeTab === 'tasks' ? 'block' : 'hidden'}`, children: _jsx("div", { className: "h-full flex flex-col overflow-hidden", children: _jsx(TaskList, { tasks: tasks || [], onTaskClick: handleTaskClick, showParentTasks: true, className: "flex-1 overflow-y-auto p-4", currentProject: currentProject, onTaskCreated: refreshTasks, onShowPRDEditor: (prd = null) => {
                                            setSelectedPRD(prd);
                                            setShowPRDEditor(true);
                                        }, existingPRDs: existingPRDs, onRefreshPRDs: (showNotification = false) => {
                                            // Reload existing PRDs
                                            if (currentProject?.name) {
                                                api.get(`/taskmaster/prd/${encodeURIComponent(currentProject.name)}`)
                                                    .then(response => response.ok ? response.json() : Promise.reject())
                                                    .then(data => {
                                                    setExistingPRDs(data.prdFiles || []);
                                                    if (showNotification) {
                                                        setPRDNotification('PRD saved successfully!');
                                                        setTimeout(() => setPRDNotification(null), 3000);
                                                    }
                                                })
                                                    .catch(error => console.error('Failed to refresh PRDs:', error));
                                            }
                                        } }) }) }))] }), editingFile && !isMobile && (_jsxs(_Fragment, { children: [!editorExpanded && (_jsx("div", { ref: resizeRef, onMouseDown: handleMouseDown, className: "flex-shrink-0 w-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-600 cursor-col-resize transition-colors relative group", title: "Drag to resize", children: _jsx("div", { className: "absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-blue-500 dark:bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" }) })), _jsx("div", { className: `flex-shrink-0 border-l border-gray-200 dark:border-gray-700 h-full overflow-hidden ${editorExpanded ? 'flex-1' : ''}`, style: editorExpanded ? {} : { width: `${editorWidth}px` }, children: _jsx(CodeEditor, { file: editingFile, onClose: handleCloseEditor, projectPath: selectedProject?.path, isSidebar: true, isExpanded: editorExpanded, onToggleExpand: handleToggleEditorExpand }) })] }))] }), editingFile && isMobile && (_jsx(CodeEditor, { file: editingFile, onClose: handleCloseEditor, projectPath: selectedProject?.path, isSidebar: false })), shouldShowTasksTab && showTaskDetail && selectedTask && (_jsx(TaskDetail, { task: selectedTask, isOpen: showTaskDetail, onClose: handleTaskDetailClose, onStatusChange: handleTaskStatusChange, onTaskClick: handleTaskClick })), showPRDEditor && (_jsx(PRDEditor, { project: currentProject, projectPath: currentProject?.fullPath || currentProject?.path, onClose: () => {
                    setShowPRDEditor(false);
                    setSelectedPRD(null);
                }, isNewFile: !selectedPRD?.isExisting, file: {
                    name: selectedPRD?.name || 'prd.txt',
                    content: selectedPRD?.content || ''
                }, onSave: async () => {
                    setShowPRDEditor(false);
                    setSelectedPRD(null);
                    // Reload existing PRDs with notification
                    try {
                        const response = await api.get(`/taskmaster/prd/${encodeURIComponent(currentProject.name)}`);
                        if (response.ok) {
                            const data = await response.json();
                            setExistingPRDs(data.prdFiles || []);
                            setPRDNotification('PRD saved successfully!');
                            setTimeout(() => setPRDNotification(null), 3000);
                        }
                    }
                    catch (error) {
                        console.error('Failed to refresh PRDs:', error);
                    }
                    refreshTasks?.();
                } })), prdNotification && (_jsx("div", { className: "fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-300", children: _jsxs("div", { className: "bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }), _jsx("span", { className: "font-medium", children: prdNotification })] }) }))] }));
}
export default React.memo(MainContent);
