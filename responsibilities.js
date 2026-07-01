/**
 * Ahmed Life OS - Responsibilities Page
 */

import { DateUtils, ColorUtils, RESPONSIBILITY_ICONS } from '../../utils/utils.js';

export class ResponsibilitiesPage {
  constructor(app) {
    this.app = app;
    this.storage = app.storage;
    this.router = app.router;
  }

  render(container) {
    const responsibilities = this.storage.getCollection('responsibilities');
    const tasks = this.storage.getCollection('tasks');
    const active = responsibilities.filter(r => !r.isArchived);
    const archived = responsibilities.filter(r => r.isArchived);

    container.innerHTML = `
      <div class="page-content">
        <div class="page-header flex items-center justify-between">
          <div>
            <div class="page-title">🗂️ Responsibilities</div>
            <div class="page-subtitle">${active.length} active responsibility${active.length !== 1 ? 's' : ''}</div>
          </div>
          <button class="btn btn-primary" id="new-resp-btn">＋ New Responsibility</button>
        </div>

        <div class="grid-cols-auto" id="resp-grid">
          ${active.map((r, i) => this._renderCard(r, tasks, i)).join('')}
          <div class="responsibility-card" id="add-resp-card" style="border:2px dashed var(--color-border);background:transparent;display:flex;align-items:center;justify-content:center;min-height:220px;cursor:pointer;transition:all var(--transition-base);"
            onmouseover="this.style.borderColor='var(--color-primary)';this.style.background='var(--color-primary-50)'"
            onmouseout="this.style.borderColor='var(--color-border)';this.style.background='transparent'">
            <div style="text-align:center;color:var(--color-text-muted);">
              <div style="font-size:36px;margin-bottom:var(--space-2)">➕</div>
              <div style="font-size:var(--text-sm);font-weight:var(--font-medium)">Add Responsibility</div>
            </div>
          </div>
        </div>

        ${archived.length > 0 ? `
          <div class="mt-6">
            <div class="section-header">
              <div class="section-title">📦 Archived (${archived.length})</div>
              <button class="btn btn-ghost btn-sm" id="toggle-archived">Show</button>
            </div>
            <div id="archived-grid" style="display:none" class="grid-cols-auto mt-4">
              ${archived.map((r, i) => this._renderCard(r, tasks, i, true)).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    this._bindEvents(container);
  }

  _renderCard(r, tasks, idx, archived = false) {
    const rTasks = tasks.filter(t => t.responsibilityId === r.id);
    const done = rTasks.filter(t => t.status === 'done').length;
    const progress = rTasks.length ? Math.round((done / rTasks.length) * 100) : 0;
    const pending = rTasks.filter(t => t.status !== 'done').length;

    return `
      <div class="responsibility-card animate-fade-in delay-${Math.min(idx + 1, 6)}"
           style="--resp-color:${r.color};--resp-color-bg:${r.colorBg || '#f0fdfa'};${archived ? 'opacity:0.7;' : ''}"
           data-resp-id="${r.id}">
        <div class="resp-card-header">
          <div class="resp-card-icon-wrap">${r.icon}</div>
          <div class="resp-card-menu dropdown">
            <button class="icon-btn btn-sm" data-menu-btn="${r.id}">⋯</button>
            <div class="dropdown-menu" id="resp-menu-${r.id}">
              <div class="dropdown-item" data-action="open" data-id="${r.id}">
                <span class="item-icon">📂</span> Open
              </div>
              <div class="dropdown-item" data-action="edit" data-id="${r.id}">
                <span class="item-icon">✏️</span> Edit
              </div>
              <div class="dropdown-item" data-action="${archived ? 'unarchive' : 'archive'}" data-id="${r.id}">
                <span class="item-icon">${archived ? '📤' : '📦'}</span> ${archived ? 'Unarchive' : 'Archive'}
              </div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item danger" data-action="delete" data-id="${r.id}">
                <span class="item-icon">🗑️</span> Delete
              </div>
            </div>
          </div>
        </div>

        <div class="resp-card-title">${r.name}</div>
        <div class="resp-card-desc">${r.description || 'No description'}</div>

        <div class="resp-card-stats">
          <div class="resp-stat">
            <div class="resp-stat-value">${rTasks.length}</div>
            <div class="resp-stat-label">Tasks</div>
          </div>
          <div class="resp-stat">
            <div class="resp-stat-value" style="color:var(--color-success)">${done}</div>
            <div class="resp-stat-label">Done</div>
          </div>
          <div class="resp-stat">
            <div class="resp-stat-value" style="color:${pending > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)'}">
              ${pending}
            </div>
            <div class="resp-stat-label">Pending</div>
          </div>
        </div>

        <div class="resp-card-progress">
          <div class="resp-progress-header">
            <span class="resp-progress-label">Progress</span>
            <span class="resp-progress-value">${progress}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${progress}%;background:${r.color}"></div>
          </div>
        </div>
      </div>
    `;
  }

  _bindEvents(container) {
    container.addEventListener('click', (e) => {
      // Menu button toggle
      const menuBtn = e.target.closest('[data-menu-btn]');
      if (menuBtn) {
        e.stopPropagation();
        const id = menuBtn.dataset.menuBtn;
        const menu = document.getElementById(`resp-menu-${id}`);
        document.querySelectorAll('.dropdown-menu.open').forEach(m => {
          if (m !== menu) m.classList.remove('open');
        });
        menu?.classList.toggle('open');
        return;
      }

      // Dropdown actions
      const action = e.target.closest('[data-action]');
      if (action) {
        e.stopPropagation();
        const id = action.dataset.id;
        const act = action.dataset.action;
        document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open'));

        if (act === 'open') this.router.navigate('responsibility', { responsibilityId: id });
        if (act === 'edit') this._openEditModal(id);
        if (act === 'archive') this._archiveResp(id, true);
        if (act === 'unarchive') this._archiveResp(id, false);
        if (act === 'delete') this._deleteResp(id);
        return;
      }

      // Card click -> open
      const card = e.target.closest('.responsibility-card[data-resp-id]');
      if (card && !e.target.closest('.resp-card-menu')) {
        const id = card.dataset.respId;
        this.router.navigate('responsibility', { responsibilityId: id });
      }

      // Add card
      if (e.target.closest('#add-resp-card') || e.target.id === 'new-resp-btn') {
        this.app.openNewResponsibilityModal();
      }

      // Toggle archived
      if (e.target.id === 'toggle-archived') {
        const grid = document.getElementById('archived-grid');
        if (grid) {
          const visible = grid.style.display !== 'none';
          grid.style.display = visible ? 'none' : 'grid';
          e.target.textContent = visible ? 'Show' : 'Hide';
        }
      }
    });

    // Close dropdowns on outside click
    document.addEventListener('click', () => {
      document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open'));
    });
  }

  _archiveResp(id, archive) {
    this.storage.updateInCollection('responsibilities', id, { isArchived: archive });
    this.app.toast.success(archive ? 'Responsibility archived' : 'Responsibility restored');
    this.app.bus.emit('responsibilities:changed');
    this.render(document.getElementById('app-main'));
  }

  _deleteResp(id) {
    const resp = this.storage.findInCollection('responsibilities', r => r.id === id);
    if (!resp) return;

    const modal = this.app.modal.open({
      title: 'Delete Responsibility',
      content: `
        <div class="confirm-dialog">
          <div class="confirm-icon danger">🗑️</div>
          <div class="confirm-title">Delete "${resp.name}"?</div>
          <div class="confirm-message">This will permanently delete this responsibility and all its tasks, notes, and files. This action cannot be undone.</div>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" id="confirm-cancel">Cancel</button>
        <button class="btn btn-danger" id="confirm-delete">Delete</button>
      `
    });

    document.getElementById('confirm-cancel')?.addEventListener('click', () => modal.close());
    document.getElementById('confirm-delete')?.addEventListener('click', () => {
      this.storage.deleteFromCollection('responsibilities', id);
      // Delete associated tasks
      const tasks = this.storage.getCollection('tasks').filter(t => t.responsibilityId !== id);
      this.storage.saveCollection('tasks', tasks);
      modal.close();
      this.app.toast.success('Responsibility deleted');
      this.app.bus.emit('responsibilities:changed');
      this.app.bus.emit('tasks:changed');
      this.render(document.getElementById('app-main'));
    });
  }

  _openEditModal(id) {
    const resp = this.storage.findInCollection('responsibilities', r => r.id === id);
    if (!resp) return;
    this.app.openResponsibilityModal(resp);
  }
}
