import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Server, Plus, Edit3, Trash2, Terminal, Globe, Zap, X, LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type TransportType = 'stdio' | 'sse' | 'http';
type ServerScope = 'local' | 'user' | 'global';
type AgentType = 'claude' | 'cursor' | 'codex';

interface ServerConfig {
  command?: string;
  url?: string;
  args?: string[];
  env?: Record<string, string>;
}

interface Tool {
  name: string;
  description?: string;
}

interface TestResult {
  success: boolean;
  message: string;
}

interface ServerTools {
  tools: Tool[];
}

interface McpServer {
  id?: string;
  name: string;
  type?: TransportType;
  scope?: ServerScope;
  config?: ServerConfig;
}

interface ClaudeMcpServersProps {
  servers: McpServer[];
  onAdd: () => void;
  onEdit: (server: McpServer) => void;
  onDelete: (id: string, scope: ServerScope) => void;
  onTest?: (server: McpServer) => void;
  onDiscoverTools?: (server: McpServer) => void;
  testResults?: Record<string, TestResult>;
  serverTools?: Record<string, ServerTools>;
  toolsLoading?: boolean;
}

interface CursorMcpServersProps {
  servers: McpServer[];
  onAdd: () => void;
  onEdit: (server: McpServer) => void;
  onDelete: (name: string) => void;
}

interface CodexMcpServersProps {
  servers: McpServer[];
  onAdd: () => void;
  onEdit: (server: McpServer) => void;
  onDelete: (name: string) => void;
}

interface McpServersContentProps {
  agent: AgentType;
  servers: McpServer[];
  onAdd: () => void;
  onEdit: (server: McpServer) => void;
  onDelete: (id: string, scope?: ServerScope) => void;
  onTest?: (server: McpServer) => void;
  onDiscoverTools?: (server: McpServer) => void;
  testResults?: Record<string, TestResult>;
  serverTools?: Record<string, ServerTools>;
  toolsLoading?: boolean;
}

const getTransportIcon = (type?: TransportType): JSX.Element => {
  switch (type) {
    case 'stdio': return <Terminal className="w-4 h-4" />;
    case 'sse': return <Zap className="w-4 h-4" />;
    case 'http': return <Globe className="w-4 h-4" />;
    default: return <Server className="w-4 h-4" />;
  }
};

