/**
 * Ahmed Life OS - Sidebar Component
 */


export class Sidebar {
  constructor(app) {
    this.app = app;
    this.storage = app.storage;
    this.state = app.state;
    this.router = app.router;
    this.el = document.getElementById('sidebar');
    this._collapsed = false;
    this._mobileOpen = false;
    this._respExpanded = false;

    this._render();
    this._bindEvents();
    this._watchState();
  }

  _render() {
    const settings = this.storage.get('settings') || {};
    const responsibilities = this.storage.getCollection('responsibilities');
    const tasks = this.storage.getCollection('tasks');
    const notifications = this.storage.getCollection('notifications');
    const unreadCount = notifications.filter(n => !n.isRead).length;

    this.el.innerHTML = `
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div class="sidebar-logo-icon">🌟</div>
          <span class="sidebar-logo-text">Life OS</span>
        </div>
        <button class="sidebar-toggle icon-btn" id="sidebar-toggle-btn" title="Toggle sidebar">
          ☰
        </button>
      </div>

      <nav class="sidebar-nav" id="sidebar-nav">
        <div class="sidebar-section">
          <div class="sidebar-section-label">Main</div>

          <div class="nav-item ${this._isActive('dashboard')}" data-page="dashboard">
            <span class="nav-icon">🏠</span>
            <span class="nav-label">Dashboard</span>
          </div>

          <div class="nav-item ${this._isActive('inbox')}" data-page="inbox">
            <span class="nav-icon">📥</span>
            <span class="nav-label">Inbox</span>
            <span class="nav-badge" style="display:none">0</span>
          </div>

          <div class="nav-item ${this._isActive('calendar')}" data-page="calendar">
            <span class="nav-icon">📅</span>
            <span class="nav-label">Calendar</span>
          </div>

          <div class="nav-item ${this._isActive('notifications')}" data-page="notifications">
            <span class="nav-icon">🔔</span>
            <span class="nav-label">Notifications</span>
            ${unreadCount > 0 ? `<span class="nav-badge">${unreadCount}</span>` : ''}
          </div>

          <div class="nav-item ${this._isActive('statistics')}" data-page="statistics">
            <span class="nav-icon">📊</span>
            <span class="nav-label">Statistics</span>
          </div>
        </div>

        <div class="sidebar-section">
          <div class="sidebar-section-label">
            <span>Responsibilities</span>
          </div>

          <div class="nav-item ${this._isActive('responsibilities')}" data-page="responsibilities">
            <span class="nav-icon">🗂️</span>
            <span class="nav-label">All Responsibilities</span>
          </div>

          ${responsibilities.filter(r => !r.isArchived).map(r => `
            <div class="nav-item nav-item-resp ${this._isActiveResp(r.id)}" data-page="responsibility" data-resp-id="${r.id}">
              <span class="nav-icon">${r.icon}</span>
              <span class="nav-label">${r.name}</span>
              <span class="nav-badge" style="background:${r.color}">
                ${tasks.filter(t => t.responsibilityId === r.id && t.status !== 'done').length || ''}
              </span>
            </div>
          `).join('')}

          <div class="nav-item" id="add-responsibility-nav">
            <span class="nav-icon">➕</span>
            <span class="nav-label">New Responsibility</span>
          </div>
        </div>

        <div class="sidebar-section">
          <div class="sidebar-section-label">Personal</div>

          <div class="nav-item ${this._isActive('personal')}" data-page="personal">
            <span class="nav-icon">🌿</span>
            <span class="nav-label">Personal</span>
          </div>

          <div class="nav-item ${this._isActive('habits')}" data-page="habits">
            <span class="nav-icon">🔥</span>
            <span class="nav-label">Habits</span>
          </div>

          <div class="nav-item ${this._isActive('journal')}" data-page="journal">
            <span class="nav-icon">📓</span>
            <span class="nav-label">Journal</span>
          </div>

          <div class="nav-item ${this._isActive('finance')}" data-page="finance">
            <span class="nav-icon">💰</span>
            <span class="nav-label">Finance</span>
          </div>

          <div class="nav-item ${this._isActive('focus')}" data-page="focus">
            <span class="nav-icon">⏱️</span>
            <span class="nav-label">Focus Timer</span>
          </div>
        </div>

        <div class="sidebar-section">
          <div class="sidebar-section-label">System</div>

          <div class="nav-item ${this._isActive('search')}" data-page="search" id="sidebar-search">
            <span class="nav-icon">🔍</span>
            <span class="nav-label">Search</span>
            <span class="nav-badge" style="background:var(--color-bg-secondary);color:var(--color-text-muted);font-size:10px;font-family:var(--font-mono)">⌘K</span>
          </div>

          <div class="nav-item ${this._isActive('settings')}" data-page="settings">
            <span class="nav-icon">⚙️</span>
            <span class="nav-label">Settings</span>
          </div>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-user" id="sidebar-user">
          <div class="avatar avatar-md" style="background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light))">
            ${settings.userAvatar || settings.userName?.charAt(0) || 'A'}
          </div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${settings.userName || 'Ahmed'}</div>
            <div class="sidebar-user-role">${settings.userRole || 'Admin'}</div>
          </div>
        </div>
      </div>
    `;

    // Update collapsed state
    if (this._collapsed) this.el.classList.add('collapsed');
    else this.el.classList.remove('collapsed');

    // Update active badge visibility
    this._updateBadges();
  }

