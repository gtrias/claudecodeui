import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { LogIn } from 'lucide-react';
import ClaudeLogo from '../ClaudeLogo';
import CursorLogo from '../CursorLogo';
import CodexLogo from '../CodexLogo';
import PiLogo from '../PiLogo';
import { useTranslation } from 'react-i18next';

type AgentId = 'claude' | 'cursor' | 'codex' | 'pi';

interface AgentStyleConfig {
  name: string;
  description: string;
  Logo: React.ComponentType<{ className?: string }>;
  bgClass: string;
  borderClass: string;
  textClass: string;
  subtextClass: string;
  buttonClass: string;
}

interface AuthStatus {
  authenticated?: boolean;
  loading?: boolean;
  email?: string;
  error?: string;
}

interface AccountContentProps {
  agent: AgentId;
  authStatus?: AuthStatus;
  onLogin: () => void;
}

const agentConfig: Record<AgentId, AgentStyleConfig> = {
  claude: {
    name: 'Claude',
    description: 'Anthropic Claude AI assistant',
    Logo: ClaudeLogo,
    bgClass: 'bg-accent/10 dark:bg-accent/20/20',
    borderClass: 'border-primary/30 dark:border-primary/30',
    textClass: 'text-primary dark:text-primary-foreground',
    subtextClass: 'text-primary dark:text-primary',
    buttonClass: 'bg-primary hover:bg-primary/90',
  },
  cursor: {
    name: 'Cursor',
    description: 'Cursor AI-powered code editor',
    Logo: CursorLogo,
    bgClass: 'bg-purple-50 dark:bg-purple-900/20',
    borderClass: 'border-purple-200 dark:border-purple-800',
    textClass: 'text-purple-900 dark:text-purple-100',
    subtextClass: 'text-purple-700 dark:text-purple-300',
    buttonClass: 'bg-purple-600 hover:bg-purple-700',
  },
  codex: {
    name: 'Codex',
    description: 'OpenAI Codex AI assistant',
    Logo: CodexLogo,
    bgClass: 'bg-gray-100 dark:bg-gray-800/50',
    borderClass: 'border-gray-300 dark:border-gray-600',
    textClass: 'text-gray-900 dark:text-gray-100',
    subtextClass: 'text-gray-700 dark:text-gray-300',
    buttonClass: 'bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600',
  },
  pi: {
    name: 'Pi',
    description: 'Pi coding agent',
    Logo: PiLogo,
    bgClass: 'bg-amber-50 dark:bg-amber-900/20',
    borderClass: 'border-amber-200 dark:border-amber-800',
    textClass: 'text-amber-900 dark:text-amber-100',
    subtextClass: 'text-amber-700 dark:text-amber-300',
    buttonClass: 'bg-amber-600 hover:bg-amber-700',
  },
};

const AccountContent: React.FC<AccountContentProps> = ({ agent, authStatus, onLogin }) => {
  const { t } = useTranslation('settings');
  const config = agentConfig[agent];
  const { Logo } = config;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Logo className="w-6 h-6" />
        <div>
          <h3 className="text-lg font-medium text-foreground">{config.name}</h3>
          <p className="text-sm text-muted-foreground">{t(`agents.account.${agent}.description`)}</p>
        </div>
      </div>

      <div className={`${config.bgClass} border ${config.borderClass} rounded-lg p-4`}>
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className={`font-medium ${config.textClass}`}>
                {t('agents.connectionStatus')}
              </div>
              <div className={`text-sm ${config.subtextClass}`}>
                {authStatus?.loading ? (
                  t('agents.authStatus.checkingAuth')
                ) : authStatus?.authenticated ? (
                  t('agents.authStatus.loggedInAs', { email: authStatus.email || t('agents.authStatus.authenticatedUser') })
                ) : (
                  t('agents.authStatus.notConnected')
                )}
              </div>
            </div>
            <div>
              {authStatus?.loading ? (
                <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800">
                  {t('agents.authStatus.checking')}
                </Badge>
              ) : authStatus?.authenticated ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  {t('agents.authStatus.connected')}
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                  {t('agents.authStatus.disconnected')}
                </Badge>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className={`font-medium ${config.textClass}`}>
                  {authStatus?.authenticated ? t('agents.login.reAuthenticate') : t('agents.login.title')}
                </div>
                <div className={`text-sm ${config.subtextClass}`}>
                  {authStatus?.authenticated
                    ? t('agents.login.reAuthDescription')
                    : t('agents.login.description', { agent: config.name })}
                </div>
              </div>
              <Button
                onClick={onLogin}
                className={`${config.buttonClass} text-white`}
                size="sm"
              >
                <LogIn className="w-4 h-4 mr-2" />
                {authStatus?.authenticated ? t('agents.login.reLoginButton') : t('agents.login.button')}
              </Button>
            </div>
          </div>

          {authStatus?.error && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="text-sm text-red-600 dark:text-red-400">
                {t('agents.error', { error: authStatus.error })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AccountContent;
