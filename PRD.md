# Product Requirements Document: TypeScript Migration

## Project Overview
Complete TypeScript migration for Claude Code UI project to achieve 100% type safety and improved maintainability.

## Current Status
- **Progress**: 81% complete (63/78 files)
- **Remaining**: 15 JSX files to convert
- **Build Status**: All passing

## Enhancement: ENH-001 - Complete TypeScript Migration

### Phase 1: Settings Components

### US-001: Convert McpServersContent to TypeScript
**Description:** As a developer, I want McpServersContent.jsx converted to TypeScript so that MCP server configuration has type safety.

**Acceptance Criteria:**
- [x] Read `src/components/settings/McpServersContent.jsx`
- [x] Create comprehensive interfaces for MCP server types
- [x] Convert to TypeScript with proper typing
- [x] Write as `src/components/settings/McpServersContent.tsx`
- [x] Build succeeds with no errors
- [x] Delete old JSX file

**Test Steps (Build Verification):**
```json
[
  {"step": 1, "action": "build", "command": "npm run build", "expected": "success"},
  {"step": 2, "action": "verify", "target": "src/components/settings/McpServersContent.tsx", "expected": "file_exists"},
  {"step": 3, "action": "verify", "target": "src/components/settings/McpServersContent.jsx", "expected": "file_not_exists"}
]
```

### US-002: Convert QuickSettingsPanel to TypeScript
**Description:** As a developer, I want QuickSettingsPanel.jsx converted to TypeScript so that the quick settings panel has proper type safety.

**Acceptance Criteria:**
- [ ] Read `src/components/QuickSettingsPanel.jsx`
- [ ] Create interfaces for all props and state
- [ ] Handle draggable position types properly
- [ ] Convert to TypeScript
- [ ] Write as `src/components/QuickSettingsPanel.tsx`
- [ ] Build succeeds
- [x] Delete old JSX file

**Test Steps (Build Verification):**
```json
[
  {"step": 1, "action": "build", "command": "npm run build", "expected": "success"},
  {"step": 2, "action": "verify", "target": "src/components/QuickSettingsPanel.tsx", "expected": "file_exists"}
]
```

### US-003: Convert PermissionsContent to TypeScript
**Description:** As a developer, I want PermissionsContent.jsx converted to TypeScript so that permissions management has type safety.

**Acceptance Criteria:**
- [ ] Read `src/components/settings/PermissionsContent.jsx`
- [ ] Create permission types and interfaces
- [ ] Convert to TypeScript
- [ ] Write as `src/components/settings/PermissionsContent.tsx`
- [ ] Build succeeds
- [x] Delete old JSX file

**Test Steps (Build Verification):**
```json
[
  {"step": 1, "action": "build", "command": "npm run build", "expected": "success"}
]
```

### Phase 2: Medium Complexity Components

### US-004: Convert FileTree to TypeScript
**Description:** As a developer, I want FileTree.jsx converted to TypeScript so that file tree navigation has proper type safety.

**Acceptance Criteria:**
- [ ] Read `src/components/FileTree.jsx`
- [ ] Create interfaces for file/folder tree structures
- [ ] Handle recursive types properly
- [ ] Convert to TypeScript
- [ ] Write as `src/components/FileTree.tsx`
- [ ] Build succeeds
- [x] Delete old JSX file

**Test Steps (Build Verification):**
```json
[
  {"step": 1, "action": "build", "command": "npm run build", "expected": "success"}
]
```

### US-005: Convert TaskMasterSetupWizard to TypeScript
**Description:** As a developer, I want TaskMasterSetupWizard.jsx converted to TypeScript so that the setup wizard has type safety.

**Acceptance Criteria:**
- [ ] Read `src/components/TaskMasterSetupWizard.jsx`
- [ ] Create wizard step types and interfaces
- [ ] Convert to TypeScript
- [ ] Write as `src/components/TaskMasterSetupWizard.tsx`
- [ ] Build succeeds
- [x] Delete old JSX file

