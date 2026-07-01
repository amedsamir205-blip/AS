/**
 * Ahmed Life OS - Modal Components
 */

import { DateUtils, ColorUtils, RESPONSIBILITY_ICONS, PRIORITY_CONFIG, STATUS_CONFIG, MOOD_OPTIONS } from '../utils/utils.js';

// ============================================
// TASK MODAL
// ============================================
export function openTaskModal(app, taskId = null, responsibilityId = null, defaultStatus = null) {
  const task = taskId ? app.storage.findInCollection('tasks', t => t.id === taskId) : null;
  const responsibilities = app.storage.getCollection('responsibilities').filter(r => !r.isArchived);

  const modal = app.modal.open({
    title: task ? '✏️ Edit Task' : '＋ New Task',
    size: 'lg',
    content: `
      <div style="display:flex;flex-direction:column;gap:var(--space-4);">
        <div class="input-group">
          <label class="input-label required">Task Title</label>
          <input type="text" class="input-field" id="task-title" value="${task?.title || ''}" placeholder="What needs to be done?">
        </div>

        <div class="input-group">
          <label class="input-label">Description</label>
          <textarea class="input-field" id="task-description" rows="3" placeholder="Add more details...">${task?.description || ''}</textarea>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);">
          <div class="input-group">
            <label class="input-label">Responsibility</label>
            <select class="select-field" id="task-responsibility">
              <option value="">No responsibility</option>
              ${responsibilities.map(r => `
                <option value="${r.id}" ${(task?.responsibilityId || responsibilityId) === r.id ? 'selected' : ''}>${r.icon} ${r.name}</option>
              `).join('')}
            </select>
          </div>

          <div class="input-group">
            <label class="input-label">Status</label>
            <select class="select-field" id="task-status">
              ${Object.entries(STATUS_CONFIG).map(([key, cfg]) => `
                <option value="${key}" ${(task?.status || defaultStatus || 'todo') === key ? 'selected' : ''}>${cfg.icon} ${cfg.label}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);">
          <div class="input-group">
            <label class="input-label">Priority</label>
            <select class="select-field" id="task-priority">
              ${Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => `
                <option value="${key}" ${(task?.priority || 'medium') === key ? 'selected' : ''}>${cfg.icon} ${cfg.label}</option>
              `).join('')}
            </select>
          </div>

          <div class="input-group">
            <label class="input-label">Due Date</label>
            <input type="date" class="input-field" id="task-due-date" value="${task?.dueDate ? DateUtils.today().substring(0, task.dueDate.length) : ''}">
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);">
          <div class="input-group">
            <label class="input-label">Estimated Time (min)</label>
            <input type="number" class="input-field" id="task-estimated" value="${task?.estimatedTime || ''}" placeholder="e.g. 60">
          </div>

          <div class="input-group">
            <label class="input-label">Tags (comma separated)</label>
            <input type="text" class="input-field" id="task-tags" value="${task?.tags?.join(', ') || ''}" placeholder="work, urgent, q4">
          </div>
        </div>

        <!-- Checklist -->
        <div class="input-group">
          <label class="input-label">Checklist</label>
          <div id="checklist-items">
            ${(task?.checklist || []).map(item => `
              <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-2);" class="checklist-row" data-check-id="${item.id}">
                <input type="checkbox" ${item.done ? 'checked' : ''} data-check-done>
                <input type="text" class="input-field" value="${item.text}" data-check-text style="flex:1;">
                <button class="icon-btn btn-sm" data-remove-check style="color:var(--color-error)">✕</button>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-ghost btn-sm mt-2" id="add-checklist-item" style="width:100%;justify-content:flex-start;">＋ Add checklist item</button>
        </div>

        <div class="flex items-center gap-3">
          <label class="toggle">
            <input type="checkbox" id="task-recurring" ${task?.isRecurring ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
          <span style="font-size:var(--text-sm);font-weight:var(--font-medium);">Recurring task</span>
        </div>
      </div>
    `,
    footer: `
      ${task ? `<button class="btn btn-danger" id="task-delete-btn">Delete</button>` : ''}
      <button class="btn btn-secondary" id="task-cancel-btn">Cancel</button>
      <button class="btn btn-primary" id="task-save-btn">${task ? 'Save Changes' : 'Create Task'}</button>
    `
  });

  // Bind checklist
  document.getElementById('add-checklist-item')?.addEventListener('click', () => {
    const container = document.getElementById('checklist-items');
    const id = app.storage.generateId();
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-2);';
    row.className = 'checklist-row';
    row.dataset.checkId = id;
    row.innerHTML = `
      <input type="checkbox" data-check-done>
      <input type="text" class="input-field" data-check-text style="flex:1;" placeholder="Checklist item...">
      <button class="icon-btn btn-sm" data-remove-check style="color:var(--color-error)">✕</button>
    `;
    container.appendChild(row);
    row.querySelector('[data-check-text]').focus();
  });

  document.getElementById('checklist-items')?.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('[data-remove-check]');
    if (removeBtn) removeBtn.closest('.checklist-row').remove();
  });

  // Save
  document.getElementById('task-save-btn')?.addEventListener('click', () => {
    const title = document.getElementById('task-title').value.trim();
    if (!title) {
      app.toast.error('Title required', 'Please enter a task title');
      return;
    }

    const checklistRows = document.querySelectorAll('.checklist-row');
    const checklist = [...checklistRows].map(row => ({
      id: row.dataset.checkId || app.storage.generateId(),
      text: row.querySelector('[data-check-text]').value.trim(),
      done: row.querySelector('[data-check-done]').checked
    })).filter(item => item.text);

    const tagsRaw = document.getElementById('task-tags').value;
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

    const dueDate = document.getElementById('task-due-date').value;

    const data = {
      title,
      description: document.getElementById('task-description').value,
      responsibilityId: document.getElementById('task-responsibility').value || null,
      status: document.getElementById('task-status').value,
      priority: document.getElementById('task-priority').value,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      estimatedTime: parseInt(document.getElementById('task-estimated').value) || 0,
      tags,
      checklist,
      isRecurring: document.getElementById('task-recurring').checked,
      files: task?.files || [],
      comments: task?.comments || [],
      spentTime: task?.spentTime || 0
    };

    if (task) {
      app.storage.updateInCollection('tasks', task.id, data);
      app.toast.success('Task updated!');
    } else {
      app.storage.addToCollection('tasks', data);
      app.toast.success('Task created!');
    }

    modal.close();
    app.bus.emit('tasks:changed');
    app.refreshCurrentPage();
  });

  // Cancel
  document.getElementById('task-cancel-btn')?.addEventListener('click', () => modal.close());

  // Delete
  document.getElementById('task-delete-btn')?.addEventListener('click', () => {
    app.storage.deleteFromCollection('tasks', task.id);
    modal.close();
    app.toast.success('Task deleted');
    app.bus.emit('tasks:changed');
    app.refreshCurrentPage();
  });

  // Focus title
  setTimeout(() => document.getElementById('task-title')?.focus(), 100);
}

