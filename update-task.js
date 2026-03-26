#!/usr/bin/env node
/**
 * update-task.js — 更新 tasks.json 中指定任务的状态
 * 
 * 用法:
 *   node update-task.js --task-id=task-005 --stage=done --duration=1800000 --report="完成报告"
 *   node update-task.js --task-id=task-005 --startedAt=1742894400000
 *   node update-task.js --new-task --title="新任务标题" --description="描述" --agent=Builder
 * 
 * 参数（均为可选，均出现时仅更新提供的字段）:
 *   --task-id      任务ID（--new-task 时不填）
 *   --new-task     创建新任务（与 --task-id 互斥）
 *   --title        新建任务时的标题
 *   --description  新建任务时的描述
 *   --agent        新建任务时的 Agent 分配
 *   --role         新建任务时的 Role
 *   --stage        更新 stage（pending|doing|done|blocked）
 *   --duration     更新 duration（毫秒数）
 *   --report       更新 finalReport
 *   --doneAt       更新 doneAt（毫秒时间戳，任务完成时设置）
 * 
 * 退出码: 0 成功，1 失败
 */

const fs = require('fs');
const path = require('path');

const TASKS_FILE = path.join(__dirname, 'tasks.json');

// ── 参数解析 ────────────────────────────────────────────────
function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith('--')) continue;
    const idx = arg.indexOf('=');
    let key, val;
    if (idx === -1) {
      // 无值布尔标志（--new-task）
      key = arg.slice(2);
      val = true;
    } else {
      key = arg.slice(2, idx);
      val = arg.slice(idx + 1);
    }
    // kebab-case → camelCase（兼容 task-id / final-report 等）
    key = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    // 数值字段尝试转换
    if (key === 'duration' || key === 'startedAt' || key === 'doneAt') {
      args[key] = parseInt(val, 10);
    } else {
      args[key] = val;
    }
  }
  return args;
}

// ── 新建任务 ────────────────────────────────────────────────
function createTask(params) {
  if (!params.title) {
    console.error('❌ 新建任务缺少 --title 参数');
    process.exit(1);
  }

  // 读取 tasks.json
  let data;
  try {
    const raw = fs.readFileSync(TASKS_FILE, 'utf-8');
    data = JSON.parse(raw);
  } catch (err) {
    console.error(`❌ 读取 tasks.json 失败: ${err.message}`);
    process.exit(1);
  }

  if (!data.tasks) data.tasks = [];

  const taskId = 'task-' + Date.now();
  const newTask = {
    id: taskId,
    title: params.title,
    description: params.description || '',
    stage: 'todo',
    assignees: params.agent
      ? [{ agent: params.agent, role: params.role || '' }]
      : [],
    startedAt: null,
    duration: 0,
    finalReport: '',
    createdAt: Date.now()
  };

  data.tasks.push(newTask);

  try {
    fs.writeFileSync(TASKS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`❌ 写入 tasks.json 失败: ${err.message}`);
    process.exit(1);
  }

  console.log(`✅ 新建任务成功: ${taskId}`);
  console.log(`   标题: ${newTask.title}`);
  console.log(`   描述: ${newTask.description || '（无）'}`);
  console.log(`   Agent: ${params.agent || '（未分配）'}`);
}

// ── 主逻辑 ──────────────────────────────────────────────────
function main() {
  const params = parseArgs();

  if (params.newTask !== undefined) {
    createTask(params);
    return;
  }

  if (!params.taskId) {
    console.error('❌ 缺少 --task-id 参数（新建任务请用 --new-task --title=xxx）');
    process.exit(1);
  }

  // 读取 tasks.json
  let data;
  try {
    const raw = fs.readFileSync(TASKS_FILE, 'utf-8');
    data = JSON.parse(raw);
  } catch (err) {
    console.error(`❌ 读取 tasks.json 失败: ${err.message}`);
    process.exit(1);
  }

  // 查找任务
  const task = data.tasks.find(t => t.id === params.taskId);
  if (!task) {
    console.error(`❌ 未找到任务: ${params.taskId}`);
    process.exit(1);
  }

  // 更新字段
  const updatable = ['stage', 'duration', 'finalReport', 'startedAt', 'doneAt'];
  let updated = [];

  for (const field of updatable) {
    // 命令行参数 key 是 camelCase（如 finalReport），arg key 也是
    if (params[field] !== undefined) {
      const oldVal = task[field];
      task[field] = params[field];
      updated.push({ field, from: oldVal, to: task[field] });
    }
  }

  // stage → done 时自动写入 doneAt（若未显式指定）
  if (params.stage === 'done' && !params.doneAt && !task.doneAt) {
    const now = Date.now();
    updated.push({ field: 'doneAt', from: task.doneAt || '(空)', to: now });
    task.doneAt = now;
  }

  if (updated.length === 0) {
    console.warn('⚠️  未提供任何需要更新的字段');
    process.exit(0);
  }

  // R2: done 且 doneAt > 12小时 → 迁移到 history[]
  if (task.stage === 'done' && task.doneAt && (Date.now() - task.doneAt > 12 * 60 * 60 * 1000)) {
    data.tasks = data.tasks.filter(t => t.id !== task.id);
    if (!data.history) data.history = [];
    data.history.push({ ...task, movedToHistoryAt: Date.now() });
    console.log(`📦 任务 ${task.id} 已迁移到 history[]（完成超过12小时）`);
  }

  // 写回
  try {
    fs.writeFileSync(TASKS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`❌ 写入 tasks.json 失败: ${err.message}`);
    process.exit(1);
  }

  // 输出结果
  console.log(`✅ 任务 ${params.taskId} 更新成功（共更新 ${updated.length} 个字段）:`);
  for (const u of updated) {
    const fromStr = u.from === 0 || u.from === '' || u.from == null
      ? '(空)'
      : JSON.stringify(u.from);
    const toStr   = u.to   === 0 || u.to   === ''
      ? '(空)'
      : JSON.stringify(u.to);
    console.log(`   • ${u.field}: ${fromStr} → ${toStr}`);
  }
}

main();
