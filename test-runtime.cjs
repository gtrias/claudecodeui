#!/usr/bin/env node

/**
 * Runtime Error Detection Test
 * Validates that all imports and dependencies are properly defined
 */

const fs = require('fs');
const path = require('path');

let totalChecks = 0;
let totalErrors = 0;
const errors = [];

function log(message, isError = false) {
  if (isError) {
    console.error(`❌ ${message}`);
    errors.push(message);
    totalErrors++;
  } else {
    console.log(`✅ ${message}`);
  }
  totalChecks++;
}

console.log('🔍 Runtime Error Detection Test');
console.log('================================\n');

// Test 1: Check React imports in ChatInterface
console.log('Test 1: React imports in ChatInterface.tsx');
const chatInterface = fs.readFileSync('src/components/ChatInterface.tsx', 'utf8');

if (chatInterface.match(/import React.*useLayoutEffect/)) {
  log('useLayoutEffect is imported');
} else {
  log('useLayoutEffect is NOT imported', true);
}

// Test 2: Check useDropzone import
if (chatInterface.match(/import.*useDropzone.*from ['"]react-dropzone['"]/)) {
  log('useDropzone is imported');
} else {
  log('useDropzone is NOT imported', true);
}

// Test 3: Check ReactMarkdown usage (not Markdown)
const markdownUsage = chatInterface.match(/<Markdown[^>]/g);
if (markdownUsage && markdownUsage.length > 0) {
  log(`Found ${markdownUsage.length} uses of <Markdown> (should be <ReactMarkdown>)`, true);
} else {
  log('No invalid <Markdown> usage found');
}

// Test 4: Check TodoList import
if (chatInterface.match(/import.*TodoList.*from/)) {
  log('TodoList is imported');
} else {
  log('TodoList is NOT imported', true);
}

// Test 5: Check WebSocket connect definition order
console.log('\nTest 5: WebSocket hook declaration order');
const wsContext = fs.readFileSync('src/contexts/WebSocketContext.tsx', 'utf8');

const connectDefLine = wsContext.split('\n').findIndex(line => 
  line.includes('const connect = useCallback')
);
const useEffectLine = wsContext.split('\n').findIndex(line => 
  line.trim().startsWith('useEffect(') && line.includes('connect')
);

if (connectDefLine < useEffectLine) {
  log(`connect defined at line ${connectDefLine + 1}, useEffect at line ${useEffectLine + 1} - CORRECT ORDER`);
} else if (connectDefLine > useEffectLine) {
  log(`connect defined at line ${connectDefLine + 1}, useEffect at line ${useEffectLine + 1} - WRONG ORDER!`, true);
} else {
  log('Could not determine hook order', true);
}

// Test 6: Check useChatWebSocket circular dependency
console.log('\nTest 6: useChatWebSocket circular dependency');
const useChatWS = fs.readFileSync('src/hooks/useChatWebSocket.ts', 'utf8');

// Check if connect/disconnect are in useEffect deps
const hasCircularDep = useChatWS.match(/useEffect\([^)]+\)[^,]*,\s*\[[^\]]*(?:connect|disconnect)[^\]]*\]/);
if (hasCircularDep) {
  log('Found connect/disconnect in useEffect dependencies - CIRCULAR DEPENDENCY!', true);
} else {
  log('No circular dependency in useEffect');
}

// Test 7: Check for undefined component usage
console.log('\nTest 7: Component import validation');

function checkComponentImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  
  // Extract JSX components used
  const jsxComponents = content.match(/<([A-Z][a-zA-Z0-9]*)/g);
  if (!jsxComponents) return;
  
  const uniqueComponents = [...new Set(jsxComponents.map(c => c.slice(1)))];
  
  for (const comp of uniqueComponents) {
    // Skip built-in types
    if (comp.match(/^(HTML|SVG|WebGL|NodeJS|React)/)) continue;
    
    // Check if imported or defined
    const isImported = content.match(new RegExp(`import.*\\b${comp}\\b`));
    const isDefined = content.match(new RegExp(`^(const|function|export|interface|type)\\s+${comp}\\b`, 'm'));
    
    if (!isImported && !isDefined) {
      log(`${fileName}: Component '${comp}' used but not imported/defined`, true);
    }
  }
}

checkComponentImports('src/components/ChatInterface.tsx');
checkComponentImports('src/contexts/WebSocketContext.tsx');

// Test 8: Check for missing api.ts/api.js
console.log('\nTest 8: API module check');
if (fs.existsSync('src/utils/api.ts')) {
  const apiContent = fs.readFileSync('src/utils/api.ts', 'utf8');
  if (apiContent.length < 1000) {
    log('api.ts exists but seems truncated/incomplete', true);
  } else {
    log('api.ts exists and has content');
  }
} else if (fs.existsSync('src/utils/api.js')) {
  log('Using api.js (allowJs mode)');
} else {
  log('No api.ts or api.js found!', true);
}

// Test 9: Check all custom hooks are properly exported
console.log('\nTest 9: Custom hooks export validation');
const hooks = [
  'src/hooks/useChatInput.ts',
  'src/hooks/useChatMessages.ts',
  'src/hooks/useChatScroll.ts',
  'src/hooks/useChatWebSocket.ts',
  'src/hooks/useCommandMenu.ts'
];

for (const hookPath of hooks) {
  if (fs.existsSync(hookPath)) {
    const content = fs.readFileSync(hookPath, 'utf8');
    const hookName = path.basename(hookPath, '.ts');
    
    if (content.match(new RegExp(`export (function|const) ${hookName}`))) {
      log(`${hookName} is properly exported`);
    } else {
      log(`${hookName} export not found`, true);
    }
  }
}

// Test 10: Build verification
console.log('\nTest 10: Build check');
const { execSync } = require('child_process');
try {
  console.log('Running build...');
  execSync('npm run build', { stdio: 'pipe', timeout: 30000 });
  log('Build completed successfully');
} catch (error) {
  log('Build failed!', true);
  console.error(error.stdout?.toString() || error.message);
}

// Summary
console.log('\n================================');
console.log('📊 Test Summary');
console.log('================================');
console.log(`Total checks: ${totalChecks}`);
console.log(`Errors found: ${totalErrors}`);

if (totalErrors === 0) {
  console.log('\n✅ ALL TESTS PASSED! No runtime errors detected.');
  process.exit(0);
} else {
  console.log('\n❌ TESTS FAILED! Runtime errors detected:');
  errors.forEach((err, i) => {
    console.log(`  ${i + 1}. ${err}`);
  });
  process.exit(1);
}
