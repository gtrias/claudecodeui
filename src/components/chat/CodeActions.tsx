import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Props for CodeActions component
 */
export interface CodeActionsProps {
  /** Code text to copy */
  code: string;
  /** Programming language (for display) */
  language?: string;
  /** Additional CSS classes */
  className?: string;
  /** Callback when copy is successful */
  onCopySuccess?: () => void;
  /** Show apply button (for diffs/patches) */
  showApply?: boolean;
  /** Callback when apply is clicked */
  onApply?: () => void;
}

/**
 * CodeActions - Action buttons for code blocks (copy, apply, etc.)
 * 
 * Features:
 * - Copy to clipboard with fallback
 * - Visual feedback on copy success
 * - Apply button for diffs/patches
 * - Responsive positioning
 * - Keyboard accessible
 */
export const CodeActions: React.FC<CodeActionsProps> = ({
  code,
  language,
  className = '',
  onCopySuccess,
  showApply = false,
  onApply
}) => {
  const { t } = useTranslation('chat');
  const [copied, setCopied] = useState(false);

  /**
   * Copy code to clipboard with multiple fallback strategies
   */
  const handleCopy = () => {
    const doSet = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      if (onCopySuccess) {
        onCopySuccess();
      }
    };

    try {
      // Modern clipboard API
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(code)
          .then(doSet)
          .catch(() => {
            // Fallback to textarea method
            copyViaTextarea(code, doSet);
          });
      } else {
        // Fallback for older browsers
        copyViaTextarea(code, doSet);
      }
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  /**
   * Fallback copy method using hidden textarea
   */
  const copyViaTextarea = (text: string, callback: () => void) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    ta.style.top = '0';
    ta.style.left = '0';
    document.body.appendChild(ta);
    ta.select();
    
    try {
      document.execCommand('copy');
      callback();
    } catch (error) {
      console.error('Fallback copy failed:', error);
    } finally {
      document.body.removeChild(ta);
    }
  };

  return (
    <div className={`absolute top-2 right-2 z-10 flex gap-2 ${className}`}>
      {/* Apply button (for diffs) */}
      {showApply && onApply && (
        <button
          type="button"
          onClick={onApply}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-xs px-2 py-1 rounded-md bg-primary/80 hover:bg-primary text-primary-foreground border border-primary"
          title={t('codeBlock.apply') || 'Apply'}
          aria-label={t('codeBlock.apply') || 'Apply'}
        >
          <span className="flex items-center gap-1">
            <svg 
              className="w-3.5 h-3.5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
            {t('codeBlock.apply') || 'Apply'}
          </span>
        </button>
      )}

      {/* Copy button */}
      <button
        type="button"
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 active:opacity-100 transition-opacity text-xs px-2 py-1 rounded-md bg-gray-700/80 hover:bg-gray-700 text-white border border-gray-600"
        title={copied ? t('codeBlock.copied') : t('codeBlock.copyCode')}
        aria-label={copied ? t('codeBlock.copied') : t('codeBlock.copyCode')}
      >
        {copied ? (
          <span className="flex items-center gap-1">
            <svg 
              className="w-3.5 h-3.5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
            {t('codeBlock.copied')}
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <svg 
              className="w-3.5 h-3.5" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            {t('codeBlock.copy')}
          </span>
        )}
      </button>
    </div>
  );
};

export default CodeActions;
