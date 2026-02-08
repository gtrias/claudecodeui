# TypeScript Migration Plan - Remaining Files

**Date**: February 8, 2026  
**Status**: Phase 3 - Frontend Component Conversion  
**Progress**: 58 TypeScript files created, 20 JSX files remaining (74% complete)

---

## Overview

This plan outlines the strategy for converting the remaining 20 JSX files to TypeScript, prioritized by complexity, dependencies, and impact.

### Current State
- ✅ **Complete**: Server (100%), Contexts (100%), Hooks (100%), UI Components (100%)
- ✅ **Complete**: Settings infrastructure (85% - 3 files remaining)
- 🔄 **In Progress**: Core application components
- ⏳ **Pending**: Large complex components (ChatInterface, TaskList, GitPanel)

---

## Migration Strategy

### Principles
1. **Bottom-Up**: Convert leaf components before parent components
2. **Dependency First**: Convert components with fewer dependencies first
3. **Gradual Complexity**: Start with simple, move to complex
4. **Test Continuously**: Build and test after each batch
5. **Maintain Compatibility**: Ensure no breaking changes

---

## Phase 3A: Small Components (1-2 hours)
**Priority**: HIGH | **Complexity**: LOW | **Lines**: ~1,200

### Batch 1: Authentication & Setup (334 lines)
1. **SetupForm.jsx** (134 lines)
   - Initial setup form
   - User configuration
   - Low dependency
   - **Dependencies**: None
   - **Estimate**: 15 min

2. **ThinkingModeSelector.jsx** (182 lines)
   - Mode selection component
   - Settings integration
   - **Dependencies**: Contexts
   - **Estimate**: 15 min

3. **TaskCard.jsx** (209 lines)
   - Task display card
   - UI component
   - **Dependencies**: UI components
   - **Estimate**: 20 min

### Batch 2: Task Management (1,100 lines)
4. **TaskDetail.jsx** (405 lines)
   - Task detail view
   - Complex state management
   - **Dependencies**: TaskCard, UI components
   - **Estimate**: 30 min

5. **NextTaskBanner.jsx** (694 lines)
   - Task banner component
   - TaskMaster integration
   - **Dependencies**: TaskMasterContext
   - **Estimate**: 40 min

---

## Phase 3B: Settings Components (1-2 hours)
**Priority**: HIGH | **Complexity**: MEDIUM | **Lines**: ~1,400

### Batch 3: Remaining Settings (1,388 lines)
6. **QuickSettingsPanel.jsx** (457 lines)
   - Quick settings drawer
   - Multiple integrations
   - Draggable handle logic
   - **Dependencies**: Settings contexts, UI components
   - **Estimate**: 45 min

7. **settings/McpServersContent.jsx** (319 lines)
   - MCP server configuration
   - Server list management
   - **Dependencies**: API utils
   - **Estimate**: 30 min

8. **settings/PermissionsContent.jsx** (612 lines)
   - Permissions management
   - Complex UI logic
   - **Dependencies**: API utils, UI components
   - **Estimate**: 45 min

---

## Phase 3C: Medium Components (2-3 hours)
**Priority**: MEDIUM | **Complexity**: MEDIUM | **Lines**: ~3,500

### Batch 4: Wizards & Editors (2,347 lines)
9. **Onboarding.jsx** (661 lines)
   - Onboarding flow
   - Multi-step wizard
   - **Dependencies**: Auth context
   - **Estimate**: 50 min

10. **TaskMasterSetupWizard.jsx** (602 lines)
    - TaskMaster setup flow
    - Multi-step configuration
    - **Dependencies**: TaskMaster context
    - **Estimate**: 50 min

11. **PRDEditor.jsx** (870 lines)
    - PRD document editor
    - Rich text handling
    - **Dependencies**: CodeMirror, API
    - **Estimate**: 60 min

12. **ProjectCreationWizard.jsx** (875 lines)
    - Project creation flow
    - Form validation
    - **Dependencies**: API utils
    - **Estimate**: 60 min

### Batch 5: File System Components (1,179 lines)
13. **FileTree.jsx** (481 lines)
    - File tree navigation
    - Recursive structure
    - **Dependencies**: Project context
    - **Estimate**: 45 min

14. **MainContent.jsx** (698 lines)
    - Main content area
    - Tab management
    - **Dependencies**: Multiple contexts
    - **Estimate**: 50 min

---

## Phase 3D: Complex Components (3-4 hours)
**Priority**: MEDIUM | **Complexity**: HIGH | **Lines**: ~2,100

### Batch 6: Editors & Terminal (1,216 lines)
15. **CodeEditor.jsx** (705 lines)
    - Code editor integration
    - CodeMirror setup
    - Syntax highlighting
    - **Dependencies**: CodeMirror libraries
    - **Estimate**: 60 min

16. **Shell.jsx** (511 lines)
    - Terminal emulator
    - XTerm.js integration
    - Complex state management
    - **Dependencies**: XTerm library
    - **Estimate**: 50 min

### Batch 7: Git Integration (1,402 lines)
17. **GitPanel.jsx** (1,402 lines)
    - Git operations UI
    - Commit history
    - Diff viewing
    - Complex async operations
    - **Dependencies**: Git API, DiffViewer
    - **Estimate**: 90 min

---

## Phase 3E: Large Components (4-6 hours)
**Priority**: HIGH | **Complexity**: VERY HIGH | **Lines**: ~7,964

