import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
/**
 * ToolUseDisplay - Render tool use information with styled display
 *
 * Features:
 * - Minimized display for search tools (Grep, Glob)
 * - Full display for other tools (Edit, Write, etc.)
 * - Tool icon and name
 * - Expandable input/output details
 * - Settings button
 * - Result linking for search tools
 */
export const ToolUseDisplay = ({ toolName, toolId, toolInput, toolResult, autoExpand = false, minimized = false, onShowSettings, className = '' }) => {
    const { t } = useTranslation('chat');
    // Parse tool input
    let parsedInput = null;
    if (toolInput) {
        try {
            parsedInput = JSON.parse(toolInput);
        }
        catch (error) {
            console.error('Failed to parse tool input:', error);
        }
    }
    // Minimized display for search tools (Grep, Glob)
    if (minimized && ['Grep', 'Glob'].includes(toolName)) {
        return (_jsx("div", { className: `group relative bg-gray-50/50 dark:bg-gray-800/30 border-l-2 border-blue-400 dark:border-blue-500 pl-3 py-2 my-2 ${className}`, children: _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 flex-1 min-w-0", children: [_jsx("svg", { className: "w-3.5 h-3.5 text-blue-500 dark:text-blue-400 flex-shrink-0", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }), _jsx("span", { className: "font-medium flex-shrink-0", children: toolName }), _jsx("span", { className: "text-gray-400 dark:text-gray-500 flex-shrink-0", children: "\u2022" }), parsedInput && (_jsxs("span", { className: "font-mono truncate flex-1 min-w-0", children: [parsedInput.pattern && (_jsxs("span", { children: [t('search.pattern') || 'Pattern', ' ', _jsx("span", { className: "text-blue-600 dark:text-blue-400", children: parsedInput.pattern })] })), parsedInput.path && (_jsxs("span", { className: "ml-2", children: [t('search.in') || 'in', " ", parsedInput.path] }))] }))] }), toolResult && (_jsxs("a", { href: `#tool-result-${toolId}`, className: "flex-shrink-0 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors flex items-center gap-1", children: [_jsx("span", { children: t('tools.searchResults') || 'Results' }), _jsx("svg", { className: "w-3 h-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) })] }))] }) }));
    }
    // Full display for other tools
    return (_jsxs("div", { className: `group relative bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100/30 dark:border-blue-800/30 rounded-lg p-3 mb-2 ${className}`, children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-blue-500/3 to-indigo-500/3 dark:from-blue-400/3 dark:to-indigo-400/3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" }), _jsxs("div", { className: "relative flex items-center justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "relative w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 dark:shadow-blue-400/20", children: [_jsxs("svg", { className: "w-4 h-4 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" })] }), _jsx("div", { className: "absolute inset-0 rounded-lg bg-blue-500 dark:bg-blue-400 animate-pulse opacity-20" })] }), _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "font-semibold text-gray-900 dark:text-white text-sm", children: toolName }), _jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400 font-mono", children: toolId })] })] }), onShowSettings && (_jsx("button", { onClick: (e) => {
                            e.stopPropagation();
                            onShowSettings();
                        }, className: "p-2 rounded-lg hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-200 group/btn backdrop-blur-sm", title: t('tools.settings') || 'Settings', children: _jsxs("svg", { className: "w-4 h-4 text-gray-600 dark:text-gray-400 group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400 transition-colors", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" })] }) }))] }), parsedInput && (_jsx("div", { className: "relative text-xs text-gray-600 dark:text-gray-400 font-mono bg-white/50 dark:bg-gray-900/30 rounded p-2", children: _jsx("pre", { className: "whitespace-pre-wrap break-all", children: JSON.stringify(parsedInput, null, 2) }) }))] }));
};
export default ToolUseDisplay;