// ============================================
// RESPONSIBILITY MODAL
// ============================================
export function openResponsibilityModal(app, existing = null) {
  const modal = app.modal.open({
    title: existing ? '✏️ Edit Responsibility' : '🗂️ New Responsibility',
    content: `
      <div style="display:flex;flex-direction:column;gap:var(--space-4);">
        <div class="input-group">
          <label class="input-label required">Name</label>
          <input type="text" class="input-field" id="resp-name" value="${existing?.name || ''}" placeholder="e.g. Work & Career">
        </div>

        <div class="input-group">
          <label class="input-label">Description</label>
          <input type="text" class="input-field" id="resp-desc" value="${existing?.description || ''}" placeholder="Brief description...">
        </div>

        <div class="input-group">
          <label class="input-label">Icon</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px;max-height:180px;overflow-y:auto;padding:var(--space-3);background:var(--color-bg);border-radius:var(--radius-md);border:1.5px solid var(--color-border);" id="icon-grid">
            ${RESPONSIBILITY_ICONS.map(icon => `
              <div data-icon="${icon}" class="icon-option" 
                   style="width:36px;height:36px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;border:2px solid ${(existing?.icon || '💼') === icon ? 'var(--color-primary)' : 'transparent'};background:${(existing?.icon || '💼') === icon ? 'var(--color-primary-50)' : 'var(--color-surface)'};transition:all var(--transition-fast);">
                ${icon}
              </div>
            `).join('')}
          </div>
          <input type="hidden" id="resp-icon" value="${existing?.icon || '💼'}">
        </div>

        <div class="input-group">
          <label class="input-label">Color</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px;" id="color-grid">
            ${ColorUtils.RESPONSIBILITY_COLORS.map(c => `
              <div data-color="${c.color}" data-color-bg="${c.bg}"
                   style="width:32px;height:32px;border-radius:50%;background:${c.color};cursor:pointer;border:3px solid ${(existing?.color || '#0d9488') === c.color ? 'var(--color-text-primary)' : 'transparent'};transition:all var(--transition-fast);"
                   class="color-option" title="${c.name}"></div>
            `).join('')}
          </div>
          <input type="hidden" id="resp-color" value="${existing?.color || '#0d9488'}">
          <input type="hidden" id="resp-color-bg" value="${existing?.colorBg || '#f0fdfa'}">
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" id="resp-cancel">Cancel</button>
      <button class="btn btn-primary" id="resp-save">${existing ? 'Save Changes' : 'Create'}</button>
    `
  });

  // Icon grid
  document.getElementById('icon-grid')?.addEventListener('click', (e) => {
    const opt = e.target.closest('[data-icon]');
    if (!opt) return;
    document.querySelectorAll('.icon-option').forEach(i => {
      i.style.border = '2px solid transparent';
      i.style.background = 'var(--color-surface)';
    });
    opt.style.border = '2px solid var(--color-primary)';
    opt.style.background = 'var(--color-primary-50)';
    document.getElementById('resp-icon').value = opt.dataset.icon;
  });

  // Color grid
  document.getElementById('color-grid')?.addEventListener('click', (e) => {
    const opt = e.target.closest('[data-color]');
    if (!opt) return;
    document.querySelectorAll('.color-option').forEach(c => c.style.border = '3px solid transparent');
    opt.style.border = '3px solid var(--color-text-primary)';
    document.getElementById('resp-color').value = opt.dataset.color;
    document.getElementById('resp-color-bg').value = opt.dataset.colorBg;
  });

  document.getElementById('resp-cancel')?.addEventListener('click', () => modal.close());

  document.getElementById('resp-save')?.addEventListener('click', () => {
    const name = document.getElementById('resp-name').value.trim();
    if (!name) { app.toast.error('Name required'); return; }

    const data = {
      name,
      description: document.getElementById('resp-desc').value,
      icon: document.getElementById('resp-icon').value,
      color: document.getElementById('resp-color').value,
      colorBg: document.getElementById('resp-color-bg').value,
      isArchived: existing?.isArchived || false,
      sections: existing?.sections || []
    };

    if (existing) {
      app.storage.updateInCollection('responsibilities', existing.id, data);
      app.toast.success('Responsibility updated!');
    } else {
      app.storage.addToCollection('responsibilities', data);
      app.toast.success('Responsibility created!');
    }

    modal.close();
    app.bus.emit('responsibilities:changed');
    app.refreshCurrentPage();
  });

  setTimeout(() => document.getElementById('resp-name')?.focus(), 100);
}

