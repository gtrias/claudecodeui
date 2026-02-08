#!/bin/bash
# Ralph Loop Script with Database Integration (Bash)
# Usage: ./ralph.sh [max_iterations] [sleep_seconds]
#
# Features:
#   - SQLite database tracking for tasks and iterations
#   - Automatic task state management
#   - Learning accumulation across iterations
#   - <promise>COMPLETE</promise> for success
#   - <promise>FAILED</promise> for test failures

set -e

MAX=${1:-10}
SLEEP=${2:-2}
DB_FILE="${RALPH_DB:-ralph.db}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ============================================================================
# Database Functions
# ============================================================================

sql() {
    sqlite3 -batch "$DB_FILE" "$1" 2>/dev/null || echo ""
}

get_next_task() {
    # First check for in-progress tasks
    local task=$(sql "SELECT task_id FROM tasks WHERE status = 'in-progress' ORDER BY priority, started_at LIMIT 1;")
    if [[ -n "$task" ]]; then
        echo "$task"
        return
    fi
    # Then get next planned task
    sql "SELECT task_id FROM tasks WHERE status = 'planned' ORDER BY priority, created_at LIMIT 1;"
}

start_task() {
    local task_id="$1"
    sql "UPDATE tasks SET status = 'in-progress', started_at = CURRENT_TIMESTAMP, iteration_count = iteration_count + 1 WHERE task_id = '$task_id';"
    sql "UPDATE project_meta SET value = CAST((CAST(value AS INTEGER) + 1) AS TEXT) WHERE key = 'total_iterations';"
    sql "UPDATE project_meta SET value = CURRENT_TIMESTAMP WHERE key = 'last_iteration';"
}

complete_task() {
    local task_id="$1"
    local commit_hash="$2"
    local iteration=$(sql "SELECT CAST(value AS INTEGER) FROM project_meta WHERE key = 'total_iterations';")

    sql "UPDATE tasks SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE task_id = '$task_id';"

    if [[ -n "$commit_hash" ]]; then
        sql "INSERT INTO iterations (task_id, iteration_number, outcome, test_passed, commit_hash) VALUES ('$task_id', $iteration, 'success', 1, '$commit_hash');"
    else
        sql "INSERT INTO iterations (task_id, iteration_number, outcome, test_passed) VALUES ('$task_id', $iteration, 'success', 1);"
    fi
}

fail_task() {
    local task_id="$1"
    local error_msg="${2:-Test failure}"
    local iteration=$(sql "SELECT CAST(value AS INTEGER) FROM project_meta WHERE key = 'total_iterations';")

    # Escape single quotes
    error_msg="${error_msg//\'/\'\'}"

    sql "INSERT INTO iterations (task_id, iteration_number, outcome, test_passed, error_message) VALUES ('$task_id', $iteration, 'failure', 0, '$error_msg');"

    # Check if too many failures
    local fail_count=$(sql "SELECT COUNT(*) FROM iterations WHERE task_id = '$task_id' AND outcome = 'failure';")
    if [[ "$fail_count" -ge 3 ]]; then
        sql "UPDATE tasks SET status = 'failed' WHERE task_id = '$task_id';"
        return 1  # Signal permanent failure
    fi
    return 0  # Will retry
}

check_all_complete() {
    local remaining=$(sql "SELECT COUNT(*) FROM tasks WHERE status IN ('planned', 'in-progress');")
    [[ "$remaining" == "0" ]]
}

get_task_name() {
    local task_id="$1"
    sql "SELECT name FROM tasks WHERE task_id = '$task_id';"
}

# ============================================================================
# Main Loop
# ============================================================================

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              RALPH LOOP v2.0                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Max iterations: $MAX | Sleep: ${SLEEP}s | Database: $DB_FILE"
echo ""

# Check database exists - REQUIRED
if [[ ! -f "$DB_FILE" ]]; then
    echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}  ERROR: Database not found at $DB_FILE${NC}"
    echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "The Ralph database is required. To set up a project:"
    echo ""
    echo "  1. Run Claude Code: claude"
    echo "  2. Execute: /ralph-new"
    echo ""
    echo "Or initialize database manually:"
    echo "  ./scripts/ralph-db.sh init"
    echo ""
    exit 1
fi

