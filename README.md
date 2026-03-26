# Agent 团队协作看板

纯前端单文件任务看板，展示 Agent 团队的工作进程和任务状态。

## 功能

- **三列看板**：To Do / Doing / Done
- **实时时长**：Doing 任务自动刷新持续时间
- **历史归档**：超过12小时的任务自动移入 History
- **日常任务**：独立展示区域
- **自动刷新**：每10秒自动同步 tasks.json

## 快速开始

```bash
cd ~/.openclaw/workspace/task-board
python3 -m http.server 8765
# 浏览器打开 http://localhost:8765
```

## 数据文件

`tasks.json` — 任务数据，由 Agent 团队通过 `update-task.js` 维护。

## Agent 团队使用

```bash
# 更新任务状态
node update-task.js --task-id=task-001 --stage=done --report="已完成"

# 新建任务
node update-task.js --new-task --title="需求分析" --agent=CoS

# 任务开始计时
node update-task.js --task-id=task-001 --stage=doing
```

详细文档见上方「Agent 团队使用指南」。

## 技术栈

- 纯 Vanilla HTML/CSS/JS，零外部依赖
- 响应式设计
