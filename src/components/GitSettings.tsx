import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { GitBranch, Check } from 'lucide-react';
import { authenticatedFetch } from '../utils/api';
import { useTranslation } from 'react-i18next';

export interface GitSettingsProps {}

const GitSettings: React.FC<GitSettingsProps> = () => {
  const { t } = useTranslation('settings');
  const [gitName, setGitName] = useState('');
  const [gitEmail, setGitEmail] = useState('');
  const [gitConfigLoading, setGitConfigLoading] = useState(false);
  const [gitConfigSaving, setGitConfigSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    loadGitConfig();
  }, []);

  const loadGitConfig = async () => {
    try {
      setGitConfigLoading(true);
      const response = await authenticatedFetch('/api/user/git-config');
      if (response.ok) {
        const data = await response.json();
        setGitName(data.gitName || '');
        setGitEmail(data.gitEmail || '');
      }
    } catch (error) {
      console.error('Error loading git config:', error);
    } finally {
      setGitConfigLoading(false);
    }
  };

  const saveGitConfig = async () => {
    try {
      setGitConfigSaving(true);
      const response = await authenticatedFetch('/api/user/git-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gitName, gitEmail })
      });

      if (response.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        const data = await response.json();
        setSaveStatus('error');