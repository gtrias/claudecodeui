import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Key, Plus, Trash2, Eye, EyeOff, Copy, Check, Github, ExternalLink } from 'lucide-react';
import { useVersionCheck } from '../hooks/useVersionCheck';
import { version } from '../../package.json';
import { authenticatedFetch } from '../utils/api';
import { useTranslation } from 'react-i18next';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt?: string;
}

export interface GithubCredential {
  id: string;
  name: string;
  token: string;
  description?: string;
  createdAt?: string;
}

export interface CredentialsSettingsProps {}

const CredentialsSettings: React.FC<CredentialsSettingsProps> = () => {
  const { t } = useTranslation('settings');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [githubCredentials, setGithubCredentials] = useState<GithubCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [showNewGithubForm, setShowNewGithubForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newGithubName, setNewGithubName] = useState('');
  const [newGithubToken, setNewGithubToken] = useState('');
  const [newGithubDescription, setNewGithubDescription] = useState('');
  const [showToken, setShowToken] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  // Version check hook
  const { updateAvailable, latestVersion, releaseInfo } = useVersionCheck('siteboon', 'claudecodeui');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (): Promise<void> => {
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
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async (): Promise<void> => {
    if (!newKeyName.trim()) return;

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
    } catch (error) {
      console.error('Error creating API key:', error);
    }
  };

  const createGithubCredential = async (): Promise<void> => {
    if (!newGithubName.trim() || !newGithubToken.trim()) return;

    try {
      const res = await authenticatedFetch('/api/settings/credentials', {
        method: 'POST',
        body: JSON.stringify({
          name: newGithubName,
          type: 'github_token',
          value: newGithubToken,
          description: newGithubDescription
        })
      });

      if (res.ok) {
        setNewGithubName('');
        setNewGithubToken('');
        setNewGithubDescription('');
        setShowNewGithubForm(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error creating GitHub credential:', error);
    }
  };

  const deleteApiKey = async (id: string): Promise<void> => {
    try {
      await authenticatedFetch(`/api/settings/api-keys/${id}`, {
        method: 'DELETE'
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const deleteGithubCredential = async (id: string): Promise<void> => {
    try {
      await authenticatedFetch(`/api/settings/credentials/${id}`, {
        method: 'DELETE'
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting GitHub credential:', error);
    }
  };

  const copyToClipboard = (text: string, id: string): void => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Version Info */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">Claude Code UI</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Version: {version}</p>
        </div>
        {updateAvailable && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
              Update available: {latestVersion}
            </span>
            <a
              href={releaseInfo?.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              {t('credentialsSettings.releaseInfo')}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {/* API Keys Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">API Keys</h3>
          <Button onClick={() => setShowNewKeyForm(!showNewKeyForm)} variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add API Key
          </Button>
        </div>

        {showNewKeyForm && (
          <div className="flex gap-2 items-center">
            <Input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Enter key name"
              className="flex-1"
            />
            <Button onClick={createApiKey} variant="primary" size="sm">
              Add
            </Button>
            <Button onClick={() => setShowNewKeyForm(false)} variant="secondary" size="sm">
              Cancel
            </Button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading API keys...</div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No API keys configured</div>
        ) : (
          <div className="space-y-2">
            {apiKeys.map((key) => (
              <div key={key.id} className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Key className="w-5 h-5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{key.name}</p>
                  {newlyCreatedKey === key.id && (
                    <p className="text-xs text-green-600 dark:text-green-400">New key: {key.key}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(key.key, key.id)}
                  title="Copy to clipboard"
                >
                  {copiedKey === key.id ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteApiKey(key.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Delete key"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GitHub Credentials Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">GitHub Credentials</h3>
          <Button onClick={() => setShowNewGithubForm(!showNewGithubForm)} variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add GitHub Credential
          </Button>
        </div>

        {showNewGithubForm && (
          <div className="space-y-2">
            <Input
              type="text"
              value={newGithubName}
              onChange={(e) => setNewGithubName(e.target.value)}
              placeholder="Enter credential name"
            />
            <Input
              type="text"
              value={newGithubDescription}
              onChange={(e) => setNewGithubDescription(e.target.value)}
              placeholder="Enter description (optional)"
            />
            <Input
              type="password"
              value={newGithubToken}
              onChange={(e) => setNewGithubToken(e.target.value)}
              placeholder="Enter GitHub token"
            />
            <div className="flex gap-2">
              <Button onClick={createGithubCredential} variant="primary" size="sm">
                Add
              </Button>
              <Button onClick={() => setShowNewGithubForm(false)} variant="secondary" size="sm">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading GitHub credentials...</div>
        ) : githubCredentials.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No GitHub credentials configured</div>
        ) : (
          <div className="space-y-2">
            {githubCredentials.map((cred) => (
              <div key={cred.id} className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Github className="w-5 h-5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{cred.name}</p>
                  {cred.description && (
                    <p className="text-xs text-gray-500">{cred.description}</p>
                  )}
                  <p className="text-xs text-gray-500">••••••••••••••••{cred.token.slice(-4)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowToken(prev => ({ ...prev, [cred.id]: !prev[cred.id] }))}
                  title="Show token"
                >
                  {showToken[cred.id] ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteGithubCredential(cred.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Delete credential"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CredentialsSettings;