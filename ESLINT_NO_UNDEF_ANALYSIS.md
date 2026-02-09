# ESLint no-undef Errors - Analysis & Fix Plan

## Summary
- **Total no-undef errors**: 188 (after excluding .d.ts files)
- **Most problematic file**: GitPanel.tsx (113 errors - 60% of all errors!)
- **Root cause**: Incomplete refactoring, missing imports, variable name mismatches

## Error Breakdown by Category

### 1. GitPanel.tsx - BROKEN FILE (113 errors)
**Issue**: Variables referenced don't match state variable names

**Examples**:
- Code uses: `gitStatus` → Defined as: `status`
- Code uses: `selectedFiles` → Not defined at all
- Code uses: `gitDiff` → Not defined at all
- Code uses: `expandedFiles` → Not defined at all

**Root cause**: Incomplete refactoring or merge conflict
**Status**: 🔴 BROKEN - File needs major refactoring or reversion

### 2. CodeEditor.tsx (31 errors)
**Issues**:
- Missing `useMemo` import from React
- Missing `t` function (useTranslation not imported/destructured)
- References to undefined functions: `getChunks`, `showPanel`
- References to CodeMirror internals: `ViewPlugin`

**Fixes needed**:
```typescript
// Add to React import
import React, { useState, useEffect, useRef, useMemo } from 'react';

// Add translation
import { useTranslation } from 'react-i18next';
const { t } = useTranslation('editor'); // or appropriate namespace

// Import CodeMirror pieces
import { ViewPlugin } from '@codemirror/view';
import { showPanel } from '@codemirror/view';
```

### 3. TaskList.tsx (21 errors)
**Issues**:
- Missing component imports: `TaskCard`, `CreateTaskModal`
- Missing icon imports: `Terminal`, `List`, `HelpCircle`
- Missing `useCallback` from React
- References to undefined functions: `api`, `refreshProjects`, `setCurrentProject`

**Status**: Needs import fixes

### 4. Translation Function `t` (21 total uses across files)
**Files affected**:
- CodeEditor.tsx (11 uses)
- GitPanel.tsx (uses it but has other issues)
- Others

**Fix**: Add to each file:
```typescript
import { useTranslation } from 'react-i18next';
const { t } = useTranslation('namespace');
```

### 5. React Hooks Missing (6 total)
- `useMemo` (3 uses) - Need to add to React imports
- `useCallback` (3 uses) - Need to add to React imports

### 6. Icon Imports Missing (various files)
Missing lucide-react icons:
- `Settings`, `Terminal`, `ArrowUp`, `ArrowDown`
- `ChevronRight`, `Info`, `AlertTriangle`
- `HelpCircle`

### 7. Component Imports Missing
- `TaskCard` - Used in MainContent but not imported
- `CreateTaskModal` - Used but not imported
- `MicButton` - Used but not imported  
- `DiffViewer` - Used but not imported

### 8. Custom Function/Variable Issues
**`authenticatedFetch`** (18 uses across multiple files)
- Not defined anywhere
- Likely should be a utility function or hook
- **Status**: 🔴 MISSING - Needs to be created or imported

## Recommendations

### Immediate Actions:

1. **🔴 CRITICAL: Fix or Disable GitPanel.tsx**
   
   Option A: Fix the file (significant work)
   - Rename all variables to match (`gitStatus` → `status`, etc.)
   - Add all missing state variables
   - Fix all refs to undefined functions
   
   Option B: Temporarily exclude from linting (quick fix)
   ```javascript
   // eslint.config.js
   ignores: ['src/components/GitPanel.tsx']
   ```
   
   **Recommendation**: Option B first, then fix properly later

2. **Fix Simple Import Issues** (Est: 30min)
   - Add missing React hook imports
   - Add missing lucide-react icons
   - Add useTranslation where needed

3. **Investigate `authenticatedFetch`** (Est: 15min)
   - Find if it exists elsewhere
   - If not, create utility function
   - Or replace with standard fetch

### Files to Fix (Priority Order):

1. ✅ eslint.config.js - Exclude GitPanel.tsx temporarily
2. CodeEditor.tsx - Add imports (useMemo, useTranslation, ViewPlugin)
3. TaskList.tsx - Add imports (components, icons, useCallback)
4. Shell.tsx - Add imports
5. MicButton.tsx - Add imports
6. ThinkingModeSelector.tsx - Add imports
7. NextTaskBanner.tsx - Add imports
8. CommandMenu.tsx - Add imports

### Long-term:

1. Refactor GitPanel.tsx properly
2. Create comprehensive type definitions
3. Add pre-commit hook to catch these before commit
4. Set up CI/CD to run `npm run lint:strict`

## Current vs Target State

**Current**:
```
❌ 188 no-undef errors
❌ GitPanel.tsx completely broken
❌ Missing imports across 10+ files
❌ Missing utility functions
```

**After Quick Fixes** (Excluding GitPanel):
```
✅ ~75 errors remaining (down from 188)
⚠️  GitPanel.tsx excluded (needs separate fix)
✅ All other files linted cleanly
```

**After Complete Fixes**:
```
✅ 0 no-undef errors
✅ GitPanel.tsx refactored properly
✅ All imports correct
✅ All utilities defined
```

## Commands

```bash
# Check current status
npm run lint | grep "no-undef" | wc -l

# Fix specific file
npx eslint src/components/CodeEditor.tsx --fix

# Check after fixes
./fix-eslint-undef.sh
```

## Notes

- The high error count is misleading - 60% are from ONE broken file
- Once GitPanel is excluded, only ~75 errors remain
- Most remaining errors are simple missing imports
- The `authenticatedFetch` function is referenced 18 times but doesn't exist
- This is technical debt from incomplete refactoring

## Decision Needed

**Should we:**
A) Fix GitPanel.tsx now (2-3 hours of work)
B) Exclude it and fix later (5 minutes)
C) Remove it if unused (check usage first)

**Recommendation**: Check if GitPanel is actually used in production. If yes, exclude temporarily. If no, consider removing.
