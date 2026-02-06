import React, { useState, useEffect } from 'react';
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
  isActive: boolean;
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
      console.error('Error fetching settings:', error instanceof Error ? error.message : 'Unknown error');
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
      console.error('Error creating API key:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const deleteApiKey = async (keyId: string): Promise<void> => {
    if (!confirm(t('apiKeys.confirmDelete'))) return;

    try {
      await authenticatedFetch(`/api/settings/api-keys/${keyId}`, {
        method: 'DELETE'
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting API key:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const toggleApiKey = async (keyId: string, isActive: boolean): Promise<void> => {
    try {
      await authenticatedFetch(`/api/settings/api-keys/${keyId}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !isActive })
      });
      fetchData();
    } catch (error) {
      console.error('Error toggling API key:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const createGithubCredential = async (): Promise<void> => {
    if (!newGithubName.trim() || !newGithubToken.trim()) return;