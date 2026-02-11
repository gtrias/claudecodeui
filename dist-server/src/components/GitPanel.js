import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { GitBranch, GitCommit, Plus, Check, RefreshCw, Upload, Download, Sparkles, FileText, Trash2, ChevronRight, ChevronDown, Info, AlertTriangle, History } from 'lucide-react';
import ProjectEnvVars from './ProjectEnvVars';
import { authenticatedFetch } from '../utils/api';
import DiffViewer from './DiffViewer';
import { MicButton } from './MicButton';
function GitPanel({ selectedProject, isMobile, onFileOpen }) {
    const [gitStatus, setGitStatus] = useState(null);
    const [branches, setBranches] = useState([]);
    const [currentBranch, setCurrentBranch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [commitMessage, setCommitMessage] = useState('');
    const [isCommitting, setIsCommitting] = useState(false);
    const [showBranchDropdown, setShowBranchDropdown] = useState(false);
    const [newBranchName, setNewBranchName] = useState('');
    const [isCreatingBranch, setIsCreatingBranch] = useState(false);
    const [showNewBranchModal, setShowNewBranchModal] = useState(false);
    const [activeView, setActiveView] = useState('changes');
    const [recentCommits, setRecentCommits] = useState([]);
    const [expandedCommits, setExpandedCommits] = useState(new Set());
    const [commitDiffs, setCommitDiffs] = useState({});
    const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
    const [remoteStatus, setRemoteStatus] = useState(null);
    const [isFetching, setIsFetching] = useState(false);
    const [isPulling, setIsPulling] = useState(false);
    const [isPushing, setIsPushing] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isCommitAreaCollapsed, setIsCommitAreaCollapsed] = useState(isMobile || false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [isCreatingInitialCommit, setIsCreatingInitialCommit] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState(new Set());
    const [expandedFiles, setExpandedFiles] = useState(new Set());
    const [gitDiff, setGitDiff] = useState({});
    const [wrapText, setWrapText] = useState(false);
    const [showLegend, setShowLegend] = useState(false);
    const textareaRef = useRef(null);
    const dropdownRef = useRef(null);
    // Get current provider from localStorage (same as ChatInterface does)
    const [provider, setProvider] = useState(() => {
        return (localStorage.getItem('selected-provider') || 'claude');
    });
    // Listen for provider changes in localStorage
    useEffect(() => {
        const handleStorageChange = () => {
            const newProvider = localStorage.getItem('selected-provider') || 'claude';
            setProvider(newProvider);
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);
    useEffect(() => {
        if (selectedProject) {
            fetchGitStatus();
            fetchBranches();
            fetchRemoteStatus();
            if (activeView === 'history') {
                fetchRecentCommits();
            }
        }
    }, [selectedProject, activeView]);
    // Handle click outside dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowBranchDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const fetchGitStatus = async () => {
        if (!selectedProject)
            return;
        setIsLoading(true);
        try {
            const response = await authenticatedFetch(`/api/git/status?project=${encodeURIComponent(selectedProject.name)}`);
            const data = await response.json();
            if (data.error) {
                console.error('Git status error:', data.error);
                setGitStatus({ error: data.error, details: data.details });
            }
            else {
                setGitStatus(data);
                setCurrentBranch(data.branch || 'main');
                // Auto-select all changed files
                const allFiles = new Set([
                    ...(data.modified || []),
                    ...(data.added || []),
                    ...(data.deleted || []),
                    ...(data.untracked || [])
                ]);
                setSelectedFiles(allFiles);
                // Fetch diffs for changed files
                for (const file of data.modified || []) {
                    fetchFileDiff(file);
                }
                for (const file of data.added || []) {
                    fetchFileDiff(file);
                }
                for (const file of data.deleted || []) {
                    fetchFileDiff(file);
                }
                for (const file of data.untracked || []) {
                    fetchFileDiff(file);
                }
            }
        }
        catch (error) {
            console.error('Error fetching git status:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const fetchBranches = async () => {
        try {
            const response = await authenticatedFetch(`/api/git/branches?project=${encodeURIComponent(selectedProject.name)}`);
            const data = await response.json();
            if (!data.error && data.branches) {
                setBranches(data.branches);
            }
        }
        catch (error) {
            console.error('Error fetching branches:', error);
        }
    };
    const fetchRemoteStatus = async () => {
        if (!selectedProject)
            return;
        try {
            const response = await authenticatedFetch(`/api/git/remote-status?project=${encodeURIComponent(selectedProject.name)}`);
            const data = await response.json();
            if (!data.error) {
                setRemoteStatus(data);
            }
            else {
                setRemoteStatus(null);
            }
        }
        catch (error) {
            console.error('Error fetching remote status:', error);
            setRemoteStatus(null);
        }
    };
    const switchBranch = async (branchName) => {
        try {
            const response = await authenticatedFetch('/api/git/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project: selectedProject.name,
                    branch: branchName
                })
            });
            const data = await response.json();
            if (data.success) {
                setCurrentBranch(branchName);
                setShowBranchDropdown(false);
                fetchGitStatus(); // Refresh status after branch switch
            }
            else {
                console.error('Failed to switch branch:', data.error);
            }
        }
        catch (error) {
            console.error('Error switching branch:', error);
        }
    };
    const createBranch = async () => {
        if (!newBranchName.trim())
            return;
        setIsCreatingBranch(true);
        try {
            const response = await authenticatedFetch('/api/git/create-branch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project: selectedProject.name,
                    branch: newBranchName.trim()
                })
            });
            const data = await response.json();
            if (data.success) {
                setCurrentBranch(newBranchName.trim());
                setShowNewBranchModal(false);
                setShowBranchDropdown(false);
                setNewBranchName('');
                fetchBranches(); // Refresh branch list
                fetchGitStatus(); // Refresh status
            }
            else {
                console.error('Failed to create branch:', data.error);
            }
        }
        catch (error) {
            console.error('Error creating branch:', error);
        }
        finally {
            setIsCreatingBranch(false);
        }
    };
    const handleFetch = async () => {
        setIsFetching(true);
        try {
            const response = await authenticatedFetch('/api/git/fetch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project: selectedProject.name
                })
            });
            const data = await response.json();
            if (data.success) {
                // Refresh status after successful fetch
                fetchGitStatus();
                fetchRemoteStatus();
            }
            else {
                console.error('Fetch failed:', data.error);
            }
        }
        catch (error) {
            console.error('Error fetching from remote:', error);
        }
        finally {
            setIsFetching(false);
        }
    };
    const handlePull = async () => {
        setIsPulling(true);
        try {
            const response = await authenticatedFetch('/api/git/pull', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project: selectedProject.name
                })
            });
            const data = await response.json();
            if (data.success) {
                // Refresh status after successful pull
                fetchGitStatus();
                fetchRemoteStatus();
            }
            else {
                console.error('Pull failed:', data.error);
                // TODO: Show user-friendly error message
            }
        }
        catch (error) {
            console.error('Error pulling from remote:', error);
        }
        finally {
            setIsPulling(false);
        }
    };
    const handlePush = async () => {
        setIsPushing(true);
        try {
            const response = await authenticatedFetch('/api/git/push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project: selectedProject.name
                })
            });
            const data = await response.json();
            if (data.success) {
                // Refresh status after successful push
                fetchGitStatus();
                fetchRemoteStatus();
            }
            else {
                console.error('Push failed:', data.error);
                // TODO: Show user-friendly error message
            }
        }
        catch (error) {
            console.error('Error pushing to remote:', error);
        }
        finally {
            setIsPushing(false);
        }
    };
    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            const response = await authenticatedFetch('/api/git/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project: selectedProject.name,
                    branch: currentBranch
                })
            });
            const data = await response.json();
            if (data.success) {
                // Refresh status after successful publish
                fetchGitStatus();
                fetchRemoteStatus();
            }
            else {
                console.error('Publish failed:', data.error);
                // TODO: Show user-friendly error message
            }
        }
        catch (error) {
            console.error('Error publishing branch:', error);
        }
        finally {
            setIsPublishing(false);
        }
    };
    const discardChanges = async (filePath) => {
        try {
            const response = await authenticatedFetch('/api/git/discard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project: selectedProject.name,
                    file: filePath
                })
            });
            const data = await response.json();
            if (data.success) {
                // Remove from selected files and refresh status
                setSelectedFiles(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(filePath);
                    return newSet;
                });
                fetchGitStatus();
            }
            else {
                console.error('Discard failed:', data.error);
            }
        }
        catch (error) {
            console.error('Error discarding changes:', error);
        }
    };
    const deleteUntrackedFile = async (filePath) => {
        try {
            const response = await authenticatedFetch('/api/git/delete-untracked', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project: selectedProject.name,
                    file: filePath
                })
            });
            const data = await response.json();
            if (data.success) {
                // Remove from selected files and refresh status
                setSelectedFiles(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(filePath);
                    return newSet;
                });
                fetchGitStatus();
            }
            else {
                console.error('Delete failed:', data.error);
            }
        }
        catch (error) {
            console.error('Error deleting untracked file:', error);
        }
    };
    const confirmAndExecute = async () => {
        if (!confirmAction)
            return;
        const { type, file } = confirmAction;
        setConfirmAction(null);
        try {
            switch (type) {
                case 'discard':
                    await discardChanges(file);
                    break;
                case 'delete':
                    await deleteUntrackedFile(file);
                    break;
                case 'commit':
                    await handleCommit();
                    break;
                case 'pull':
                    await handlePull();
                    break;
                case 'push':
                    await handlePush();
                    break;
                case 'publish':
                    await handlePublish();
                    break;
            }
        }
        catch (error) {
            console.error(`Error executing ${type}:`, error);
        }
    };
    const fetchFileDiff = async (filePath) => {
        try {
            const response = await authenticatedFetch(`/api/git/diff?project=${encodeURIComponent(selectedProject.name)}&file=${encodeURIComponent(filePath)}`);
            const data = await response.json();
            if (!data.error && data.diff) {
                setGitDiff(prev => ({
                    ...prev,
                    [filePath]: data.diff
                }));
            }
        }
        catch (error) {
            console.error('Error fetching file diff:', error);
        }
    };
    const handleFileOpen = async (filePath) => {
        if (!onFileOpen)
            return;
        try {
            // Fetch file content with diff information
            const response = await authenticatedFetch(`/api/git/file-with-diff?project=${encodeURIComponent(selectedProject.name)}&file=${encodeURIComponent(filePath)}`);
            const data = await response.json();
            if (data.error) {
                console.error('Error fetching file with diff:', data.error);
                // Fallback: open without diff info
                onFileOpen(filePath);
                return;
            }
            // Create diffInfo object for CodeEditor
            const diffInfo = {
                old_string: data.oldContent || '',
                new_string: data.currentContent || ''
            };
            // Open file with diff information
            onFileOpen(filePath, diffInfo);
        }
        catch (error) {
            console.error('Error opening file:', error);
            // Fallback: open without diff info
            onFileOpen(filePath);
        }
    };
    const fetchRecentCommits = async () => {
        try {
            const response = await authenticatedFetch(`/api/git/commits?project=${encodeURIComponent(selectedProject.name)}&limit=10`);
            const data = await response.json();
            if (!data.error && data.commits) {
                setRecentCommits(data.commits);
            }
        }
        catch (error) {
            console.error('Error fetching commits:', error);
        }
    };
    const fetchCommitDiff = async (commitHash) => {
        try {
            const response = await authenticatedFetch(`/api/git/commit-diff?project=${encodeURIComponent(selectedProject.name)}&commit=${commitHash}`);
            const data = await response.json();
            if (!data.error && data.diff) {
                setCommitDiffs(prev => ({
                    ...prev,
                    [commitHash]: data.diff
                }));
            }
        }
        catch (error) {
            console.error('Error fetching commit diff:', error);
        }
    };
    const generateCommitMessage = async () => {
        setIsGeneratingMessage(true);
        try {
            const response = await authenticatedFetch('/api/git/generate-commit-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project: selectedProject.name,
                    files: Array.from(selectedFiles),
                    provider: provider // Pass the current provider (claude or cursor)
                })
            });
            const data = await response.json();
            if (data.message) {
                setCommitMessage(data.message);
            }
            else {
                console.error('Failed to generate commit message:', data.error);
            }
        }
        catch (error) {
            console.error('Error generating commit message:', error);
        }
        finally {
            setIsGeneratingMessage(false);
        }
    };
    const toggleFileExpanded = (filePath) => {
        setExpandedFiles(prev => {
            const newSet = new Set(prev);
            if (newSet.has(filePath)) {
                newSet.delete(filePath);
            }
            else {
                newSet.add(filePath);
            }
            return newSet;
        });
    };
    const toggleCommitExpanded = (commitHash) => {
        setExpandedCommits(prev => {
            const newSet = new Set(prev);
            if (newSet.has(commitHash)) {
                newSet.delete(commitHash);
            }
            else {
                newSet.add(commitHash);
                // Fetch diff for this commit if not already fetched
                if (!commitDiffs[commitHash]) {
                    fetchCommitDiff(commitHash);
                }
            }
            return newSet;
        });
    };
    const toggleFileSelected = (filePath) => {
        setSelectedFiles(prev => {
            const newSet = new Set(prev);
            if (newSet.has(filePath)) {
                newSet.delete(filePath);
            }
            else {
                newSet.add(filePath);
            }
            return newSet;
        });
    };
    const handleCommit = async () => {
        if (!commitMessage.trim() || selectedFiles.size === 0)
            return;
        setIsCommitting(true);
        try {
            const response = await authenticatedFetch('/api/git/commit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project: selectedProject.name,
                    message: commitMessage,
                    files: Array.from(selectedFiles)
                })
            });
            const data = await response.json();
            if (data.success) {
                // Reset state after successful commit
                setCommitMessage('');
                setSelectedFiles(new Set());
                fetchGitStatus();
                fetchRemoteStatus();
            }
            else {
                console.error('Commit failed:', data.error);
            }
        }
        catch (error) {
            console.error('Error committing changes:', error);
        }
        finally {
            setIsCommitting(false);
        }
    };
    const createInitialCommit = async () => {
        setIsCreatingInitialCommit(true);
        try {
            const response = await authenticatedFetch('/api/git/initial-commit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project: selectedProject.name
                })
            });
            const data = await response.json();
            if (data.success) {
                fetchGitStatus();
                fetchRemoteStatus();
            }
            else {
                console.error('Initial commit failed:', data.error);
                alert(data.error || 'Failed to create initial commit');
            }
        }
        catch (error) {
            console.error('Error creating initial commit:', error);
            alert('Failed to create initial commit');
        }
        finally {
            setIsCreatingInitialCommit(false);
        }
    };
    const getStatusLabel = (status) => {
        switch (status) {
            case 'M': return 'Modified';
            case 'A': return 'Added';
            case 'D': return 'Deleted';
            case 'U': return 'Untracked';
            default: return status;
        }
    };
    const renderCommitItem = (commit) => {
        const isExpanded = expandedCommits.has(commit.hash);
        const diff = commitDiffs[commit.hash];
        return (_jsxs("div", { className: "border-b border-gray-200 dark:border-gray-700 last:border-0", children: [_jsxs("div", { className: "flex items-start p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer", onClick: () => toggleCommitExpanded(commit.hash), children: [_jsx("div", { className: "mr-2 mt-1 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded", children: isExpanded ? _jsx(ChevronDown, { className: "w-3 h-3" }) : _jsx(ChevronRight, { className: "w-3 h-3" }) }), _jsx("div", { className: "flex-1 min-w-0", children: _jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white truncate", children: commit.message }), _jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: [commit.author, " \u2022 ", commit.date] })] }), _jsx("span", { className: "text-xs font-mono text-gray-400 dark:text-gray-500 flex-shrink-0", children: commit.hash.substring(0, 7) })] }) })] }), isExpanded && diff && (_jsx("div", { className: "bg-gray-50 dark:bg-gray-900", children: _jsxs("div", { className: "max-h-96 overflow-y-auto p-2", children: [_jsx("div", { className: "text-xs font-mono text-gray-600 dark:text-gray-400 mb-2", children: commit.stats }), _jsx(DiffViewer, { diff: diff, fileName: "commit", isMobile: isMobile, wrapText: wrapText })] }) }))] }, commit.hash));
    };
    const renderFileItem = (filePath, status) => {
        const isExpanded = expandedFiles.has(filePath);
        const isSelected = selectedFiles.has(filePath);
        const diff = gitDiff[filePath];
        return (_jsxs("div", { className: "border-b border-gray-200 dark:border-gray-700 last:border-0", children: [_jsxs("div", { className: `flex items-center hover:bg-gray-50 dark:hover:bg-gray-800 ${isMobile ? 'px-2 py-1.5' : 'px-3 py-2'}`, children: [_jsx("input", { type: "checkbox", checked: isSelected, onChange: () => toggleFileSelected(filePath), onClick: (e) => e.stopPropagation(), className: `rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:checked:bg-blue-600 ${isMobile ? 'mr-1.5' : 'mr-2'}` }), _jsxs("div", { className: "flex items-center flex-1", children: [_jsx("div", { className: `p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer ${isMobile ? 'mr-1' : 'mr-2'}`, onClick: (e) => {
                                        e.stopPropagation();
                                        toggleFileExpanded(filePath);
                                    }, children: _jsx(ChevronRight, { className: `w-3 h-3 transition-transform duration-200 ease-in-out ${isExpanded ? 'rotate-90' : 'rotate-0'}` }) }), _jsx("span", { className: `flex-1 truncate ${isMobile ? 'text-xs' : 'text-sm'} cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:underline`, onClick: (e) => {
                                        e.stopPropagation();
                                        handleFileOpen(filePath);
                                    }, title: "Click to open file", children: filePath }), _jsxs("div", { className: "flex items-center gap-1", children: [(status === 'M' || status === 'D') && (_jsxs("button", { onClick: (e) => {
                                                e.stopPropagation();
                                                setConfirmAction({
                                                    type: 'discard',
                                                    file: filePath,
                                                    message: `Discard all changes to "${filePath}"? This action cannot be undone.`
                                                });
                                            }, className: `${isMobile ? 'px-2 py-1 text-xs' : 'p-1'} hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400 font-medium flex items-center gap-1`, title: "Discard changes", children: [_jsx(Trash2, { className: `${isMobile ? 'w-3 h-3' : 'w-3 h-3'}` }), isMobile && _jsx("span", { children: "Discard" })] })), status === 'U' && (_jsxs("button", { onClick: (e) => {
                                                e.stopPropagation();
                                                setConfirmAction({
                                                    type: 'delete',
                                                    file: filePath,
                                                    message: `Delete untracked file "${filePath}"? This action cannot be undone.`
                                                });
                                            }, className: `${isMobile ? 'px-2 py-1 text-xs' : 'p-1'} hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400 font-medium flex items-center gap-1`, title: "Delete untracked file", children: [_jsx(Trash2, { className: `${isMobile ? 'w-3 h-3' : 'w-3 h-3'}` }), isMobile && _jsx("span", { children: "Delete" })] })), _jsx("span", { className: `inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold border ${status === 'M' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' :
                                                status === 'A' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800' :
                                                    status === 'D' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-800' :
                                                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`, title: getStatusLabel(status), children: status })] })] })] }), _jsxs("div", { className: `bg-gray-50 dark:bg-gray-900 transition-all duration-400 ease-in-out overflow-hidden ${isExpanded && diff
                        ? 'max-h-[600px] opacity-100 translate-y-0'
                        : 'max-h-0 opacity-0 -translate-y-1'}`, children: [_jsxs("div", { className: "flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold border ${status === 'M' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' :
                                                status === 'A' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800' :
                                                    status === 'D' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-800' :
                                                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`, children: status }), _jsx("span", { className: "text-sm font-medium text-gray-900 dark:text-white", children: getStatusLabel(status) })] }), isMobile && (_jsx("button", { onClick: (e) => {
                                        e.stopPropagation();
                                        setWrapText(!wrapText);
                                    }, className: "text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white", title: wrapText ? "Switch to horizontal scroll" : "Switch to text wrap", children: wrapText ? '↔️ Scroll' : '↩️ Wrap' }))] }), _jsx("div", { className: "max-h-96 overflow-y-auto", children: diff && _jsx(DiffViewer, { diff: diff, fileName: filePath, isMobile: isMobile, wrapText: wrapText }) })] })] }, filePath));
    };
    if (!selectedProject) {
        return (_jsx("div", { className: "h-full flex items-center justify-center text-gray-500 dark:text-gray-400", children: _jsx("p", { children: "Select a project to view source control" }) }));
    }
    return (_jsxs("div", { className: "h-full flex flex-col bg-background", children: [_jsxs("div", { className: `flex items-center justify-between border-b border-gray-200 dark:border-gray-700 ${isMobile ? 'px-3 py-2' : 'px-4 py-3'}`, children: [_jsxs("div", { className: "relative", ref: dropdownRef, children: [_jsxs("button", { onClick: () => setShowBranchDropdown(!showBranchDropdown), className: `flex items-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors ${isMobile ? 'space-x-1 px-2 py-1' : 'space-x-2 px-3 py-1.5'}`, children: [_jsx(GitBranch, { className: `text-gray-600 dark:text-gray-400 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}` }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: `font-medium ${isMobile ? 'text-xs' : 'text-sm'}`, children: currentBranch }), remoteStatus?.hasRemote && (_jsxs("div", { className: "flex items-center gap-1 text-xs", children: [remoteStatus.ahead > 0 && (_jsxs("span", { className: "text-green-600 dark:text-green-400", title: `${remoteStatus.ahead} commit${remoteStatus.ahead !== 1 ? 's' : ''} ahead`, children: ["\u2191", remoteStatus.ahead] })), remoteStatus.behind > 0 && (_jsxs("span", { className: "text-blue-600 dark:text-blue-400", title: `${remoteStatus.behind} commit${remoteStatus.behind !== 1 ? 's' : ''} behind`, children: ["\u2193", remoteStatus.behind] })), remoteStatus.isUpToDate && (_jsx("span", { className: "text-gray-500 dark:text-gray-400", title: "Up to date with remote", children: "\u2713" }))] }))] }), _jsx(ChevronDown, { className: `w-3 h-3 text-gray-500 transition-transform ${showBranchDropdown ? 'rotate-180' : ''}` })] }), showBranchDropdown && (_jsxs("div", { className: "absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50", children: [_jsx("div", { className: "py-1 max-h-64 overflow-y-auto", children: branches.map(branch => (_jsx("button", { onClick: () => switchBranch(branch), className: `w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${branch === currentBranch ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`, children: _jsxs("div", { className: "flex items-center space-x-2", children: [branch === currentBranch && _jsx(Check, { className: "w-3 h-3 text-green-600 dark:text-green-400" }), _jsx("span", { className: branch === currentBranch ? 'font-medium' : '', children: branch })] }) }, branch))) }), _jsx("div", { className: "border-t border-gray-200 dark:border-gray-700 py-1", children: _jsxs("button", { onClick: () => {
                                                setShowNewBranchModal(true);
                                                setShowBranchDropdown(false);
                                            }, className: "w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2", children: [_jsx(Plus, { className: "w-3 h-3" }), _jsx("span", { children: "Create new branch" })] }) })] }))] }), _jsxs("div", { className: `flex items-center ${isMobile ? 'gap-1' : 'gap-2'}`, children: [remoteStatus?.hasRemote && (_jsxs(_Fragment, { children: [!remoteStatus?.hasUpstream && (_jsxs("button", { onClick: () => setConfirmAction({
                                            type: 'publish',
                                            message: `Publish branch "${currentBranch}" to ${remoteStatus.remoteName}?`
                                        }), disabled: isPublishing, className: "px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1", title: `Publish branch "${currentBranch}" to ${remoteStatus.remoteName}`, children: [_jsx(Upload, { className: `w-3 h-3 ${isPublishing ? 'animate-pulse' : ''}` }), _jsx("span", { children: isPublishing ? 'Publishing...' : 'Publish' })] })), remoteStatus?.hasUpstream && !remoteStatus?.isUpToDate && (_jsxs(_Fragment, { children: [remoteStatus.behind > 0 && (_jsxs("button", { onClick: () => setConfirmAction({
                                                    type: 'pull',
                                                    message: `Pull ${remoteStatus.behind} commit${remoteStatus.behind !== 1 ? 's' : ''} from ${remoteStatus.remoteName}?`
                                                }), disabled: isPulling, className: "px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1", title: `Pull ${remoteStatus.behind} commit${remoteStatus.behind !== 1 ? 's' : ''} from ${remoteStatus.remoteName}`, children: [_jsx(Download, { className: `w-3 h-3 ${isPulling ? 'animate-pulse' : ''}` }), _jsx("span", { children: isPulling ? 'Pulling...' : `Pull ${remoteStatus.behind}` })] })), remoteStatus.ahead > 0 && (_jsxs("button", { onClick: () => setConfirmAction({
                                                    type: 'push',
                                                    message: `Push ${remoteStatus.ahead} commit${remoteStatus.ahead !== 1 ? 's' : ''} to ${remoteStatus.remoteName}?`
                                                }), disabled: isPushing, className: "px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 flex items-center gap-1", title: `Push ${remoteStatus.ahead} commit${remoteStatus.ahead !== 1 ? 's' : ''} to ${remoteStatus.remoteName}`, children: [_jsx(Upload, { className: `w-3 h-3 ${isPushing ? 'animate-pulse' : ''}` }), _jsx("span", { children: isPushing ? 'Pushing...' : `Push ${remoteStatus.ahead}` })] })), (remoteStatus.ahead > 0 || (remoteStatus.behind > 0 && remoteStatus.ahead > 0)) && (_jsxs("button", { onClick: handleFetch, disabled: isFetching, className: "px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1", title: `Fetch from ${remoteStatus.remoteName}`, children: [_jsx(RefreshCw, { className: `w-3 h-3 ${isFetching ? 'animate-spin' : ''}` }), _jsx("span", { children: isFetching ? 'Fetching...' : 'Fetch' })] }))] }))] })), _jsx("button", { onClick: () => {
                                    fetchGitStatus();
                                    fetchBranches();
                                    fetchRemoteStatus();
                                }, disabled: isLoading, className: `hover:bg-gray-100 dark:hover:bg-gray-800 rounded ${isMobile ? 'p-1' : 'p-1.5'}`, children: _jsx(RefreshCw, { className: `${isLoading ? 'animate-spin' : ''} ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}` }) })] })] }), gitStatus?.error ? (_jsxs("div", { className: "flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 px-6 py-12", children: [_jsx(GitBranch, { className: "w-20 h-20 mb-6 opacity-30" }), _jsx("h3", { className: "text-xl font-medium mb-3 text-center", children: gitStatus.error }), gitStatus.details && (_jsx("p", { className: "text-sm text-center leading-relaxed mb-6 max-w-md", children: gitStatus.details })), _jsx("div", { className: "p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 max-w-md", children: _jsxs("p", { className: "text-sm text-blue-700 dark:text-blue-300 text-center", children: [_jsx("strong", { children: "Tip:" }), " Run ", _jsx("code", { className: "bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded font-mono text-xs", children: "git init" }), " in your project directory to initialize git source control."] }) })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: `flex border-b border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${expandedFiles.size === 0
                            ? 'max-h-16 opacity-100 translate-y-0'
                            : 'max-h-0 opacity-0 -translate-y-2 overflow-hidden'}`, children: [_jsx("button", { onClick: () => setActiveView('changes'), className: `flex-1 px-4 py-2 text-sm font-medium transition-colors ${activeView === 'changes'
                                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`, children: _jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx(FileText, { className: "w-4 h-4" }), _jsx("span", { children: "Changes" })] }) }), _jsx("button", { onClick: () => setActiveView('history'), className: `flex-1 px-4 py-2 text-sm font-medium transition-colors ${activeView === 'history'
                                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`, children: _jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx(History, { className: "w-4 h-4" }), _jsx("span", { children: "History" })] }) }), _jsx("button", { onClick: () => setActiveView('environment-variables'), className: `flex-1 px-4 py-2 text-sm font-medium transition-colors ${activeView === 'environment-variables'
                                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`, children: _jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx(Sparkles, { className: "w-4 h-4" }), _jsx("span", { children: "Env Vars" })] }) })] }), activeView === 'changes' && (_jsx(_Fragment, { children: _jsx("div", { className: `transition-all duration-300 ease-in-out ${expandedFiles.size === 0
                                ? 'max-h-96 opacity-100 translate-y-0'
                                : 'max-h-0 opacity-0 -translate-y-2 overflow-hidden'}`, children: isMobile && isCommitAreaCollapsed ? (_jsx("div", { className: "px-4 py-2 border-b border-gray-200 dark:border-gray-700", children: _jsxs("button", { onClick: () => setIsCommitAreaCollapsed(false), className: "w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700", children: [_jsx(GitCommit, { className: "w-4 h-4" }), _jsxs("span", { children: ["Commit ", selectedFiles.size, " file", selectedFiles.size !== 1 ? 's' : ''] }), _jsx(ChevronDown, { className: "w-3 h-3" })] }) })) : (_jsx(_Fragment, { children: _jsxs("div", { className: "px-4 py-3 border-b border-gray-200 dark:border-gray-700", children: [isMobile && (_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium", children: "Commit Changes" }), _jsx("button", { onClick: () => setIsCommitAreaCollapsed(true), className: "p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded", children: _jsx(ChevronDown, { className: "w-4 h-4 rotate-180" }) })] })), _jsxs("div", { className: "relative", children: [_jsx("textarea", { ref: textareaRef, value: commitMessage, onChange: (e) => setCommitMessage(e.target.value), placeholder: "Message (Ctrl+Enter to commit)", className: "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 resize-none pr-20", rows: "3", onKeyDown: (e) => {
                                                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                                            handleCommit();
                                                        }
                                                    } }), _jsxs("div", { className: "absolute right-2 top-2 flex gap-1", children: [_jsx("button", { onClick: generateCommitMessage, disabled: selectedFiles.size === 0 || isGeneratingMessage, className: "p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed", title: "Generate commit message", children: isGeneratingMessage ? (_jsx(RefreshCw, { className: "w-4 h-4 animate-spin" })) : (_jsx(Sparkles, { className: "w-4 h-4" })) }), _jsx("div", { style: { display: 'none' }, children: _jsx(MicButton, { onTranscript: (transcript) => setCommitMessage(transcript), mode: "default", className: "p-1.5" }) })] })] }), _jsxs("div", { className: "flex items-center justify-between mt-2", children: [_jsxs("span", { className: "text-xs text-gray-500", children: [selectedFiles.size, " file", selectedFiles.size !== 1 ? 's' : '', " selected"] }), _jsxs("button", { onClick: () => setConfirmAction({
                                                        type: 'commit',
                                                        message: `Commit ${selectedFiles.size} file${selectedFiles.size !== 1 ? 's' : ''} with message: "${commitMessage.trim()}"?`
                                                    }), disabled: !commitMessage.trim() || selectedFiles.size === 0 || isCommitting, className: "px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1", children: [_jsx(Check, { className: "w-3 h-3" }), _jsx("span", { children: isCommitting ? 'Committing...' : 'Commit' })] })] })] }) })) }) })), activeView === 'changes' && gitStatus && !gitStatus.error && (_jsxs("div", { className: `border-b border-gray-200 dark:border-gray-700 flex items-center justify-between transition-all duration-300 ease-in-out ${isMobile ? 'px-3 py-1.5' : 'px-4 py-2'} ${expandedFiles.size === 0
                            ? 'max-h-16 opacity-100 translate-y-0'
                            : 'max-h-0 opacity-0 -translate-y-2 overflow-hidden'}`, children: [_jsxs("span", { className: `text-gray-600 dark:text-gray-400 ${isMobile ? 'text-xs' : 'text-xs'}`, children: [selectedFiles.size, " of ", (gitStatus?.modified?.length || 0) + (gitStatus?.added?.length || 0) + (gitStatus?.deleted?.length || 0) + (gitStatus?.untracked?.length || 0), " ", isMobile ? '' : 'files', " selected"] }), _jsxs("div", { className: `flex ${isMobile ? 'gap-1' : 'gap-2'}`, children: [_jsx("button", { onClick: () => {
                                            const allFiles = new Set([
                                                ...(gitStatus?.modified || []),
                                                ...(gitStatus?.added || []),
                                                ...(gitStatus?.deleted || []),
                                                ...(gitStatus?.untracked || [])
                                            ]);
                                            setSelectedFiles(allFiles);
                                        }, className: `text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 ${isMobile ? 'text-xs' : 'text-xs'}`, children: isMobile ? 'All' : 'Select All' }), _jsx("span", { className: "text-gray-300 dark:text-gray-600", children: "|" }), _jsx("button", { onClick: () => setSelectedFiles(new Set()), className: `text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 ${isMobile ? 'text-xs' : 'text-xs'}`, children: isMobile ? 'None' : 'Deselect All' })] })] })), !gitStatus?.error && !isMobile && (_jsxs("div", { className: "border-b border-gray-200 dark:border-gray-700", children: [_jsxs("button", { onClick: () => setShowLegend(!showLegend), className: "w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 text-xs text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1", children: [_jsx(Info, { className: "w-3 h-3" }), _jsx("span", { children: "File Status Guide" }), showLegend ? _jsx(ChevronDown, { className: "w-3 h-3" }) : _jsx(ChevronRight, { className: "w-3 h-3" })] }), showLegend && (_jsx("div", { className: "px-4 py-3 bg-gray-50 dark:bg-gray-800 text-xs", children: _jsxs("div", { className: `${isMobile ? 'grid grid-cols-2 gap-3 justify-items-center' : 'flex justify-center gap-6'}`, children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "inline-flex items-center justify-center w-5 h-5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 rounded border border-yellow-200 dark:border-yellow-800 font-bold text-xs", children: "M" }), _jsx("span", { className: "text-gray-600 dark:text-gray-400 italic", children: "Modified" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "inline-flex items-center justify-center w-5 h-5 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded border border-green-200 dark:border-green-800 font-bold text-xs", children: "A" }), _jsx("span", { className: "text-gray-600 dark:text-gray-400 italic", children: "Added" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "inline-flex items-center justify-center w-5 h-5 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded border border-red-200 dark:border-red-800 font-bold text-xs", children: "D" }), _jsx("span", { className: "text-gray-600 dark:text-gray-400 italic", children: "Deleted" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "inline-flex items-center justify-center w-5 h-5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 font-bold text-xs", children: "U" }), _jsx("span", { className: "text-gray-600 dark:text-gray-400 italic", children: "Untracked" })] })] }) }))] }))] })), activeView === 'changes' && !gitStatus?.error && (_jsx("div", { className: `flex-1 overflow-y-auto ${isMobile ? 'pb-mobile-nav' : ''}`, children: isLoading ? (_jsx("div", { className: "flex items-center justify-center h-32", children: _jsx(RefreshCw, { className: "w-6 h-6 animate-spin text-gray-400" }) })) : gitStatus?.hasCommits === false ? (_jsxs("div", { className: "flex flex-col items-center justify-center p-8 text-center", children: [_jsx(GitBranch, { className: "w-16 h-16 mb-4 opacity-30 text-gray-400 dark:text-gray-500" }), _jsx("h3", { className: "text-lg font-medium mb-2 text-gray-900 dark:text-white", children: "No commits yet" }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md", children: "This repository doesn't have any commits yet. Create your first commit to start tracking changes." }), _jsx("button", { onClick: createInitialCommit, disabled: isCreatingInitialCommit, className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2", children: isCreatingInitialCommit ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }), _jsx("span", { children: "Creating Initial Commit..." })] })) : (_jsxs(_Fragment, { children: [_jsx(GitCommit, { className: "w-4 h-4" }), _jsx("span", { children: "Create Initial Commit" })] })) })] })) : !gitStatus || (!gitStatus.modified?.length && !gitStatus.added?.length && !gitStatus.deleted?.length && !gitStatus.untracked?.length) ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400", children: [_jsx(GitCommit, { className: "w-12 h-12 mb-2 opacity-50" }), _jsx("p", { className: "text-sm", children: "No changes detected" })] })) : (_jsxs("div", { className: isMobile ? 'pb-4' : '', children: [gitStatus.modified?.map(file => renderFileItem(file, 'M')), gitStatus.added?.map(file => renderFileItem(file, 'A')), gitStatus.deleted?.map(file => renderFileItem(file, 'D')), gitStatus.untracked?.map(file => renderFileItem(file, 'U'))] })) })), activeView === 'history' && !gitStatus?.error && (_jsx("div", { className: `flex-1 overflow-y-auto ${isMobile ? 'pb-mobile-nav' : ''}`, children: isLoading ? (_jsx("div", { className: "flex items-center justify-center h-32", children: _jsx(RefreshCw, { className: "w-6 h-6 animate-spin text-gray-400" }) })) : recentCommits.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400", children: [_jsx(History, { className: "w-12 h-12 mb-2 opacity-50" }), _jsx("p", { className: "text-sm", children: "No commits found" })] })) : (_jsx("div", { className: isMobile ? 'pb-4' : '', children: recentCommits.map(commit => renderCommitItem(commit)) })) })), activeView === 'environment-variables' && selectedProject && (_jsx("div", { className: "px-4 py-4", children: _jsx(ProjectEnvVars, { projectId: selectedProject.fullPath || selectedProject.path || '', projectName: selectedProject.name }) })), showNewBranchModal && (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50", onClick: () => setShowNewBranchModal(false) }), _jsx("div", { className: "relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full", children: _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Create New Branch" }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Branch Name" }), _jsx("input", { type: "text", value: newBranchName, onChange: (e) => setNewBranchName(e.target.value), onKeyDown: (e) => {
                                                if (e.key === 'Enter' && !isCreatingBranch) {
                                                    createBranch();
                                                }
                                            }, placeholder: "feature/new-feature", className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500", autoFocus: true })] }), _jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 mb-4", children: ["This will create a new branch from the current branch (", currentBranch, ")"] }), _jsxs("div", { className: "flex justify-end space-x-3", children: [_jsx("button", { onClick: () => {
                                                setShowNewBranchModal(false);
                                                setNewBranchName('');
                                            }, className: "px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md", children: "Cancel" }), _jsx("button", { onClick: createBranch, disabled: !newBranchName.trim() || isCreatingBranch, className: "px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2", children: isCreatingBranch ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "w-3 h-3 animate-spin" }), _jsx("span", { children: "Creating..." })] })) : (_jsxs(_Fragment, { children: [_jsx(Plus, { className: "w-3 h-3" }), _jsx("span", { children: "Create Branch" })] })) })] })] }) })] })), confirmAction && (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50", onClick: () => setConfirmAction(null) }), _jsx("div", { className: "relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx("div", { className: `p-2 rounded-full mr-3 ${(confirmAction.type === 'discard' || confirmAction.type === 'delete') ? 'bg-red-100 dark:bg-red-900' : 'bg-yellow-100 dark:bg-yellow-900'}`, children: _jsx(AlertTriangle, { className: `w-5 h-5 ${(confirmAction.type === 'discard' || confirmAction.type === 'delete') ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}` }) }), _jsx("h3", { className: "text-lg font-semibold", children: confirmAction.type === 'discard' ? 'Discard Changes' :
                                                confirmAction.type === 'delete' ? 'Delete File' :
                                                    confirmAction.type === 'commit' ? 'Confirm Commit' :
                                                        confirmAction.type === 'pull' ? 'Confirm Pull' :
                                                            confirmAction.type === 'publish' ? 'Publish Branch' : 'Confirm Push' })] }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-6", children: confirmAction.message }), _jsxs("div", { className: "flex justify-end space-x-3", children: [_jsx("button", { onClick: () => setConfirmAction(null), className: "px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md", children: "Cancel" }), _jsx("button", { onClick: confirmAndExecute, className: `px-4 py-2 text-sm text-white rounded-md ${(confirmAction.type === 'discard' || confirmAction.type === 'delete')
                                                ? 'bg-red-600 hover:bg-red-700'
                                                : confirmAction.type === 'commit'
                                                    ? 'bg-blue-600 hover:bg-blue-700'
                                                    : confirmAction.type === 'pull'
                                                        ? 'bg-green-600 hover:bg-green-700'
                                                        : confirmAction.type === 'publish'
                                                            ? 'bg-purple-600 hover:bg-purple-700'
                                                            : 'bg-orange-600 hover:bg-orange-700'} flex items-center space-x-2`, children: confirmAction.type === 'discard' ? (_jsxs(_Fragment, { children: [_jsx(Trash2, { className: "w-4 h-4" }), _jsx("span", { children: "Discard" })] })) : confirmAction.type === 'delete' ? (_jsxs(_Fragment, { children: [_jsx(Trash2, { className: "w-4 h-4" }), _jsx("span", { children: "Delete" })] })) : confirmAction.type === 'commit' ? (_jsxs(_Fragment, { children: [_jsx(Check, { className: "w-4 h-4" }), _jsx("span", { children: "Commit" })] })) : confirmAction.type === 'pull' ? (_jsxs(_Fragment, { children: [_jsx(Download, { className: "w-4 h-4" }), _jsx("span", { children: "Pull" })] })) : confirmAction.type === 'publish' ? (_jsxs(_Fragment, { children: [_jsx(Upload, { className: "w-4 h-4" }), _jsx("span", { children: "Publish" })] })) : (_jsxs(_Fragment, { children: [_jsx(Upload, { className: "w-4 h-4" }), _jsx("span", { children: "Push" })] })) })] })] }) })] }))] }));
}
export default GitPanel;