**Test Steps (Build Verification):**
```json
[
  {"step": 1, "action": "build", "command": "npm run build", "expected": "success"}
]
```

### US-006: Convert Onboarding to TypeScript
**Description:** As a developer, I want Onboarding.jsx converted to TypeScript so that the onboarding flow has type safety.

**Acceptance Criteria:**
- [ ] Read `src/components/Onboarding.jsx`
- [ ] Create onboarding step types
- [ ] Convert to TypeScript
- [ ] Write as `src/components/Onboarding.tsx`
- [ ] Build succeeds
- [x] Delete old JSX file

**Test Steps (Build Verification):**
```json
[
  {"step": 1, "action": "build", "command": "npm run build", "expected": "success"}
]
```

### US-007: Convert MainContent to TypeScript
**Description:** As a developer, I want MainContent.jsx converted to TypeScript so that the main content area has type safety.

**Acceptance Criteria:**
- [ ] Read `src/components/MainContent.jsx`
- [ ] Create tab management types
- [ ] Convert to TypeScript
- [ ] Write as `src/components/MainContent.tsx`
- [ ] Build succeeds
- [x] Delete old JSX file

**Test Steps (Build Verification):**
```json
[
  {"step": 1, "action": "build", "command": "npm run build", "expected": "success"}
]
```

### US-008: Convert PRDEditor to TypeScript
**Description:** As a developer, I want PRDEditor.jsx converted to TypeScript so that the PRD editor has type safety.

**Acceptance Criteria:**
- [ ] Read `src/components/PRDEditor.jsx`
- [ ] Create editor state types
- [ ] Handle CodeMirror types if present
- [ ] Convert to TypeScript
- [ ] Write as `src/components/PRDEditor.tsx`
- [ ] Build succeeds
- [x] Delete old JSX file

**Test Steps (Build Verification):**
```json
[
  {"step": 1, "action": "build", "command": "npm run build", "expected": "success"}
]
```

### US-009: Convert ProjectCreationWizard to TypeScript
**Description:** As a developer, I want ProjectCreationWizard.jsx converted to TypeScript so that project creation has type safety.

**Acceptance Criteria:**
- [ ] Read `src/components/ProjectCreationWizard.jsx`
- [ ] Create wizard form types
- [ ] Convert to TypeScript
- [ ] Write as `src/components/ProjectCreationWizard.tsx`
- [ ] Build succeeds
- [x] Delete old JSX file

**Test Steps (Build Verification):**
```json
[
  {"step": 1, "action": "build", "command": "npm run build", "expected": "success"}
]
```

### Phase 3: Complex Components

### US-010: Convert Shell to TypeScript
**Description:** As a developer, I want Shell.jsx converted to TypeScript so that the terminal emulator has type safety.

**Acceptance Criteria:**
- [ ] Read `src/components/Shell.jsx`
- [ ] Add XTerm.js type definitions
- [ ] Create terminal state types
- [ ] Convert to TypeScript
- [ ] Write as `src/components/Shell.tsx`
- [ ] Build succeeds
- [x] Delete old JSX file

**Test Steps (Build Verification):**
```json
[
  {"step": 1, "action": "build", "command": "npm run build", "expected": "success"}
]
```

### US-011: Convert CodeEditor to TypeScript
**Description:** As a developer, I want CodeEditor.jsx converted to TypeScript so that the code editor has type safety.

**Acceptance Criteria:**
- [ ] Read `src/components/CodeEditor.jsx`
- [ ] Add CodeMirror type definitions
- [ ] Create editor configuration types
- [ ] Convert to TypeScript
- [ ] Write as `src/components/CodeEditor.tsx`
- [ ] Build succeeds
- [x] Delete old JSX file

**Test Steps (Build Verification):**
```json
[
  {"step": 1, "action": "build", "command": "npm run build", "expected": "success"}
]
```

### US-012: Convert GitPanel to TypeScript  
**Description:** As a developer, I want GitPanel.jsx converted to TypeScript so that Git operations have type safety.

