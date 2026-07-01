/**
 * Ahmed Life OS - Main Application
 * Central orchestrator for all modules
 */

import StorageService from './storage/storage.service.js';
import { EventBus, StateManager, Router, ToastManager, ModalManager, ContextMenuManager } from './services/app.core.js';
import { Sidebar } from './components/sidebar/sidebar.js';
import { Topbar } from './components/topbar/topbar.js';
import { SearchDialog } from './components/search/search.js';
import { DashboardPage } from './pages/dashboard/dashboard.js';
import { ResponsibilitiesPage } from './pages/responsibilities/responsibilities.js';
import { ResponsibilityDetailPage } from './pages/responsibilities/responsibility-detail.js';
import { HabitsPage, JournalPage, FinancePage, FocusPage, StatisticsPage } from './pages/personal/personal-pages.js';
import { CalendarPage, InboxPage, NotificationsPage, SettingsPage } from './pages/utility-pages.js';
import {
  openTaskModal, openResponsibilityModal, openHabitModal,
  openJournalModal, openTransactionModal, openGoalModal,
  openNoteModal, openQuickAddModal
} from './components/modals/modals.js';

class AhmedLifeOS {
  constructor() {
    this.storage = new StorageService();
    this.bus = new EventBus();
    this.state = new StateManager(this.storage);
    this.router = new Router(this.state, this.bus);
    this.toast = new ToastManager();
    this.modal = new ModalManager();
    this.contextMenu = new ContextMenuManager();

    this._pages = {};
    this._currentPageInstance = null;

    this._init();
  }

  _init() {
    this._applyStoredTheme();
    this._setupLayout();
    this._registerRoutes();
    this._setupComponents();
    this._setupGlobalEvents();
    this._navigateInitial();
    this._hideLoader();
  }

  _applyStoredTheme() {
    const settings = this.storage.get('settings') || {};
    if (settings.theme) document.documentElement.setAttribute('data-theme', settings.theme);
    if (settings.primaryColor) document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
  }

  _setupLayout() {
    document.getElementById('app').innerHTML = `
      <div class="app-shell">
        <div class="sidebar-overlay" id="sidebar-overlay"></div>
        <aside id="sidebar" class="sidebar"></aside>
        <div class="main-content">
          <header id="topbar" class="topbar"></header>
          <main id="app-main" class="flex-1" style="overflow:hidden;display:flex;flex-direction:column;"></main>
        </div>
      </div>
      <div id="toast-container" class="toast-container"></div>
    `;
  }

