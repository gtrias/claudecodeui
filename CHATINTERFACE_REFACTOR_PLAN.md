# ChatInterface Refactoring Plan

## 🎯 Goal
Break down the massive 5,933-line ChatInterface.tsx into maintainable, focused modules.

## 📊 Current State
- **Total lines**: 5,933
- **Main component**: 4,009 lines (67%)
- **CodeBlock component**: 1,476 lines (25%)
- **State variables**: 40+
- **Effect hooks**: 20+
- **Handler functions**: 20+
- **Maintainability**: ⚠️ Critical - Single file is too large

## 🏗️ Refactoring Strategy

### Phase 1: Extract Utility Modules
**Goal**: Move reusable logic out of the component

#### 1.1 Create `src/utils/chatUtils.ts`
- `decodeHtmlEntities(text: string): string`
- `normalizeInlineCodeFences(text: string): string`
- `extractFileMentions(text: string): string[]`
- `formatMessageContent(content: string): string`

**Estimated**: ~100 lines | **Impact**: Low risk

#### 1.2 Create `src/utils/markdownUtils.ts`
- Markdown parsing utilities
- Code block detection
- Syntax highlighting helpers

**Estimated**: ~150 lines | **Impact**: Low risk

---

### Phase 2: Extract Sub-Components
**Goal**: Move presentational components to separate files

#### 2.1 Create `src/components/chat/MessageMarkdown.tsx`
**Current**: Lines 165-404 (240 lines)
- Markdown rendering with plugins
- LaTeX support
- Link handling

**Impact**: Medium risk - Shared by all messages

#### 2.2 Create `src/components/chat/CodeBlock.tsx`
**Current**: Lines 405-1880 (1,476 lines!) 🚨 CRITICAL
- Syntax highlighting
- Copy functionality
- Language detection
- Diff rendering
- Tool use display

**Sub-components to extract from CodeBlock**:
- `src/components/chat/DiffDisplay.tsx` (~200 lines)
- `src/components/chat/ToolUseDisplay.tsx` (~300 lines)
- `src/components/chat/CodeActions.tsx` (copy, apply buttons) (~100 lines)

**Impact**: High value - Massive reduction

#### 2.3 Create `src/components/chat/ImageAttachment.tsx`
**Current**: Lines 1881-1924 (44 lines)
- Image preview
- Upload progress
- Error display

**Impact**: Low risk

#### 2.4 Create `src/components/chat/MessageBubble.tsx`
- User/assistant message container
- Avatar display
- Timestamp
- Provider logo

**Estimated**: ~200 lines | **Impact**: Medium

#### 2.5 Create `src/components/chat/ThinkingBlock.tsx`
- Thinking process display
- Expand/collapse logic
- Streaming animation

**Estimated**: ~150 lines | **Impact**: Medium

---

### Phase 3: Extract Custom Hooks
**Goal**: Move complex state logic to reusable hooks

#### 3.1 Create `src/hooks/useChatMessages.ts`
**Responsibilities**:
- Message state management
- Message loading/fetching
- Message streaming
- Local storage sync

**State to manage**:
- `sessionMessages`
- `isLoadingMessages`
- `streamingMessage`

**Estimated**: ~400 lines | **Impact**: High value

#### 3.2 Create `src/hooks/useChatInput.ts`
**Responsibilities**:
- Input state management
- File attachments
- Image uploads
- Submit handling
- Textarea auto-resize

**State to manage**:
- `inputText`
- `attachedImages`
- `isUploading`
- `textareaRef`

**Estimated**: ~300 lines | **Impact**: High value

#### 3.3 Create `src/hooks/useChatWebSocket.ts`
**Responsibilities**:
- WebSocket message handling
- Permission requests
- Stream processing
- Error handling

**Estimated**: ~250 lines | **Impact**: High value

#### 3.4 Create `src/hooks/useChatScroll.ts`
**Responsibilities**:
- Auto-scroll logic
- Scroll position restoration
- Scroll behavior settings

**State to manage**:
- `messagesEndRef`
- `scrollContainerRef`
- `pendingScrollRestoreRef`

**Estimated**: ~150 lines | **Impact**: Medium

#### 3.5 Create `src/hooks/useCommandMenu.ts`
**Responsibilities**:
- Command detection in input
- Fuzzy file search
- File mention suggestions

**State to manage**:
- `commandQuery`
- `commandResults`
- `showCommandMenu`

**Estimated**: ~200 lines | **Impact**: Medium

---

