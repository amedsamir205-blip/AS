/**
 * Ahmed Life OS - Dashboard Page
 */

import { DateUtils, NumberUtils, PRIORITY_CONFIG, STATUS_CONFIG } from '../../utils/utils.js';

export class DashboardPage {
  constructor(app) {
    this.app = app;
    this.storage = app.storage;
    this.router = app.router;
    this._clockInterval = null;
  }

  render(container) {
    const settings = this.storage.get('settings') || {};
    const tasks = this.storage.getCollection('tasks');
    const responsibilities = this.storage.getCollection('responsibilities').filter(r => !r.isArchived);
    const habits = this.storage.getCollection('habits');
    const notifications = this.storage.getCollection('notifications');
    const events = this.storage.getCollection('events');

    const todayTasks = tasks.filter(t => t.status !== 'done' && DateUtils.isToday(t.dueDate));
    const overdueTasks = tasks.filter(t => t.status !== 'done' && DateUtils.isOverdue(t.dueDate));
    const doneTasks = tasks.filter(t => t.status === 'done');
    const completionRate = tasks.length ? Math.round((doneTasks.length / tasks.length) * 100) : 0;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');

    const userName = settings.userName || 'Ahmed';
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    container.innerHTML = `
      <div class="page-content" id="dashboard-page">
        <!-- Greeting Banner -->
        <div class="dashboard-greeting animate-fade-in">
          <div class="greeting-content">
            <div class="greeting-title">${greeting}, ${userName}! 👋</div>
            <div class="greeting-subtitle">
              ${DateUtils.format(new Date().toISOString(), 'dddd, MMMM D, YYYY')} &nbsp;•&nbsp;
              ${todayTasks.length} task${todayTasks.length !== 1 ? 's' : ''} due today
              ${overdueTasks.length ? ` &nbsp;•&nbsp; <span style="color:rgba(255,255,255,0.9);font-weight:600;">${overdueTasks.length} overdue</span>` : ''}
            </div>
          </div>
          <div class="greeting-time">
            <div class="greeting-time-value" id="dashboard-clock">${DateUtils.formatTime(new Date())}</div>
            <div class="greeting-time-date">${DateUtils.format(new Date().toISOString(), 'MMM D, YYYY')}</div>
          </div>
        </div>

        <!-- Stats Row -->
        <div class="dashboard-stats">
          <div class="stat-card animate-fade-in delay-1">
            <div class="stat-card-label">Total Tasks</div>
            <div class="stat-card-value">${tasks.length}</div>
            <div class="progress-bar mt-2">
              <div class="progress-fill" style="width:${completionRate}%"></div>
            </div>
            <div class="stat-card-change neutral mt-2">${completionRate}% complete</div>
          </div>

          <div class="stat-card animate-fade-in delay-2">
            <div class="stat-card-label">Due Today</div>
            <div class="stat-card-value" style="color:var(--color-primary)">${todayTasks.length}</div>
            <div class="stat-card-change ${inProgressTasks.length > 0 ? 'positive' : 'neutral'} mt-2">
              ${inProgressTasks.length > 0 ? `▲ ${inProgressTasks.length} in progress` : 'No tasks in progress'}
            </div>
          </div>

          <div class="stat-card animate-fade-in delay-3">
            <div class="stat-card-label">Overdue</div>
            <div class="stat-card-value" style="color:${overdueTasks.length > 0 ? 'var(--color-error)' : 'var(--color-success)'}">
              ${overdueTasks.length}
            </div>
            <div class="stat-card-change ${overdueTasks.length > 0 ? 'negative' : 'positive'} mt-2">
              ${overdueTasks.length > 0 ? '⚠️ Needs attention' : '✅ All on track'}
            </div>
          </div>

          <div class="stat-card animate-fade-in delay-4">
            <div class="stat-card-label">Responsibilities</div>
            <div class="stat-card-value">${responsibilities.length}</div>
            <div class="stat-card-change neutral mt-2">${habits.length} active habits</div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="dashboard-main-grid">
          <!-- Left: Tasks + Quick Actions -->
          <div class="dashboard-tasks-section">

            <!-- Today's Tasks -->
            <div class="card animate-fade-in delay-2">
              <div class="card-header">
                <div>
                  <div class="section-title">Today's Tasks</div>
                  <div class="section-subtitle">${todayTasks.length} tasks due today</div>
                </div>
                <div class="flex gap-2">
                  <button class="btn btn-sm btn-ghost" id="dash-view-all-tasks">View all</button>
                  <button class="btn btn-sm btn-primary" id="dash-add-task-btn">＋ Add Task</button>
                </div>
              </div>
              <div class="card-body" style="padding-top:var(--space-3);padding-bottom:var(--space-3);">
                ${todayTasks.length === 0 ? `
                  <div class="empty-state" style="padding:var(--space-8)">
                    <div class="empty-state-icon">✅</div>
                    <div class="empty-state-title">You're all caught up!</div>
                    <div class="empty-state-desc">No tasks due today. Enjoy your free time or add new tasks.</div>
                  </div>
                ` : todayTasks.slice(0, 6).map(task => this._renderTaskItem(task)).join('')}
              </div>
              ${todayTasks.length > 6 ? `
                <div class="card-footer text-center">
                  <button class="btn btn-ghost btn-sm" id="dash-load-more">Show ${todayTasks.length - 6} more</button>
                </div>
              ` : ''}
            </div>

            <!-- Overdue Tasks -->
            ${overdueTasks.length > 0 ? `
              <div class="card animate-fade-in delay-3" style="border-color:var(--color-error);border-left:4px solid var(--color-error);">
                <div class="card-header">
                  <div>
                    <div class="section-title" style="color:var(--color-error)">⚠️ Overdue Tasks</div>
                    <div class="section-subtitle">${overdueTasks.length} tasks need immediate attention</div>
                  </div>
                </div>
                <div class="card-body" style="padding-top:var(--space-3);">
                  ${overdueTasks.slice(0, 4).map(task => this._renderTaskItem(task, true)).join('')}
                </div>
              </div>
            ` : ''}

            <!-- In Progress -->
            ${inProgressTasks.length > 0 ? `
              <div class="card animate-fade-in delay-3">
                <div class="card-header">
                  <div class="section-title">🔵 In Progress</div>
                </div>
                <div class="card-body" style="padding-top:var(--space-3);">
                  ${inProgressTasks.slice(0, 3).map(task => this._renderTaskItem(task)).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Responsibilities Overview -->
            <div class="card animate-fade-in delay-4">
              <div class="card-header">
                <div class="section-title">Responsibilities</div>
                <button class="btn btn-sm btn-ghost" id="dash-view-responsibilities">View all</button>
              </div>
              <div class="card-body" style="padding-top:var(--space-2)">
                ${responsibilities.slice(0, 4).map(r => {
                  const rTasks = tasks.filter(t => t.responsibilityId === r.id);
                  const rDone = rTasks.filter(t => t.status === 'done').length;
                  const rProgress = rTasks.length ? Math.round((rDone / rTasks.length) * 100) : 0;
                  return `
                    <div class="flex items-center gap-3 mb-3 p-3 rounded-lg" style="border-radius:var(--radius-md);transition:background var(--transition-fast);cursor:pointer;" 
                         data-page="responsibility" data-resp-id="${r.id}"
                         onmouseover="this.style.background='var(--color-bg)'" onmouseout="this.style.background=''"
                         onclick="app.router.navigate('responsibility', {responsibilityId:'${r.id}'})">
                      <div style="width:36px;height:36px;border-radius:var(--radius-md);background:${r.colorBg || '#f0fdfa'};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">${r.icon}</div>
                      <div style="flex:1;min-width:0;">
                        <div style="font-size:var(--text-sm);font-weight:var(--font-medium);color:var(--color-text-primary);">${r.name}</div>
                        <div style="font-size:var(--text-xs);color:var(--color-text-muted);">${rTasks.length} tasks • ${rProgress}% done</div>
                        <div class="progress-bar mt-1" style="height:4px;">
                          <div class="progress-fill" style="width:${rProgress}%;background:${r.color}"></div>
                        </div>
                      </div>
                      <div style="font-size:var(--text-sm);font-weight:var(--font-semibold);color:${r.color}">${rProgress}%</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- Right Aside -->
          <div class="dashboard-aside">

            <!-- Mini Calendar -->
            <div id="dashboard-mini-calendar"></div>

            <!-- Habits Today -->
            <div class="card animate-fade-in delay-3">
              <div class="card-header">
                <div class="section-title">🔥 Today's Habits</div>
                <button class="btn btn-sm btn-ghost" id="dash-view-habits">All habits</button>
              </div>
              <div class="card-body" style="padding-top:var(--space-2)">
                ${habits.slice(0, 5).map(habit => {
                  const today = DateUtils.dateKey();
                  const done = habit.completions?.[today];
                  return `
                    <div class="flex items-center gap-3 mb-3 task-item" data-habit-id="${habit.id}" style="cursor:pointer;padding:var(--space-2) var(--space-3);">
                      <div class="task-checkbox ${done ? 'checked' : ''}" data-habit-toggle="${habit.id}">
                        ${done ? '✓' : ''}
                      </div>
                      <span style="font-size:18px;">${habit.icon}</span>
                      <span style="flex:1;font-size:var(--text-sm);font-weight:var(--font-medium);color:var(--color-text-primary);">${habit.name}</span>
                      ${habit.streak > 0 ? `
                        <span style="font-size:var(--text-xs);color:var(--color-warning);font-weight:var(--font-semibold);">🔥 ${habit.streak}</span>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
                ${habits.length === 0 ? `
                  <div class="empty-state" style="padding:var(--space-6)">
                    <div class="empty-state-icon">🌱</div>
                    <div class="empty-state-desc">No habits yet. Start building positive routines.</div>
                    <button class="btn btn-sm btn-primary mt-2" id="dash-add-habit-btn">Add Habit</button>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Recent Notifications -->
            <div class="card animate-fade-in delay-4">
              <div class="card-header">
                <div class="section-title">🔔 Notifications</div>
                <button class="btn btn-sm btn-ghost" id="dash-view-notifications">View all</button>
              </div>
              <div class="card-body" style="padding-top:var(--space-2)">
                ${notifications.slice(0, 4).map(n => `
                  <div class="flex gap-3 mb-3 p-2" style="border-radius:var(--radius-md);background:${!n.isRead ? 'var(--color-primary-50)' : ''};transition:background var(--transition-fast)">
                    <div style="font-size:18px;">${n.type === 'reminder' ? '⏰' : n.type === 'warning' ? '⚠️' : 'ℹ️'}</div>
                    <div style="flex:1;min-width:0;">
                      <div style="font-size:var(--text-sm);font-weight:${!n.isRead ? 'var(--font-semibold)' : 'var(--font-normal)'};color:var(--color-text-primary);">${n.title}</div>
                      <div style="font-size:var(--text-xs);color:var(--color-text-muted);">${DateUtils.relative(n.createdAt)}</div>
                    </div>
                    ${!n.isRead ? '<div style="width:8px;height:8px;border-radius:50%;background:var(--color-primary);flex-shrink:0;margin-top:4px;"></div>' : ''}
                  </div>
                `).join('')}
                ${notifications.length === 0 ? `
                  <div style="text-align:center;padding:var(--space-6);color:var(--color-text-muted);font-size:var(--text-sm);">
                    No notifications
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Quick Add -->
            <div class="card animate-fade-in delay-5">
              <div class="card-header">
                <div class="section-title">⚡ Quick Add</div>
              </div>
              <div class="card-body">
                <div class="input-field" id="quick-task-input" contenteditable="true" 
                     style="border:1.5px solid var(--color-border);padding:var(--space-3);border-radius:var(--radius-md);min-height:60px;font-size:var(--text-sm);color:var(--color-text-primary);outline:none;transition:border-color var(--transition-fast);"
                     data-placeholder="Type a task and press Enter..."></div>
                <div class="flex gap-2 mt-3">
                  <button class="btn btn-primary btn-sm flex-1" id="quick-add-submit">Add to Inbox</button>
                  <button class="btn btn-ghost btn-sm" id="quick-add-clear">Clear</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this._renderMiniCalendar();
    this._bindEvents(container);
    this._startClock();
  }

  _renderTaskItem(task, overdue = false) {
    const resp = this.storage.findInCollection('responsibilities', r => r.id === task.responsibilityId);
    const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
    const isOverdue = overdue || DateUtils.isOverdue(task.dueDate);

    return `
      <div class="task-item" data-task-id="${task.id}">
        <div class="task-checkbox ${task.status === 'done' ? 'checked' : ''}" data-task-check="${task.id}">
          ${task.status === 'done' ? '✓' : ''}
        </div>
        <div class="task-content">
          <div class="task-title ${task.status === 'done' ? 'completed' : ''}">${task.title}</div>
          <div class="task-meta">
            ${resp ? `<span class="badge" style="background:${resp.colorBg};color:${resp.color}">${resp.icon} ${resp.name}</span>` : ''}
            <span class="badge badge-${task.priority}">${priority.icon} ${priority.label}</span>
            ${task.dueDate ? `<span class="task-date ${isOverdue ? 'overdue' : ''}">${isOverdue ? '⚠️ ' : ''}${DateUtils.relative(task.dueDate)}</span>` : ''}
            ${task.checklist?.length ? `<span class="task-date">☑ ${task.checklist.filter(c=>c.done).length}/${task.checklist.length}</span>` : ''}
          </div>
        </div>
        <div class="task-actions">
          <button class="icon-btn btn-sm" data-task-edit="${task.id}" title="Edit">✏️</button>
        </div>
      </div>
    `;
  }

  _renderMiniCalendar() {
    const container = document.getElementById('dashboard-mini-calendar');
    if (!container) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();

    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const days = ['Su','Mo','Tu','We','Th','Fr','Sa'];

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let calHtml = `<div class="card animate-fade-in delay-2">
      <div class="card-body">
        <div class="mini-cal-header">
          <div class="mini-cal-title">${months[month]} ${year}</div>
          <button class="btn btn-ghost btn-sm" onclick="app.router.navigate('calendar')">Open</button>
        </div>
        <div class="mini-cal-grid">
          ${days.map(d => `<div class="mini-cal-day-header">${d}</div>`).join('')}
    `;

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      calHtml += `<div class="mini-cal-day other-month"></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = d === today;
      calHtml += `<div class="mini-cal-day ${isToday ? 'today' : ''}" title="${months[month]} ${d}">${d}</div>`;
    }

    calHtml += `</div></div></div>`;
    container.innerHTML = calHtml;
  }

  _bindEvents(container) {
    // Task check/uncheck
    container.addEventListener('click', (e) => {
      const taskId = e.target.closest('[data-task-check]')?.dataset.taskCheck;
      if (taskId) {
        this._toggleTaskStatus(taskId);
        return;
      }

      const editId = e.target.closest('[data-task-edit]')?.dataset.taskEdit;
      if (editId) {
        this.app.openTaskModal(editId);
        return;
      }

      const habitId = e.target.closest('[data-habit-toggle]')?.dataset.habitToggle;
      if (habitId) {
        this._toggleHabit(habitId, e.target.closest('[data-habit-toggle]'));
        return;
      }

      // Navigation buttons
      if (e.target.id === 'dash-view-all-tasks') this.app.router.navigate('responsibilities');
      if (e.target.id === 'dash-view-responsibilities') this.app.router.navigate('responsibilities');
      if (e.target.id === 'dash-view-habits') this.app.router.navigate('habits');
      if (e.target.id === 'dash-view-notifications') this.app.router.navigate('notifications');
      if (e.target.id === 'dash-add-task-btn') this.app.openTaskModal();
      if (e.target.id === 'dash-add-habit-btn') this.app.router.navigate('habits');
    });

    // Quick add
    const quickInput = document.getElementById('quick-task-input');
    const submitBtn = document.getElementById('quick-add-submit');
    const clearBtn = document.getElementById('quick-add-clear');

    if (quickInput) {
      quickInput.addEventListener('focus', () => {
        quickInput.style.borderColor = 'var(--color-primary)';
        quickInput.style.boxShadow = '0 0 0 3px rgba(13,148,136,0.12)';
      });
      quickInput.addEventListener('blur', () => {
        quickInput.style.borderColor = 'var(--color-border)';
        quickInput.style.boxShadow = '';
      });
      quickInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this._quickAddTask(quickInput.textContent.trim());
          quickInput.textContent = '';
        }
      });
    }

    submitBtn?.addEventListener('click', () => {
      this._quickAddTask(quickInput?.textContent.trim());
      if (quickInput) quickInput.textContent = '';
    });

    clearBtn?.addEventListener('click', () => {
      if (quickInput) quickInput.textContent = '';
    });
  }

  _toggleTaskStatus(taskId) {
    const tasks = this.storage.getCollection('tasks');
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === 'done' ? 'todo' : 'done';
    this.storage.updateInCollection('tasks', taskId, { status: newStatus });
    this.app.bus.emit('tasks:changed');
    this.app.toast.success(newStatus === 'done' ? 'Task completed! ✅' : 'Task reopened');

    // Refresh
    this.render(document.getElementById('app-main'));
  }

  _toggleHabit(habitId, checkEl) {
    const habits = this.storage.getCollection('habits');
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const today = DateUtils.dateKey();
    const completions = habit.completions || {};
    const wasDone = completions[today];

    if (wasDone) {
      delete completions[today];
      habit.streak = Math.max(0, (habit.streak || 1) - 1);
    } else {
      completions[today] = true;
      habit.streak = (habit.streak || 0) + 1;
    }

    this.storage.updateInCollection('habits', habitId, { completions, streak: habit.streak });

    if (checkEl) {
      checkEl.classList.toggle('checked', !wasDone);
      checkEl.textContent = !wasDone ? '✓' : '';
    }

    this.app.toast.success(!wasDone ? `${habit.icon} ${habit.name} completed!` : 'Habit unchecked');
    this.app.bus.emit('habits:changed');
  }

  _quickAddTask(text) {
    if (!text) return;
    const item = this.storage.addToCollection('inbox', {
      title: text,
      responsibilityId: null,
      type: 'task',
      isProcessed: false
    });
    this.app.toast.success('Added to Inbox', 'You can organize it later');
    this.app.bus.emit('inbox:changed');
  }

  _startClock() {
    this._stopClock();
    this._clockInterval = setInterval(() => {
      const el = document.getElementById('dashboard-clock');
      if (el) el.textContent = DateUtils.formatTime(new Date());
      else this._stopClock();
    }, 1000);
  }

  _stopClock() {
    if (this._clockInterval) {
      clearInterval(this._clockInterval);
      this._clockInterval = null;
    }
  }

  destroy() {
    this._stopClock();
  }
}
