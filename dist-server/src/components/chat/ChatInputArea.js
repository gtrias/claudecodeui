import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { ImageAttachment } from './ImageAttachment';
/**
 * ChatInputArea - Text input area for chat messages
 *
 * Features:
 * - Auto-resizing textarea
 * - Image attachment support
 * - Paste and drag-drop for images
 * - Submit button with loading state
 * - Keyboard shortcuts (Enter to send, Shift+Enter for newline)
 * - Character limit indicator
 * - File picker button
 */
export const ChatInputArea = ({ value, onChange, onSubmit, isSubmitting = false, placeholder, images = [], onRemoveImage, onPaste, onDrop, onDragOver, fileInputRef, onFileSelect, textareaRef, maxHeight = 200, className = '' }) => {
    const { t } = useTranslation('chat');
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (value.trim() && !isSubmitting) {
                onSubmit();
            }
        }
    };
    return (_jsx("div", { className: `border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${className}`, children: _jsxs("div", { className: "max-w-4xl mx-auto p-4", children: [images.length > 0 && (_jsx("div", { className: "mb-3 flex flex-wrap gap-2", children: images.map((image, idx) => (_jsx(ImageAttachment, { src: image.preview, onRemove: () => onRemoveImage?.(idx), size: "small" }, idx))) })), _jsxs("div", { className: "relative rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all", onDrop: onDrop, onDragOver: onDragOver, children: [_jsx("textarea", { ref: textareaRef, value: value, onChange: (e) => onChange(e.target.value), onKeyDown: handleKeyDown, onPaste: onPaste, placeholder: placeholder || t('input.placeholder') || 'Type a message...', disabled: isSubmitting, className: "w-full px-4 py-3 pr-24 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none", style: { maxHeight: `${maxHeight}px` }, rows: 1 }), _jsxs("div", { className: "absolute bottom-2 right-2 flex items-center gap-1", children: [fileInputRef && onFileSelect && (_jsxs(_Fragment, { children: [_jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", multiple: true, onChange: (e) => e.target.files && onFileSelect(e.target.files), className: "hidden" }), _jsx("button", { type: "button", onClick: () => fileInputRef.current?.click(), disabled: isSubmitting, className: "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", title: t('input.attachImage') || 'Attach image', children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" }) }) })] })), _jsx("button", { type: "button", onClick: onSubmit, disabled: !value.trim() || isSubmitting, className: "p-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white disabled:text-gray-500 disabled:cursor-not-allowed transition-colors", title: t('input.send') || 'Send', children: isSubmitting ? (_jsxs("svg", { className: "w-5 h-5 animate-spin", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] })) : (_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8" }) })) })] })] }), _jsxs("div", { className: "mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400", children: [_jsx("span", { children: t('input.hint') || 'Press Enter to send, Shift+Enter for newline' }), value.length > 0 && (_jsxs("span", { className: "font-mono", children: [value.length, " ", t('input.characters') || 'characters'] }))] })] }) }));
};
export default ChatInputArea;
