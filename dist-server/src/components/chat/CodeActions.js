import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
/**
 * CodeActions - Action buttons for code blocks (copy, apply, etc.)
 *
 * Features:
 * - Copy to clipboard with fallback
 * - Visual feedback on copy success
 * - Apply button for diffs/patches
 * - Responsive positioning
 * - Keyboard accessible
 */
export const CodeActions = ({ code, language, className = '', onCopySuccess, showApply = false, onApply }) => {
    const { t } = useTranslation('chat');
    const [copied, setCopied] = useState(false);
    /**
     * Copy code to clipboard with multiple fallback strategies
     */
    const handleCopy = () => {
        const doSet = () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
            if (onCopySuccess) {
                onCopySuccess();
            }
        };
        try {
            // Modern clipboard API
            if (navigator?.clipboard?.writeText) {
                navigator.clipboard.writeText(code)
                    .then(doSet)
                    .catch(() => {
                    // Fallback to textarea method
                    copyViaTextarea(code, doSet);
                });
            }
            else {
                // Fallback for older browsers
                copyViaTextarea(code, doSet);
            }
        }
        catch (error) {
            console.error('Failed to copy code:', error);
        }
    };
    /**
     * Fallback copy method using hidden textarea
     */
    const copyViaTextarea = (text, callback) => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        ta.style.top = '0';
        ta.style.left = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            callback();
        }
        catch (error) {
            console.error('Fallback copy failed:', error);
        }
        finally {
            document.body.removeChild(ta);
        }
    };
    return (_jsxs("div", { className: `absolute top-2 right-2 z-10 flex gap-2 ${className}`, children: [showApply && onApply && (_jsx("button", { type: "button", onClick: onApply, className: "opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-xs px-2 py-1 rounded-md bg-blue-600/80 hover:bg-blue-600 text-white border border-blue-500", title: t('codeBlock.apply') || 'Apply', "aria-label": t('codeBlock.apply') || 'Apply', children: _jsxs("span", { className: "flex items-center gap-1", children: [_jsx("svg", { className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }), t('codeBlock.apply') || 'Apply'] }) })), _jsx("button", { type: "button", onClick: handleCopy, className: "opacity-0 group-hover:opacity-100 focus:opacity-100 active:opacity-100 transition-opacity text-xs px-2 py-1 rounded-md bg-gray-700/80 hover:bg-gray-700 text-white border border-gray-600", title: copied ? t('codeBlock.copied') : t('codeBlock.copyCode'), "aria-label": copied ? t('codeBlock.copied') : t('codeBlock.copyCode'), children: copied ? (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx("svg", { className: "w-3.5 h-3.5", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }), t('codeBlock.copied')] })) : (_jsxs("span", { className: "flex items-center gap-1", children: [_jsxs("svg", { className: "w-3.5 h-3.5", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }), _jsx("path", { d: "M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" })] }), t('codeBlock.copy')] })) })] }));
};
export default CodeActions;