// ============================================
// HABIT MODAL
// ============================================
export function openHabitModal(app, habitId = null) {
  const habit = habitId ? app.storage.findInCollection('habits', h => h.id === habitId) : null;

  const modal = app.modal.open({
    title: habit ? '✏️ Edit Habit' : '🔥 New Habit',
    size: 'sm',
    content: `
      <div style="display:flex;flex-direction:column;gap:var(--space-4);">
        <div class="input-group">
          <label class="input-label required">Habit Name</label>
          <input type="text" class="input-field" id="habit-name" value="${habit?.name || ''}" placeholder="e.g. Morning run">
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);">
          <div class="input-group">
            <label class="input-label">Icon</label>
            <input type="text" class="input-field" id="habit-icon" value="${habit?.icon || '🎯'}" placeholder="Emoji...">
          </div>
          <div class="input-group">
            <label class="input-label">Color</label>
            <input type="color" class="input-field" id="habit-color" value="${habit?.color || '#0d9488'}" style="height:42px;cursor:pointer;">
          </div>
        </div>

        <div class="input-group">
          <label class="input-label">Frequency</label>
          <select class="select-field" id="habit-frequency">
            <option value="daily" ${(habit?.frequency || 'daily') === 'daily' ? 'selected' : ''}>Daily</option>
            <option value="weekly" ${habit?.frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
          </select>
        </div>
      </div>
    `,
    footer: `
      ${habit ? `<button class="btn btn-danger" id="habit-delete">Delete</button>` : ''}
      <button class="btn btn-secondary" id="habit-cancel">Cancel</button>
      <button class="btn btn-primary" id="habit-save">${habit ? 'Save' : 'Create Habit'}</button>
    `
  });

  document.getElementById('habit-cancel')?.addEventListener('click', () => modal.close());

  document.getElementById('habit-save')?.addEventListener('click', () => {
    const name = document.getElementById('habit-name').value.trim();
    if (!name) { app.toast.error('Name required'); return; }

    const data = {
      name,
      icon: document.getElementById('habit-icon').value || '🎯',
      color: document.getElementById('habit-color').value,
      frequency: document.getElementById('habit-frequency').value,
      targetDays: [0,1,2,3,4,5,6],
      completions: habit?.completions || {},
      streak: habit?.streak || 0
    };

    if (habit) {
      app.storage.updateInCollection('habits', habit.id, data);
      app.toast.success('Habit updated!');
    } else {
      app.storage.addToCollection('habits', data);
      app.toast.success('Habit created!');
    }
    modal.close();
    app.bus.emit('habits:changed');
    app.refreshCurrentPage();
  });

  document.getElementById('habit-delete')?.addEventListener('click', () => {
    app.storage.deleteFromCollection('habits', habit.id);
    modal.close();
    app.toast.success('Habit deleted');
    app.bus.emit('habits:changed');
    app.refreshCurrentPage();
  });
}

