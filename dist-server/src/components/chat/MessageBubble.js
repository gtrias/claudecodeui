import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MessageMarkdown } from './MessageMarkdown';
/**
 * MessageBubble - Render a chat message with role-based styling
 *
 * Features:
 * - Role-based styling (user vs assistant)
 * - Markdown rendering
 * - Timestamp display
 * - Provider badge
 * - Streaming indicator
 * - Image attachments
 * - Custom markdown components
 */
export const MessageBubble = ({ role, content, timestamp, provider, isStreaming = false, images, markdownComponents, className = '', children }) => {
    const isUser = role === 'user';
    const isAssistant = role === 'assistant';
    return (_jsxs("div", { className: `flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} ${className}`, children: [_jsx("div", { className: "flex-shrink-0", children: isUser ? (_jsx("div", { className: "w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm", children: "U" })) : (_jsx("div", { className: "w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-medium text-sm", children: "AI" })) }), _jsxs("div", { className: `flex-1 min-w-0 ${isUser ? 'items-end' : 'items-start'} flex flex-col`, children: [(timestamp || provider) && (_jsxs("div", { className: `flex items-center gap-2 mb-1 text-xs text-gray-500 dark:text-gray-400 ${isUser ? 'flex-row-reverse' : 'flex-row'}`, children: [timestamp && (_jsx("span", { children: new Date(timestamp).toLocaleTimeString() })), provider && (_jsx("span", { className: "px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono", children: provider }))] })), _jsxs("div", { className: `rounded-lg px-4 py-3 max-w-[85%] ${isUser
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'}`, children: [images && images.length > 0 && (_jsx("div", { className: "mb-2 flex flex-wrap gap-2", children: images.map((image, idx) => (_jsx("img", { src: image.url || image.source?.url, alt: image.alt || 'Attachment', className: "max-w-xs rounded border border-gray-200 dark:border-gray-700" }, idx))) })), content && (_jsx(MessageMarkdown, { components: markdownComponents, className: isUser ? 'prose-invert' : '', children: content })), isStreaming && (_jsxs("span", { className: "inline-flex items-center gap-1 ml-2", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-current animate-pulse" }), _jsx("span", { className: "w-2 h-2 rounded-full bg-current animate-pulse", style: { animationDelay: '0.2s' } }), _jsx("span", { className: "w-2 h-2 rounded-full bg-current animate-pulse", style: { animationDelay: '0.4s' } })] })), children] })] })] }));
};
export default MessageBubble;