**Acceptance Criteria:**
- [ ] Read `src/components/GitPanel.jsx`
- [ ] Create Git operation types
- [ ] Create commit/branch interfaces
- [ ] Convert to TypeScript
- [ ] Write as `src/components/GitPanel.tsx`
- [ ] Build succeeds
- [x] Delete old JSX file

**Test Steps (Build Verification):**
```json
[
  {"step": 1, "action": "build", "command": "npm run build", "expected": "success"}
]
```

### US-013: Convert App to TypeScript
**Description:** As a developer, I want App.jsx converted to TypeScript so that the main application has type safety.

**Acceptance Criteria:**
- [ ] Read `src/App.jsx`
- [ ] Create route types and context provider types
- [ ] Convert to TypeScript
- [ ] Write as `src/App.tsx`
- [ ] Build succeeds
- [x] Delete old JSX file

**Test Steps (Build Verification):**
```json
[
  {"step": 1, "action": "build", "command": "npm run build", "expected": "success"}
]
```

### Phase 4: Large Complex Components

### US-014: Convert TaskList to TypeScript
**Description:** As a developer, I want TaskList.jsx converted to TypeScript so that task management has type safety.

**Acceptance Criteria:**
- [ ] Read `src/components/TaskList.jsx`
- [ ] Create task list types
- [ ] Handle drag & drop types
- [ ] Convert to TypeScript
- [ ] Write as `src/components/TaskList.tsx`
- [ ] Build succeeds
- [x] Delete old JSX file

**Test Steps (Build Verification):**
```json
[
  {"step": 1, "action": "build", "command": "npm run build", "expected": "success"}
]
```

### US-015: Convert ChatInterface to TypeScript
**Description:** As a developer, I want ChatInterface.jsx converted to TypeScript so that the main chat interface has full type safety.

**Acceptance Criteria:**
- [ ] Read `src/components/ChatInterface.jsx`
- [ ] Create comprehensive message types
- [ ] Create tool use types
- [ ] Create streaming state types
- [ ] Handle file attachment types
- [ ] Convert to TypeScript
- [ ] Write as `src/components/ChatInterface.tsx`
- [ ] Build succeeds with zero errors
- [x] Delete old JSX file

**Test Steps (Build Verification):**
```json
[
  {"step": 1, "action": "build", "command": "npm run build", "expected": "success"},
  {"step": 2, "action": "verify", "target": "dist/index.html", "expected": "file_exists"}
]
```

## Final Verification

### US-016: Verify Complete Migration
**Description:** As a developer, I want to verify that all JSX files have been converted and the project is 100% TypeScript.

**Acceptance Criteria:**
- [ ] Run `find src -name "*.jsx" -type f` returns zero files
- [ ] Build succeeds with no TypeScript errors
- [ ] Type coverage is 100%
- [ ] All functionality preserved
- [ ] Documentation updated

**Test Steps (Final Verification):**
```json
[
  {"step": 1, "action": "verify", "command": "find src -name '*.jsx' -type f | wc -l", "expected": "0"},
  {"step": 2, "action": "build", "command": "npm run build", "expected": "success"},
  {"step": 3, "action": "count", "command": "find src -name '*.tsx' -type f | wc -l", "expected": ">=78"}
]
```

## Success Metrics
- **Type Coverage**: 100%
- **Build Time**: No significant increase
- **Runtime Errors**: Zero
- **Developer Experience**: Improved with IntelliSense

---

## Enhancement: ENH-002 - ChatInterface Modular Refactoring

**Goal**: Refactor the monolithic 5,933-line ChatInterface.tsx into maintainable, focused modules.

### Sprint 1: Foundation - Utility Extraction

#### US-017: Extract Chat Utility Functions
**Description**: As a developer, I want to extract reusable utility functions from ChatInterface so that they can be tested and reused independently.