// ============================================
// JOURNAL MODAL
// ============================================
export function openJournalModal(app, entryId = null) {
  const entry = entryId ? app.storage.findInCollection('journal', e => e.id === entryId) : null;

  const modal = app.modal.open({
    title: entry ? '✏️ Edit Entry' : '📓 New Journal Entry',
    size: 'lg',
    content: `
      <div style="display:flex;flex-direction:column;gap:var(--space-4);">
        <div style="display:flex;gap:var(--space-3);align-items:center;">
          <div class="input-group" style="flex:1;">
            <label class="input-label">Date</label>
            <input type="date" class="input-field" id="journal-date" value="${entry?.date ? entry.date.split('T')[0] : DateUtils.today()}">
          </div>
          <div class="input-group" style="flex:1;">
            <label class="input-label">Mood</label>
            <div style="display:flex;gap:var(--space-2);" id="mood-picker">
              ${MOOD_OPTIONS.map(m => `
                <div data-mood="${m.emoji}" title="${m.label}"
                     style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer;border:2px solid ${(entry?.mood || '') === m.emoji ? 'var(--color-primary)' : 'transparent'};background:${(entry?.mood || '') === m.emoji ? 'var(--color-primary-50)' : 'var(--color-bg)'};transition:all var(--transition-fast);"
                     class="mood-opt">
                  ${m.emoji}
                </div>
              `).join('')}
            </div>
            <input type="hidden" id="journal-mood" value="${entry?.mood || ''}">
          </div>
        </div>

        <div class="input-group">
          <label class="input-label">Your thoughts</label>
          <textarea class="input-field" id="journal-content" rows="8" placeholder="How was your day? What are you thinking about?">${entry?.content || ''}</textarea>
        </div>

        <div class="input-group">
          <label class="input-label">Tags (comma separated)</label>
          <input type="text" class="input-field" id="journal-tags" value="${entry?.tags?.join(', ') || ''}" placeholder="grateful, productive, exercise">
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" id="journal-cancel">Cancel</button>
      <button class="btn btn-primary" id="journal-save">${entry ? 'Save Entry' : 'Add Entry'}</button>
    `
  });

  document.getElementById('mood-picker')?.addEventListener('click', (e) => {
    const opt = e.target.closest('[data-mood]');
    if (!opt) return;
    document.querySelectorAll('.mood-opt').forEach(m => {
      m.style.border = '2px solid transparent';
      m.style.background = 'var(--color-bg)';
    });
    opt.style.border = '2px solid var(--color-primary)';
    opt.style.background = 'var(--color-primary-50)';
    document.getElementById('journal-mood').value = opt.dataset.mood;
  });

  document.getElementById('journal-cancel')?.addEventListener('click', () => modal.close());

  document.getElementById('journal-save')?.addEventListener('click', () => {
    const content = document.getElementById('journal-content').value.trim();
    if (!content) { app.toast.error('Please write something'); return; }

    const tags = document.getElementById('journal-tags').value
      .split(',').map(t => t.trim()).filter(Boolean);

    const data = {
      content,
      mood: document.getElementById('journal-mood').value,
      moodScore: MOOD_OPTIONS.find(m => m.emoji === document.getElementById('journal-mood').value)?.score || 3,
      date: new Date(document.getElementById('journal-date').value).toISOString(),
      tags,
      images: entry?.images || []
    };

    if (entry) {
      app.storage.updateInCollection('journal', entry.id, data);
      app.toast.success('Entry updated!');
    } else {
      app.storage.addToCollection('journal', data);
      app.toast.success('Entry saved!');
    }
    modal.close();
    app.refreshCurrentPage();
  });

  setTimeout(() => document.getElementById('journal-content')?.focus(), 100);
}

