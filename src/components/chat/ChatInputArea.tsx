import React from 'react';
import { useTranslation } from 'react-i18next';
import { ImageAttachment } from './ImageAttachment';

/**
 * Props for ChatInputArea component
 */
export interface ChatInputAreaProps {
  /** Input value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Submit handler */
  onSubmit: () => void;
  /** Whether currently submitting */
  isSubmitting?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Image attachments */
  images?: Array<{ file: File; preview: string }>;
  /** Remove image callback */
  onRemoveImage?: (index: number) => void;
  /** Paste handler (for images) */
  onPaste?: (e: React.ClipboardEvent) => void;
  /** Drop handler (for images) */
  onDrop?: (e: React.DragEvent) => void;
  /** Drag over handler */
  onDragOver?: (e: React.DragEvent) => void;
  /** File input ref */
  fileInputRef?: React.RefObject<HTMLInputElement>;
  /** Handle file selection */
  onFileSelect?: (files: FileList) => void;
  /** Textarea ref */
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  /** Max height for textarea */
  maxHeight?: number;
  /** Additional CSS classes */
  className?: string;
}

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
export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  value,
  onChange,
  onSubmit,
  isSubmitting = false,
  placeholder,
  images = [],
  onRemoveImage,
  onPaste,
  onDrop,
  onDragOver,
  fileInputRef,
  onFileSelect,
  textareaRef,
  maxHeight = 200,
  className = ''
}) => {
  const { t } = useTranslation('chat');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isSubmitting) {
        onSubmit();
      }
    }
  };

  return (
    <div className={`border-t border-border bg-card ${className}`}>
      <div className="max-w-4xl mx-auto p-4">
        {/* Image previews */}
        {images.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {images.map((image, idx) => (
              <ImageAttachment
                key={idx}
                src={image.preview}
                onRemove={() => onRemoveImage?.(idx)}
                size="small"
              />
            ))}
          </div>
        )}

        {/* Input container - Industrial recessed style */}
        <div 
          className="relative input-recessed p-1 transition-all"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={onPaste}
            placeholder={placeholder || t('input.placeholder') || 'Type a message...'}
            disabled={isSubmitting}
            className="w-full px-4 py-3 pr-24 bg-transparent text-foreground placeholder-muted-foreground resize-none focus:outline-none"
            style={{ maxHeight: `${maxHeight}px` }}
            rows={1}
          />

          {/* Action buttons */}
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            {/* File picker - Tactile ghost button */}
            {fileInputRef && onFileSelect && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => e.target.files && onFileSelect(e.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="btn-tactile p-2 text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('input.attachImage') || 'Attach image'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </>
            )}

            {/* Submit button - Acid Yellow Tactile */}
            <button
              type="button"
              onClick={onSubmit}
              disabled={!value.trim() || isSubmitting}
              className="btn-tactile btn-tactile-acid p-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted disabled:border-border disabled:text-muted-foreground"
              title={t('input.send') || 'Send'}
            >
              {isSubmitting ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Helper text */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {t('input.hint') || 'Press Enter to send, Shift+Enter for newline'}
          </span>
          {value.length > 0 && (
            <span className="font-mono">
              {value.length} {t('input.characters') || 'characters'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInputArea;
