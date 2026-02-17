import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Key, Plus, Trash2, Copy, Check, Github } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApiKeys, useCredentials } from '../hooks/useSettings';

interface NewApiKey {
  key: string;
  name: string;
}

const ApiKeysSettings: React.FC = () => {
  const { t } = useTranslation('settings');
  
  // Convex hooks
  const { 
    apiKeys, 
    isLoading: apiKeysLoading, 
    createApiKey: createApiKeyMutation,
    deleteApiKey: deleteApiKeyMutation,
    toggleApiKey: toggleApiKeyMutation,
  } = useApiKeys();
  
  const {
    credentials: githubTokens,
    isLoading: githubLoading,
    createCredential: createCredentialMutation,
    deleteCredential: deleteCredentialMutation,
    toggleCredential: toggleCredentialMutation,
  } = useCredentials('github_token');

  // Local state
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [showNewTokenForm, setShowNewTokenForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newTokenName, setNewTokenName] = useState('');
  const [newGithubToken, setNewGithubToken] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<NewApiKey | null>(null);

  const createApiKey = async () => {
    if (!newKeyName.trim()) return;

    try {
      const result = await createApiKeyMutation(newKeyName);
      setNewlyCreatedKey({ key: result.key, name: result.name });
      setNewKeyName('');
      setShowNewKeyForm(false);
    } catch (error) {
      console.error('Error creating API key:', error);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!confirm(t('apiKeys.confirmDelete'))) return;

    try {
      await deleteApiKeyMutation(keyId);
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const toggleApiKey = async (keyId: string, isActive: boolean) => {
    try {
      await toggleApiKeyMutation(keyId, !isActive);
    } catch (error) {
      console.error('Error toggling API key:', error);
    }
  };

  const createGithubToken = async () => {
    if (!newTokenName.trim() || !newGithubToken.trim()) return;

    try {
      await createCredentialMutation({
        type: 'github_token',
        name: newTokenName,
        value: newGithubToken,
      });
      setNewTokenName('');
      setNewGithubToken('');
      setShowNewTokenForm(false);
    } catch (error) {
      console.error('Error creating GitHub token:', error);
    }
  };

  const deleteGithubToken = async (tokenId: string) => {
    if (!confirm(t('apiKeys.github.confirmDelete'))) return;

    try {
      await deleteCredentialMutation(tokenId);
    } catch (error) {
      console.error('Error deleting GitHub token:', error);
    }
  };

  const toggleGithubToken = async (tokenId: string, isActive: boolean) => {
    try {
      await toggleCredentialMutation(tokenId, !isActive);
    } catch (error) {
      console.error('Error toggling GitHub token:', error);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const loading = apiKeysLoading || githubLoading;

  if (loading) {
    return <div className="text-muted-foreground">{t('apiKeys.loading')}</div>;
  }

  return (
    <div className="space-y-8">
      {/* New API Key Alert */}
      {newlyCreatedKey && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <h4 className="font-semibold text-yellow-500 mb-2">{t('apiKeys.newKey.alertTitle')}</h4>
          <p className="text-sm text-muted-foreground mb-3">
            {t('apiKeys.newKey.alertMessage')}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-background/50 rounded font-mono text-sm break-all">
              {newlyCreatedKey.key}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(newlyCreatedKey.key, 'new')}
            >
              {copiedKey === 'new' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="mt-3"
            onClick={() => setNewlyCreatedKey(null)}
          >
            {t('apiKeys.newKey.iveSavedIt')}
          </Button>
        </div>
      )}

      {/* API Keys Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <h3 className="text-lg font-semibold">{t('apiKeys.title')}</h3>
          </div>
          <Button
            size="sm"
            onClick={() => setShowNewKeyForm(!showNewKeyForm)}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('apiKeys.newButton')}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {t('apiKeys.description')}
        </p>

        {showNewKeyForm && (
          <div className="mb-4 p-4 border rounded-lg bg-card">
            <Input
              placeholder={t('apiKeys.form.placeholder')}
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="mb-2"
            />
            <div className="flex gap-2">
              <Button onClick={createApiKey}>{t('apiKeys.form.createButton')}</Button>
              <Button variant="outline" onClick={() => setShowNewKeyForm(false)}>
                {t('apiKeys.form.cancelButton')}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {apiKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">{t('apiKeys.empty')}</p>
          ) : (
            apiKeys.map((key) => (
              <div
                key={key._id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">{key.name}</div>
                  <code className="text-xs text-muted-foreground">{key.key}</code>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('apiKeys.list.created')} {new Date(key.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={key.isActive ? 'outline' : 'secondary'}
                    onClick={() => toggleApiKey(key._id, key.isActive)}
                  >
                    {key.isActive ? t('apiKeys.status.active') : t('apiKeys.status.inactive')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteApiKey(key._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* GitHub Tokens Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            <h3 className="text-lg font-semibold">{t('apiKeys.github.title')}</h3>
          </div>
          <Button
            size="sm"
            onClick={() => setShowNewTokenForm(!showNewTokenForm)}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('apiKeys.github.addButton')}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {t('apiKeys.github.description')}
        </p>

        {showNewTokenForm && (
          <div className="mb-4 p-4 border rounded-lg bg-card">
            <Input
              placeholder={t('apiKeys.github.form.namePlaceholder')}
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              className="mb-2"
            />
            <Input
              type="password"
              placeholder={t('apiKeys.github.form.tokenPlaceholder')}
              value={newGithubToken}
              onChange={(e) => setNewGithubToken(e.target.value)}
              className="mb-2"
            />
            <div className="flex gap-2">
              <Button onClick={createGithubToken}>{t('apiKeys.github.form.addButton')}</Button>
              <Button variant="outline" onClick={() => {
                setShowNewTokenForm(false);
                setNewTokenName('');
                setNewGithubToken('');
              }}>
                {t('apiKeys.github.form.cancelButton')}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {githubTokens.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">{t('apiKeys.github.empty')}</p>
          ) : (
            githubTokens.map((token) => (
              <div
                key={token._id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">{token.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('apiKeys.github.added')} {new Date(token.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={token.isActive ? 'outline' : 'secondary'}
                    onClick={() => toggleGithubToken(token._id, token.isActive)}
                  >
                    {token.isActive ? t('apiKeys.status.active') : t('apiKeys.status.inactive')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteGithubToken(token._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Documentation Link */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <h4 className="font-semibold mb-2">{t('apiKeys.documentation.title')}</h4>
        <p className="text-sm text-muted-foreground mb-3">
          {t('apiKeys.documentation.description')}
        </p>
        <a
          href="/EXTERNAL_API.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          {t('apiKeys.documentation.viewLink')}
        </a>
      </div>
    </div>
  );
}

export default ApiKeysSettings;