**Acceptance Criteria:**
- [ ] Create `src/utils/chatUtils.ts` with:
  - `decodeHtmlEntities(text: string): string`
  - `normalizeInlineCodeFences(text: string): string`
  - `extractFileMentions(text: string): string[]`
  - `formatMessageContent(content: string): string`
- [ ] Move utility functions from ChatInterface
- [ ] Update ChatInterface imports
- [ ] All tests pass
- [ ] Build succeeds

**Files**:
- Create: `src/utils/chatUtils.ts`
- Modify: `src/components/ChatInterface.tsx`

#### US-018: Extract Markdown Utility Functions
**Description**: As a developer, I want markdown parsing utilities separated so they can be reused across components.

**Acceptance Criteria:**
- [ ] Create `src/utils/markdownUtils.ts` with:
  - Markdown plugin configurations
  - Syntax highlighting helpers
  - LaTeX processing utilities
- [ ] Export reusable types and constants
- [ ] Update ChatInterface imports
- [ ] All tests pass
- [ ] Build succeeds

**Files**:
- Create: `src/utils/markdownUtils.ts`
- Modify: `src/components/ChatInterface.tsx`

#### US-019: Extract ImageAttachment Component
**Description**: As a developer, I want ImageAttachment as a separate component for better maintainability.

**Acceptance Criteria:**
- [ ] Create `src/components/chat/ImageAttachment.tsx`
- [ ] Move ImageAttachment component from ChatInterface (lines 1881-1924)
- [ ] Export proper TypeScript interfaces
- [ ] Update ChatInterface imports
- [ ] All tests pass
- [ ] Build succeeds

**Files**:
- Create: `src/components/chat/ImageAttachment.tsx`
- Modify: `src/components/ChatInterface.tsx`

### Sprint 2: Custom Hooks - State Management

#### US-020: Extract useChatScroll Hook
**Description**: As a developer, I want scroll management logic in a custom hook for better separation of concerns.

**Acceptance Criteria:**
- [ ] Create `src/hooks/useChatScroll.ts` with:
  - Auto-scroll logic
  - Scroll position restoration
  - Scroll behavior settings
- [ ] Manage refs: `messagesEndRef`, `scrollContainerRef`, `pendingScrollRestoreRef`
- [ ] Export hook interface
- [ ] Update ChatInterface to use hook
- [ ] All tests pass
- [ ] Build succeeds

**Files**:
- Create: `src/hooks/useChatScroll.ts`
- Modify: `src/components/ChatInterface.tsx`

#### US-021: Extract useCommandMenu Hook
**Description**: As a developer, I want command menu logic in a custom hook for better testability.

**Acceptance Criteria:**
- [ ] Create `src/hooks/useCommandMenu.ts` with:
  - Command detection in input
  - Fuzzy file search with Fuse.js
  - File mention suggestions
- [ ] Manage state: `commandQuery`, `commandResults`, `showCommandMenu`
- [ ] Export hook interface
- [ ] Update ChatInterface to use hook
- [ ] All tests pass
- [ ] Build succeeds

**Files**:
- Create: `src/hooks/useCommandMenu.ts`
- Modify: `src/components/ChatInterface.tsx`

#### US-022: Extract useChatInput Hook
**Description**: As a developer, I want input management logic in a custom hook for better maintainability.

**Acceptance Criteria:**
- [ ] Create `src/hooks/useChatInput.ts` with:
  - Input state management
  - File attachments handling
  - Image upload logic
  - Submit handling
  - Textarea auto-resize
- [ ] Manage state: `inputText`, `attachedImages`, `isUploading`, `textareaRef`
- [ ] Export hook interface with all handlers
- [ ] Update ChatInterface to use hook
- [ ] All tests pass
- [ ] Build succeeds

**Files**:
- Create: `src/hooks/useChatInput.ts`
- Modify: `src/components/ChatInterface.tsx`

### Sprint 3: CodeBlock Decomposition (Critical)

#### US-023: Extract CodeActions Component
**Description**: As a developer, I want code action buttons (copy, apply) as a separate component.

