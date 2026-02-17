import { trpc } from '../lib/trpc';

export type Agent = 'claude' | 'cursor' | 'codex' | 'pi';

export function useCliStatus(agent: Agent) {
  return trpc.cli.status.useQuery(
    { agent },
    {
      staleTime: 30000, // Cache for 30 seconds
      retry: 1,
    }
  );
}

export function useAllCliStatus() {
  return trpc.cli.statusAll.useQuery(undefined, {
    staleTime: 30000,
    retry: 1,
  });
}
