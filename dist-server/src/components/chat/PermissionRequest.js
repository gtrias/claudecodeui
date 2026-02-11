import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
/**
 * Get icon for permission type
 */
function getPermissionIcon(type) {
    const iconClass = "w-5 h-5";
    switch (type) {
        case 'tool':
            return (_jsxs("svg", { className: iconClass, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" })] }));
        case 'file':
            return (_jsx("svg", { className: iconClass, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }) }));
        case 'command':
            return (_jsx("svg", { className: iconClass, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" }) }));
        case 'network':
            return (_jsx("svg", { className: iconClass, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" }) }));
        case 'settings':
            return (_jsx("svg", { className: iconClass, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" }) }));
    }
}
/**
 * PermissionRequest - Request user permission for sensitive operations
 *
 * Features:
 * - Type-specific icons
 * - Grant/deny buttons
 * - Optional "Always allow"
 * - Pending state
 * - Visual hierarchy
 * - i18n support
 */
export const PermissionRequest = ({ type, resourceName, description, details, isPending = false, onGrant, onDeny, showAlwaysAllow = false, onAlwaysAllow, className = '' }) => {
    const { t } = useTranslation('chat');
    return (_jsx("div", { className: `my-3 p-4 rounded-lg border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50/50 dark:bg-yellow-900/10 ${className}`, children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "flex-shrink-0 w-10 h-10 rounded-lg bg-yellow-500 dark:bg-yellow-600 text-white flex items-center justify-center", children: getPermissionIcon(type) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h4", { className: "font-semibold text-gray-900 dark:text-white mb-1", children: t('permission.request') || 'Permission Required' }), _jsxs("p", { className: "text-sm text-gray-700 dark:text-gray-300 mb-2", children: [_jsx("span", { className: "font-medium", children: resourceName }), description && _jsxs("span", { children: [" - ", description] })] }), details && (_jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400 mb-3 font-mono bg-white/50 dark:bg-gray-900/30 p-2 rounded", children: details })), _jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("button", { onClick: onGrant, disabled: isPending, className: "px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium text-sm transition-colors", children: t('permission.grant') || 'Allow' }), _jsx("button", { onClick: onDeny, disabled: isPending, className: "px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium text-sm transition-colors", children: t('permission.deny') || 'Deny' }), showAlwaysAllow && onAlwaysAllow && (_jsx("button", { onClick: onAlwaysAllow, disabled: isPending, className: "px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium text-sm transition-colors", children: t('permission.alwaysAllow') || 'Always Allow' }))] })] })] }) }));
};
export default PermissionRequest;
