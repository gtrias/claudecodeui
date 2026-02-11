import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X } from 'lucide-react';
import StandaloneShell from './StandaloneShell';
import { IS_PLATFORM } from '../constants/config';
/**
 * Reusable login modal component for Claude, Cursor, and Codex CLI authentication
 */
const LoginModal = ({ isOpen, onClose, provider = 'claude', project, onComplete, customCommand, isAuthenticated = false }) => {
    if (!isOpen)
        return null;
    const getCommand = () => {
        if (customCommand)
            return customCommand;
        switch (provider) {
            case 'claude':
                return isAuthenticated ? 'claude setup-token --dangerously-skip-permissions' : 'claude /exit --dangerously-skip-permissions';
            case 'cursor':
                return 'cursor-agent login';
            case 'codex':
                return IS_PLATFORM ? 'codex login --device-auth' : 'codex login';
            case 'pi':
                return 'pi';
            default:
                return isAuthenticated ? 'claude setup-token --dangerously-skip-permissions' : 'claude /exit --dangerously-skip-permissions';
        }
    };
    const getTitle = () => {
        switch (provider) {
            case 'claude':
                return 'Claude CLI Login';
            case 'cursor':
                return 'Cursor CLI Login';
            case 'codex':
                return 'Codex CLI Login';
            case 'pi':
                return 'Pi CLI Login';
            default:
                return 'CLI Login';
        }
    };
    const handleComplete = (exitCode) => {
        if (onComplete) {
            onComplete(exitCode);
        }
        if (exitCode === 0) {
            onClose();
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] max-md:items-stretch max-md:justify-stretch", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col md:max-w-4xl md:h-3/4 md:rounded-lg md:m-4 max-md:max-w-none max-md:h-full max-md:rounded-none max-md:m-0", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: getTitle() }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors", "aria-label": "Close login modal", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsx("div", { className: "flex-1 overflow-hidden", children: _jsx(StandaloneShell, { project: project, command: getCommand(), onComplete: handleComplete, minimal: true }) })] }) }));
};
export default LoginModal;