**Acceptance Criteria:**
- [ ] Create `src/components/chat/CodeActions.tsx` with:
  - Copy button with success feedback
  - Apply button (if applicable)
  - Action handlers
- [ ] Export proper TypeScript interfaces
- [ ] Update CodeBlock to use component
- [ ] All tests pass
- [ ] Build succeeds

**Files**:
- Create: `src/components/chat/CodeActions.tsx`
- Modify: `src/components/ChatInterface.tsx` (CodeBlock section)

#### US-024: Extract DiffDisplay Component
**Description**: As a developer, I want diff rendering logic separated for better maintainability.

**Acceptance Criteria:**
- [ ] Create `src/components/chat/DiffDisplay.tsx` with:
  - Diff parsing and rendering
  - File path display
  - Addition/deletion highlighting
- [ ] Export proper TypeScript interfaces
- [ ] Update CodeBlock to use component
- [ ] All tests pass
- [ ] Build succeeds

**Files**:
- Create: `src/components/chat/DiffDisplay.tsx`
- Modify: `src/components/ChatInterface.tsx` (CodeBlock section)

#### US-025: Extract ToolUseDisplay Component
**Description**: As a developer, I want tool use display logic separated from CodeBlock.

**Acceptance Criteria:**
- [ ] Create `src/components/chat/ToolUseDisplay.tsx` with:
  - Tool name and input display
  - Expandable tool parameters
  - Tool result rendering
- [ ] Export proper TypeScript interfaces
- [ ] Update CodeBlock to use component
- [ ] All tests pass
- [ ] Build succeeds

**Files**:
- Create: `src/components/chat/ToolUseDisplay.tsx`
- Modify: `src/components/ChatInterface.tsx` (CodeBlock section)

#### US-026: Refactor Main CodeBlock Component
**Description**: As a developer, I want the CodeBlock component refactored to use sub-components.

**Acceptance Criteria:**
- [ ] Create `src/components/chat/CodeBlock.tsx`
- [ ] Move CodeBlock from ChatInterface (lines 405-1880)
- [ ] Integrate CodeActions, DiffDisplay, ToolUseDisplay
- [ ] Reduce to ~400 lines (from 1,476)
- [ ] Export proper TypeScript interfaces
- [ ] Update ChatInterface imports
- [ ] All tests pass
- [ ] Build succeeds

**Files**:
- Create: `src/components/chat/CodeBlock.tsx`
- Modify: `src/components/ChatInterface.tsx`

### Sprint 4: Message Handling

#### US-027: Extract MessageMarkdown Component
**Description**: As a developer, I want markdown rendering as a separate component.

**Acceptance Criteria:**
- [ ] Create `src/components/chat/MessageMarkdown.tsx`
- [ ] Move Markdown component from ChatInterface (lines 165-404)
- [ ] Include remarkGfm, remarkMath, rehypeKatex plugins
- [ ] Export proper TypeScript interfaces
- [ ] Update ChatInterface imports
- [ ] All tests pass
- [ ] Build succeeds

**Files**:
- Create: `src/components/chat/MessageMarkdown.tsx`
- Modify: `src/components/ChatInterface.tsx`

#### US-028: Extract useChatMessages Hook
**Description**: As a developer, I want message state management in a custom hook.

**Acceptance Criteria:**
- [ ] Create `src/hooks/useChatMessages.ts` with:
  - Message state management
  - Message loading/fetching from API
  - Message streaming handling
  - Local storage sync
- [ ] Manage state: `sessionMessages`, `isLoadingMessages`, `streamingMessage`
- [ ] Export hook interface
- [ ] Update ChatInterface to use hook
- [ ] All tests pass
- [ ] Build succeeds

**Files**:
- Create: `src/hooks/useChatMessages.ts`
- Modify: `src/components/ChatInterface.tsx`

#### US-029: Extract useChatWebSocket Hook
**Description**: As a developer, I want WebSocket handling in a custom hook.

