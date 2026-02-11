import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Shield, AlertTriangle, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
// Common tool patterns for Claude
const commonClaudeTools = [
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
// Claude Permissions
function ClaudePermissions({ skipPermissions, setSkipPermissions, allowedTools, setAllowedTools, disallowedTools, setDisallowedTools, newAllowedTool, setNewAllowedTool, newDisallowedTool, setNewDisallowedTool, }) {
    const { t } = useTranslation('settings');
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(AlertTriangle, { className: "w-5 h-5 text-orange-500" }), _jsx("h3", { className: "text-lg font-medium text-foreground", children: t('permissions.title') })] }), _jsx("div", { className: "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4", children: _jsxs("label", { className: "flex items-center gap-3", children: [_jsx("input", { type: "checkbox", checked: skipPermissions, onChange: (e) => setSkipPermissions(e.target.checked), className: "w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2" }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-orange-900 dark:text-orange-100", children: t('permissions.skipPermissions.label') }), _jsx("div", { className: "text-sm text-orange-700 dark:text-orange-300", children: t('permissions.skipPermissions.claudeDescription') })] })] }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Shield, { className: "w-5 h-5 text-green-500" }), _jsx("h3", { className: "text-lg font-medium text-foreground", children: t('permissions.allowedTools.title') })] }), _jsx("p", { className: "text-sm text-muted-foreground", children: t('permissions.allowedTools.description') }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-2", children: [_jsx(Input, { value: newAllowedTool, onChange: (e) => setNewAllowedTool(e.target.value), placeholder: t('permissions.allowedTools.placeholder'), onKeyPress: (e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addAllowedTool(newAllowedTool);
                                    }
                                }, className: "flex-1 h-10" }), _jsxs(Button, { onClick: () => addAllowedTool(newAllowedTool), disabled: !newAllowedTool, size: "sm", className: "h-10 px-4", children: [_jsx(Plus, { className: "w-4 h-4 mr-2 sm:mr-0" }), _jsx("span", { className: "sm:hidden", children: t('permissions.actions.add') })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm font-medium text-gray-700 dark:text-gray-300", children: t('permissions.allowedTools.quickAdd') }), _jsx("div", { className: "flex flex-wrap gap-2", children: commonClaudeTools.map(tool => (_jsx(Button, { variant: "outline", size: "sm", onClick: () => addAllowedTool(tool), disabled: allowedTools.includes(tool), className: "text-xs h-8", children: tool }, tool))) })] }), _jsxs("div", { className: "space-y-2", children: [allowedTools.map(tool => (_jsxs("div", { className: "flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3", children: [_jsx("span", { className: "font-mono text-sm text-green-800 dark:text-green-200", children: tool }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => removeAllowedTool(tool), className: "text-green-600 hover:text-green-700", children: _jsx(X, { className: "w-4 h-4" }) })] }, tool))), allowedTools.length === 0 && (_jsx("div", { className: "text-center py-6 text-gray-500 dark:text-gray-400", children: t('permissions.allowedTools.empty') }))] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(AlertTriangle, { className: "w-5 h-5 text-red-500" }), _jsx("h3", { className: "text-lg font-medium text-foreground", children: t('permissions.blockedTools.title') })] }), _jsx("p", { className: "text-sm text-muted-foreground", children: t('permissions.blockedTools.description') }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-2", children: [_jsx(Input, { value: newDisallowedTool, onChange: (e) => setNewDisallowedTool(e.target.value), placeholder: t('permissions.blockedTools.placeholder'), onKeyPress: (e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addDisallowedTool(newDisallowedTool);
                                    }
                                }, className: "flex-1 h-10" }), _jsxs(Button, { onClick: () => addDisallowedTool(newDisallowedTool), disabled: !newDisallowedTool, size: "sm", className: "h-10 px-4", children: [_jsx(Plus, { className: "w-4 h-4 mr-2 sm:mr-0" }), _jsx("span", { className: "sm:hidden", children: t('permissions.actions.add') })] })] }), _jsxs("div", { className: "space-y-2", children: [disallowedTools.map(tool => (_jsxs("div", { className: "flex items-center justify-between bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3", children: [_jsx("span", { className: "font-mono text-sm text-red-800 dark:text-red-200", children: tool }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => removeDisallowedTool(tool), className: "text-red-600 hover:text-red-700", children: _jsx(X, { className: "w-4 h-4" }) })] }, tool))), disallowedTools.length === 0 && (_jsx("div", { className: "text-center py-6 text-gray-500 dark:text-gray-400", children: t('permissions.blockedTools.empty') }))] })] }), _jsxs("div", { className: "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4", children: [_jsx("h4", { className: "font-medium text-blue-900 dark:text-blue-100 mb-2", children: t('permissions.toolExamples.title') }), _jsxs("ul", { className: "text-sm text-blue-800 dark:text-blue-200 space-y-1", children: [_jsxs("li", { children: [_jsx("code", { className: "bg-blue-100 dark:bg-blue-800 px-1 rounded", children: "\"Bash(git log:*)\"" }), " ", t('permissions.toolExamples.bashGitLog')] }), _jsxs("li", { children: [_jsx("code", { className: "bg-blue-100 dark:bg-blue-800 px-1 rounded", children: "\"Bash(git diff:*)\"" }), " ", t('permissions.toolExamples.bashGitDiff')] }), _jsxs("li", { children: [_jsx("code", { className: "bg-blue-100 dark:bg-blue-800 px-1 rounded", children: "\"Write\"" }), " ", t('permissions.toolExamples.write')] }), _jsxs("li", { children: [_jsx("code", { className: "bg-blue-100 dark:bg-blue-800 px-1 rounded", children: "\"Bash(rm:*)\"" }), " ", t('permissions.toolExamples.bashRm')] })] })] })] }));
}
// Cursor Permissions
function CursorPermissions({ skipPermissions, setSkipPermissions, allowedCommands, setAllowedCommands, disallowedCommands, setDisallowedCommands, newAllowedCommand, setNewAllowedCommand, newDisallowedCommand, setNewDisallowedCommand, }) {
    const { t } = useTranslation('settings');
    const addAllowedCommand = (cmd) => {
        if (cmd && !allowedCommands.includes(cmd)) {
            setAllowedCommands([...allowedCommands, cmd]);
            setNewAllowedCommand('');
        }
    };
    const removeAllowedCommand = (cmd) => {
        setAllowedCommands(allowedCommands.filter(c => c !== cmd));
    };
    const addDisallowedCommand = (cmd) => {
        if (cmd && !disallowedCommands.includes(cmd)) {
            setDisallowedCommands([...disallowedCommands, cmd]);
            setNewDisallowedCommand('');
        }
    };
    const removeDisallowedCommand = (cmd) => {
        setDisallowedCommands(disallowedCommands.filter(c => c !== cmd));
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(AlertTriangle, { className: "w-5 h-5 text-orange-500" }), _jsx("h3", { className: "text-lg font-medium text-foreground", children: t('permissions.title') })] }), _jsx("div", { className: "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4", children: _jsxs("label", { className: "flex items-center gap-3", children: [_jsx("input", { type: "checkbox", checked: skipPermissions, onChange: (e) => setSkipPermissions(e.target.checked), className: "w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 focus:ring-2" }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-orange-900 dark:text-orange-100", children: t('permissions.skipPermissions.label') }), _jsx("div", { className: "text-sm text-orange-700 dark:text-orange-300", children: t('permissions.skipPermissions.cursorDescription') })] })] }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Shield, { className: "w-5 h-5 text-green-500" }), _jsx("h3", { className: "text-lg font-medium text-foreground", children: t('permissions.allowedCommands.title') })] }), _jsx("p", { className: "text-sm text-muted-foreground", children: t('permissions.allowedCommands.description') }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-2", children: [_jsx(Input, { value: newAllowedCommand, onChange: (e) => setNewAllowedCommand(e.target.value), placeholder: t('permissions.allowedCommands.placeholder'), onKeyPress: (e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addAllowedCommand(newAllowedCommand);
                                    }
                                }, className: "flex-1 h-10" }), _jsxs(Button, { onClick: () => addAllowedCommand(newAllowedCommand), disabled: !newAllowedCommand, size: "sm", className: "h-10 px-4", children: [_jsx(Plus, { className: "w-4 h-4 mr-2 sm:mr-0" }), _jsx("span", { className: "sm:hidden", children: t('permissions.actions.add') })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm font-medium text-gray-700 dark:text-gray-300", children: t('permissions.allowedCommands.quickAdd') }), _jsx("div", { className: "flex flex-wrap gap-2", children: commonCursorCommands.map(cmd => (_jsx(Button, { variant: "outline", size: "sm", onClick: () => addAllowedCommand(cmd), disabled: allowedCommands.includes(cmd), className: "text-xs h-8", children: cmd }, cmd))) })] }), _jsxs("div", { className: "space-y-2", children: [allowedCommands.map(cmd => (_jsxs("div", { className: "flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3", children: [_jsx("span", { className: "font-mono text-sm text-green-800 dark:text-green-200", children: cmd }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => removeAllowedCommand(cmd), className: "text-green-600 hover:text-green-700", children: _jsx(X, { className: "w-4 h-4" }) })] }, cmd))), allowedCommands.length === 0 && (_jsx("div", { className: "text-center py-6 text-gray-500 dark:text-gray-400", children: t('permissions.allowedCommands.empty') }))] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(AlertTriangle, { className: "w-5 h-5 text-red-500" }), _jsx("h3", { className: "text-lg font-medium text-foreground", children: t('permissions.blockedCommands.title') })] }), _jsx("p", { className: "text-sm text-muted-foreground", children: t('permissions.blockedCommands.description') }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-2", children: [_jsx(Input, { value: newDisallowedCommand, onChange: (e) => setNewDisallowedCommand(e.target.value), placeholder: t('permissions.blockedCommands.placeholder'), onKeyPress: (e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addDisallowedCommand(newDisallowedCommand);
                                    }
                                }, className: "flex-1 h-10" }), _jsxs(Button, { onClick: () => addDisallowedCommand(newDisallowedCommand), disabled: !newDisallowedCommand, size: "sm", className: "h-10 px-4", children: [_jsx(Plus, { className: "w-4 h-4 mr-2 sm:mr-0" }), _jsx("span", { className: "sm:hidden", children: t('permissions.actions.add') })] })] }), _jsxs("div", { className: "space-y-2", children: [disallowedCommands.map(cmd => (_jsxs("div", { className: "flex items-center justify-between bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3", children: [_jsx("span", { className: "font-mono text-sm text-red-800 dark:text-red-200", children: cmd }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => removeDisallowedCommand(cmd), className: "text-red-600 hover:text-red-700", children: _jsx(X, { className: "w-4 h-4" }) })] }, cmd))), disallowedCommands.length === 0 && (_jsx("div", { className: "text-center py-6 text-gray-500 dark:text-gray-400", children: t('permissions.blockedCommands.empty') }))] })] }), _jsxs("div", { className: "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4", children: [_jsx("h4", { className: "font-medium text-purple-900 dark:text-purple-100 mb-2", children: t('permissions.shellExamples.title') }), _jsxs("ul", { className: "text-sm text-purple-800 dark:text-purple-200 space-y-1", children: [_jsxs("li", { children: [_jsx("code", { className: "bg-purple-100 dark:bg-purple-800 px-1 rounded", children: "\"Shell(ls)\"" }), " ", t('permissions.shellExamples.ls')] }), _jsxs("li", { children: [_jsx("code", { className: "bg-purple-100 dark:bg-purple-800 px-1 rounded", children: "\"Shell(git status)\"" }), " ", t('permissions.shellExamples.gitStatus')] }), _jsxs("li", { children: [_jsx("code", { className: "bg-purple-100 dark:bg-purple-800 px-1 rounded", children: "\"Shell(npm install)\"" }), " ", t('permissions.shellExamples.npmInstall')] }), _jsxs("li", { children: [_jsx("code", { className: "bg-purple-100 dark:bg-purple-800 px-1 rounded", children: "\"Shell(rm -rf)\"" }), " ", t('permissions.shellExamples.rmRf')] })] })] })] }));
}
// Codex Permissions
function CodexPermissions({ permissionMode, setPermissionMode }) {
    const { t } = useTranslation('settings');
    return (_jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Shield, { className: "w-5 h-5 text-green-500" }), _jsx("h3", { className: "text-lg font-medium text-foreground", children: t('permissions.codex.permissionMode') })] }), _jsx("p", { className: "text-sm text-muted-foreground", children: t('permissions.codex.description') }), _jsx("div", { className: `border rounded-lg p-4 cursor-pointer transition-all ${permissionMode === 'default'
                        ? 'bg-gray-100 dark:bg-gray-800 border-gray-400 dark:border-gray-500'
                        : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`, onClick: () => setPermissionMode('default'), children: _jsxs("label", { className: "flex items-start gap-3 cursor-pointer", children: [_jsx("input", { type: "radio", name: "codexPermissionMode", checked: permissionMode === 'default', onChange: () => setPermissionMode('default'), className: "mt-1 w-4 h-4 text-green-600" }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-foreground", children: t('permissions.codex.modes.default.title') }), _jsx("div", { className: "text-sm text-muted-foreground", children: t('permissions.codex.modes.default.description') })] })] }) }), _jsx("div", { className: `border rounded-lg p-4 cursor-pointer transition-all ${permissionMode === 'acceptEdits'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600'
                        : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`, onClick: () => setPermissionMode('acceptEdits'), children: _jsxs("label", { className: "flex items-start gap-3 cursor-pointer", children: [_jsx("input", { type: "radio", name: "codexPermissionMode", checked: permissionMode === 'acceptEdits', onChange: () => setPermissionMode('acceptEdits'), className: "mt-1 w-4 h-4 text-green-600" }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-green-900 dark:text-green-100", children: t('permissions.codex.modes.acceptEdits.title') }), _jsx("div", { className: "text-sm text-green-700 dark:text-green-300", children: t('permissions.codex.modes.acceptEdits.description') })] })] }) }), _jsx("div", { className: `border rounded-lg p-4 cursor-pointer transition-all ${permissionMode === 'bypassPermissions'
                        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-400 dark:border-orange-600'
                        : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`, onClick: () => setPermissionMode('bypassPermissions'), children: _jsxs("label", { className: "flex items-start gap-3 cursor-pointer", children: [_jsx("input", { type: "radio", name: "codexPermissionMode", checked: permissionMode === 'bypassPermissions', onChange: () => setPermissionMode('bypassPermissions'), className: "mt-1 w-4 h-4 text-orange-600" }), _jsxs("div", { children: [_jsxs("div", { className: "font-medium text-orange-900 dark:text-orange-100 flex items-center gap-2", children: [t('permissions.codex.modes.bypassPermissions.title'), _jsx(AlertTriangle, { className: "w-4 h-4" })] }), _jsx("div", { className: "text-sm text-orange-700 dark:text-orange-300", children: t('permissions.codex.modes.bypassPermissions.description') })] })] }) }), _jsxs("details", { className: "text-sm", children: [_jsx("summary", { className: "cursor-pointer text-muted-foreground hover:text-foreground", children: t('permissions.codex.technicalDetails') }), _jsxs("div", { className: "mt-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-xs text-muted-foreground space-y-2", children: [_jsxs("p", { children: [_jsxs("strong", { children: [t('permissions.codex.modes.default.title'), ":"] }), " ", t('permissions.codex.technicalInfo.default')] }), _jsxs("p", { children: [_jsxs("strong", { children: [t('permissions.codex.modes.acceptEdits.title'), ":"] }), " ", t('permissions.codex.technicalInfo.acceptEdits')] }), _jsxs("p", { children: [_jsxs("strong", { children: [t('permissions.codex.modes.bypassPermissions.title'), ":"] }), " ", t('permissions.codex.technicalInfo.bypassPermissions')] }), _jsx("p", { className: "text-xs opacity-75", children: t('permissions.codex.technicalInfo.overrideNote') })] })] })] }) }));
}
// Main component
export default function PermissionsContent({ agent, ...props }) {
    if (agent === 'claude') {
        return _jsx(ClaudePermissions, { ...props });
    }
    if (agent === 'cursor') {
        return _jsx(CursorPermissions, { ...props });
    }
    if (agent === 'codex') {
        return _jsx(CodexPermissions, { ...props });
    }
    return null;
}
