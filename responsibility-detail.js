/**
 * Ahmed Life OS - Responsibility Detail Page
 */

import { DateUtils, PRIORITY_CONFIG, STATUS_CONFIG } from '../../utils/utils.js';

export class ResponsibilityDetailPage {
  constructor(app) {
    this.app = app;
    this.storage = app.storage;
    this.router = app.router;
    this._currentSubPage = 'tasks';
    this._viewMode = 'list';
    this._dragSrc = null;
  }

  render(container, responsibilityId, subPage = 'tasks') {
    this._respId = responsibilityId;
    this._currentSubPage = subPage;

    const resp = this.storage.findInCollection('responsibilities', r => r.id === responsibilityId);
    if (!resp) {
      container.innerHTML = `<div class="page-content"><div class="empty-state"><div class="empty-state-title">Responsibility not found</div></div></div>`;
      return;
    }

    const tasks = this.storage.filterCollection('tasks', t => t.responsibilityId === responsibilityId);
    const done = tasks.filter(t => t.status === 'done').length;
    const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

    const SUB_PAGES = [
      { id: 'tasks', icon: '✅', label: 'Tasks' },
      { id: 'projects', icon: '📋', label: 'Projects' },
      { id: 'notes', icon: '📝', label: 'Notes' },
      { id: 'goals', icon: '🎯', label: 'Goals' },
      { id: 'files', icon: '📁', label: 'Files' },
      { id: 'calendar', icon: '📅', label: 'Calendar' },
      { id: 'statistics', icon: '📊', label: 'Statistics' },
    ];

    container.innerHTML = `
      <div class="page-content" style="padding:0;">
        <!-- Resp Header -->
        <div style="background:var(--color-surface);border-bottom:1px solid var(--color-border);padding:var(--space-5) var(--space-6);">
          <div class="flex items-center gap-4 mb-4">
            <div style="width:52px;height:52px;border-radius:var(--radius-lg);background:${resp.colorBg || '#f0fdfa'};display:flex;align-items:center;justify-content:center;font-size:26px;border:2px solid ${resp.color}20;">
              ${resp.icon}
            </div>
            <div style="flex:1">
              <div style="font-size:var(--text-xl);font-weight:var(--font-bold);color:var(--color-text-primary);">${resp.name}</div>
              <div style="font-size:var(--text-sm);color:var(--color-text-muted);">${resp.description || 'No description'}</div>
            </div>
            <div class="flex gap-2">
              <button class="btn btn-secondary btn-sm" id="resp-edit-btn">✏️ Edit</button>
              <button class="btn btn-primary btn-sm" id="resp-add-task-btn">＋ Add Task</button>
            </div>
          </div>

          <!-- Progress + Stats -->
          <div class="flex items-center gap-6 mb-4">
            <div style="flex:1">
              <div class="flex justify-between mb-1">
                <span style="font-size:var(--text-xs);color:var(--color-text-muted);">Overall Progress</span>
                <span style="font-size:var(--text-xs);font-weight:var(--font-bold);color:${resp.color}">${progress}%</span>
              </div>
              <div class="progress-bar" style="height:8px;">
                <div class="progress-fill" style="width:${progress}%;background:${resp.color}"></div>
              </div>
            </div>
            <div style="display:flex;gap:var(--space-4);flex-shrink:0;">
              <div style="text-align:center;">
                <div style="font-size:var(--text-lg);font-weight:var(--font-bold);color:var(--color-text-primary);">${tasks.length}</div>
                <div style="font-size:10px;color:var(--color-text-muted);text-transform:uppercase;">Total</div>
              </div>
              <div style="text-align:center;">
                <div style="font-size:var(--text-lg);font-weight:var(--font-bold);color:var(--color-success);">${done}</div>
                <div style="font-size:10px;color:var(--color-text-muted);text-transform:uppercase;">Done</div>
              </div>
              <div style="text-align:center;">
                <div style="font-size:var(--text-lg);font-weight:var(--font-bold);color:var(--color-warning);">${tasks.filter(t => t.status !== 'done' && DateUtils.isOverdue(t.dueDate)).length}</div>
                <div style="font-size:10px;color:var(--color-text-muted);text-transform:uppercase;">Overdue</div>
              </div>
            </div>
          </div>

          <!-- Sub-nav -->
          <div style="display:flex;gap:4px;overflow-x:auto;padding-bottom:2px;">
            ${SUB_PAGES.map(p => `
              <button class="btn btn-sm ${this._currentSubPage === p.id ? 'btn-primary' : 'btn-ghost'}" 
                      data-sub-page="${p.id}" style="white-space:nowrap;flex-shrink:0;">
                ${p.icon} ${p.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Sub-page content -->
        <div style="padding:var(--space-6);" id="resp-sub-content">
          ${this._renderSubPage(resp, subPage)}
        </div>
      </div>
    `;

    this._bindEvents(container, resp);
  }

  _renderSubPage(resp, subPage) {
    switch (subPage) {
      case 'tasks': return this._renderTasks(resp);
      case 'projects': return this._renderProjects(resp);
      case 'notes': return this._renderNotes(resp);
      case 'goals': return this._renderGoals(resp);
      case 'files': return this._renderFiles(resp);
      case 'calendar': return this._renderCalendar(resp);
      case 'statistics': return this._renderStatistics(resp);
      default: return this._renderTasks(resp);
    }
  }

  _renderTasks(resp) {
    const tasks = this.storage.filterCollection('tasks', t => t.responsibilityId === resp.id);
    const byStatus = {
      todo: tasks.filter(t => t.status === 'todo'),
      in_progress: tasks.filter(t => t.status === 'in_progress'),
      review: tasks.filter(t => t.status === 'review'),
      done: tasks.filter(t => t.status === 'done'),
    };

    return `
      <div>
        <div class="flex items-center justify-between mb-4">
          <div class="flex gap-2">
            <button class="btn btn-sm ${this._viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}" data-view="list">☰ List</button>
            <button class="btn btn-sm ${this._viewMode === 'kanban' ? 'btn-primary' : 'btn-ghost'}" data-view="kanban">⊞ Kanban</button>
          </div>
          <div class="flex gap-2">
            <select class="select-field" style="width:auto;font-size:var(--text-sm);padding:6px 32px 6px 12px;" id="task-filter-priority">
              <option value="all">All Priorities</option>
              <option value="urgent">🔴 Urgent</option>
              <option value="high">🟠 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
            <button class="btn btn-primary btn-sm" id="sub-add-task">＋ Add Task</button>
          </div>
        </div>

        ${this._viewMode === 'kanban' ? this._renderKanban(tasks, resp) : this._renderListTasks(tasks, byStatus, resp)}
      </div>
    `;
  }

  _renderListTasks(tasks, byStatus, resp) {
    if (tasks.length === 0) return `
      <div class="empty-state">
        <div class="empty-state-icon">✅</div>
        <div class="empty-state-title">No tasks yet</div>
        <div class="empty-state-desc">Create your first task to get started.</div>
        <button class="btn btn-primary mt-2" id="sub-add-task-empty">＋ Add Task</button>
      </div>
    `;

    const sections = [
      { key: 'in_progress', label: '🔵 In Progress', color: 'var(--color-info)' },
      { key: 'todo', label: '⭕ To Do', color: 'var(--color-text-muted)' },
      { key: 'review', label: '🟡 In Review', color: 'var(--color-warning)' },
      { key: 'done', label: '✅ Done', color: 'var(--color-success)' },
    ];

    return sections.map(sec => {
      const sectionTasks = byStatus[sec.key] || [];
      if (sectionTasks.length === 0) return '';
      return `
        <div class="mb-5">
          <div style="font-size:var(--text-sm);font-weight:var(--font-semibold);color:var(--color-text-secondary);margin-bottom:var(--space-2);display:flex;align-items:center;gap:var(--space-2);">
            ${sec.label}
            <span style="background:var(--color-bg-secondary);color:var(--color-text-muted);font-size:10px;padding:2px 6px;border-radius:var(--radius-full);font-weight:var(--font-bold);">
              ${sectionTasks.length}
            </span>
          </div>
          <div class="card" style="padding:0;overflow:hidden;">
            ${sectionTasks.map(task => this._renderTaskRow(task, resp)).join('<div style="height:1px;background:var(--color-border-light);"></div>')}
          </div>
        </div>
      `;
    }).join('');
  }

  _renderTaskRow(task, resp) {
    const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
    const isOverdue = task.status !== 'done' && DateUtils.isOverdue(task.dueDate);
    const doneCheck = task.checklist?.length ? `${task.checklist.filter(c=>c.done).length}/${task.checklist.length}` : '';

    return `
      <div class="task-item" data-task-id="${task.id}" style="padding:var(--space-3) var(--space-4);">
        <div class="task-checkbox ${task.status === 'done' ? 'checked' : ''}" data-task-toggle="${task.id}">
          ${task.status === 'done' ? '✓' : ''}
        </div>
        <div class="task-content">
          <div class="task-title ${task.status === 'done' ? 'completed' : ''}">${task.title}</div>
          <div class="task-meta">
            <span class="badge" style="background:${priority.bg};color:${priority.color}">${priority.icon} ${priority.label}</span>
            ${task.dueDate ? `<span class="task-date ${isOverdue ? 'overdue' : ''}">${isOverdue ? '⚠️ ' : '📅 '}${DateUtils.format(task.dueDate, 'MMM D')}</span>` : ''}
            ${task.estimatedTime ? `<span class="task-date">⏱ ${Math.floor(task.estimatedTime/60) > 0 ? Math.floor(task.estimatedTime/60)+'h ' : ''}${task.estimatedTime%60 > 0 ? task.estimatedTime%60+'m' : ''}</span>` : ''}
            ${doneCheck ? `<span class="task-date">☑ ${doneCheck}</span>` : ''}
            ${task.tags?.length ? task.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
          </div>
        </div>
        <div class="task-actions">
          <button class="icon-btn btn-sm" data-task-edit="${task.id}" title="Edit task">✏️</button>
          <button class="icon-btn btn-sm" data-task-delete="${task.id}" title="Delete" style="color:var(--color-error)">🗑️</button>
        </div>
      </div>
    `;
  }

  _renderKanban(tasks, resp) {
    const columns = [
      { key: 'todo', label: 'To Do', color: '#64748b' },
      { key: 'in_progress', label: 'In Progress', color: '#3b82f6' },
      { key: 'review', label: 'In Review', color: '#f59e0b' },
      { key: 'done', label: 'Done', color: '#22c55e' },
    ];

    return `
      <div class="kanban-board">
        ${columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return `
            <div class="kanban-column" data-column="${col.key}">
              <div class="kanban-column-header">
                <div class="kanban-column-title">
                  <div style="width:10px;height:10px;border-radius:50%;background:${col.color};flex-shrink:0;"></div>
                  ${col.label}
                </div>
                <span class="kanban-count">${colTasks.length}</span>
              </div>
              <div class="kanban-cards" id="kanban-${col.key}" data-status="${col.key}">
                ${colTasks.map(task => this._renderKanbanCard(task, resp)).join('')}
              </div>
              <button class="btn btn-ghost btn-sm" data-kanban-add="${col.key}" style="width:100%;margin-top:var(--space-2);justify-content:flex-start;color:var(--color-text-muted);">
                ＋ Add task
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  _renderKanbanCard(task, resp) {
    const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
    return `
      <div class="kanban-card" draggable="true" data-task-id="${task.id}">
        <div class="kanban-card-title">${task.title}</div>
        ${task.checklist?.length ? `
          <div style="margin:var(--space-2) 0;">
            <div class="progress-bar" style="height:4px;">
              <div class="progress-fill" style="width:${Math.round(task.checklist.filter(c=>c.done).length/task.checklist.length*100)}%"></div>
            </div>
            <div style="font-size:10px;color:var(--color-text-muted);margin-top:2px;">${task.checklist.filter(c=>c.done).length}/${task.checklist.length}</div>
          </div>
        ` : ''}
        <div class="kanban-card-meta">
          <span class="badge" style="background:${priority.bg};color:${priority.color};font-size:10px;">${priority.icon} ${priority.label}</span>
          ${task.dueDate ? `<span style="font-size:10px;color:${DateUtils.isOverdue(task.dueDate) ? 'var(--color-error)' : 'var(--color-text-muted)'};">📅 ${DateUtils.format(task.dueDate,'MMM D')}</span>` : ''}
        </div>
      </div>
    `;
  }

  _renderNotes(resp) {
    const notes = this.storage.filterCollection('notes', n => n.responsibilityId === resp.id);
    return `
      <div>
        <div class="flex justify-between mb-4">
          <div class="section-title">Notes</div>
          <button class="btn btn-primary btn-sm" id="add-note-btn">＋ Add Note</button>
        </div>
        ${notes.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">📝</div>
            <div class="empty-state-title">No notes yet</div>
            <div class="empty-state-desc">Create notes to capture ideas and important information.</div>
            <button class="btn btn-primary mt-2" id="add-note-empty-btn">＋ Add Note</button>
          </div>
        ` : `
          <div class="grid-cols-auto">
            ${notes.map(note => `
              <div class="card card-interactive" data-note-id="${note.id}" style="padding:var(--space-4);">
                <div style="font-size:var(--text-base);font-weight:var(--font-semibold);margin-bottom:var(--space-2);">${note.title || 'Untitled'}</div>
                <div style="font-size:var(--text-sm);color:var(--color-text-muted);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">
                  ${note.content?.replace(/<[^>]*>/g,'') || 'Empty note'}
                </div>
                <div style="font-size:var(--text-xs);color:var(--color-text-muted);margin-top:var(--space-3);">${DateUtils.relative(note.updatedAt)}</div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  _renderGoals(resp) {
    const goals = this.storage.filterCollection('goals', g => g.responsibilityId === resp.id);
    return `
      <div>
        <div class="flex justify-between mb-4">
          <div class="section-title">Goals</div>
          <button class="btn btn-primary btn-sm" id="add-goal-btn">＋ Add Goal</button>
        </div>
        ${goals.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">🎯</div>
            <div class="empty-state-title">No goals yet</div>
            <div class="empty-state-desc">Set goals to track your bigger objectives and milestones.</div>
          </div>
        ` : goals.map(g => `
          <div class="card mb-3" style="padding:var(--space-4);">
            <div class="flex justify-between items-start mb-3">
              <div>
                <div style="font-size:var(--text-base);font-weight:var(--font-semibold);">${g.title}</div>
                <div style="font-size:var(--text-sm);color:var(--color-text-muted);">${g.description || ''}</div>
              </div>
              <span class="badge badge-${g.status === 'done' ? 'success' : 'primary'}">${g.progress || 0}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${g.progress || 0}%;background:${resp.color}"></div>
            </div>
            ${g.deadline ? `<div style="font-size:var(--text-xs);color:var(--color-text-muted);margin-top:var(--space-2);">Deadline: ${DateUtils.format(g.deadline,'MMM D, YYYY')}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  _renderFiles(resp) {
    return `
      <div>
        <div class="flex justify-between mb-4">
          <div class="section-title">Files</div>
          <button class="btn btn-primary btn-sm" id="upload-file-btn">⬆️ Upload File</button>
        </div>
        <div class="empty-state">
          <div class="empty-state-icon">📁</div>
          <div class="empty-state-title">No files yet</div>
          <div class="empty-state-desc">Upload files to keep everything organized in one place.</div>
          <button class="btn btn-primary mt-2">⬆️ Upload File</button>
        </div>
      </div>
    `;
  }

  _renderProjects(resp) {
    const projects = this.storage.filterCollection('projects', p => p.responsibilityId === resp.id);
    return `
      <div>
        <div class="flex justify-between mb-4">
          <div class="section-title">Projects</div>
          <button class="btn btn-primary btn-sm" id="add-project-btn">＋ New Project</button>
        </div>
        ${projects.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <div class="empty-state-title">No projects yet</div>
            <div class="empty-state-desc">Create projects to organize complex work with tasks, files and timelines.</div>
            <button class="btn btn-primary mt-2" id="add-project-empty-btn">＋ New Project</button>
          </div>
        ` : projects.map(p => `
          <div class="card mb-3" style="padding:var(--space-4);">
            <div class="flex items-center gap-3">
              <div style="font-size:24px;">${p.icon || '📋'}</div>
              <div style="flex:1;">
                <div style="font-weight:var(--font-semibold);">${p.name}</div>
                <div style="font-size:var(--text-sm);color:var(--color-text-muted);">${p.description || ''}</div>
              </div>
              <span class="badge badge-primary">${p.progress || 0}%</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  _renderCalendar(resp) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const tasks = this.storage.filterCollection('tasks', t => t.responsibilityId === resp.id && t.dueDate);
    const today = now.getDate();

    let cells = '';
    for (let i = 0; i < firstDay; i++) cells += `<div class="calendar-day other-month"></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dayTasks = tasks.filter(t => t.dueDate && t.dueDate.startsWith(dateStr));
      cells += `
        <div class="calendar-day ${d === today ? 'today' : ''}">
          <div class="day-number">${d}</div>
          <div class="day-events">
            ${dayTasks.slice(0,2).map(t => `<div class="day-event" style="background:${resp.color}">${t.title}</div>`).join('')}
            ${dayTasks.length > 2 ? `<div style="font-size:10px;color:var(--color-text-muted)">+${dayTasks.length-2} more</div>` : ''}
          </div>
        </div>
      `;
    }

    return `
      <div>
        <div class="calendar-header mb-4">
          <div class="calendar-title">${months[month]} ${year}</div>
        </div>
        <div class="calendar-grid">
          ${days.map(d => `<div class="calendar-day-header">${d}</div>`).join('')}
          ${cells}
        </div>
      </div>
    `;
  }

  _renderStatistics(resp) {
    const tasks = this.storage.filterCollection('tasks', t => t.responsibilityId === resp.id);
    const done = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const overdue = tasks.filter(t => t.status !== 'done' && DateUtils.isOverdue(t.dueDate)).length;
    const byPriority = {
      urgent: tasks.filter(t => t.priority === 'urgent').length,
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    };

    return `
      <div>
        <div class="grid-cols-4 mb-6">
          <div class="stat-card"><div class="stat-card-label">Total Tasks</div><div class="stat-card-value">${tasks.length}</div></div>
          <div class="stat-card"><div class="stat-card-label">Completed</div><div class="stat-card-value" style="color:var(--color-success)">${done}</div></div>
          <div class="stat-card"><div class="stat-card-label">In Progress</div><div class="stat-card-value" style="color:var(--color-info)">${inProgress}</div></div>
          <div class="stat-card"><div class="stat-card-label">Overdue</div><div class="stat-card-value" style="color:var(--color-error)">${overdue}</div></div>
        </div>

        <div class="grid-cols-2 gap-6">
          <div class="card"><div class="card-header"><div class="section-title">By Status</div></div>
          <div class="card-body">
            ${[['Done','var(--color-success)',done],['In Progress','var(--color-info)',inProgress],['To Do','var(--color-text-muted)',todo]].map(([label,color,count]) => `
              <div class="flex items-center gap-3 mb-3">
                <div style="width:12px;height:12px;border-radius:50%;background:${color};flex-shrink:0;"></div>
                <span style="flex:1;font-size:var(--text-sm);">${label}</span>
                <span style="font-weight:var(--font-bold);">${count}</span>
                <div style="width:80px;"><div class="progress-bar"><div class="progress-fill" style="width:${tasks.length?Math.round(count/tasks.length*100):0}%;background:${color}"></div></div></div>
              </div>
            `).join('')}
          </div></div>

          <div class="card"><div class="card-header"><div class="section-title">By Priority</div></div>
          <div class="card-body">
            ${Object.entries(byPriority).map(([p, count]) => {
              const cfg = PRIORITY_CONFIG[p];
              return `
                <div class="flex items-center gap-3 mb-3">
                  <span>${cfg.icon}</span>
                  <span style="flex:1;font-size:var(--text-sm);">${cfg.label}</span>
                  <span style="font-weight:var(--font-bold);">${count}</span>
                  <div style="width:80px;"><div class="progress-bar"><div class="progress-fill" style="width:${tasks.length?Math.round(count/tasks.length*100):0}%;background:${cfg.color}"></div></div></div>
                </div>
              `;
            }).join('')}
          </div></div>
        </div>
      </div>
    `;
  }

  _bindEvents(container, resp) {
    container.addEventListener('click', (e) => {
      // Sub-page navigation
      const subPageBtn = e.target.closest('[data-sub-page]');
      if (subPageBtn) {
        this._currentSubPage = subPageBtn.dataset.subPage;
        this.router.navigate('responsibility', { responsibilityId: resp.id, subPage: this._currentSubPage });
        return;
      }

      // View toggle
      const viewBtn = e.target.closest('[data-view]');
      if (viewBtn) {
        this._viewMode = viewBtn.dataset.view;
        document.getElementById('resp-sub-content').innerHTML = this._renderSubPage(resp, this._currentSubPage);
        this._bindSubEvents(resp);
        return;
      }

      // Task check
      const toggle = e.target.closest('[data-task-toggle]');
      if (toggle) {
        this._toggleTask(toggle.dataset.taskToggle, resp);
        return;
      }

      // Task edit
      const editBtn = e.target.closest('[data-task-edit]');
      if (editBtn) {
        this.app.openTaskModal(editBtn.dataset.taskEdit);
        return;
      }

      // Task delete
      const delBtn = e.target.closest('[data-task-delete]');
      if (delBtn) {
        this._deleteTask(delBtn.dataset.taskDelete, resp);
        return;
      }

      // Add task buttons
      if (e.target.id === 'resp-add-task-btn' || e.target.id === 'sub-add-task' ||
          e.target.id === 'sub-add-task-empty') {
        this.app.openTaskModal(null, resp.id);
        return;
      }

      // Kanban add
      const kanbanAdd = e.target.closest('[data-kanban-add]');
      if (kanbanAdd) {
        this.app.openTaskModal(null, resp.id, kanbanAdd.dataset.kanbanAdd);
        return;
      }

      // Edit resp
      if (e.target.id === 'resp-edit-btn') {
        this.app.openResponsibilityModal(resp);
      }

      // Add note
      if (e.target.id === 'add-note-btn' || e.target.id === 'add-note-empty-btn') {
        this.app.openNoteModal(null, resp.id);
      }

      // Add goal
      if (e.target.id === 'add-goal-btn') {
        this.app.openGoalModal(null, resp.id);
      }

      // Note open
      const noteCard = e.target.closest('[data-note-id]');
      if (noteCard) {
        this.app.openNoteModal(noteCard.dataset.noteId, resp.id);
      }
    });

    this._setupKanbanDragDrop(resp);
  }

  _bindSubEvents(resp) {
    this._bindEvents(document.getElementById('app-main'), resp);
    this._setupKanbanDragDrop(resp);
  }

  _setupKanbanDragDrop(resp) {
    const cards = document.querySelectorAll('.kanban-card[draggable]');
    const cols = document.querySelectorAll('.kanban-cards');

    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        this._dragSrc = card.dataset.taskId;
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
    });

    cols.forEach(col => {
      col.addEventListener('dragover', (e) => { e.preventDefault(); col.style.background = 'var(--color-primary-50)'; });
      col.addEventListener('dragleave', () => col.style.background = '');
      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.style.background = '';
        const newStatus = col.dataset.status;
        if (this._dragSrc && newStatus) {
          this.storage.updateInCollection('tasks', this._dragSrc, { status: newStatus });
          this.app.toast.success(`Task moved to ${STATUS_CONFIG[newStatus]?.label}`);
          this.app.bus.emit('tasks:changed');
          document.getElementById('resp-sub-content').innerHTML = this._renderSubPage(resp, 'kanban');
          this._bindSubEvents(resp);
          this._setupKanbanDragDrop(resp);
        }
        this._dragSrc = null;
      });
    });
  }

  _toggleTask(taskId, resp) {
    const task = this.storage.findInCollection('tasks', t => t.id === taskId);
    if (!task) return;
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    this.storage.updateInCollection('tasks', taskId, { status: newStatus });
    this.app.bus.emit('tasks:changed');
    this.app.toast.success(newStatus === 'done' ? '✅ Task completed!' : 'Task reopened');
    document.getElementById('resp-sub-content').innerHTML = this._renderSubPage(resp, this._currentSubPage);
    this._bindSubEvents(resp);
  }

  _deleteTask(taskId, resp) {
    const task = this.storage.findInCollection('tasks', t => t.id === taskId);
    if (!task) return;
    const modal = this.app.modal.open({
      title: 'Delete Task',
      size: 'sm',
      content: `<div class="confirm-dialog"><div class="confirm-icon danger">🗑️</div><div class="confirm-title">Delete "${task.title}"?</div><div class="confirm-message">This action cannot be undone.</div></div>`,
      footer: `<button class="btn btn-secondary" id="cancel-del">Cancel</button><button class="btn btn-danger" id="confirm-del">Delete</button>`
    });
    document.getElementById('cancel-del')?.addEventListener('click', () => modal.close());
    document.getElementById('confirm-del')?.addEventListener('click', () => {
      this.storage.deleteFromCollection('tasks', taskId);
      modal.close();
      this.app.toast.success('Task deleted');
      this.app.bus.emit('tasks:changed');
      document.getElementById('resp-sub-content').innerHTML = this._renderSubPage(resp, this._currentSubPage);
      this._bindSubEvents(resp);
    });
  }
}
