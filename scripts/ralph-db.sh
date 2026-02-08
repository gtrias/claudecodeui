#!/bin/bash
# Ralph Database Helper Script (Bash)
# Usage: ./ralph-db.sh <command> [args]
#
# Commands:
#   init              Initialize database with schema
#   start <task_id>   Mark task as in-progress
#   complete <task_id> [commit_hash]  Mark task completed
#   fail <task_id> [error_message]    Mark task failed, log iteration
#   status            Show project status summary
#   next              Get next pending task
#   list [status]     List tasks (optionally filtered by status)
#   log [n]           Show last n iterations (default 10)
#   add <task_id> <name> <type>       Add a new task
#   blocker <task_id> <description>   Add a blocker
#   resolve <blocker_id>              Resolve a blocker

set -e

DB_FILE="${RALPH_DB:-ralph.db}"
SCHEMA_FILE="${RALPH_SCHEMA:-$(dirname "$0")/../templates/schema.sql}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================================================
# Helper Functions
# ============================================================================

check_db() {
    if [[ ! -f "$DB_FILE" ]]; then
        echo -e "${RED}Error: Database not found at $DB_FILE${NC}"
        echo "Run: ./ralph-db.sh init"
        exit 1
    fi
}

sql() {
    sqlite3 -batch "$DB_FILE" "$1"
}

sql_column() {
    sqlite3 -batch -column -header "$DB_FILE" "$1"
}

# ============================================================================
# Commands
# ============================================================================

cmd_init() {
    if [[ -f "$DB_FILE" ]]; then
        echo -e "${YELLOW}Warning: Database already exists at $DB_FILE${NC}"
        read -p "Overwrite? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Aborted."
            exit 1
        fi
        rm "$DB_FILE"
    fi

    if [[ ! -f "$SCHEMA_FILE" ]]; then
        echo -e "${RED}Error: Schema file not found at $SCHEMA_FILE${NC}"
        exit 1
    fi

    sqlite3 "$DB_FILE" < "$SCHEMA_FILE"
    echo -e "${GREEN}Database initialized at $DB_FILE${NC}"
}

cmd_start() {
    local task_id="$1"
    if [[ -z "$task_id" ]]; then
        echo "Usage: ralph-db.sh start <task_id>"
        exit 1
    fi
    check_db

    # Check task exists
    local exists=$(sql "SELECT COUNT(*) FROM tasks WHERE task_id = '$task_id';")
    if [[ "$exists" == "0" ]]; then
        echo -e "${RED}Error: Task '$task_id' not found${NC}"
        exit 1
    fi

    # Update status
    sql "UPDATE tasks SET status = 'in-progress', started_at = CURRENT_TIMESTAMP, iteration_count = iteration_count + 1 WHERE task_id = '$task_id';"

    # Update iteration count in metadata
    sql "UPDATE project_meta SET value = CAST((CAST(value AS INTEGER) + 1) AS TEXT) WHERE key = 'total_iterations';"
    sql "UPDATE project_meta SET value = CURRENT_TIMESTAMP WHERE key = 'last_iteration';"

    echo -e "${CYAN}Started task: $task_id${NC}"
}

cmd_complete() {
    local task_id="$1"
    local commit_hash="${2:-}"
    if [[ -z "$task_id" ]]; then
        echo "Usage: ralph-db.sh complete <task_id> [commit_hash]"
        exit 1
    fi
    check_db

    # Get current iteration count
    local iteration=$(sql "SELECT CAST(value AS INTEGER) FROM project_meta WHERE key = 'total_iterations';")

    # Update task
    sql "UPDATE tasks SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE task_id = '$task_id';"

    # Log iteration
    local commit_sql=""
    if [[ -n "$commit_hash" ]]; then
        commit_sql=", commit_hash = '$commit_hash'"
    fi
    sql "INSERT INTO iterations (task_id, iteration_number, outcome, test_passed $([[ -n "$commit_hash" ]] && echo ", commit_hash")) VALUES ('$task_id', $iteration, 'success', 1 $([[ -n "$commit_hash" ]] && echo ", '$commit_hash'"));"

    echo -e "${GREEN}Completed task: $task_id${NC}"
}