// Claude MCP Servers
const ClaudeMcpServers: React.FC<ClaudeMcpServersProps> = ({
  servers,
  onAdd,
  onEdit,
  onDelete,
  onTest,
  onDiscoverTools,
  testResults,
  serverTools,
  toolsLoading,
}) => {
  const { t } = useTranslation('settings');
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Server className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-medium text-foreground">
          {t('mcpServers.title')}
        </h3>
      </div>
      <p className="text-sm text-muted-foreground">
        {t('mcpServers.description.claude')}
      </p>

      <div className="flex justify-between items-center">
        <Button
          onClick={onAdd}
          className="bg-purple-600 hover:bg-purple-700 text-white"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('mcpServers.addButton')}
        </Button>
      </div>

      <div className="space-y-2">
        {servers.map(server => (
          <div key={server.id} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getTransportIcon(server.type)}
                  <span className="font-medium text-foreground">{server.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {server.type}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {server.scope === 'local' ? t('mcpServers.scope.local') : server.scope === 'user' ? t('mcpServers.scope.user') : server.scope}
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground space-y-1">
                  {server.type === 'stdio' && server.config?.command && (
                    <div>{t('mcpServers.config.command')}: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">{server.config.command}</code></div>
                  )}
                  {(server.type === 'sse' || server.type === 'http') && server.config?.url && (
                    <div>{t('mcpServers.config.url')}: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">{server.config.url}</code></div>
                  )}
                  {server.config?.args && server.config.args.length > 0 && (
                    <div>{t('mcpServers.config.args')}: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">{server.config.args.join(' ')}</code></div>
                  )}
                </div>

                {/* Test Results */}
                {testResults?.[server.id!] && (
                  <div className={`mt-2 p-2 rounded text-xs ${
                    testResults[server.id!].success
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                  }`}>
                    <div className="font-medium">{testResults[server.id!].message}</div>
                  </div>
                )}

                {/* Tools Discovery Results */}
                {serverTools?.[server.id!] && serverTools[server.id!].tools?.length > 0 && (
                  <div className="mt-2 p-2 rounded text-xs bg-accent/10 dark:bg-accent/20/20 text-primary dark:text-primary">
                    <div className="font-medium">{t('mcpServers.tools.title')} {t('mcpServers.tools.count', { count: serverTools[server.id!].tools.length })}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {serverTools[server.id!].tools.slice(0, 5).map((tool, i) => (
                        <code key={i} className="bg-accent/20 dark:bg-accent/20 px-1 rounded">{tool.name}</code>
                      ))}
                      {serverTools[server.id!].tools.length > 5 && (
                        <span className="text-xs opacity-75">{t('mcpServers.tools.more', { count: serverTools[server.id!].tools.length - 5 })}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  onClick={() => onEdit(server)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-700"
                  title={t('mcpServers.actions.edit')}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => onDelete(server.id!, server.scope!)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  title={t('mcpServers.actions.delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {servers.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t('mcpServers.empty')}
          </div>
        )}
      </div>
    </div>
  );
};

// Cursor MCP Servers
const CursorMcpServers: React.FC<CursorMcpServersProps> = ({ servers, onAdd, onEdit, onDelete }) => {
  const { t } = useTranslation('settings');
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Server className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-medium text-foreground">
          {t('mcpServers.title')}
        </h3>
      </div>
      <p className="text-sm text-muted-foreground">
        {t('mcpServers.description.cursor')}
      </p>

      <div className="flex justify-between items-center">
        <Button
          onClick={onAdd}
          className="bg-purple-600 hover:bg-purple-700 text-white"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('mcpServers.addButton')}
        </Button>
      </div>

      <div className="space-y-2">
        {servers.map(server => (
          <div key={server.name || server.id} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Terminal className="w-4 h-4" />
                  <span className="font-medium text-foreground">{server.name}</span>
                  <Badge variant="outline" className="text-xs">stdio</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {server.config?.command && (
                    <div>{t('mcpServers.config.command')}: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">{server.config.command}</code></div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  onClick={() => onEdit(server)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-700"
                  title={t('mcpServers.actions.edit')}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => onDelete(server.name)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  title={t('mcpServers.actions.delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {servers.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t('mcpServers.empty')}
          </div>
        )}
      </div>
    </div>
  );
};

// Codex MCP Servers
const CodexMcpServers: React.FC<CodexMcpServersProps> = ({ servers, onAdd, onEdit, onDelete }) => {
  const { t } = useTranslation('settings');
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Server className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        <h3 className="text-lg font-medium text-foreground">
          {t('mcpServers.title')}
        </h3>
      </div>
      <p className="text-sm text-muted-foreground">
        {t('mcpServers.description.codex')}
      </p>

      <div className="flex justify-between items-center">
        <Button
          onClick={onAdd}
          className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('mcpServers.addButton')}
        </Button>
      </div>

      <div className="space-y-2">
        {servers.map(server => (
          <div key={server.name} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Terminal className="w-4 h-4" />
                  <span className="font-medium text-foreground">{server.name}</span>
                  <Badge variant="outline" className="text-xs">stdio</Badge>
                </div>

                <div className="text-sm text-muted-foreground space-y-1">
                  {server.config?.command && (
                    <div>{t('mcpServers.config.command')}: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">{server.config.command}</code></div>
                  )}
                  {server.config?.args && server.config.args.length > 0 && (
                    <div>{t('mcpServers.config.args')}: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">{server.config.args.join(' ')}</code></div>
                  )}
                  {server.config?.env && Object.keys(server.config.env).length > 0 && (
                    <div>{t('mcpServers.config.environment')}: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">{Object.entries(server.config.env).map(([k, v]) => `${k}=${v}`).join(', ')}</code></div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  onClick={() => onEdit(server)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-700"
                  title={t('mcpServers.actions.edit')}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => onDelete(server.name)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  title={t('mcpServers.actions.delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {servers.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t('mcpServers.empty')}
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{t('mcpServers.help.title')}</h4>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {t('mcpServers.help.description')}
        </p>
      </div>
    </div>
  );
};

// Main component
const McpServersContent: React.FC<McpServersContentProps> = ({ agent, ...props }) => {
  if (agent === 'claude') {
    return <ClaudeMcpServers {...props} />;
  }
  if (agent === 'cursor') {
    return <CursorMcpServers servers={props.servers} onAdd={props.onAdd} onEdit={props.onEdit} onDelete={props.onDelete} />;
  }
  if (agent === 'codex') {
    return <CodexMcpServers servers={props.servers} onAdd={props.onAdd} onEdit={props.onEdit} onDelete={props.onDelete} />;
  }
  return null;
};

export default McpServersContent;
