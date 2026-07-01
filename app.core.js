/**
 * Ahmed Life OS - App Core
 * Router, State Management, Event Bus
 */

// === EVENT BUS ===
export class EventBus {
  constructor() {
    this._events = {};
  }

  on(event, handler) {
    if (!this._events[event]) this._events[event] = [];
    this._events[event].push(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    if (!this._events[event]) return;
    this._events[event] = this._events[event].filter(h => h !== handler);
  }

  emit(event, data) {
    if (!this._events[event]) return;
    this._events[event].forEach(h => h(data));
  }

  once(event, handler) {
    const wrapper = (data) => {
      handler(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
}

// === STATE MANAGER ===
export class StateManager {
  constructor(storage) {
    this.storage = storage;
    this.bus = new EventBus();
    this._state = this._loadState();
  }

  _loadState() {
    return {
      currentPage: 'dashboard',
      currentResponsibility: null,
      currentResponsibilityPage: 'tasks',
      sidebarCollapsed: false,
      searchOpen: false,
      activeModal: null,
      activePanel: null,
      selectedTask: null,
      viewMode: 'grid', // grid | list | kanban
      filters: {
        priority: 'all',
        status: 'all',
        search: ''
      },
      notifications: { unread: 0 },
      theme: 'light'
    };
  }

  get(key) {
    return key ? this._state[key] : this._state;
  }

  set(key, value) {
    const prev = this._state[key];
    this._state[key] = value;
    this.bus.emit(`state:${key}`, { prev, current: value });
    this.bus.emit('state:change', { key, prev, current: value });
  }

  update(updates) {
    Object.entries(updates).forEach(([k, v]) => this.set(k, v));
  }

  watch(key, handler) {
    return this.bus.on(`state:${key}`, handler);
  }
}

// === ROUTER ===
export class Router {
  constructor(state, bus) {
    this.state = state;
    this.bus = bus;
    this._routes = {};
    this._currentRoute = null;
  }

  register(path, handler) {
    this._routes[path] = handler;
  }

  navigate(path, params = {}) {
    const prev = this._currentRoute;
    this._currentRoute = path;

    this.state.set('currentPage', path);

    if (params.responsibilityId) {
      this.state.set('currentResponsibility', params.responsibilityId);
    }
    if (params.subPage) {
      this.state.set('currentResponsibilityPage', params.subPage);
    }

    this.bus.emit('route:change', { path, params, prev });

    const handler = this._routes[path];
    if (handler) handler(params);

    // Update URL without reload
    const url = params.responsibilityId
      ? `#${path}/${params.responsibilityId}/${params.subPage || 'tasks'}`
      : `#${path}`;
    window.history.pushState({ path, params }, '', url);
  }

  parseHash() {
    const hash = window.location.hash.slice(1);
    if (!hash) return { path: 'dashboard', params: {} };
    const parts = hash.split('/');
    return {
      path: parts[0] || 'dashboard',
      params: {
        responsibilityId: parts[1] || null,
        subPage: parts[2] || null
      }
    };
  }
}

// === TOAST MANAGER ===
export class ToastManager {
  constructor() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  show({ title, message, type = 'info', duration = 4000 }) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type]}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
      <button class="toast-close">✕</button>
    `;

    this.container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    const remove = () => {
      toast.classList.remove('show');
      toast.classList.add('hide');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    };

    toast.querySelector('.toast-close').addEventListener('click', remove);
    if (duration > 0) setTimeout(remove, duration);

    return { remove };
  }

  success(title, message) { return this.show({ title, message, type: 'success' }); }
  error(title, message) { return this.show({ title, message, type: 'error', duration: 6000 }); }
  warning(title, message) { return this.show({ title, message, type: 'warning' }); }
  info(title, message) { return this.show({ title, message, type: 'info' }); }
}

// === MODAL MANAGER ===
export class ModalManager {
  constructor() {
    this._stack = [];
    this._backdrop = null;
  }

  _createBackdrop() {
    if (this._backdrop) return this._backdrop;
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.closeTop();
    });
    document.body.appendChild(backdrop);
    this._backdrop = backdrop;
    requestAnimationFrame(() => backdrop.classList.add('visible'));
    return backdrop;
  }

  open({ title, content, footer, size = '', onClose }) {
    const backdrop = this._createBackdrop();

    const modal = document.createElement('div');
    modal.className = `modal ${size ? 'modal-' + size : ''}`;
    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close">✕</button>
      </div>
      <div class="modal-body">${content}</div>
      ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
    `;

    backdrop.appendChild(modal);
    this._stack.push({ modal, backdrop, onClose });

    modal.querySelector('.modal-close').addEventListener('click', () => this.closeTop());

    // Escape key
    const escHandler = (e) => {
      if (e.key === 'Escape') this.closeTop();
    };
    document.addEventListener('keydown', escHandler, { once: true });

    return {
      modal,
      close: () => this.closeTop(),
      getBody: () => modal.querySelector('.modal-body'),
      getFooter: () => modal.querySelector('.modal-footer')
    };
  }

  closeTop() {
    if (!this._stack.length) return;
    const { modal, backdrop, onClose } = this._stack.pop();
    if (onClose) onClose();
    modal.remove();
    if (!this._stack.length) {
      backdrop.classList.remove('visible');
      backdrop.addEventListener('transitionend', () => {
        if (backdrop.parentNode) backdrop.remove();
        this._backdrop = null;
      }, { once: true });
    }
  }

  closeAll() {
    while (this._stack.length) this.closeTop();
  }
}

// === CONTEXT MENU ===
export class ContextMenuManager {
  constructor() {
    this._menu = null;
    document.addEventListener('click', () => this.close());
    document.addEventListener('contextmenu', () => this.close());
  }

  show(e, items) {
    this.close();
    e.preventDefault();
    e.stopPropagation();

    const menu = document.createElement('div');
    menu.className = 'context-menu';

    items.forEach(item => {
      if (item === 'sep') {
        menu.insertAdjacentHTML('beforeend', '<div class="context-menu-sep"></div>');
        return;
      }
      const el = document.createElement('div');
      el.className = `context-menu-item ${item.danger ? 'danger' : ''}`;
      el.innerHTML = `<span>${item.icon || ''}</span><span>${item.label}</span>`;
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        item.action();
        this.close();
      });
      menu.appendChild(el);
    });

    document.body.appendChild(menu);
    this._menu = menu;

    // Position
    const rect = { x: e.clientX, y: e.clientY };
    const menuW = 200;
    const menuH = items.length * 36;
    const x = rect.x + menuW > window.innerWidth ? rect.x - menuW : rect.x;
    const y = rect.y + menuH > window.innerHeight ? rect.y - menuH : rect.y;

    menu.style.left = x + 'px';
    menu.style.top = y + 'px';

    requestAnimationFrame(() => menu.classList.add('open'));
  }

  close() {
    if (!this._menu) return;
    this._menu.remove();
    this._menu = null;
  }
}
