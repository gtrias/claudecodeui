# Page Component Dependency Trees

This file maps each page/view to its complete component dependency tree. Use this to determine which `--context-file` arguments to pass when designing a specific page.

---

## App Structure Overview

The app is a **single-page application** with one main route that renders different views based on:
1. URL path (`/` or `/session/:sessionId`)
2. Active tab (`chat`, `files`, `shell`, `git`, `tasks`)

---

## / (Home/Dashboard) + /session/:sessionId

**Entry**: `src/App.tsx`

### Core Dependencies (always loaded)
```
src/App.tsx
├── src/components/Sidebar.tsx
│   ├── src/components/ui/scroll-area.tsx
│   ├── src/components/ui/button.tsx
│   ├── src/components/ui/badge.tsx
│   ├── src/components/ui/input.tsx
│   ├── src/components/ClaudeLogo.tsx
│   ├── src/components/CursorLogo.tsx
│   ├── src/components/CodexLogo.tsx
│   ├── src/components/PiLogo.tsx
│   ├── src/components/TaskIndicator.tsx
│   ├── src/components/ProjectCreationWizard.tsx
│   └── src/lib/utils.ts
├── src/components/MainContent.tsx
│   ├── src/components/ChatInterface.tsx (when activeTab='chat')
│   ├── src/components/FileTree.tsx (when activeTab='files')
│   ├── src/components/CodeEditor.tsx (when activeTab='files')
│   ├── src/components/StandaloneShell.tsx (when activeTab='shell')
│   ├── src/components/GitPanel.tsx (when activeTab='git')
│   ├── src/components/TaskList.tsx (when activeTab='tasks')
│   ├── src/components/TaskDetail.tsx (when activeTab='tasks')
│   ├── src/components/PRDEditor.tsx
│   └── src/components/Tooltip.tsx
├── src/components/MobileNav.tsx (mobile only)
├── src/components/Settings.tsx (modal)
├── src/components/QuickSettingsPanel.tsx
└── src/components/RootErrorBoundary.tsx
```

---

## Chat Tab (activeTab='chat')

**Primary Component**: `src/components/ChatInterface.tsx`

```
src/components/ChatInterface.tsx (268KB - main chat UI)
├── src/components/chat/MessageList.tsx
│   ├── src/components/chat/MessageBubble.tsx
│   │   ├── src/components/chat/MessageMarkdown.tsx
│   │   ├── src/components/chat/CodeBlock.tsx
│   │   ├── src/components/chat/CodeActions.tsx
│   │   └── src/components/chat/ImageAttachment.tsx
│   ├── src/components/chat/ThinkingBlock.tsx
│   ├── src/components/chat/ToolUseDisplay.tsx
│   │   └── src/components/chat/DiffDisplay.tsx
│   └── src/components/chat/PermissionRequest.tsx
├── src/components/chat/ChatInputArea.tsx
├── src/components/chat/ChatToolbar.tsx
├── src/components/ThinkingModeSelector.tsx
├── src/components/MicButton.tsx
├── src/components/ClaudeStatus.tsx
├── src/components/NextTaskBanner.tsx
├── src/components/ImageViewer.tsx
├── src/components/DiffViewer.tsx
└── src/components/CommandMenu.tsx
```

**Required context files for Chat design**:
```
--context-file src/components/ChatInterface.tsx
--context-file src/components/chat/MessageList.tsx
--context-file src/components/chat/MessageBubble.tsx
--context-file src/components/chat/MessageMarkdown.tsx
--context-file src/components/chat/CodeBlock.tsx
--context-file src/components/chat/ChatInputArea.tsx
--context-file src/components/chat/ChatToolbar.tsx
--context-file src/components/chat/ThinkingBlock.tsx
--context-file src/components/chat/ToolUseDisplay.tsx
--context-file src/index.css
--context-file tailwind.config.js
```

---

## Files Tab (activeTab='files')

**Primary Components**: `src/components/FileTree.tsx` + `src/components/CodeEditor.tsx`

```
src/components/FileTree.tsx (16KB)
├── src/components/ui/scroll-area.tsx
└── src/lib/utils.ts

src/components/CodeEditor.tsx (31KB)
├── @uiw/react-codemirror (external)
├── @codemirror/lang-* (external)
└── src/lib/utils.ts
```

**Required context files for Files design**:
```
--context-file src/components/FileTree.tsx
--context-file src/components/CodeEditor.tsx
--context-file src/components/MainContent.tsx
--context-file src/index.css
--context-file tailwind.config.js
```

---

## Shell Tab (activeTab='shell')

**Primary Component**: `src/components/StandaloneShell.tsx`

