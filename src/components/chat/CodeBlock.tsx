import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../../contexts/ThemeContext';
import { CodeActions } from './CodeActions';
import { extractRawText, detectLanguageFromClassName, resolveLanguageAlias } from '../../utils/markdownUtils';

/**
 * Props for CodeBlock component (from react-markdown)
 */
export interface CodeBlockProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

/**
 * CodeBlock - Syntax highlighted code block with copy functionality
 * 
 * Features:
 * - Inline code rendering for single-line code
 * - Syntax highlighting with Prism
 * - Copy button with visual feedback
 * - Language detection from className
 * - Dark/light theme support
 * - Responsive styling
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({ 
  node, 
  inline, 
  className, 
  children, 
  ...props 
}) => {
  const { t } = useTranslation('chat');
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);

  // Extract raw text from children
  const raw = extractRawText(children);
  const looksMultiline = /[\r\n]/.test(raw);
  const inlineDetected = inline || (node && node.type === 'inlineCode');
  const shouldInline = inlineDetected || !looksMultiline;

  // Inline code rendering
  if (shouldInline) {
    return (
      <code
        className={`font-mono text-[0.9em] px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-900 border border-gray-200 dark:bg-gray-800/60 dark:text-gray-100 dark:border-gray-700 whitespace-pre-wrap break-words ${
          className || ''
        }`}
        {...props}
      >
        {children}
      </code>
    );
  }

  // Block code rendering with syntax highlighting
  const match = /language-(\w+)/.exec(className || '');
  const detectedLang = match ? match[1] : detectLanguageFromClassName(className);
  const language = detectedLang ? resolveLanguageAlias(detectedLang) : 'text';

  return (
    <div className="relative group my-2">
      {/* Language label */}
      {language && language !== 'text' && (
        <div className="absolute top-2 left-3 z-10 text-xs text-gray-400 font-medium uppercase">
          {language}
        </div>
      )}

      {/* Copy button */}
      <CodeActions
        code={raw}
        language={language}
        onCopySuccess={() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      />

      {/* Syntax highlighted code */}
      <SyntaxHighlighter
        language={language}
        style={theme === 'dark' ? vscDarkPlus : prism}
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          padding: '1rem',
          paddingTop: language && language !== 'text' ? '2rem' : '1rem'
        }}
        showLineNumbers={false}
        wrapLines={false}
        {...props}
      >
        {raw}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlock;
