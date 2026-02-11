import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { normalizeInlineCodeFences } from '../../utils/chatUtils';
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
export const MessageMarkdown = ({ children, className, components }) => {
    // Normalize inline code fences before rendering
    const content = normalizeInlineCodeFences(String(children ?? ''));
    // Memoize plugin arrays for performance
    const remarkPlugins = useMemo(() => [remarkGfm, remarkMath], []);
    const rehypePlugins = useMemo(() => [rehypeKatex], []);
    return (_jsx("div", { className: className, children: _jsx(ReactMarkdown, { remarkPlugins: remarkPlugins, rehypePlugins: rehypePlugins, components: components, children: content }) }));
};
export default MessageMarkdown;