### Phase 4: Extract Feature Modules
**Goal**: Separate major features into focused components

#### 4.1 Create `src/components/chat/PermissionRequest.tsx`
**Responsibilities**:
- Permission request UI
- Allow/deny actions
- Request queue management

**Estimated**: ~200 lines | **Impact**: Medium

#### 4.2 Create `src/components/chat/ChatToolbar.tsx`
**Responsibilities**:
- Model selector
- Thinking mode selector
- Settings access
- Token usage display

**Estimated**: ~250 lines | **Impact**: Medium

#### 4.3 Create `src/components/chat/ChatInputArea.tsx`
**Responsibilities**:
- Textarea with mentions
- Image attachments display
- Send button
- MicButton integration
- File upload handling

**Estimated**: ~400 lines | **Impact**: High value

#### 4.4 Create `src/components/chat/MessageList.tsx`
**Responsibilities**:
- Message rendering loop
- Scroll container
- Empty state
- Loading state

**Estimated**: ~300 lines | **Impact**: Medium

---

### Phase 5: Final ChatInterface Cleanup
**Goal**: Slim main component to orchestration only

#### 5.1 Refactored ChatInterface Structure
```typescript
function ChatInterface(props: ChatInterfaceProps) {
  // 1. Custom hooks (state management)
  const messages = useChatMessages(props);
  const input = useChatInput(props);
  const websocket = useChatWebSocket(props);
  const scroll = useChatScroll();
  const commands = useCommandMenu();
  
  // 2. Provider state (minimal)
  const { provider, setProvider } = useProvider();
  const { tasksEnabled } = useTasksSettings();
  
  // 3. Orchestration effects (minimal)
  useEffect(() => {
    // Coordinate between hooks
  }, []);
  
  // 4. Simple layout
  return (
    <div className="chat-container">
      <NextTaskBanner {...taskProps} />
      <ChatToolbar {...toolbarProps} />
      <MessageList messages={messages} />
      <ChatInputArea input={input} />
    </div>
  );
}
```

**Target**: ~300 lines (from 4,009!) | **Impact**: 🎯 HUGE WIN

---

## 📁 Proposed File Structure

```
src/
├── components/
│   ├── ChatInterface.tsx          (300 lines - orchestration only)
│   └── chat/
│       ├── MessageMarkdown.tsx    (240 lines)
│       ├── CodeBlock.tsx          (400 lines - core only)
│       ├── DiffDisplay.tsx        (200 lines)
│       ├── ToolUseDisplay.tsx     (300 lines)
│       ├── CodeActions.tsx        (100 lines)
│       ├── ImageAttachment.tsx    (44 lines)
│       ├── MessageBubble.tsx      (200 lines)
│       ├── ThinkingBlock.tsx      (150 lines)
│       ├── PermissionRequest.tsx  (200 lines)
│       ├── ChatToolbar.tsx        (250 lines)
│       ├── ChatInputArea.tsx      (400 lines)
│       └── MessageList.tsx        (300 lines)
│
├── hooks/
│   ├── useChatMessages.ts         (400 lines)
│   ├── useChatInput.ts            (300 lines)
│   ├── useChatWebSocket.ts        (250 lines)
│   ├── useChatScroll.ts           (150 lines)
│   └── useCommandMenu.ts          (200 lines)
│
└── utils/
    ├── chatUtils.ts               (100 lines)
    └── markdownUtils.ts           (150 lines)
```

**Total**: ~4,434 lines spread across 22 focused files
**Average file size**: ~201 lines
**Reduction**: Single 5,933-line file → max 400-line files

---

## 🎯 Benefits

### Maintainability
- ✅ Each file has a single responsibility
- ✅ Easy to locate specific functionality
- ✅ Reduced cognitive load when editing
- ✅ Clear separation of concerns

### Testability
- ✅ Hooks can be unit tested independently
- ✅ Components can be tested in isolation
- ✅ Utilities are pure functions (easy to test)
- ✅ Mock dependencies are simpler

### Reusability
- ✅ CodeBlock can be used in other components
- ✅ Markdown renderer is reusable
- ✅ Hooks can be used by other chat features
- ✅ Utilities available across the app

### Performance
- ✅ Smaller components re-render less
- ✅ React.memo more effective on smaller components
- ✅ Code splitting opportunities
- ✅ Faster dev server HMR

### Collaboration
- ✅ Reduced merge conflicts
- ✅ Easier code reviews (smaller diffs)
- ✅ Team members can work on different parts
- ✅ Clear ownership of modules

---

## 🚀 Execution Plan