**Acceptance Criteria:**
- [ ] Create `src/hooks/useChatWebSocket.ts` with:
  - WebSocket message handling
  - Permission request processing
  - Stream processing
  - Error handling
- [ ] Manage WebSocket state and handlers
- [ ] Export hook interface
- [ ] Update ChatInterface to use hook
- [ ] All tests pass
- [ ] Build succeeds

**Files**:
- Create: `src/hooks/useChatWebSocket.ts`
- Modify: `src/components/ChatInterface.tsx`

#### US-030: Extract MessageBubble Component
**Description**: As a developer, I want message bubbles as a separate component.

**Acceptance Criteria:**
- [ ] Create `src/components/chat/MessageBubble.tsx` with:
  - User/assistant message container
  - Provider logo (Claude, Cursor, Codex, Pi)
  - Timestamp display
  - Message styling
- [ ] Export proper TypeScript interfaces
- [ ] Update ChatInterface to use component
- [ ] All tests pass
- [ ] Build succeeds

**Files**:
- Create: `src/components/chat/MessageBubble.tsx`
- Modify: `src/components/ChatInterface.tsx`

#### US-031: Extract ThinkingBlock Component
**Description**: As a developer, I want thinking process display as a separate component.

**Acceptance Criteria:**
- [ ] Create `src/components/chat/ThinkingBlock.tsx` with:
  - Thinking process display
  - Expand/collapse logic
  - Streaming animation
- [ ] Export proper TypeScript interfaces
- [ ] Update ChatInterface to use component
- [ ] All tests pass
- [ ] Build succeeds

**Files**:
- Create: `src/components/chat/ThinkingBlock.tsx`
- Modify: `src/components/ChatInterface.tsx`

### Sprint 5: Feature Components

#### US-032: Extract PermissionRequest Component
**Description**: As a developer, I want permission requests as a separate component.

**Acceptance Criteria:**
- [ ] Create `src/components/chat/PermissionRequest.tsx` with:
  - Permission request UI
  - Allow/deny actions
  - Request queue management
- [ ] Export proper TypeScript interfaces
- [ ] Update ChatInterface to use component
- [ ] All tests pass
- [ ] Build succeeds

**Files**:
- Create: `src/components/chat/PermissionRequest.tsx`
- Modify: `src/components/ChatInterface.tsx`

#### US-033: Extract ChatToolbar Component
**Description**: As a developer, I want the chat toolbar as a separate component.

**Acceptance Criteria:**
- [ ] Create `src/components/chat/ChatToolbar.tsx` with:
  - Model selector
  - Thinking mode selector
  - Settings button
  - Token usage display
- [ ] Export proper TypeScript interfaces
- [ ] Update ChatInterface to use component
- [ ] All tests pass
- [ ] Build succeeds

**Files**:
- Create: `src/components/chat/ChatToolbar.tsx`
- Modify: `src/components/ChatInterface.tsx`

#### US-034: Extract ChatInputArea Component
**Description**: As a developer, I want the chat input area as a separate component.

**Acceptance Criteria:**
- [ ] Create `src/components/chat/ChatInputArea.tsx` with:
  - Textarea with file mentions
  - Image attachments display
  - Send button
  - MicButton integration
  - File upload handling
- [ ] Export proper TypeScript interfaces
- [ ] Update ChatInterface to use component
- [ ] All tests pass
- [ ] Build succeeds

**Files**:
- Create: `src/components/chat/ChatInputArea.tsx`
- Modify: `src/components/ChatInterface.tsx`

#### US-035: Extract MessageList Component
**Description**: As a developer, I want the message list as a separate component.

**Acceptance Criteria:**
- [ ] Create `src/components/chat/MessageList.tsx` with:
  - Message rendering loop
  - Scroll container
  - Empty state
  - Loading state
- [ ] Export proper TypeScript interfaces
- [ ] Update ChatInterface to use component
- [ ] All tests pass
- [ ] Build succeeds

**Files**:
- Create: `src/components/chat/MessageList.tsx`
- Modify: `src/components/ChatInterface.tsx`

