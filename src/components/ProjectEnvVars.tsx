import { useState, FC, useEffect } from 'react';
import { Plus, Trash2, Edit, Eye, EyeOff, Folder } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { EnvironmentVariableMasked } from '../shared/types';
import { authenticatedFetch } from '../utils/api';

interface ProjectEnvVarsProps {
  projectId: string;
  projectName: string;
}

const ProjectEnvVars: FC<ProjectEnvVarsProps> = ({ projectId, projectName }) => {
  const { t } = useTranslation('settings');
  const [envVars, setEnvVars] = useState<{ global: EnvironmentVariableMasked[]; project: EnvironmentVariableMasked[] }>({
    global: [],
    project: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVar, setEditingVar] = useState<EnvironmentVariableMasked | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [activeScope, setActiveScope] = useState<'global' | 'project'>('project');

  const fetchEnvVars = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await authenticatedFetch(`/api/environment-variables/project/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch environment variables');
      }
      const data = await response.json();
      setEnvVars(data.environmentVariables || { global: [], project: [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvVars();
  }, [projectId]);

  const handleCreate = async (key: string, value: string, isSensitive: boolean) => {
    setError('');
    try {
      const scope = activeScope === 'global' ? 'global' : `project:${projectId}`;
      const response = await authenticatedFetch('/api/environment-variables/global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, is_sensitive: isSensitive, scope }),
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
      const scope = activeScope === 'global' ? 'global' : `project:${projectId}`;
      const endpoint = activeScope === 'global'
        ? `/api/environment-variables/global/${id}`
        : `/api/environment-variables/project/${projectId}/${id}`;

      const response = await authenticatedFetch(endpoint, {
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

  const handleDelete = async (id: number, scope: 'global' | 'project') => {
    if (!confirm(t('envVars.deleteConfirm'))) {
      return;
    }
    setIsDeleting(id);
    setError('');
    try {
      const endpoint = scope === 'global'
        ? `/api/environment-variables/global/${id}`
        : `/api/environment-variables/project/${projectId}/${id}`;

      const response = await authenticatedFetch(endpoint, {
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

  const globalVars = envVars.global;
  const projectVars = envVars.project;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Folder size={18} className="text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('envVars.projectTitle', { projectName })}
          </h3>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary/90"
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
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : globalVars.length === 0 && projectVars.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-gray-400 mb-4">
            <Folder size={48} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('envVars.emptyProject.title')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
            {t('envVars.emptyProject.description')}
          </p>
        </div>
      ) : (
        <>
          {/* Scope toggle */}
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setActiveScope('project')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeScope === 'project'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {t('envVars.scopeProject')}
            </button>
            <button
              onClick={() => setActiveScope('global')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeScope === 'global'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {t('envVars.scopeGlobal')}
            </button>
          </div>

          {/* Environment variables list */}
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
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {/* Project variables (shown when project scope selected) */}
                {activeScope === 'project' &&
                  projectVars.map((envVar) => (
                    <tr key={envVar.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-sm font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {envVar.key}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className={`text-sm font-mono text-gray-900 dark:text-white ${envVar.is_sensitive ? 'blur-sm' : ''}`}>
                            {envVar.is_sensitive ? '•••••••' : envVar.value}
                          </span>
                          {envVar.is_sensitive && (
                            <button
                              onClick={() => {
                                const span = document.querySelector(`[data-project-var-id="${envVar.id}"] span`);
                                if (span) {
                                  span.classList.toggle('blur-sm');
                                }
                              }}
                              className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              data-project-var-id={envVar.id}
                            >
                              <Eye size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/20 text-primary dark:bg-accent/20 dark:text-primary">
                          {t('envVars.scopeProject')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(envVar)}
                          disabled={isDeleting === envVar.id}
                          className="text-primary dark:text-primary hover:text-primary dark:hover:text-primary mr-3"
                          title={t('envVars.edit')}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(envVar.id, 'project')}
                          disabled={isDeleting === envVar.id}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          title={t('common.delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}

                {/* Global variables (always shown) */}
                {globalVars.map((envVar) => (
                  <tr key={`global-${envVar.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-800 bg-accent/10/50 dark:bg-accent/20/10">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {envVar.key}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`text-sm font-mono text-gray-900 dark:text-white ${envVar.is_sensitive ? 'blur-sm' : ''}`}>
                          {envVar.is_sensitive ? '••••••' : envVar.value}
                        </span>
                        {envVar.is_sensitive && (
                          <button
                            onClick={() => {
                              const span = document.querySelector(`[data-global-var-id="${envVar.id}"] span`);
                              if (span) {
                                span.classList.toggle('blur-sm');
                              }
                            }}
                            className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            data-global-var-id={envVar.id}
                          >
                            <Eye size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {t('envVars.scopeGlobal')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(envVar)}
                        disabled={isDeleting === envVar.id}
                        className="text-primary dark:text-primary hover:text-primary dark:hover:text-primary mr-3"
                        title={t('envVars.edit')}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(envVar.id, 'global')}
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
        </>
      )}

      {/* Modal */}
      {showModal && (
        <EnvVarModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingVar(null);
          }}
          onSave={editingVar ? (key, value, isSensitive) => handleUpdate(editingVar.id, value, isSensitive) : handleCreate}
          editingVar={editingVar}
          scope={activeScope === 'global' ? 'global' : `project:${projectId}`}
        />
      )}
    </div>
  );
};

export default ProjectEnvVars;
