import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Fuse from 'fuse.js';
/**
 * Custom hook for managing command menu and fuzzy search
 *
 * Features:
 * - Fuzzy search with Fuse.js
 * - Slash command detection (/)
 * - File mention detection (@)
 * - Debounced query processing
 * - Keyboard navigation support
 *
 * @example
 * ```tsx
 * const {
 *   showCommandMenu,
 *   commandQuery,
 *   filteredCommands,
 *   processInputForCommands,
 *   selectCommand
 * } = useCommandMenu({
 *   commands: slashCommands,
 *   onCommandSelect: (cmd) => console.log(cmd)
 * });
 *
 * // In input handler:
 * onChange={(e) => processInputForCommands(e.target.value)}
 * ```
 */
export function useCommandMenu(props) {
    const { commands = [], files = [], onCommandSelect, onFileSelect } = props || {};
    const [showCommandMenu, setShowCommandMenu] = useState(false);
    const [commandQuery, setCommandQuery] = useState('');
    const [filteredCommands, setFilteredCommands] = useState(commands);
    const commandQueryTimerRef = useRef(null);
    /**
     * Create Fuse instance for fuzzy search
     * Searches by name and description with weighted scoring
     */
    const fuse = useMemo(() => {
        if (!commands.length && !files.length)
            return null;
        const allItems = [...commands, ...files];
        return new Fuse(allItems, {
            keys: [
                { name: 'name', weight: 2 },
                { name: 'description', weight: 1 },
                { name: 'path', weight: 1.5 }
            ],
            threshold: 0.4, // 0 = perfect match, 1 = anything matches
            includeScore: true,
            minMatchCharLength: 1
        });
    }, [commands, files]);
    /**
     * Filter commands based on current query
     * Uses fuzzy search if query exists, otherwise shows all
     */
    useEffect(() => {
        if (!commandQuery) {
            setFilteredCommands([...commands, ...files]);
            return;
        }
        if (!fuse) {
            setFilteredCommands([]);
            return;
        }
        const results = fuse.search(commandQuery);
        setFilteredCommands(results.map(result => result.item));
    }, [commandQuery, commands, files, fuse]);
    /**
     * Process input text to detect command triggers
     * Detects / for slash commands and @ for file mentions
     */
    const processInputForCommands = useCallback((text) => {
        // Clear existing timer
        if (commandQueryTimerRef.current) {
            clearTimeout(commandQueryTimerRef.current);
        }
        // Check for slash command trigger
        const slashMatch = text.match(/\/(\w*)$/);
        if (slashMatch) {
            const query = slashMatch[1];
            setCommandQuery(query);
            setShowCommandMenu(true);
            return;
        }
        // Check for file mention trigger
        const atMatch = text.match(/@([\w\-./]*)$/);
        if (atMatch) {
            const query = atMatch[1];
            setCommandQuery(query);
            setShowCommandMenu(true);
            return;
        }
        // No trigger found, hide menu
        setShowCommandMenu(false);
        setCommandQuery('');
    }, []);
    /**
     * Select a command and execute appropriate callback
     */
    const selectCommand = useCallback((command) => {
        if (command.type === 'file' && onFileSelect) {
            onFileSelect(command);
        }
        else if (command.type === 'command' && onCommandSelect) {
            onCommandSelect(command);
        }
        else if (onCommandSelect) {
            // Default to command callback
            onCommandSelect(command);
        }
        // Hide menu after selection
        setShowCommandMenu(false);
        setCommandQuery('');
    }, [onCommandSelect, onFileSelect]);
    return {
        showCommandMenu,
        setShowCommandMenu,
        commandQuery,
        setCommandQuery,
        filteredCommands,
        commandQueryTimerRef,
        processInputForCommands,
        selectCommand
    };
}
export default useCommandMenu;
