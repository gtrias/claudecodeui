import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTaskMaster } from '../contexts/TaskMasterContext';
import TaskIndicator from './TaskIndicator';
const TaskMasterStatus = () => {
    const { currentProject, projectTaskMaster, mcpServerStatus, isLoading, isLoadingMCP, error } = useTaskMaster();
    if (isLoading || isLoadingMCP) {
        return (_jsxs("div", { className: "flex items-center text-sm text-gray-500 dark:text-gray-400", children: [_jsx("div", { className: "animate-spin w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full mr-2" }), "Loading TaskMaster status..."] }));
    }
    if (error) {
        return (_jsxs("div", { className: "flex items-center text-sm text-red-500 dark:text-red-400", children: [_jsx("span", { className: "w-2 h-2 bg-red-500 rounded-full mr-2" }), "TaskMaster Error"] }));
    }
    // Show MCP server status
    const mcpConfigured = mcpServerStatus?.hasMCPServer && mcpServerStatus?.isConfigured;
    // Show project TaskMaster status
    const projectConfigured = currentProject?.taskmaster?.hasTaskmaster;
    const taskCount = currentProject?.taskmaster?.metadata?.taskCount || 0;
    const completedCount = currentProject?.taskmaster?.metadata?.completed || 0;
    if (!currentProject) {
        return (_jsxs("div", { className: "flex items-center text-sm text-gray-500 dark:text-gray-400", children: [_jsx("span", { className: "w-2 h-2 bg-gray-400 rounded-full mr-2" }), "No project selected"] }));
    }
    // Determine overall status for TaskIndicator
    let overallStatus = 'not-configured';
    if (projectConfigured && mcpConfigured) {
        overallStatus = 'fully-configured';
    }
    else if (projectConfigured) {
        overallStatus = 'taskmaster-only';
    }
    else if (mcpConfigured) {
        overallStatus = 'mcp-only';
    }
    return (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(TaskIndicator, { status: overallStatus, size: "md", showLabel: true }), projectConfigured && (_jsxs("div", { className: "text-xs text-gray-600 dark:text-gray-400", children: [_jsxs("span", { className: "font-medium", children: [completedCount, "/", taskCount, " tasks"] }), taskCount > 0 && (_jsxs("span", { className: "ml-2 opacity-75", children: ["(", Math.round((completedCount / taskCount) * 100), "%)"] }))] }))] }));
};
export default TaskMasterStatus;
