/**
 * Ahmed Life OS - Utility Functions
 */

// === DATE UTILITIES ===

export const DateUtils = {
  /** Format date to display string */
  format(dateStr, fmt = 'MMM D, YYYY') {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return '';

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const fullMonths = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

    return fmt
      .replace('MMMM', fullMonths[d.getMonth()])
      .replace('MMM', months[d.getMonth()])
      .replace('MM', String(d.getMonth() + 1).padStart(2, '0'))
      .replace('DD', String(d.getDate()).padStart(2, '0'))
      .replace('YYYY', d.getFullYear())
      .replace('dddd', days[d.getDay()])
      .replace('D', d.getDate());
  },

  /** Format relative time */
  relative(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const absDiff = Math.abs(diff);
    const future = diff < 0;

    if (absDiff < 60000) return future ? 'in a moment' : 'just now';
    if (absDiff < 3600000) {
      const m = Math.floor(absDiff / 60000);
      return future ? `in ${m}m` : `${m}m ago`;
    }
    if (absDiff < 86400000) {
      const h = Math.floor(absDiff / 3600000);
      return future ? `in ${h}h` : `${h}h ago`;
    }
    if (absDiff < 604800000) {
      const days = Math.floor(absDiff / 86400000);
      if (days === 1) return future ? 'tomorrow' : 'yesterday';
      return future ? `in ${days} days` : `${days} days ago`;
    }
    return DateUtils.format(dateStr, 'MMM D');
  },

  /** Check if date is today */
  isToday(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.getDate() === now.getDate() &&
           d.getMonth() === now.getMonth() &&
           d.getFullYear() === now.getFullYear();
  },

  /** Check if date is overdue */
  isOverdue(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return d < now;
  },

  /** Check if date is this week */
  isThisWeek(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    return d >= startOfWeek && d < endOfWeek;
  },

  /** Get days in month */
  getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  },

  /** Get first day of month (0=Sun) */
  getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
  },

  /** Format time HH:MM */
  formatTime(date) {
    const d = date instanceof Date ? date : new Date();
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  },

  /** Get current date in YYYY-MM-DD format */
  today() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  },

  /** Get date key for habit completions */
  dateKey(dateStr) {
    const d = dateStr ? new Date(dateStr) : new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
};

// === NUMBER UTILITIES ===

export const NumberUtils = {
  /** Format currency */
  currency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  },

  /** Format with thousands separator */
  format(n) {
    return new Intl.NumberFormat().format(n);
  },

  /** Clamp number */
  clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  },

  /** Percentage */
  percent(value, total) {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  },

  /** Format minutes to H:MM */
  formatMinutes(minutes) {
    if (!minutes) return '0m';
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
};

// === STRING UTILITIES ===

export const StringUtils = {
  /** Truncate text */
  truncate(str, length = 60) {
    if (!str) return '';
    return str.length > length ? str.substring(0, length) + '…' : str;
  },

  /** Capitalize first letter */
  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /** Convert to slug */
  slug(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  },

  /** Get initials from name */
  initials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  },

  /** Strip HTML */
  stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || '';
  },

  /** Highlight search matches */
  highlight(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(escaped, 'gi'), m => `<mark>${m}</mark>`);
  }
};

// === COLOR UTILITIES ===

