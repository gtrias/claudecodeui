import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { GitBranch, Check } from 'lucide-react';
import { authenticatedFetch } from '../utils/api';
import { useTranslation } from 'react-i18next';
const GitSettings = () => {
    const { t } = useTranslation('settings');
    const [gitName, setGitName] = useState('');
    const [gitEmail, setGitEmail] = useState('');
    const [gitConfigLoading, setGitConfigLoading] = useState(false);
    const [gitConfigSaving, setGitConfigSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);
    useEffect(() => {
        loadGitConfig();
    }, []);
    const loadGitConfig = async () => {
        try {
            setGitConfigLoading(true);
            const response = await authenticatedFetch('/api/user/git-config');
            if (response.ok) {
                const data = await response.json();
                setGitName(data.gitName || '');
                setGitEmail(data.gitEmail || '');
            }
        }
        catch (error) {
            console.error('Error loading git config:', error);
        }
        finally {
            setGitConfigLoading(false);
        }
    };
    const saveGitConfig = async () => {
        try {
            setGitConfigSaving(true);
            const response = await authenticatedFetch('/api/user/git-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gitName, gitEmail })
            });
            if (response.ok) {
                setSaveStatus('success');
                setTimeout(() => setSaveStatus(null), 3000);
            }
            else {
                const data = await response.json();
                setSaveStatus('error');
                console.error('Failed to save git config:', data.error);
            }
        }
        catch (error) {
            console.error('Error saving git config:', error);
            setSaveStatus('error');
        }
        finally {
            setGitConfigSaving(false);
        }
    };
    return (_jsx("div", { className: "space-y-8", children: _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(GitBranch, { className: "h-5 w-5" }), _jsx("h3", { className: "text-lg font-semibold", children: t('git.title') })] }), _jsx("p", { className: "text-sm text-muted-foreground mb-4", children: t('git.description') }), _jsxs("div", { className: "p-4 border rounded-lg bg-card space-y-3", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "settings-git-name", className: "block text-sm font-medium text-foreground mb-2", children: t('git.name.label') }), _jsx(Input, { id: "settings-git-name", type: "text", value: gitName, onChange: (e) => setGitName(e.target.value), placeholder: "John Doe", disabled: gitConfigLoading, className: "w-full" }), _jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: t('git.name.help') })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "settings-git-email", className: "block text-sm font-medium text-foreground mb-2", children: t('git.email.label') }), _jsx(Input, { id: "settings-git-email", type: "email", value: gitEmail, onChange: (e) => setGitEmail(e.target.value), placeholder: "john@example.com", disabled: gitConfigLoading, className: "w-full" }), _jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: t('git.email.help') })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { onClick: saveGitConfig, disabled: gitConfigSaving || !gitName || !gitEmail, children: gitConfigSaving ? t('git.actions.saving') : t('git.actions.save') }), saveStatus === 'success' && (_jsxs("div", { className: "text-sm text-green-600 dark:text-green-400 flex items-center gap-2", children: [_jsx(Check, { className: "w-4 h-4" }), t('git.status.success')] }))] })] })] }) }));
};
export default GitSettings;
