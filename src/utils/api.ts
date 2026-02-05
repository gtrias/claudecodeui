import { IS_PLATFORM } from "../constants/config";

// Type definitions
interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

interface AuthResponse<T = unknown> {
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<T>;
  text: () => Promise<string>;
}

interface AuthApi {
  status: () => Promise<AuthResponse>;
  login: (username: string, password: string) => Promise<AuthResponse>;
  register: (username: string, password: string) => Promise<AuthResponse>;
  user: () => Promise<AuthResponse>;
  logout: () => Promise<AuthResponse>;
}

interface ProjectsApi {
  get: () => Promise<AuthResponse>;
  sessions: (projectName: string, limit?: number, offset?: number) => Promise<AuthResponse>;
  sessionMessages: (projectName: string, sessionId: string, limit?: number | null, offset?: number, provider?: 'claude' | 'codex' | 'pi' | 'cursor') => Promise<AuthResponse>;
  rename: (projectName: string, displayName: string) => Promise<AuthResponse>;
  deleteSession: (projectName: string, sessionId: string) => Promise<AuthResponse>;
  deleteCodexSession: (sessionId: string) => Promise<AuthResponse>;
  deletePiSession: (sessionId: string) => Promise<AuthResponse>;
  deleteProject: (projectName: string, force?: boolean) => Promise<AuthResponse>;
  create: (path: string) => Promise<AuthResponse>;
  createWorkspace: (workspaceData: Record<string, unknown>) => Promise<AuthResponse>;
}

interface TaskmasterApi {
  projects: () => Promise<AuthResponse>;
  tasks: () => Promise<AuthResponse>;
  status: () => Promise<AuthResponse>;
  execute: (taskId: string, payload: Record<string, unknown>) => Promise<AuthResponse>;
}

interface McpApi {
  status: () => Promise<AuthResponse>;
  list: () => Promise<AuthResponse>;
  add: (config: Record<string, unknown>) => Promise<AuthResponse>;
  remove: (name: string) => Promise<AuthResponse>;
}

interface UserApi {
  profile: () => Promise<AuthResponse>;
  update: (data: Record<string, unknown>) => Promise<AuthResponse>;
  onboardingStatus: () => Promise<AuthResponse>;
}

interface Api {
  auth: AuthApi;
  projects: ProjectsApi;
  taskmaster: TaskmasterApi;
  mcp: McpApi;
  user: UserApi;
  get: (url: string, options?: RequestOptions) => Promise<AuthResponse>;
  post: (url: string, body?: Record<string, unknown>, options?: RequestOptions) => Promise<AuthResponse>;
  put: (url: string, body?: Record<string, unknown>, options?: RequestOptions) => Promise<AuthResponse>;
  delete: (url: string, options?: RequestOptions) => Promise<AuthResponse>;
}

// Utility function for authenticated API calls
export const authenticatedFetch = (url: string, options: RequestOptions = {}): Promise<AuthResponse> => {
  const token = localStorage.getItem('auth-token');

  const defaultHeaders: Record<string, string> = {};

  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  if (!IS_PLATFORM && token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });
};

// API endpoints
export const api: Api = {
  // Auth endpoints (no token required)
  auth: {
    status: (): Promise<AuthResponse> => fetch('/api/auth/status'),
    login: (username: string, password: string): Promise<AuthResponse> => fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),
    register: (username: string, password: string): Promise<AuthResponse> => fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),
    user: (): Promise<AuthResponse> => authenticatedFetch('/api/auth/user'),
    logout: (): Promise<AuthResponse> => authenticatedFetch('/api/auth/logout', { method: 'POST' }),
  },

  // Protected endpoints
  projects: {
    get: (): Promise<AuthResponse> => authenticatedFetch('/api/projects'),
    sessions: (projectName: string, limit: number = 5, offset: number = 0): Promise<AuthResponse> =>
      authenticatedFetch(`/api/projects/${projectName}/sessions?limit=${limit}&offset=${offset}`),
    sessionMessages: (projectName: string, sessionId: string, limit: number | null = null, offset: number = 0, provider: 'claude' | 'codex' | 'pi' | 'cursor' = 'claude'): Promise<AuthResponse> => {
      const params = new URLSearchParams();
      if (limit !== null) {
        params.append('limit', String(limit));
        params.append('offset', String(offset));
      }
      const queryString = params.toString();

      // Route to the correct endpoint based on provider
      let url: string;
      if (provider === 'codex') {
        url = `/api/codex/sessions/${sessionId}/messages${queryString ? `?${queryString}` : ''}`;
      } else if (provider === 'pi') {
        url = `/api/pi/sessions/${sessionId}/messages${queryString ? `?${queryString}` : ''}`;
      } else if (provider === 'cursor') {
        url = `/api/cursor/sessions/${sessionId}/messages${queryString ? `?${queryString}` : ''}`;
      } else {
        url = `/api/projects/${projectName}/sessions/${sessionId}/messages${queryString ? `?${queryString}` : ''}`;
      }
      return authenticatedFetch(url);
    },
    rename: (projectName: string, displayName: string): Promise<AuthResponse> =>
      authenticatedFetch(`/api/projects/${projectName}/rename`, {
        method: 'PUT',
        body: JSON.stringify({ displayName }),
      }),
    deleteSession: (projectName: string, sessionId: string): Promise<AuthResponse> =>
      authenticatedFetch(`/api/projects/${projectName}/sessions/${sessionId}`, {
        method: 'DELETE',
      }),
    deleteCodexSession: (sessionId: string): Promise<AuthResponse> =>
      authenticatedFetch(`/api/codex/sessions/${sessionId}`, {
        method: 'DELETE',
      }),
    deletePiSession: (sessionId: string): Promise<AuthResponse> =>
      authenticatedFetch(`/api/pi/sessions/${sessionId}`, {
        method: 'DELETE',
      }),
    deleteProject: (projectName: string, force: boolean = false): Promise<AuthResponse> =>
      authenticatedFetch(`/api/projects/${projectName}${force ? '?force=true' : ''}`, {
        method: 'DELETE',
      }),
    create: (path: string): Promise<AuthResponse> =>
      authenticatedFetch('/api/projects/create', {
        method: 'POST',
        body: JSON.stringify({ path }),
      }),
    createWorkspace: (workspaceData: Record<string, unknown>): Promise<AuthResponse> =>
      authenticatedFetch('/api/projects/create-workspace', {
        method: 'POST',