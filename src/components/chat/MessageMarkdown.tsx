import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { normalizeInlineCodeFences } from '../../utils/chatUtils';

/**
 * Props for MessageMarkdown component
 */
export interface MessageMarkdownProps {
  /** Markdown content to render */
  children?: string;
  /** Additional CSS classes */
  className?: string;
  /** Custom markdown components (for code blocks, etc.) */
  components?: Record<string, React.ComponentType<any>>;
}

/**
 * MessageMarkdown - Render markdown content with plugins
 * 
 * Features:
 * - GitHub Flavored Markdown (remarkGfm)
 * - Math equations (remarkMath + rehypeKatex)
 * - Inline code fence normalization
 * - Custom component overrides
 * - LaTeX support
 */
export const MessageMarkdown: React.FC<MessageMarkdownProps> = ({ 
  children, 
  className,
  components 
}) => {
  // Normalize inline code fences before rendering
  const content = normalizeInlineCodeFences(String(children ?? ''));
  
  // Memoize plugin arrays for performance
  const remarkPlugins = useMemo(() => [remarkGfm, remarkMath], []);
  const rehypePlugins = useMemo(() => [rehypeKatex], []);

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MessageMarkdown;
