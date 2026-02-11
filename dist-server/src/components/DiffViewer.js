import { jsx as _jsx } from "react/jsx-runtime";
const DiffViewer = ({ diff, fileName, isMobile, wrapText }) => {
    if (!diff) {
        return (_jsx("div", { className: "p-4 text-center text-gray-500 dark:text-gray-400 text-sm", children: "No diff available" }));
    }
    const renderDiffLine = (line, index) => {
        const isAddition = line.startsWith('+') && !line.startsWith('+++');
        const isDeletion = line.startsWith('-') && !line.startsWith('---');
        const isHeader = line.startsWith('@@');
        return (_jsx("div", { className: `font-mono text-xs p-2 ${isMobile && wrapText ? 'whitespace-pre-wrap break-all' : 'whitespace-pre overflow-x-auto'} ${isAddition ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' :
                isDeletion ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300' :
                    isHeader ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300' :
                        'text-gray-600 dark:text-gray-400'}`, children: line }, index));
    };
    return (_jsx("div", { className: "diff-viewer", children: diff.split('\n').map((line, index) => renderDiffLine(line, index)) }));
};
export default DiffViewer;