### Sprint 6: Final Integration

#### US-036: Final ChatInterface Integration
**Description**: As a developer, I want the main ChatInterface refactored to orchestrate all modules.

**Acceptance Criteria:**
- [ ] Refactor ChatInterface.tsx to ~300 lines
- [ ] Use all custom hooks
- [ ] Use all sub-components
- [ ] Remove old code
- [ ] Maintain 100% backward compatibility
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Visual regression tests pass
- [ ] All 4 providers work (Claude, Cursor, Codex, Pi)
- [ ] Message streaming works
- [ ] File attachments work
- [ ] Code blocks render correctly
- [ ] Tool use displays properly
- [ ] Permission requests work
- [ ] Command menu functions

**Files**:
- Modify: `src/components/ChatInterface.tsx` (major refactor)

#### US-037: Performance Validation and Documentation
**Description**: As a developer, I want to validate performance improvements and document the new architecture.

**Acceptance Criteria:**
- [ ] Measure before/after bundle size
- [ ] Validate re-render counts with React DevTools
- [ ] Update CHATINTERFACE_REFACTOR_PLAN.md with results
- [ ] Create ARCHITECTURE.md documenting module structure
- [ ] Add JSDoc comments to all new modules
- [ ] Create migration guide for team
- [ ] All tests pass
- [ ] Build succeeds

**Files**:
- Create: `docs/ARCHITECTURE.md`
- Modify: `CHATINTERFACE_REFACTOR_PLAN.md`


---

## Enhancement: ENH-003 - Fix Remaining ESLint no-undef Errors

### US-038: Fix CodeEditor.tsx ESLint Errors
**Description:** As a developer, I want CodeEditor.tsx to have no ESLint no-undef errors so that all variables are properly imported and the code is maintainable.

**Acceptance Criteria:**
- [x] Add `useTranslation` import from react-i18next
- [x] Destructure `t` function at component start with appropriate namespace
- [x] Import `ViewPlugin` and `showPanel` from @codemirror/view
- [x] Fix or define `getChunks` and `unifiedMergeView` functions
- [x] Run `npx eslint src/components/CodeEditor.tsx` shows 0 no-undef errors
- [x] Build succeeds with no new errors

**Test Steps:**
```json
[
  {"step": 1, "action": "run", "command": "npx eslint src/components/CodeEditor.tsx", "expected": "0 no-undef errors"},
  {"step": 2, "action": "run", "command": "npm run build", "expected": "success"}
]
```

### US-039: Fix Shell.tsx ESLint Errors
**Description:** As a developer, I want Shell.tsx to have no ESLint no-undef errors so that all dependencies are properly imported.

**Acceptance Criteria:**
- [ ] Import `Terminal` icon from lucide-react
- [ ] Add `useCallback` to React imports if missing
- [ ] Fix any other undefined references
- [ ] Run `npx eslint src/components/Shell.tsx` shows 0 no-undef errors
- [ ] Build succeeds

**Test Steps:**
```json
[
  {"step": 1, "action": "run", "command": "npx eslint src/components/Shell.tsx", "expected": "0 no-undef errors"}
]
```

### US-040: Fix MicButton.tsx ESLint Errors
**Description:** As a developer, I want MicButton.tsx to have no ESLint no-undef errors.

**Acceptance Criteria:**
- [ ] Fix all undefined variable references
- [ ] Add missing imports
- [ ] Run `npx eslint src/components/MicButton.tsx` shows 0 no-undef errors

**Test Steps:**
```json
[
  {"step": 1, "action": "run", "command": "npx eslint src/components/MicButton.tsx", "expected": "0 no-undef errors"}
]
```

### US-041: Fix useAudioRecorder.ts ESLint Errors
**Description:** As a developer, I want useAudioRecorder.ts to have no ESLint no-undef errors.

**Acceptance Criteria:**
- [ ] Fix all undefined variable references
- [ ] Add missing type imports if needed
- [ ] Run `npx eslint src/hooks/useAudioRecorder.ts` shows 0 no-undef errors

