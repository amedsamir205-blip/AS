/**
 * Ahmed Life OS - Storage Service
 * Abstraction layer over localStorage.
 * Designed so it can be replaced with Firebase/Supabase later.
 */

const DB_PREFIX = 'ahmed_life_os_';
const DB_VERSION = '1.0.0';

class StorageService {
  constructor() {
    this.prefix = DB_PREFIX;
    this._initializeDB();
  }

  /** Initialize database with default structure */
  _initializeDB() {
    if (!this.get('initialized')) {
      this._seedDefaultData();
      this.set('initialized', true);
      this.set('db_version', DB_VERSION);
    }
  }

  /** Seed initial demo data */
  _seedDefaultData() {
    const now = new Date().toISOString();
    const today = new Date();

    // Default responsibilities
    const responsibilities = [
      {
        id: this._uuid(),
        name: 'Work & Career',
        icon: '💼',
        color: '#3b82f6',
        colorBg: '#eff6ff',
        description: 'Professional projects and career growth',
        isArchived: false,
        createdAt: now,
        updatedAt: now,
        sections: [],
        settings: {}
      },
      {
        id: this._uuid(),
        name: 'Health & Fitness',
        icon: '🏋️',
        color: '#22c55e',
        colorBg: '#f0fdf4',
        description: 'Gym, nutrition and wellbeing',
        isArchived: false,
        createdAt: now,
        updatedAt: now,
        sections: [],
        settings: {}
      },
      {
        id: this._uuid(),
        name: 'Learning',
        icon: '📚',
        color: '#8b5cf6',
        colorBg: '#f5f3ff',
        description: 'Courses, books and skill development',
        isArchived: false,
        createdAt: now,
        updatedAt: now,
        sections: [],
        settings: {}
      },
      {
        id: this._uuid(),
        name: 'Finance',
        icon: '💰',
        color: '#f59e0b',
        colorBg: '#fffbeb',
        description: 'Budget, investments and expenses',
        isArchived: false,
        createdAt: now,
        updatedAt: now,
        sections: [],
        settings: {}
      }
    ];

    this.set('responsibilities', responsibilities);

    // Default tasks
    const respIds = responsibilities.map(r => r.id);
    const tasks = [
      {
        id: this._uuid(),
        responsibilityId: respIds[0],
        title: 'Review Q4 performance report',
        description: '',
        priority: 'high',
        status: 'todo',
        dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString(),
        startDate: now,
        reminder: null,
        tags: ['report', 'q4'],
        checklist: [],
        files: [],
        comments: [],
        isRecurring: false,
        estimatedTime: 90,
        spentTime: 0,
        createdAt: now,
        updatedAt: now
      },
      {
        id: this._uuid(),
        responsibilityId: respIds[0],
        title: 'Team meeting preparation',
        description: 'Prepare slides for the weekly team sync',
        priority: 'medium',
        status: 'in_progress',
        dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString(),
        startDate: now,
        reminder: null,
        tags: ['meeting'],
        checklist: [
          { id: this._uuid(), text: 'Create agenda', done: true },
          { id: this._uuid(), text: 'Prepare slides', done: false },
          { id: this._uuid(), text: 'Send invites', done: false }
        ],
        files: [],
        comments: [],
        isRecurring: false,
        estimatedTime: 60,
        spentTime: 30,
        createdAt: now,
        updatedAt: now
      },
      {
        id: this._uuid(),
        responsibilityId: respIds[1],
        title: 'Morning workout - Chest & Back',
        description: '3 sets × 12 reps for each exercise',
        priority: 'medium',
        status: 'todo',
        dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString(),
        startDate: now,
        reminder: '07:00',
        tags: ['gym', 'morning'],
        checklist: [
          { id: this._uuid(), text: 'Bench press', done: false },
          { id: this._uuid(), text: 'Pull-ups', done: false },
          { id: this._uuid(), text: 'Cable rows', done: false }
        ],
        files: [],
        comments: [],
        isRecurring: true,
        estimatedTime: 75,
        spentTime: 0,
        createdAt: now,
        updatedAt: now
      },
      {
        id: this._uuid(),
        responsibilityId: respIds[2],
        title: 'Complete JavaScript module 5',
        description: 'Async/await and Promises deep dive',
        priority: 'medium',
        status: 'todo',
        dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3).toISOString(),
        startDate: now,
        reminder: null,
        tags: ['javascript', 'course'],
        checklist: [],
        files: [],
        comments: [],
        isRecurring: false,
        estimatedTime: 120,
        spentTime: 0,
        createdAt: now,
        updatedAt: now
      },
      {
        id: this._uuid(),
        responsibilityId: respIds[3],
        title: 'Review monthly budget',
        description: 'Track expenses vs. planned budget',
        priority: 'high',
        status: 'todo',
        dueDate: new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString(),
        startDate: now,
        reminder: null,
        tags: ['finance', 'monthly'],
        checklist: [],
        files: [],
        comments: [],
        isRecurring: true,
        estimatedTime: 45,
        spentTime: 0,
        createdAt: now,
        updatedAt: now
      }
    ];

    this.set('tasks', tasks);

