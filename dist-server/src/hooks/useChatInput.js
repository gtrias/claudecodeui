import { useState, useRef, useCallback } from 'react';
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
export function useChatInput(props) {
    const { onSubmit, onImagesAttached, onImageUploadComplete, maxImages = 10, autoResize = true, sendByCtrlEnter = false } = props || {};
    const [inputText, setInputText] = useState('');
    const [attachedImages, setAttachedImages] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const textareaRef = useRef(null);
    /**
     * Auto-resize textarea to fit content
     */
    const resizeTextarea = useCallback(() => {
        if (!autoResize || !textareaRef.current)
            return;
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }, [autoResize]);
    /**
     * Handle textarea input change
     */
    const handleInputChange = useCallback((e) => {
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
    const handleSubmit = useCallback((e) => {
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
    const processImageFiles = useCallback(async (files) => {
        if (attachedImages.length >= maxImages) {
            console.warn(`Maximum ${maxImages} images allowed`);
            return;
        }
        const imageFiles = [];
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
    const handlePaste = useCallback(async (e) => {
        const items = e.clipboardData?.items;
        if (!items)
            return;
        const files = [];
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
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);
    /**
     * Handle drop event to capture dropped images
     */
    const handleDrop = useCallback(async (e) => {
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
    const removeImage = useCallback((index) => {
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
