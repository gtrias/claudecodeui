-- Ralph Skill SQLite Database Schema
-- Version: 1.0.0
-- Purpose: Track tasks, iterations, and project metadata for Ralph Loop

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ============================================================================
-- TASKS TABLE
-- Stores all user stories and enhancement tasks
-- ============================================================================
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Task identification
    task_id TEXT UNIQUE NOT NULL,           -- US-001, ENH-001-01
    type TEXT NOT NULL DEFAULT 'user_story', -- user_story, enhancement

    -- Task content
    name TEXT NOT NULL,                      -- Short title
    description TEXT,                        -- Full description (As a... I want... So that...)
    acceptance_criteria TEXT,                -- JSON array of criteria
    test_steps TEXT,                         -- Playwright test steps (JSON array)
    test_file TEXT,                          -- Path to generated test file

    -- Status tracking
    status TEXT NOT NULL DEFAULT 'planned',  -- planned, in-progress, completed, failed
    priority INTEGER DEFAULT 0,              -- Lower = higher priority
    iteration_count INTEGER DEFAULT 0,       -- Number of attempts

    -- Source tracking
    source_file TEXT,                        -- PRD.md, docs/enhancements/ENH-001.md
    parent_task_id TEXT,                     -- For sub-tasks (references task_id)

    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,

    -- Constraints
    CHECK (status IN ('planned', 'in-progress', 'completed', 'failed')),
    CHECK (type IN ('user_story', 'enhancement', 'bug_fix', 'refactor')),
    FOREIGN KEY (parent_task_id) REFERENCES tasks(task_id)
);

-- ============================================================================
-- ITERATIONS TABLE
-- Logs each Ralph loop iteration attempt
-- ============================================================================
CREATE TABLE IF NOT EXISTS iterations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Task reference
    task_id TEXT NOT NULL,
    iteration_number INTEGER NOT NULL,       -- Global iteration count

    -- Outcome
    outcome TEXT NOT NULL,                   -- success, failure, skipped
    error_message TEXT,                      -- Error details if failed

    -- Learning capture
    learnings TEXT,                          -- What was learned
    patterns_discovered TEXT,                -- Reusable patterns (JSON array)

    -- Test results
    test_results TEXT,                       -- Test output/Playwright results
    test_passed INTEGER,                     -- 1 = passed, 0 = failed

    -- Changes made
    files_changed TEXT,                      -- JSON array of file paths
    commit_hash TEXT,                        -- Git commit SHA if committed

    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER,                -- How long the iteration took

    -- Constraints
    CHECK (outcome IN ('success', 'failure', 'skipped')),
    FOREIGN KEY (task_id) REFERENCES tasks(task_id)
);

-- ============================================================================
-- PROJECT_META TABLE
-- Key-value store for project settings and state
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_meta (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- BLOCKERS TABLE
-- Track issues preventing task completion
-- ============================================================================
CREATE TABLE IF NOT EXISTS blockers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    description TEXT NOT NULL,
    resolved INTEGER DEFAULT 0,              -- 0 = active, 1 = resolved
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,

    FOREIGN KEY (task_id) REFERENCES tasks(task_id)
);

-- ============================================================================
-- INDEXES
-- Performance optimization for common queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_source ON tasks(source_file);
CREATE INDEX IF NOT EXISTS idx_iterations_task ON iterations(task_id);
CREATE INDEX IF NOT EXISTS idx_iterations_outcome ON iterations(outcome);
CREATE INDEX IF NOT EXISTS idx_blockers_task ON blockers(task_id);
CREATE INDEX IF NOT EXISTS idx_blockers_resolved ON blockers(resolved);

-- ============================================================================
-- TRIGGERS
-- Automatic timestamp updates
-- ============================================================================
CREATE TRIGGER IF NOT EXISTS update_task_timestamp
AFTER UPDATE ON tasks
BEGIN
    UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_meta_timestamp
AFTER UPDATE ON project_meta
BEGIN
    UPDATE project_meta SET updated_at = CURRENT_TIMESTAMP WHERE key = NEW.key;
END;

-- ============================================================================
-- DEFAULT PROJECT METADATA
-- ============================================================================
INSERT OR IGNORE INTO project_meta (key, value) VALUES
    ('ralph_version', '2.0.0'),
    ('schema_version', '1.0.0'),
    ('total_iterations', '0'),
    ('project_started', CURRENT_TIMESTAMP),
    ('last_iteration', NULL);

-- ============================================================================
-- VIEWS
-- Convenient query shortcuts
-- ============================================================================
CREATE VIEW IF NOT EXISTS v_task_summary AS
SELECT
    task_id,
    name,
    type,
    status,
    priority,
    iteration_count,
    (SELECT COUNT(*) FROM iterations i WHERE i.task_id = t.task_id AND outcome = 'failure') as failure_count,
    created_at,
    completed_at
FROM tasks t
ORDER BY
    CASE status
        WHEN 'in-progress' THEN 1
        WHEN 'planned' THEN 2
        WHEN 'failed' THEN 3
        WHEN 'completed' THEN 4
    END,
    priority,
    created_at;

CREATE VIEW IF NOT EXISTS v_blockers_active AS
SELECT
    b.id,
    b.task_id,
    t.name as task_name,
    b.description,
    b.created_at,
    (SELECT COUNT(*) FROM iterations i WHERE i.task_id = b.task_id AND outcome = 'failure') as attempt_count
FROM blockers b
JOIN tasks t ON b.task_id = t.task_id
WHERE b.resolved = 0
ORDER BY b.created_at DESC;

CREATE VIEW IF NOT EXISTS v_recent_activity AS
SELECT
    i.created_at,
    i.task_id,
    t.name as task_name,
    i.iteration_number,
    i.outcome,
    i.commit_hash
FROM iterations i
JOIN tasks t ON i.task_id = t.task_id
ORDER BY i.created_at DESC
LIMIT 20;