    // Default habits
    const habits = [
      { id: this._uuid(), name: 'Morning run', icon: '🏃', color: '#22c55e', frequency: 'daily', targetDays: [0,1,2,3,4,5,6], completions: {}, streak: 0, createdAt: now },
      { id: this._uuid(), name: 'Read 30 min', icon: '📖', color: '#8b5cf6', frequency: 'daily', targetDays: [0,1,2,3,4,5,6], completions: {}, streak: 3, createdAt: now },
      { id: this._uuid(), name: 'Drink water 2L', icon: '💧', color: '#3b82f6', frequency: 'daily', targetDays: [0,1,2,3,4,5,6], completions: {}, streak: 7, createdAt: now },
      { id: this._uuid(), name: 'Meditation', icon: '🧘', color: '#f59e0b', frequency: 'daily', targetDays: [0,1,2,3,4,5,6], completions: {}, streak: 1, createdAt: now },
      { id: this._uuid(), name: 'No social media', icon: '📵', color: '#ef4444', frequency: 'daily', targetDays: [1,2,3,4,5], completions: {}, streak: 0, createdAt: now }
    ];

    this.set('habits', habits);

    // Default notes
    const notes = [
      {
        id: this._uuid(),
        title: 'Project Ideas',
        content: '<h3>Ideas for 2024</h3><p>Brainstorming session notes from today...</p><ul><li>Mobile app for habit tracking</li><li>Personal finance dashboard</li><li>Learning platform</li></ul>',
        tags: ['ideas', 'projects'],
        responsibilityId: null,
        isPinned: true,
        color: null,
        createdAt: now,
        updatedAt: now
      }
    ];

    this.set('notes', notes);

    // Default finance records
    const finance = {
      transactions: [
        { id: this._uuid(), type: 'income', amount: 5000, category: 'Salary', description: 'Monthly salary', date: now, recurring: true },
        { id: this._uuid(), type: 'expense', amount: 1200, category: 'Rent', description: 'Monthly rent', date: now, recurring: true },
        { id: this._uuid(), type: 'expense', amount: 150, category: 'Subscriptions', description: 'Netflix, Spotify, etc.', date: now, recurring: true },
        { id: this._uuid(), type: 'expense', amount: 350, category: 'Food', description: 'Groceries', date: now, recurring: false }
      ],
      budgets: [],
      goals: [],
      currency: 'USD'
    };

    this.set('finance', finance);

    // Default journal entries
    const journal = [
      {
        id: this._uuid(),
        content: 'Today was a productive day. Managed to finish the main features of the new project and had a great team meeting.',
        mood: '😊',
        moodScore: 4,
        date: now,
        tags: ['productive', 'work'],
        images: []
      }
    ];

    this.set('journal', journal);

    // Default inbox
    this.set('inbox', []);

    // Default goals
    this.set('goals', []);

    // Default events
    this.set('events', []);

    // Default notifications
    this.set('notifications', [
      { id: this._uuid(), type: 'reminder', title: 'Task due soon', body: 'Team meeting preparation is due today', isRead: false, createdAt: now, link: '/tasks' },
      { id: this._uuid(), type: 'info', title: 'Welcome to Ahmed Life OS', body: 'Your personal life operating system is ready.', isRead: false, createdAt: now, link: '/dashboard' }
    ]);

    // Settings
    this.set('settings', {
      theme: 'light',
      language: 'en',
      sidebarCollapsed: false,
      primaryColor: '#0d9488',
      userName: 'Ahmed',
      userRole: 'System Admin',
      userAvatar: null,
      weekStartsOn: 1,
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      notifications: {
        desktop: true,
        sound: false,
        dailyDigest: true
      }
    });
  }

  /** Generate UUID v4 */
  _uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  /** Get value from storage */
  get(key) {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('[Storage] get error:', e);
      return null;
    }
  }

  /** Set value in storage */
  set(key, value) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('[Storage] set error:', e);
      return false;
    }
  }

  /** Delete a key */
  delete(key) {
    localStorage.removeItem(this.prefix + key);
  }

  /** Clear all app data */
  clearAll() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(this.prefix))
      .forEach(k => localStorage.removeItem(k));
  }

  /** Export all data */
  exportAll() {
    const data = {};
    Object.keys(localStorage)
      .filter(k => k.startsWith(this.prefix))
      .forEach(k => {
        const cleanKey = k.replace(this.prefix, '');
        data[cleanKey] = this.get(cleanKey);
      });
    return data;
  }

  /** Import data from backup */
  importAll(data) {
    Object.entries(data).forEach(([key, value]) => {
      this.set(key, value);
    });
  }

  // ============================
  // COLLECTION HELPERS
  // ============================

  /** Get all items from a collection */
  getCollection(name) {
    return this.get(name) || [];
  }

  /** Save entire collection */
  saveCollection(name, items) {
    return this.set(name, items);
  }

  /** Add item to collection */
  addToCollection(name, item) {
    const items = this.getCollection(name);
    const newItem = { id: this._uuid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...item };
    items.push(newItem);
    this.saveCollection(name, items);
    return newItem;
  }

  /** Update item in collection */
  updateInCollection(name, id, updates) {
    const items = this.getCollection(name);
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveCollection(name, items);
    return items[idx];
  }

  /** Delete item from collection */
  deleteFromCollection(name, id) {
    const items = this.getCollection(name);
    const filtered = items.filter(i => i.id !== id);
    this.saveCollection(name, filtered);
    return true;
  }

  /** Find item in collection */
  findInCollection(name, predicate) {
    return this.getCollection(name).find(predicate) || null;
  }

  /** Filter collection */
  filterCollection(name, predicate) {
    return this.getCollection(name).filter(predicate);
  }

  /** Generate unique ID (public) */
  generateId() {
    return this._uuid();
  }
}

window.StorageService = StorageService;
export default StorageService;
