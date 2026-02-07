import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Check, GitBranch, User, Mail, LogIn, ExternalLink, Loader2 } from 'lucide-react';
import ClaudeLogo from './ClaudeLogo';
import CursorLogo from './CursorLogo';
import CodexLogo from './CodexLogo';
import PiLogo from './PiLogo';
import LoginModal from './LoginModal';
import { authenticatedFetch } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { IS_PLATFORM } from '../constants/config';

export interface AuthStatus {
  authenticated: boolean;
  email: string | null;
  loading: boolean;
  error: string | null;
}

export interface OnboardingProps {
  onComplete?: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [gitName, setGitName] = useState('');
  const [gitEmail, setGitEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [activeLoginProvider, setActiveLoginProvider] = useState<string | null>(null);
  const [selectedProject] = useState({ name: 'default', fullPath: IS_PLATFORM ? '/workspace' : '' });

  const [claudeAuthStatus, setClaudeAuthStatus] = useState<AuthStatus>({
    authenticated: false,
    email: null,
    loading: true,
    error: null
  });

  const [cursorAuthStatus, setCursorAuthStatus] = useState<AuthStatus>({
    authenticated: false,
    email: null,
    loading: true,
    error: null
  });

  const [codexAuthStatus, setCodexAuthStatus] = useState<AuthStatus>({
    authenticated: false,
    email: null,
    loading: true,
    error: null
  });

  const [piAuthStatus, setPiAuthStatus] = useState<AuthStatus>({
    authenticated: false,
    email: null,
    loading: true,
    error: null
  });

  const { user } = useAuth();

  const prevActiveLoginProviderRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    loadGitConfig();
  }, []);

  const loadGitConfig = async (): Promise<void> => {
    try {
      const response = await authenticatedFetch('/api/user/git-config');
      if (response.ok) {
        const data = await response.json();
        if (data.gitName) setGitName(data.gitName);
        if (data.gitEmail) setGitEmail(data.gitEmail);
      }
    } catch (error) {
      console.error('Error loading git config:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  useEffect(() => {
    const prevProvider = prevActiveLoginProviderRef.current;
    prevActiveLoginProviderRef.current = activeLoginProvider;

    const isInitialMount = prevProvider === undefined;
    const isModalClosing = prevProvider !== null && activeLoginProvider === null;

    if (isInitialMount || isModalClosing) {
      checkClaudeAuthStatus();
      checkCursorAuthStatus();