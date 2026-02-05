import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

let activePiProcesses = new Map(); // sessionId -> child process

function getDefaultPiTestScriptPath() {
  return path.join(os.homedir(), 'src', 'pi-mono', 'pi-test.sh');
}

async function resolvePiCommand() {
  const configured = process.env.PI_CLI_COMMAND?.trim();
  if (configured) {
    const [command, ...args] = configured.split(/\s+/);
    return { command, baseArgs: args };
  }

  // Default to installed binary if present
  return { command: 'pi', baseArgs: [] };
}

function extractTextFromContent(content) {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((part) => {
      if (!part) return '';
      if (typeof part === 'string') return part;
      if (part.type === 'text') return part.text || '';
      if (part.type === 'thinking') return ''; // don't surface by default
      return '';
    })
    .filter(Boolean)
    .join('');
}

function sendClaudeDelta(ws, sessionId, text) {
  if (!text) return;
  ws.send({
    type: 'claude-response',
    sessionId,
    data: {
      type: 'content_block_delta',
      delta: {
        type: 'text_delta',
        text
      }
    }
  });
}

function sendClaudeStop(ws, sessionId) {
  ws.send({
    type: 'claude-response',
    sessionId,
    data: { type: 'content_block_stop' }
  });
}

function sendToolEvent(ws, sessionId, payload) {
  ws.send({
    type: 'codex-response',
    sessionId,
    data: payload
  });
}