// ============================================
// TRANSACTION MODAL
// ============================================
export function openTransactionModal(app) {
  const modal = app.modal.open({
    title: '＋ Add Transaction',
    size: 'sm',
    content: `
      <div style="display:flex;flex-direction:column;gap:var(--space-4);">
        <div class="input-group">
          <label class="input-label required">Type</label>
          <div style="display:flex;gap:var(--space-2);">
            <label style="flex:1;cursor:pointer;">
              <input type="radio" name="tx-type" value="income" checked style="accent-color:var(--color-success);"> 
              <span style="font-size:var(--text-sm);font-weight:var(--font-medium);">💵 Income</span>
            </label>
            <label style="flex:1;cursor:pointer;">
              <input type="radio" name="tx-type" value="expense" style="accent-color:var(--color-error);">
              <span style="font-size:var(--text-sm);font-weight:var(--font-medium);">💸 Expense</span>
            </label>
          </div>
        </div>
        <div class="input-group">
          <label class="input-label required">Amount</label>
          <input type="number" class="input-field" id="tx-amount" placeholder="0.00" min="0" step="0.01">
        </div>
        <div class="input-group">
          <label class="input-label required">Description</label>
          <input type="text" class="input-field" id="tx-description" placeholder="What was this for?">
        </div>
        <div class="input-group">
          <label class="input-label">Category</label>
          <input type="text" class="input-field" id="tx-category" placeholder="e.g. Salary, Rent, Food">
        </div>
        <div class="input-group">
          <label class="input-label">Date</label>
          <input type="date" class="input-field" id="tx-date" value="${DateUtils.today()}">
        </div>
        <label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;">
          <input type="checkbox" id="tx-recurring" style="accent-color:var(--color-primary);">
          <span style="font-size:var(--text-sm);">Recurring transaction</span>
        </label>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" id="tx-cancel">Cancel</button>
      <button class="btn btn-primary" id="tx-save">Add Transaction</button>
    `
  });

  document.getElementById('tx-cancel')?.addEventListener('click', () => modal.close());
  document.getElementById('tx-save')?.addEventListener('click', () => {
    const amount = parseFloat(document.getElementById('tx-amount').value);
    const description = document.getElementById('tx-description').value.trim();
    if (!amount || !description) { app.toast.error('Amount and description required'); return; }

    const finance = app.storage.get('finance') || { transactions: [], currency: 'USD' };
    finance.transactions.push({
      id: app.storage.generateId(),
      type: document.querySelector('input[name="tx-type"]:checked')?.value || 'expense',
      amount,
      description,
      category: document.getElementById('tx-category').value || 'Other',
      date: new Date(document.getElementById('tx-date').value).toISOString(),
      recurring: document.getElementById('tx-recurring').checked
    });
    app.storage.set('finance', finance);
    modal.close();
    app.toast.success('Transaction added!');
    app.refreshCurrentPage();
  });
}

