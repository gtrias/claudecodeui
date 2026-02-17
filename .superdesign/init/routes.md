# Routes & Navigation

This file documents the routing structure of the Claude Code UI application.

## Routing Framework

- **Router**: React Router v6 (`react-router-dom`)
- **Type**: Client-side SPA routing
- **Base Path**: Configurable via `window.__ROUTER_BASENAME__`

---

## Route Configuration (`src/App.tsx`)

```tsx
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';

function App() {
  return (
    <Router basename={window.__ROUTER_BASENAME__ || ''}>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/session/:sessionId" element={<AppContent />} />
      </Routes>
    </Router>
  );
}
```

---

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `AppContent` | Home/Dashboard - shows selected project or welcome screen |
| `/session/:sessionId` | `AppContent` | View specific chat session |

---

## Navigation Patterns

### Session Selection
```tsx
const navigate = useNavigate();

// Navigate to specific session
const handleSessionSelect = (session) => {
  navigate(`/session/${session.id}`);
};

// Return to home
const handleProjectSelect = (project) => {
  navigate('/');
};
```

### URL Parameter Access
```tsx
const { sessionId } = useParams<{ sessionId: string }>();

// Load session from URL
useEffect(() => {
  if (sessionId && projects.length > 0) {
    // Find and select the session
    for (const project of projects) {
      const session = project.sessions?.find(s => s.id === sessionId);
      if (session) {
        setSelectedProject(project);
        setSelectedSession(session);
        return;
      }
    }
  }
}, [sessionId, projects]);
```

---

## Tab Navigation (In-App)

The app uses internal tab navigation, not routes, for different views:

```tsx
type TabType = 'chat' | 'files' | 'shell' | 'git' | 'tasks' | 'preview';

const [activeTab, setActiveTab] = useState<TabType>('chat');
```

### Tab Views

| Tab | Component | Description |
|-----|-----------|-------------|
| `chat` | `ChatInterface` | AI chat conversation |
| `files` | `FileTree` + `CodeEditor` | File browser and editor |
| `shell` | `StandaloneShell` | Terminal emulator |
| `git` | `GitPanel` | Git status, diff, history |
| `tasks` | `TaskList` + `TaskDetail` | Task management (optional) |
| `preview` | - | Web preview (future) |

---

## Provider Context

Routes are wrapped in several context providers:

```tsx
<RootErrorBoundary>
  <I18nextProvider i18n={i18n}>
    <ThemeProvider>
      <AuthProvider>
        <WebSocketProvider>
          <TasksSettingsProvider>
            <TaskMasterProvider>
              <ProtectedRoute>
                <Router>
                  <Routes>...</Routes>
                </Router>
              </ProtectedRoute>
            </TaskMasterProvider>
          </TasksSettingsProvider>
        </WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  </I18nextProvider>
</RootErrorBoundary>
```

---

## Context Files

| Context | File | Purpose |
|---------|------|---------|
| `ThemeProvider` | `src/contexts/ThemeContext.tsx` | Dark/light mode |
| `AuthProvider` | `src/contexts/AuthContext.tsx` | Authentication state |
| `WebSocketProvider` | `src/contexts/WebSocketContext.tsx` | Real-time updates |
| `TasksSettingsProvider` | `src/contexts/TasksSettingsContext.tsx` | Task settings |
| `TaskMasterProvider` | `src/contexts/TaskMasterContext.tsx` | Task management |

---

## Protected Routes

The `ProtectedRoute` component handles authentication:

```tsx
// src/components/ProtectedRoute.tsx
<ProtectedRoute>
  {/* Only renders children if authenticated */}
  <Router>...</Router>
</ProtectedRoute>
```

---

## Deep Linking

Sessions can be directly linked:
- `https://app.cloudcli.ai/session/abc123` - Opens specific session
- Sessions are identified by their unique `id` (UUID format)
