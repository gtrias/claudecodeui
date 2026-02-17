import { useState, FC } from 'react';
import { Plus, Trash2, Edit, Eye, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { EnvironmentVariableMasked } from '../../shared/types';
import { authenticatedFetch } from '../../utils/api';

interface EnvironmentVariablesTabProps {
  onClose: () => void;
}

const EnvironmentVariablesTab: FC<EnvironmentVariablesTabProps> = ({ onClose }) => {
  const { t } = useTranslation('settings');
  const [envVars, setEnvVars] = useState<EnvironmentVariableMasked[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVar, setEditingVar] = useState<EnvironmentVariableMasked | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvVars();
  }, []);

  const handleCreate = async (key: string, value: string, isSensitive: boolean) => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  };

  const handleUpdate = async (id: number, value: string, isSensitive: boolean) => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  };

  const handleDelete = async (id: number) => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsDeleting(null);
    }
  };

  const openCreateModal = () => {
    setEditingVar(null);
    setShowModal(true);
  };

  const openEditModal = (envVar: EnvironmentVariableMasked) => {
    setEditingVar(envVar);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('envVars.title')}
        </h2>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary/90"
        >
          <Plus size={16} />
          {t('envVars.addButton')}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : envVars.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Globe size={48} className="text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('envVars.emptyState.title')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
            {t('envVars.emptyState.description')}
          </p>
        </div>
      ) : (
        /* Environment variables list */
        <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('envVars.table.key')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('envVars.table.value')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('envVars.table.scope')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('envVars.table.sensitive')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {envVars.map((envVar) => (
                <tr key={envVar.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {envVar.key}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className={`text-sm font-mono text-gray-900 dark:text-white ${envVar.is_sensitive ? 'blur-sm' : ''}`}>
                        {envVar.is_sensitive ? '••••••••' : envVar.value}
                      </span>
                      {envVar.is_sensitive && (
                        <button
                          onClick={() => {
                            // Toggle visibility
                            const span = document.querySelector(`[data-var-id="${envVar.id}"] span`);
                            if (span) {
                              span.classList.toggle('blur-sm');
                            }
                          }}
                          className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <Eye size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/20 text-primary dark:bg-accent/20 dark:text-primary">
                      {t('envVars.scopeGlobal')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {envVar.is_sensitive ? (
                      <EyeOff size={16} className="inline text-gray-400 mx-auto" />
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(envVar)}
                      className="text-primary dark:text-primary hover:text-primary dark:hover:text-primary mr-3"
                      title={t('envVars.edit')}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(envVar.id)}
                      disabled={isDeleting === envVar.id}
                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                      title={t('common.delete')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <EnvVarModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingVar(null);
          }}
          onSave={editingVar ? handleUpdate : handleCreate}
          editingVar={editingVar}
          scope="global"
        />
      )}
    </div>
  );
};

export default EnvironmentVariablesTab;
