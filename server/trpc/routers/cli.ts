import { z } from 'zod';
import { spawn } from 'child_process';
import { router, publicProcedure } from '../index.js';

const AgentEnum = z.enum(['claude', 'cursor', 'codex', 'pi']);
type Agent = z.infer<typeof AgentEnum>;

interface CliStatus {
  authenticated: boolean;
  email: string | null;
  error: string | null;
  installed: boolean;
}

async function checkCliStatus(command: string): Promise<CliStatus> {
  return new Promise((resolve) => {
    try {
      const proc = spawn(command, ['--version'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 5000,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({
            installed: true,
            authenticated: true, // Simplified - CLI exists and runs
            email: null,
            error: null,
          });
        } else {
          resolve({
            installed: true,
            authenticated: false,
            email: null,
            error: stderr || `Exit code ${code}`,
          });
        }
      });

      proc.on('error', () => {
        resolve({
          installed: false,
          authenticated: false,
          email: null,
          error: `${command} CLI not found`,
        });
      });
    } catch (err) {
      resolve({
        installed: false,
        authenticated: false,
        email: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });
}

export const cliRouter = router({
  status: publicProcedure
    .input(z.object({ agent: AgentEnum }))
    .query(async ({ input }) => {
      return checkCliStatus(input.agent);
    }),
    
  statusAll: publicProcedure.query(async () => {
    const agents: Agent[] = ['claude', 'cursor', 'codex', 'pi'];
    const results = await Promise.all(
      agents.map(async (agent) => ({
        agent,
        status: await checkCliStatus(agent),
      }))
    );
    return Object.fromEntries(results.map((r) => [r.agent, r.status]));
  }),
});
