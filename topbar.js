/**
 * Ahmed Life OS - Topbar Component
 */

import { DateUtils } from '../../utils/utils.js';

export class Topbar {
  constructor(app) {
    this.app = app;
    this.state = app.state;
    this.storage = app.storage;
    this.el = document.getElementById('topbar');
    this._clockInterval = null;

    this._render();
    this._bindEvents();
    this._startClock();
    this._watchState();
  }

  _render() {
    const settings = this.storage.get('settings') || {};
    const notifications = this.storage.getCollection('notifications');
    const unread = notifications.filter(n => !n.isRead).length;

    this.el.innerHTML = `
      <div class="topbar-left">
        <button class="icon-btn" id="topbar-menu-btn" title="Menu">
          ☰
        </button>

        <div class="topbar-breadcrumb" id="topbar-breadcrumb">
          <span class="topbar-breadcrumb-item" data-page="dashboard">Home</span>
          <span class="topbar-breadcrumb-sep">›</span>
          <span class="topbar-breadcrumb-item active" id="breadcrumb-current">Dashboard</span>
        </div>
      </div>

      <div class="topbar-search" id="topbar-search-trigger" title="Search (⌘K)">
        <span style="font-size:16px;color:var(--color-text-muted)">🔍</span>
        <span class="topbar-search-text">Search anything...</span>
        <kbd class="topbar-search-kbd">⌘K</kbd>
      </div>

      <div class="topbar-right">
        <div class="topbar-clock" id="topbar-clock" style="font-size:var(--text-sm);font-weight:var(--font-medium);color:var(--color-text-muted);font-variant-numeric:tabular-nums;"></div>

        <button class="topbar-action-btn" id="topbar-search-btn" title="Search">
          🔍
        </button>

        <button class="topbar-action-btn" id="topbar-theme-btn" title="Toggle theme">
          ${settings.theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <button class="topbar-action-btn" id="topbar-notif-btn" title="Notifications">
          🔔
          ${unread > 0 ? '<span class="notification-dot"></span>' : ''}
        </button>

        <button class="topbar-action-btn" id="topbar-add-btn" title="Quick add (+ or N)" style="background:var(--color-primary);color:white;border-radius:var(--radius-md);">
          ＋
        </button>
      </div>
    `;
  }

  _bindEvents() {
    // Mobile menu
    this.el.querySelector('#topbar-menu-btn')?.addEventListener('click', () => {
      this.app.sidebar.openMobile();
    });

    // Search triggers
    this.el.querySelector('#topbar-search-trigger')?.addEventListener('click', () => this.app.openSearch());
    this.el.querySelector('#topbar-search-btn')?.addEventListener('click', () => this.app.openSearch());

    // Theme toggle
    this.el.querySelector('#topbar-theme-btn')?.addEventListener('click', () => this.app.toggleTheme());

    // Notifications
    this.el.querySelector('#topbar-notif-btn')?.addEventListener('click', () => {
      this.app.router.navigate('notifications');
    });

    // Quick add
    this.el.querySelector('#topbar-add-btn')?.addEventListener('click', () => {
      this.app.openQuickAddModal();
    });

    // Breadcrumb navigation
    this.el.addEventListener('click', (e) => {
      const item = e.target.closest('.topbar-breadcrumb-item[data-page]');
      if (item) this.app.router.navigate(item.dataset.page);
    });
  }

  _startClock() {
    const update = () => {
      const clockEl = document.getElementById('topbar-clock');
      if (clockEl) clockEl.textContent = DateUtils.formatTime(new Date());
    };
    update();
    this._clockInterval = setInterval(update, 1000);
  }

  _watchState() {
    this.app.bus.on('route:change', ({ path, params }) => {
      this._updateBreadcrumb(path, params);
    });

    this.app.bus.on('theme:changed', ({ theme }) => {
      const btn = this.el.querySelector('#topbar-theme-btn');
      if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    });

    this.app.bus.on('notifications:changed', () => {
      const notifBtn = this.el.querySelector('#topbar-notif-btn');
      if (!notifBtn) return;
      const notifications = this.storage.getCollection('notifications');
      const unread = notifications.filter(n => !n.isRead).length;
      notifBtn.innerHTML = `🔔${unread > 0 ? '<span class="notification-dot"></span>' : ''}`;
    });
  }

  _updateBreadcrumb(path, params) {
    const breadcrumb = document.getElementById('topbar-breadcrumb');
    if (!breadcrumb) return;

    const PAGE_LABELS = {
      dashboard: 'Dashboard',
      responsibilities: 'Responsibilities',
      responsibility: 'Responsibility',
      personal: 'Personal',
      calendar: 'Calendar',
      inbox: 'Inbox',
      notifications: 'Notifications',
      search: 'Search',
      statistics: 'Statistics',
      settings: 'Settings',
      habits: 'Habits',
      journal: 'Journal',
      finance: 'Finance',
      focus: 'Focus Timer'
    };

    let label = PAGE_LABELS[path] || path;

    if (path === 'responsibility' && params?.responsibilityId) {
      const resp = this.storage.findInCollection('responsibilities', r => r.id === params.responsibilityId);
      if (resp) label = resp.name;
    }

    breadcrumb.innerHTML = `
      <span class="topbar-breadcrumb-item" data-page="dashboard">Home</span>
      <span class="topbar-breadcrumb-sep">›</span>
      <span class="topbar-breadcrumb-item active" id="breadcrumb-current">${label}</span>
    `;
  }

  destroy() {
    if (this._clockInterval) clearInterval(this._clockInterval);
  }
}