```
src/components/StandaloneShell.tsx (3.6KB)
├── src/components/Shell.tsx (18KB)
│   ├── @xterm/xterm (external)
│   ├── @xterm/addon-fit (external)
│   └── @xterm/addon-webgl (external)
└── src/lib/utils.ts
```

**Required context files for Shell design**:
```
--context-file src/components/StandaloneShell.tsx
--context-file src/components/Shell.tsx
--context-file src/index.css
--context-file tailwind.config.js
```

---

## Git Tab (activeTab='git')

**Primary Component**: `src/components/GitPanel.tsx`

```
src/components/GitPanel.tsx (60KB)
├── src/components/ui/button.tsx
├── src/components/ui/badge.tsx
├── src/components/ui/scroll-area.tsx
├── src/components/DiffViewer.tsx
└── src/lib/utils.ts
```

**Required context files for Git design**:
```
--context-file src/components/GitPanel.tsx
--context-file src/components/DiffViewer.tsx
--context-file src/components/ui/button.tsx
--context-file src/components/ui/badge.tsx
--context-file src/index.css
--context-file tailwind.config.js
```

---

## Tasks Tab (activeTab='tasks')

**Primary Components**: `src/components/TaskList.tsx` + `src/components/TaskDetail.tsx`

```
src/components/TaskList.tsx (54KB)
├── src/components/TaskCard.tsx (8.7KB)
├── src/components/ui/button.tsx
├── src/components/ui/badge.tsx
├── src/components/ui/scroll-area.tsx
└── src/lib/utils.ts

src/components/TaskDetail.tsx (18KB)
├── src/components/ui/button.tsx
├── src/components/ui/badge.tsx
└── src/lib/utils.ts
```

**Required context files for Tasks design**:
```
--context-file src/components/TaskList.tsx
--context-file src/components/TaskDetail.tsx
--context-file src/components/TaskCard.tsx
--context-file src/components/CreateTaskModal.tsx
--context-file src/index.css
--context-file tailwind.config.js
```

---

## Settings Modal

**Primary Component**: `src/components/Settings.tsx`

```
src/components/Settings.tsx (82KB)
├── src/components/ApiKeysSettings.tsx (11KB)
├── src/components/CredentialsSettings.tsx (13KB)
├── src/components/GitSettings.tsx (4.3KB)
├── src/components/TasksSettings.tsx (6.4KB)
├── src/components/settings/*.tsx
├── src/components/ui/button.tsx
├── src/components/ui/input.tsx
└── src/lib/utils.ts
```

**Required context files for Settings design**:
```
--context-file src/components/Settings.tsx
--context-file src/components/ApiKeysSettings.tsx
--context-file src/components/CredentialsSettings.tsx
--context-file src/components/ui/button.tsx
--context-file src/components/ui/input.tsx
--context-file src/index.css
--context-file tailwind.config.js
```

---

## Sidebar

**Primary Component**: `src/components/Sidebar.tsx`

```
src/components/Sidebar.tsx (76KB)
├── src/components/ui/scroll-area.tsx
├── src/components/ui/button.tsx
├── src/components/ui/badge.tsx
├── src/components/ui/input.tsx
├── src/components/ClaudeLogo.tsx
├── src/components/CursorLogo.tsx
├── src/components/CodexLogo.tsx
├── src/components/PiLogo.tsx
├── src/components/TaskIndicator.tsx
├── src/components/ProjectCreationWizard.tsx (39KB)
└── src/lib/utils.ts
```

**Required context files for Sidebar design**:
```
--context-file src/components/Sidebar.tsx
--context-file src/components/ui/scroll-area.tsx
--context-file src/components/ui/button.tsx
--context-file src/components/ui/badge.tsx
--context-file src/components/ClaudeLogo.tsx
--context-file src/index.css
--context-file tailwind.config.js
```

---

## Onboarding Flow

**Primary Component**: `src/components/Onboarding.tsx`

```
src/components/Onboarding.tsx (24KB)
├── src/components/ui/button.tsx
├── src/components/ui/input.tsx
├── src/components/LanguageSelector.tsx
└── src/lib/utils.ts
```

---

## Global Files (Always Include)

For any design task, always include:
```
--context-file src/index.css
--context-file tailwind.config.js
--context-file src/lib/utils.ts
```

---

## File Size Reference

| Component | Size | Complexity |
|-----------|------|------------|
| ChatInterface.tsx | 268KB | Very High |
| Settings.tsx | 82KB | High |
| Sidebar.tsx | 76KB | High |
| GitPanel.tsx | 60KB | High |
| TaskList.tsx | 54KB | Medium |
| MainContent.tsx | 30KB | Medium |
| CodeEditor.tsx | 31KB | Medium |
| NextTaskBanner.tsx | 30KB | Medium |
| Shell.tsx | 18KB | Medium |
| FileTree.tsx | 16KB | Medium |
