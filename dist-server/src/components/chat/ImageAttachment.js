import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
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
export const ImageAttachment = ({ file, onRemove, uploadProgress, error }) => {
    const [preview, setPreview] = useState(null);
    // Create and cleanup object URL for preview
    useEffect(() => {
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);
    return (_jsxs("div", { className: "relative group", children: [_jsx("img", { src: preview || '', alt: file.name, className: "w-20 h-20 object-cover rounded" }), uploadProgress !== undefined && uploadProgress < 100 && (_jsx("div", { className: "absolute inset-0 bg-black/50 flex items-center justify-center", children: _jsxs("div", { className: "text-white text-xs", children: [uploadProgress, "%"] }) })), error && (_jsx("div", { className: "absolute inset-0 bg-red-500/50 flex items-center justify-center", children: _jsx("svg", { className: "w-6 h-6 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })), _jsx("button", { onClick: onRemove, className: "absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity", "aria-label": "Remove image", children: _jsx("svg", { className: "w-3 h-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }));
};
export default ImageAttachment;