async function spawnPi(command, options = {}, ws) {
  return new Promise(async (resolve, reject) => {
    const { sessionId, projectPath, cwd, provider, model, thinking, noSession } = options;

    let capturedSessionId = sessionId || null;
    let processKey = capturedSessionId || Date.now().toString();
    let sentSessionCreated = false;

    const workingDir = cwd || projectPath || process.cwd();

    const { command: piCommand, baseArgs } = await resolvePiCommand();

    const args = [
      ...baseArgs,
      '--mode',
      'json',
      '-p'
    ];

    if (provider) {
      args.push('--provider', provider);
    }
    if (model) {
      args.push('--model', model);
    }
    if (thinking) {
      args.push('--thinking', thinking);
    }
    if (noSession) {
      args.push('--no-session');
    }
    if (sessionId) {
      args.push('--session', sessionId);
    }

    args.push(command);

    const startProcess = (cmd, cmdArgs) => spawn(cmd, cmdArgs, {
      cwd: workingDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env }
    });

    let piProcess = null;
    try {
      piProcess = startProcess(piCommand, args);
    } catch (error) {
      return reject(error);
    }

    activePiProcesses.set(processKey, piProcess);

    let stdoutBuffer = '';
    let stderrBuffer = '';

    const maybeFallbackToTestScript = async (error) => {
      if (piCommand !== 'pi') return false;
      if (error?.code !== 'ENOENT') return false;
      const testScript = getDefaultPiTestScriptPath();
      try {
        await fs.access(testScript);
      } catch {
        return false;
      }

      // Replace process with fallback script
      try {
        piProcess = startProcess(testScript, args);
        activePiProcesses.set(processKey, piProcess);
        attachHandlers();
        return true;
      } catch {
        return false;
      }
    };

    const onJsonLine = (obj) => {
      if (!obj || typeof obj !== 'object') return;

      // First line in --mode json is the session header
      if (obj.type === 'session' && obj.id) {
        if (!capturedSessionId) {
          capturedSessionId = obj.id;

          // Update process map key to use real sessionId so abort works.
          if (processKey !== capturedSessionId) {
            activePiProcesses.delete(processKey);
            activePiProcesses.set(capturedSessionId, piProcess);
            processKey = capturedSessionId;
          }

          if (ws.setSessionId && typeof ws.setSessionId === 'function') {
            ws.setSessionId(capturedSessionId);
          }
        }

        if (!sessionId && !sentSessionCreated) {
          sentSessionCreated = true;
          ws.send({
            type: 'session-created',
            sessionId: capturedSessionId,
            provider: 'pi',
            cwd: obj.cwd || workingDir
          });
        }

        return;
      }

      // Drop events until we have a sessionId for routing in the UI.
      if (!capturedSessionId) return;

      // Stream assistant output
      if (obj.type === 'message_update' && obj.message?.role === 'assistant' && obj.assistantMessageEvent) {
        const ev = obj.assistantMessageEvent;
        if (ev.type === 'text_delta' && typeof ev.delta === 'string') {
          sendClaudeDelta(ws, capturedSessionId, ev.delta);
        }
        return;
      }

      if (obj.type === 'message_end' && obj.message?.role === 'assistant') {
        // Ensure we flush whatever we got (some providers might not stream deltas)
        const text = extractTextFromContent(obj.message?.content);
        if (text) {
          sendClaudeDelta(ws, capturedSessionId, text);
        }
        sendClaudeStop(ws, capturedSessionId);
        return;
      }

      // Tool lifecycle -> reuse Codex "mcp_tool_call" rendering in the UI
      if (obj.type === 'tool_execution_start') {
        sendToolEvent(ws, capturedSessionId, {
          type: 'item',
          itemType: 'mcp_tool_call',
          server: 'pi',
          tool: obj.toolName,
          arguments: obj.args,
          status: 'started'
        });
        return;
      }

      if (obj.type === 'tool_execution_end') {
        const result = obj.result || null;
        const isError = Boolean(obj.isError);
        sendToolEvent(ws, capturedSessionId, {
          type: 'item',
          itemType: 'mcp_tool_call',
          server: 'pi',
          tool: obj.toolName,
          arguments: null,
          result,
          error: isError ? { message: 'Tool execution failed' } : null,
          status: isError ? 'failed' : 'completed'
        });
        return;
      }
    };

    const attachHandlers = () => {
      piProcess.stdout?.on('data', (data) => {
        stdoutBuffer += data.toString();
        const lines = stdoutBuffer.split('\n');
        stdoutBuffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const obj = JSON.parse(trimmed);
            onJsonLine(obj);
          } catch {
            // Ignore non-JSON lines in JSON mode
          }
        }
      });

      piProcess.stderr?.on('data', (data) => {
        const text = data.toString();
        stderrBuffer += text;
        // Route as an error message only once we have a session id.
        if (capturedSessionId) {
          ws.send({
            type: 'claude-error',
            sessionId: capturedSessionId,
            error: text
          });
        }
      });

      piProcess.on('close', (code) => {
        const finalSessionId = capturedSessionId || sessionId || processKey;
        activePiProcesses.delete(finalSessionId);

        ws.send({
          type: 'claude-complete',
          sessionId: finalSessionId,
          exitCode: code
        });

        if (code === 0) {
          resolve();
        } else {
          reject(new Error(stderrBuffer || `Pi exited with code ${code}`));
        }
      });

      piProcess.on('error', async (error) => {
        const fellBack = await maybeFallbackToTestScript(error);
        if (fellBack) return;

        const finalSessionId = capturedSessionId || sessionId || processKey;
        activePiProcesses.delete(finalSessionId);

        ws.send({
          type: 'claude-error',
          sessionId: finalSessionId,
          error: error.message
        });
        reject(error);
      });
    };

    attachHandlers();
  });
}

function abortPiSession(sessionId) {
  const proc = activePiProcesses.get(sessionId);
  if (proc) {
    proc.kill('SIGTERM');
    activePiProcesses.delete(sessionId);
    return true;
  }
  return false;
}

function isPiSessionActive(sessionId) {
  return activePiProcesses.has(sessionId);
}

function getActivePiSessions() {
  return Array.from(activePiProcesses.keys());
}

export { spawnPi, abortPiSession, isPiSessionActive, getActivePiSessions };