  _setupComponents() {
    this.sidebar = new Sidebar(this);
    this.topbar = new Topbar(this);
    this.search = new SearchDialog(this);

    // Mobile sidebar overlay
    document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
      this.sidebar.closeMobile();
    });
  }

  _registerRoutes() {
    const main = () => document.getElementById('app-main');

    this.router.register('dashboard', () => {
      this._destroyCurrent();
      const page = this._getPage('dashboard', () => new DashboardPage(this));
      page.render(main());
      this._currentPageInstance = page;
    });

    this.router.register('responsibilities', () => {
      this._destroyCurrent();
      const page = this._getPage('responsibilities', () => new ResponsibilitiesPage(this));
      page.render(main());
      this._currentPageInstance = page;
    });

    this.router.register('responsibility', (params) => {
      this._destroyCurrent();
      if (!this._pages['responsibility-detail']) {
        this._pages['responsibility-detail'] = new ResponsibilityDetailPage(this);
      }
      const page = this._pages['responsibility-detail'];
      page.render(main(), params.responsibilityId, params.subPage || 'tasks');
      this._currentPageInstance = page;
    });

    this.router.register('habits', () => {
      this._destroyCurrent();
      const page = this._getPage('habits', () => new HabitsPage(this));
      page.render(main());
      this._currentPageInstance = page;
    });

    this.router.register('journal', () => {
      this._destroyCurrent();
      const page = this._getPage('journal', () => new JournalPage(this));
      page.render(main());
      this._currentPageInstance = page;
    });

    this.router.register('finance', () => {
      this._destroyCurrent();
      const page = this._getPage('finance', () => new FinancePage(this));
      page.render(main());
      this._currentPageInstance = page;
    });

    this.router.register('focus', () => {
      this._destroyCurrent();
      const page = this._getPage('focus', () => new FocusPage(this));
      page.render(main());
      this._currentPageInstance = page;
    });

    this.router.register('statistics', () => {
      this._destroyCurrent();
      const page = this._getPage('statistics', () => new StatisticsPage(this));
      page.render(main());
      this._currentPageInstance = page;
    });

    this.router.register('calendar', () => {
      this._destroyCurrent();
      const page = this._getPage('calendar', () => new CalendarPage(this));
      page.render(main());
      this._currentPageInstance = page;
    });

    this.router.register('inbox', () => {
      this._destroyCurrent();
      const page = this._getPage('inbox', () => new InboxPage(this));
      page.render(main());
      this._currentPageInstance = page;
    });

    this.router.register('notifications', () => {
      this._destroyCurrent();
      const page = this._getPage('notifications', () => new NotificationsPage(this));
      page.render(main());
      this._currentPageInstance = page;
    });

    this.router.register('settings', () => {
      this._destroyCurrent();
      const page = this._getPage('settings', () => new SettingsPage(this));
      page.render(main());
      this._currentPageInstance = page;
    });

    this.router.register('personal', () => {
      this.router.navigate('dashboard');
    });

    this.router.register('search', () => {
      this.search.open();
    });
  }

  _getPage(key, factory) {
    if (!this._pages[key]) this._pages[key] = factory();
    return this._pages[key];
  }

  _destroyCurrent() {
    if (this._currentPageInstance?.destroy) {
      this._currentPageInstance.destroy();
    }
    this._currentPageInstance = null;
    // Clear main content
    const main = document.getElementById('app-main');
    if (main) main.innerHTML = '';
  }

  _navigateInitial() {
    const { path, params } = this.router.parseHash();
    const validPaths = ['dashboard','responsibilities','responsibility','habits','journal','finance',
                        'focus','statistics','calendar','inbox','notifications','settings','personal','search'];
    if (validPaths.includes(path)) {
      this.router.navigate(path, params);
    } else {
      this.router.navigate('dashboard');
    }
  }

  _setupGlobalEvents() {
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') return;

      // Navigation shortcuts
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === 'g') { this.router.navigate('dashboard'); return; }
        if (e.key === 'r') { this.router.navigate('responsibilities'); return; }
        if (e.key === 'c') { this.router.navigate('calendar'); return; }
        if (e.key === 'h') { this.router.navigate('habits'); return; }
        if (e.key === 'j') { this.router.navigate('journal'); return; }
        if (e.key === 'i') { this.router.navigate('inbox'); return; }
        if (e.key === 'f') { this.router.navigate('focus'); return; }
        if (e.key === 's') { this.router.navigate('settings'); return; }
        if (e.key === 'n') { this.openTaskModal(); return; }
        if (e.key === '?') { this._showShortcutsModal(); return; }
      }
    });

    // Context menu on responsibility cards
    document.addEventListener('contextmenu', (e) => {
      const card = e.target.closest('.responsibility-card[data-resp-id]');
      if (card) {
        const id = card.dataset.respId;
        const resp = this.storage.findInCollection('responsibilities', r => r.id === id);
        if (resp) {
          this.contextMenu.show(e, [
            { icon: '📂', label: 'Open', action: () => this.router.navigate('responsibility', { responsibilityId: id }) },
            { icon: '✏️', label: 'Edit', action: () => this.openResponsibilityModal(resp) },
            { icon: '📦', label: resp.isArchived ? 'Unarchive' : 'Archive', action: () => {
              this.storage.updateInCollection('responsibilities', id, { isArchived: !resp.isArchived });
              this.bus.emit('responsibilities:changed');
              this.refreshCurrentPage();
            }},
            'sep',
            { icon: '🗑️', label: 'Delete', danger: true, action: () => {
              this.storage.deleteFromCollection('responsibilities', id);
              this.bus.emit('responsibilities:changed');
              this.refreshCurrentPage();
            }}
          ]);
        }
      }
    });

    // Bus events for cross-module refresh
    this.bus.on('sidebar:toggled', () => {});
    this.bus.on('settings:changed', () => {
      this._applyStoredTheme();
    });
  }

  _hideLoader() {
    const loader = document.getElementById('page-loader');
    if (loader) {
      setTimeout(() => {
        loader.classList.add('fade-out');
        setTimeout(() => loader.remove(), 400);
      }, 500);
    }
  }

  // ============================
  // PUBLIC API
  // ============================

  openSearch() { this.search.open(); }
  openTaskModal(taskId = null, responsibilityId = null, defaultStatus = null) {
    openTaskModal(this, taskId, responsibilityId, defaultStatus);
  }
  openResponsibilityModal(existing = null) { openResponsibilityModal(this, existing); }
  openNewResponsibilityModal() { openResponsibilityModal(this, null); }
  openHabitModal(habitId = null) { openHabitModal(this, habitId); }
  openJournalModal(entryId = null) { openJournalModal(this, entryId); }
  openTransactionModal() { openTransactionModal(this); }
  openGoalModal(goalId = null, responsibilityId = null) { openGoalModal(this, goalId, responsibilityId); }
  openNoteModal(noteId = null, responsibilityId = null) { openNoteModal(this, noteId, responsibilityId); }
  openQuickAddModal() { openQuickAddModal(this); }

  toggleTheme() {
    const settings = this.storage.get('settings') || {};
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
    settings.theme = newTheme;
    this.storage.set('settings', settings);
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.bus.emit('theme:changed', { theme });
  }

  refreshCurrentPage() {
    const path = this.state.get('currentPage');
    const respId = this.state.get('currentResponsibility');
    const subPage = this.state.get('currentResponsibilityPage');

    if (path === 'responsibility' && respId) {
      this.router.navigate(path, { responsibilityId: respId, subPage });
    } else {
      this.router.navigate(path);
    }
  }

  _showShortcutsModal() {
    this.modal.open({
      title: '⌨️ Keyboard Shortcuts',
      content: `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-2);">
          ${[
            ['⌘K', 'Search'],
            ['G', 'Dashboard'],
            ['R', 'Responsibilities'],
            ['C', 'Calendar'],
            ['H', 'Habits'],
            ['J', 'Journal'],
            ['I', 'Inbox'],
            ['F', 'Focus Timer'],
            ['S', 'Settings'],
            ['N', 'New Task'],
            ['?', 'Show Shortcuts'],
          ].map(([key, label]) => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-2) var(--space-3);background:var(--color-bg);border-radius:var(--radius-sm);">
              <span style="font-size:var(--text-sm);color:var(--color-text-secondary);">${label}</span>
              <kbd style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:4px;padding:2px 6px;font-size:11px;font-family:var(--font-mono);">${key}</kbd>
            </div>
          `).join('')}
        </div>
      `,
      footer: `<button class="btn btn-primary" onclick="app.modal.closeTop()">Got it</button>`
    });
  }
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
  window.app = new AhmedLifeOS();
});
