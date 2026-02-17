import { trpc } from '../lib/trpc';

export type McpAgent = 'claude' | 'cursor' | 'codex';

export function useMcpServers(agent: McpAgent) {
  return trpc.mcp.list.useQuery(
    { agent },
    {
      staleTime: 10000,
      retry: 1,
    }
  );
}
