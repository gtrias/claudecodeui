import React, { useState, useEffect } from 'react';

/**
 * Props for ImageAttachment component
 */
export interface ImageAttachmentProps {
  /** The image file to display */
  file: File;
  /** Callback when user clicks remove button */
  onRemove: () => void;
  /** Upload progress percentage (0-100) */
  uploadProgress?: number;
  /** Error message if upload failed */
  error?: string;
}

/**
 * ImageAttachment - Displays image preview with upload progress and remove option
 * 
 * Features:
 * - Auto-generated preview using object URL
 * - Upload progress indicator
 * - Error state display
 * - Remove button on hover
 * - Automatic cleanup of object URLs
 */
export const ImageAttachment: React.FC<ImageAttachmentProps> = ({ 
  file, 
  onRemove, 
  uploadProgress, 
  error 
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  
  // Create and cleanup object URL for preview
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  
  return (
    <div className="relative group">
      <img 
        src={preview || ''} 
        alt={file.name} 
        className="w-20 h-20 object-cover rounded" 
      />
      
      {/* Upload progress overlay */}
      {uploadProgress !== undefined && uploadProgress < 100 && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-white text-xs">{uploadProgress}%</div>
        </div>
      )}
      
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
          <svg 
            className="w-6 h-6 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </div>
      )}
      
      {/* Remove button (visible on hover) */}
      <button
        onClick={onRemove}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Remove image"
      >
        <svg 
          className="w-3 h-3" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M6 18L18 6M6 6l12 12" 
          />
        </svg>
      </button>
    </div>
  );
};

export default ImageAttachment;
