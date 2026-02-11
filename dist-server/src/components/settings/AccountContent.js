import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { LogIn } from 'lucide-react';
import ClaudeLogo from '../ClaudeLogo';
import CursorLogo from '../CursorLogo';
import CodexLogo from '../CodexLogo';
import PiLogo from '../PiLogo';
import { useTranslation } from 'react-i18next';
const agentConfig = {
    claude: {
        name: 'Claude',
        description: 'Anthropic Claude AI assistant',
        Logo: ClaudeLogo,
        bgClass: 'bg-blue-50 dark:bg-blue-900/20',
        borderClass: 'border-blue-200 dark:border-blue-800',
        textClass: 'text-blue-900 dark:text-blue-100',
        subtextClass: 'text-blue-700 dark:text-blue-300',
        buttonClass: 'bg-blue-600 hover:bg-blue-700',
    },
    cursor: {
        name: 'Cursor',
        description: 'Cursor AI-powered code editor',
        Logo: CursorLogo,
        bgClass: 'bg-purple-50 dark:bg-purple-900/20',
        borderClass: 'border-purple-200 dark:border-purple-800',
        textClass: 'text-purple-900 dark:text-purple-100',
        subtextClass: 'text-purple-700 dark:text-purple-300',
        buttonClass: 'bg-purple-600 hover:bg-purple-700',
    },
    codex: {
        name: 'Codex',
        description: 'OpenAI Codex AI assistant',
        Logo: CodexLogo,
        bgClass: 'bg-gray-100 dark:bg-gray-800/50',
        borderClass: 'border-gray-300 dark:border-gray-600',
        textClass: 'text-gray-900 dark:text-gray-100',
        subtextClass: 'text-gray-700 dark:text-gray-300',
        buttonClass: 'bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600',
    },
    pi: {
        name: 'Pi',
        description: 'Pi coding agent',
        Logo: PiLogo,
        bgClass: 'bg-amber-50 dark:bg-amber-900/20',
        borderClass: 'border-amber-200 dark:border-amber-800',
        textClass: 'text-amber-900 dark:text-amber-100',
        subtextClass: 'text-amber-700 dark:text-amber-300',
        buttonClass: 'bg-amber-600 hover:bg-amber-700',
    },
};
const AccountContent = ({ agent, authStatus, onLogin }) => {
    const { t } = useTranslation('settings');
    const config = agentConfig[agent];
    const { Logo } = config;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx(Logo, { className: "w-6 h-6" }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium text-foreground", children: config.name }), _jsx("p", { className: "text-sm text-muted-foreground", children: t(`agents.account.${agent}.description`) })] })] }), _jsx("div", { className: `${config.bgClass} border ${config.borderClass} rounded-lg p-4`, children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: `font-medium ${config.textClass}`, children: t('agents.connectionStatus') }), _jsx("div", { className: `text-sm ${config.subtextClass}`, children: authStatus?.loading ? (t('agents.authStatus.checkingAuth')) : authStatus?.authenticated ? (t('agents.authStatus.loggedInAs', { email: authStatus.email || t('agents.authStatus.authenticatedUser') })) : (t('agents.authStatus.notConnected')) })] }), _jsx("div", { children: authStatus?.loading ? (_jsx(Badge, { variant: "secondary", className: "bg-gray-100 dark:bg-gray-800", children: t('agents.authStatus.checking') })) : authStatus?.authenticated ? (_jsx(Badge, { variant: "secondary", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", children: t('agents.authStatus.connected') })) : (_jsx(Badge, { variant: "secondary", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", children: t('agents.authStatus.disconnected') })) })] }), _jsx("div", { className: "border-t border-gray-200 dark:border-gray-700 pt-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: `font-medium ${config.textClass}`, children: authStatus?.authenticated ? t('agents.login.reAuthenticate') : t('agents.login.title') }), _jsx("div", { className: `text-sm ${config.subtextClass}`, children: authStatus?.authenticated
                                                    ? t('agents.login.reAuthDescription')
                                                    : t('agents.login.description', { agent: config.name }) })] }), _jsxs(Button, { onClick: onLogin, className: `${config.buttonClass} text-white`, size: "sm", children: [_jsx(LogIn, { className: "w-4 h-4 mr-2" }), authStatus?.authenticated ? t('agents.login.reLoginButton') : t('agents.login.button')] })] }) }), authStatus?.error && (_jsx("div", { className: "border-t border-gray-200 dark:border-gray-700 pt-4", children: _jsx("div", { className: "text-sm text-red-600 dark:text-red-400", children: t('agents.error', { error: authStatus.error }) }) }))] }) })] }));
};
export default AccountContent;