export const ColorUtils = {
  RESPONSIBILITY_COLORS: [
    { color: '#3b82f6', bg: '#eff6ff', name: 'Blue' },
    { color: '#8b5cf6', bg: '#f5f3ff', name: 'Purple' },
    { color: '#ec4899', bg: '#fdf2f8', name: 'Pink' },
    { color: '#ef4444', bg: '#fef2f2', name: 'Red' },
    { color: '#f97316', bg: '#fff7ed', name: 'Orange' },
    { color: '#f59e0b', bg: '#fffbeb', name: 'Yellow' },
    { color: '#22c55e', bg: '#f0fdf4', name: 'Green' },
    { color: '#0d9488', bg: '#f0fdfa', name: 'Teal' },
    { color: '#06b6d4', bg: '#ecfeff', name: 'Cyan' },
    { color: '#6366f1', bg: '#eef2ff', name: 'Indigo' },
    { color: '#64748b', bg: '#f8fafc', name: 'Gray' },
    { color: '#0f172a', bg: '#f1f5f9', name: 'Dark' },
  ],

  /** Hex to rgba */
  hexToRgba(hex, alpha = 1) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(0,0,0,${alpha})`;
    return `rgba(${parseInt(result[1],16)},${parseInt(result[2],16)},${parseInt(result[3],16)},${alpha})`;
  },

  /** Get contrasting text color */
  getContrastColor(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '#000000';
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }
};

// === DOM UTILITIES ===

export const DomUtils = {
  /** Create element with attributes */
  createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
      else el.setAttribute(k, v);
    });
    children.forEach(child => {
      if (typeof child === 'string') el.insertAdjacentHTML('beforeend', child);
      else if (child) el.appendChild(child);
    });
    return el;
  },

  /** Query with error safety */
  qs(selector, context = document) {
    return context.querySelector(selector);
  },

  /** Query all */
  qsa(selector, context = document) {
    return [...context.querySelectorAll(selector)];
  },

  /** Toggle class */
  toggleClass(el, cls, force) {
    if (!el) return;
    el.classList.toggle(cls, force);
  },

  /** Animate then remove */
  animateOut(el, animClass, callback) {
    el.classList.add(animClass);
    el.addEventListener('animationend', () => {
      el.remove();
      if (callback) callback();
    }, { once: true });
  },

  /** Closest with selector */
  closest(el, selector) {
    return el.closest(selector);
  },

  /** Empty element */
  empty(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  },

  /** Set styles */
  css(el, styles) {
    Object.assign(el.style, styles);
  }
};

// === VALIDATION UTILITIES ===

export const ValidationUtils = {
  required(value) {
    return value !== null && value !== undefined && String(value).trim() !== '';
  },
  minLength(value, min) {
    return String(value).trim().length >= min;
  },
  maxLength(value, max) {
    return String(value).trim().length <= max;
  },
  isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
};

// === PRIORITY CONFIG ===

export const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', color: '#ef4444', bg: '#fee2e2', icon: '🔴' },
  high: { label: 'High', color: '#f97316', bg: '#fff7ed', icon: '🟠' },
  medium: { label: 'Medium', color: '#eab308', bg: '#fefce8', icon: '🟡' },
  low: { label: 'Low', color: '#22c55e', bg: '#f0fdf4', icon: '🟢' }
};

export const STATUS_CONFIG = {
  todo: { label: 'To Do', color: '#64748b', bg: '#f8fafc', icon: '⭕' },
  in_progress: { label: 'In Progress', color: '#3b82f6', bg: '#eff6ff', icon: '🔵' },
  review: { label: 'In Review', color: '#f59e0b', bg: '#fffbeb', icon: '🟡' },
  done: { label: 'Done', color: '#22c55e', bg: '#f0fdf4', icon: '✅' },
  cancelled: { label: 'Cancelled', color: '#ef4444', bg: '#fef2f2', icon: '❌' }
};

// === ICONS ===

export const RESPONSIBILITY_ICONS = [
  '💼','🏋️','📚','💰','🏠','🚗','👨‍👩‍👦','🌱','🎯','💡','🎨','🎵',
  '🏥','✈️','🍔','💻','📱','🎮','📷','🌍','⚽','🎭','🔬','📊',
  '🛒','🏗️','🌿','🧘','📝','🎓','🚀','💎','🔧','🎬','📰','🏆'
];

export const MOOD_OPTIONS = [
  { emoji: '😄', label: 'Great', score: 5 },
  { emoji: '😊', label: 'Good', score: 4 },
  { emoji: '😐', label: 'Okay', score: 3 },
  { emoji: '😔', label: 'Bad', score: 2 },
  { emoji: '😢', label: 'Awful', score: 1 }
];
