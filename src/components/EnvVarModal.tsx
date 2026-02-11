import { useState, FC, useEffect } from 'react';
import { X, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { EnvironmentVariable, EnvironmentVariableMasked, UpdateEnvironmentVariableRequest } from '../shared/types';

interface EnvVarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string, value: string, isSensitive: boolean) => Promise<void>;
  editingVar?: EnvironmentVariableMasked | null;
  scope: 'global' | `project:${string}`;
}

const EnvVarModal: FC<EnvVarModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingVar,
  scope
}) => {
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
    } else if (isOpen) {
      // Reset for new variable
      setKey('');
      setValue('');
      setIsSensitive(false);
      setShowValue(false);
      setError('');
    }
  }, [editingVar, isOpen]);

  const validateKey = (key: string): string | null => {
    if (!key.trim()) {
      return t('envVars.errors.keyRequired');
    }
    if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
      return t('envVars.errors.invalidFormat');
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (err) {
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

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? 'visible' : 'hidden'}`}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={handleClose} />

      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('envVars.keyLabel')}
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => {
                setKey(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="MY_VARIABLE"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
              disabled={isSaving}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('envVars.keyHint')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('envVars.valueLabel')}
            </label>
            <div className="relative">
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="variable-value"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm pr-20"
                disabled={isSaving}
              />
              {editingVar?.is_sensitive && (
                <button
                  type="button"
                  onClick={() => setShowValue(!showValue)}
                  className="absolute right-2 top-2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  disabled={isSaving}
                >
                  {showValue ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is-sensitive"
              checked={isSensitive}
              onChange={(e) => setIsSensitive(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isSaving}
            />
            <label htmlFor="is-sensitive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              {t('envVars.sensitiveLabel')}
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              disabled={isSaving}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSaving}
            >
              {isSaving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnvVarModal;