// ============================================
// GOAL MODAL
// ============================================
export function openGoalModal(app, goalId = null, responsibilityId = null) {
  const goal = goalId ? app.storage.findInCollection('goals', g => g.id === goalId) : null;

  const modal = app.modal.open({
    title: goal ? '✏️ Edit Goal' : '🎯 New Goal',
    content: `
      <div style="display:flex;flex-direction:column;gap:var(--space-4);">
        <div class="input-group">
          <label class="input-label required">Goal Title</label>
          <input type="text" class="input-field" id="goal-title" value="${goal?.title || ''}" placeholder="What do you want to achieve?">
        </div>
        <div class="input-group">
          <label class="input-label">Description</label>
          <textarea class="input-field" id="goal-description" rows="3">${goal?.description || ''}</textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);">
          <div class="input-group">
            <label class="input-label">Deadline</label>
            <input type="date" class="input-field" id="goal-deadline" value="${goal?.deadline ? goal.deadline.split('T')[0] : ''}">
          </div>
          <div class="input-group">
            <label class="input-label">Progress (%)</label>
            <input type="number" class="input-field" id="goal-progress" value="${goal?.progress || 0}" min="0" max="100">
          </div>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" id="goal-cancel">Cancel</button>
      <button class="btn btn-primary" id="goal-save">${goal ? 'Save' : 'Create Goal'}</button>
    `
  });

  document.getElementById('goal-cancel')?.addEventListener('click', () => modal.close());
  document.getElementById('goal-save')?.addEventListener('click', () => {
    const title = document.getElementById('goal-title').value.trim();
    if (!title) { app.toast.error('Title required'); return; }
    const data = {
      title,
      description: document.getElementById('goal-description').value,
      deadline: document.getElementById('goal-deadline').value ? new Date(document.getElementById('goal-deadline').value).toISOString() : null,
      progress: parseInt(document.getElementById('goal-progress').value) || 0,
      responsibilityId: goal?.responsibilityId || responsibilityId,
      status: 'active',
      milestones: goal?.milestones || []
    };
    if (goal) { app.storage.updateInCollection('goals', goal.id, data); app.toast.success('Goal updated!'); }
    else { app.storage.addToCollection('goals', data); app.toast.success('Goal created!'); }
    modal.close();
    app.refreshCurrentPage();
  });
}

