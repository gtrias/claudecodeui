/**
 * Markdown utility functions and configurations for rendering
 */

import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';

/**
 * Standard remark plugins for markdown processing
 * - remarkGfm: GitHub Flavored Markdown support
 * - remarkBreaks: Convert line breaks to <br> tags
 * - remarkMath: Math equation support
 */
export const remarkPlugins = [remarkGfm, remarkBreaks, remarkMath];

/**
 * Standard rehype plugins for HTML processing
 * - rehypeKatex: Render KaTeX math equations
 * - rehypeRaw: Allow raw HTML in markdown
 */
export const rehypePlugins = [rehypeKatex, rehypeRaw];

/**
 * Detect language from className string
 * Handles formats like: "language-javascript" or "lang-python"
 */
export function detectLanguageFromClassName(className?: string): string | null {
  if (!className) return null;
  
  const match = className.match(/language-(\w+)|lang-(\w+)/);
  return match ? (match[1] || match[2]) : null;
}

/**
 * Check if code block should be displayed inline
 * Based on node type and content analysis
 */
export function shouldDisplayInline(inline?: boolean, node?: any, raw?: string): boolean {
  if (inline !== undefined) return inline;
  if (node && node.type === 'inlineCode') return true;
  if (raw && !/[\r\n]/.test(raw)) return true;
  return false;
}

/**
 * Extract raw text content from React children
 * Handles arrays and single values
 */
export function extractRawText(children: any): string {
  if (!children) return '';
  if (Array.isArray(children)) return children.join('');
  return String(children ?? '');
}

/**
 * Syntax highlighting language aliases
 * Maps common aliases to standard language identifiers
 */
export const languageAliases: Record<string, string> = {
  'js': 'javascript',
  'ts': 'typescript',
  'jsx': 'javascript',
  'tsx': 'typescript',
  'py': 'python',
  'rb': 'ruby',
  'sh': 'bash',
  'yml': 'yaml',
  'md': 'markdown',
  'html': 'markup',
  'xml': 'markup',
};

/**
 * Resolve language alias to standard name
 */
export function resolveLanguageAlias(lang: string): string {
  return languageAliases[lang.toLowerCase()] || lang;
}

/**
 * Check if language supports syntax highlighting
 */
export function isSupportedLanguage(lang?: string): boolean {
  if (!lang) return false;
  
  const supportedLangs = [
    'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp',
    'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala',
    'bash', 'shell', 'powershell', 'sql', 'html', 'css', 'scss',
    'json', 'yaml', 'xml', 'markdown', 'jsx', 'tsx'
  ];
  
  return supportedLangs.includes(lang.toLowerCase());
}

/**
 * Parse frontmatter from markdown
 * Returns { frontmatter, content }
 */
export function parseFrontmatter(markdown: string): { frontmatter: Record<string, any>, content: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);
  
  if (!match) {
    return { frontmatter: {}, content: markdown };
  }
  
  const [, frontmatterStr, content] = match;
  const frontmatter: Record<string, any> = {};
  
  // Simple key-value parsing
  frontmatterStr.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      frontmatter[key.trim()] = valueParts.join(':').trim();
    }
  });
  
  return { frontmatter, content };
}
