import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { X, FolderPlus, GitBranch, Key, ChevronRight, ChevronLeft, Check, Loader2, AlertCircle, FolderOpen, Eye, EyeOff, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { api } from '../utils/api';
import { useTranslation } from 'react-i18next';
const ProjectCreationWizard = ({ onClose, onProjectCreated }) => {
    const { t } = useTranslation();
    // Wizard state
    const [step, setStep] = useState(1); // 1: Choose type, 2: Configure, 3: Confirm
    const [workspaceType, setWorkspaceType] = useState('existing'); // 'existing' or 'new' - default to 'existing'
    // Form state
    const [workspacePath, setWorkspacePath] = useState('');
    const [githubUrl, setGithubUrl] = useState('');
    const [selectedGithubToken, setSelectedGithubToken] = useState('');
    const [tokenMode, setTokenMode] = useState('stored'); // 'stored' | 'new' | 'none'
    const [newGithubToken, setNewGithubToken] = useState('');
    // UI state
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState(null);
    const [availableTokens, setAvailableTokens] = useState([]);
    const [loadingTokens, setLoadingTokens] = useState(false);
    const [pathSuggestions, setPathSuggestions] = useState([]);
    const [showPathDropdown, setShowPathDropdown] = useState(false);
    const [showFolderBrowser, setShowFolderBrowser] = useState(false);
    const [browserCurrentPath, setBrowserCurrentPath] = useState('~');
    const [browserFolders, setBrowserFolders] = useState([]);
    const [loadingFolders, setLoadingFolders] = useState(false);
    const [showHiddenFolders, setShowHiddenFolders] = useState(false);
    const [showNewFolderInput, setShowNewFolderInput] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [cloneProgress, setCloneProgress] = useState('');
    // Load available GitHub tokens when needed
    useEffect(() => {
        if (step === 2 && workspaceType === 'new' && githubUrl) {
            loadGithubTokens();
        }
    }, [step, workspaceType, githubUrl]);
    // Load path suggestions
    useEffect(() => {
        if (workspacePath.length > 2) {
            loadPathSuggestions(workspacePath);
        }
        else {
            setPathSuggestions([]);
            setShowPathDropdown(false);
        }
    }, [workspacePath]);
    const loadGithubTokens = async () => {
        try {
            setLoadingTokens(true);
            const response = await api.get('/settings/credentials?type=github_token');
            const data = await response.json();
            const activeTokens = (data.credentials || []).filter((t) => t.is_active);
            setAvailableTokens(activeTokens);
            // Auto-select first token if available
            if (activeTokens.length > 0 && !selectedGithubToken) {
                setSelectedGithubToken(activeTokens[0].id.toString());
            }
        }
        catch (error) {
            console.error('Error loading GitHub tokens:', error);
        }
        finally {
            setLoadingTokens(false);
        }
    };
    const loadPathSuggestions = async (inputPath) => {
        try {
            // Extract the directory to browse (parent of input)
            const lastSlash = inputPath.lastIndexOf('/');
            const dirPath = lastSlash > 0 ? inputPath.substring(0, lastSlash) : '~';
            const response = await api.browseFilesystem(dirPath);
            const data = await response.json();
            if (data.suggestions) {
                // Filter suggestions based on the input, excluding exact match
                const filtered = data.suggestions.filter((s) => s.path.toLowerCase().startsWith(inputPath.toLowerCase()) &&
                    s.path.toLowerCase() !== inputPath.toLowerCase());
                setPathSuggestions(filtered.slice(0, 5));
                setShowPathDropdown(filtered.length > 0);
            }
        }
        catch (error) {
            console.error('Error loading path suggestions:', error);
        }
    };
    const handleNext = () => {
        setError(null);
        if (step === 1) {
            if (!workspaceType) {
                setError(t('projectWizard.errors.selectType'));
                return;
            }
            setStep(2);
        }
        else if (step === 2) {
            if (!workspacePath.trim()) {
                setError(t('projectWizard.errors.providePath'));
                return;
            }
            // No validation for GitHub token - it's optional (only needed for private repos)
            setStep(3);
        }
    };
    const handleBack = () => {
        setError(null);
        setStep(step - 1);
    };
    const handleCreate = async () => {
        setIsCreating(true);
        setError(null);
        setCloneProgress('');
        try {
            if (workspaceType === 'new' && githubUrl) {
                const params = new URLSearchParams({
                    path: workspacePath.trim(),
                    githubUrl: githubUrl.trim(),
                });
                if (tokenMode === 'stored' && selectedGithubToken) {
                    params.append('githubTokenId', selectedGithubToken);
                }
                else if (tokenMode === 'new' && newGithubToken) {
                    params.append('newGithubToken', newGithubToken.trim());
                }
                const token = localStorage.getItem('auth-token');
                const url = `/api/projects/clone-progress?${params}${token ? `&token=${token}` : ''}`;
                await new Promise((resolve, reject) => {
                    const eventSource = new EventSource(url);
                    eventSource.onmessage = (event) => {
                        try {
                            const data = JSON.parse(event.data);
                            if (data.type === 'progress') {
                                setCloneProgress(data.message);
                            }
                            else if (data.type === 'complete') {
                                eventSource.close();
                                if (onProjectCreated) {
                                    onProjectCreated(data.project);
                                }
                                onClose();
                                resolve();
                            }
                            else if (data.type === 'error') {
                                eventSource.close();
                                reject(new Error(data.message));
                            }
                        }
                        catch (e) {
                            console.error('Error parsing SSE event:', e);
                        }
                    };
                    eventSource.onerror = () => {
                        eventSource.close();
                        reject(new Error('Connection lost during clone'));
                    };
                });
                return;
            }
            const payload = {
                workspaceType,
                path: workspacePath.trim(),
            };
            const response = await api.createWorkspace(payload);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.details || data.error || t('projectWizard.errors.failedToCreate'));
            }
            if (onProjectCreated) {
                onProjectCreated(data.project);
            }
            onClose();
        }
        catch (error) {
            console.error('Error creating workspace:', error);
            setError(error.message || t('projectWizard.errors.failedToCreate'));
        }
        finally {
            setIsCreating(false);
        }
    };
    const selectPathSuggestion = (suggestion) => {
        setWorkspacePath(suggestion.path);
        setShowPathDropdown(false);
    };
    const openFolderBrowser = async () => {
        setShowFolderBrowser(true);
        await loadBrowserFolders('~');
    };
    const loadBrowserFolders = async (path) => {
        try {
            setLoadingFolders(true);
            const response = await api.browseFilesystem(path);
            const data = await response.json();
            setBrowserCurrentPath(data.path || path);
            setBrowserFolders(data.suggestions || []);
        }
        catch (error) {
            console.error('Error loading folders:', error);
        }
        finally {
            setLoadingFolders(false);
        }
    };
    const selectFolder = (folderPath, advanceToConfirm = false) => {
        setWorkspacePath(folderPath);
        setShowFolderBrowser(false);
        if (advanceToConfirm) {
            setStep(3);
        }
    };
    const navigateToFolder = async (folderPath) => {
        await loadBrowserFolders(folderPath);
    };
    const createNewFolder = async () => {
        if (!newFolderName.trim())
            return;
        setCreatingFolder(true);
        setError(null);
        try {
            const separator = browserCurrentPath.includes('\\') ? '\\' : '/';
            const folderPath = `${browserCurrentPath}${separator}${newFolderName.trim()}`;
            const response = await api.createFolder(folderPath);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || t('projectWizard.errors.failedToCreateFolder', 'Failed to create folder'));
            }
            setNewFolderName('');
            setShowNewFolderInput(false);
            await loadBrowserFolders(data.path || folderPath);
        }
        catch (error) {
            console.error('Error creating folder:', error);
            setError(error.message || t('projectWizard.errors.failedToCreateFolder', 'Failed to create folder'));
        }
        finally {
            setCreatingFolder(false);
        }
    };
    return (_jsxs("div", { className: "fixed top-0 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-0 sm:p-4", children: [_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-none sm:rounded-lg shadow-xl w-full h-full sm:h-auto sm:max-w-2xl border-0 sm:border border-gray-200 dark:border-gray-700 overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center", children: _jsx(FolderPlus, { className: "w-4 h-4 text-blue-600 dark:text-blue-400" }) }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: t('projectWizard.title') })] }), _jsx("button", { onClick: onClose, className: "p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700", disabled: isCreating, children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsx("div", { className: "px-6 pt-4 pb-2", children: _jsx("div", { className: "flex items-center justify-between", children: [1, 2, 3].map((s) => (_jsxs(React.Fragment, { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${s < step
                                                    ? 'bg-green-500 text-white'
                                                    : s === step
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`, children: s < step ? _jsx(Check, { className: "w-4 h-4" }) : s }), _jsx("span", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline", children: s === 1 ? t('projectWizard.steps.type') : s === 2 ? t('projectWizard.steps.configure') : t('projectWizard.steps.confirm') })] }), s < 3 && (_jsx("div", { className: `flex-1 h-1 mx-2 rounded ${s < step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}` }))] }, s))) }) }), _jsxs("div", { className: "p-6 space-y-6 min-h-[300px]", children: [error && (_jsxs("div", { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" }), _jsx("div", { className: "flex-1", children: _jsx("p", { className: "text-sm text-red-800 dark:text-red-200", children: error }) })] })), step === 1 && (_jsx("div", { className: "space-y-4", children: _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 mb-3", children: t('projectWizard.step1.question') }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx("button", { onClick: () => setWorkspaceType('existing'), className: `p-4 border-2 rounded-lg text-left transition-all ${workspaceType === 'existing'
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`, children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center flex-shrink-0", children: _jsx(FolderPlus, { className: "w-5 h-5 text-green-600 dark:text-green-400" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h5", { className: "font-semibold text-gray-900 dark:text-white mb-1", children: t('projectWizard.step1.existing.title') }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: t('projectWizard.step1.existing.description') })] })] }) }), _jsx("button", { onClick: () => setWorkspaceType('new'), className: `p-4 border-2 rounded-lg text-left transition-all ${workspaceType === 'new'
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`, children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center flex-shrink-0", children: _jsx(GitBranch, { className: "w-5 h-5 text-purple-600 dark:text-purple-400" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h5", { className: "font-semibold text-gray-900 dark:text-white mb-1", children: t('projectWizard.step1.new.title') }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: t('projectWizard.step1.new.description') })] })] }) })] })] }) })), step === 2 && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: workspaceType === 'existing' ? t('projectWizard.step2.existingPath') : t('projectWizard.step2.newPath') }), _jsxs("div", { className: "relative flex gap-2", children: [_jsxs("div", { className: "flex-1 relative", children: [_jsx(Input, { type: "text", value: workspacePath, onChange: (e) => setWorkspacePath(e.target.value), placeholder: workspaceType === 'existing' ? '/path/to/existing/workspace' : '/path/to/new/workspace', className: "w-full" }), showPathDropdown && pathSuggestions.length > 0 && (_jsx("div", { className: "absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto", children: pathSuggestions.map((suggestion, index) => (_jsxs("button", { onClick: () => selectPathSuggestion(suggestion), className: "w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm", children: [_jsx("div", { className: "font-medium text-gray-900 dark:text-white", children: suggestion.name }), _jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: suggestion.path })] }, index))) }))] }), _jsx(Button, { type: "button", variant: "outline", onClick: openFolderBrowser, className: "px-3", title: "Browse folders", children: _jsx(FolderOpen, { className: "w-4 h-4" }) })] }), _jsx("p", { className: "mt-1 text-xs text-gray-500 dark:text-gray-400", children: workspaceType === 'existing'
                                                    ? t('projectWizard.step2.existingHelp')
                                                    : t('projectWizard.step2.newHelp') })] }), workspaceType === 'new' && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: t('projectWizard.step2.githubUrl') }), _jsx(Input, { type: "text", value: githubUrl, onChange: (e) => setGithubUrl(e.target.value), placeholder: "https://github.com/username/repository", className: "w-full" }), _jsx("p", { className: "mt-1 text-xs text-gray-500 dark:text-gray-400", children: t('projectWizard.step2.githubHelp') })] }), githubUrl && !githubUrl.startsWith('git@') && !githubUrl.startsWith('ssh://') && (_jsxs("div", { className: "bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700", children: [_jsxs("div", { className: "flex items-start gap-3 mb-4", children: [_jsx(Key, { className: "w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" }), _jsxs("div", { className: "flex-1", children: [_jsx("h5", { className: "font-medium text-gray-900 dark:text-white mb-1", children: t('projectWizard.step2.githubAuth') }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: t('projectWizard.step2.githubAuthHelp') })] })] }), loadingTokens ? (_jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-500", children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), t('projectWizard.step2.loadingTokens')] })) : availableTokens.length > 0 ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-3 gap-2 mb-4", children: [_jsx("button", { onClick: () => setTokenMode('stored'), className: `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${tokenMode === 'stored'
                                                                            ? 'bg-blue-500 text-white'
                                                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`, children: t('projectWizard.step2.storedToken') }), _jsx("button", { onClick: () => setTokenMode('new'), className: `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${tokenMode === 'new'
                                                                            ? 'bg-blue-500 text-white'
                                                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`, children: t('projectWizard.step2.newToken') }), _jsx("button", { onClick: () => {
                                                                            setTokenMode('none');
                                                                            setSelectedGithubToken('');
                                                                            setNewGithubToken('');
                                                                        }, className: `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${tokenMode === 'none'
                                                                            ? 'bg-green-500 text-white'
                                                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`, children: t('projectWizard.step2.nonePublic') })] }), tokenMode === 'stored' ? (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: t('projectWizard.step2.selectToken') }), _jsxs("select", { value: selectedGithubToken, onChange: (e) => setSelectedGithubToken(e.target.value), className: "w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm", children: [_jsx("option", { value: "", children: t('projectWizard.step2.selectTokenPlaceholder') }), availableTokens.map((token) => (_jsx("option", { value: token.id, children: token.credential_name }, token.id)))] })] })) : tokenMode === 'new' ? (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: t('projectWizard.step2.newToken') }), _jsx(Input, { type: "password", value: newGithubToken, onChange: (e) => setNewGithubToken(e.target.value), placeholder: "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", className: "w-full" }), _jsx("p", { className: "mt-1 text-xs text-gray-500 dark:text-gray-400", children: t('projectWizard.step2.tokenHelp') })] })) : null] })) : (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800", children: _jsx("p", { className: "text-sm text-blue-800 dark:text-blue-200", children: t('projectWizard.step2.publicRepoInfo') }) }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: t('projectWizard.step2.optionalTokenPublic') }), _jsx(Input, { type: "password", value: newGithubToken, onChange: (e) => setNewGithubToken(e.target.value), placeholder: t('projectWizard.step2.tokenPublicPlaceholder'), className: "w-full" }), _jsx("p", { className: "mt-1 text-xs text-gray-500 dark:text-gray-400", children: t('projectWizard.step2.noTokensHelp') })] })] }))] }))] }))] })), step === 3 && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700", children: [_jsx("h4", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-3", children: t('projectWizard.step3.reviewConfig') }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-600 dark:text-gray-400", children: t('projectWizard.step3.workspaceType') }), _jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: workspaceType === 'existing' ? t('projectWizard.step3.existingWorkspace') : t('projectWizard.step3.newWorkspace') })] }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-600 dark:text-gray-400", children: t('projectWizard.step3.path') }), _jsx("span", { className: "font-mono text-xs text-gray-900 dark:text-white break-all", children: workspacePath })] }), workspaceType === 'new' && githubUrl && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-600 dark:text-gray-400", children: t('projectWizard.step3.cloneFrom') }), _jsx("span", { className: "font-mono text-xs text-gray-900 dark:text-white break-all", children: githubUrl })] }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-600 dark:text-gray-400", children: t('projectWizard.step3.authentication') }), _jsx("span", { className: "text-xs text-gray-900 dark:text-white", children: tokenMode === 'stored' && selectedGithubToken
                                                                            ? `${t('projectWizard.step3.usingStoredToken')} ${availableTokens.find(t => t.id.toString() === selectedGithubToken)?.credential_name || 'Unknown'}`
                                                                            : tokenMode === 'new' && newGithubToken
                                                                                ? t('projectWizard.step3.usingProvidedToken')
                                                                                : (githubUrl.startsWith('git@') || githubUrl.startsWith('ssh://'))
                                                                                    ? t('projectWizard.step3.sshKey', 'SSH Key')
                                                                                    : t('projectWizard.step3.noAuthentication') })] })] }))] })] }), _jsx("div", { className: "bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800", children: isCreating && cloneProgress ? (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm font-medium text-blue-800 dark:text-blue-200", children: t('projectWizard.step3.cloningRepository', 'Cloning repository...') }), _jsx("code", { className: "block text-xs font-mono text-blue-700 dark:text-blue-300 whitespace-pre-wrap break-all", children: cloneProgress })] })) : (_jsx("p", { className: "text-sm text-blue-800 dark:text-blue-200", children: workspaceType === 'existing'
                                                ? t('projectWizard.step3.existingInfo')
                                                : githubUrl
                                                    ? t('projectWizard.step3.newWithClone')
                                                    : t('projectWizard.step3.newEmpty') })) })] }))] }), _jsxs("div", { className: "flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700", children: [_jsx(Button, { variant: "outline", onClick: step === 1 ? onClose : handleBack, disabled: isCreating, children: step === 1 ? (t('projectWizard.buttons.cancel')) : (_jsxs(_Fragment, { children: [_jsx(ChevronLeft, { className: "w-4 h-4 mr-1" }), t('projectWizard.buttons.back')] })) }), _jsx(Button, { onClick: step === 3 ? handleCreate : handleNext, disabled: isCreating || (step === 1 && !workspaceType), children: isCreating ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }), githubUrl ? t('projectWizard.buttons.cloning', 'Cloning...') : t('projectWizard.buttons.creating')] })) : step === 3 ? (_jsxs(_Fragment, { children: [_jsx(Check, { className: "w-4 h-4 mr-1" }), t('projectWizard.buttons.createProject')] })) : (_jsxs(_Fragment, { children: [t('projectWizard.buttons.next'), _jsx(ChevronRight, { className: "w-4 h-4 ml-1" })] })) })] })] }), showFolderBrowser && (_jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] border border-gray-200 dark:border-gray-700 flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center", children: _jsx(FolderOpen, { className: "w-4 h-4 text-blue-600 dark:text-blue-400" }) }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Select Folder" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => setShowHiddenFolders(!showHiddenFolders), className: `p-2 rounded-md transition-colors ${showHiddenFolders
                                                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`, title: showHiddenFolders ? 'Hide hidden folders' : 'Show hidden folders', children: showHiddenFolders ? _jsx(Eye, { className: "w-5 h-5" }) : _jsx(EyeOff, { className: "w-5 h-5" }) }), _jsx("button", { onClick: () => setShowNewFolderInput(!showNewFolderInput), className: `p-2 rounded-md transition-colors ${showNewFolderInput
                                                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`, title: "Create new folder", children: _jsx(Plus, { className: "w-5 h-5" }) }), _jsx("button", { onClick: () => setShowFolderBrowser(false), className: "p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700", children: _jsx(X, { className: "w-5 h-5" }) })] })] }), showNewFolderInput && (_jsx("div", { className: "px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { type: "text", value: newFolderName, onChange: (e) => setNewFolderName(e.target.value), placeholder: "New folder name", className: "flex-1", onKeyDown: (e) => {
                                            if (e.key === 'Enter')
                                                createNewFolder();
                                            if (e.key === 'Escape') {
                                                setShowNewFolderInput(false);
                                                setNewFolderName('');
                                            }
                                        }, autoFocus: true }), _jsx(Button, { size: "sm", onClick: createNewFolder, disabled: !newFolderName.trim() || creatingFolder, children: creatingFolder ? _jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : 'Create' }), _jsx(Button, { size: "sm", variant: "ghost", onClick: () => {
                                            setShowNewFolderInput(false);
                                            setNewFolderName('');
                                        }, children: "Cancel" })] }) })), _jsx("div", { className: "flex-1 overflow-y-auto p-4", children: loadingFolders ? (_jsx("div", { className: "flex items-center justify-center py-8", children: _jsx(Loader2, { className: "w-6 h-6 animate-spin text-gray-400" }) })) : (_jsxs("div", { className: "space-y-1", children: [browserCurrentPath !== '~' && browserCurrentPath !== '/' && !/^[A-Za-z]:\\?$/.test(browserCurrentPath) && (_jsxs("button", { onClick: () => {
                                            const lastSlash = Math.max(browserCurrentPath.lastIndexOf('/'), browserCurrentPath.lastIndexOf('\\'));
                                            let parentPath;
                                            if (lastSlash <= 0) {
                                                parentPath = '/';
                                            }
                                            else if (lastSlash === 2 && /^[A-Za-z]:/.test(browserCurrentPath)) {
                                                parentPath = browserCurrentPath.substring(0, 3);
                                            }
                                            else {
                                                parentPath = browserCurrentPath.substring(0, lastSlash);
                                            }
                                            navigateToFolder(parentPath);
                                        }, className: "w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3", children: [_jsx(FolderOpen, { className: "w-5 h-5 text-gray-400" }), _jsx("span", { className: "font-medium text-gray-700 dark:text-gray-300", children: ".." })] })), browserFolders.length === 0 ? (_jsx("div", { className: "text-center py-8 text-gray-500 dark:text-gray-400", children: "No subfolders found" })) : (browserFolders
                                        .filter(folder => showHiddenFolders || !folder.name.startsWith('.'))
                                        .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
                                        .map((folder, index) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { onClick: () => navigateToFolder(folder.path), className: "flex-1 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3", children: [_jsx(FolderPlus, { className: "w-5 h-5 text-blue-500" }), _jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: folder.name })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => selectFolder(folder.path, workspaceType === 'existing'), className: "text-xs px-3", children: "Select" })] }, index))))] })) }), _jsxs("div", { className: "border-t border-gray-200 dark:border-gray-700", children: [_jsxs("div", { className: "px-4 py-3 bg-gray-50 dark:bg-gray-900/50 flex items-center gap-2", children: [_jsx("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Path:" }), _jsx("code", { className: "text-sm font-mono text-gray-900 dark:text-white flex-1 truncate", children: browserCurrentPath })] }), _jsxs("div", { className: "flex items-center justify-end gap-2 p-4", children: [_jsx(Button, { variant: "outline", onClick: () => {
                                                setShowFolderBrowser(false);
                                                setShowNewFolderInput(false);
                                                setNewFolderName('');
                                            }, children: "Cancel" }), _jsx(Button, { variant: "outline", onClick: () => selectFolder(browserCurrentPath, workspaceType === 'existing'), children: "Use this folder" })] })] })] }) }))] }));
};
export default ProjectCreationWizard;
