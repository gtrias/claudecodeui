import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Plus, Trash2, Edit, Eye, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authenticatedFetch } from '../utils/api';
const EnvironmentVariablesTab = ({ onClose }) => {
    const { t } = useTranslation('settings');
    const [envVars, setEnvVars] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingVar, setEditingVar] = useState(null);
    const [isDeleting, setIsDeleting] = useState(null);
    const [error, setError] = useState('');
    const fetchEnvVars = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await authenticatedFetch('/api/environment-variables/global');
            if (!response.ok) {
                throw new Error('Failed to fetch environment variables');
            }
            const data = await response.json();
            setEnvVars(data.environmentVariables || []);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        fetchEnvVars();
    }, []);
    const handleCreate = async (key, value, isSensitive) => {
        setError('');
        try {
            const response = await authenticatedFetch('/api/environment-variables/global', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value, is_sensitive: isSensitive, scope: 'global' }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create environment variable');
            }
            await fetchEnvVars();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            throw err;
        }
    };
    const handleUpdate = async (id, value, isSensitive) => {
        setError('');
        try {
            const response = await authenticatedFetch(`/api/environment-variables/global/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value, is_sensitive: isSensitive }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update environment variable');
            }
            await fetchEnvVars();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            throw err;
        }
    };
    const handleDelete = async (id) => {
        if (!confirm(t('envVars.deleteConfirm'))) {
            return;
        }
        setIsDeleting(id);
        setError('');
        try {
            const response = await authenticatedFetch(`/api/environment-variables/global/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete environment variable');
            }
            await fetchEnvVars();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
        finally {
            setIsDeleting(null);
        }
    };
    const openCreateModal = () => {
        setEditingVar(null);
        setShowModal(true);
    };
    const openEditModal = (envVar) => {
        setEditingVar(envVar);
        setShowModal(true);
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: t('envVars.title') }), _jsxs("button", { onClick: openCreateModal, className: "flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700", children: [_jsx(Plus, { size: 16 }), t('envVars.addButton')] })] }), error && (_jsx("div", { className: "p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md", children: _jsx("p", { className: "text-sm text-red-600 dark:text-red-400", children: error }) })), isLoading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) })) : envVars.length === 0 ? (
            /* Empty state */
            _jsxs("div", { className: "flex flex-col items-center justify-center py-12 text-center", children: [_jsx(Globe, { size: 48, className: "text-gray-400 mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white mb-2", children: t('envVars.emptyState.title') }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 max-w-md", children: t('envVars.emptyState.description') })] })) : (
            /* Environment variables list */
            _jsx("div", { className: "border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200 dark:divide-gray-700", children: [_jsx("thead", { className: "bg-gray-50 dark:bg-gray-800", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: t('envVars.table.key') }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: t('envVars.table.value') }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: t('envVars.table.scope') }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: t('envVars.table.sensitive') }), _jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: t('common.actions') })] }) }), _jsx("tbody", { className: "bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700", children: envVars.map((envVar) => (_jsxs("tr", { className: "hover:bg-gray-50 dark:hover:bg-gray-800", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("code", { className: "text-sm font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded", children: envVar.key }) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: `text-sm font-mono text-gray-900 dark:text-white ${envVar.is_sensitive ? 'blur-sm' : ''}`, children: envVar.is_sensitive ? '••••••••' : envVar.value }), envVar.is_sensitive && (_jsx("button", { onClick: () => {
                                                        // Toggle visibility
                                                        const span = document.querySelector(`[data-var-id="${envVar.id}"] span`);
                                                        if (span) {
                                                            span.classList.toggle('blur-sm');
                                                        }
                                                    }, className: "ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300", children: _jsx(Eye, { size: 14 }) }))] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", children: t('envVars.scopeGlobal') }) }), _jsx("td", { className: "px-6 py-4 text-center", children: envVar.is_sensitive ? (_jsx(EyeOff, { size: 16, className: "inline text-gray-400 mx-auto" })) : (_jsx("span", { className: "text-gray-400 dark:text-gray-600", children: "-" })) }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium", children: [_jsx("button", { onClick: () => openEditModal(envVar), className: "text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3", title: t('envVars.edit'), children: _jsx(Edit, { size: 16 }) }), _jsx("button", { onClick: () => handleDelete(envVar.id), disabled: isDeleting === envVar.id, className: "text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300", title: t('common.delete'), children: _jsx(Trash2, { size: 16 }) })] })] }, envVar.id))) })] }) })), showModal && (_jsx(EnvVarModal, { isOpen: showModal, onClose: () => {
                    setShowModal(false);
                    setEditingVar(null);
                }, onSave: editingVar ? handleUpdate : handleCreate, editingVar: editingVar, scope: "global" }))] }));
};
export default EnvironmentVariablesTab;