  _isActive(page) {
    return this.state.get('currentPage') === page ? 'active' : '';
  }

  _isActiveResp(id) {
    return this.state.get('currentResponsibility') === id &&
           this.state.get('currentPage') === 'responsibility' ? 'active' : '';
  }

  _updateBadges() {
    const inbox = this.storage.getCollection('inbox');
    const inboxCount = inbox.filter(i => !i.responsibilityId).length;
    const inboxBadge = this.el.querySelector('[data-page="inbox"] .nav-badge');
    if (inboxBadge) {
      inboxBadge.textContent = inboxCount;
      inboxBadge.style.display = inboxCount > 0 ? '' : 'none';
    }
  }

  _bindEvents() {
    this.el.addEventListener('click', (e) => {
      const navItem = e.target.closest('.nav-item');
      if (!navItem) return;

      const page = navItem.dataset.page;
      const respId = navItem.dataset.respId;

      if (!page) return;

      if (page === 'search' || navItem.id === 'sidebar-search') {
        this.app.openSearch();
        return;
      }

      if (navItem.id === 'add-responsibility-nav') {
        this.app.openNewResponsibilityModal();
        return;
      }

      if (page === 'responsibility' && respId) {
        this.router.navigate('responsibility', { responsibilityId: respId });
      } else {
        this.router.navigate(page);
      }

      // Close mobile sidebar
      if (window.innerWidth <= 1024) {
        this.closeMobile();
      }
    });

    // Toggle button
    this.el.addEventListener('click', (e) => {
      if (e.target.closest('#sidebar-toggle-btn')) {
        this.toggle();
      }
    });
  }

  _watchState() {
    this.state.watch('currentPage', () => this._updateActiveStates());
    this.state.watch('currentResponsibility', () => this._updateActiveStates());

    this.app.bus.on('responsibilities:changed', () => this._render());
    this.app.bus.on('notifications:changed', () => this._render());
    this.app.bus.on('tasks:changed', () => this._render());
  }

  _updateActiveStates() {
    const navItems = this.el.querySelectorAll('.nav-item');
    const currentPage = this.state.get('currentPage');
    const currentResp = this.state.get('currentResponsibility');

    navItems.forEach(item => {
      const page = item.dataset.page;
      const respId = item.dataset.respId;

      item.classList.remove('active');

      if (page === 'responsibility' && respId) {
        if (currentPage === 'responsibility' && currentResp === respId) {
          item.classList.add('active');
        }
      } else if (page === currentPage && page !== 'responsibility') {
        item.classList.add('active');
      }
    });
  }

  toggle() {
    this._collapsed = !this._collapsed;
    this.el.classList.toggle('collapsed', this._collapsed);

    const settings = this.storage.get('settings') || {};
    settings.sidebarCollapsed = this._collapsed;
    this.storage.set('settings', settings);

    this.app.bus.emit('sidebar:toggled', { collapsed: this._collapsed });
  }

  openMobile() {
    this._mobileOpen = true;
    this.el.classList.add('mobile-open');
    document.getElementById('sidebar-overlay')?.classList.add('visible');
  }

  closeMobile() {
    this._mobileOpen = false;
    this.el.classList.remove('mobile-open');
    document.getElementById('sidebar-overlay')?.classList.remove('visible');
  }

  refresh() {
    this._render();
    this._bindEvents();
  }
}
