# Agent 团队协作看板

纯前端单文件任务看板，支持 TODO / DOING / DONE 三阶段管理。

## 快速开始

直接在浏览器中打开 `index.html` 即可使用，无需服务器。

```bash
# macOS
open index.html

# 或直接拖入浏览器
```

## 数据存储

- **运行时**：数据保存在浏览器 `localStorage`，键名为 `task-board-v1`
- **持久化文件**：`tasks.json` 作为参考文件，实际读写由浏览器 localStorage 承接

> ⚠️ 清除浏览器数据会导致任务丢失，建议定期导出。

## 功能说明

### 新建任务
点击右上角 **+ 新任务**，填写：
- 标题（必填）
- 描述（可选）
- Agent（cto / builder / research / ops / cos）
- Role / 职责（如 architect / builder / ko 等）

### 状态流转

| 操作 | 流转 | 效果 |
|------|------|------|
| ▶ 开始 | TODO → DOING | 记录 `startedAt`，可填 agent/role |
| ✅ 完成 | DOING → DONE | 记录 `doneAt`，生成报告摘要 |
| 🔄 还原 | DONE → TODO | 清空 `doneAt` + `report` |
| ⏸ 暂停 | DOING → TODO | 回退到 TODO，清除 startedAt |
| 🗑️ | — → 删除 | 确认后删除 |

### DOING 实时时长
- DOING 阶段任务实时显示持续时长
- 每 30 秒全量刷新，每 10 秒局部刷新 duration 字段

## 快捷键

| 按键 | 效果 |
|------|------|
| `Ctrl/Cmd + Enter` | 保存任务（弹窗内） |
| `Esc` | 关闭弹窗 |

## Agent 团队使用指南

### 启动看板（任意机器）

```bash
cd ~/.openclaw/workspace/task-board
python3 -m http.server 8765
# 浏览器打开 http://localhost:8765
```

> 看板 10 秒自动刷新，无需手动刷新页面。

---

### Agent 更新任务的方法

所有 Agent 通过 `update-task.js` 操作 `tasks.json`，不直接编辑 JSON。

```bash
# 更新任务状态
node update-task.js --task-id=task-005 --stage=done --report="已完成"
node update-task.js --task-id=task-005 --stage=done --duration=3600000

# 新建任务
node update-task.js --new-task --title="新需求分析" --agent=CoS --role="需求分析"

# 任务开始（记录 startedAt）
node update-task.js --task-id=task-005 --stage=doing --startedAt=$(date +%s000)
```

---

### tasks.json 结构

```json
{
  "tasks": [
    {
      "id": "task-001",
      "title": "任务标题",
      "category": "project",          // "project" | "daily"
      "stage": "doing",             // "todo" | "doing" | "done"
      "assignees": [
        { "agent": "Builder", "role": "后端实现" }
      ],
      "startedAt": 1744500000000,   // 13位毫秒时间戳，未开始为 null
      "duration": 0,                // 累计毫秒数
      "finalReport": "完成报告摘要",
      "createdAt": 1744500000000
    }
  ],
  "history": [
    {
      "taskId": "task-old",         // 历史任务 ID
      "title": "已完成的历史任务",
      "assignees": [...],
      "doneAt": 1742901600000,     // 完成时间
      "movedToHistoryAt": 1742950620000,
      "duration": 7200000,
      "finalReport": "..."
    }
  ]
}
```

---

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 任务唯一标识，格式 `task-{序号}` |
| `title` | string | ✅ | 任务标题 |
| `category` | string | ✅ | `project`=项目任务，`daily`=日常任务 |
| `stage` | string | ✅ | `todo`/`doing`/`done` |
| `assignees` | array | ✅ | 负责人，`agent` 为 Agent 名称，`role` 为职责 |
| `startedAt` | number | 推荐 | 毫秒时间戳，开始时写入，暂停时清除 |
| `duration` | number | 推荐 | 累计毫秒数（不含暂停段） |
| `finalReport` | string | 完成时 | 简短完成报告 |
| `doneAt` | number | 完成时 | 毫秒时间戳，超过12小时自动移入 history |
| `createdAt` | number | ✅ | 毫秒时间戳 |

---

### 任务生命周期

```
新建任务 ──▶ TODO ──▶ 开始（startedAt 写入）
                              │
                         暂停（duration 累加，startedAt 清空）
                              │
                         重新开始（startedAt 重置）
                              │
                         完成（doneAt 写入）
                              │
                         >12h ──▶ history[]（自动迁移）
```

---

### Agent 协作规范

1. **每次完成任务必须更新**：`--stage=done --report=...`
2. **doneAt 由 update-task.js 自动写入**，不要手动写入
3. **暂停时 duration 会自动累加**（>=v5 修复后），不需要手动计算
4. **超过12小时的任务自动进入 history[]**，不需要手动迁移
5. **daily 任务放在 `tasks[]`**，且 `category: "daily"`，会显示在看板底部独立区域

---

### 本地开发

```bash
# 克隆后首次运行
cd task-board
python3 -m http.server 8765
open http://localhost:8766
```

---

## 技术栈

- 纯 Vanilla HTML/CSS/JS，零外部依赖
- localStorage 持久化
- 响应式设计，支持移动端
