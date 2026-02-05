import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Key, Plus, Trash2, Eye, EyeOff, Copy, Check, Github } from 'lucide-react';
import { authenticatedFetch } from '../utils/api';
import { useTranslation } from 'react-i18next';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt?: string;
}

export interface GithubToken {
  id: string;
  name: string;
  token: string;
  createdAt?: string;
}

export interface ApiKeysSettingsProps {}

const ApiKeysSettings: React.FC<ApiKeysSettingsProps> = () => {
  const { t } = useTranslation('settings');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [githubTokens, setGithubTokens] = useState<GithubToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [showNewTokenForm, setShowNewTokenForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newTokenName, setNewTokenName] = useState('');
  const [newGithubToken, setNewGithubToken] = useState('');
  const [showToken, setShowToken] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

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

      // Fetch GitHub tokens
      const githubRes = await authenticatedFetch('/api/settings/credentials?type=github_token');
      const githubData = await githubRes.json();
      setGithubTokens(githubData.credentials || []);
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

  const copyToClipboard = (text: string, id: string): void => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
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

      {/* GitHub Tokens Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">GitHub Tokens</h3>
          <Button onClick={() => setShowNewTokenForm(!showNewTokenForm)} variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add GitHub Token
          </Button>
        </div>

        {showNewTokenForm && (
          <div className="flex gap-2 items-center">
            <Input
              type="text"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              placeholder="Enter token name"
              className="flex-1"
            />
            <Input
              type="password"
              value={newGithubToken}
              onChange={(e) => setNewGithubToken(e.target.value)}
              placeholder="Enter GitHub token"
              className="flex-1"
            />
            <Button onClick={createToken} variant="primary" size="sm">
              Add
            </Button>
            <Button onClick={() => setShowNewTokenForm(false)} variant="secondary" size="sm">
              Cancel
            </Button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading GitHub tokens...</div>
        ) : githubTokens.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No GitHub tokens configured</div>
        ) : (
          <div className="space-y-2">
            {githubTokens.map((token) => (
              <div key={token.id} className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Github className="w-5 h-5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{token.name}</p>
                  <p className="text-xs text-gray-500">••••••••••••••••{token.token.slice(-4)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowToken(prev => ({ ...prev, [token.id]: !prev[token.id] }))}
                  title="Show token"
                >
                  {showToken[token.id] ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteToken(token.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Delete token"
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

const createToken = async (): Promise<void> => {
  // TODO: Implement token creation
};

const deleteToken = async (id: string): Promise<void> => {
  // TODO: Implement token deletion
};

export default ApiKeysSettings;