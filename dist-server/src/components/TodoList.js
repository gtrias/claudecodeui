import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge } from './ui/badge';
import { CheckCircle2, Clock, Circle } from 'lucide-react';
const TodoList = ({ todos, isResult = false }) => {
    if (!todos || !Array.isArray(todos)) {
        return null;
    }
    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return _jsx(CheckCircle2, { className: "w-4 h-4 text-green-500 dark:text-green-400" });
            case 'in_progress':
                return _jsx(Clock, { className: "w-4 h-4 text-blue-500 dark:text-blue-400" });
            case 'pending':
            default:
                return _jsx(Circle, { className: "w-4 h-4 text-gray-400 dark:text-gray-500" });
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800';
            case 'in_progress':
                return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
            case 'pending':
            default:
                return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';
        }
    };
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
            case 'medium':
                return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
            case 'low':
            default:
                return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';
        }
    };
    return (_jsxs("div", { className: "space-y-3", children: [isResult && (_jsxs("div", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 mb-3", children: ["Todo List (", todos.length, " ", todos.length === 1 ? 'item' : 'items', ")"] })), todos.map((todo, index) => (_jsxs("div", { className: "flex items-start gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md dark:shadow-gray-900/50 transition-shadow", children: [_jsx("div", { className: "flex-shrink-0 mt-0.5", children: getStatusIcon(todo.status) }), _jsx("div", { className: "flex-1 min-w-0", children: _jsxs("div", { className: "flex items-start justify-between gap-2 mb-2", children: [_jsx("p", { className: `text-sm font-medium ${todo.status === 'completed' ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`, children: todo.content }), _jsxs("div", { className: "flex gap-1 flex-shrink-0", children: [_jsx(Badge, { variant: "outline", className: `text-xs px-2 py-0.5 ${getPriorityColor(todo.priority)}`, children: todo.priority }), _jsx(Badge, { variant: "outline", className: `text-xs px-2 py-0.5 ${getStatusColor(todo.status)}`, children: todo.status.replace('_', ' ') })] })] }) })] }, todo.id || `todo-${index}`)))] }));
};
export default TodoList;
