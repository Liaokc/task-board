# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Agent 团队协作看板** (Agent Team Collaboration Kanban) — a pure frontend Kanban board for coordinating a multi-agent team (CTO, Builder, Research, Ops, CoS, QA). It is part of a larger macOS Agent tooling project (`../macos-agent-tooling/`).

## Running the Board

```bash
open index.html
```

No server required — just open `index.html` in a browser. The board reads from `tasks.json` via fetch every 10 seconds.

## Updating Tasks via CLI

```bash
# Update task stage
node update-task.js --task-id=task-005 --stage=done

# Update duration and report
node update-task.js --task-id=task-005 --duration=1800000 --report="完成报告"

# Set startedAt timestamp
node update-task.js --task-id=task-005 --startedAt=1742894400000
```

## Architecture

### Data Flow
- `tasks.json` is the source of truth — agents write task updates here
- `index.html` is a **read-only display** that polls `tasks.json` every 10 seconds
- `update-task.js` is the CLI tool agents use to update task state
- The board auto-refreshes; agents don't need to notify it manually

### Task Schema
Tasks have these fields:
- `id`, `title`, `description` — identity and content
- `stage` — `todo` | `doing` | `done` | `blocked`
- `category` — `project` (default) or `daily`
- `assignees` — array of `{ agent, role }` objects (agents: CTO, Builder, Research, Ops, CoS, QA)
- `startedAt` — Unix ms timestamp when work began
- `doneAt` — Unix ms timestamp when completed
- `duration` — elapsed time in ms
- `finalReport` — completion report summary
- `createdAt` — creation timestamp

### Column Logic
- **TODO**: `stage === 'todo'`
- **DOING**: `stage === 'doing'` — shows live duration counter
- **DONE**: `stage === 'done'` with no `doneAt` or `doneAt` within 12 hours
- **History**: `stage === 'done'` + `doneAt` > 12 hours ago
- **Daily**: `category === 'daily'` — shown in collapsible daily section

### File Structure
- `index.html` — single-file Kanban app (HTML + CSS + JS, zero dependencies)
- `tasks.json` — task database (active tasks + history)
- `update-task.js` — Node.js CLI for task updates
- `README.md` — user-facing documentation

## Agent Team Roles

| Agent | Role |
|-------|------|
| CTO | Architecture, planning, technical decisions |
| Builder | Implementation (Swift/Python) |
| Research | Investigation, research tasks |
| Ops | Deployment, infrastructure, environment |
| CoS | Coordination, process, handoffs |
| QA | Code review, testing, quality assurance |
