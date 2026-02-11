import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
const EnvVarModal = ({ isOpen, onClose, onSave, editingVar, scope }) => {
    const { t } = useTranslation('settings');
    const [key, setKey] = useState('');
    const [value, setValue] = useState('');
    const [isSensitive, setIsSensitive] = useState(false);
    const [showValue, setShowValue] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        if (editingVar && isOpen) {
            setKey(editingVar.key);
            setIsSensitive(editingVar.is_sensitive);
            // Don't pre-fill value for security - user must re-enter
            setValue('');
            setShowValue(false);
            setError('');
        }
        else if (isOpen) {
            // Reset for new variable
            setKey('');
            setValue('');
            setIsSensitive(false);
            setShowValue(false);
            setError('');
        }
    }, [editingVar, isOpen]);
    const validateKey = (key) => {
        if (!key.trim()) {
            return t('envVars.errors.keyRequired');
        }
        if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
            return t('envVars.errors.invalidFormat');
        }
        return null;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const validationError = validateKey(key);
        if (validationError) {
            setError(validationError);
            return;
        }
        if (!value.trim()) {
            setError(t('envVars.errors.valueRequired'));
            return;
        }
        setIsSaving(true);
        try {
            await onSave(key.trim().toUpperCase(), value.trim(), isSensitive);
            handleClose();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : t('envVars.errors.saveFailed'));
            setIsSaving(false);
        }
    };
    const handleClose = () => {
        setKey('');
        setValue('');
        setIsSensitive(false);
        setShowValue(false);
        setError('');
        setIsSaving(false);
        onClose();
    };
    const title = editingVar
        ? t('envVars.editTitle')
        : t('envVars.createTitle');
    return (_jsxs("div", { className: `fixed inset-0 z-50 flex items-center justify-center ${isOpen ? 'visible' : 'hidden'}`, children: [_jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity", onClick: handleClose }), _jsxs("div", { className: "relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b dark:border-gray-700", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: title }), _jsx("button", { onClick: handleClose, className: "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300", children: _jsx(X, { size: 20 }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-4", children: [error && (_jsx("div", { className: "mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md", children: _jsx("p", { className: "text-sm text-red-600 dark:text-red-400", children: error }) })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: t('envVars.keyLabel') }), _jsx("input", { type: "text", value: key, onChange: (e) => {
                                            setKey(e.target.value.toUpperCase());
                                            setError('');
                                        }, placeholder: "MY_VARIABLE", className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm", disabled: isSaving }), _jsx("p", { className: "mt-1 text-xs text-gray-500 dark:text-gray-400", children: t('envVars.keyHint') })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: t('envVars.valueLabel') }), _jsxs("div", { className: "relative", children: [_jsx("textarea", { value: value, onChange: (e) => setValue(e.target.value), placeholder: "variable-value", rows: 4, className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm pr-20", disabled: isSaving }), editingVar?.is_sensitive && (_jsx("button", { type: "button", onClick: () => setShowValue(!showValue), className: "absolute right-2 top-2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300", disabled: isSaving, children: showValue ? _jsx(Eye, { size: 16 }) : _jsx(EyeOff, { size: 16 }) }))] })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", id: "is-sensitive", checked: isSensitive, onChange: (e) => setIsSensitive(e.target.checked), className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded", disabled: isSaving }), _jsx("label", { htmlFor: "is-sensitive", className: "ml-2 text-sm text-gray-700 dark:text-gray-300", children: t('envVars.sensitiveLabel') })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4", children: [_jsx("button", { type: "button", onClick: handleClose, className: "px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600", disabled: isSaving, children: t('common.cancel') }), _jsx("button", { type: "submit", className: "px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed", disabled: isSaving, children: isSaving ? t('common.saving') : t('common.save') })] })] })] })] }));
};
export default EnvVarModal;
