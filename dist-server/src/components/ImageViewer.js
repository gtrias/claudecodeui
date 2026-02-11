import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { authenticatedFetch } from '../utils/api';
const ImageViewer = ({ file, onClose }) => {
    const imagePath = `/api/projects/${file.projectName}/files/content?path=${encodeURIComponent(file.path)}`;
    const [imageUrl, setImageUrl] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        let objectUrl;
        const controller = new AbortController();
        const loadImage = async () => {
            try {
                setLoading(true);
                setError(null);
                setImageUrl(null);
                const response = await authenticatedFetch(imagePath, {
                    signal: controller.signal
                });
                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }
                const blob = await response.blob();
                objectUrl = URL.createObjectURL(blob);
                setImageUrl(objectUrl);
            }
            catch (err) {
                if (err.name === 'AbortError') {
                    return;
                }
                console.error('Error loading image:', err);
                setError('Unable to load image');
            }
            finally {
                setLoading(false);
            }
        };
        loadImage();
        return () => {
            controller.abort();
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [imagePath]);
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: file.name }), _jsx(Button, { variant: "ghost", size: "sm", onClick: onClose, className: "h-8 w-8 p-0", children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsxs("div", { className: "p-4 flex justify-center items-center bg-gray-50 dark:bg-gray-900 min-h-[400px]", children: [loading && (_jsx("div", { className: "text-center text-gray-500 dark:text-gray-400", children: _jsx("p", { children: "Loading image\u2026" }) })), !loading && imageUrl && (_jsx("img", { src: imageUrl, alt: file.name, className: "max-w-full max-h-[70vh] object-contain rounded-lg shadow-md" })), !loading && !imageUrl && (_jsxs("div", { className: "text-center text-gray-500 dark:text-gray-400", children: [_jsx("p", { children: error || 'Unable to load image' }), _jsx("p", { className: "text-sm mt-2 break-all", children: file.path })] }))] }), _jsx("div", { className: "p-4 border-t bg-gray-50 dark:bg-gray-800", children: _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: file.path }) })] }) }));
};
export default ImageViewer;
