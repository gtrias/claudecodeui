import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Eye, Settings2, Moon, Sun, ArrowDown, Mic, Brain, Sparkles, FileText, Languages, GripVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DarkModeToggle from './DarkModeToggle';
import { useTheme } from '../contexts/ThemeContext';
import LanguageSelector from './LanguageSelector';
const QuickSettingsPanel = ({ isOpen, onToggle, autoExpandTools, onAutoExpandChange, showRawParameters, onShowRawParametersChange, showThinking, onShowThinkingChange, autoScrollToBottom, onAutoScrollChange, sendByCtrlEnter, onSendByCtrlEnterChange, isMobile }) => {
    const { t } = useTranslation('settings');
    const [localIsOpen, setLocalIsOpen] = useState(isOpen);
    const [whisperMode, setWhisperMode] = useState(() => {
        return localStorage.getItem('whisperMode') || 'default';
    });
    const { isDarkMode } = useTheme();
    // Draggable handle state
    const [handlePosition, setHandlePosition] = useState(() => {
        const saved = localStorage.getItem('quickSettingsHandlePosition');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.y ?? 50;
            }
            catch {
                // Remove corrupted data
                localStorage.removeItem('quickSettingsHandlePosition');
                return 50;
            }
        }
        return 50; // Default to 50% (middle of screen)
    });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);
    const [dragStartPosition, setDragStartPosition] = useState(0);
    const [hasMoved, setHasMoved] = useState(false); // Track if user has moved during drag
    const handleRef = useRef(null);
    const constraintsRef = useRef({ min: 10, max: 90 }); // Percentage constraints
    const dragThreshold = 5; // Pixels to move before it's considered a drag
    useEffect(() => {
        setLocalIsOpen(isOpen);
    }, [isOpen]);
    // Save handle position to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('quickSettingsHandlePosition', JSON.stringify({ y: handlePosition }));
    }, [handlePosition]);
    // Calculate position from percentage
    const getPositionStyle = useCallback(() => {
        if (isMobile) {
            // On mobile, convert percentage to pixels from bottom
            const bottomPixels = (window.innerHeight * handlePosition) / 100;
            return { bottom: `${bottomPixels}px` };
        }
        else {
            // On desktop, use top with percentage
            return { top: `${handlePosition}%`, transform: 'translateY(-50%)' };
        }
    }, [handlePosition, isMobile]);
    // Handle mouse/touch start
    const handleDragStart = useCallback((e) => {
        // Don't prevent default yet - we want to allow click if no drag happens
        e.stopPropagation();
        const clientY = e.type.includes('touch')
            ? e.touches[0].clientY
            : e.clientY;
        setDragStartY(clientY);
        setDragStartPosition(handlePosition);
        setHasMoved(false);
        setIsDragging(false); // Don't set dragging until threshold is passed
    }, [handlePosition]);
    // Handle mouse/touch move
    const handleDragMove = useCallback((e) => {
        if (dragStartY === 0)
            return; // Not in a potential drag
        const clientY = e.type.includes('touch')
            ? e.touches[0].clientY
            : e.clientY;
        const deltaY = Math.abs(clientY - dragStartY);
        // Check if we've moved past threshold
        if (!isDragging && deltaY > dragThreshold) {
            setIsDragging(true);
            setHasMoved(true);
            document.body.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
            // Prevent body scroll on mobile during drag
            if (e.type.includes('touch')) {
                document.body.style.overflow = 'hidden';
                document.body.style.position = 'fixed';
                document.body.style.width = '100%';
            }
        }
        if (!isDragging)
            return;
        // Prevent scrolling on touch move
        if (e.type.includes('touch')) {
            e.preventDefault();
        }
        const actualDeltaY = clientY - dragStartY;
        // For top-based positioning (desktop), moving down increases top percentage
        // For bottom-based positioning (mobile), we need to invert
        let percentageDelta;
        if (isMobile) {
            // On mobile, moving down should decrease bottom position (increase percentage from top)
            percentageDelta = -(actualDeltaY / window.innerHeight) * 100;
        }
        else {
            // On desktop, moving down should increase top position
            percentageDelta = (actualDeltaY / window.innerHeight) * 100;
        }
        let newPosition = dragStartPosition + percentageDelta;
        // Apply constraints
        newPosition = Math.max(constraintsRef.current.min, Math.min(constraintsRef.current.max, newPosition));
        setHandlePosition(newPosition);
    }, [isDragging, dragStartY, dragStartPosition, isMobile, dragThreshold]);
    // Handle mouse/touch end
    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        setDragStartY(0);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        // Restore body scroll on mobile
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
    }, []);
    // Cleanup body styles on unmount in case component unmounts while dragging
    useEffect(() => {
        return () => {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        };
    }, []);
    // Set up global event listeners for drag
    useEffect(() => {
        if (dragStartY !== 0) {
            // Mouse events
            const handleMouseMove = (e) => handleDragMove(e);
            const handleMouseUp = () => handleDragEnd();
            // Touch events
            const handleTouchMove = (e) => handleDragMove(e);
            const handleTouchEnd = () => handleDragEnd();
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleTouchEnd);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.removeEventListener('touchmove', handleTouchMove);
                document.removeEventListener('touchend', handleTouchEnd);
            };
        }
    }, [dragStartY, handleDragMove, handleDragEnd]);
    const handleToggle = (e) => {
        // Don't toggle if user was dragging
        if (hasMoved) {
            e.preventDefault();
            setHasMoved(false);
            return;
        }
        const newState = !localIsOpen;
        setLocalIsOpen(newState);
        onToggle(newState);
    };
    const handleWhisperModeChange = (mode) => {
        setWhisperMode(mode);
        localStorage.setItem('whisperMode', mode);
        window.dispatchEvent(new Event('whisperModeChanged'));
    };
    return (_jsxs(_Fragment, { children: [_jsx("button", { ref: handleRef, onClick: handleToggle, onMouseDown: (e) => {
                    // Start drag on mousedown
                    handleDragStart(e);
                }, onTouchStart: (e) => {
                    // Start drag on touchstart
                    handleDragStart(e);
                }, className: `fixed ${localIsOpen ? 'right-64' : 'right-0'} z-50 ${isDragging ? '' : 'transition-all duration-150 ease-out'} bg-white dark:bg-gray-800 border ${isDragging ? 'border-blue-500 dark:border-blue-400' : 'border-gray-200 dark:border-gray-700'} rounded-l-md p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-lg ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'} touch-none`, style: { ...getPositionStyle(), touchAction: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }, "aria-label": isDragging ? t('quickSettings.dragHandle.dragging') : localIsOpen ? t('quickSettings.dragHandle.closePanel') : t('quickSettings.dragHandle.openPanel'), title: isDragging ? t('quickSettings.dragHandle.draggingStatus') : t('quickSettings.dragHandle.toggleAndMove'), children: isDragging ? (_jsx(GripVertical, { className: "h-5 w-5 text-blue-500 dark:text-blue-400" })) : localIsOpen ? (_jsx(ChevronRight, { className: "h-5 w-5 text-gray-600 dark:text-gray-400" })) : (_jsx(ChevronLeft, { className: "h-5 w-5 text-gray-600 dark:text-gray-400" })) }), _jsx("div", { className: `fixed top-0 right-0 h-full w-64 bg-background border-l border-border shadow-xl transform transition-transform duration-150 ease-out z-40 ${localIsOpen ? 'translate-x-0' : 'translate-x-full'} ${isMobile ? 'h-screen' : ''}`, children: _jsxs("div", { className: "h-full flex flex-col", children: [_jsx("div", { className: "p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900", children: _jsxs("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2", children: [_jsx(Settings2, { className: "h-5 w-5 text-gray-600 dark:text-gray-400" }), t('quickSettings.title')] }) }), _jsxs("div", { className: `flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 bg-background ${isMobile ? 'pb-mobile-nav' : ''}`, children: [_jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2", children: t('quickSettings.sections.appearance') }), _jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-transparent hover:border-gray-300 dark:hover:border-gray-600", children: [_jsxs("span", { className: "flex items-center gap-2 text-sm text-gray-900 dark:text-white", children: [isDarkMode ? _jsx(Moon, { className: "h-4 w-4 text-gray-600 dark:text-gray-400" }) : _jsx(Sun, { className: "h-4 w-4 text-gray-600 dark:text-gray-400" }), t('quickSettings.darkMode')] }), _jsx(DarkModeToggle, {})] }), _jsx("div", { children: _jsx(LanguageSelector, { compact: true }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2", children: t('quickSettings.sections.toolDisplay') }), _jsxs("label", { className: "flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors border border-transparent hover:border-gray-300 dark:hover:border-gray-600", children: [_jsxs("span", { className: "flex items-center gap-2 text-sm text-gray-900 dark:text-white", children: [_jsx(Maximize2, { className: "h-4 w-4 text-gray-600 dark:text-gray-400" }), t('quickSettings.autoExpandTools')] }), _jsx("input", { type: "checkbox", checked: autoExpandTools, onChange: (e) => onAutoExpandChange(e.target.checked), className: "h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 focus:ring-2 dark:focus:ring-blue-400 bg-gray-100 dark:bg-gray-800 checked:bg-blue-600 dark:checked:bg-blue-600" })] }), _jsxs("label", { className: "flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors border border-transparent hover:border-gray-300 dark:hover:border-gray-600", children: [_jsxs("span", { className: "flex items-center gap-2 text-sm text-gray-900 dark:text-white", children: [_jsx(Eye, { className: "h-4 w-4 text-gray-600 dark:text-gray-400" }), t('quickSettings.showRawParameters')] }), _jsx("input", { type: "checkbox", checked: showRawParameters, onChange: (e) => onShowRawParametersChange(e.target.checked), className: "h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 focus:ring-2 dark:focus:ring-blue-400 bg-gray-100 dark:bg-gray-800 checked:bg-blue-600 dark:checked:bg-blue-600" })] }), _jsxs("label", { className: "flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors border border-transparent hover:border-gray-300 dark:hover:border-gray-600", children: [_jsxs("span", { className: "flex items-center gap-2 text-sm text-gray-900 dark:text-white", children: [_jsx(Brain, { className: "h-4 w-4 text-gray-600 dark:text-gray-400" }), t('quickSettings.showThinking')] }), _jsx("input", { type: "checkbox", checked: showThinking, onChange: (e) => onShowThinkingChange(e.target.checked), className: "h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 focus:ring-2 dark:focus:ring-blue-400 bg-gray-100 dark:bg-gray-800 checked:bg-blue-600 dark:checked:bg-blue-600" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2", children: t('quickSettings.sections.viewOptions') }), _jsxs("label", { className: "flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors border border-transparent hover:border-gray-300 dark:hover:border-gray-600", children: [_jsxs("span", { className: "flex items-center gap-2 text-sm text-gray-900 dark:text-white", children: [_jsx(ArrowDown, { className: "h-4 w-4 text-gray-600 dark:text-gray-400" }), t('quickSettings.autoScrollToBottom')] }), _jsx("input", { type: "checkbox", checked: autoScrollToBottom, onChange: (e) => onAutoScrollChange(e.target.checked), className: "h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 focus:ring-2 dark:focus:ring-blue-400 bg-gray-100 dark:bg-gray-800 checked:bg-blue-600 dark:checked:bg-blue-600" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2", children: t('quickSettings.sections.inputSettings') }), _jsxs("label", { className: "flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors border border-transparent hover:border-gray-300 dark:hover:border-gray-600", children: [_jsxs("span", { className: "flex items-center gap-2 text-sm text-gray-900 dark:text-white", children: [_jsx(Languages, { className: "h-4 w-4 text-gray-600 dark:text-gray-400" }), t('quickSettings.sendByCtrlEnter')] }), _jsx("input", { type: "checkbox", checked: sendByCtrlEnter, onChange: (e) => onSendByCtrlEnterChange(e.target.checked), className: "h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 focus:ring-2 dark:focus:ring-blue-400 bg-gray-100 dark:bg-gray-800 checked:bg-blue-600 dark:checked:bg-blue-600" })] }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 ml-3", children: t('quickSettings.sendByCtrlEnterDescription') })] }), _jsxs("div", { className: "space-y-2", style: { display: 'none' }, children: [_jsx("h4", { className: "text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2", children: t('quickSettings.sections.whisperDictation') }), _jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "flex items-start p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors border border-transparent hover:border-gray-300 dark:hover:border-gray-600", children: [_jsx("input", { type: "radio", name: "whisperMode", value: "default", checked: whisperMode === 'default', onChange: () => handleWhisperModeChange('default'), className: "mt-0.5 h-4 w-4 border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:checked:bg-blue-600" }), _jsxs("div", { className: "ml-3 flex-1", children: [_jsxs("span", { className: "flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white", children: [_jsx(Mic, { className: "h-4 w-4 text-gray-600 dark:text-gray-400" }), t('quickSettings.whisper.modes.default')] }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: t('quickSettings.whisper.modes.defaultDescription') })] })] }), _jsxs("label", { className: "flex items-start p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors border border-transparent hover:border-gray-300 dark:hover:border-gray-600", children: [_jsx("input", { type: "radio", name: "whisperMode", value: "prompt", checked: whisperMode === 'prompt', onChange: () => handleWhisperModeChange('prompt'), className: "mt-0.5 h-4 w-4 border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:checked:bg-blue-600" }), _jsxs("div", { className: "ml-3 flex-1", children: [_jsxs("span", { className: "flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white", children: [_jsx(Sparkles, { className: "h-4 w-4 text-gray-600 dark:text-gray-400" }), t('quickSettings.whisper.modes.prompt')] }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: t('quickSettings.whisper.modes.promptDescription') })] })] }), _jsxs("label", { className: "flex items-start p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors border border-transparent hover:border-gray-300 dark:hover:border-gray-600", children: [_jsx("input", { type: "radio", name: "whisperMode", value: "vibe", checked: whisperMode === 'vibe' || whisperMode === 'instructions' || whisperMode === 'architect', onChange: () => handleWhisperModeChange('vibe'), className: "mt-0.5 h-4 w-4 border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:checked:bg-blue-600" }), _jsxs("div", { className: "ml-3 flex-1", children: [_jsxs("span", { className: "flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white", children: [_jsx(FileText, { className: "h-4 w-4 text-gray-600 dark:text-gray-400" }), t('quickSettings.whisper.modes.vibe')] }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: t('quickSettings.whisper.modes.vibeDescription') })] })] })] })] })] })] }) }), localIsOpen && (_jsx("div", { className: "fixed inset-0 bg-background/80 backdrop-blur-sm z-30 transition-opacity duration-150 ease-out", onClick: handleToggle }))] }));
};
export default QuickSettingsPanel;