### Batch 8: Core Application (1,035 lines)
18. **App.jsx** (1,035 lines)
    - Main application component
    - Route management
    - Context providers
    - **Dependencies**: Everything
    - **Estimate**: 80 min

### Batch 9: Task List (1,053 lines)
19. **TaskList.jsx** (1,053 lines)
    - Task list display
    - Task management
    - Drag & drop
    - Complex state
    - **Dependencies**: TaskMaster context, TaskCard
    - **Estimate**: 90 min

### Batch 10: Chat Interface (5,876 lines) - FINAL BOSS 🐉
20. **ChatInterface.jsx** (5,876 lines)
    - Main chat UI
    - Message rendering
    - Tool use display
    - Streaming responses
    - File handling
    - Image support
    - Command menu
    - Complex state management
    - **Dependencies**: Almost everything
    - **Estimate**: 240 min (4 hours)
    - **Strategy**: Split into sub-components if possible

---

## Detailed Conversion Strategy for ChatInterface

### Pre-Conversion Analysis
1. Identify all message types and create interfaces
2. Map out state management patterns
3. Document all event handlers
4. Identify extractable sub-components

### Recommended Sub-Components
```typescript
// Suggested refactoring while converting:
- MessageList.tsx (message rendering)
- MessageItem.tsx (individual message)
- ToolUseDisplay.tsx (tool execution display)
- FileAttachments.tsx (file handling)
- StreamingIndicator.tsx (streaming state)
- ChatInput.tsx (input area)
```

### Type Definitions Needed
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: Content[];
  timestamp: string;
  // ... extensive type definition
}

interface ToolUse {
  id: string;
  name: string;
  input: Record<string, any>;
  // ... tool-specific types
}

// Plus 20+ more interfaces
```

---

## Risk Assessment

### High Risk Components
- **ChatInterface.jsx** - Extremely large, core functionality
- **GitPanel.jsx** - Complex async operations
- **App.jsx** - Application orchestration

### Medium Risk Components
- **TaskList.jsx** - Complex state management
- **CodeEditor.jsx** - External library integration
- **Shell.jsx** - Terminal emulation

### Low Risk Components
- All other components (relatively straightforward conversions)

---

## Testing Strategy

### After Each Batch
1. Run `npm run build` - ensure no errors
2. Test converted components in browser
3. Verify functionality unchanged
4. Check console for runtime errors

### After Each Phase
1. Full application smoke test
2. Test critical user flows
3. Performance verification
4. TypeScript strict mode check (future)

---

## Timeline Estimate

| Phase | Duration | Components | Lines |
|-------|----------|------------|-------|
| **3A** | 1-2 hours | 3 components | ~1,200 |
| **3B** | 1-2 hours | 3 components | ~1,400 |
| **3C** | 2-3 hours | 5 components | ~3,500 |
| **3D** | 3-4 hours | 3 components | ~2,100 |
| **3E** | 4-6 hours | 3 components | ~7,964 |
| **Total** | **11-17 hours** | **20 components** | **17,781 lines** |

### Optimistic: 11 hours (focused sessions)
### Realistic: 14 hours (with testing/breaks)
### Conservative: 17 hours (with refactoring)

---

## Success Metrics

### Completion Criteria
- [ ] All 20 JSX files converted to TSX
- [ ] Zero TypeScript compilation errors
- [ ] All features working as before
- [ ] Type coverage > 90%
- [ ] Build time not significantly increased
- [ ] No runtime errors introduced

### Quality Metrics
- [ ] Proper type definitions for all props
- [ ] No `any` types (except truly dynamic cases)
- [ ] Generic types where appropriate
- [ ] Proper error handling with types
- [ ] Type-safe event handlers
- [ ] Documented complex types

---

## Next Steps

### Immediate (Today)
1. ✅ Complete settings components
2. Start Phase 3A (Small components)
3. Complete Batch 1-2

### Short Term (This Week)
1. Complete Phase 3A-3B
2. Start Phase 3C
3. Make significant progress on medium components

### Medium Term (Next Week)
1. Complete Phase 3C-3D
2. Start Phase 3E
3. Tackle App.jsx and TaskList.jsx

### Final Push
1. Convert ChatInterface.jsx
2. Consider refactoring into sub-components
3. Final testing and cleanup
4. Update documentation

---

## Notes

### Potential Improvements During Migration
1. **Extract Reusable Types**: Create shared type definitions
2. **Refactor Large Components**: Split into smaller, type-safe components
3. **Improve Error Handling**: Use typed error boundaries
4. **Add Generics**: Where components are reusable
5. **Document Complex Types**: Add JSDoc comments for complex interfaces

### Dependencies to Watch
- CodeMirror types (@types/codemirror)
- XTerm types (@types/xterm)
- React Router types (if used)
- Context API proper typing

### Future Enhancements
- Enable TypeScript strict mode
- Add ESLint TypeScript rules
- Set up type checking in CI/CD
- Generate API types from OpenAPI/Swagger
- Create type documentation

---

## Conclusion

This migration plan provides a clear path to completing the TypeScript migration. The strategy prioritizes low-risk, high-value conversions first, building confidence and momentum before tackling the most complex components.

**Current Progress**: 74% complete (58/78 files)  
**Estimated Time to Completion**: 11-17 hours  
**Risk Level**: Medium (manageable with careful execution)  

The migration is well underway with solid foundations in place. The remaining work is primarily focused on UI components with clear boundaries and well-defined responsibilities.

---

**Last Updated**: February 8, 2026  
**Next Review**: After Phase 3B completion
