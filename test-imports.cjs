#!/usr/bin/env node

/**
 * Import Validation Test
 * Checks for missing imports that would cause runtime errors
 */

const fs = require('fs');
const path = require('path');

let totalErrors = 0;
const errors = [];

function error(msg) {
  console.error(`❌ ${msg}`);
  errors.push(msg);
  totalErrors++;
}

function success(msg) {
  console.log(`✅ ${msg}`);
}

console.log('🔍 Import Validation Test');
console.log('==========================\n');

// Check 1: ChatInterface imports
console.log('📦 ChatInterface.tsx imports:');
const chatInterface = fs.readFileSync('src/components/ChatInterface.tsx', 'utf8');

// React hooks
if (chatInterface.includes('useLayoutEffect') && !chatInterface.match(/import.*useLayoutEffect/)) {
  error('useLayoutEffect used but not imported');
} else {
  success('useLayoutEffect properly imported');
}

// react-dropzone
if (chatInterface.includes('useDropzone') && !chatInterface.match(/import.*useDropzone/)) {
  error('useDropzone used but not imported');
} else {
  success('useDropzone properly imported');
}

// ReactMarkdown
if (chatInterface.match(/<Markdown[\s>]/)) {
  error('Using <Markdown> instead of <ReactMarkdown>');
} else if (chatInterface.includes('ReactMarkdown')) {
  success('ReactMarkdown properly used');
}

// TodoList
if (chatInterface.match(/<TodoList[\s>]/) && !chatInterface.match(/import.*TodoList/)) {
  error('TodoList used but not imported');
} else if (chatInterface.includes('TodoList')) {
  success('TodoList properly imported');
}

// Check 2: WebSocketContext hook order
console.log('\n📦 WebSocketContext.tsx hook order:');
const wsContext = fs.readFileSync('src/contexts/WebSocketContext.tsx', 'utf8');
const lines = wsContext.split('\n');

let connectLine = -1;
let useEffectLine = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const connect = useCallback')) {
    connectLine = i;
  }
  if (lines[i].trim().startsWith('useEffect(') && i < 100) {
    useEffectLine = i;
  }
}

if (connectLine !== -1 && useEffectLine !== -1) {
  if (connectLine < useEffectLine) {
    success(`connect defined before useEffect (${connectLine + 1} < ${useEffectLine + 1})`);
  } else {
    error(`connect defined AFTER useEffect (${connectLine + 1} > ${useEffectLine + 1})`);
  }
} else {
  error('Could not find connect or useEffect declarations');
}

// Check 3: useChatWebSocket circular deps
console.log('\n📦 useChatWebSocket.ts circular dependencies:');
const chatWS = fs.readFileSync('src/hooks/useChatWebSocket.ts', 'utf8');

// Look for connect/disconnect in useEffect dependencies
const hasCircular = chatWS.match(/useEffect\([^)]+\)[^}]*},\s*\[[^\]]*(?:connect|disconnect)/);
if (hasCircular) {
  error('Circular dependency: connect/disconnect in useEffect deps');
} else {
  success('No circular dependencies detected');
}

// Check 4: API module
console.log('\n📦 API module:');
if (fs.existsSync('src/utils/api.ts')) {
  const content = fs.readFileSync('src/utils/api.ts', 'utf8');
  if (content.length < 500) {
    error('api.ts exists but appears truncated');
  } else {
    success('api.ts exists with content');
  }
} else if (fs.existsSync('src/utils/api.js')) {
  success('api.js exists (allowJs mode)');
} else {
  error('No api module found!');
}

// Check 5: All custom hooks exported
console.log('\n📦 Custom hooks exports:');
const hooks = [
  'useChatInput',
  'useChatMessages', 
  'useChatScroll',
  'useChatWebSocket',
  'useCommandMenu'
];

for (const hook of hooks) {
  const filePath = `src/hooks/${hook}.ts`;
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.match(new RegExp(`export (function|const) ${hook}`))) {
      success(`${hook} exported`);
    } else {
      error(`${hook} not exported`);
    }
  } else {
    error(`${hook}.ts not found`);
  }
}

// Check 6: Chat components exported
console.log('\n📦 Chat components exports:');
const components = [
  'ChatInputArea',
  'ChatToolbar',
  'CodeBlock',
  'ImageAttachment',
  'MessageBubble',
  'MessageMarkdown',
  'ThinkingBlock',
  'ToolUseDisplay'
];

for (const comp of components) {
  const filePath = `src/components/chat/${comp}.tsx`;
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.match(new RegExp(`export (const|function|default) ${comp}`))) {
      success(`${comp} exported`);
    } else {
      error(`${comp} not exported`);
    }
  } else {
    error(`${comp}.tsx not found`);
  }
}

// Summary
console.log('\n==========================');
console.log('📊 Summary');
console.log('==========================');

if (totalErrors === 0) {
  console.log('✅ ALL CHECKS PASSED!');
  console.log('   No import/export issues detected.');
  console.log('   Runtime errors should not occur.');
  process.exit(0);
} else {
  console.log(`❌ ${totalErrors} ERROR(S) FOUND:`);
  errors.forEach((e, i) => console.log(`   ${i + 1}. ${e}`));
  console.log('\n   Fix these issues to prevent runtime errors!');
  process.exit(1);
}
