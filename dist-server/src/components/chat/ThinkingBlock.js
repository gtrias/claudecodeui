import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
/**
 * ThinkingBlock - Render AI's internal reasoning/thinking
 *
 * Features:
 * - Collapsible thinking display
 * - Token count estimation
 * - Expand/collapse animation
 * - Visual distinction from regular content
 * - i18n support
 */
export const ThinkingBlock = ({ content, defaultExpanded = false, className = '' }) => {
    const { t } = useTranslation('chat');
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    if (!content)
        return null;
    // Estimate token count (rough approximation: ~4 chars per token)
    const estimatedTokens = Math.ceil(content.length / 4);
    return (_jsx("div", { className: `my-3 ${className}`, children: _jsxs("details", { open: isExpanded, onToggle: (e) => setIsExpanded(e.target.open), className: "group", children: [_jsxs("summary", { className: "flex items-center gap-2 cursor-pointer list-none select-none p-3 rounded-lg bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200/30 dark:border-purple-800/30 hover:border-purple-300 dark:hover:border-purple-700 transition-colors", children: [_jsx("div", { className: "flex-shrink-0 w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center", children: _jsx("svg", { className: "w-4 h-4 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" }) }) }), _jsx("span", { className: "font-medium text-sm text-purple-900 dark:text-purple-100", children: t('thinking.label') || 'Thinking' }), _jsxs("span", { className: "text-xs text-purple-600 dark:text-purple-400 font-mono", children: ["~", estimatedTokens, " ", t('thinking.tokens') || 'tokens'] }), _jsx("svg", { className: `ml-auto w-4 h-4 text-purple-600 dark:text-purple-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) })] }), _jsx("div", { className: "mt-2 p-4 rounded-lg bg-white/50 dark:bg-gray-900/30 border border-purple-100 dark:border-purple-900/50", children: _jsx("div", { className: "prose prose-sm dark:prose-invert max-w-none", children: _jsx("pre", { className: "whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300 font-sans", children: content }) }) })] }) }));
};
export default ThinkingBlock;