cmd_fail() {
    local task_id="$1"
    local error_message="${2:-No error message provided}"
    if [[ -z "$task_id" ]]; then
        echo "Usage: ralph-db.sh fail <task_id> [error_message]"
        exit 1
    fi
    check_db

    # Get current iteration count
    local iteration=$(sql "SELECT CAST(value AS INTEGER) FROM project_meta WHERE key = 'total_iterations';")

    # Keep status as in-progress (will retry)
    # Log the failure
    sql "INSERT INTO iterations (task_id, iteration_number, outcome, test_passed, error_message) VALUES ('$task_id', $iteration, 'failure', 0, '${error_message//\'/\'\'}');"

    # Check if task has failed too many times (3+)
    local fail_count=$(sql "SELECT COUNT(*) FROM iterations WHERE task_id = '$task_id' AND outcome = 'failure';")
    if [[ "$fail_count" -ge 3 ]]; then
        sql "UPDATE tasks SET status = 'failed' WHERE task_id = '$task_id';"
        echo -e "${RED}Task $task_id marked as FAILED after $fail_count attempts${NC}"
    else
        echo -e "${YELLOW}Task $task_id failed (attempt $fail_count). Will retry.${NC}"
    fi
}

cmd_status() {
    check_db

    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║              RALPH PROJECT STATUS                      ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo

    # Task counts by status
    local planned=$(sql "SELECT COUNT(*) FROM tasks WHERE status = 'planned';")
    local in_progress=$(sql "SELECT COUNT(*) FROM tasks WHERE status = 'in-progress';")
    local completed=$(sql "SELECT COUNT(*) FROM tasks WHERE status = 'completed';")
    local failed=$(sql "SELECT COUNT(*) FROM tasks WHERE status = 'failed';")
    local total=$((planned + in_progress + completed + failed))

    echo -e "${CYAN}Task Summary:${NC}"
    echo "  Planned:     $planned"
    echo "  In Progress: $in_progress"
    echo "  Completed:   $completed"
    echo "  Failed:      $failed"
    echo "  ─────────────────"
    echo "  Total:       $total"
    echo

    # Progress bar
    if [[ "$total" -gt 0 ]]; then
        local pct=$((completed * 100 / total))
        local filled=$((pct / 5))
        local empty=$((20 - filled))
        echo -e "${CYAN}Progress:${NC}"
        printf "  ["
        printf "${GREEN}%${filled}s" | tr ' ' '█'
        printf "${NC}%${empty}s" | tr ' ' '░'
        printf "] ${pct}%%\n"
        echo
    fi

    # Iterations
    local iterations=$(sql "SELECT value FROM project_meta WHERE key = 'total_iterations';")
    local last=$(sql "SELECT value FROM project_meta WHERE key = 'last_iteration';")
    echo -e "${CYAN}Iterations:${NC}"
    echo "  Total: $iterations"
    echo "  Last:  ${last:-Never}"
    echo

    # Active blockers
    local blockers=$(sql "SELECT COUNT(*) FROM blockers WHERE resolved = 0;")
    if [[ "$blockers" -gt 0 ]]; then
        echo -e "${RED}Active Blockers: $blockers${NC}"
        sql_column "SELECT task_id, description FROM blockers WHERE resolved = 0 LIMIT 5;"
        echo
    fi
}

cmd_next() {
    check_db

    local next=$(sql "SELECT task_id FROM tasks WHERE status = 'planned' ORDER BY priority, created_at LIMIT 1;")
    if [[ -z "$next" ]]; then
        # Check for in-progress tasks
        next=$(sql "SELECT task_id FROM tasks WHERE status = 'in-progress' ORDER BY priority, started_at LIMIT 1;")
        if [[ -z "$next" ]]; then
            echo -e "${GREEN}All tasks complete!${NC}"
            exit 0
        else
            echo -e "${YELLOW}Continuing: $next${NC}"
        fi
    else
        echo "$next"
    fi
}

cmd_list() {
    local status_filter="$1"
    check_db

    local where_clause=""
    if [[ -n "$status_filter" ]]; then
        where_clause="WHERE status = '$status_filter'"
    fi

    sql_column "SELECT task_id, name, status, iteration_count, priority FROM tasks $where_clause ORDER BY CASE status WHEN 'in-progress' THEN 1 WHEN 'planned' THEN 2 WHEN 'failed' THEN 3 ELSE 4 END, priority, created_at;"
}

cmd_log() {
    local limit="${1:-10}"
    check_db

    echo -e "${CYAN}Recent Activity (last $limit):${NC}"
    sql_column "SELECT datetime(i.created_at, 'localtime') as time, i.task_id, i.outcome, COALESCE(i.commit_hash, '-') as commit FROM iterations i ORDER BY i.created_at DESC LIMIT $limit;"
}

cmd_add() {
    local task_id="$1"
    local name="$2"
    local type="${3:-user_story}"
    if [[ -z "$task_id" || -z "$name" ]]; then
        echo "Usage: ralph-db.sh add <task_id> <name> [type]"
        exit 1
    fi
    check_db

    sql "INSERT INTO tasks (task_id, name, type) VALUES ('$task_id', '${name//\'/\'\'}', '$type');"
    echo -e "${GREEN}Added task: $task_id - $name${NC}"
}

