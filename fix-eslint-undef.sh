#!/bin/bash

# Script to analyze and guide fixing no-undef ESLint errors

echo "=== ESLint no-undef Error Analysis ==="
echo ""

# Get all no-undef errors
npm run lint 2>&1 | awk '
/^\/home/ {file=$1}
/is not defined.*no-undef/ && file {
  match($0, /'\''([^'\'']+)'\'' is not defined/, var_name);
  match($0, /^  ([0-9]+):/, line_num);
  print file ":" line_num[1] ":" var_name[1]
}
' | sort > /tmp/no-undef-errors.txt

total=$(wc -l < /tmp/no-undef-errors.txt)
echo "📊 Total no-undef errors: $total"
echo ""

echo "📋 Top undefined variables:"
cat /tmp/no-undef-errors.txt | awk -F: '{print $3}' | sort | uniq -c | sort -rn | head -20
echo ""

echo "📁 Files with most errors:"
cat /tmp/no-undef-errors.txt | awk -F: '{print $1}' | sort | uniq -c | sort -rn | head -10
echo ""

echo "=== Error Categories ==="
echo ""

echo "1️⃣  React Hooks (need to import from 'react'):"
cat /tmp/no-undef-errors.txt | awk -F: '{print $3}' | grep -E "^(useMemo|useCallback|useLayoutEffect|useImperativeHandle|useDebugValue)$" | sort | uniq -c
echo ""

echo "2️⃣  Translation function (need 'const { t } = useTranslation()'):"
cat /tmp/no-undef-errors.txt | awk -F: '{print $3}' | grep "^t$" | wc -l | xargs echo "   " "t errors:"
echo ""

echo "3️⃣  State variables (likely GitPanel.tsx - needs refactoring):"
cat /tmp/no-undef-errors.txt | grep "GitPanel" | awk -F: '{print $3}' | sort | uniq | head -10
echo ""

echo "4️⃣  Component imports (need to import from lucide-react or components):"
cat /tmp/no-undef-errors.txt | awk -F: '{print $3}' | grep -E "^(Settings|Terminal|TaskCard|MicButton|CreateTaskModal|DiffViewer)$" | sort | uniq -c
echo ""

echo "5️⃣  Browser/TypeScript types (should be in eslint globals):"
cat /tmp/no-undef-errors.txt | awk -F: '{print $3}' | grep -E "^(HTMLFormElement|HTMLSelectElement|HTMLDetailsElement|FileList|MouseEvent|Node|EventSource|CloseEvent|BlobEvent)$" | sort | uniq -c
echo ""

echo "6️⃣  Custom utilities/functions:"
cat /tmp/no-undef-errors.txt | awk -F: '{print $3}' | grep -E "^(authenticatedFetch|api|getChunks|showPanel|unifiedMergeView)$" | sort | uniq -c
echo ""

echo "=== Fix Recommendations ==="
echo ""
echo "✅ Easy fixes (add imports):"
echo "   - React hooks: Add to React import"
echo "   - lucide-react icons: Add to icon imports"
echo "   - Translation: const { t } = useTranslation()"
echo ""
echo "⚠️  Complex fixes:"
echo "   - GitPanel.tsx: Needs proper state management/refactoring (113 errors!)"
echo "   - CodeEditor.tsx: Missing imports and translation destructuring"
echo ""
echo "📝 Full error list saved to: /tmp/no-undef-errors.txt"
