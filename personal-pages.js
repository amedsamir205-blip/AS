/**
 * Ahmed Life OS - Personal Pages
 * Habits, Journal, Finance, Focus Timer, Statistics
 */

import { DateUtils, NumberUtils, MOOD_OPTIONS } from '../../utils/utils.js';

// ============================================
// HABITS PAGE
// ============================================
export class HabitsPage {
  constructor(app) {
    this.app = app;
    this.storage = app.storage;
  }

  render(container) {
    const habits = this.storage.getCollection('habits');

    // Build last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        key: DateUtils.dateKey(d.toISOString()),
        label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : DateUtils.format(d.toISOString(), 'MMM D'),
        short: ['Su','Mo','Tu','We','Th','Fr','Sa'][d.getDay()]
      });
    }

    container.innerHTML = `
      <div class="page-content">
        <div class="page-header flex items-center justify-between">
          <div>
            <div class="page-title">🔥 Habits</div>
            <div class="page-subtitle">Build consistent daily routines</div>
          </div>
          <button class="btn btn-primary" id="add-habit-btn">＋ New Habit</button>
        </div>

        <!-- Stats Row -->
        <div class="dashboard-stats mb-6">
          <div class="stat-card">
            <div class="stat-card-label">Total Habits</div>
            <div class="stat-card-value">${habits.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-label">Completed Today</div>
            <div class="stat-card-value" style="color:var(--color-success)">
              ${habits.filter(h => h.completions?.[DateUtils.dateKey()]).length}
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card-label">Best Streak</div>
            <div class="stat-card-value" style="color:var(--color-warning)">
              🔥 ${habits.reduce((max,h) => Math.max(max, h.streak||0), 0)}
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card-label">Today's Rate</div>
            <div class="stat-card-value" style="color:var(--color-primary)">
              ${habits.length ? Math.round(habits.filter(h=>h.completions?.[DateUtils.dateKey()]).length/habits.length*100) : 0}%
            </div>
          </div>
        </div>

        ${habits.length === 0 ? `
          <div class="card">
            <div class="card-body">
              <div class="empty-state">
                <div class="empty-state-icon">🌱</div>
                <div class="empty-state-title">Start building habits</div>
                <div class="empty-state-desc">Add your first habit and track it daily to build a consistent routine.</div>
                <button class="btn btn-primary mt-4" id="add-habit-empty">＋ Add Your First Habit</button>
              </div>
            </div>
          </div>
        ` : `
          <div class="card">
            <div class="card-header">
              <div class="section-title">Daily Habits — Last 7 Days</div>
            </div>
            <div class="card-body">
              <!-- Day headers -->
              <div style="display:grid;grid-template-columns:200px repeat(7,1fr) 60px;gap:8px;align-items:center;margin-bottom:var(--space-3);">
                <div></div>
                ${days.map(d => `
                  <div style="text-align:center;">
                    <div style="font-size:10px;font-weight:var(--font-semibold);color:var(--color-text-muted);text-transform:uppercase;">${d.short}</div>
                    <div style="font-size:var(--text-xs);color:var(--color-text-muted);">${d.label === 'Today' ? '<span style="color:var(--color-primary);font-weight:var(--font-bold);">•</span>' : ''}</div>
                  </div>
                `).join('')}
                <div style="text-align:center;font-size:10px;font-weight:var(--font-semibold);color:var(--color-text-muted);">STREAK</div>
              </div>

              <!-- Habit rows -->
              <div class="habit-grid">
                ${habits.map(habit => `
                  <div style="display:grid;grid-template-columns:200px repeat(7,1fr) 60px;gap:8px;align-items:center;padding:var(--space-2) 0;border-bottom:1px solid var(--color-border-light);">
                    <div style="display:flex;align-items:center;gap:var(--space-2);">
                      <span style="font-size:18px;">${habit.icon}</span>
                      <span style="font-size:var(--text-sm);font-weight:var(--font-medium);color:var(--color-text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${habit.name}</span>
                    </div>
                    ${days.map(d => {
                      const done = habit.completions?.[d.key];
                      const isToday = d.label === 'Today';
                      return `
                        <div style="display:flex;justify-content:center;">
                          <div class="habit-dot ${done ? 'completed' : ''} ${isToday ? 'today' : ''}"
                               data-habit-id="${habit.id}" data-date="${d.key}"
                               style="${done ? `background:${habit.color};border-color:${habit.color};` : isToday ? `border-color:${habit.color};` : ''}">
                            ${done ? '✓' : ''}
                          </div>
                        </div>
                      `;
                    }).join('')}
                    <div style="text-align:center;display:flex;align-items:center;justify-content:center;gap:4px;font-size:var(--text-sm);font-weight:var(--font-semibold);color:var(--color-warning);">
                      ${habit.streak > 0 ? `🔥 ${habit.streak}` : '<span style="color:var(--color-text-muted)">—</span>'}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `}
      </div>
    `;

    this._bindEvents(container);
  }

  _bindEvents(container) {
    container.addEventListener('click', (e) => {
      const dot = e.target.closest('[data-habit-id][data-date]');
      if (dot) {
        this._toggleHabit(dot.dataset.habitId, dot.dataset.date, dot);
        return;
      }
      if (e.target.id === 'add-habit-btn' || e.target.id === 'add-habit-empty') {
        this.app.openHabitModal();
      }
    });
  }

  _toggleHabit(habitId, dateKey, dotEl) {
    const habit = this.storage.findInCollection('habits', h => h.id === habitId);
    if (!habit) return;
    const completions = habit.completions || {};
    const wasDone = completions[dateKey];
    if (wasDone) { delete completions[dateKey]; } else { completions[dateKey] = true; }

    // Recalculate streak
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (completions[DateUtils.dateKey(d.toISOString())]) streak++;
      else break;
    }

    this.storage.updateInCollection('habits', habitId, { completions, streak });
    dotEl.classList.toggle('completed', !wasDone);
    dotEl.textContent = !wasDone ? '✓' : '';
    if (!wasDone) dotEl.style.background = habit.color;
    else dotEl.style.background = '';
    this.app.bus.emit('habits:changed');
    if (!wasDone) this.app.toast.success(`${habit.icon} ${habit.name} done!`);
  }
}

// ============================================
// JOURNAL PAGE
// ============================================
export class JournalPage {
  constructor(app) {
    this.app = app;
    this.storage = app.storage;
  }

  render(container) {
    const entries = this.storage.getCollection('journal').sort((a,b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = `
      <div class="page-content">
        <div class="page-header flex items-center justify-between">
          <div>
            <div class="page-title">📓 Journal</div>
            <div class="page-subtitle">${entries.length} entries</div>
          </div>
          <button class="btn btn-primary" id="new-entry-btn">✏️ New Entry</button>
        </div>

        ${entries.length === 0 ? `
          <div class="card"><div class="card-body">
            <div class="empty-state">
              <div class="empty-state-icon">📓</div>
              <div class="empty-state-title">Start your journal</div>
              <div class="empty-state-desc">Write your thoughts, reflect on your day, and track your mood.</div>
              <button class="btn btn-primary mt-4" id="new-entry-empty">✏️ Write First Entry</button>
            </div>
          </div></div>
        ` : entries.map(entry => `
          <div class="journal-entry" data-entry-id="${entry.id}">
            <div class="journal-entry-header">
              <div>
                <div class="journal-date">${DateUtils.format(entry.date, 'dddd, MMMM D, YYYY')}</div>
                <div style="font-size:var(--text-xs);color:var(--color-text-muted);">${DateUtils.relative(entry.date)}</div>
              </div>
              <div style="display:flex;align-items:center;gap:var(--space-2);">
                <span class="journal-mood" title="${MOOD_OPTIONS.find(m=>m.emoji===entry.mood)?.label || ''}">${entry.mood || '😐'}</span>
                <button class="icon-btn btn-sm" data-edit-entry="${entry.id}">✏️</button>
                <button class="icon-btn btn-sm" data-delete-entry="${entry.id}" style="color:var(--color-error)">🗑️</button>
              </div>
            </div>
            <div class="journal-preview">${entry.content || ''}</div>
            ${entry.tags?.length ? `
              <div style="margin-top:var(--space-3);display:flex;gap:var(--space-2);flex-wrap:wrap;">
                ${entry.tags.map(t => `<span class="tag">#${t}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;

    this._bindEvents(container);
  }

  _bindEvents(container) {
    container.addEventListener('click', (e) => {
      if (e.target.id === 'new-entry-btn' || e.target.id === 'new-entry-empty') {
        this.app.openJournalModal();
        return;
      }
      const editBtn = e.target.closest('[data-edit-entry]');
      if (editBtn) { this.app.openJournalModal(editBtn.dataset.editEntry); return; }
      const delBtn = e.target.closest('[data-delete-entry]');
      if (delBtn) { this._deleteEntry(delBtn.dataset.deleteEntry); }
    });
  }

  _deleteEntry(id) {
    this.storage.deleteFromCollection('journal', id);
    this.app.toast.success('Entry deleted');
    this.render(document.getElementById('app-main'));
  }
}

// ============================================
// FINANCE PAGE
// ============================================
export class FinancePage {
  constructor(app) {
    this.app = app;
    this.storage = app.storage;
  }

  render(container) {
    const finance = this.storage.get('finance') || { transactions: [], currency: 'USD' };
    const transactions = finance.transactions || [];
    const now = new Date();
    const thisMonth = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const income = thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = income - expense;

    const categories = {};
    thisMonth.filter(t => t.type === 'expense').forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    container.innerHTML = `
      <div class="page-content">
        <div class="page-header flex items-center justify-between">
          <div>
            <div class="page-title">💰 Finance</div>
            <div class="page-subtitle">This month: ${DateUtils.format(now.toISOString(), 'MMMM YYYY')}</div>
          </div>
          <button class="btn btn-primary" id="add-transaction-btn">＋ Add Transaction</button>
        </div>

        <div class="finance-overview mb-6">
          <div class="finance-card income">
            <div class="finance-card-label">💵 Income</div>
            <div class="finance-card-amount">${NumberUtils.currency(income)}</div>
          </div>
          <div class="finance-card expense">
            <div class="finance-card-label">💸 Expenses</div>
            <div class="finance-card-amount">${NumberUtils.currency(expense)}</div>
          </div>
          <div class="finance-card balance">
            <div class="finance-card-label">💎 Balance</div>
            <div class="finance-card-amount">${NumberUtils.currency(balance)}</div>
          </div>
        </div>

        <div class="grid-cols-2 gap-6">
          <!-- Transactions -->
          <div class="card">
            <div class="card-header">
              <div class="section-title">Recent Transactions</div>
            </div>
            <div class="card-body" style="padding-top:0;">
              ${transactions.length === 0 ? `
                <div class="empty-state" style="padding:var(--space-8)">
                  <div class="empty-state-icon">💳</div>
                  <div class="empty-state-desc">No transactions yet.</div>
                </div>
              ` : transactions.slice(0,10).map(t => `
                <div style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3) 0;border-bottom:1px solid var(--color-border-light);">
                  <div style="width:36px;height:36px;border-radius:var(--radius-md);background:${t.type==='income' ? 'var(--color-success-bg)' : 'var(--color-error-bg)'};display:flex;align-items:center;justify-content:center;font-size:16px;">
                    ${t.type === 'income' ? '⬆️' : '⬇️'}
                  </div>
                  <div style="flex:1;">
                    <div style="font-size:var(--text-sm);font-weight:var(--font-medium);">${t.description}</div>
                    <div style="font-size:var(--text-xs);color:var(--color-text-muted);">${t.category} • ${DateUtils.format(t.date,'MMM D')}</div>
                  </div>
                  <div style="font-weight:var(--font-bold);color:${t.type==='income' ? 'var(--color-success)' : 'var(--color-error)'}">
                    ${t.type === 'income' ? '+' : '-'}${NumberUtils.currency(t.amount)}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Categories -->
          <div class="card">
            <div class="card-header"><div class="section-title">Expense Categories</div></div>
            <div class="card-body">
              ${Object.keys(categories).length === 0 ? `
                <div class="empty-state" style="padding:var(--space-8)"><div class="empty-state-desc">No expenses this month.</div></div>
              ` : Object.entries(categories).sort((a,b)=>b[1]-a[1]).map(([cat, amount]) => `
                <div style="margin-bottom:var(--space-3);">
                  <div class="flex justify-between mb-1">
                    <span style="font-size:var(--text-sm);">${cat}</span>
                    <span style="font-size:var(--text-sm);font-weight:var(--font-semibold);">${NumberUtils.currency(amount)}</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" style="width:${expense ? Math.round(amount/expense*100) : 0}%;background:var(--color-error)"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    this._bindEvents(container);
  }

  _bindEvents(container) {
    container.addEventListener('click', (e) => {
      if (e.target.id === 'add-transaction-btn') this.app.openTransactionModal();
    });
  }
}

// ============================================
// FOCUS TIMER PAGE
// ============================================
export class FocusPage {
  constructor(app) {
    this.app = app;
    this.storage = app.storage;
    this._timer = null;
    this._seconds = 25 * 60;
    this._totalSeconds = 25 * 60;
    this._running = false;
    this._mode = 'focus'; // focus | short | long
    this._sessions = 0;
  }

  render(container) {
    const MODES = {
      focus: { label: 'Focus', seconds: 25 * 60, color: 'var(--color-primary)' },
      short: { label: 'Short Break', seconds: 5 * 60, color: 'var(--color-success)' },
      long: { label: 'Long Break', seconds: 15 * 60, color: 'var(--color-info)' }
    };

    const mode = MODES[this._mode];
    const progress = 1 - (this._seconds / this._totalSeconds);
    const circumference = 2 * Math.PI * 70;
    const offset = circumference * (1 - progress);

    const mins = String(Math.floor(this._seconds / 60)).padStart(2, '0');
    const secs = String(this._seconds % 60).padStart(2, '0');

    container.innerHTML = `
      <div class="page-content">
        <div class="page-header">
          <div class="page-title">⏱️ Focus Timer</div>
          <div class="page-subtitle">Stay focused, get things done</div>
        </div>

        <div style="max-width:480px;margin:0 auto;">
          <!-- Mode tabs -->
          <div style="display:flex;gap:var(--space-2);margin-bottom:var(--space-6);background:var(--color-bg-secondary);padding:4px;border-radius:var(--radius-lg);">
            ${Object.entries(MODES).map(([key, m]) => `
              <button class="btn ${this._mode === key ? 'btn-primary' : 'btn-ghost'}" 
                      data-mode="${key}" style="flex:1;">${m.label}</button>
            `).join('')}
          </div>

          <!-- Timer Ring -->
          <div class="pomodoro-widget mb-6">
            <div class="pomodoro-ring">
              <svg viewBox="0 0 160 160" width="160" height="160">
                <circle class="pomodoro-ring-bg" cx="80" cy="80" r="70"/>
                <circle class="pomodoro-ring-progress" cx="80" cy="80" r="70"
                  stroke="${mode.color}"
                  stroke-dasharray="${circumference}"
                  stroke-dashoffset="${offset}"
                  id="timer-ring"/>
              </svg>
              <div class="pomodoro-time">
                <div class="pomodoro-time-value" id="timer-display">${mins}:${secs}</div>
                <div class="pomodoro-time-label">${mode.label}</div>
              </div>
            </div>

            <div class="pomodoro-controls">
              <button class="btn btn-secondary btn-icon btn-lg" id="timer-reset" title="Reset">↺</button>
              <button class="btn btn-primary btn-lg" id="timer-toggle" style="width:120px;font-size:var(--text-lg);">
                ${this._running ? '⏸ Pause' : '▶ Start'}
              </button>
              <button class="btn btn-secondary btn-icon btn-lg" id="timer-skip" title="Skip">⏭</button>
            </div>

            <div style="margin-top:var(--space-4);text-align:center;">
              <span style="font-size:var(--text-sm);color:var(--color-text-muted);">
                🍅 Sessions completed today: <strong>${this._sessions}</strong>
              </span>
            </div>
          </div>

          <!-- Settings -->
          <div class="card">
            <div class="card-header"><div class="section-title">Timer Settings</div></div>
            <div class="card-body">
              <div class="grid-cols-3 gap-4">
                <div class="input-group">
                  <label class="input-label">Focus (min)</label>
                  <input type="number" class="input-field" id="focus-duration" value="25" min="1" max="120">
                </div>
                <div class="input-group">
                  <label class="input-label">Short Break</label>
                  <input type="number" class="input-field" id="short-duration" value="5" min="1" max="30">
                </div>
                <div class="input-group">
                  <label class="input-label">Long Break</label>
                  <input type="number" class="input-field" id="long-duration" value="15" min="1" max="60">
                </div>
              </div>
              <button class="btn btn-secondary btn-sm mt-3" id="apply-settings">Apply Settings</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this._bindEvents(container);
    if (this._running) this._startTimer(container);
  }

  _bindEvents(container) {
    container.addEventListener('click', (e) => {
      // Mode switch
      const modeBtn = e.target.closest('[data-mode]');
      if (modeBtn) {
        this._stopTimer();
        this._mode = modeBtn.dataset.mode;
        const durations = { focus: 25, short: 5, long: 15 };
        this._seconds = this._totalSeconds = durations[this._mode] * 60;
        this._running = false;
        this.render(document.getElementById('app-main'));
        return;
      }

      if (e.target.id === 'timer-toggle') {
        if (this._running) { this._stopTimer(); this._running = false; }
        else { this._running = true; this._startTimer(container); }
        e.target.textContent = this._running ? '⏸ Pause' : '▶ Start';
      }

      if (e.target.id === 'timer-reset') {
        this._stopTimer();
        this._running = false;
        const durations = { focus: 25, short: 5, long: 15 };
        this._seconds = this._totalSeconds = durations[this._mode] * 60;
        this.render(document.getElementById('app-main'));
      }

      if (e.target.id === 'timer-skip') {
        this._stopTimer();
        this._running = false;
        if (this._mode === 'focus') { this._sessions++; this._mode = 'short'; }
        else this._mode = 'focus';
        const durations = { focus: 25, short: 5, long: 15 };
        this._seconds = this._totalSeconds = durations[this._mode] * 60;
        this.render(document.getElementById('app-main'));
      }

      if (e.target.id === 'apply-settings') {
        const focus = parseInt(document.getElementById('focus-duration').value) || 25;
        const shortB = parseInt(document.getElementById('short-duration').value) || 5;
        const longB = parseInt(document.getElementById('long-duration').value) || 15;
        const durations = { focus, short: shortB, long: longB };
        this._seconds = this._totalSeconds = durations[this._mode] * 60;
        this._stopTimer();
        this._running = false;
        this.render(document.getElementById('app-main'));
        this.app.toast.success('Timer settings updated');
      }
    });
  }

  _startTimer(container) {
    this._stopTimer();
    this._timer = setInterval(() => {
      if (this._seconds <= 0) {
        this._stopTimer();
        this._running = false;
        if (this._mode === 'focus') this._sessions++;
        this.app.toast.success(`${this._mode === 'focus' ? '🍅 Focus session complete!' : '☕ Break over!'}`);
        this._mode = this._mode === 'focus' ? 'short' : 'focus';
        const durations = { focus: 25, short: 5, long: 15 };
        this._seconds = this._totalSeconds = durations[this._mode] * 60;
        this.render(document.getElementById('app-main'));
        return;
      }
      this._seconds--;
      this._updateDisplay();
    }, 1000);
  }

  _updateDisplay() {
    const display = document.getElementById('timer-display');
    const ring = document.getElementById('timer-ring');
    if (!display) { this._stopTimer(); return; }

    const mins = String(Math.floor(this._seconds / 60)).padStart(2, '0');
    const secs = String(this._seconds % 60).padStart(2, '0');
    display.textContent = `${mins}:${secs}`;

    if (ring) {
      const circumference = 2 * Math.PI * 70;
      const progress = 1 - (this._seconds / this._totalSeconds);
      ring.style.strokeDashoffset = circumference * (1 - progress);
    }

    // Update page title
    document.title = `${mins}:${secs} — Ahmed Life OS`;
  }

  _stopTimer() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    document.title = 'Ahmed Life OS';
  }

  destroy() { this._stopTimer(); }
}

// ============================================
// STATISTICS PAGE
// ============================================
export class StatisticsPage {
  constructor(app) {
    this.app = app;
    this.storage = app.storage;
  }

  render(container) {
    const tasks = this.storage.getCollection('tasks');
    const habits = this.storage.getCollection('habits');
    const responsibilities = this.storage.getCollection('responsibilities').filter(r => !r.isArchived);
    const journal = this.storage.getCollection('journal');
    const finance = this.storage.get('finance') || { transactions: [] };

    const done = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const overdue = tasks.filter(t => t.status !== 'done' && DateUtils.isOverdue(t.dueDate)).length;
    const completionRate = tasks.length ? Math.round(done / tasks.length * 100) : 0;

    const todayHabits = habits.filter(h => h.completions?.[DateUtils.dateKey()]).length;
    const habitsRate = habits.length ? Math.round(todayHabits / habits.length * 100) : 0;

    const income = finance.transactions.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const expense = finance.transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);

    container.innerHTML = `
      <div class="page-content">
        <div class="page-header">
          <div class="page-title">📊 Statistics</div>
          <div class="page-subtitle">Your overall performance overview</div>
        </div>

        <!-- Top Stats -->
        <div class="dashboard-stats mb-6">
          <div class="stat-card">
            <div class="stat-card-label">Task Completion</div>
            <div class="stat-card-value" style="color:var(--color-primary)">${completionRate}%</div>
            <div class="progress-bar mt-2"><div class="progress-fill" style="width:${completionRate}%"></div></div>
            <div class="stat-card-change neutral mt-2">${done} of ${tasks.length} tasks</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-label">Habit Rate Today</div>
            <div class="stat-card-value" style="color:var(--color-warning)">${habitsRate}%</div>
            <div class="progress-bar mt-2"><div class="progress-fill" style="width:${habitsRate}%;background:var(--color-warning)"></div></div>
            <div class="stat-card-change neutral mt-2">${todayHabits} of ${habits.length} habits</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-label">Journal Entries</div>
            <div class="stat-card-value" style="color:var(--color-accent-purple)">${journal.length}</div>
            <div class="stat-card-change neutral mt-2">Total entries written</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-label">Net Balance</div>
            <div class="stat-card-value" style="color:${income-expense >= 0 ? 'var(--color-success)' : 'var(--color-error)'}">
              ${NumberUtils.currency(income - expense)}
            </div>
            <div class="stat-card-change neutral mt-2">Income - Expenses</div>
          </div>
        </div>

        <div class="grid-cols-2 gap-6 mb-6">
          <!-- Task breakdown -->
          <div class="card">
            <div class="card-header"><div class="section-title">Tasks Overview</div></div>
            <div class="card-body">
              ${[
                ['✅ Done', done, 'var(--color-success)'],
                ['🔵 In Progress', inProgress, 'var(--color-info)'],
                ['⭕ To Do', todo, 'var(--color-text-muted)'],
                ['⚠️ Overdue', overdue, 'var(--color-error)'],
              ].map(([label, count, color]) => `
                <div class="flex items-center gap-3 mb-3">
                  <span style="width:80px;font-size:var(--text-sm);color:var(--color-text-secondary);">${label}</span>
                  <div style="flex:1;"><div class="progress-bar"><div class="progress-fill" style="width:${tasks.length?Math.round(count/tasks.length*100):0}%;background:${color}"></div></div></div>
                  <span style="font-weight:var(--font-bold);font-size:var(--text-sm);width:30px;text-align:right;">${count}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Responsibility breakdown -->
          <div class="card">
            <div class="card-header"><div class="section-title">By Responsibility</div></div>
            <div class="card-body">
              ${responsibilities.map(r => {
                const rTasks = tasks.filter(t => t.responsibilityId === r.id);
                const rDone = rTasks.filter(t => t.status === 'done').length;
                const rPct = rTasks.length ? Math.round(rDone/rTasks.length*100) : 0;
                return `
                  <div class="flex items-center gap-3 mb-3">
                    <span style="font-size:16px;">${r.icon}</span>
                    <span style="flex:1;font-size:var(--text-sm);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.name}</span>
                    <div style="width:80px;"><div class="progress-bar"><div class="progress-fill" style="width:${rPct}%;background:${r.color}"></div></div></div>
                    <span style="font-size:var(--text-sm);font-weight:var(--font-bold);color:${r.color};width:35px;text-align:right;">${rPct}%</span>
                  </div>
                `;
              }).join('')}
              ${responsibilities.length === 0 ? '<div class="text-muted text-sm text-center" style="padding:var(--space-4);">No responsibilities yet</div>' : ''}
            </div>
          </div>
        </div>

        <!-- Habits streaks -->
        <div class="card">
          <div class="card-header"><div class="section-title">Habit Streaks</div></div>
          <div class="card-body">
            ${habits.length === 0 ? '<div class="empty-state" style="padding:var(--space-6)"><div class="empty-state-desc">No habits to show.</div></div>' :
              `<div class="grid-cols-3 gap-4">
                ${habits.map(h => `
                  <div style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);border:1px solid var(--color-border);border-radius:var(--radius-md);">
                    <span style="font-size:24px;">${h.icon}</span>
                    <div>
                      <div style="font-size:var(--text-sm);font-weight:var(--font-medium);">${h.name}</div>
                      <div style="font-size:var(--text-lg);font-weight:var(--font-bold);color:var(--color-warning);">🔥 ${h.streak || 0} days</div>
                    </div>
                  </div>
                `).join('')}
              </div>`
            }
          </div>
        </div>
      </div>
    `;
  }
}
