/**
 * Zenith Tasks — Modern To-Do & Task Management Flow
 * Pure Vanilla JavaScript with LocalStorage & Web Audio API
 */

(function () {
  'use strict';

  // Completely blank by default: start fresh from scratch
  const DEFAULT_TASKS = [];

  // --- Application State ---
  const state = {
    tasks: [],
    filter: 'all',          // 'all' | 'active' | 'completed'
    categoryFilter: 'all',  // 'all' | 'College' | 'Work' | ...
    searchQuery: '',
    sortBy: 'newest',       // 'newest' | 'oldest' | 'due-date' | 'priority-desc' | 'priority-asc' | 'alpha'
    theme: localStorage.getItem('zenith_theme') || 'dark',
    soundEnabled: localStorage.getItem('zenith_sound') !== 'false'
  };

  // --- Sound Effects Synthesizer (Zero Dependencies) ---
  class SoundEngine {
    constructor() {
      this.ctx = null;
    }

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playAdd() {
      if (!state.soundEnabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
      } catch (e) {
        // Audio error ignored
      }
    }

    playComplete() {
      if (!state.soundEnabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Two-tone cheerful chord
        const notes = [587.33, 880]; // D5, A5
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gain.gain.setValueAtTime(0.1, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.28);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.3);
        });
      } catch (e) {
        // Audio error ignored
      }
    }

    playDelete() {
      if (!state.soundEnabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.15);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
      } catch (e) {
        // Audio error ignored
      }
    }
  }

  const sound = new SoundEngine();

  // --- Confetti Particle System ---
  class ConfettiCannon {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      this.particles = [];
      this.animationId = null;
      this.colors = ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

      if (this.canvas) {
        this.resize();
        window.addEventListener('resize', () => this.resize());
      }
    }

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    fire(x = window.innerWidth / 2, y = window.innerHeight / 2) {
      if (!this.canvas || !this.ctx) return;
      const count = 55;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 8 + 3;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity - 3,
          size: Math.random() * 7 + 4,
          color: this.colors[Math.floor(Math.random() * this.colors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 12,
          opacity: 1,
          decay: Math.random() * 0.015 + 0.015
        });
      }

      if (!this.animationId) {
        this.loop();
      }
    }

    loop() {
      if (!this.ctx || !this.canvas) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22; // Gravity
        p.rotation += p.rotationSpeed;
        p.opacity -= p.decay;

        if (p.opacity <= 0 || p.y > this.canvas.height) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.globalAlpha = Math.max(p.opacity, 0);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        this.ctx.restore();
      }

      if (this.particles.length > 0) {
        this.animationId = requestAnimationFrame(() => this.loop());
      } else {
        this.animationId = null;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
  }

  const confetti = new ConfettiCannon('confetti-canvas');

  // --- DOM Elements Cache ---
  const DOM = {
    html: document.documentElement,
    greetingText: document.getElementById('greeting-text'),
    dateDisplay: document.getElementById('date-display'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    sunIcon: document.getElementById('sun-icon'),
    moonIcon: document.getElementById('moon-icon'),
    soundToggleBtn: document.getElementById('sound-toggle-btn'),
    soundIconOn: document.getElementById('sound-icon-on'),
    soundIconOff: document.getElementById('sound-icon-off'),
    infoBtn: document.getElementById('info-btn'),
    backupBtn: document.getElementById('backup-btn'),

    // Stats
    statsStatusText: document.getElementById('stats-status-text'),
    completedCount: document.getElementById('completed-count'),
    totalCount: document.getElementById('total-count'),
    progressCircleBar: document.getElementById('progress-circle-bar'),
    progressPercent: document.getElementById('progress-percent'),
    badgeAll: document.getElementById('badge-all'),
    badgePending: document.getElementById('badge-pending'),
    badgeDone: document.getElementById('badge-done'),
    badgeUrgent: document.getElementById('badge-urgent'),

    // Input form
    newTaskForm: document.getElementById('new-task-form'),
    taskTitleInput: document.getElementById('task-title-input'),
    toggleDetailsBtn: document.getElementById('toggle-details-btn'),
    taskDetailsDrawer: document.getElementById('task-details-drawer'),
    taskDescInput: document.getElementById('task-desc-input'),
    taskPrioritySelect: document.getElementById('task-priority-select'),
    taskCategorySelect: document.getElementById('task-category-select'),
    taskDueDate: document.getElementById('task-due-date'),
    taskDueTime: document.getElementById('task-due-time'),

    // Controls
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    filterTabs: document.querySelectorAll('.filter-tab'),
    categoryFilterSelect: document.getElementById('category-filter-select'),
    sortSelect: document.getElementById('sort-select'),

    // Separate Task Groups
    activeTasksGroup: document.getElementById('active-tasks-group'),
    activeTasksCount: document.getElementById('active-tasks-count'),
    activeTaskList: document.getElementById('active-task-list'),

    completedTasksGroup: document.getElementById('completed-tasks-group'),
    completedTasksCount: document.getElementById('completed-tasks-count'),
    completedTaskList: document.getElementById('completed-task-list'),
    btnClearCompleted: document.getElementById('btn-clear-completed'),

    // Empty state
    emptyState: document.getElementById('empty-state'),
    emptyStateTitle: document.getElementById('empty-state-title'),
    emptyStateDesc: document.getElementById('empty-state-desc'),
    emptyAddBtn: document.getElementById('empty-add-btn'),

    // Edit Modal
    editModalOverlay: document.getElementById('edit-modal-overlay'),
    editModalCloseBtn: document.getElementById('modal-close-btn'),
    btnCancelEdit: document.getElementById('btn-cancel-edit'),
    editTaskForm: document.getElementById('edit-task-form'),
    editTaskId: document.getElementById('edit-task-id'),
    editTitle: document.getElementById('edit-title'),
    editDesc: document.getElementById('edit-desc'),
    editPriority: document.getElementById('edit-priority'),
    editCategory: document.getElementById('edit-category'),
    editDueDate: document.getElementById('edit-due-date'),
    editDueTime: document.getElementById('edit-due-time'),

    // Deployment / Phone Info Modal
    infoModalOverlay: document.getElementById('info-modal-overlay'),
    infoModalCloseBtn: document.getElementById('info-modal-close-btn'),
    btnCloseInfo: document.getElementById('btn-close-info'),

    // Backup Modal
    backupModalOverlay: document.getElementById('backup-modal-overlay'),
    backupModalCloseBtn: document.getElementById('backup-modal-close-btn'),
    btnExportJson: document.getElementById('btn-export-json'),
    importFileInput: document.getElementById('import-file-input'),
    btnResetAll: document.getElementById('btn-reset-all'),

    // Toast
    toastContainer: document.getElementById('toast-container')
  };

  // --- Storage Manager ---
  function loadTasks() {
    try {
      const stored = localStorage.getItem('zenith_tasks_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Filter out any previous dummy sample tasks if present
        state.tasks = Array.isArray(parsed)
          ? parsed.filter(t => !t.id.startsWith('task_sample_'))
          : [];
      } else {
        state.tasks = [];
      }
      saveTasks();
    } catch (e) {
      console.error('Failed to load tasks from localStorage', e);
      state.tasks = [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem('zenith_tasks_data', JSON.stringify(state.tasks));
    } catch (e) {
      console.error('Failed to save tasks to localStorage', e);
      showToast('Error saving data. Storage might be full.', 'danger');
    }
  }

  // --- Dynamic Date & Greeting ---
  function updateHeaderTime() {
    const now = new Date();
    const hours = now.getHours();

    let greeting = 'Good evening';
    if (hours < 12) greeting = 'Good morning';
    else if (hours < 17) greeting = 'Good afternoon';

    DOM.greetingText.textContent = `${greeting}, ready for your tasks!`;

    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    DOM.dateDisplay.textContent = now.toLocaleDateString(undefined, options);
  }

  // --- Theme Manager ---
  function applyTheme(theme) {
    state.theme = theme;
    DOM.html.setAttribute('data-theme', theme);
    localStorage.setItem('zenith_theme', theme);

    if (theme === 'light') {
      DOM.sunIcon.classList.add('hidden');
      DOM.moonIcon.classList.remove('hidden');
    } else {
      DOM.sunIcon.classList.remove('hidden');
      DOM.moonIcon.classList.add('hidden');
    }
  }

  function toggleTheme() {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    showToast(`Switched to ${newTheme} mode`, 'info');
  }

  // --- Sound Manager ---
  function updateSoundUI() {
    if (state.soundEnabled) {
      DOM.soundIconOn.classList.remove('hidden');
      DOM.soundIconOff.classList.add('hidden');
      DOM.soundToggleBtn.setAttribute('title', 'Sound Feedback: ON');
    } else {
      DOM.soundIconOn.classList.add('hidden');
      DOM.soundIconOff.classList.remove('hidden');
      DOM.soundToggleBtn.setAttribute('title', 'Sound Feedback: MUTED');
    }
  }

  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    localStorage.setItem('zenith_sound', state.soundEnabled ? 'true' : 'false');
    updateSoundUI();
    showToast(state.soundEnabled ? 'Sound feedback enabled' : 'Sound muted', 'info');
    if (state.soundEnabled) sound.playAdd();
  }

  // --- Toast Notification ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'danger') {
      iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else {
      iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `${iconSvg}<span>${escapeHTML(message)}</span>`;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  // --- Formatters & Helpers ---
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDueDate(dateStr, timeStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;

    const due = new Date(parts[0], parts[1] - 1, parts[2]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

    let label = '';
    let statusClass = '';

    if (diffDays < 0) {
      label = `Overdue (${Math.abs(diffDays)}d ago)`;
      statusClass = 'overdue';
    } else if (diffDays === 0) {
      label = 'Today';
      statusClass = 'today';
    } else if (diffDays === 1) {
      label = 'Tomorrow';
      statusClass = 'soon';
    } else if (diffDays <= 7) {
      label = due.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      statusClass = 'upcoming';
    } else {
      label = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      statusClass = 'future';
    }

    if (timeStr) {
      label += ` @ ${timeStr}`;
    }

    return { label, statusClass };
  }

  // --- Stats & Productivity Calculator ---
  function updateStats() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const urgent = state.tasks.filter(t => !t.completed && t.priority === 'high').length;

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    DOM.totalCount.textContent = total;
    DOM.completedCount.textContent = completed;
    DOM.badgeAll.textContent = total;
    DOM.badgePending.textContent = pending;
    DOM.badgeDone.textContent = completed;
    DOM.badgeUrgent.textContent = urgent;

    DOM.progressPercent.textContent = `${percent}%`;

    // Circular SVG Dashoffset calculation: 2 * Math.PI * 42 ~= 263.89
    const circumference = 2 * Math.PI * 42;
    const offset = circumference - (percent / 100) * circumference;
    DOM.progressCircleBar.style.strokeDasharray = `${circumference}`;
    DOM.progressCircleBar.style.strokeDashoffset = `${offset}`;

    // Motivational copy
    if (total === 0) {
      DOM.statsStatusText.textContent = "Your list is clean and ready!";
    } else if (percent === 100) {
      DOM.statsStatusText.textContent = "All tasks completed! Great job! 🌟";
    } else if (percent >= 50) {
      DOM.statsStatusText.textContent = "Over halfway done! Keep going! 🚀";
    } else if (percent > 0) {
      DOM.statsStatusText.textContent = "Making good progress! 💪";
    } else {
      DOM.statsStatusText.textContent = "Focus on the highest priority first.";
    }

    // Toggle "Clear Completed" visibility
    if (completed > 0) {
      DOM.btnClearCompleted.classList.remove('hidden');
    } else {
      DOM.btnClearCompleted.classList.add('hidden');
    }
  }

  // --- Filtering & Sorting ---
  function filterAndSort(taskList) {
    return taskList
      .filter(task => {
        // Category filter
        if (state.categoryFilter !== 'all' && task.category !== state.categoryFilter) return false;

        // Search query
        if (state.searchQuery.trim() !== '') {
          const q = state.searchQuery.toLowerCase().trim();
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchDesc = task.description && task.description.toLowerCase().includes(q);
          const matchCat = task.category.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchCat) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Pinned tasks stay at top
        if (a.pinned !== b.pinned) {
          return a.pinned ? -1 : 1;
        }

        switch (state.sortBy) {
          case 'oldest':
            return new Date(a.createdAt) - new Date(b.createdAt);
          case 'due-date':
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate);
          case 'priority-desc': {
            const weights = { high: 3, medium: 2, low: 1 };
            return weights[b.priority] - weights[a.priority];
          }
          case 'priority-asc': {
            const weights = { high: 3, medium: 2, low: 1 };
            return weights[a.priority] - weights[b.priority];
          }
          case 'alpha':
            return a.title.localeCompare(b.title);
          case 'newest':
          default:
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
      });
  }

  // --- Rendering UI with Distinct Separate Sections ---
  function render() {
    updateStats();

    const allActive = state.tasks.filter(t => !t.completed);
    const allCompleted = state.tasks.filter(t => t.completed);

    const filteredActive = filterAndSort(allActive);
    const filteredCompleted = filterAndSort(allCompleted);

    // Update section count badges
    DOM.activeTasksCount.textContent = filteredActive.length;
    DOM.completedTasksCount.textContent = filteredCompleted.length;

    // Clear lists
    DOM.activeTaskList.innerHTML = '';
    DOM.completedTaskList.innerHTML = '';

    // Determine which sections to show based on selected filter tab
    const showActiveSection = (state.filter === 'all' || state.filter === 'active');
    const showCompletedSection = (state.filter === 'all' || state.filter === 'completed');

    // Populate Active Tasks
    if (showActiveSection) {
      DOM.activeTasksGroup.classList.remove('hidden');
      filteredActive.forEach(task => {
        DOM.activeTaskList.appendChild(createTaskElement(task));
      });
    } else {
      DOM.activeTasksGroup.classList.add('hidden');
    }

    // Populate Completed Tasks
    if (showCompletedSection) {
      DOM.completedTasksGroup.classList.remove('hidden');
      filteredCompleted.forEach(task => {
        DOM.completedTaskList.appendChild(createTaskElement(task));
      });
    } else {
      DOM.completedTasksGroup.classList.add('hidden');
    }

    // Handle Empty States
    let totalVisible = 0;
    if (showActiveSection) totalVisible += filteredActive.length;
    if (showCompletedSection) totalVisible += filteredCompleted.length;

    if (totalVisible === 0) {
      DOM.emptyState.classList.remove('hidden');

      if (state.searchQuery) {
        DOM.emptyStateTitle.textContent = 'No matching tasks';
        DOM.emptyStateDesc.textContent = `No tasks match "${state.searchQuery}". Try a different keyword.`;
        DOM.emptyAddBtn.classList.add('hidden');
      } else if (state.filter === 'completed') {
        DOM.emptyStateTitle.textContent = 'No completed tasks';
        DOM.emptyStateDesc.textContent = 'When you finish tasks, they will appear in this section.';
        DOM.emptyAddBtn.classList.add('hidden');
      } else if (state.filter === 'active') {
        DOM.emptyStateTitle.textContent = 'No active tasks';
        DOM.emptyStateDesc.textContent = 'All tasks are completed or none have been added yet.';
        DOM.emptyAddBtn.classList.remove('hidden');
      } else {
        DOM.emptyStateTitle.textContent = 'Your task list is empty';
        DOM.emptyStateDesc.textContent = 'Add your first task in the box above to get started!';
        DOM.emptyAddBtn.classList.remove('hidden');
      }
    } else {
      DOM.emptyState.classList.add('hidden');
    }
  }

  function createTaskElement(task) {
    const card = document.createElement('div');
    card.className = `task-item ${task.completed ? 'completed' : ''}`;
    card.dataset.id = task.id;
    card.dataset.priority = task.priority;

    // Due date display
    const dueInfo = formatDueDate(task.dueDate, task.dueTime);
    let dueBadgeHtml = '';
    if (dueInfo) {
      dueBadgeHtml = `
        <span class="due-pill ${dueInfo.statusClass}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          ${dueInfo.label}
        </span>
      `;
    }

    const categoryIcons = {
      College: '🎓',
      Work: '💼',
      Personal: '🌟',
      Health: '💪',
      Finance: '💰',
      Other: '📌'
    };
    const catIcon = categoryIcons[task.category] || '📌';

    card.innerHTML = `
      <label class="task-checkbox-wrap" title="${task.completed ? 'Mark as active' : 'Mark as completed'}">
        <input type="checkbox" ${task.completed ? 'checked' : ''} data-action="toggle">
        <div class="custom-checkbox">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </label>

      <div class="task-body">
        <div class="task-title">${escapeHTML(task.title)}</div>
        ${task.description ? `<div class="task-notes">${escapeHTML(task.description)}</div>` : ''}
        
        <div class="task-meta">
          <span class="category-pill ${task.category}">
            <span>${catIcon}</span> ${task.category}
          </span>
          <span class="priority-pill ${task.priority}">
            ${task.priority === 'high' ? '🔥 High' : task.priority === 'medium' ? '⚡ Medium' : '🌱 Low'}
          </span>
          ${dueBadgeHtml}
        </div>
      </div>

      <div class="task-actions">
        <button class="task-action-btn pin ${task.pinned ? 'pinned' : ''}" data-action="pin" title="${task.pinned ? 'Unpin task' : 'Pin to top'}">
          <svg viewBox="0 0 24 24" fill="${task.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M12 17v5"></path>
            <path d="M9 2h6l-1 7h4l-7 8v-4l-5-4h4z"></path>
          </svg>
        </button>
        <button class="task-action-btn edit" data-action="edit" title="Edit Task">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="task-action-btn delete" data-action="delete" title="Delete Task">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    return card;
  }

  // --- Task Operations ---
  function addTask(title, desc = '', priority = 'medium', category = 'College', dueDate = '', dueTime = '') {
    if (!title || !title.trim()) return;

    const newTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: title.trim(),
      description: desc.trim(),
      completed: false,
      priority: priority,
      category: category,
      dueDate: dueDate || '',
      dueTime: dueTime || '',
      createdAt: new Date().toISOString(),
      completedAt: null,
      pinned: false
    };

    state.tasks.unshift(newTask);
    saveTasks();
    render();
    sound.playAdd();
    showToast('Task created!', 'success');
  }

  function toggleTaskCompletion(taskId, clickEvent) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;
    saveTasks();
    render();

    if (task.completed) {
      sound.playComplete();
      const x = clickEvent ? clickEvent.clientX : window.innerWidth / 2;
      const y = clickEvent ? clickEvent.clientY : window.innerHeight / 2;
      confetti.fire(x, y);
      showToast('Marked as done! 🎉', 'success');
    } else {
      showToast('Moved back to active', 'info');
    }
  }

  function togglePin(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.pinned = !task.pinned;
    saveTasks();
    render();
    showToast(task.pinned ? 'Task pinned to top 📌' : 'Task unpinned', 'info');
  }

  function deleteTask(taskId) {
    const taskIdx = state.tasks.findIndex(t => t.id === taskId);
    if (taskIdx === -1) return;

    const taskTitle = state.tasks[taskIdx].title;
    state.tasks.splice(taskIdx, 1);
    saveTasks();
    render();
    sound.playDelete();
    showToast(`Deleted task: "${taskTitle.substring(0, 20)}..."`, 'info');
  }

  function clearCompletedTasks() {
    const completedCount = state.tasks.filter(t => t.completed).length;
    if (completedCount === 0) return;

    if (!confirm(`Are you sure you want to remove all ${completedCount} completed task${completedCount > 1 ? 's' : ''}?`)) {
      return;
    }

    state.tasks = state.tasks.filter(t => !t.completed);
    saveTasks();
    render();
    sound.playDelete();
    showToast(`Cleared ${completedCount} completed task${completedCount > 1 ? 's' : ''}`, 'info');
  }

  // --- Edit Modal Handlers ---
  function openEditModal(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    DOM.editTaskId.value = task.id;
    DOM.editTitle.value = task.title;
    DOM.editDesc.value = task.description || '';
    DOM.editPriority.value = task.priority;
    DOM.editCategory.value = task.category;
    DOM.editDueDate.value = task.dueDate || '';
    DOM.editDueTime.value = task.dueTime || '';

    DOM.editModalOverlay.classList.remove('hidden');
    DOM.editTitle.focus();
  }

  function closeEditModal() {
    DOM.editModalOverlay.classList.add('hidden');
    DOM.editTaskForm.reset();
  }

  function saveEditedTask(e) {
    e.preventDefault();
    const taskId = DOM.editTaskId.value;
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const newTitle = DOM.editTitle.value.trim();
    if (!newTitle) return;

    task.title = newTitle;
    task.description = DOM.editDesc.value.trim();
    task.priority = DOM.editPriority.value;
    task.category = DOM.editCategory.value;
    task.dueDate = DOM.editDueDate.value;
    task.dueTime = DOM.editDueTime.value;

    saveTasks();
    closeEditModal();
    render();
    showToast('Task updated successfully!', 'success');
  }

  // --- Deployment / Info Modal Handlers ---
  function openInfoModal() {
    DOM.infoModalOverlay.classList.remove('hidden');
  }

  function closeInfoModal() {
    DOM.infoModalOverlay.classList.add('hidden');
  }

  // --- Backup & Restore Handlers ---
  function openBackupModal() {
    DOM.backupModalOverlay.classList.remove('hidden');
  }

  function closeBackupModal() {
    DOM.backupModalOverlay.classList.add('hidden');
  }

  function exportTasksJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.tasks, null, 2));
    const dlAnchorElem = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `zenith_tasks_${today}.json`);
    dlAnchorElem.click();
    dlAnchorElem.remove();
    showToast('Tasks backup downloaded!', 'success');
  }

  function importTasksJson(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          state.tasks = imported;
          saveTasks();
          render();
          closeBackupModal();
          showToast(`Imported ${imported.length} tasks!`, 'success');
        } else {
          showToast('Invalid backup file format.', 'danger');
        }
      } catch (err) {
        showToast('Error parsing JSON backup file.', 'danger');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  }

  function wipeAllData() {
    if (confirm('Permanently delete all tasks? This cannot be undone.')) {
      state.tasks = [];
      saveTasks();
      render();
      closeBackupModal();
      showToast('All tasks cleared.', 'info');
    }
  }

  // --- Event Listeners Setup ---
  function initEventListeners() {
    // Header actions
    DOM.themeToggleBtn.addEventListener('click', toggleTheme);
    DOM.soundToggleBtn.addEventListener('click', toggleSound);
    DOM.infoBtn.addEventListener('click', openInfoModal);
    DOM.backupBtn.addEventListener('click', openBackupModal);

    // Expandable Details Drawer Toggle
    DOM.toggleDetailsBtn.addEventListener('click', () => {
      DOM.taskDetailsDrawer.classList.toggle('collapsed');
      DOM.toggleDetailsBtn.classList.toggle('active');
    });

    // Add Task Form Submit
    DOM.newTaskForm.addEventListener('submit', e => {
      e.preventDefault();
      const title = DOM.taskTitleInput.value;
      const desc = DOM.taskDescInput.value;
      const priority = DOM.taskPrioritySelect.value;
      const category = DOM.taskCategorySelect.value;
      const dueDate = DOM.taskDueDate.value;
      const dueTime = DOM.taskDueTime.value;

      addTask(title, desc, priority, category, dueDate, dueTime);

      DOM.taskTitleInput.value = '';
      DOM.taskDescInput.value = '';
      DOM.taskDetailsDrawer.classList.add('collapsed');
      DOM.toggleDetailsBtn.classList.remove('active');
      DOM.taskTitleInput.focus();
    });

    // Empty state "Add your first task" button
    DOM.emptyAddBtn.addEventListener('click', () => {
      DOM.taskTitleInput.focus();
      DOM.taskTitleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Event delegation on task containers (for both Active and Completed task lists)
    [DOM.activeTaskList, DOM.completedTaskList].forEach(listEl => {
      listEl.addEventListener('click', e => {
        const card = e.target.closest('.task-item');
        if (!card) return;
        const taskId = card.dataset.id;

        const actionBtn = e.target.closest('[data-action]');
        if (!actionBtn) return;

        const action = actionBtn.dataset.action;
        if (action === 'toggle') {
          toggleTaskCompletion(taskId, e);
        } else if (action === 'pin') {
          togglePin(taskId);
        } else if (action === 'edit') {
          openEditModal(taskId);
        } else if (action === 'delete') {
          deleteTask(taskId);
        }
      });
    });

    // Clear completed tasks
    DOM.btnClearCompleted.addEventListener('click', clearCompletedTasks);

    // Filter tabs
    DOM.filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        DOM.filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.filter = tab.dataset.tab;
        render();
      });
    });

    // Metric pills click to filter
    document.querySelectorAll('.metric-pill[data-tab-target]').forEach(pill => {
      pill.addEventListener('click', () => {
        const targetTab = pill.dataset.tabTarget;
        state.filter = targetTab;
        DOM.filterTabs.forEach(t => {
          t.classList.toggle('active', t.dataset.tab === targetTab);
        });
        render();
      });
    });

    // Category filter dropdown
    DOM.categoryFilterSelect.addEventListener('change', e => {
      state.categoryFilter = e.target.value;
      render();
    });

    // Sort dropdown
    DOM.sortSelect.addEventListener('change', e => {
      state.sortBy = e.target.value;
      render();
    });

    // Search input
    DOM.searchInput.addEventListener('input', e => {
      state.searchQuery = e.target.value;
      if (state.searchQuery) {
        DOM.clearSearchBtn.classList.remove('hidden');
      } else {
        DOM.clearSearchBtn.classList.add('hidden');
      }
      render();
    });

    DOM.clearSearchBtn.addEventListener('click', () => {
      DOM.searchInput.value = '';
      state.searchQuery = '';
      DOM.clearSearchBtn.classList.add('hidden');
      DOM.searchInput.focus();
      render();
    });

    // Edit modal
    DOM.editTaskForm.addEventListener('submit', saveEditedTask);
    DOM.editModalCloseBtn.addEventListener('click', closeEditModal);
    DOM.btnCancelEdit.addEventListener('click', closeEditModal);
    DOM.editModalOverlay.addEventListener('click', e => {
      if (e.target === DOM.editModalOverlay) closeEditModal();
    });

    // Info modal
    DOM.infoModalCloseBtn.addEventListener('click', closeInfoModal);
    DOM.btnCloseInfo.addEventListener('click', closeInfoModal);
    DOM.infoModalOverlay.addEventListener('click', e => {
      if (e.target === DOM.infoModalOverlay) closeInfoModal();
    });

    // Backup modal
    DOM.backupModalCloseBtn.addEventListener('click', closeBackupModal);
    DOM.backupModalOverlay.addEventListener('click', e => {
      if (e.target === DOM.backupModalOverlay) closeBackupModal();
    });
    DOM.btnExportJson.addEventListener('click', exportTasksJson);
    DOM.importFileInput.addEventListener('change', importTasksJson);
    DOM.btnResetAll.addEventListener('click', wipeAllData);

    // PWA Install Prompt Listener
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredPrompt = e;
      const banner = document.getElementById('pwa-install-banner');
      if (banner) banner.classList.remove('hidden');
    });

    const pwaInstallAction = document.getElementById('pwa-install-action');
    if (pwaInstallAction) {
      pwaInstallAction.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') {
            showToast('App installed successfully! 🎉', 'success');
          }
          deferredPrompt = null;
          const banner = document.getElementById('pwa-install-banner');
          if (banner) banner.classList.add('hidden');
        }
      });
    }

    // Global Keyboard shortcuts
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (!DOM.editModalOverlay.classList.contains('hidden')) closeEditModal();
        if (!DOM.infoModalOverlay.classList.contains('hidden')) closeInfoModal();
        if (!DOM.backupModalOverlay.classList.contains('hidden')) closeBackupModal();
      }

      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        DOM.searchInput.focus();
      }
    });
  }

  // --- App Initialization ---
  function init() {
    updateHeaderTime();
    setInterval(updateHeaderTime, 60000);

    applyTheme(state.theme);
    updateSoundUI();
    loadTasks();
    initEventListeners();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
