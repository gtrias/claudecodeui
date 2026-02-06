import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Key, Plus, Trash2, Eye, EyeOff, Copy, Check, Github } from 'lucide-react';
import { authenticatedFetch } from '../utils/api';
import { useTranslation } from 'react-i18next';

export interface ApiKey {
  id: string;
  name: string;
  created_at?: string;
}

export interface GithubToken {
  id: string;
  name: string;
  is_active: boolean;
  created_at?: string;
}

const ApiKeysSettings: React.FC = () => {
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