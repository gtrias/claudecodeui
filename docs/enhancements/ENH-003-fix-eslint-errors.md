# Enhancement: ENH-003 - Fix Remaining ESLint no-undef Errors

## Overview
Fix all remaining 54 ESLint no-undef errors across multiple files to ensure complete static analysis coverage and prevent "X is not defined" runtime errors.

## Current Status
- **ESLint installed**: ✅ Configured with no-undef rule
- **Errors fixed**: TaskList.tsx (21 errors) ✅
- **Errors remaining**: 54 across 9 files
- **GitPanel.tsx excluded**: 113 errors (needs separate refactoring)

## Requirements
1. Fix all missing imports in remaining files
2. Add useTranslation hook and destructure `t` function where needed
3. Import missing React hooks (useMemo, useCallback)
4. Import missing CodeMirror components (ViewPlugin, showPanel)
5. Import missing lucide-react icons
6. Ensure all components build without errors
7. Verify with `npm run lint`

## Error Breakdown

### CodeEditor.tsx (28 errors)
**Issues:**
- Missing `t` function (11 uses) - needs useTranslation
- Missing `useMemo` from React (already added partially)
- Missing CodeMirror imports: `ViewPlugin`, `showPanel`, `getChunks`
- Missing `unifiedMergeView` function

**Fixes needed:**
```typescript
import { useTranslation } from 'react-i18next';
import { ViewPlugin, showPanel } from '@codemirror/view';
const { t } = useTranslation('editor');
```

### Shell.tsx (6 errors)
**Issues:**
- Missing `Terminal` icon
- Missing `useCallback` from React
- Missing component/utility references

### MicButton.tsx (3 errors)
**Issues:**
- Missing browser API types or imports

### useAudioRecorder.ts (2 errors)
**Issues:**
- Missing browser API types

### ThinkingModeSelector.tsx (2 errors)
**Issues:**
- Missing imports

### NextTaskBanner.tsx (2 errors)
**Issues:**
- Missing imports

### CommandMenu.tsx (2 errors)
**Issues:**
- Missing imports

### ThemeContext.tsx (1 error)
**Issues:**
- Missing `StorageEvent` type (already in eslint globals)

### Sidebar.tsx (1 error)
**Issues:**
- Missing import

### SetupForm.tsx (2 errors)
**Issues:**
- Missing imports

### ApiKeysSettings.tsx (2 errors)
**Issues:**
- Missing imports

### chat/ChatInputArea.tsx (1 error)
**Issues:**
- `FileList` type (already in eslint globals - may be false positive)

### chat/ThinkingBlock.tsx (1 error)
**Issues:**
- `HTMLDetailsElement` type (already in eslint globals)

## Technical Approach

### For Translation Errors:
1. Check if file already imports react-i18next
2. If not, add: `import { useTranslation } from 'react-i18next';`
3. At component start, add: `const { t } = useTranslation('namespace');`
4. Determine appropriate namespace (chat, editor, common, etc.)

### For React Hook Errors:
1. Check existing React import
2. Add missing hooks: `useMemo`, `useCallback`, etc.

### For Icon Errors:
1. Check existing lucide-react imports
2. Add missing icons to the import list

### For Component Errors:
1. Find component file location
2. Add import statement

### For Browser API Types:
1. Most are already in eslint.config.js globals
2. May need to add @types packages if missing

## Affected Files
- src/components/CodeEditor.tsx
- src/components/Shell.tsx
- src/components/MicButton.tsx
- src/hooks/useAudioRecorder.ts
- src/components/ThinkingModeSelector.tsx
- src/components/NextTaskBanner.tsx
- src/components/CommandMenu.tsx
- src/contexts/ThemeContext.tsx
- src/components/Sidebar.tsx
- src/components/SetupForm.tsx
- src/components/ApiKeysSettings.tsx
- src/components/chat/ChatInputArea.tsx
- src/components/chat/ThinkingBlock.tsx

## Testing Strategy

### Verification Steps:
1. Run `npm run lint` after each file fix
2. Check error count decreases
3. Ensure no new errors introduced
4. Run `npm run build` to verify TypeScript compilation
5. Final verification: `npm run lint | grep "no-undef" | wc -l` should be 0

### Acceptance Criteria:
- All files compile without no-undef errors
- npm run lint shows 0 no-undef errors
- Build succeeds
- No runtime errors introduced

## Implementation Order

1. **CodeEditor.tsx** - Most errors (28), highest impact
2. **Shell.tsx** - Medium errors (6)
3. **MicButton.tsx** - Low errors (3)
4. **useAudioRecorder.ts** - Low errors (2)
5. **ThinkingModeSelector.tsx** - Low errors (2)
6. **NextTaskBanner.tsx** - Low errors (2)
7. **CommandMenu.tsx** - Low errors (2)
8. **SetupForm.tsx** - Low errors (2)
9. **ApiKeysSettings.tsx** - Low errors (2)
10. **ThemeContext.tsx** - Single error (1)
11. **Sidebar.tsx** - Single error (1)
12. **chat/ChatInputArea.tsx** - Single error (1)
13. **chat/ThinkingBlock.tsx** - Single error (1)

## Success Metrics
- 0 no-undef errors across entire codebase
- All ESLint checks pass
- Build succeeds
- No new TypeScript errors
- Documentation updated

## Notes
- GitPanel.tsx remains excluded (113 errors, needs major refactoring)
- Some browser API types may already be in eslint globals
- Translation namespaces should match existing convention
- Preserve existing code style and formatting
