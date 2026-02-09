import { useState, useRef, useCallback, ChangeEvent, KeyboardEvent, ClipboardEvent, DragEvent } from 'react';

/**
 * Image file with upload metadata
 */
export interface ImageFile {
  file: File;
  preview?: string;
  uploaded?: boolean;
  uploadProgress?: number;
  error?: string;
}

/**
 * Props for useChatInput hook
 */
export interface UseChatInputProps {
  /** Callback when user submits message */
  onSubmit?: (text: string, images: ImageFile[]) => void;
  /** Callback when images are attached */
  onImagesAttached?: (images: ImageFile[]) => void;
  /** Callback when image upload completes */
  onImageUploadComplete?: (imageData: any) => void;
  /** Maximum number of images allowed */
  maxImages?: number;
  /** Auto-resize textarea */
  autoResize?: boolean;
  /** Send on Ctrl+Enter instead of Enter */
  sendByCtrlEnter?: boolean;
}

/**
 * Return type for useChatInput hook
 */
export interface UseChatInputReturn {
  /** Current input text */
  inputText: string;
  /** Set input text */
  setInputText: (text: string) => void;
  /** Attached images */
  attachedImages: ImageFile[];
  /** Set attached images */
  setAttachedImages: (images: ImageFile[] | ((prev: ImageFile[]) => ImageFile[])) => void;
  /** Ref for textarea element */
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  /** Whether currently uploading */
  isUploading: boolean;
  /** Handle textarea input change */
  handleInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  /** Handle form submit */
  handleSubmit: (e?: any) => void;
  /** Handle paste event (for images) */
  handlePaste: (e: ClipboardEvent) => Promise<void>;
  /** Handle drag over */
  handleDragOver: (e: DragEvent) => void;
  /** Handle drop (for images) */
  handleDrop: (e: DragEvent) => Promise<void>;
  /** Remove attached image */
  removeImage: (index: number) => void;
  /** Clear input and attachments */
  clearInput: () => void;
  /** Focus the textarea */
  focusInput: () => void;
  /** Auto-resize textarea to fit content */
  resizeTextarea: () => void;
}

/**
 * Custom hook for managing chat input state and interactions
 * 
 * Features:
 * - Text input management
 * - Image attachment handling
 * - Paste and drag-drop support for images
 * - Auto-resize textarea
 * - Keyboard shortcuts (Enter/Ctrl+Enter)
 * - Upload progress tracking
 * 
 * @example
 * ```tsx
 * const {
 *   inputText,
 *   attachedImages,
 *   textareaRef,
 *   handleInputChange,
 *   handleSubmit,
 *   handlePaste,
 *   removeImage
 * } = useChatInput({
 *   onSubmit: (text, images) => sendMessage(text, images),
 *   maxImages: 5
 * });
 * ```
 */
export function useChatInput(props?: UseChatInputProps): UseChatInputReturn {
  const {
    onSubmit,
    onImagesAttached,
    onImageUploadComplete,
    maxImages = 10,
    autoResize = true,
    sendByCtrlEnter = false
  } = props || {};

  const [inputText, setInputText] = useState('');
  const [attachedImages, setAttachedImages] = useState<ImageFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Auto-resize textarea to fit content
   */
  const resizeTextarea = useCallback(() => {
    if (!autoResize || !textareaRef.current) return;

    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
  }, [autoResize]);

  /**
   * Handle textarea input change
   */
  const handleInputChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    resizeTextarea();
  }, [resizeTextarea]);

  /**
   * Clear input and reset textarea size
   */
  const clearInput = useCallback(() => {
    setInputText('');
    setAttachedImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, []);

  /**
   * Handle form submit
   */
  const handleSubmit = useCallback((e?: any) => {
    if (e) {
      e.preventDefault();
    }

    const trimmedText = inputText.trim();
    if (!trimmedText && attachedImages.length === 0) {
      return;
    }

    // Call submit callback
    if (onSubmit) {
      onSubmit(trimmedText, attachedImages);
    }

    // Clear input
    clearInput();
  }, [inputText, attachedImages, onSubmit, clearInput]);

  /**
   * Process image files and add to attachments
   */
  const processImageFiles = useCallback(async (files: File[]) => {
    if (attachedImages.length >= maxImages) {
      console.warn(`Maximum ${maxImages} images allowed`);
      return;
    }

    const imageFiles: ImageFile[] = [];
    
    for (const file of files) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        console.warn('Only image files are supported');
        continue;
      }

      // Check max images limit
      if (attachedImages.length + imageFiles.length >= maxImages) {
        break;
      }

      imageFiles.push({
        file,
        uploaded: false,
        uploadProgress: 0
      });
    }

    if (imageFiles.length > 0) {
      setAttachedImages(prev => [...prev, ...imageFiles]);
      
      if (onImagesAttached) {
        onImagesAttached(imageFiles);
      }
    }
  }, [attachedImages.length, maxImages, onImagesAttached]);

  /**
   * Handle paste event to capture pasted images
   */
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      await processImageFiles(files);
    }
  }, [processImageFiles]);

  /**
   * Handle drag over to allow drop
   */
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  /**
   * Handle drop event to capture dropped images
   */
  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processImageFiles(files);
    }
  }, [processImageFiles]);

  /**
   * Remove image at specified index
   */
  const removeImage = useCallback((index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Focus the textarea
   */
  const focusInput = useCallback(() => {
    textareaRef.current?.focus();
  }, []);

  return {
    inputText,
    setInputText,
    attachedImages,
    setAttachedImages,
    textareaRef,
    isUploading,
    handleInputChange,
    handleSubmit,
    handlePaste,
    handleDragOver,
    handleDrop,
    removeImage,
    clearInput,
    focusInput,
    resizeTextarea
  };
}

export default useChatInput;
