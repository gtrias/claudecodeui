import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Key, Plus, Trash2, Eye, EyeOff, Copy, Check, Github, ExternalLink } from 'lucide-react';
import { version } from '../../package.json';
import { useTranslation } from 'react-i18next';
import { useApiKeys, useCredentials } from '../hooks/useSettings';

interface NewApiKey {
  key: string;
  name: string;
}

interface ShowTokenState {
  [key: string]: boolean;
}

const CredentialsSettings: React.FC = () => {
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
    credentials: githubCredentials,
    isLoading: githubLoading,
    createCredential: createCredentialMutation,
    deleteCredential: deleteCredentialMutation,
    toggleCredential: toggleCredentialMutation,
  } = useCredentials('github_token');

  // Local state
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [showNewGithubForm, setShowNewGithubForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newGithubName, setNewGithubName] = useState('');
  const [newGithubToken, setNewGithubToken] = useState('');
  const [newGithubDescription, setNewGithubDescription] = useState('');
  const [showToken, setShowToken] = useState<ShowTokenState>({});
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

  const createGithubCredential = async () => {
    if (!newGithubName.trim() || !newGithubToken.trim()) return;

    try {
      const credentialData: {
        type: string;
        name: string;
        value: string;
        description?: string;
      } = {
        type: 'github_token',
        name: newGithubName,
        value: newGithubToken,
      };
      if (newGithubDescription) {
        credentialData.description = newGithubDescription;
      }
      await createCredentialMutation(credentialData);
      setNewGithubName('');
      setNewGithubToken('');
      setNewGithubDescription('');
      setShowNewGithubForm(false);
    } catch (error) {
      console.error('Error creating GitHub credential:', error);
    }
  };

  const deleteGithubCredential = async (credentialId: string) => {
    if (!confirm(t('apiKeys.github.confirmDelete'))) return;

    try {
      await deleteCredentialMutation(credentialId);
    } catch (error) {
      console.error('Error deleting GitHub credential:', error);
    }
  };

  const toggleGithubCredential = async (credentialId: string, isActive: boolean) => {
    try {
      await toggleCredentialMutation(credentialId, !isActive);
    } catch (error) {
      console.error('Error toggling GitHub credential:', error);
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

        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">
            {t('apiKeys.description')}
          </p>
          <a
            href="/api-docs.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            {t('apiKeys.apiDocsLink')}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

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

      {/* GitHub Credentials Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            <h3 className="text-lg font-semibold">{t('apiKeys.github.title')}</h3>
          </div>
          <Button
            size="sm"
            onClick={() => setShowNewGithubForm(!showNewGithubForm)}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('apiKeys.github.addButton')}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {t('apiKeys.github.descriptionAlt')}
        </p>

        {showNewGithubForm && (
          <div className="mb-4 p-4 border rounded-lg bg-card space-y-3">
            <Input
              placeholder={t('apiKeys.github.form.namePlaceholder')}
              value={newGithubName}
              onChange={(e) => setNewGithubName(e.target.value)}
            />

            <div className="relative">
              <Input
                type={showToken['new'] ? 'text' : 'password'}
                placeholder={t('apiKeys.github.form.tokenPlaceholder')}
                value={newGithubToken}
                onChange={(e) => setNewGithubToken(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowToken({ ...showToken, new: !showToken['new'] })}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              >
                {showToken['new'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Input
              placeholder={t('apiKeys.github.form.descriptionPlaceholder')}
              value={newGithubDescription}
              onChange={(e) => setNewGithubDescription(e.target.value)}
            />

            <div className="flex gap-2">
              <Button onClick={createGithubCredential}>{t('apiKeys.github.form.addButton')}</Button>
              <Button variant="outline" onClick={() => {
                setShowNewGithubForm(false);
                setNewGithubName('');
                setNewGithubToken('');
                setNewGithubDescription('');
              }}>
                {t('apiKeys.github.form.cancelButton')}
              </Button>
            </div>

            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline block"
            >
              {t('apiKeys.github.form.howToCreate')}
            </a>
          </div>
        )}

        <div className="space-y-2">
          {githubCredentials.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">{t('apiKeys.github.empty')}</p>
          ) : (
            githubCredentials.map((credential) => (
              <div
                key={credential._id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">{credential.name}</div>
                  {credential.description && (
                    <div className="text-xs text-muted-foreground">{credential.description}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('apiKeys.github.added')} {new Date(credential.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={credential.isActive ? 'outline' : 'secondary'}
                    onClick={() => toggleGithubCredential(credential._id, credential.isActive)}
                  >
                    {credential.isActive ? t('apiKeys.status.active') : t('apiKeys.status.inactive')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteGithubCredential(credential._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Version Information */}
      <div className="pt-6 border-t border-border/50">
        <div className="text-xs italic text-muted-foreground/60 text-center">
          v{version}
        </div>
      </div>
    </div>
  );
}

export default CredentialsSettings;