# Show initial status
planned=$(sql "SELECT COUNT(*) FROM tasks WHERE status = 'planned';")
completed=$(sql "SELECT COUNT(*) FROM tasks WHERE status = 'completed';")
echo -e "${CYAN}Tasks: $completed completed, $planned pending${NC}"
echo ""

for ((i=1; i<=$MAX; i++)); do
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Iteration $i of $MAX${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

    # Get current task from database
    CURRENT_TASK=$(get_next_task)
    if [[ -z "$CURRENT_TASK" ]]; then
        echo -e "${GREEN}All tasks complete!${NC}"
        exit 0
    fi
    TASK_NAME=$(get_task_name "$CURRENT_TASK")
    echo -e "${CYAN}Working on: $CURRENT_TASK - $TASK_NAME${NC}"
    start_task "$CURRENT_TASK"

    # Build the prompt with task ID from database
    prompt="You are Ralph, an autonomous coding agent. Do exactly ONE task per iteration.

## YOUR CURRENT TASK

**Task ID:** $CURRENT_TASK
**Task Name:** $TASK_NAME

Work on THIS task only. The task details are in PRD.md under the heading ### $CURRENT_TASK.

## Steps

1. Read PRD.md and find the section for $CURRENT_TASK to get acceptance criteria.
2. Read progress.txt - check the Learnings section for patterns from previous iterations.
3. Implement the task: $TASK_NAME
4. Run tests/typecheck to verify it works.

## Critical: Only Complete If Tests Pass

- If tests PASS:
  - Update PRD.md to mark the task complete (change [ ] to [x] for $CURRENT_TASK)
  - Commit your changes with message: feat: $TASK_NAME
  - Append what worked to progress.txt
  - Output: <promise>COMPLETE</promise> if ALL tasks in PRD.md are [x], otherwise end normally

- If tests FAIL:
  - Do NOT mark the task complete
  - Do NOT commit broken code
  - Append what went wrong to progress.txt (so next iteration can learn)
  - Output: <promise>FAILED</promise>

## Progress Notes Format

Append to progress.txt using this format:

## Iteration - $CURRENT_TASK: $TASK_NAME
- What was implemented
- Files changed
- Learnings for future iterations:
  - Patterns discovered
  - Gotchas encountered
  - Useful context
---

## Update AGENTS.md (If Applicable)

If you discover a reusable pattern that future work should know about:
- Check if AGENTS.md exists in the project root
- Add patterns like: 'This codebase uses X for Y' or 'Always do Z when changing W'
- Only add genuinely reusable knowledge, not task-specific details

## End Condition

After completing your task, check PRD.md:
- If ALL tasks are [x], output exactly: <promise>COMPLETE</promise>
- If tasks remain [ ], just end your response (next iteration will continue)
- If tests failed, output exactly: <promise>FAILED</promise>"

    # Run Claude
    result=$(claude --dangerously-skip-permissions -p "$prompt" 2>&1) || true

    echo "$result"
    echo ""

    # Check for completion signals
    if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
        # Get commit hash if available
        commit_hash=$(git rev-parse --short HEAD 2>/dev/null || echo "")
        complete_task "$CURRENT_TASK" "$commit_hash"

        echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}  All tasks complete after $i iterations!${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"

        echo ""
        "$SCRIPT_DIR/ralph-db.sh" status 2>/dev/null || true
        exit 0
    fi

    if [[ "$result" == *"<promise>FAILED</promise>"* ]]; then
        if ! fail_task "$CURRENT_TASK" "Test failure in iteration $i"; then
            echo -e "${RED}Task $CURRENT_TASK has failed 3+ times. Marked as failed.${NC}"
            echo -e "${YELLOW}Continuing with next task...${NC}"
        fi
        echo -e "${YELLOW}Tests failed. Continuing to next iteration...${NC}"
    else
        # Normal completion (task done but more tasks remain)
        # Check if PRD shows this task complete
        if grep -q "\[x\]" PRD.md 2>/dev/null; then
            commit_hash=$(git rev-parse --short HEAD 2>/dev/null || echo "")
            complete_task "$CURRENT_TASK" "$commit_hash"
        fi
    fi

    sleep $SLEEP
done

echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  Reached max iterations ($MAX)${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"

echo ""
"$SCRIPT_DIR/ralph-db.sh" status 2>/dev/null || true

exit 1
