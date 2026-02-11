import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import Shell from './Shell';
/**
 * Generic Shell wrapper that can be used in tabs, modals, and other contexts.
 * Provides a flexible API for both standalone and session-based usage.
 */
const StandaloneShell = ({ project, session = null, command = null, isPlainShell = null, autoConnect = true, onComplete = null, onClose = null, title = null, className = "", showHeader = true, compact = false, minimal = false }) => {
    const [isCompleted, setIsCompleted] = useState(false);
    const shouldUsePlainShell = isPlainShell !== null ? isPlainShell : (command !== null);
    const handleProcessComplete = useCallback((exitCode) => {
        setIsCompleted(true);
        if (onComplete) {
            onComplete(exitCode);
        }
    }, [onComplete]);
    if (!project) {
        return (_jsx("div", { className: `h-full flex items-center justify-center ${className}`, children: _jsxs("div", { className: "text-center text-gray-500 dark:text-gray-400", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center", children: _jsx("svg", { className: "w-8 h-8 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 002 2z" }) }) }), _jsx("h3", { className: "text-lg font-semibold mb-2", children: "No Project Selected" }), _jsx("p", { children: "A project is required to open a shell" })] }) }));
    }
    return (_jsxs("div", { className: `h-full w-full flex flex-col ${className}`, children: [!minimal && showHeader && title && (_jsx("div", { className: "flex-shrink-0 bg-gray-800 border-b border-gray-700 px-4 py-2", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("h3", { className: "text-sm font-medium text-gray-200", children: title }), isCompleted && (_jsx("span", { className: "text-xs text-green-400", children: "(Completed)" }))] }), onClose && (_jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-white", title: "Close", children: _jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) }))] }) })), _jsx("div", { className: "flex-1 w-full min-h-0", children: _jsx(Shell, { selectedProject: project, selectedSession: session, initialCommand: command, isPlainShell: shouldUsePlainShell, onProcessComplete: handleProcessComplete, minimal: minimal, autoConnect: minimal ? true : autoConnect }) })] }));
};
export default StandaloneShell;
