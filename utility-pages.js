/**
 * Ahmed Life OS - Utility Pages
 * Calendar, Inbox, Notifications, Search, Settings
 */

import { DateUtils, ColorUtils, RESPONSIBILITY_ICONS } from '../../utils/utils.js';

// ============================================
// CALENDAR PAGE
// ============================================
export class CalendarPage {
  constructor(app) {
    this.app = app;
    this.storage = app.storage;
    this._date = new Date();
  }

  render(container) {
    const year = this._date.getFullYear();
    const month = this._date.getMonth();
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const tasks = this.storage.getCollection('tasks').filter(t => t.dueDate);
    const responsibilities = this.storage.getCollection('responsibilities');
    const events = this.storage.getCollection('events');

    // Upcoming events
    const upcoming = tasks
      .filter(t => {
        const d = new Date(t.dueDate);
        return d >= today;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 8);

    let cells = '';
    for (let i = 0; i < firstDay; i++) {
      cells += `<div class="calendar-day other-month"><div class="day-number" style="opacity:0.3;">${new Date(year, month, -firstDay + i + 1).getDate()}</div></div>`;
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dayTasks = tasks.filter(t => t.dueDate && t.dueDate.startsWith(dateStr));
      const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      cells += `
        <div class="calendar-day ${isToday ? 'today' : ''}">
          <div class="day-number">${d}</div>
          <div class="day-events">
            ${dayTasks.slice(0, 3).map(t => {
              const resp = responsibilities.find(r => r.id === t.responsibilityId);
              return `<div class="day-event" style="background:${resp?.color || 'var(--color-primary)'};" title="${t.title}">${t.title}</div>`;
            }).join('')}
            ${dayTasks.length > 3 ? `<div style="font-size:10px;color:var(--color-text-muted);">+${dayTasks.length-3} more</div>` : ''}
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="page-content">
        <div class="flex items-center justify-between mb-6">
          <div>
            <div class="page-title">📅 Calendar</div>
            <div class="page-subtitle">All your events and tasks in one view</div>
          </div>
          <button class="btn btn-primary" id="add-event-btn">＋ Add Event</button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 300px;gap:var(--space-6);">
          <!-- Calendar Grid -->
          <div class="card">
            <div class="card-header">
              <div class="calendar-header" style="width:100%;">
                <button class="btn btn-secondary btn-sm" id="cal-prev">←</button>
                <div class="calendar-title">${months[month]} ${year}</div>
                <button class="btn btn-secondary btn-sm" id="cal-next">→</button>
              </div>
            </div>
            <div class="card-body">
              <div class="calendar-grid">
                ${days.map(d => `<div class="calendar-day-header">${d}</div>`).join('')}
                ${cells}
              </div>
            </div>
          </div>

          <!-- Upcoming -->
          <div class="card">
            <div class="card-header"><div class="section-title">Upcoming</div></div>
            <div class="card-body" style="padding-top:0;">
              ${upcoming.length === 0 ? `
                <div class="empty-state" style="padding:var(--space-8)">
                  <div class="empty-state-icon">🎉</div>
                  <div class="empty-state-desc">No upcoming tasks!</div>
                </div>
              ` : upcoming.map(t => {
                const resp = responsibilities.find(r => r.id === t.responsibilityId);
                return `
                  <div style="padding:var(--space-3) 0;border-bottom:1px solid var(--color-border-light);display:flex;align-items:flex-start;gap:var(--space-3);">
                    <div style="width:8px;height:8px;border-radius:50%;background:${resp?.color || 'var(--color-primary)'};margin-top:6px;flex-shrink:0;"></div>
                    <div style="flex:1;min-width:0;">
                      <div style="font-size:var(--text-sm);font-weight:var(--font-medium);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${t.title}</div>
                      <div style="font-size:var(--text-xs);color:var(--color-text-muted);">${DateUtils.relative(t.dueDate)}</div>
                      ${resp ? `<div style="font-size:10px;color:${resp.color};">${resp.icon} ${resp.name}</div>` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    this._bindEvents(container);
  }

  _bindEvents(container) {
    document.getElementById('cal-prev')?.addEventListener('click', () => {
      this._date.setMonth(this._date.getMonth() - 1);
      this.render(container);
    });
    document.getElementById('cal-next')?.addEventListener('click', () => {
      this._date.setMonth(this._date.getMonth() + 1);
      this.render(container);
    });
    document.getElementById('add-event-btn')?.addEventListener('click', () => {
      this.app.toast.info('Event creation coming soon!');
    });
  }
}

// ============================================
// INBOX PAGE
// ============================================
export class InboxPage {
  constructor(app) {
    this.app = app;
    this.storage = app.storage;
  }

  render(container) {
    const inbox = this.storage.getCollection('inbox');
    const responsibilities = this.storage.getCollection('responsibilities').filter(r => !r.isArchived);
    const unprocessed = inbox.filter(i => !i.isProcessed);
    const processed = inbox.filter(i => i.isProcessed);

    container.innerHTML = `
      <div class="page-content">
        <div class="page-header flex items-center justify-between">
          <div>
            <div class="page-title">📥 Inbox</div>
            <div class="page-subtitle">${unprocessed.length} items to process</div>
          </div>
          <button class="btn btn-primary" id="add-inbox-btn">＋ Capture Idea</button>
        </div>

        <!-- Quick capture -->
        <div class="card mb-5">
          <div class="card-body">
            <div class="flex gap-3">
              <input type="text" class="input-field flex-1" id="inbox-quick-input" placeholder="Capture a thought, task or idea...">
              <button class="btn btn-primary" id="inbox-quick-add">Add</button>
            </div>
          </div>
        </div>

        <!-- Unprocessed items -->
        ${unprocessed.length > 0 ? `
          <div class="card mb-5">
            <div class="card-header">
              <div class="section-title">📬 To Process (${unprocessed.length})</div>
              ${unprocessed.length > 0 ? `<button class="btn btn-sm btn-ghost" id="process-all-btn">Process All</button>` : ''}
            </div>
            <div id="inbox-unprocessed">
              ${unprocessed.map(item => this._renderInboxItem(item, responsibilities, false)).join('')}
            </div>
          </div>
        ` : `
          <div class="card mb-5">
            <div class="card-body">
              <div class="empty-state">
                <div class="empty-state-icon">🎉</div>
                <div class="empty-state-title">Inbox Zero!</div>
                <div class="empty-state-desc">All items have been processed. Great job!</div>
              </div>
            </div>
          </div>
        `}

        <!-- Processed items -->
        ${processed.length > 0 ? `
          <div class="card">
            <div class="card-header">
              <div class="section-title">✅ Processed (${processed.length})</div>
            </div>
            <div id="inbox-processed">
              ${processed.slice(0, 5).map(item => this._renderInboxItem(item, responsibilities, true)).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    this._bindEvents(container, responsibilities);
  }

  _renderInboxItem(item, responsibilities, processed) {
    return `
      <div class="task-item ${processed ? 'opacity-50' : ''}" data-inbox-id="${item.id}" style="opacity:${processed ? 0.6 : 1};padding:var(--space-3) var(--space-4);">
        <div class="task-checkbox ${processed ? 'checked' : ''}" data-inbox-check="${item.id}">
          ${processed ? '✓' : ''}
        </div>
        <div class="task-content">
          <div class="task-title">${item.title}</div>
          <div class="task-meta">
            <span class="task-date">${DateUtils.relative(item.createdAt)}</span>
            ${item.type ? `<span class="badge badge-neutral">${item.type}</span>` : ''}
          </div>
        </div>
        ${!processed ? `
          <div class="task-actions" style="opacity:1;">
            <select class="select-field" data-inbox-move="${item.id}" style="width:auto;font-size:var(--text-xs);padding:4px 24px 4px 8px;" title="Move to responsibility">
              <option value="">Move to...</option>
              ${responsibilities.map(r => `<option value="${r.id}">${r.icon} ${r.name}</option>`).join('')}
            </select>
            <button class="icon-btn btn-sm danger" data-inbox-delete="${item.id}" style="color:var(--color-error)">🗑️</button>
          </div>
        ` : ''}
      </div>
    `;
  }

  _bindEvents(container, responsibilities) {
    // Quick add
    const input = document.getElementById('inbox-quick-input');
    document.getElementById('inbox-quick-add')?.addEventListener('click', () => {
      const text = input?.value.trim();
      if (!text) return;
      this.storage.addToCollection('inbox', { title: text, type: 'idea', isProcessed: false });
      this.app.toast.success('Captured to inbox');
      this.app.bus.emit('inbox:changed');
      this.render(container);
      if (input) input.value = '';
    });

    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('inbox-quick-add')?.click();
    });

    container.addEventListener('click', (e) => {
      // Mark processed
      const check = e.target.closest('[data-inbox-check]');
      if (check) {
        const id = check.dataset.inboxCheck;
        const item = this.storage.findInCollection('inbox', i => i.id === id);
        this.storage.updateInCollection('inbox', id, { isProcessed: !item?.isProcessed });
        this.app.bus.emit('inbox:changed');
        this.render(container);
        return;
      }

      // Delete
      const del = e.target.closest('[data-inbox-delete]');
      if (del) {
        this.storage.deleteFromCollection('inbox', del.dataset.inboxDelete);
        this.app.bus.emit('inbox:changed');
        this.app.toast.success('Item deleted');
        this.render(container);
        return;
      }
    });

    // Move to responsibility
    container.addEventListener('change', (e) => {
      const moveSelect = e.target.closest('[data-inbox-move]');
      if (moveSelect && e.target.value) {
        const id = moveSelect.dataset.inboxMove;
        const item = this.storage.findInCollection('inbox', i => i.id === id);
        const resp = responsibilities.find(r => r.id === e.target.value);
        if (item && resp) {
          this.storage.addToCollection('tasks', {
            title: item.title,
            responsibilityId: resp.id,
            priority: 'medium',
            status: 'todo',
            dueDate: null,
            tags: [],
            checklist: [],
            files: [],
            comments: []
          });
          this.storage.updateInCollection('inbox', id, { isProcessed: true, responsibilityId: resp.id });
          this.app.toast.success(`Moved to ${resp.icon} ${resp.name}`);
          this.app.bus.emit('tasks:changed');
          this.app.bus.emit('inbox:changed');
          this.render(container);
        }
      }
    });
  }
}

// ============================================
// NOTIFICATIONS PAGE
// ============================================
export class NotificationsPage {
  constructor(app) {
    this.app = app;
    this.storage = app.storage;
  }

  render(container) {
    const notifications = this.storage.getCollection('notifications').sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    const unread = notifications.filter(n => !n.isRead);

    container.innerHTML = `
      <div class="page-content">
        <div class="page-header flex items-center justify-between">
          <div>
            <div class="page-title">🔔 Notifications</div>
            <div class="page-subtitle">${unread.length} unread</div>
          </div>
          ${unread.length > 0 ? `<button class="btn btn-secondary" id="mark-all-read">Mark all as read</button>` : ''}
        </div>

        ${notifications.length === 0 ? `
          <div class="card"><div class="card-body">
            <div class="empty-state">
              <div class="empty-state-icon">🔔</div>
              <div class="empty-state-title">No notifications</div>
              <div class="empty-state-desc">You're all caught up!</div>
            </div>
          </div></div>
        ` : `
          <div class="card">
            ${notifications.map(n => `
              <div style="display:flex;align-items:flex-start;gap:var(--space-3);padding:var(--space-4);border-bottom:1px solid var(--color-border-light);background:${!n.isRead ? 'var(--color-primary-50)' : ''};transition:background var(--transition-fast);"
                   data-notif-id="${n.id}">
                <div style="width:40px;height:40px;border-radius:var(--radius-lg);background:${n.type==='reminder' ? 'var(--color-warning-bg)' : n.type==='error' ? 'var(--color-error-bg)' : 'var(--color-info-bg)'};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">
                  ${n.type === 'reminder' ? '⏰' : n.type === 'warning' ? '⚠️' : n.type === 'success' ? '✅' : 'ℹ️'}
                </div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:var(--text-sm);font-weight:${!n.isRead ? 'var(--font-semibold)' : 'var(--font-normal)'};color:var(--color-text-primary);margin-bottom:2px;">${n.title}</div>
                  <div style="font-size:var(--text-sm);color:var(--color-text-secondary);">${n.body}</div>
                  <div style="font-size:var(--text-xs);color:var(--color-text-muted);margin-top:4px;">${DateUtils.relative(n.createdAt)}</div>
                </div>
                <div style="display:flex;align-items:center;gap:var(--space-2);">
                  ${!n.isRead ? `<button class="btn btn-ghost btn-sm" data-mark-read="${n.id}">Mark read</button>` : ''}
                  <button class="icon-btn btn-sm" data-delete-notif="${n.id}" style="color:var(--color-error)">🗑️</button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;

    this._bindEvents(container);
  }

  _bindEvents(container) {
    document.getElementById('mark-all-read')?.addEventListener('click', () => {
      const notifications = this.storage.getCollection('notifications');
      notifications.forEach(n => this.storage.updateInCollection('notifications', n.id, { isRead: true }));
      this.app.bus.emit('notifications:changed');
      this.render(container);
    });

    container.addEventListener('click', (e) => {
      const markBtn = e.target.closest('[data-mark-read]');
      if (markBtn) {
        this.storage.updateInCollection('notifications', markBtn.dataset.markRead, { isRead: true });
        this.app.bus.emit('notifications:changed');
        this.render(container);
        return;
      }
      const delBtn = e.target.closest('[data-delete-notif]');
      if (delBtn) {
        this.storage.deleteFromCollection('notifications', delBtn.dataset.deleteNotif);
        this.app.bus.emit('notifications:changed');
        this.render(container);
      }
    });
  }
}

// ============================================
// SETTINGS PAGE
// ============================================
export class SettingsPage {
  constructor(app) {
    this.app = app;
    this.storage = app.storage;
  }

  render(container) {
    const settings = this.storage.get('settings') || {};

    container.innerHTML = `
      <div class="page-content">
        <div class="page-header">
          <div class="page-title">⚙️ Settings</div>
          <div class="page-subtitle">Customize your Life OS</div>
        </div>

        <div style="max-width:700px;">
          <!-- Profile -->
          <div class="card mb-5">
            <div class="card-header"><div class="section-title">👤 Profile</div></div>
            <div class="card-body">
              <div class="grid-cols-2 gap-4">
                <div class="input-group">
                  <label class="input-label">Name</label>
                  <input type="text" class="input-field" id="settings-name" value="${settings.userName || 'Ahmed'}" placeholder="Your name">
                </div>
                <div class="input-group">
                  <label class="input-label">Role</label>
                  <input type="text" class="input-field" id="settings-role" value="${settings.userRole || 'Admin'}" placeholder="Your role">
                </div>
              </div>
              <button class="btn btn-primary mt-4" id="save-profile">Save Profile</button>
            </div>
          </div>

          <!-- Appearance -->
          <div class="card mb-5">
            <div class="card-header"><div class="section-title">🎨 Appearance</div></div>
            <div class="card-body">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <div style="font-weight:var(--font-medium);">Dark Mode</div>
                  <div style="font-size:var(--text-sm);color:var(--color-text-muted);">Switch between light and dark theme</div>
                </div>
                <label class="toggle">
                  <input type="checkbox" id="theme-toggle" ${settings.theme === 'dark' ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <div>
                <div style="font-weight:var(--font-medium);margin-bottom:var(--space-3);">Primary Color</div>
                <div style="display:flex;gap:var(--space-2);flex-wrap:wrap;">
                  ${[
                    { color: '#0d9488', name: 'Teal' },
                    { color: '#3b82f6', name: 'Blue' },
                    { color: '#8b5cf6', name: 'Purple' },
                    { color: '#ec4899', name: 'Pink' },
                    { color: '#f97316', name: 'Orange' },
                    { color: '#22c55e', name: 'Green' },
                    { color: '#ef4444', name: 'Red' },
                    { color: '#f59e0b', name: 'Amber' },
                  ].map(c => `
                    <div data-color="${c.color}" title="${c.name}"
                         style="width:32px;height:32px;border-radius:50%;background:${c.color};cursor:pointer;border:3px solid ${settings.primaryColor === c.color ? 'var(--color-text-primary)' : 'transparent'};transition:all var(--transition-fast);"
                         class="color-pick"></div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>

          <!-- Preferences -->
          <div class="card mb-5">
            <div class="card-header"><div class="section-title">🌍 Preferences</div></div>
            <div class="card-body">
              <div class="grid-cols-2 gap-4">
                <div class="input-group">
                  <label class="input-label">Week starts on</label>
                  <select class="select-field" id="week-start">
                    <option value="0" ${settings.weekStartsOn === 0 ? 'selected' : ''}>Sunday</option>
                    <option value="1" ${settings.weekStartsOn === 1 ? 'selected' : ''}>Monday</option>
                  </select>
                </div>
                <div class="input-group">
                  <label class="input-label">Time format</label>
                  <select class="select-field" id="time-format">
                    <option value="12h" ${settings.timeFormat === '12h' ? 'selected' : ''}>12 hour</option>
                    <option value="24h" ${settings.timeFormat === '24h' ? 'selected' : ''}>24 hour</option>
                  </select>
                </div>
              </div>
              <button class="btn btn-secondary mt-4" id="save-preferences">Save Preferences</button>
            </div>
          </div>

          <!-- Data -->
          <div class="card mb-5">
            <div class="card-header"><div class="section-title">💾 Data Management</div></div>
            <div class="card-body">
              <div class="flex gap-3 flex-wrap">
                <button class="btn btn-secondary" id="export-data">⬇️ Export Data</button>
                <button class="btn btn-secondary" id="import-data">⬆️ Import Data</button>
                <input type="file" id="import-file" accept=".json" style="display:none;">
                <button class="btn btn-danger" id="reset-data">🗑️ Reset All Data</button>
              </div>
              <div style="margin-top:var(--space-3);font-size:var(--text-xs);color:var(--color-text-muted);">
                Data is stored locally in your browser. Export regularly to keep backups.
              </div>
            </div>
          </div>

          <!-- About -->
          <div class="card">
            <div class="card-header"><div class="section-title">ℹ️ About</div></div>
            <div class="card-body">
              <div style="display:flex;align-items:center;gap:var(--space-4);">
                <div style="width:56px;height:56px;border-radius:var(--radius-xl);background:linear-gradient(135deg,var(--color-primary),var(--color-primary-light));display:flex;align-items:center;justify-content:center;font-size:28px;">🌟</div>
                <div>
                  <div style="font-size:var(--text-xl);font-weight:var(--font-bold);">Ahmed Life OS</div>
                  <div style="color:var(--color-text-muted);font-size:var(--text-sm);">Version 1.0.0 — Your personal life operating system</div>
                  <div style="font-size:var(--text-xs);color:var(--color-text-muted);margin-top:4px;">Built with HTML, CSS & JavaScript — No frameworks, no limits</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this._bindEvents(container);
  }

  _bindEvents(container) {
    // Theme toggle
    document.getElementById('theme-toggle')?.addEventListener('change', (e) => {
      const theme = e.target.checked ? 'dark' : 'light';
      this.app.applyTheme(theme);
      const settings = this.storage.get('settings') || {};
      settings.theme = theme;
      this.storage.set('settings', settings);
    });

    // Color pick
    container.querySelectorAll('.color-pick').forEach(dot => {
      dot.addEventListener('click', () => {
        const color = dot.dataset.color;
        container.querySelectorAll('.color-pick').forEach(d => d.style.border = '3px solid transparent');
        dot.style.border = '3px solid var(--color-text-primary)';
        document.documentElement.style.setProperty('--color-primary', color);
        const settings = this.storage.get('settings') || {};
        settings.primaryColor = color;
        this.storage.set('settings', settings);
        this.app.toast.success('Color updated!');
      });
    });

    // Save profile
    document.getElementById('save-profile')?.addEventListener('click', () => {
      const settings = this.storage.get('settings') || {};
      settings.userName = document.getElementById('settings-name').value;
      settings.userRole = document.getElementById('settings-role').value;
      this.storage.set('settings', settings);
      this.app.toast.success('Profile saved!');
      this.app.bus.emit('settings:changed');
      this.app.sidebar.refresh();
    });

    // Save preferences
    document.getElementById('save-preferences')?.addEventListener('click', () => {
      const settings = this.storage.get('settings') || {};
      settings.weekStartsOn = parseInt(document.getElementById('week-start').value);
      settings.timeFormat = document.getElementById('time-format').value;
      this.storage.set('settings', settings);
      this.app.toast.success('Preferences saved!');
    });

    // Export
    document.getElementById('export-data')?.addEventListener('click', () => {
      const data = this.storage.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ahmed-life-os-backup-${DateUtils.today()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.app.toast.success('Data exported successfully!');
    });

    // Import
    document.getElementById('import-data')?.addEventListener('click', () => {
      document.getElementById('import-file')?.click();
    });

    document.getElementById('import-file')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          this.storage.importAll(data);
          this.app.toast.success('Data imported! Reloading...');
          setTimeout(() => location.reload(), 1500);
        } catch (err) {
          this.app.toast.error('Import failed', 'Invalid JSON file');
        }
      };
      reader.readAsText(file);
    });

    // Reset
    document.getElementById('reset-data')?.addEventListener('click', () => {
      const modal = this.app.modal.open({
        title: '⚠️ Reset All Data',
        size: 'sm',
        content: `<div class="confirm-dialog">
          <div class="confirm-icon danger">⚠️</div>
          <div class="confirm-title">Reset Everything?</div>
          <div class="confirm-message">This will delete ALL your data permanently. Export a backup first!</div>
        </div>`,
        footer: `<button class="btn btn-secondary" id="cancel-reset">Cancel</button><button class="btn btn-danger" id="confirm-reset">Reset All Data</button>`
      });
      document.getElementById('cancel-reset')?.addEventListener('click', () => modal.close());
      document.getElementById('confirm-reset')?.addEventListener('click', () => {
        this.storage.clearAll();
        location.reload();
      });
    });
  }
}
