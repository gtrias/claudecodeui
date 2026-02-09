# Enhancement: ENH-002 - ChatInterface Modular Refactoring

## Overview
Refactor the monolithic 5,933-line ChatInterface.tsx into a maintainable, modular architecture following React best practices for component composition and custom hooks.

## Problem Statement
The current ChatInterface.tsx is unmaintainable:
- **5,933 lines** in a single file
- **4,009 lines** in the main component function
- **1,476 lines** in CodeBlock sub-component
- **40+ state variables** mixed together
- **20+ useEffect hooks** with complex dependencies
- **Difficult to test** in isolation
- **Poor collaboration** due to merge conflicts
- **High cognitive load** when making changes

## Goals
1. Break down ChatInterface into focused, single-responsibility modules
2. Extract reusable custom hooks for state management
3. Create testable, isolated components
4. Maintain 100% backward compatibility
5. Improve performance through better memoization
6. Reduce file size to < 400 lines per file

## Technical Approach

### Architecture Changes
```
Before: ChatInterface.tsx (5,933 lines)
After:  22 focused modules (~200 lines each)
```

### Module Organization
```
src/
├── components/
│   ├── ChatInterface.tsx          (300 lines - orchestration)
│   └── chat/                       (12 sub-components)
├── hooks/                          (5 custom hooks)
└── utils/                          (2 utility modules)
```

### Key Strategies
1. **Extract utilities first** (low risk)
2. **Create custom hooks** for state management
3. **Decompose CodeBlock** (highest impact)
4. **Extract feature components** (medium risk)
5. **Final integration** (validate everything)

## Affected Files

### New Files to Create
- `src/utils/chatUtils.ts`
- `src/utils/markdownUtils.ts`
- `src/hooks/useChatMessages.ts`
- `src/hooks/useChatInput.ts`
- `src/hooks/useChatWebSocket.ts`
- `src/hooks/useChatScroll.ts`
- `src/hooks/useCommandMenu.ts`
- `src/components/chat/MessageMarkdown.tsx`
- `src/components/chat/CodeBlock.tsx`
- `src/components/chat/DiffDisplay.tsx`
- `src/components/chat/ToolUseDisplay.tsx`
- `src/components/chat/CodeActions.tsx`
- `src/components/chat/ImageAttachment.tsx`
- `src/components/chat/MessageBubble.tsx`
- `src/components/chat/ThinkingBlock.tsx`
- `src/components/chat/PermissionRequest.tsx`
- `src/components/chat/ChatToolbar.tsx`
- `src/components/chat/ChatInputArea.tsx`
- `src/components/chat/MessageList.tsx`

### Files to Modify
- `src/components/ChatInterface.tsx` (major refactor)
- `src/components/MainContent.tsx` (update imports if needed)

## Success Metrics

### Before
- File size: 5,933 lines
- Largest component: 4,009 lines
- Cyclomatic complexity: Very High
- Test coverage: 0% (too complex)

### After
- File size: ~300 lines (main component)
- Largest component: ~400 lines
- Cyclomatic complexity: Low-Medium
- Test coverage: > 60% (testable modules)

## Testing Strategy

### Per Sprint
- Build must pass (TypeScript compilation)
- No visual regressions
- Core chat functionality works
- All providers supported

### Final Validation
- Message streaming works
- File attachments functional
- Code blocks render correctly
- Tool use displays properly
- Permission requests work
- Command menu functions
- All 4 providers (Claude, Cursor, Codex, Pi)

## Risk Assessment

### High Risk
- Final ChatInterface integration (Sprint 6)
- CodeBlock decomposition (Sprint 3)
- Message handling hooks (Sprint 4)

### Medium Risk
- Custom hooks (Sprint 2)
- Feature components (Sprint 5)

### Low Risk
- Utility extraction (Sprint 1)

## Rollback Plan
- Keep ChatInterface.tsx.backup until all tests pass
- Feature flag for gradual rollout
- Git branches allow easy revert

## Timeline
- **Sprint 1**: 2-3 hours (Utilities)
- **Sprint 2**: 4-6 hours (Hooks)
- **Sprint 3**: 6-8 hours (CodeBlock)
- **Sprint 4**: 5-7 hours (Messages)
- **Sprint 5**: 4-6 hours (Features)
- **Sprint 6**: 4-6 hours (Integration)
- **Total**: 25-36 hours

## Dependencies
- TypeScript migration (ENH-001) ✅ Complete
- Build system working ✅
- Git version control ✅
- Test infrastructure ✅

## Notes
- This is a pure refactoring - no new features
- All existing functionality must be preserved
- Performance should improve (smaller re-renders)
- Code review required after each sprint