cmd_blocker() {
    local task_id="$1"
    local description="$2"
    if [[ -z "$task_id" || -z "$description" ]]; then
        echo "Usage: ralph-db.sh blocker <task_id> <description>"
        exit 1
    fi
    check_db

    sql "INSERT INTO blockers (task_id, description) VALUES ('$task_id', '${description//\'/\'\'}');"
    echo -e "${RED}Blocker added for task: $task_id${NC}"
}

cmd_resolve() {
    local blocker_id="$1"
    if [[ -z "$blocker_id" ]]; then
        echo "Usage: ralph-db.sh resolve <blocker_id>"
        exit 1
    fi
    check_db

    sql "UPDATE blockers SET resolved = 1, resolved_at = CURRENT_TIMESTAMP WHERE id = $blocker_id;"
    echo -e "${GREEN}Blocker $blocker_id resolved${NC}"
}

cmd_dashboard() {
    local output_file="${1:-ralph-dashboard.json}"
    check_db

    # Get project metadata
    local project_name=$(sql "SELECT value FROM project_meta WHERE key = 'project_name';" 2>/dev/null || echo "Ralph Project")
    local total_iterations=$(sql "SELECT value FROM project_meta WHERE key = 'total_iterations';" 2>/dev/null || echo "0")
    local last_iteration=$(sql "SELECT value FROM project_meta WHERE key = 'last_iteration';" 2>/dev/null || echo "")

    # Get task counts (support both 'planned' and 'pending' status values)
    local planned=$(sql "SELECT COUNT(*) FROM tasks WHERE status IN ('planned', 'pending');")
    local in_progress=$(sql "SELECT COUNT(*) FROM tasks WHERE status = 'in-progress';")
    local completed=$(sql "SELECT COUNT(*) FROM tasks WHERE status = 'completed';")
    local failed=$(sql "SELECT COUNT(*) FROM tasks WHERE status = 'failed';")

    # Get success/failure iteration counts
    local success_count=$(sql "SELECT COUNT(*) FROM iterations WHERE outcome = 'success';")
    local failure_count=$(sql "SELECT COUNT(*) FROM iterations WHERE outcome = 'failure';")

    # Build JSON output
    cat > "$output_file" << JSONEOF
{
  "project": {
    "name": "$project_name",
    "totalIterations": $total_iterations,
    "lastIteration": $(if [[ -n "$last_iteration" ]]; then echo "\"$last_iteration\""; else echo "null"; fi),
    "successCount": $success_count,
    "failureCount": $failure_count
  },
  "summary": {
    "planned": $planned,
    "inProgress": $in_progress,
    "completed": $completed,
    "failed": $failed,
    "total": $((planned + in_progress + completed + failed))
  },
  "tasks": {
    "planned": [
JSONEOF

    # Add planned tasks
    local first=true
    while IFS='|' read -r task_id name priority iteration_count; do
        if [[ -n "$task_id" ]]; then
            if [[ "$first" != "true" ]]; then
                echo "," >> "$output_file"
            fi
            first=false
            printf '      {"id": "%s", "name": "%s", "priority": %s, "iterations": %s}' \
                "$task_id" "${name//\"/\\\"}" "${priority:-0}" "${iteration_count:-0}" >> "$output_file"
        fi
    done < <(sql "SELECT task_id, name, priority, iteration_count FROM tasks WHERE status IN ('planned', 'pending') ORDER BY priority, created_at;")

    cat >> "$output_file" << 'JSONEOF'

    ],
    "inProgress": [
JSONEOF

    # Add in-progress tasks
    first=true
    while IFS='|' read -r task_id name priority iteration_count started_at; do
        if [[ -n "$task_id" ]]; then
            if [[ "$first" != "true" ]]; then
                echo "," >> "$output_file"
            fi
            first=false
            printf '      {"id": "%s", "name": "%s", "priority": %s, "iterations": %s, "startedAt": "%s"}' \
                "$task_id" "${name//\"/\\\"}" "${priority:-0}" "${iteration_count:-0}" "$started_at" >> "$output_file"
        fi
    done < <(sql "SELECT task_id, name, priority, iteration_count, started_at FROM tasks WHERE status = 'in-progress' ORDER BY priority, started_at;")

    cat >> "$output_file" << 'JSONEOF'

    ],
    "completed": [
JSONEOF

    # Add completed tasks
    first=true
    while IFS='|' read -r task_id name priority iteration_count completed_at; do
        if [[ -n "$task_id" ]]; then
            if [[ "$first" != "true" ]]; then
                echo "," >> "$output_file"
            fi
            first=false
            printf '      {"id": "%s", "name": "%s", "priority": %s, "iterations": %s, "completedAt": "%s"}' \
                "$task_id" "${name//\"/\\\"}" "${priority:-0}" "${iteration_count:-0}" "$completed_at" >> "$output_file"
        fi
    done < <(sql "SELECT task_id, name, priority, iteration_count, completed_at FROM tasks WHERE status = 'completed' ORDER BY completed_at DESC;")

    cat >> "$output_file" << 'JSONEOF'

    ],
    "failed": [
JSONEOF

    # Add failed tasks
    first=true
    while IFS='|' read -r task_id name priority iteration_count; do
        if [[ -n "$task_id" ]]; then
            if [[ "$first" != "true" ]]; then
                echo "," >> "$output_file"
            fi
            first=false
            # Get last error for this task
            local last_error=$(sql "SELECT error_message FROM iterations WHERE task_id = '$task_id' AND outcome = 'failure' ORDER BY created_at DESC LIMIT 1;" | head -1)
            printf '      {"id": "%s", "name": "%s", "priority": %s, "iterations": %s, "lastError": "%s"}' \
                "$task_id" "${name//\"/\\\"}" "${priority:-0}" "${iteration_count:-0}" "${last_error//\"/\\\"}" >> "$output_file"
        fi
    done < <(sql "SELECT task_id, name, priority, iteration_count FROM tasks WHERE status = 'failed' ORDER BY priority;")

    cat >> "$output_file" << 'JSONEOF'

    ]
  },
  "recentActivity": [
JSONEOF

    # Add recent activity (last 10 iterations)
    first=true
    while IFS='|' read -r created_at task_id outcome commit_hash; do
        if [[ -n "$task_id" ]]; then
            if [[ "$first" != "true" ]]; then
                echo "," >> "$output_file"
            fi
            first=false
            printf '    {"time": "%s", "taskId": "%s", "outcome": "%s", "commit": %s}' \
                "$created_at" "$task_id" "$outcome" \
                $(if [[ -n "$commit_hash" && "$commit_hash" != "" ]]; then echo "\"$commit_hash\""; else echo "null"; fi) >> "$output_file"
        fi
    done < <(sql "SELECT datetime(created_at, 'localtime'), task_id, outcome, commit_hash FROM iterations ORDER BY created_at DESC LIMIT 10;")

    cat >> "$output_file" << 'JSONEOF'

  ],
  "generatedAt": "TIMESTAMP_PLACEHOLDER"
}
JSONEOF

    # Replace timestamp placeholder with actual timestamp
    local timestamp=$(date -Iseconds 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S')
    if command -v sed &> /dev/null; then
        sed -i.bak "s/TIMESTAMP_PLACEHOLDER/$timestamp/" "$output_file" 2>/dev/null && rm -f "$output_file.bak" || true
    fi

    echo -e "${GREEN}Dashboard data exported to: $output_file${NC}"
    echo -e "${CYAN}Open templates/dashboard.html in a browser to view the Kanban board${NC}"
}

cmd_help() {
    echo "Ralph Database Helper"
    echo ""
    echo "Usage: ralph-db.sh <command> [args]"
    echo ""
    echo "Commands:"
    echo "  init                Initialize database with schema"
    echo "  start <task_id>     Mark task as in-progress"
    echo "  complete <task_id> [commit]  Mark task completed"
    echo "  fail <task_id> [msg] Mark task failed, log iteration"
    echo "  status              Show project status summary"
    echo "  next                Get next pending task"
    echo "  list [status]       List tasks (filter by status)"
    echo "  log [n]             Show last n iterations"
    echo "  add <id> <name> [type]  Add a new task"
    echo "  blocker <id> <desc> Add a blocker to task"
    echo "  resolve <blocker_id> Resolve a blocker"
    echo "  dashboard [file]    Export data for web dashboard (JSON)"
    echo ""
    echo "Environment:"
    echo "  RALPH_DB      Database file (default: ralph.db)"
    echo "  RALPH_SCHEMA  Schema file path"
}

# ============================================================================
# Main
# ============================================================================

case "${1:-help}" in
    init)      cmd_init ;;
    start)     cmd_start "$2" ;;
    complete)  cmd_complete "$2" "$3" ;;
    fail)      cmd_fail "$2" "$3" ;;
    status)    cmd_status ;;
    next)      cmd_next ;;
    list)      cmd_list "$2" ;;
    log)       cmd_log "$2" ;;
    add)       cmd_add "$2" "$3" "$4" ;;
    blocker)   cmd_blocker "$2" "$3" ;;
    resolve)   cmd_resolve "$2" ;;
    dashboard) cmd_dashboard "$2" ;;
    help|--help|-h) cmd_help ;;
    *)
        echo "Unknown command: $1"
        cmd_help
        exit 1
        ;;
esac
