import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MessageSquare, Folder, Terminal, GitBranch, CheckSquare } from 'lucide-react';
import { useTasksSettings } from '../contexts/TasksSettingsContext';
const MobileNav = ({ activeTab, setActiveTab, isInputFocused }) => {
    const { tasksEnabled } = useTasksSettings();
    const navItems = [
        {
            id: 'chat',
            icon: MessageSquare,
            onClick: () => setActiveTab('chat')
        },
        {
            id: 'shell',
            icon: Terminal,
            onClick: () => setActiveTab('shell')
        },
        {
            id: 'files',
            icon: Folder,
            onClick: () => setActiveTab('files')
        },
        {
            id: 'git',
            icon: GitBranch,
            onClick: () => setActiveTab('git')
        },
        // Conditionally add tasks tab if enabled
        ...(tasksEnabled ? [{
                id: 'tasks',
                icon: CheckSquare,
                onClick: () => setActiveTab('tasks')
            }] : [])
    ];
    return (_jsx("div", { className: `fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 ios-bottom-safe transform transition-transform duration-300 ease-in-out shadow-lg ${isInputFocused ? 'translate-y-full' : 'translate-y-0'}`, children: _jsx("div", { className: "flex items-center justify-around py-1", children: navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (_jsxs("button", { onClick: item.onClick, onTouchStart: (e) => {
                        e.preventDefault();
                        item.onClick();
                    }, className: `flex items-center justify-center p-2 rounded-lg min-h-[40px] min-w-[40px] relative touch-manipulation ${isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`, "aria-label": item.id, children: [_jsx(Icon, { className: "w-5 h-5" }), isActive && (_jsx("div", { className: "absolute top-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" }))] }, item.id));
            }) }) }));
};
export default MobileNav;
