/**
 * Ahmed Life OS - Search Component
 */

import { DateUtils, StringUtils, PRIORITY_CONFIG } from '../../utils/utils.js';

export class SearchDialog {
  constructor(app) {
    this.app = app;
    this.storage = app.storage;
    this.router = app.router;
    this._isOpen = false;
    this._query = '';
    this._focusIdx = -1;
    this._results = [];
    this._el = null;
    this._init();
  }

  _init() {
    const el = document.createElement('div');
    el.className = 'search-dialog';
    el.id = 'search-dialog';
    el.innerHTML = `
      <div class="search-dialog-backdrop" id="search-backdrop"></div>
      <div class="search-dialog-box">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input type="text" id="search-input" placeholder="Search tasks, notes, responsibilities..." autocomplete="off">
          <kbd style="background:var(--color-bg-secondary);border:1px solid var(--color-border);border-radius:4px;padding:2px 6px;font-size:11px;color:var(--color-text-muted);font-family:var(--font-mono);">ESC</kbd>
        </div>
        <div class="search-results" id="search-results">
          <div style="padding:var(--space-8);text-align:center;color:var(--color-text-muted);font-size:var(--text-sm);">
            Start typing to search...
          </div>
        </div>
        <div class="search-footer">
          <div class="search-footer-hint"><kbd>↑↓</kbd> Navigate</div>
          <div class="search-footer-hint"><kbd>↵</kbd> Open</div>
          <div class="search-footer-hint"><kbd>ESC</kbd> Close</div>
        </div>
      </div>
    `;
    document.body.appendChild(el);
    this._el = el;
    this._bindEvents();
  }

