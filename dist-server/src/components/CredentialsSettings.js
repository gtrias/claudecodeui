import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Key, Plus, Trash2, Eye, EyeOff, Copy, Check, Github, ExternalLink } from 'lucide-react';
import { useVersionCheck } from '../hooks/useVersionCheck';
import { version } from '../../package.json';
import { authenticatedFetch } from '../utils/api';
import { useTranslation } from 'react-i18next';
const CredentialsSettings = () => {
    const { t } = useTranslation('settings');
    const [apiKeys, setApiKeys] = useState([]);
    const [githubCredentials, setGithubCredentials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewKeyForm, setShowNewKeyForm] = useState(false);
    const [showNewGithubForm, setShowNewGithubForm] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newGithubName, setNewGithubName] = useState('');
    const [newGithubToken, setNewGithubToken] = useState('');
    const [newGithubDescription, setNewGithubDescription] = useState('');
    const [showToken, setShowToken] = useState({});
    const [copiedKey, setCopiedKey] = useState(null);
    const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
    // Version check hook
    const { updateAvailable, latestVersion, releaseInfo } = useVersionCheck('siteboon', 'claudecodeui');
    useEffect(() => {
        fetchData();
    }, []);
    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch API keys
            const apiKeysRes = await authenticatedFetch('/api/settings/api-keys');
            const apiKeysData = await apiKeysRes.json();
            setApiKeys(apiKeysData.apiKeys || []);
            // Fetch GitHub credentials only
            const credentialsRes = await authenticatedFetch('/api/settings/credentials?type=github_token');
            const credentialsData = await credentialsRes.json();
            setGithubCredentials(credentialsData.credentials || []);
        }
        catch (error) {
            console.error('Error fetching settings:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const createApiKey = async () => {
        if (!newKeyName.trim())
            return;
        try {
            const res = await authenticatedFetch('/api/settings/api-keys', {
                method: 'POST',
                body: JSON.stringify({ keyName: newKeyName })
            });
            const data = await res.json();
            if (data.success) {
                setNewlyCreatedKey(data.apiKey);
                setNewKeyName('');
                setShowNewKeyForm(false);
                fetchData();
            }
        }
        catch (error) {
            console.error('Error creating API key:', error);
        }
    };
    const deleteApiKey = async (keyId) => {
        if (!confirm(t('apiKeys.confirmDelete')))
            return;
        try {
            await authenticatedFetch(`/api/settings/api-keys/${keyId}`, {
                method: 'DELETE'
            });
            fetchData();
        }
        catch (error) {
            console.error('Error deleting API key:', error);
        }
    };
    const toggleApiKey = async (keyId, isActive) => {
        try {
            await authenticatedFetch(`/api/settings/api-keys/${keyId}/toggle`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive: !isActive })
            });
            fetchData();
        }
        catch (error) {
            console.error('Error toggling API key:', error);
        }
    };
    const createGithubCredential = async () => {
        if (!newGithubName.trim() || !newGithubToken.trim())
            return;
        try {
            const res = await authenticatedFetch('/api/settings/credentials', {
                method: 'POST',
                body: JSON.stringify({
                    credentialName: newGithubName,
                    credentialType: 'github_token',
                    credentialValue: newGithubToken,
                    description: newGithubDescription
                })
            });
            const data = await res.json();
            if (data.success) {
                setNewGithubName('');
                setNewGithubToken('');
                setNewGithubDescription('');
                setShowNewGithubForm(false);
                fetchData();
            }
        }
        catch (error) {
            console.error('Error creating GitHub credential:', error);
        }
    };
    const deleteGithubCredential = async (credentialId) => {
        if (!confirm(t('apiKeys.github.confirmDelete')))
            return;
        try {
            await authenticatedFetch(`/api/settings/credentials/${credentialId}`, {
                method: 'DELETE'
            });
            fetchData();
        }
        catch (error) {
            console.error('Error deleting GitHub credential:', error);
        }
    };
    const toggleGithubCredential = async (credentialId, isActive) => {
        try {
            await authenticatedFetch(`/api/settings/credentials/${credentialId}/toggle`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive: !isActive })
            });
            fetchData();
        }
        catch (error) {
            console.error('Error toggling GitHub credential:', error);
        }
    };
    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(id);
        setTimeout(() => setCopiedKey(null), 2000);
    };
    if (loading) {
        return _jsx("div", { className: "text-muted-foreground", children: t('apiKeys.loading') });
    }
    return (_jsxs("div", { className: "space-y-8", children: [newlyCreatedKey && (_jsxs("div", { className: "p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg", children: [_jsx("h4", { className: "font-semibold text-yellow-500 mb-2", children: t('apiKeys.newKey.alertTitle') }), _jsx("p", { className: "text-sm text-muted-foreground mb-3", children: t('apiKeys.newKey.alertMessage') }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("code", { className: "flex-1 px-3 py-2 bg-background/50 rounded font-mono text-sm break-all", children: newlyCreatedKey.apiKey }), _jsx(Button, { size: "sm", variant: "outline", onClick: () => copyToClipboard(newlyCreatedKey.apiKey, 'new'), children: copiedKey === 'new' ? _jsx(Check, { className: "h-4 w-4" }) : _jsx(Copy, { className: "h-4 w-4" }) })] }), _jsx(Button, { size: "sm", variant: "ghost", className: "mt-3", onClick: () => setNewlyCreatedKey(null), children: t('apiKeys.newKey.iveSavedIt') })] })), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Key, { className: "h-5 w-5" }), _jsx("h3", { className: "text-lg font-semibold", children: t('apiKeys.title') })] }), _jsxs(Button, { size: "sm", onClick: () => setShowNewKeyForm(!showNewKeyForm), children: [_jsx(Plus, { className: "h-4 w-4 mr-1" }), t('apiKeys.newButton')] })] }), _jsxs("div", { className: "mb-4", children: [_jsx("p", { className: "text-sm text-muted-foreground mb-2", children: t('apiKeys.description') }), _jsxs("a", { href: "/api-docs.html", target: "_blank", rel: "noopener noreferrer", className: "text-sm text-primary hover:underline inline-flex items-center gap-1", children: [t('apiKeys.apiDocsLink'), _jsx(ExternalLink, { className: "h-3 w-3" })] })] }), showNewKeyForm && (_jsxs("div", { className: "mb-4 p-4 border rounded-lg bg-card", children: [_jsx(Input, { placeholder: t('apiKeys.form.placeholder'), value: newKeyName, onChange: (e) => setNewKeyName(e.target.value), className: "mb-2" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { onClick: createApiKey, children: t('apiKeys.form.createButton') }), _jsx(Button, { variant: "outline", onClick: () => setShowNewKeyForm(false), children: t('apiKeys.form.cancelButton') })] })] })), _jsx("div", { className: "space-y-2", children: apiKeys.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground italic", children: t('apiKeys.empty') })) : (apiKeys.map((key) => (_jsxs("div", { className: "flex items-center justify-between p-3 border rounded-lg", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-medium", children: key.key_name }), _jsx("code", { className: "text-xs text-muted-foreground", children: key.api_key }), _jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [t('apiKeys.list.created'), " ", new Date(key.created_at).toLocaleDateString(), key.last_used && ` • ${t('apiKeys.list.lastUsed')} ${new Date(key.last_used).toLocaleDateString()}`] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { size: "sm", variant: key.is_active ? 'outline' : 'secondary', onClick: () => toggleApiKey(key.id, key.is_active), children: key.is_active ? t('apiKeys.status.active') : t('apiKeys.status.inactive') }), _jsx(Button, { size: "sm", variant: "ghost", onClick: () => deleteApiKey(key.id), children: _jsx(Trash2, { className: "h-4 w-4" }) })] })] }, key.id)))) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Github, { className: "h-5 w-5" }), _jsx("h3", { className: "text-lg font-semibold", children: t('apiKeys.github.title') })] }), _jsxs(Button, { size: "sm", onClick: () => setShowNewGithubForm(!showNewGithubForm), children: [_jsx(Plus, { className: "h-4 w-4 mr-1" }), t('apiKeys.github.addButton')] })] }), _jsx("p", { className: "text-sm text-muted-foreground mb-4", children: t('apiKeys.github.descriptionAlt') }), showNewGithubForm && (_jsxs("div", { className: "mb-4 p-4 border rounded-lg bg-card space-y-3", children: [_jsx(Input, { placeholder: t('apiKeys.github.form.namePlaceholder'), value: newGithubName, onChange: (e) => setNewGithubName(e.target.value) }), _jsxs("div", { className: "relative", children: [_jsx(Input, { type: showToken['new'] ? 'text' : 'password', placeholder: t('apiKeys.github.form.tokenPlaceholder'), value: newGithubToken, onChange: (e) => setNewGithubToken(e.target.value), className: "pr-10" }), _jsx("button", { type: "button", onClick: () => setShowToken({ ...showToken, new: !showToken['new'] }), className: "absolute right-3 top-2.5 text-muted-foreground hover:text-foreground", children: showToken['new'] ? _jsx(EyeOff, { className: "h-4 w-4" }) : _jsx(Eye, { className: "h-4 w-4" }) })] }), _jsx(Input, { placeholder: t('apiKeys.github.form.descriptionPlaceholder'), value: newGithubDescription, onChange: (e) => setNewGithubDescription(e.target.value) }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { onClick: createGithubCredential, children: t('apiKeys.github.form.addButton') }), _jsx(Button, { variant: "outline", onClick: () => {
                                            setShowNewGithubForm(false);
                                            setNewGithubName('');
                                            setNewGithubToken('');
                                            setNewGithubDescription('');
                                        }, children: t('apiKeys.github.form.cancelButton') })] }), _jsx("a", { href: "https://github.com/settings/tokens", target: "_blank", rel: "noopener noreferrer", className: "text-xs text-primary hover:underline block", children: t('apiKeys.github.form.howToCreate') })] })), _jsx("div", { className: "space-y-2", children: githubCredentials.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground italic", children: t('apiKeys.github.empty') })) : (githubCredentials.map((credential) => (_jsxs("div", { className: "flex items-center justify-between p-3 border rounded-lg", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-medium", children: credential.credential_name }), credential.description && (_jsx("div", { className: "text-xs text-muted-foreground", children: credential.description })), _jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [t('apiKeys.github.added'), " ", new Date(credential.created_at).toLocaleDateString()] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { size: "sm", variant: credential.is_active ? 'outline' : 'secondary', onClick: () => toggleGithubCredential(credential.id, credential.is_active), children: credential.is_active ? t('apiKeys.status.active') : t('apiKeys.status.inactive') }), _jsx(Button, { size: "sm", variant: "ghost", onClick: () => deleteGithubCredential(credential.id), children: _jsx(Trash2, { className: "h-4 w-4" }) })] })] }, credential.id)))) })] }), _jsx("div", { className: "pt-6 border-t border-border/50", children: _jsxs("div", { className: "flex items-center justify-between text-xs italic text-muted-foreground/60", children: [_jsxs("a", { href: releaseInfo?.htmlUrl || 'https://github.com/siteboon/claudecodeui/releases', target: "_blank", rel: "noopener noreferrer", className: "hover:text-muted-foreground transition-colors", children: ["v", version] }), updateAvailable && latestVersion && (_jsxs("a", { href: releaseInfo?.htmlUrl || 'https://github.com/siteboon/claudecodeui/releases', target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full hover:bg-green-500/20 transition-colors not-italic font-medium", children: [_jsx("span", { className: "text-[10px]", children: t('apiKeys.version.updateAvailable', { version: latestVersion }) }), _jsx(ExternalLink, { className: "h-2.5 w-2.5" })] }))] }) })] }));
};
export default CredentialsSettings;
