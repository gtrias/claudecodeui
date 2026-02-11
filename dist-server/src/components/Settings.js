import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { X, Settings as SettingsIcon, Moon, Sun, Server, Globe, Terminal, Zap, FolderOpen, Key, GitBranch } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import CredentialsSettings from './CredentialsSettings';
import GitSettings from './GitSettings';
import TasksSettings from './TasksSettings';
import LoginModal from './LoginModal';
import { authenticatedFetch } from '../utils/api';
// New settings components
import AgentListItem from './settings/AgentListItem';
import AccountContent from './settings/AccountContent';
import PermissionsContent from './settings/PermissionsContent';
import McpServersContent from './settings/McpServersContent';
import EnvironmentVariablesTab from './settings/EnvironmentVariablesTab';
import LanguageSelector from './LanguageSelector';
const Settings = ({ isOpen, onClose, projects = [], initialTab = 'agents' }) => {
    const { isDarkMode, toggleDarkMode } = useTheme();
    const { t } = useTranslation('settings');
    const [allowedTools, setAllowedTools] = useState([]);
    const [disallowedTools, setDisallowedTools] = useState([]);
    const [newAllowedTool, setNewAllowedTool] = useState('');
    const [newDisallowedTool, setNewDisallowedTool] = useState('');
    const [skipPermissions, setSkipPermissions] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);
    const [projectSortOrder, setProjectSortOrder] = useState('name');
    const [mcpServers, setMcpServers] = useState([]);
    const [showMcpForm, setShowMcpForm] = useState(false);
    const [editingMcpServer, setEditingMcpServer] = useState(null);
    const [mcpFormData, setMcpFormData] = useState({
        name: '',
        type: 'stdio',
        scope: 'user',
        projectPath: '', // For local scope
        config: {
            command: '',
            args: [],
            env: {},
            url: '',
            headers: {},
            timeout: 30000
        },
        jsonInput: '', // For JSON import
        importMode: 'form' // 'form' or 'json'
    });
    const [mcpLoading, setMcpLoading] = useState(false);
    const [mcpTestResults, setMcpTestResults] = useState({});
    const [mcpServerTools, setMcpServerTools] = useState({});
    const [mcpToolsLoading, setMcpToolsLoading] = useState({});
    const [activeTab, setActiveTab] = useState(initialTab);
    const [jsonValidationError, setJsonValidationError] = useState('');
    const [selectedAgent, setSelectedAgent] = useState('claude'); // 'claude', 'cursor', or 'codex'
    const [selectedCategory, setSelectedCategory] = useState('account'); // 'account', 'permissions', or 'mcp'
    // Code Editor settings
    const [codeEditorTheme, setCodeEditorTheme] = useState(() => localStorage.getItem('codeEditorTheme') || 'dark');
    const [codeEditorWordWrap, setCodeEditorWordWrap] = useState(() => localStorage.getItem('codeEditorWordWrap') === 'true');
    const [codeEditorShowMinimap, setCodeEditorShowMinimap] = useState(() => localStorage.getItem('codeEditorShowMinimap') !== 'false' // Default true
    );
    const [codeEditorLineNumbers, setCodeEditorLineNumbers] = useState(() => localStorage.getItem('codeEditorLineNumbers') !== 'false' // Default true
    );
    const [codeEditorFontSize, setCodeEditorFontSize] = useState(() => localStorage.getItem('codeEditorFontSize') || '14');
    // Cursor-specific states
    const [cursorAllowedCommands, setCursorAllowedCommands] = useState([]);
    const [cursorDisallowedCommands, setCursorDisallowedCommands] = useState([]);
    const [cursorSkipPermissions, setCursorSkipPermissions] = useState(false);
    const [newCursorCommand, setNewCursorCommand] = useState('');
    const [newCursorDisallowedCommand, setNewCursorDisallowedCommand] = useState('');
    const [cursorMcpServers, setCursorMcpServers] = useState([]);
    // Codex-specific states
    const [codexMcpServers, setCodexMcpServers] = useState([]);
    const [codexPermissionMode, setCodexPermissionMode] = useState('default');
    const [showCodexMcpForm, setShowCodexMcpForm] = useState(false);
    const [codexMcpFormData, setCodexMcpFormData] = useState({
        name: '',
        type: 'stdio',
        config: {
            command: '',
            args: [],
            env: {}
        }
    });
    const [editingCodexMcpServer, setEditingCodexMcpServer] = useState(null);
    const [codexMcpLoading, setCodexMcpLoading] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginProvider, setLoginProvider] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    const [claudeAuthStatus, setClaudeAuthStatus] = useState({
        authenticated: false,
        email: null,
        loading: true,
        error: null
    });
    const [cursorAuthStatus, setCursorAuthStatus] = useState({
        authenticated: false,
        email: null,
        loading: true,
        error: null
    });
    const [codexAuthStatus, setCodexAuthStatus] = useState({
        authenticated: false,
        email: null,
        loading: true,
        error: null
    });
    const [piAuthStatus, setPiAuthStatus] = useState({
        authenticated: false,
        email: null,
        loading: true,
        error: null
    });
    // Common tool patterns for Claude
    const commonTools = [
        'Bash(git log:*)',
        'Bash(git diff:*)',
        'Bash(git status:*)',
        'Write',
        'Read',
        'Edit',
        'Glob',
        'Grep',
        'MultiEdit',
        'Task',
        'TodoWrite',
        'TodoRead',
        'WebFetch',
        'WebSearch'
    ];
    // Common shell commands for Cursor
    const commonCursorCommands = [
        'Shell(ls)',
        'Shell(mkdir)',
        'Shell(cd)',
        'Shell(cat)',
        'Shell(echo)',
        'Shell(git status)',
        'Shell(git diff)',
        'Shell(git log)',
        'Shell(npm install)',
        'Shell(npm run)',
        'Shell(python)',
        'Shell(node)'
    ];
    // Fetch Cursor MCP servers
    const fetchCursorMcpServers = async () => {
        try {
            const response = await authenticatedFetch('/api/cursor/mcp');
            if (response.ok) {
                const data = await response.json();
                setCursorMcpServers(data.servers || []);
            }
            else {
                console.error('Failed to fetch Cursor MCP servers');
            }
        }
        catch (error) {
            console.error('Error fetching Cursor MCP servers:', error);
        }
    };
    const fetchCodexMcpServers = async () => {
        try {
            const configResponse = await authenticatedFetch('/api/codex/mcp/config/read');
            if (configResponse.ok) {
                const configData = await configResponse.json();
                if (configData.success && configData.servers) {
                    setCodexMcpServers(configData.servers);
                    return;
                }
            }
            const cliResponse = await authenticatedFetch('/api/codex/mcp/cli/list');
            if (cliResponse.ok) {
                const cliData = await cliResponse.json();
                if (cliData.success && cliData.servers) {
                    const servers = cliData.servers.map(server => ({
                        id: server.name,
                        name: server.name,
                        type: server.type || 'stdio',
                        scope: 'user',
                        config: {
                            command: server.command || '',
                            args: server.args || [],
                            env: server.env || {}
                        }
                    }));
                    setCodexMcpServers(servers);
                }
            }
        }
        catch (error) {
            console.error('Error fetching Codex MCP servers:', error);
        }
    };
    // MCP API functions
    const fetchMcpServers = async () => {
        try {
            // Try to read directly from config files for complete details
            const configResponse = await authenticatedFetch('/api/mcp/config/read');
            if (configResponse.ok) {
                const configData = await configResponse.json();
                if (configData.success && configData.servers) {
                    setMcpServers(configData.servers);
                    return;
                }
            }
            // Fallback to Claude CLI
            const cliResponse = await authenticatedFetch('/api/mcp/cli/list');
            if (cliResponse.ok) {
                const cliData = await cliResponse.json();
                if (cliData.success && cliData.servers) {
                    // Convert CLI format to our format
                    const servers = cliData.servers.map(server => ({
                        id: server.name,
                        name: server.name,
                        type: server.type,
                        scope: 'user',
                        config: {
                            command: server.command || '',
                            args: server.args || [],
                            env: server.env || {},
                            url: server.url || '',
                            headers: server.headers || {},
                            timeout: 30000
                        },
                        created: new Date().toISOString(),
                        updated: new Date().toISOString()
                    }));
                    setMcpServers(servers);
                    return;
                }
            }
            // Final fallback to direct config reading
            const response = await authenticatedFetch('/api/mcp/servers?scope=user');
            if (response.ok) {
                const data = await response.json();
                setMcpServers(data.servers || []);
            }
            else {
                console.error('Failed to fetch MCP servers');
            }
        }
        catch (error) {
            console.error('Error fetching MCP servers:', error);
        }
    };
    const saveMcpServer = async (serverData) => {
        try {
            if (editingMcpServer) {
                // For editing, remove old server and add new one
                await deleteMcpServer(editingMcpServer.id, 'user');
            }
            // Use Claude CLI to add the server
            const response = await authenticatedFetch('/api/mcp/cli/add', {
                method: 'POST',
                body: JSON.stringify({
                    name: serverData.name,
                    type: serverData.type,
                    scope: serverData.scope,
                    projectPath: serverData.projectPath,
                    command: serverData.config?.command,
                    args: serverData.config?.args || [],
                    url: serverData.config?.url,
                    headers: serverData.config?.headers || {},
                    env: serverData.config?.env || {}
                })
            });
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    await fetchMcpServers(); // Refresh the list
                    return true;
                }
                else {
                    throw new Error(result.error || 'Failed to save server via Claude CLI');
                }
            }
            else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save server');
            }
        }
        catch (error) {
            console.error('Error saving MCP server:', error);
            throw error;
        }
    };
    const deleteMcpServer = async (serverId, scope = 'user') => {
        try {
            // Use Claude CLI to remove the server with proper scope
            const response = await authenticatedFetch(`/api/mcp/cli/remove/${serverId}?scope=${scope}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    await fetchMcpServers(); // Refresh the list
                    return true;
                }
                else {
                    throw new Error(result.error || 'Failed to delete server via Claude CLI');
                }
            }
            else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete server');
            }
        }
        catch (error) {
            console.error('Error deleting MCP server:', error);
            throw error;
        }
    };
    const testMcpServer = async (serverId, scope = 'user') => {
        try {
            const response = await authenticatedFetch(`/api/mcp/servers/${serverId}/test?scope=${scope}`, {
                method: 'POST'
            });
            if (response.ok) {
                const data = await response.json();
                return data.testResult;
            }
            else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to test server');
            }
        }
        catch (error) {
            console.error('Error testing MCP server:', error);
            throw error;
        }
    };
    const discoverMcpTools = async (serverId, scope = 'user') => {
        try {
            const response = await authenticatedFetch(`/api/mcp/servers/${serverId}/tools?scope=${scope}`, {
                method: 'POST'
            });
            if (response.ok) {
                const data = await response.json();
                return data.toolsResult;
            }
            else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to discover tools');
            }
        }
        catch (error) {
            console.error('Error discovering MCP tools:', error);
            throw error;
        }
    };
    const saveCodexMcpServer = async (serverData) => {
        try {
            if (editingCodexMcpServer) {
                await deleteCodexMcpServer(editingCodexMcpServer.id);
            }
            const response = await authenticatedFetch('/api/codex/mcp/cli/add', {
                method: 'POST',
                body: JSON.stringify({
                    name: serverData.name,
                    command: serverData.config?.command,
                    args: serverData.config?.args || [],
                    env: serverData.config?.env || {}
                })
            });
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    await fetchCodexMcpServers();
                    return true;
                }
                else {
                    throw new Error(result.error || 'Failed to save Codex MCP server');
                }
            }
            else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save server');
            }
        }
        catch (error) {
            console.error('Error saving Codex MCP server:', error);
            throw error;
        }
    };
    const deleteCodexMcpServer = async (serverId) => {
        try {
            const response = await authenticatedFetch(`/api/codex/mcp/cli/remove/${serverId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    await fetchCodexMcpServers();
                    return true;
                }
                else {
                    throw new Error(result.error || 'Failed to delete Codex MCP server');
                }
            }
            else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete server');
            }
        }
        catch (error) {
            console.error('Error deleting Codex MCP server:', error);
            throw error;
        }
    };
    const resetCodexMcpForm = () => {
        setCodexMcpFormData({
            name: '',
            type: 'stdio',
            config: {
                command: '',
                args: [],
                env: {}
            }
        });
        setEditingCodexMcpServer(null);
        setShowCodexMcpForm(false);
    };
    const openCodexMcpForm = (server = null) => {
        if (server) {
            setEditingCodexMcpServer(server);
            setCodexMcpFormData({
                name: server.name,
                type: server.type || 'stdio',
                config: {
                    command: server.config?.command || '',
                    args: server.config?.args || [],
                    env: server.config?.env || {}
                }
            });
        }
        else {
            resetCodexMcpForm();
        }
        setShowCodexMcpForm(true);
    };
    const handleCodexMcpSubmit = async (e) => {
        e.preventDefault();
        setCodexMcpLoading(true);
        try {
            if (editingCodexMcpServer) {
                // Delete old server first, then add new one
                await deleteCodexMcpServer(editingCodexMcpServer.name);
            }
            await saveCodexMcpServer(codexMcpFormData);
            resetCodexMcpForm();
            setSaveStatus('success');
        }
        catch (error) {
            alert(`Error: ${error.message}`);
            setSaveStatus('error');
        }
        finally {
            setCodexMcpLoading(false);
        }
    };
    const handleCodexMcpDelete = async (serverName) => {
        if (confirm('Are you sure you want to delete this MCP server?')) {
            try {
                await deleteCodexMcpServer(serverName);
                setSaveStatus('success');
            }
            catch (error) {
                alert(`Error: ${error.message}`);
                setSaveStatus('error');
            }
        }
    };
    useEffect(() => {
        if (isOpen) {
            loadSettings();
            checkClaudeAuthStatus();
            checkCursorAuthStatus();
            checkCodexAuthStatus();
            checkPiAuthStatus();
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);
    // Persist code editor settings to localStorage
    useEffect(() => {
        localStorage.setItem('codeEditorTheme', codeEditorTheme);
        window.dispatchEvent(new Event('codeEditorSettingsChanged'));
    }, [codeEditorTheme]);
    useEffect(() => {
        localStorage.setItem('codeEditorWordWrap', codeEditorWordWrap.toString());
        window.dispatchEvent(new Event('codeEditorSettingsChanged'));
    }, [codeEditorWordWrap]);
    useEffect(() => {
        localStorage.setItem('codeEditorShowMinimap', codeEditorShowMinimap.toString());
        window.dispatchEvent(new Event('codeEditorSettingsChanged'));
    }, [codeEditorShowMinimap]);
    useEffect(() => {
        localStorage.setItem('codeEditorLineNumbers', codeEditorLineNumbers.toString());
        window.dispatchEvent(new Event('codeEditorSettingsChanged'));
    }, [codeEditorLineNumbers]);
    useEffect(() => {
        localStorage.setItem('codeEditorFontSize', codeEditorFontSize);
        window.dispatchEvent(new Event('codeEditorSettingsChanged'));
    }, [codeEditorFontSize]);
    const loadSettings = async () => {
        try {
            // Load Claude settings from localStorage
            const savedSettings = localStorage.getItem('claude-settings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                setAllowedTools(settings.allowedTools || []);
                setDisallowedTools(settings.disallowedTools || []);
                setSkipPermissions(settings.skipPermissions || false);
                setProjectSortOrder(settings.projectSortOrder || 'name');
            }
            else {
                // Set defaults
                setAllowedTools([]);
                setDisallowedTools([]);
                setSkipPermissions(false);
                setProjectSortOrder('name');
            }
            // Load Cursor settings from localStorage
            const savedCursorSettings = localStorage.getItem('cursor-tools-settings');
            if (savedCursorSettings) {
                const cursorSettings = JSON.parse(savedCursorSettings);
                setCursorAllowedCommands(cursorSettings.allowedCommands || []);
                setCursorDisallowedCommands(cursorSettings.disallowedCommands || []);
                setCursorSkipPermissions(cursorSettings.skipPermissions || false);
            }
            else {
                // Set Cursor defaults
                setCursorAllowedCommands([]);
                setCursorDisallowedCommands([]);
                setCursorSkipPermissions(false);
            }
            // Load Codex settings from localStorage
            const savedCodexSettings = localStorage.getItem('codex-settings');
            if (savedCodexSettings) {
                const codexSettings = JSON.parse(savedCodexSettings);
                setCodexPermissionMode(codexSettings.permissionMode || 'default');
            }
            else {
                setCodexPermissionMode('default');
            }
            // Load MCP servers from API
            await fetchMcpServers();
            // Load Cursor MCP servers
            await fetchCursorMcpServers();
            // Load Codex MCP servers
            await fetchCodexMcpServers();
        }
        catch (error) {
            console.error('Error loading tool settings:', error);
            setAllowedTools([]);
            setDisallowedTools([]);
            setSkipPermissions(false);
            setProjectSortOrder('name');
        }
    };
    const checkClaudeAuthStatus = async () => {
        try {
            const response = await authenticatedFetch('/api/cli/claude/status');
            if (response.ok) {
                const data = await response.json();
                setClaudeAuthStatus({
                    authenticated: data.authenticated,
                    email: data.email,
                    loading: false,
                    error: data.error || null
                });
            }
            else {
                setClaudeAuthStatus({
                    authenticated: false,
                    email: null,
                    loading: false,
                    error: 'Failed to check authentication status'
                });
            }
        }
        catch (error) {
            console.error('Error checking Claude auth status:', error);
            setClaudeAuthStatus({
                authenticated: false,
                email: null,
                loading: false,
                error: error.message
            });
        }
    };
    const checkCursorAuthStatus = async () => {
        try {
            const response = await authenticatedFetch('/api/cli/cursor/status');
            if (response.ok) {
                const data = await response.json();
                setCursorAuthStatus({
                    authenticated: data.authenticated,
                    email: data.email,
                    loading: false,
                    error: data.error || null
                });
            }
            else {
                setCursorAuthStatus({
                    authenticated: false,
                    email: null,
                    loading: false,
                    error: 'Failed to check authentication status'
                });
            }
        }
        catch (error) {
            console.error('Error checking Cursor auth status:', error);
            setCursorAuthStatus({
                authenticated: false,
                email: null,
                loading: false,
                error: error.message
            });
        }
    };
    const checkCodexAuthStatus = async () => {
        try {
            const response = await authenticatedFetch('/api/cli/codex/status');
            if (response.ok) {
                const data = await response.json();
                setCodexAuthStatus({
                    authenticated: data.authenticated,
                    email: data.email,
                    loading: false,
                    error: data.error || null
                });
            }
            else {
                setCodexAuthStatus({
                    authenticated: false,
                    email: null,
                    loading: false,
                    error: 'Failed to check authentication status'
                });
            }
        }
        catch (error) {
            console.error('Error checking Codex auth status:', error);
            setCodexAuthStatus({
                authenticated: false,
                email: null,
                loading: false,
                error: error.message
            });
        }
    };
    const checkPiAuthStatus = async () => {
        try {
            const response = await authenticatedFetch('/api/cli/pi/status');
            if (response.ok) {
                const data = await response.json();
                setPiAuthStatus({
                    authenticated: data.authenticated,
                    email: data.email,
                    loading: false,
                    error: data.error || null
                });
            }
            else {
                setPiAuthStatus({
                    authenticated: false,
                    email: null,
                    loading: false,
                    error: 'Failed to check authentication status'
                });
            }
        }
        catch (error) {
            console.error('Error checking Pi auth status:', error);
            setPiAuthStatus({
                authenticated: false,
                email: null,
                loading: false,
                error: error.message
            });
        }
    };
    const handleClaudeLogin = () => {
        setLoginProvider('claude');
        setSelectedProject(projects?.[0] || { name: 'default', fullPath: process.cwd() });
        setShowLoginModal(true);
    };
    const handleCursorLogin = () => {
        setLoginProvider('cursor');
        setSelectedProject(projects?.[0] || { name: 'default', fullPath: process.cwd() });
        setShowLoginModal(true);
    };
    const handleCodexLogin = () => {
        setLoginProvider('codex');
        setSelectedProject(projects?.[0] || { name: 'default', fullPath: process.cwd() });
        setShowLoginModal(true);
    };
    const handlePiLogin = () => {
        setLoginProvider('pi');
        setSelectedProject(projects?.[0] || { name: 'default', fullPath: process.cwd() });
        setShowLoginModal(true);
    };
    const handleLoginComplete = (exitCode) => {
        if (exitCode === 0) {
            setSaveStatus('success');
            if (loginProvider === 'claude') {
                checkClaudeAuthStatus();
            }
            else if (loginProvider === 'cursor') {
                checkCursorAuthStatus();
            }
            else if (loginProvider === 'codex') {
                checkCodexAuthStatus();
            }
            else if (loginProvider === 'pi') {
                checkPiAuthStatus();
            }
        }
    };
    const saveSettings = () => {
        setIsSaving(true);
        setSaveStatus(null);
        try {
            // Save Claude settings
            const claudeSettings = {
                allowedTools,
                disallowedTools,
                skipPermissions,
                projectSortOrder,
                lastUpdated: new Date().toISOString()
            };
            // Save Cursor settings
            const cursorSettings = {
                allowedCommands: cursorAllowedCommands,
                disallowedCommands: cursorDisallowedCommands,
                skipPermissions: cursorSkipPermissions,
                lastUpdated: new Date().toISOString()
            };
            // Save Codex settings
            const codexSettings = {
                permissionMode: codexPermissionMode,
                lastUpdated: new Date().toISOString()
            };
            // Save to localStorage
            localStorage.setItem('claude-settings', JSON.stringify(claudeSettings));
            localStorage.setItem('cursor-tools-settings', JSON.stringify(cursorSettings));
            localStorage.setItem('codex-settings', JSON.stringify(codexSettings));
            setSaveStatus('success');
            setTimeout(() => {
                onClose();
            }, 1000);
        }
        catch (error) {
            console.error('Error saving tool settings:', error);
            setSaveStatus('error');
        }
        finally {
            setIsSaving(false);
        }
    };
    const addAllowedTool = (tool) => {
        if (tool && !allowedTools.includes(tool)) {
            setAllowedTools([...allowedTools, tool]);
            setNewAllowedTool('');
        }
    };
    const removeAllowedTool = (tool) => {
        setAllowedTools(allowedTools.filter(t => t !== tool));
    };
    const addDisallowedTool = (tool) => {
        if (tool && !disallowedTools.includes(tool)) {
            setDisallowedTools([...disallowedTools, tool]);
            setNewDisallowedTool('');
        }
    };
    const removeDisallowedTool = (tool) => {
        setDisallowedTools(disallowedTools.filter(t => t !== tool));
    };
    // MCP form handling functions
    const resetMcpForm = () => {
        setMcpFormData({
            name: '',
            type: 'stdio',
            scope: 'user', // Default to user scope
            projectPath: '',
            config: {
                command: '',
                args: [],
                env: {},
                url: '',
                headers: {},
                timeout: 30000
            },
            jsonInput: '',
            importMode: 'form'
        });
        setEditingMcpServer(null);
        setShowMcpForm(false);
        setJsonValidationError('');
    };
    const openMcpForm = (server = null) => {
        if (server) {
            setEditingMcpServer(server);
            setMcpFormData({
                name: server.name,
                type: server.type,
                scope: server.scope,
                projectPath: server.projectPath || '',
                config: { ...server.config },
                raw: server.raw, // Store raw config for display
                importMode: 'form', // Always use form mode when editing
                jsonInput: ''
            });
        }
        else {
            resetMcpForm();
        }
        setShowMcpForm(true);
    };
    const handleMcpSubmit = async (e) => {
        e.preventDefault();
        setMcpLoading(true);
        try {
            if (mcpFormData.importMode === 'json') {
                // Use JSON import endpoint
                const response = await authenticatedFetch('/api/mcp/cli/add-json', {
                    method: 'POST',
                    body: JSON.stringify({
                        name: mcpFormData.name,
                        jsonConfig: mcpFormData.jsonInput,
                        scope: mcpFormData.scope,
                        projectPath: mcpFormData.projectPath
                    })
                });
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        await fetchMcpServers(); // Refresh the list
                        resetMcpForm();
                        setSaveStatus('success');
                    }
                    else {
                        throw new Error(result.error || 'Failed to add server via JSON');
                    }
                }
                else {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to add server');
                }
            }
            else {
                // Use regular form-based save
                await saveMcpServer(mcpFormData);
                resetMcpForm();
                setSaveStatus('success');
            }
        }
        catch (error) {
            alert(`Error: ${error.message}`);
            setSaveStatus('error');
        }
        finally {
            setMcpLoading(false);
        }
    };
    const handleMcpDelete = async (serverId, scope) => {
        if (confirm('Are you sure you want to delete this MCP server?')) {
            try {
                await deleteMcpServer(serverId, scope);
                setSaveStatus('success');
            }
            catch (error) {
                alert(`Error: ${error.message}`);
                setSaveStatus('error');
            }
        }
    };
    const handleMcpTest = async (serverId, scope) => {
        try {
            setMcpTestResults({ ...mcpTestResults, [serverId]: { loading: true } });
            const result = await testMcpServer(serverId, scope);
            setMcpTestResults({ ...mcpTestResults, [serverId]: result });
        }
        catch (error) {
            setMcpTestResults({
                ...mcpTestResults,
                [serverId]: {
                    success: false,
                    message: error.message,
                    details: []
                }
            });
        }
    };
    const handleMcpToolsDiscovery = async (serverId, scope) => {
        try {
            setMcpToolsLoading({ ...mcpToolsLoading, [serverId]: true });
            const result = await discoverMcpTools(serverId, scope);
            setMcpServerTools({ ...mcpServerTools, [serverId]: result });
        }
        catch (error) {
            setMcpServerTools({
                ...mcpServerTools,
                [serverId]: {
                    success: false,
                    tools: [],
                    resources: [],
                    prompts: []
                }
            });
        }
        finally {
            setMcpToolsLoading({ ...mcpToolsLoading, [serverId]: false });
        }
    };
    const updateMcpConfig = (key, value) => {
        setMcpFormData(prev => ({
            ...prev,
            config: {
                ...prev.config,
                [key]: value
            }
        }));
    };
    const getTransportIcon = (type) => {
        switch (type) {
            case 'stdio': return _jsx(Terminal, { className: "w-4 h-4" });
            case 'sse': return _jsx(Zap, { className: "w-4 h-4" });
            case 'http': return _jsx(Globe, { className: "w-4 h-4" });
            default: return _jsx(Server, { className: "w-4 h-4" });
        }
    };
    if (!isOpen)
        return null;
    return (_jsxs("div", { className: "modal-backdrop fixed inset-0 flex items-center justify-center z-[9999] md:p-4 bg-background/95", children: [_jsxs("div", { className: "bg-background border border-border md:rounded-lg shadow-xl w-full md:max-w-4xl h-full md:h-[90vh] flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between p-4 md:p-6 border-b border-border flex-shrink-0", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(SettingsIcon, { className: "w-5 h-5 md:w-6 md:h-6 text-blue-600" }), _jsx("h2", { className: "text-lg md:text-xl font-semibold text-foreground", children: t('title') })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: onClose, className: "text-muted-foreground hover:text-foreground touch-manipulation", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("div", { className: "flex-1 overflow-y-auto", children: [_jsx("div", { className: "border-b border-border", children: _jsxs("div", { className: "flex px-4 md:px-6", children: [_jsx("button", { onClick: () => setActiveTab('agents'), className: `px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'agents'
                                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                                : 'border-transparent text-muted-foreground hover:text-foreground'}`, children: t('mainTabs.agents') }), _jsx("button", { onClick: () => setActiveTab('appearance'), className: `px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'appearance'
                                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                                : 'border-transparent text-muted-foreground hover:text-foreground'}`, children: t('mainTabs.appearance') }), _jsxs("button", { onClick: () => setActiveTab('git'), className: `px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'git'
                                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                                : 'border-transparent text-muted-foreground hover:text-foreground'}`, children: [_jsx(GitBranch, { className: "w-4 h-4 inline mr-2" }), t('mainTabs.git')] }), _jsxs("button", { onClick: () => setActiveTab('api'), className: `px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'api'
                                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                                : 'border-transparent text-muted-foreground hover:text-foreground'}`, children: [_jsx(Key, { className: "w-4 h-4 inline mr-2" }), t('mainTabs.apiTokens')] }), _jsx("button", { onClick: () => setActiveTab('tasks'), className: `px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'tasks'
                                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                                : 'border-transparent text-muted-foreground hover:text-foreground'}`, children: t('mainTabs.tasks') }), _jsxs("button", { onClick: () => setActiveTab('environment-variables'), className: `px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'environment-variables'
                                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                                : 'border-transparent text-muted-foreground hover:text-foreground'}`, children: [_jsx(Globe, { className: "w-4 h-4 inline mr-2" }), t('tabs.environmentVariables')] })] }) }), _jsxs("div", { className: "p-4 md:p-6 space-y-6 md:space-y-8 pb-safe-area-inset-bottom", children: [activeTab === 'appearance' && (_jsx("div", { className: "space-y-6 md:space-y-8", children: activeTab === 'appearance' && (_jsxs("div", { className: "space-y-6 md:space-y-8", children: [_jsx("div", { className: "space-y-4", children: _jsx("div", { className: "bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium text-foreground", children: t('appearanceSettings.darkMode.label') }), _jsx("div", { className: "text-sm text-muted-foreground", children: t('appearanceSettings.darkMode.description') })] }), _jsxs("button", { onClick: toggleDarkMode, className: "relative inline-flex h-8 w-14 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900", role: "switch", "aria-checked": isDarkMode, "aria-label": "Toggle dark mode", children: [_jsx("span", { className: "sr-only", children: "Toggle dark mode" }), _jsx("span", { className: `${isDarkMode ? 'translate-x-7' : 'translate-x-1'} inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 flex items-center justify-center`, children: isDarkMode ? (_jsx(Moon, { className: "w-3.5 h-3.5 text-gray-700" })) : (_jsx(Sun, { className: "w-3.5 h-3.5 text-yellow-500" })) })] })] }) }) }), _jsx("div", { className: "space-y-4", children: _jsx(LanguageSelector, {}) }), _jsx("div", { className: "space-y-4", children: _jsx("div", { className: "bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium text-foreground", children: t('appearanceSettings.projectSorting.label') }), _jsx("div", { className: "text-sm text-muted-foreground", children: t('appearanceSettings.projectSorting.description') })] }), _jsxs("select", { value: projectSortOrder, onChange: (e) => setProjectSortOrder(e.target.value), className: "text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 w-32", children: [_jsx("option", { value: "name", children: t('appearanceSettings.projectSorting.alphabetical') }), _jsx("option", { value: "date", children: t('appearanceSettings.projectSorting.recentActivity') })] })] }) }) }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold text-foreground", children: t('appearanceSettings.codeEditor.title') }), _jsx("div", { className: "bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium text-foreground", children: t('appearanceSettings.codeEditor.theme.label') }), _jsx("div", { className: "text-sm text-muted-foreground", children: t('appearanceSettings.codeEditor.theme.description') })] }), _jsxs("button", { onClick: () => setCodeEditorTheme(codeEditorTheme === 'dark' ? 'light' : 'dark'), className: "relative inline-flex h-8 w-14 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900", role: "switch", "aria-checked": codeEditorTheme === 'dark', "aria-label": "Toggle editor theme", children: [_jsx("span", { className: "sr-only", children: "Toggle editor theme" }), _jsx("span", { className: `${codeEditorTheme === 'dark' ? 'translate-x-7' : 'translate-x-1'} inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 flex items-center justify-center`, children: codeEditorTheme === 'dark' ? (_jsx(Moon, { className: "w-3.5 h-3.5 text-gray-700" })) : (_jsx(Sun, { className: "w-3.5 h-3.5 text-yellow-500" })) })] })] }) }), _jsx("div", { className: "bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium text-foreground", children: t('appearanceSettings.codeEditor.wordWrap.label') }), _jsx("div", { className: "text-sm text-muted-foreground", children: t('appearanceSettings.codeEditor.wordWrap.description') })] }), _jsxs("button", { onClick: () => setCodeEditorWordWrap(!codeEditorWordWrap), className: "relative inline-flex h-8 w-14 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900", role: "switch", "aria-checked": codeEditorWordWrap, "aria-label": "Toggle word wrap", children: [_jsx("span", { className: "sr-only", children: "Toggle word wrap" }), _jsx("span", { className: `${codeEditorWordWrap ? 'translate-x-7' : 'translate-x-1'} inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200` })] })] }) }), _jsx("div", { className: "bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium text-foreground", children: t('appearanceSettings.codeEditor.showMinimap.label') }), _jsx("div", { className: "text-sm text-muted-foreground", children: t('appearanceSettings.codeEditor.showMinimap.description') })] }), _jsxs("button", { onClick: () => setCodeEditorShowMinimap(!codeEditorShowMinimap), className: "relative inline-flex h-8 w-14 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900", role: "switch", "aria-checked": codeEditorShowMinimap, "aria-label": "Toggle minimap", children: [_jsx("span", { className: "sr-only", children: "Toggle minimap" }), _jsx("span", { className: `${codeEditorShowMinimap ? 'translate-x-7' : 'translate-x-1'} inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200` })] })] }) }), _jsx("div", { className: "bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium text-foreground", children: t('appearanceSettings.codeEditor.lineNumbers.label') }), _jsx("div", { className: "text-sm text-muted-foreground", children: t('appearanceSettings.codeEditor.lineNumbers.description') })] }), _jsxs("button", { onClick: () => setCodeEditorLineNumbers(!codeEditorLineNumbers), className: "relative inline-flex h-8 w-14 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900", role: "switch", "aria-checked": codeEditorLineNumbers, "aria-label": "Toggle line numbers", children: [_jsx("span", { className: "sr-only", children: "Toggle line numbers" }), _jsx("span", { className: `${codeEditorLineNumbers ? 'translate-x-7' : 'translate-x-1'} inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200` })] })] }) }), _jsx("div", { className: "bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium text-foreground", children: t('appearanceSettings.codeEditor.fontSize.label') }), _jsx("div", { className: "text-sm text-muted-foreground", children: t('appearanceSettings.codeEditor.fontSize.description') })] }), _jsxs("select", { value: codeEditorFontSize, onChange: (e) => setCodeEditorFontSize(e.target.value), className: "text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 w-24", children: [_jsx("option", { value: "10", children: "10px" }), _jsx("option", { value: "11", children: "11px" }), _jsx("option", { value: "12", children: "12px" }), _jsx("option", { value: "13", children: "13px" }), _jsx("option", { value: "14", children: "14px" }), _jsx("option", { value: "15", children: "15px" }), _jsx("option", { value: "16", children: "16px" }), _jsx("option", { value: "18", children: "18px" }), _jsx("option", { value: "20", children: "20px" })] })] }) })] })] })) })), activeTab === 'git' && _jsx(GitSettings, {}), activeTab === 'agents' && (_jsxs("div", { className: "flex flex-col md:flex-row h-full min-h-[400px] md:min-h-[500px]", children: [_jsx("div", { className: "md:hidden border-b border-gray-200 dark:border-gray-700 flex-shrink-0", children: _jsxs("div", { className: "flex", children: [_jsx(AgentListItem, { agentId: "claude", authStatus: claudeAuthStatus, isSelected: selectedAgent === 'claude', onClick: () => setSelectedAgent('claude'), isMobile: true }), _jsx(AgentListItem, { agentId: "cursor", authStatus: cursorAuthStatus, isSelected: selectedAgent === 'cursor', onClick: () => setSelectedAgent('cursor'), isMobile: true }), _jsx(AgentListItem, { agentId: "codex", authStatus: codexAuthStatus, isSelected: selectedAgent === 'codex', onClick: () => setSelectedAgent('codex'), isMobile: true }), _jsx(AgentListItem, { agentId: "pi", authStatus: piAuthStatus, isSelected: selectedAgent === 'pi', onClick: () => setSelectedAgent('pi'), isMobile: true })] }) }), _jsx("div", { className: "hidden md:block w-48 border-r border-gray-200 dark:border-gray-700 flex-shrink-0", children: _jsxs("div", { className: "p-2", children: [_jsx(AgentListItem, { agentId: "claude", authStatus: claudeAuthStatus, isSelected: selectedAgent === 'claude', onClick: () => setSelectedAgent('claude') }), _jsx(AgentListItem, { agentId: "cursor", authStatus: cursorAuthStatus, isSelected: selectedAgent === 'cursor', onClick: () => setSelectedAgent('cursor') }), _jsx(AgentListItem, { agentId: "codex", authStatus: codexAuthStatus, isSelected: selectedAgent === 'codex', onClick: () => setSelectedAgent('codex') }), _jsx(AgentListItem, { agentId: "pi", authStatus: piAuthStatus, isSelected: selectedAgent === 'pi', onClick: () => setSelectedAgent('pi') })] }) }), _jsxs("div", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsx("div", { className: "border-b border-gray-200 dark:border-gray-700 flex-shrink-0", children: _jsxs("div", { className: "flex px-2 md:px-4 overflow-x-auto", children: [_jsx("button", { onClick: () => setSelectedCategory('account'), className: `px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${selectedCategory === 'account'
                                                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                                                        : 'border-transparent text-muted-foreground hover:text-foreground'}`, children: t('tabs.account') }), _jsx("button", { onClick: () => setSelectedCategory('permissions'), className: `px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${selectedCategory === 'permissions'
                                                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                                                        : 'border-transparent text-muted-foreground hover:text-foreground'}`, children: t('tabs.permissions') }), _jsx("button", { onClick: () => setSelectedCategory('mcp'), className: `px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${selectedCategory === 'mcp'
                                                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                                                        : 'border-transparent text-muted-foreground hover:text-foreground'}`, children: t('tabs.mcpServers') })] }) }), _jsxs("div", { className: "flex-1 overflow-y-auto p-3 md:p-4", children: [selectedCategory === 'account' && (_jsx(AccountContent, { agent: selectedAgent, authStatus: selectedAgent === 'claude' ? claudeAuthStatus :
                                                                    selectedAgent === 'cursor' ? cursorAuthStatus :
                                                                        selectedAgent === 'codex' ? codexAuthStatus :
                                                                            piAuthStatus, onLogin: selectedAgent === 'claude' ? handleClaudeLogin :
                                                                    selectedAgent === 'cursor' ? handleCursorLogin :
                                                                        selectedAgent === 'codex' ? handleCodexLogin :
                                                                            handlePiLogin })), selectedCategory === 'permissions' && selectedAgent === 'claude' && (_jsx(PermissionsContent, { agent: "claude", skipPermissions: skipPermissions, setSkipPermissions: setSkipPermissions, allowedTools: allowedTools, setAllowedTools: setAllowedTools, disallowedTools: disallowedTools, setDisallowedTools: setDisallowedTools, newAllowedTool: newAllowedTool, setNewAllowedTool: setNewAllowedTool, newDisallowedTool: newDisallowedTool, setNewDisallowedTool: setNewDisallowedTool })), selectedCategory === 'permissions' && selectedAgent === 'cursor' && (_jsx(PermissionsContent, { agent: "cursor", skipPermissions: cursorSkipPermissions, setSkipPermissions: setCursorSkipPermissions, allowedCommands: cursorAllowedCommands, setAllowedCommands: setCursorAllowedCommands, disallowedCommands: cursorDisallowedCommands, setDisallowedCommands: setCursorDisallowedCommands, newAllowedCommand: newCursorCommand, setNewAllowedCommand: setNewCursorCommand, newDisallowedCommand: newCursorDisallowedCommand, setNewDisallowedCommand: setNewCursorDisallowedCommand })), selectedCategory === 'permissions' && selectedAgent === 'codex' && (_jsx(PermissionsContent, { agent: "codex", permissionMode: codexPermissionMode, setPermissionMode: setCodexPermissionMode })), selectedCategory === 'mcp' && selectedAgent === 'claude' && (_jsx(McpServersContent, { agent: "claude", servers: mcpServers, onAdd: () => openMcpForm(), onEdit: (server) => openMcpForm(server), onDelete: (serverId, scope) => handleMcpDelete(serverId, scope), onTest: (serverId, scope) => handleMcpTest(serverId, scope), onDiscoverTools: (serverId, scope) => handleMcpToolsDiscovery(serverId, scope), testResults: mcpTestResults, serverTools: mcpServerTools, toolsLoading: mcpToolsLoading })), selectedCategory === 'mcp' && selectedAgent === 'cursor' && (_jsx(McpServersContent, { agent: "cursor", servers: cursorMcpServers, onAdd: () => { }, onEdit: (server) => { }, onDelete: (serverId) => { } })), selectedCategory === 'mcp' && selectedAgent === 'codex' && (_jsx(McpServersContent, { agent: "codex", servers: codexMcpServers, onAdd: () => openCodexMcpForm(), onEdit: (server) => openCodexMcpForm(server), onDelete: (serverId) => handleCodexMcpDelete(serverId) }))] })] })] })), showMcpForm && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4", children: _jsxs("div", { className: "bg-background border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-border", children: [_jsx("h3", { className: "text-lg font-medium text-foreground", children: editingMcpServer ? t('mcpForm.title.edit') : t('mcpForm.title.add') }), _jsx(Button, { variant: "ghost", size: "sm", onClick: resetMcpForm, children: _jsx(X, { className: "w-4 h-4" }) })] }), _jsxs("form", { onSubmit: handleMcpSubmit, className: "p-4 space-y-4", children: [!editingMcpServer && (_jsxs("div", { className: "flex gap-2 mb-4", children: [_jsx("button", { type: "button", onClick: () => setMcpFormData(prev => ({ ...prev, importMode: 'form' })), className: `px-4 py-2 rounded-lg font-medium transition-colors ${mcpFormData.importMode === 'form'
                                                                        ? 'bg-blue-600 text-white'
                                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`, children: t('mcpForm.importMode.form') }), _jsx("button", { type: "button", onClick: () => setMcpFormData(prev => ({ ...prev, importMode: 'json' })), className: `px-4 py-2 rounded-lg font-medium transition-colors ${mcpFormData.importMode === 'json'
                                                                        ? 'bg-blue-600 text-white'
                                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`, children: t('mcpForm.importMode.json') })] })), mcpFormData.importMode === 'form' && editingMcpServer && (_jsxs("div", { className: "bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3", children: [_jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: t('mcpForm.scope.label') }), _jsxs("div", { className: "flex items-center gap-2", children: [mcpFormData.scope === 'user' ? _jsx(Globe, { className: "w-4 h-4" }) : _jsx(FolderOpen, { className: "w-4 h-4" }), _jsx("span", { className: "text-sm", children: mcpFormData.scope === 'user' ? t('mcpForm.scope.userGlobal') : t('mcpForm.scope.projectLocal') }), mcpFormData.scope === 'local' && mcpFormData.projectPath && (_jsxs("span", { className: "text-xs text-muted-foreground", children: ["- ", mcpFormData.projectPath] }))] }), _jsx("p", { className: "text-xs text-muted-foreground mt-2", children: t('mcpForm.scope.cannotChange') })] })), mcpFormData.importMode === 'form' && !editingMcpServer && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-foreground mb-2", children: [t('mcpForm.scope.label'), " *"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", onClick: () => setMcpFormData(prev => ({ ...prev, scope: 'user', projectPath: '' })), className: `flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${mcpFormData.scope === 'user'
                                                                                        ? 'bg-blue-600 text-white'
                                                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`, children: _jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx(Globe, { className: "w-4 h-4" }), _jsx("span", { children: t('mcpForm.scope.userGlobal') })] }) }), _jsx("button", { type: "button", onClick: () => setMcpFormData(prev => ({ ...prev, scope: 'local' })), className: `flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${mcpFormData.scope === 'local'
                                                                                        ? 'bg-blue-600 text-white'
                                                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`, children: _jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx(FolderOpen, { className: "w-4 h-4" }), _jsx("span", { children: t('mcpForm.scope.projectLocal') })] }) })] }), _jsx("p", { className: "text-xs text-muted-foreground mt-2", children: mcpFormData.scope === 'user'
                                                                                ? t('mcpForm.scope.userDescription')
                                                                                : t('mcpForm.scope.projectDescription') })] }), mcpFormData.scope === 'local' && !editingMcpServer && (_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-foreground mb-2", children: [t('mcpForm.fields.selectProject'), " *"] }), _jsxs("select", { value: mcpFormData.projectPath, onChange: (e) => setMcpFormData(prev => ({ ...prev, projectPath: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-blue-500 focus:border-blue-500", required: mcpFormData.scope === 'local', children: [_jsxs("option", { value: "", children: [t('mcpForm.fields.selectProject'), "..."] }), projects.map(project => (_jsx("option", { value: project.path || project.fullPath, children: project.displayName || project.name }, project.name)))] }), mcpFormData.projectPath && (_jsx("p", { className: "text-xs text-muted-foreground mt-1", children: t('mcpForm.projectPath', { path: mcpFormData.projectPath }) }))] }))] })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: mcpFormData.importMode === 'json' ? 'md:col-span-2' : '', children: [_jsxs("label", { className: "block text-sm font-medium text-foreground mb-2", children: [t('mcpForm.fields.serverName'), " *"] }), _jsx(Input, { value: mcpFormData.name, onChange: (e) => {
                                                                                setMcpFormData(prev => ({ ...prev, name: e.target.value }));
                                                                            }, placeholder: t('mcpForm.placeholders.serverName'), required: true })] }), mcpFormData.importMode === 'form' && (_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-foreground mb-2", children: [t('mcpForm.fields.transportType'), " *"] }), _jsxs("select", { value: mcpFormData.type, onChange: (e) => {
                                                                                setMcpFormData(prev => ({ ...prev, type: e.target.value }));
                                                                            }, className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "stdio", children: "stdio" }), _jsx("option", { value: "sse", children: "SSE" }), _jsx("option", { value: "http", children: "HTTP" })] })] }))] }), editingMcpServer && mcpFormData.raw && mcpFormData.importMode === 'form' && (_jsxs("div", { className: "bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4", children: [_jsx("h4", { className: "text-sm font-medium text-foreground mb-2", children: t('mcpForm.configDetails', { configFile: editingMcpServer.scope === 'global' ? '~/.claude.json' : 'project config' }) }), _jsx("pre", { className: "text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto", children: JSON.stringify(mcpFormData.raw, null, 2) })] })), mcpFormData.importMode === 'json' && (_jsx("div", { className: "space-y-4", children: _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-foreground mb-2", children: [t('mcpForm.fields.jsonConfig'), " *"] }), _jsx("textarea", { value: mcpFormData.jsonInput, onChange: (e) => {
                                                                            setMcpFormData(prev => ({ ...prev, jsonInput: e.target.value }));
                                                                            // Validate JSON as user types
                                                                            try {
                                                                                if (e.target.value.trim()) {
                                                                                    const parsed = JSON.parse(e.target.value);
                                                                                    // Basic validation
                                                                                    if (!parsed.type) {
                                                                                        setJsonValidationError(t('mcpForm.validation.missingType'));
                                                                                    }
                                                                                    else if (parsed.type === 'stdio' && !parsed.command) {
                                                                                        setJsonValidationError(t('mcpForm.validation.stdioRequiresCommand'));
                                                                                    }
                                                                                    else if ((parsed.type === 'http' || parsed.type === 'sse') && !parsed.url) {
                                                                                        setJsonValidationError(t('mcpForm.validation.httpRequiresUrl', { type: parsed.type }));
                                                                                    }
                                                                                    else {
                                                                                        setJsonValidationError('');
                                                                                    }
                                                                                }
                                                                            }
                                                                            catch (err) {
                                                                                if (e.target.value.trim()) {
                                                                                    setJsonValidationError(t('mcpForm.validation.invalidJson'));
                                                                                }
                                                                                else {
                                                                                    setJsonValidationError('');
                                                                                }
                                                                            }
                                                                        }, className: `w-full px-3 py-2 border ${jsonValidationError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono text-sm`, rows: "8", placeholder: '{\n  "type": "stdio",\n  "command": "/path/to/server",\n  "args": ["--api-key", "abc123"],\n  "env": {\n    "CACHE_DIR": "/tmp"\n  }\n}', required: true }), jsonValidationError && (_jsx("p", { className: "text-xs text-red-500 mt-1", children: jsonValidationError })), _jsxs("p", { className: "text-xs text-muted-foreground mt-2", children: [t('mcpForm.validation.jsonHelp'), _jsx("br", {}), "\u2022 stdio: ", `{"type":"stdio","command":"npx","args":["@upstash/context7-mcp"]}`, _jsx("br", {}), "\u2022 http/sse: ", `{"type":"http","url":"https://api.example.com/mcp"}`] })] }) })), mcpFormData.importMode === 'form' && mcpFormData.type === 'stdio' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-foreground mb-2", children: [t('mcpForm.fields.command'), " *"] }), _jsx(Input, { value: mcpFormData.config.command, onChange: (e) => updateMcpConfig('command', e.target.value), placeholder: "/path/to/mcp-server", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: t('mcpForm.fields.arguments') }), _jsx("textarea", { value: Array.isArray(mcpFormData.config.args) ? mcpFormData.config.args.join('\n') : '', onChange: (e) => updateMcpConfig('args', e.target.value.split('\n').filter(arg => arg.trim())), className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-blue-500 focus:border-blue-500", rows: "3", placeholder: "--api-key\nabc123" })] })] })), mcpFormData.importMode === 'form' && (mcpFormData.type === 'sse' || mcpFormData.type === 'http') && (_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-foreground mb-2", children: [t('mcpForm.fields.url'), " *"] }), _jsx(Input, { value: mcpFormData.config.url, onChange: (e) => updateMcpConfig('url', e.target.value), placeholder: "https://api.example.com/mcp", type: "url", required: true })] })), mcpFormData.importMode === 'form' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: t('mcpForm.fields.envVars') }), _jsx("textarea", { value: Object.entries(mcpFormData.config.env || {}).map(([k, v]) => `${k}=${v}`).join('\n'), onChange: (e) => {
                                                                        const env = {};
                                                                        e.target.value.split('\n').forEach(line => {
                                                                            const [key, ...valueParts] = line.split('=');
                                                                            if (key && key.trim()) {
                                                                                env[key.trim()] = valueParts.join('=').trim();
                                                                            }
                                                                        });
                                                                        updateMcpConfig('env', env);
                                                                    }, className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-blue-500 focus:border-blue-500", rows: "3", placeholder: "API_KEY=your-key\nDEBUG=true" })] })), mcpFormData.importMode === 'form' && (mcpFormData.type === 'sse' || mcpFormData.type === 'http') && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: t('mcpForm.fields.headers') }), _jsx("textarea", { value: Object.entries(mcpFormData.config.headers || {}).map(([k, v]) => `${k}=${v}`).join('\n'), onChange: (e) => {
                                                                        const headers = {};
                                                                        e.target.value.split('\n').forEach(line => {
                                                                            const [key, ...valueParts] = line.split('=');
                                                                            if (key && key.trim()) {
                                                                                headers[key.trim()] = valueParts.join('=').trim();
                                                                            }
                                                                        });
                                                                        updateMcpConfig('headers', headers);
                                                                    }, className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-blue-500 focus:border-blue-500", rows: "3", placeholder: "Authorization=Bearer token\nX-API-Key=your-key" })] })), _jsxs("div", { className: "flex justify-end gap-2 pt-4", children: [_jsx(Button, { type: "button", variant: "outline", onClick: resetMcpForm, children: t('mcpForm.actions.cancel') }), _jsx(Button, { type: "submit", disabled: mcpLoading, className: "bg-purple-600 hover:bg-purple-700 disabled:opacity-50", children: mcpLoading ? t('mcpForm.actions.saving') : (editingMcpServer ? t('mcpForm.actions.updateServer') : t('mcpForm.actions.addServer')) })] })] })] }) })), showCodexMcpForm && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4", children: _jsxs("div", { className: "bg-background border border-border rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-border", children: [_jsx("h3", { className: "text-lg font-medium text-foreground", children: editingCodexMcpServer ? t('mcpForm.title.edit') : t('mcpForm.title.add') }), _jsx(Button, { variant: "ghost", size: "sm", onClick: resetCodexMcpForm, children: _jsx(X, { className: "w-4 h-4" }) })] }), _jsxs("form", { onSubmit: handleCodexMcpSubmit, className: "p-4 space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-foreground mb-2", children: [t('mcpForm.fields.serverName'), " *"] }), _jsx(Input, { value: codexMcpFormData.name, onChange: (e) => setCodexMcpFormData(prev => ({ ...prev, name: e.target.value })), placeholder: t('mcpForm.placeholders.serverName'), required: true })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-foreground mb-2", children: [t('mcpForm.fields.command'), " *"] }), _jsx(Input, { value: codexMcpFormData.config?.command || '', onChange: (e) => setCodexMcpFormData(prev => ({
                                                                        ...prev,
                                                                        config: { ...prev.config, command: e.target.value }
                                                                    })), placeholder: "npx @my-org/mcp-server", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: t('mcpForm.fields.arguments') }), _jsx("textarea", { value: (codexMcpFormData.config?.args || []).join('\n'), onChange: (e) => setCodexMcpFormData(prev => ({
                                                                        ...prev,
                                                                        config: { ...prev.config, args: e.target.value.split('\n').filter(a => a.trim()) }
                                                                    })), placeholder: "--port\n3000", rows: 3, className: "w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: t('mcpForm.fields.envVars') }), _jsx("textarea", { value: Object.entries(codexMcpFormData.config?.env || {}).map(([k, v]) => `${k}=${v}`).join('\n'), onChange: (e) => {
                                                                        const env = {};
                                                                        e.target.value.split('\n').forEach(line => {
                                                                            const [key, ...valueParts] = line.split('=');
                                                                            if (key && valueParts.length > 0) {
                                                                                env[key.trim()] = valueParts.join('=').trim();
                                                                            }
                                                                        });
                                                                        setCodexMcpFormData(prev => ({
                                                                            ...prev,
                                                                            config: { ...prev.config, env }
                                                                        }));
                                                                    }, placeholder: "API_KEY=xxx\nDEBUG=true", rows: 3, className: "w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring" })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-4 border-t border-border", children: [_jsx(Button, { type: "button", variant: "outline", onClick: resetCodexMcpForm, children: t('mcpForm.actions.cancel') }), _jsx(Button, { type: "submit", disabled: codexMcpLoading || !codexMcpFormData.name || !codexMcpFormData.config?.command, className: "bg-green-600 hover:bg-green-700 text-white", children: codexMcpLoading ? t('mcpForm.actions.saving') : (editingCodexMcpServer ? t('mcpForm.actions.updateServer') : t('mcpForm.actions.addServer')) })] })] })] }) })), activeTab === 'tasks' && (_jsx("div", { className: "space-y-6 md:space-y-8", children: _jsx(TasksSettings, {}) })), activeTab === 'api' && (_jsx("div", { className: "space-y-6 md:space-y-8", children: _jsx(CredentialsSettings, {}) })), activeTab === 'environment-variables' && (_jsx("div", { className: "space-y-6 md:space-y-8", children: _jsx(EnvironmentVariablesTab, { onClose: onClose }) }))] })] }), _jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 md:p-6 border-t border-border flex-shrink-0 gap-3 pb-safe-area-inset-bottom", children: [_jsxs("div", { className: "flex items-center justify-center sm:justify-start gap-2 order-2 sm:order-1", children: [saveStatus === 'success' && (_jsxs("div", { className: "text-green-600 dark:text-green-400 text-sm flex items-center gap-1", children: [_jsx("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }), t('saveStatus.success')] })), saveStatus === 'error' && (_jsxs("div", { className: "text-red-600 dark:text-red-400 text-sm flex items-center gap-1", children: [_jsx("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z", clipRule: "evenodd" }) }), t('saveStatus.error')] }))] }), _jsxs("div", { className: "flex items-center gap-3 order-1 sm:order-2", children: [_jsx(Button, { variant: "outline", onClick: onClose, disabled: isSaving, className: "flex-1 sm:flex-none h-10 touch-manipulation", children: t('footerActions.cancel') }), _jsx(Button, { onClick: saveSettings, disabled: isSaving, className: "flex-1 sm:flex-none h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 touch-manipulation", children: isSaving ? (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" }), t('saveStatus.saving')] })) : (t('footerActions.save')) })] })] })] }), _jsx(LoginModal, { isOpen: showLoginModal, onClose: () => setShowLoginModal(false), provider: loginProvider, project: selectedProject, onComplete: handleLoginComplete, isAuthenticated: loginProvider === 'claude' ? claudeAuthStatus.authenticated :
                    loginProvider === 'cursor' ? cursorAuthStatus.authenticated :
                        loginProvider === 'codex' ? codexAuthStatus.authenticated :
                            loginProvider === 'pi' ? piAuthStatus.authenticated :
                                false }, loginProvider)] }));
};
export default Settings;
