#!/bin/bash

echo "🔍 Comprehensive Import Check"
echo "=============================="
echo ""

FILES_CHECKED=0
ISSUES_FOUND=0

# Function to check a file
check_file() {
    local file=$1
    local issues=0
    
    # Get all component/function names used in JSX (starting with uppercase)
    used_names=$(grep -o '<[A-Z][a-zA-Z0-9]*' "$file" 2>/dev/null | sed 's/^<//' | sort -u)
    
    for name in $used_names; do
        # Skip built-in DOM elements and TypeScript types
        if echo "$name" | grep -qE '^(HTML|SVG|WebGL|NodeJS|React)'; then
            continue
        fi
        
        # Check if imported or defined in file
        if ! grep -q "import.*\b$name\b" "$file" && \
           ! grep -q "^export.*\b$name\b" "$file" && \
           ! grep -q "^(const|function|class|interface|type).*\b$name\b" "$file"; then
            echo "  ⚠️  '$name' used but not found"
            issues=$((issues + 1))
        fi
    done
    
    return $issues
}

# Check main files
echo "Checking ChatInterface.tsx..."
check_file "src/components/ChatInterface.tsx"
if [ $? -gt 0 ]; then
    ISSUES_FOUND=$((ISSUES_FOUND + $?))
fi
FILES_CHECKED=$((FILES_CHECKED + 1))

echo ""
echo "Checking chat components..."
for file in src/components/chat/*.tsx; do
    if [ -f "$file" ]; then
        echo "  $(basename $file)..."
        check_file "$file"
        if [ $? -gt 0 ]; then
            ISSUES_FOUND=$((ISSUES_FOUND + $?))
        fi
        FILES_CHECKED=$((FILES_CHECKED + 1))
    fi
done

echo ""
echo "Checking hooks..."
for file in src/hooks/*.ts src/hooks/*.tsx; do
    if [ -f "$file" ]; then
        echo "  $(basename $file)..."
        check_file "$file"
        if [ $? -gt 0 ]; then
            ISSUES_FOUND=$((ISSUES_FOUND + $?))
        fi
        FILES_CHECKED=$((FILES_CHECKED + 1))
    fi
done

echo ""
echo "=============================="
echo "Summary:"
echo "  Files checked: $FILES_CHECKED"
echo "  Issues found: $ISSUES_FOUND"
echo ""

if [ $ISSUES_FOUND -eq 0 ]; then
    echo "✅ All imports look good!"
    exit 0
else
    echo "⚠️  Found $ISSUES_FOUND potential issues"
    exit 1
fi