// ============================================
// NOTE MODAL
// ============================================
export function openNoteModal(app, noteId = null, responsibilityId = null) {
  const note = noteId ? app.storage.findInCollection('notes', n => n.id === noteId) : null;

  const modal = app.modal.open({
    title: note ? '✏️ Edit Note' : '📝 New Note',
    size: 'lg',
    content: `
      <div style="display:flex;flex-direction:column;gap:var(--space-4);">
        <div class="input-group">
          <label class="input-label">Title</label>
          <input type="text" class="input-field" id="note-title" value="${note?.title || ''}" placeholder="Note title...">
        </div>
        <div class="input-group">
          <label class="input-label">Content</label>
          <textarea class="input-field" id="note-content" rows="10" placeholder="Write your note...">${note?.content?.replace(/<[^>]*>/g,'') || ''}</textarea>
        </div>
        <div class="input-group">
          <label class="input-label">Tags</label>
          <input type="text" class="input-field" id="note-tags" value="${note?.tags?.join(', ') || ''}" placeholder="tag1, tag2">
        </div>
      </div>
    `,
    footer: `
      ${note ? `<button class="btn btn-danger" id="note-delete">Delete</button>` : ''}
      <button class="btn btn-secondary" id="note-cancel">Cancel</button>
      <button class="btn btn-primary" id="note-save">${note ? 'Save' : 'Create Note'}</button>
    `
  });

  document.getElementById('note-cancel')?.addEventListener('click', () => modal.close());
  document.getElementById('note-delete')?.addEventListener('click', () => {
    app.storage.deleteFromCollection('notes', note.id);
    modal.close();
    app.toast.success('Note deleted');
    app.refreshCurrentPage();
  });
  document.getElementById('note-save')?.addEventListener('click', () => {
    const content = document.getElementById('note-content').value.trim();
    const data = {
      title: document.getElementById('note-title').value.trim() || 'Untitled',
      content,
      tags: document.getElementById('note-tags').value.split(',').map(t=>t.trim()).filter(Boolean),
      responsibilityId: note?.responsibilityId || responsibilityId,
      isPinned: note?.isPinned || false
    };
    if (note) { app.storage.updateInCollection('notes', note.id, data); app.toast.success('Note updated!'); }
    else { app.storage.addToCollection('notes', data); app.toast.success('Note created!'); }
    modal.close();
    app.refreshCurrentPage();
  });
}

// ============================================
// QUICK ADD MODAL
// ============================================
export function openQuickAddModal(app) {
  const modal = app.modal.open({
    title: '⚡ Quick Add',
    size: 'sm',
    content: `
      <div style="display:flex;flex-direction:column;gap:var(--space-3);">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);">
          ${[
            { icon: '✅', label: 'Task', action: 'task' },
            { icon: '📝', label: 'Note', action: 'note' },
            { icon: '🎯', label: 'Goal', action: 'goal' },
            { icon: '🔥', label: 'Habit', action: 'habit' },
          ].map(item => `
            <button class="btn btn-secondary" data-quick="${item.action}"
                    style="height:72px;flex-direction:column;gap:var(--space-2);font-size:var(--text-sm);">
              <span style="font-size:24px;">${item.icon}</span>
              ${item.label}
            </button>
          `).join('')}
        </div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" id="quick-cancel">Cancel</button>`
  });

  document.getElementById('quick-cancel')?.addEventListener('click', () => modal.close());
  document.querySelectorAll('[data-quick]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.quick;
      modal.close();
      if (action === 'task') app.openTaskModal();
      if (action === 'note') app.openNoteModal();
      if (action === 'goal') app.openGoalModal();
      if (action === 'habit') app.openHabitModal();
    });
  });
}