### Recommended Order (Low Risk → High Value)

#### Sprint 1: Foundation (Low Risk)
1. ✅ Create utility files (chatUtils.ts, markdownUtils.ts)
2. ✅ Extract ImageAttachment component
3. ✅ Extract MessageMarkdown component
4. ✅ Test and validate

**Risk**: Low | **Value**: Medium | **Time**: 2-3 hours

#### Sprint 2: Custom Hooks (High Value)
5. ✅ Extract useChatScroll hook
6. ✅ Extract useCommandMenu hook
7. ✅ Extract useChatInput hook (most complex)
8. ✅ Test and validate

**Risk**: Medium | **Value**: High | **Time**: 4-6 hours

#### Sprint 3: CodeBlock Decomposition (Critical)
9. ✅ Extract CodeActions sub-component
10. ✅ Extract DiffDisplay sub-component
11. ✅ Extract ToolUseDisplay sub-component
12. ✅ Refactor main CodeBlock
13. ✅ Test extensively

**Risk**: High | **Value**: Very High | **Time**: 6-8 hours

#### Sprint 4: Message Handling (High Value)
14. ✅ Extract useChatMessages hook
15. ✅ Extract useChatWebSocket hook
16. ✅ Extract MessageBubble component
17. ✅ Extract ThinkingBlock component
18. ✅ Test and validate

**Risk**: High | **Value**: Very High | **Time**: 5-7 hours

#### Sprint 5: Feature Components (Medium Value)
19. ✅ Extract PermissionRequest component
20. ✅ Extract ChatToolbar component
21. ✅ Extract ChatInputArea component
22. ✅ Extract MessageList component
23. ✅ Test and validate

**Risk**: Medium | **Value**: High | **Time**: 4-6 hours

#### Sprint 6: Final Integration (High Risk)
24. ✅ Refactor main ChatInterface to use all new modules
25. ✅ Remove old code
26. ✅ Comprehensive testing
27. ✅ Performance validation
28. ✅ Documentation

**Risk**: Very High | **Value**: Complete | **Time**: 4-6 hours

---

## 🧪 Testing Strategy

### Per Sprint
- ✅ Build must pass
- ✅ No TypeScript errors
- ✅ Visual regression testing
- ✅ Core functionality validation

### Final Validation
- ✅ Full E2E chat workflow
- ✅ All providers (Claude, Cursor, Codex, Pi)
- ✅ Message streaming
- ✅ File attachments
- ✅ Code blocks and diffs
- ✅ Tool use
- ✅ Permission requests
- ✅ Command menu
- ✅ Thinking mode
- ✅ Token tracking

---

## 📈 Success Metrics

### Before
- **File size**: 5,933 lines
- **Largest component**: 4,009 lines
- **Cyclomatic complexity**: Very High
- **Test coverage**: Difficult
- **Onboarding time**: Days

### After
- **File size**: ~300 lines (main)
- **Largest component**: ~400 lines
- **Cyclomatic complexity**: Low-Medium
- **Test coverage**: Easy to achieve
- **Onboarding time**: Hours

---

## ⚠️ Risks & Mitigations

### Risk: Breaking existing functionality
**Mitigation**: 
- Incremental changes with testing
- Keep old code until validated
- Feature flags for gradual rollout

### Risk: Introducing performance regressions
**Mitigation**:
- Profile before/after
- Use React.memo appropriately
- Validate re-render counts

### Risk: Increased bundle size
**Mitigation**:
- Code splitting
- Lazy loading where appropriate
- Monitor bundle analyzer

### Risk: Team alignment
**Mitigation**:
- Document new structure
- Pair programming sessions
- Code review checkpoints

---

## 🎓 Learning Opportunities

This refactoring demonstrates:
- ✅ Custom hooks for complex state management
- ✅ Component composition patterns
- ✅ Separation of concerns
- ✅ Single Responsibility Principle
- ✅ TypeScript advanced patterns
- ✅ React performance optimization

---

## 💡 Next Steps

1. **Review this plan** with the team
2. **Prioritize sprints** based on current pain points
3. **Set up tracking** (GitHub project, Jira, etc.)
4. **Create feature branch**: `refactor/chat-interface-modular`
5. **Begin Sprint 1** with low-risk utilities

---

**Estimated Total Time**: 25-36 hours (3-4.5 days for one developer)

**Recommended Approach**: Use Ralph Skill System for autonomous execution! 🚀

Would you like me to create a PRD.md for this refactoring and execute it autonomously with Ralph?