  _bindEvents() {
    document.getElementById('search-backdrop')?.addEventListener('click', () => this.close());

    const input = document.getElementById('search-input');
    input?.addEventListener('input', (e) => {
      this._query = e.target.value;
      this._focusIdx = -1;
      this._search(this._query);
    });

    input?.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); this._moveFocus(1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); this._moveFocus(-1); }
      if (e.key === 'Enter') { e.preventDefault(); this._openFocused(); }
      if (e.key === 'Escape') this.close();
    });

    // Global keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this._isOpen ? this.close() : this.open();
      }
      if (e.key === 'Escape' && this._isOpen) this.close();
    });
  }

  open() {
    this._isOpen = true;
    this._el.classList.add('open');
    const input = document.getElementById('search-input');
    if (input) { input.value = ''; input.focus(); }
    this._query = '';
    this._results = [];
    this._renderResults([]);
  }

  close() {
    this._isOpen = false;
    this._el.classList.remove('open');
  }

  _search(query) {
    if (!query.trim()) {
      this._renderResults([]);
      return;
    }

    const q = query.toLowerCase();
    const tasks = this.storage.getCollection('tasks');
    const notes = this.storage.getCollection('notes');
    const responsibilities = this.storage.getCollection('responsibilities');
    const habits = this.storage.getCollection('habits');
    const journal = this.storage.getCollection('journal');

    const results = [];

    // Search tasks
    tasks.filter(t => t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)).slice(0, 5).forEach(t => {
      const resp = responsibilities.find(r => r.id === t.responsibilityId);
      results.push({
        type: 'task', id: t.id, icon: PRIORITY_CONFIG[t.priority]?.icon || '✅',
        title: StringUtils.highlight(t.title, query),
        subtitle: resp ? `${resp.icon} ${resp.name}` : 'No responsibility',
        data: t
      });
    });

    // Search notes
    notes.filter(n => n.title?.toLowerCase().includes(q) || StringUtils.stripHtml(n.content || '').toLowerCase().includes(q)).slice(0, 3).forEach(n => {
      results.push({
        type: 'note', id: n.id, icon: '📝',
        title: StringUtils.highlight(n.title || 'Untitled', query),
        subtitle: StringUtils.truncate(StringUtils.stripHtml(n.content || ''), 50),
        data: n
      });
    });

    // Search responsibilities
    responsibilities.filter(r => r.name?.toLowerCase().includes(q)).slice(0, 3).forEach(r => {
      results.push({
        type: 'responsibility', id: r.id, icon: r.icon,
        title: StringUtils.highlight(r.name, query),
        subtitle: r.description || '',
        data: r
      });
    });

    // Search habits
    habits.filter(h => h.name?.toLowerCase().includes(q)).slice(0, 2).forEach(h => {
      results.push({
        type: 'habit', id: h.id, icon: h.icon,
        title: StringUtils.highlight(h.name, query),
        subtitle: `🔥 ${h.streak || 0} day streak`,
        data: h
      });
    });

    // Search journal
    journal.filter(j => j.content?.toLowerCase().includes(q)).slice(0, 2).forEach(j => {
      results.push({
        type: 'journal', id: j.id, icon: j.mood || '📓',
        title: StringUtils.highlight(DateUtils.format(j.date, 'MMMM D, YYYY'), query),
        subtitle: StringUtils.truncate(j.content || '', 60),
        data: j
      });
    });

    this._results = results;
    this._renderResults(results, query);
  }

  _renderResults(results, query = '') {
    const container = document.getElementById('search-results');
    if (!container) return;

    if (!query) {
      container.innerHTML = `<div style="padding:var(--space-8);text-align:center;color:var(--color-text-muted);font-size:var(--text-sm);">Start typing to search...</div>`;
      return;
    }

    if (results.length === 0) {
      container.innerHTML = `
        <div style="padding:var(--space-8);text-align:center;">
          <div style="font-size:32px;margin-bottom:var(--space-3);">🔍</div>
          <div style="font-size:var(--text-sm);color:var(--color-text-muted);">No results for "<strong>${query}</strong>"</div>
        </div>`;
      return;
    }

    const groups = {};
    results.forEach(r => {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    });

    const typeLabels = { task: 'Tasks', note: 'Notes', responsibility: 'Responsibilities', habit: 'Habits', journal: 'Journal' };

    container.innerHTML = Object.entries(groups).map(([type, items]) => `
      <div class="search-result-group">
        <div class="search-result-group-label">${typeLabels[type] || type}</div>
        ${items.map((item, idx) => `
          <div class="search-result-item" data-result-idx="${results.indexOf(item)}" data-result-type="${item.type}" data-result-id="${item.id}">
            <div class="search-result-icon">${item.icon}</div>
            <div class="search-result-text">
              <div class="result-title">${item.title}</div>
              <div class="result-path">${item.subtitle}</div>
            </div>
            <span style="font-size:10px;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.04em;">${type}</span>
          </div>
        `).join('')}
      </div>
    `).join('');

    container.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const type = item.dataset.resultType;
        const id = item.dataset.resultId;
        this._openResult(type, id);
      });
    });
  }

  _moveFocus(dir) {
    const items = document.querySelectorAll('.search-result-item');
    if (!items.length) return;
    items.forEach(i => i.classList.remove('focused'));
    this._focusIdx = Math.max(0, Math.min(items.length - 1, this._focusIdx + dir));
    items[this._focusIdx]?.classList.add('focused');
    items[this._focusIdx]?.scrollIntoView({ block: 'nearest' });
  }

  _openFocused() {
    const focused = document.querySelector('.search-result-item.focused');
    if (focused) {
      this._openResult(focused.dataset.resultType, focused.dataset.resultId);
    }
  }

  _openResult(type, id) {
    this.close();
    if (type === 'responsibility') this.router.navigate('responsibility', { responsibilityId: id });
    else if (type === 'task') { this.app.openTaskModal(id); }
    else if (type === 'note') { this.app.openNoteModal(id); }
    else if (type === 'habit') this.router.navigate('habits');
    else if (type === 'journal') this.router.navigate('journal');
  }
}