**Test Steps:**
```json
[
  {"step": 1, "action": "run", "command": "npx eslint src/hooks/useAudioRecorder.ts", "expected": "0 no-undef errors"}
]
```

### US-042: Fix ThinkingModeSelector.tsx ESLint Errors
**Description:** As a developer, I want ThinkingModeSelector.tsx to have no ESLint no-undef errors.

**Acceptance Criteria:**
- [ ] Fix all undefined variable references
- [ ] Add missing imports
- [ ] Run `npx eslint src/components/ThinkingModeSelector.tsx` shows 0 no-undef errors

**Test Steps:**
```json
[
  {"step": 1, "action": "run", "command": "npx eslint src/components/ThinkingModeSelector.tsx", "expected": "0 no-undef errors"}
]
```

### US-043: Fix NextTaskBanner.tsx ESLint Errors
**Description:** As a developer, I want NextTaskBanner.tsx to have no ESLint no-undef errors.

**Acceptance Criteria:**
- [ ] Fix all undefined variable references
- [ ] Add missing imports
- [ ] Run `npx eslint src/components/NextTaskBanner.tsx` shows 0 no-undef errors

**Test Steps:**
```json
[
  {"step": 1, "action": "run", "command": "npx eslint src/components/NextTaskBanner.tsx", "expected": "0 no-undef errors"}
]
```

### US-044: Fix CommandMenu.tsx ESLint Errors
**Description:** As a developer, I want CommandMenu.tsx to have no ESLint no-undef errors.

**Acceptance Criteria:**
- [ ] Fix all undefined variable references
- [ ] Add missing imports
- [ ] Run `npx eslint src/components/CommandMenu.tsx` shows 0 no-undef errors

**Test Steps:**
```json
[
  {"step": 1, "action": "run", "command": "npx eslint src/components/CommandMenu.tsx", "expected": "0 no-undef errors"}
]
```

### US-045: Fix SetupForm.tsx ESLint Errors
**Description:** As a developer, I want SetupForm.tsx to have no ESLint no-undef errors.

**Acceptance Criteria:**
- [ ] Fix all undefined variable references
- [ ] Add missing imports
- [ ] Run `npx eslint src/components/SetupForm.tsx` shows 0 no-undef errors

**Test Steps:**
```json
[
  {"step": 1, "action": "run", "command": "npx eslint src/components/SetupForm.tsx", "expected": "0 no-undef errors"}
]
```

### US-046: Fix ApiKeysSettings.tsx ESLint Errors
**Description:** As a developer, I want ApiKeysSettings.tsx to have no ESLint no-undef errors.

**Acceptance Criteria:**
- [ ] Fix all undefined variable references (likely `confirm` function)
- [ ] Add missing imports or use window.confirm explicitly
- [ ] Run `npx eslint src/components/ApiKeysSettings.tsx` shows 0 no-undef errors

**Test Steps:**
```json
[
  {"step": 1, "action": "run", "command": "npx eslint src/components/ApiKeysSettings.tsx", "expected": "0 no-undef errors"}
]
```

### US-047: Fix Remaining Minor File ESLint Errors
**Description:** As a developer, I want all remaining files (ThemeContext, Sidebar, chat components) to have no ESLint no-undef errors.

**Acceptance Criteria:**
- [ ] Fix ThemeContext.tsx errors
- [ ] Fix Sidebar.tsx errors
- [ ] Fix chat/ChatInputArea.tsx errors
- [ ] Fix chat/ThinkingBlock.tsx errors
- [ ] Run `npm run lint` shows 0 no-undef errors
- [ ] Final build succeeds

**Test Steps:**
```json
[
  {"step": 1, "action": "run", "command": "npm run lint 2>&1 | grep 'no-undef' | wc -l", "expected": "0"},
  {"step": 2, "action": "run", "command": "npm run build", "expected": "success"}
]
```
