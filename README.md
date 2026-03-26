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

## 技术栈

- 纯 Vanilla HTML/CSS/JS，零外部依赖
- localStorage 持久化
- 响应式设计，支持移动端
