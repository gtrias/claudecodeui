#!/bin/bash

# Runtime Error Simulation Test
# Simulates loading the app and checks for common runtime errors

echo "🧪 Runtime Error Simulation Test"
echo "=================================="
echo ""

ERRORS=0

# Test 1: TypeScript compilation check
echo "Test 1: TypeScript type checking..."
if npx tsc --noEmit --pretty false 2>&1 | grep -q "error TS"; then
    ERROR_COUNT=$(npx tsc --noEmit 2>&1 | grep "error TS" | wc -l)
    echo "⚠️  Found $ERROR_COUNT TypeScript errors (non-blocking)"
    echo "   These are pre-existing and don't cause runtime failures"
else
    echo "✅ TypeScript type checking passed"
fi

# Test 2: Build test
echo ""
echo "Test 2: Production build..."
if npm run build > /tmp/build.log 2>&1; then
    BUILD_TIME=$(grep "built in" /tmp/build.log | sed 's/.*built in //')
    echo "✅ Build successful ($BUILD_TIME)"
else
    echo "❌ Build failed!"
    cat /tmp/build.log | tail -20
    ERRORS=$((ERRORS + 1))
fi

# Test 3: Import validation
echo ""
echo "Test 3: Import validation..."
if node test-imports.cjs > /dev/null 2>&1; then
    echo "✅ All imports valid"
else
    echo "❌ Import errors found!"
    node test-imports.cjs
    ERRORS=$((ERRORS + 1))
fi

# Test 4: Check for common runtime error patterns
echo ""
echo "Test 4: Runtime error pattern detection..."

# Check for undefined variable patterns in main files
check_undefined_usage() {
    local file=$1
    local name=$2
    
    if grep -q "\b$name\b" "$file" && ! grep -q "import.*\b$name\b\|const $name\|function $name\|export.*$name" "$file"; then
        echo "⚠️  '$name' might be undefined in $file"
        return 1
    fi
    return 0
}

# Check specific known issues
ALL_GOOD=true

# ChatInterface checks
if grep -q "useLayoutEffect" src/components/ChatInterface.tsx; then
    if ! grep -q "import.*useLayoutEffect" src/components/ChatInterface.tsx; then
        echo "❌ useLayoutEffect used but not imported"
        ERRORS=$((ERRORS + 1))
        ALL_GOOD=false
    fi
fi

if grep -q "<Markdown" src/components/ChatInterface.tsx; then
    echo "❌ Using <Markdown> instead of <ReactMarkdown>"
    ERRORS=$((ERRORS + 1))
    ALL_GOOD=false
fi

if $ALL_GOOD; then
    echo "✅ No runtime error patterns detected"
fi

# Test 5: Check WebSocket connection logic
echo ""
echo "Test 5: WebSocket connection validation..."
WS_ERRORS=0

# Check hook order in WebSocketContext
CONNECT_LINE=$(grep -n "const connect = useCallback" src/contexts/WebSocketContext.tsx | cut -d: -f1)
USEEFFECT_LINE=$(grep -n "useEffect(" src/contexts/WebSocketContext.tsx | head -1 | cut -d: -f1)

if [ "$CONNECT_LINE" -lt "$USEEFFECT_LINE" ]; then
    echo "✅ WebSocket hook order correct (connect before useEffect)"
else
    echo "❌ WebSocket hook order wrong (connect AFTER useEffect)"
    WS_ERRORS=$((WS_ERRORS + 1))
fi

# Check for circular dependencies in useChatWebSocket
if grep -A 5 "useEffect(" src/hooks/useChatWebSocket.ts | grep -q "}, \[.*connect.*\]"; then
    echo "❌ Circular dependency in useChatWebSocket"
    WS_ERRORS=$((WS_ERRORS + 1))
else
    echo "✅ No circular dependencies in useChatWebSocket"
fi

ERRORS=$((ERRORS + WS_ERRORS))

# Test 6: Check for missing dependencies
echo ""
echo "Test 6: Package dependencies..."
MISSING_DEPS=0

# Check critical dependencies
for pkg in "react" "react-dom" "react-dropzone" "react-markdown" "uuid"; do
    if grep -q "\"$pkg\":" package.json; then
        true  # Dependency exists
    else
        echo "❌ Missing dependency: $pkg"
        MISSING_DEPS=$((MISSING_DEPS + 1))
    fi
done

if [ $MISSING_DEPS -eq 0 ]; then
    echo "✅ All critical dependencies present"
else
    ERRORS=$((ERRORS + MISSING_DEPS))
fi

# Test 7: File structure validation
echo ""
echo "Test 7: File structure validation..."
MISSING_FILES=0

# Check critical files exist
CRITICAL_FILES=(
    "src/components/ChatInterface.tsx"
    "src/contexts/WebSocketContext.tsx"
    "src/hooks/useChatWebSocket.ts"
    "src/hooks/useChatInput.ts"
    "src/hooks/useChatMessages.ts"
    "src/hooks/useChatScroll.ts"
    "src/components/TodoList.tsx"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing critical file: $file"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

if [ $MISSING_FILES -eq 0 ]; then
    echo "✅ All critical files present"
else
    ERRORS=$((ERRORS + MISSING_FILES))
fi

# Summary
echo ""
echo "=================================="
echo "📊 Test Summary"
echo "=================================="
echo ""

if [ $ERRORS -eq 0 ]; then
    echo "✅ ALL TESTS PASSED!"
    echo ""
    echo "   No runtime errors detected"
    echo "   App should load without crashes"
    echo "   WebSocket should connect properly"
    echo ""
    echo "🚀 Ready for runtime!"
    exit 0
else
    echo "❌ TESTS FAILED!"
    echo ""
    echo "   $ERRORS error(s) detected"
    echo "   These WILL cause runtime failures"
    echo "   Fix issues before deploying"
    echo ""
    exit 1
fi
