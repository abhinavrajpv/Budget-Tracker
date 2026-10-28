/**
 * VaultBudget — 100% Private, Zero-Knowledge Budget Tracker
 * Fully Client-Side, Offline-First, PWA Enabled
 */

(function () {
  'use strict';

  // ==========================================================================
  // Default Configuration & Preset Categories
  // ==========================================================================
  const STORAGE_KEY = 'vaultbudget_data_v1';
  const PIN_KEY = 'vaultbudget_security_pin_v1';

  const DEFAULT_CATEGORIES = [
    // Expense Categories
    { id: 'cat-food', name: 'Food & Dining', type: 'expense', icon: '🍔', color: '#f97316', limit: 6000 },
    { id: 'cat-groceries', name: 'Groceries', type: 'expense', icon: '🛒', color: '#10b981', limit: 4000 },
    { id: 'cat-housing', name: 'Housing & Rent', type: 'expense', icon: '🏠', color: '#6366f1', limit: 12000 },
    { id: 'cat-transport', name: 'Transport & Fuel', type: 'expense', icon: '🚗', color: '#06b6d4', limit: 3000 },
    { id: 'cat-shopping', name: 'Shopping & Clothes', type: 'expense', icon: '🛍️', color: '#ec4899', limit: 2500 },
    { id: 'cat-entertainment', name: 'Entertainment', type: 'expense', icon: '🎬', color: '#8b5cf6', limit: 1500 },
    { id: 'cat-utilities', name: 'Bills & Utilities', type: 'expense', icon: '💡', color: '#eab308', limit: 2000 },
    { id: 'cat-health', name: 'Healthcare & Meds', type: 'expense', icon: '💊', color: '#14b8a6', limit: 2000 },
    { id: 'cat-other-exp', name: 'Other Expenses', type: 'expense', icon: '📦', color: '#64748b', limit: null },

    // Income Categories
    { id: 'cat-salary', name: 'Salary / Paycheck', type: 'income', icon: '💼', color: '#10b981', limit: null },
    { id: 'cat-freelance', name: 'Freelance & Projects', type: 'income', icon: '💻', color: '#3b82f6', limit: null },
    { id: 'cat-investments', name: 'Investments & Returns', type: 'income', icon: '📈', color: '#8b5cf6', limit: null },
    { id: 'cat-allowance', name: 'Allowance & Gifts', type: 'income', icon: '🎁', color: '#f43f5e', limit: null },
    { id: 'cat-other-inc', name: 'Other Income', type: 'income', icon: '💵', color: '#06b6d4', limit: null }
  ];

  // Application State
  let state = {
    currency: { symbol: '₹', code: 'INR' },
    transactions: [],
    categories: [...DEFAULT_CATEGORIES],
    currentFilter: 'all',
    searchTerm: '',
    currentView: 'dashboard'
  };

  // Security / PIN state
  let security = {
    hasPin: false,
    pinHash: null,
    isUnlocked: true,
    inputBuffer: '',
    pinSettingMode: false,
    tempPinToConfirm: null
  };

  // PWA deferred prompt
  let deferredInstallPrompt = null;

  // Selected Category ID in Add Modal
  let activeModalCategory = null;
  let activeModalType = 'expense';

  // ==========================================================================
  // Storage & Persistence (100% Local Device Only)
  // ==========================================================================
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.transactions) state.transactions = parsed.transactions;
        if (parsed.categories && parsed.categories.length) state.categories = parsed.categories;
        if (parsed.currency) state.currency = parsed.currency;
      } else {
        // First run demo transaction so the user immediately sees the beautiful UI
        initSampleData();
        saveState();
      }

      // Check PIN
      const pinRaw = localStorage.getItem(PIN_KEY);
      if (pinRaw) {
        security.hasPin = true;
        security.pinHash = pinRaw;
        security.isUnlocked = false; // Lock immediately on fresh start
      }
    } catch (e) {
      console.error('Error loading storage state:', e);
    }
  }

  function saveState() {
    try {
      const payload = {
        currency: state.currency,
        categories: state.categories,
        transactions: state.transactions
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Error writing to localStorage:', e);
      showToast('Warning: Storage full or disabled', 'error');
    }
  }

  function initSampleData() {
    const today = new Date().toISOString().split('T')[0];
    state.transactions = [
      {
        id: 'tx_sample_1',
        type: 'income',
        amount: 45000,
        categoryId: 'cat-salary',
        description: 'Monthly Salary Credit',
        date: today,
        createdAt: Date.now() - 86400000 * 2
      },
      {
        id: 'tx_sample_2',
        type: 'expense',
        amount: 3200,
        categoryId: 'cat-food',
        description: 'Weekend dinner with family',
        date: today,
        createdAt: Date.now() - 86400000
      },
      {
        id: 'tx_sample_3',
        type: 'expense',
        amount: 2150,
        categoryId: 'cat-groceries',
        description: 'Weekly grocery basket',
        date: today,
        createdAt: Date.now()
      }
    ];
  }

  // ==========================================================================
  // Formatting Helpers
  // ==========================================================================
  function formatMoney(amount) {
    const num = Math.abs(Number(amount) || 0);
    const formatted = num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${state.currency.symbol}${formatted}`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
  }

  function getCurrentMonthKey() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  function isTransactionInCurrentMonth(tx) {
    if (!tx.date) return false;
    return tx.date.startsWith(getCurrentMonthKey());
  }

  function isTransactionInLastMonth(tx) {
    if (!tx.date) return false;
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return tx.date.startsWith(`${y}-${m}`);
  }

  function triggerHaptic() {
    if (navigator.vibrate) {
      try { navigator.vibrate(12); } catch (e) {}
    }
  }

  // ==========================================================================
  // Financial Computations
  // ==========================================================================
  function calculateMetrics() {
    let totalIncome = 0;
    let totalExpense = 0;
    let monthIncome = 0;
    let monthExpense = 0;

    const categorySpendingThisMonth = {};

    state.transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      const inThisMonth = isTransactionInCurrentMonth(tx);

      if (tx.type === 'income') {
        totalIncome += amt;
        if (inThisMonth) monthIncome += amt;
      } else {
        totalExpense += amt;
        if (inThisMonth) {
          monthExpense += amt;
          categorySpendingThisMonth[tx.categoryId] = (categorySpendingThisMonth[tx.categoryId] || 0) + amt;
        }
      }
    });

    const netAmountLeft = totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      netAmountLeft,
      monthIncome,
      monthExpense,
      categorySpendingThisMonth
    };
  }

  // ==========================================================================
  // UI Rendering: Header & Net Balance
  // ==========================================================================
  function renderMetrics() {
    const metrics = calculateMetrics();

    // Currency tags
    const curSymbol = state.currency.symbol;
    document.getElementById('hero-currency-symbol').textContent = curSymbol;
    document.getElementById('tx-currency-label').textContent = curSymbol;
    document.getElementById('limit-currency-label').textContent = curSymbol;

    // Net balance
    const netEl = document.getElementById('hero-net-balance');
    const netVal = metrics.netAmountLeft;
    const formattedNet = Math.abs(netVal).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    netEl.textContent = formattedNet;
    if (netVal < 0) {
      netEl.className = 'net-balance-value negative';
      netEl.textContent = `-${formattedNet}`;
    } else {
      netEl.className = 'net-balance-value positive';
      netEl.textContent = formattedNet;
    }

    // Income & Expense totals
    document.getElementById('stat-total-income').textContent = `${curSymbol}${metrics.totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('stat-total-expense').textContent = `${curSymbol}${metrics.totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    // Update current month badge
    const now = new Date();
    const monthName = now.toLocaleString('default', { month: 'short', year: 'numeric' });
    const badge = document.getElementById('current-month-badge');
    if (badge) badge.textContent = monthName;
    const analyticsBadge = document.getElementById('analytics-month-label');
    if (analyticsBadge) analyticsBadge.textContent = monthName;
  }

  // ==========================================================================
  // UI Rendering: Category Budgets (Dashboard & Limits Tab)
  // ==========================================================================
  function renderBudgets() {
    const metrics = calculateMetrics();
    const spentMap = metrics.categorySpendingThisMonth;

    const expenseCategories = state.categories.filter((c) => c.type === 'expense');

    // Dashboard snapshot: show categories that have limits or high spending (up to 4)
    const dashboardContainer = document.getElementById('dashboard-budget-cards');
    const fullContainer = document.getElementById('full-budget-cards-grid');

    const cardsHtml = expenseCategories.map((cat) => {
      const spent = spentMap[cat.id] || 0;
      const limit = Number(cat.limit) || 0;
      const hasLimit = limit > 0;

      let percent = hasLimit ? Math.round((spent / limit) * 100) : 0;
      let statusClass = 'safe';
      let statusLabel = `${percent}%`;

      if (hasLimit) {
        if (spent > limit) {
          statusClass = 'danger';
          statusLabel = `Over by ${formatMoney(spent - limit)}`;
        } else if (percent >= 75) {
          statusClass = 'warning';
          statusLabel = `${percent}% Used`;
        } else {
          statusClass = 'safe';
          statusLabel = `${percent}% Used`;
        }
      } else {
        statusLabel = 'No limit';
      }

      const displayPercent = hasLimit ? Math.min(100, percent) : 0;
      const remaining = hasLimit ? limit - spent : null;

      return `
        <div class="budget-card ${hasLimit && spent > limit ? 'over-limit' : ''} ${hasLimit && percent >= 75 && percent <= 100 ? 'near-limit' : ''}">
          <div class="budget-card-top">
            <div class="category-tag">
              <span class="cat-emoji" style="border: 1px solid ${cat.color}30">${cat.icon}</span>
              <span>${escapeHtml(cat.name)}</span>
            </div>
            <span class="budget-percent-badge ${statusClass}">
              ${statusLabel}
            </span>
          </div>

          <div class="progress-track" title="${hasLimit ? `${percent}% of limit spent` : 'No limit set'}">
            <div class="progress-fill ${statusClass}" style="width: ${hasLimit ? displayPercent : 0}%;"></div>
          </div>

          <div class="budget-values-row">
            <span>Spent: <strong>${formatMoney(spent)}</strong></span>
            <span>Limit: <strong>${hasLimit ? formatMoney(limit) : 'Not set'}</strong></span>
          </div>

          <div class="budget-card-footer">
            <span class="budget-remaining ${remaining !== null && remaining < 0 ? 'negative' : ''}">
              ${hasLimit
                ? (remaining >= 0 ? `${formatMoney(remaining)} left this month` : `Exceeded by ${formatMoney(Math.abs(remaining))}`)
                : 'Tap to set monthly limit'}
            </span>
            <button type="button" class="btn-edit-limit" data-action="edit-limit" data-cat-id="${cat.id}">
              ${hasLimit ? 'Edit Limit' : '+ Set Limit'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (fullContainer) {
      fullContainer.innerHTML = cardsHtml;
    }

    if (dashboardContainer) {
      // Prioritize categories with limits first, then top spenders
      const sortedForDashboard = [...expenseCategories].sort((a, b) => {
        const spentA = spentMap[a.id] || 0;
        const spentB = spentMap[b.id] || 0;
        const limitA = a.limit || 0;
        const limitB = b.limit || 0;
        if (limitA > 0 && limitB === 0) return -1;
        if (limitB > 0 && limitA === 0) return 1;
        return spentB - spentA;
      }).slice(0, 4);

      if (sortedForDashboard.length === 0) {
        dashboardContainer.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1;">
            <p>No expense categories defined.</p>
          </div>
        `;
      } else {
        dashboardContainer.innerHTML = sortedForDashboard.map((cat) => {
          const spent = spentMap[cat.id] || 0;
          const limit = Number(cat.limit) || 0;
          const hasLimit = limit > 0;
          const percent = hasLimit ? Math.round((spent / limit) * 100) : 0;
          let statusClass = 'safe';
          if (hasLimit && spent > limit) statusClass = 'danger';
          else if (hasLimit && percent >= 75) statusClass = 'warning';

          return `
            <div class="budget-card ${hasLimit && spent > limit ? 'over-limit' : ''}">
              <div class="budget-card-top">
                <div class="category-tag">
                  <span class="cat-emoji">${cat.icon}</span>
                  <span>${escapeHtml(cat.name)}</span>
                </div>
                <span class="budget-percent-badge ${statusClass}">
                  ${hasLimit ? (spent > limit ? 'Over Budget' : `${percent}%`) : 'No limit'}
                </span>
              </div>
              <div class="progress-track">
                <div class="progress-fill ${statusClass}" style="width: ${hasLimit ? Math.min(100, percent) : 0}%;"></div>
              </div>
              <div class="budget-values-row">
                <span>Spent: <strong>${formatMoney(spent)}</strong></span>
                <span>Limit: <strong>${hasLimit ? formatMoney(limit) : 'None'}</strong></span>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  }

  // ==========================================================================
  // UI Rendering: Transactions Lists (Dashboard & Full Ledger)
  // ==========================================================================
  function renderTransactions() {
    const listEl = document.getElementById('full-transaction-list');
    const recentEl = document.getElementById('dashboard-recent-transactions');

    // Filter transactions
    let filtered = [...state.transactions];

    // Type or time filters
    if (state.currentFilter === 'expense') {
      filtered = filtered.filter((t) => t.type === 'expense');
    } else if (state.currentFilter === 'income') {
      filtered = filtered.filter((t) => t.type === 'income');
    } else if (state.currentFilter === 'this-month') {
      filtered = filtered.filter(isTransactionInCurrentMonth);
    } else if (state.currentFilter === 'last-month') {
      filtered = filtered.filter(isTransactionInLastMonth);
    }

    // Search query
    if (state.searchTerm) {
      const q = state.searchTerm.toLowerCase();
      filtered = filtered.filter((t) => {
        const cat = getCategory(t.categoryId);
        const catName = cat ? cat.name.toLowerCase() : '';
        const desc = (t.description || '').toLowerCase();
        return catName.includes(q) || desc.includes(q);
      });
    }

    // Sort descending by date & created timestamp
    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime() || a.createdAt;
      const dateB = new Date(b.date).getTime() || b.createdAt;
      return dateB - dateA;
    });

    const categoryMap = {};
    state.categories.forEach((c) => (categoryMap[c.id] = c));

    function createTxItemHtml(tx) {
      const cat = categoryMap[tx.categoryId] || { name: 'Uncategorized', icon: '💳', color: '#64748b' };
      const isIncome = tx.type === 'income';
      const sign = isIncome ? '+' : '-';
      const amtClass = isIncome ? 'income' : 'expense';

      return `
        <div class="transaction-card" data-tx-id="${tx.id}">
          <div class="tx-left">
            <div class="tx-cat-icon" style="background: ${cat.color}20; color: ${cat.color}; border: 1px solid ${cat.color}40;">
              ${cat.icon}
            </div>
            <div class="tx-details">
              <span class="tx-title">${escapeHtml(tx.description || cat.name)}</span>
              <div class="tx-meta">
                <span class="tx-category-badge">${escapeHtml(cat.name)}</span>
                <span>•</span>
                <span>${formatDate(tx.date)}</span>
              </div>
            </div>
          </div>
          <div class="tx-right">
            <span class="tx-amount ${amtClass}">
              ${sign}${formatMoney(tx.amount)}
            </span>
            <div class="tx-actions-quick">
              <button type="button" class="btn-tx-del" data-action="delete-tx" data-tx-id="${tx.id}" title="Delete Transaction">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // Render full ledger
    if (listEl) {
      if (filtered.length === 0) {
        listEl.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
            <h3>No Transactions Found</h3>
            <p>Tap the + button to record your first income or expense.</p>
          </div>
        `;
      } else {
        listEl.innerHTML = filtered.map(createTxItemHtml).join('');
      }
    }

    // Render recent on dashboard (first 5 transactions)
    if (recentEl) {
      const recent = [...state.transactions].sort((a, b) => (new Date(b.date).getTime() || b.createdAt) - (new Date(a.date).getTime() || a.createdAt)).slice(0, 5);
      if (recent.length === 0) {
        recentEl.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <h3>No Recent Activity</h3>
            <p>Record your expenses and income to see your net balance automatically calculate.</p>
          </div>
        `;
      } else {
        recentEl.innerHTML = recent.map(createTxItemHtml).join('');
      }
    }
  }

  // ==========================================================================
  // UI Rendering: Visual Analytics Charts (Pure Canvas, 100% Offline)
  // ==========================================================================
  function renderAnalyticsCharts() {
    renderCategoryDonutChart();
    renderMonthlyBarChart();
  }

  function renderCategoryDonutChart() {
    const canvas = document.getElementById('category-donut-chart');
    const legendEl = document.getElementById('donut-legend-wrap');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement.clientWidth || 300;
    const height = 240;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Filter expenses in current month
    const expenseTotals = {};
    let totalSpent = 0;

    state.transactions.forEach((tx) => {
      if (tx.type === 'expense' && isTransactionInCurrentMonth(tx)) {
        const amt = Number(tx.amount) || 0;
        expenseTotals[tx.categoryId] = (expenseTotals[tx.categoryId] || 0) + amt;
        totalSpent += amt;
      }
    });

    const entries = Object.entries(expenseTotals).sort((a, b) => b[1] - a[1]);

    if (entries.length === 0 || totalSpent === 0) {
      // Empty state donut placeholder
      const cx = width / 2;
      const cy = height / 2;
      const r = Math.min(cx, cy) - 25;

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 24;
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No expenses this month', cx, cy);

      if (legendEl) legendEl.innerHTML = '<span style="color:#64748b; font-size:0.8rem;">Add expenses to see category breakdown.</span>';
      return;
    }

    const cx = width / 2;
    const cy = height / 2;
    const outerRadius = Math.min(cx, cy) - 25;
    const innerRadius = outerRadius - 26;

    let startAngle = -Math.PI / 2;

    const legendItemsHtml = [];

    entries.forEach(([catId, amount]) => {
      const cat = getCategory(catId) || { name: 'Other', color: '#6366f1', icon: '🏷️' };
      const sliceAngle = (amount / totalSpent) * (Math.PI * 2);
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.arc(cx, cy, outerRadius, startAngle, endAngle);
      ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = cat.color;
      ctx.fill();

      // Thin separator
      ctx.strokeStyle = '#070b14';
      ctx.lineWidth = 2;
      ctx.stroke();

      const pct = Math.round((amount / totalSpent) * 100);
      legendItemsHtml.push(`
        <div class="legend-item" title="${formatMoney(amount)} (${pct}%)">
          <span class="legend-color-dot" style="background:${cat.color};"></span>
          <span>${cat.icon} ${escapeHtml(cat.name)}: <strong>${pct}%</strong></span>
        </div>
      `);

      startAngle = endAngle;
    });

    // Center total text
    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 16px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(formatMoney(totalSpent), cx, cy - 6);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Total Spent', cx, cy + 14);

    if (legendEl) {
      legendEl.innerHTML = legendItemsHtml.join('');
    }
  }

  function renderMonthlyBarChart() {
    const canvas = document.getElementById('monthly-bar-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement.clientWidth || 300;
    const height = 240;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Compute last 4 months
    const months = [];
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short' });
      months.push({ key, label, income: 0, expense: 0 });
    }

    state.transactions.forEach((tx) => {
      if (!tx.date) return;
      const txKey = tx.date.substring(0, 7);
      const match = months.find((m) => m.key === txKey);
      if (match) {
        const amt = Number(tx.amount) || 0;
        if (tx.type === 'income') match.income += amt;
        else match.expense += amt;
      }
    });

    let maxVal = 1000;
    months.forEach((m) => {
      if (m.income > maxVal) maxVal = m.income;
      if (m.expense > maxVal) maxVal = m.expense;
    });

    const paddingX = 40;
    const paddingY = 30;
    const chartW = width - paddingX * 2;
    const chartH = height - paddingY * 2;

    const groupW = chartW / months.length;
    const barW = Math.min(22, groupW * 0.35);

    // Draw baseline
    ctx.beginPath();
    ctx.moveTo(paddingX, height - paddingY);
    ctx.lineTo(width - paddingX, height - paddingY);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.stroke();

    months.forEach((m, idx) => {
      const groupCenterX = paddingX + idx * groupW + groupW / 2;

      const incH = (m.income / maxVal) * (chartH - 20);
      const expH = (m.expense / maxVal) * (chartH - 20);

      // Income bar (green)
      const incX = groupCenterX - barW - 2;
      const incY = height - paddingY - incH;
      ctx.fillStyle = '#10b981';
      drawRoundedBar(ctx, incX, incY, barW, incH, 4);

      // Expense bar (rose)
      const expX = groupCenterX + 2;
      const expY = height - paddingY - expH;
      ctx.fillStyle = '#f43f5e';
      drawRoundedBar(ctx, expX, expY, barW, expH, 4);

      // Month Label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(m.label, groupCenterX, height - paddingY + 16);
    });
  }

  function drawRoundedBar(ctx, x, y, width, height, radius) {
    if (height < 2) height = 2; // minimum visual bar
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  // ==========================================================================
  // Modal: Category Picker in Add Modal & Live Budget Warning
  // ==========================================================================
  function renderModalCategoryPicker() {
    const picker = document.getElementById('modal-category-picker');
    if (!picker) return;

    const availableCategories = state.categories.filter((c) => c.type === activeModalType);

    if (!activeModalCategory || !availableCategories.find((c) => c.id === activeModalCategory)) {
      activeModalCategory = availableCategories.length > 0 ? availableCategories[0].id : null;
    }

    picker.innerHTML = availableCategories.map((cat) => {
      const isSelected = cat.id === activeModalCategory;
      return `
        <div class="cat-chip ${isSelected ? 'selected' : ''}" data-cat-id="${cat.id}">
          <span class="cat-chip-icon">${cat.icon}</span>
          <span class="cat-chip-name">${escapeHtml(cat.name)}</span>
        </div>
      `;
    }).join('');

    checkLiveBudgetLimit();
  }

  function checkLiveBudgetLimit() {
    const warningBox = document.getElementById('modal-budget-warning');
    const warningText = document.getElementById('modal-budget-warning-text');
    if (!warningBox || !warningText) return;

    if (activeModalType !== 'expense' || !activeModalCategory) {
      warningBox.className = 'modal-budget-warning';
      return;
    }

    const cat = getCategory(activeModalCategory);
    if (!cat || !cat.limit || Number(cat.limit) <= 0) {
      warningBox.className = 'modal-budget-warning';
      return;
    }

    const limit = Number(cat.limit);
    const amountVal = parseFloat(document.getElementById('tx-amount').value) || 0;

    // Calculate current spending this month for this category
    const metrics = calculateMetrics();
    const currentSpent = metrics.categorySpendingThisMonth[cat.id] || 0;
    const projectedTotal = currentSpent + amountVal;

    if (projectedTotal > limit) {
      const overBy = projectedTotal - limit;
      warningBox.className = 'modal-budget-warning exceeded visible';
      warningText.innerHTML = `
        <strong>Budget Limit Exceeded:</strong> Adding ${formatMoney(amountVal)} will put your <em>${escapeHtml(cat.name)}</em> budget over limit by ${formatMoney(overBy)}!
      `;
    } else if (projectedTotal >= 0.75 * limit) {
      const pct = Math.round((projectedTotal / limit) * 100);
      warningBox.className = 'modal-budget-warning approaching visible';
      warningText.innerHTML = `
        <strong>Limit Alert:</strong> This expense will utilize <strong>${pct}%</strong> of your monthly ${escapeHtml(cat.name)} limit (${formatMoney(limit - projectedTotal)} left).
      `;
    } else {
      warningBox.className = 'modal-budget-warning';
    }
  }

  // ==========================================================================
  // Navigation & View Switching
  // ==========================================================================
  function switchView(viewId) {
    state.currentView = viewId;

    // Update desktop tabs
    document.querySelectorAll('.nav-tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-target') === viewId);
    });

    // Update bottom nav items
    document.querySelectorAll('.bottom-nav-item').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-target') === viewId);
    });

    // Switch view panel
    document.querySelectorAll('.view-panel').forEach((panel) => {
      panel.classList.remove('active');
    });

    const activePanel = document.getElementById(`view-${viewId}`);
    if (activePanel) {
      activePanel.classList.add('active');
    }

    // Refresh contents
    renderMetrics();
    if (viewId === 'dashboard') {
      renderBudgets();
      renderTransactions();
    } else if (viewId === 'transactions') {
      renderTransactions();
    } else if (viewId === 'budgets') {
      renderBudgets();
    } else if (viewId === 'analytics') {
      setTimeout(renderAnalyticsCharts, 50);
    }
  }

  // ==========================================================================
  // Modal Handlers
  // ==========================================================================
  function openAddModal(type = 'expense') {
    activeModalType = type;
    document.getElementById('tx-id-input').value = '';
    document.getElementById('tx-amount').value = '';
    document.getElementById('tx-description').value = '';
    document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];

    // Toggle segmented button state
    document.getElementById('type-btn-expense').className = `segmented-btn ${type === 'expense' ? 'active expense' : ''}`;
    document.getElementById('type-btn-income').className = `segmented-btn ${type === 'income' ? 'active income' : ''}`;

    renderModalCategoryPicker();

    document.getElementById('modal-transaction').classList.add('open');
    setTimeout(() => {
      document.getElementById('tx-amount').focus();
    }, 150);
    triggerHaptic();
  }

  function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('open');
  }

  function openLimitModal(catId) {
    const cat = getCategory(catId);
    if (!cat) return;

    document.getElementById('limit-category-id').value = cat.id;
    document.getElementById('limit-cat-display').innerHTML = `
      <span class="cat-emoji" style="border:1px solid ${cat.color}40">${cat.icon}</span>
      <span>${escapeHtml(cat.name)}</span>
    `;
    document.getElementById('limit-amount-input').value = cat.limit || '';
    document.getElementById('modal-category-limit').classList.add('open');
    triggerHaptic();
  }

  // ==========================================================================
  // Data Manipulation (Add, Edit, Delete, Limits)
  // ==========================================================================
  function getCategory(catId) {
    return state.categories.find((c) => c.id === catId);
  }

  function saveTransaction(e) {
    e.preventDefault();
    const amountVal = parseFloat(document.getElementById('tx-amount').value);
    if (isNaN(amountVal) || amountVal <= 0) {
      showToast('Please enter a valid amount', 'warning');
      return;
    }

    if (!activeModalCategory) {
      showToast('Please select a category', 'warning');
      return;
    }

    const txDate = document.getElementById('tx-date').value || new Date().toISOString().split('T')[0];
    const desc = document.getElementById('tx-description').value.trim();

    const newTx = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      type: activeModalType,
      amount: amountVal,
      categoryId: activeModalCategory,
      description: desc,
      date: txDate,
      createdAt: Date.now()
    };

    state.transactions.unshift(newTx);
    saveState();
    closeModal('modal-transaction');

    renderMetrics();
    renderBudgets();
    renderTransactions();
    if (state.currentView === 'analytics') renderAnalyticsCharts();

    const cat = getCategory(activeModalCategory);
    const catName = cat ? cat.name : 'Transaction';
    showToast(`${activeModalType === 'income' ? 'Income' : 'Expense'} saved: ${formatMoney(amountVal)} (${catName})`, 'success');
    triggerHaptic();
  }

  function deleteTransaction(txId) {
    if (confirm('Delete this transaction?')) {
      state.transactions = state.transactions.filter((t) => t.id !== txId);
      saveState();
      renderMetrics();
      renderBudgets();
      renderTransactions();
      if (state.currentView === 'analytics') renderAnalyticsCharts();
      showToast('Transaction removed', 'success');
      triggerHaptic();
    }
  }

  function saveCategoryLimit(e) {
    e.preventDefault();
    const catId = document.getElementById('limit-category-id').value;
    const limitVal = parseFloat(document.getElementById('limit-amount-input').value) || 0;

    const cat = getCategory(catId);
    if (cat) {
      cat.limit = limitVal > 0 ? limitVal : null;
      saveState();
      renderBudgets();
      closeModal('modal-category-limit');
      showToast(`Limit updated for ${cat.name}`, 'success');
      triggerHaptic();
    }
  }

  function createCustomCategory(e) {
    e.preventDefault();
    const name = document.getElementById('new-cat-name').value.trim();
    const type = document.getElementById('new-cat-type').value;
    const emoji = document.getElementById('new-cat-emoji').value.trim() || '🏷️';
    const limit = parseFloat(document.getElementById('new-cat-limit').value) || null;

    if (!name) {
      showToast('Category name is required', 'warning');
      return;
    }

    const newCat = {
      id: 'cat_custom_' + Date.now(),
      name,
      type,
      icon: emoji,
      color: type === 'income' ? '#10b981' : '#6366f1',
      limit: limit > 0 ? limit : null
    };

    state.categories.push(newCat);
    saveState();
    closeModal('modal-new-cat');
    renderBudgets();
    showToast(`Created category "${name}"`, 'success');
    document.getElementById('new-cat-form').reset();
    triggerHaptic();
  }

  // ==========================================================================
  // Security PIN Lock & PBKDF2 Web Crypto Vault
  // ==========================================================================
  async function hashPin(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + '_vaultbudget_salt_2026');
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  function updatePinDots() {
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById(`pindot-${i}`);
      if (dot) {
        dot.classList.toggle('filled', i < security.inputBuffer.length);
      }
    }
  }

  async function handlePinKey(key) {
    triggerHaptic();

    if (key === 'clear') {
      security.inputBuffer = '';
      updatePinDots();
      return;
    }

    if (key === 'backspace') {
      security.inputBuffer = security.inputBuffer.slice(0, -1);
      updatePinDots();
      return;
    }

    if (security.inputBuffer.length < 4) {
      security.inputBuffer += key;
      updatePinDots();
    }

    if (security.inputBuffer.length === 4) {
      const entered = security.inputBuffer;
      security.inputBuffer = '';

      if (security.pinSettingMode) {
        // Step 1 or 2 of setting PIN
        if (!security.tempPinToConfirm) {
          security.tempPinToConfirm = entered;
          document.getElementById('pin-screen-title').textContent = 'Confirm PIN';
          document.getElementById('pin-screen-subtitle').textContent = 'Re-enter your 4-digit PIN to confirm';
          updatePinDots();
        } else {
          if (security.tempPinToConfirm === entered) {
            const h = await hashPin(entered);
            localStorage.setItem(PIN_KEY, h);
            security.hasPin = true;
            security.pinHash = h;
            security.isUnlocked = true;
            security.pinSettingMode = false;
            security.tempPinToConfirm = null;
            document.getElementById('pin-lock-screen').classList.remove('active');
            updateSecuritySettingsUI();
            showToast('PIN lock enabled successfully!', 'success');
          } else {
            showToast('PINs do not match. Try again.', 'error');
            security.tempPinToConfirm = null;
            document.getElementById('pin-screen-title').textContent = 'Set New PIN';
            document.getElementById('pin-screen-subtitle').textContent = 'Enter a 4-digit master PIN';
            updatePinDots();
          }
        }
      } else {
        // Normal unlocking check
        const h = await hashPin(entered);
        if (h === security.pinHash) {
          security.isUnlocked = true;
          document.getElementById('pin-lock-screen').classList.remove('active');
          showToast('Vault unlocked', 'success');
        } else {
          showToast('Incorrect PIN', 'error');
          updatePinDots();
        }
      }
    }
  }

  function promptSetPin() {
    security.pinSettingMode = true;
    security.tempPinToConfirm = null;
    security.inputBuffer = '';
    document.getElementById('pin-screen-title').textContent = 'Set Master PIN';
    document.getElementById('pin-screen-subtitle').textContent = 'Choose a 4-digit PIN to secure your records';
    updatePinDots();
    document.getElementById('pin-lock-screen').classList.add('active');
  }

  function removePin() {
    if (confirm('Disable PIN protection? Your data remains completely safe on this device.')) {
      localStorage.removeItem(PIN_KEY);
      security.hasPin = false;
      security.pinHash = null;
      security.isUnlocked = true;
      updateSecuritySettingsUI();
      showToast('PIN removed', 'success');
    }
  }

  function lockAppNow() {
    if (!security.hasPin) {
      promptSetPin();
      return;
    }
    security.isUnlocked = false;
    security.pinSettingMode = false;
    security.inputBuffer = '';
    document.getElementById('pin-screen-title').textContent = 'Vault Locked';
    document.getElementById('pin-screen-subtitle').textContent = 'Enter your 4-digit PIN to access records';
    updatePinDots();
    document.getElementById('pin-lock-screen').classList.add('active');
  }

  function updateSecuritySettingsUI() {
    const btn = document.getElementById('btn-toggle-pin');
    const quickLockBtn = document.getElementById('btn-quick-lock');

    if (security.hasPin) {
      if (btn) btn.textContent = 'Remove PIN';
      if (quickLockBtn) quickLockBtn.style.display = 'flex';
    } else {
      if (btn) btn.textContent = 'Set PIN';
      if (quickLockBtn) quickLockBtn.style.display = 'none';
    }
  }

  // ==========================================================================
  // Backup Export & Import (JSON & CSV)
  // ==========================================================================
  function exportBackupJSON() {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      currency: state.currency,
      categories: state.categories,
      transactions: state.transactions
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vaultbudget_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Backup JSON file downloaded', 'success');
  }

  function exportTransactionsCSV() {
    if (state.transactions.length === 0) {
      showToast('No transactions to export', 'warning');
      return;
    }

    const headers = ['ID', 'Date', 'Type', 'Category', 'Amount', 'Description'];
    const rows = state.transactions.map((t) => {
      const cat = getCategory(t.categoryId);
      return [
        t.id,
        t.date,
        t.type,
        `"${(cat ? cat.name : 'Other').replace(/"/g, '""')}"`,
        t.amount,
        `"${(t.description || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vaultbudget_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('CSV ledger downloaded', 'success');
  }

  function handleImportFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.transactions && Array.isArray(parsed.transactions)) {
          if (confirm(`Restore ${parsed.transactions.length} transactions from backup file?`)) {
            state.transactions = parsed.transactions;
            if (parsed.categories && parsed.categories.length) state.categories = parsed.categories;
            if (parsed.currency) state.currency = parsed.currency;
            saveState();
            renderMetrics();
            renderBudgets();
            renderTransactions();
            showToast('Backup restored successfully!', 'success');
          }
        } else {
          showToast('Invalid backup file structure', 'error');
        }
      } catch (err) {
        showToast('Error parsing JSON backup file', 'error');
      }
    };
    reader.readAsText(file);
  }

  function wipeAllData() {
    if (confirm('Are you ABSOLUTELY SURE you want to wipe all records? This action cannot be undone.')) {
      if (confirm('Final confirmation: Delete all stored transactions and categories on this phone?')) {
        localStorage.removeItem(STORAGE_KEY);
        state.transactions = [];
        state.categories = [...DEFAULT_CATEGORIES];
        saveState();
        renderMetrics();
        renderBudgets();
        renderTransactions();
        showToast('All data has been wiped', 'success');
      }
    }
  }

  // ==========================================================================
  // PWA (Progressive Web App) Service Worker & Android Installation
  // ==========================================================================
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then((reg) => {
            console.log('VaultBudget ServiceWorker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('ServiceWorker registration error:', err);
          });
      });
    }

    // Android Chrome PWA install trigger
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      const installBtn = document.getElementById('btn-pwa-install');
      if (installBtn) {
        installBtn.style.display = 'flex';
      }
    });

    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      const installBtn = document.getElementById('btn-pwa-install');
      if (installBtn) installBtn.style.display = 'none';
      showToast('VaultBudget installed to your Android device!', 'success');
    });
  }

  function triggerPWAInstall() {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          showToast('Installing VaultBudget...', 'success');
        }
        deferredInstallPrompt = null;
      });
    } else {
      // Show instructional modal
      document.getElementById('modal-install-guide').classList.add('open');
    }
  }

  // ==========================================================================
  // Toast System
  // ==========================================================================
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
    }

    toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease-out';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================================================
  // Event Listeners & Bootstrapping
  // ==========================================================================
  function setupEventListeners() {
    // Navigation tabs (desktop & mobile)
    document.querySelectorAll('[data-target]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        if (target) switchView(target);
      });
    });

    // Quick Action Add Buttons
    document.getElementById('btn-quick-add-expense')?.addEventListener('click', () => openAddModal('expense'));
    document.getElementById('btn-quick-add-income')?.addEventListener('click', () => openAddModal('income'));
    document.getElementById('btn-fab-add')?.addEventListener('click', () => openAddModal('expense'));

    // Dashboard shortcuts to other views
    document.getElementById('link-goto-budgets')?.addEventListener('click', () => switchView('budgets'));
    document.getElementById('link-goto-transactions')?.addEventListener('click', () => switchView('transactions'));

    // Segmented control in Add Modal (Expense vs Income)
    document.getElementById('type-btn-expense')?.addEventListener('click', () => {
      activeModalType = 'expense';
      document.getElementById('type-btn-expense').className = 'segmented-btn active expense';
      document.getElementById('type-btn-income').className = 'segmented-btn income';
      renderModalCategoryPicker();
    });

    document.getElementById('type-btn-income')?.addEventListener('click', () => {
      activeModalType = 'income';
      document.getElementById('type-btn-income').className = 'segmented-btn active income';
      document.getElementById('type-btn-expense').className = 'segmented-btn expense';
      renderModalCategoryPicker();
    });

    // Category click inside Add Modal
    document.getElementById('modal-category-picker')?.addEventListener('click', (e) => {
      const chip = e.target.closest('.cat-chip');
      if (chip) {
        activeModalCategory = chip.getAttribute('data-cat-id');
        document.querySelectorAll('.cat-chip').forEach((c) => c.classList.remove('selected'));
        chip.classList.add('selected');
        checkLiveBudgetLimit();
        triggerHaptic();
      }
    });

    // Live budget limit check on typing amount
    document.getElementById('tx-amount')?.addEventListener('input', checkLiveBudgetLimit);

    // Form Submissions
    document.getElementById('tx-form')?.addEventListener('submit', saveTransaction);
    document.getElementById('limit-form')?.addEventListener('submit', saveCategoryLimit);
    document.getElementById('new-cat-form')?.addEventListener('submit', createCustomCategory);

    // Modal Close Buttons
    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach((m) => m.classList.remove('open'));
      });
    });

    // Close modal on click backdrop
    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('open');
      });
    });

    // Category Limit buttons in grids
    document.addEventListener('click', (e) => {
      const editBtn = e.target.closest('[data-action="edit-limit"]');
      if (editBtn) {
        const catId = editBtn.getAttribute('data-cat-id');
        openLimitModal(catId);
        return;
      }

      const delBtn = e.target.closest('[data-action="delete-tx"]');
      if (delBtn) {
        e.stopPropagation();
        const txId = delBtn.getAttribute('data-tx-id');
        deleteTransaction(txId);
        return;
      }
    });

    // Add Custom Category button
    document.getElementById('btn-add-custom-cat')?.addEventListener('click', () => {
      document.getElementById('modal-new-cat').classList.add('open');
      triggerHaptic();
    });

    // Search & Filter in Ledger
    document.getElementById('tx-search-input')?.addEventListener('input', (e) => {
      state.searchTerm = e.target.value.trim();
      renderTransactions();
    });

    document.querySelectorAll('.filter-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        state.currentFilter = pill.getAttribute('data-filter') || 'all';
        renderTransactions();
      });
    });

    // Currency selector
    const currSelect = document.getElementById('currency-select');
    if (currSelect) {
      currSelect.addEventListener('change', (e) => {
        const [code, symbol] = e.target.value.split('|');
        state.currency = { code, symbol };
        saveState();
        renderMetrics();
        renderBudgets();
        renderTransactions();
        if (state.currentView === 'analytics') renderAnalyticsCharts();
        showToast(`Currency changed to ${symbol} (${code})`, 'success');
      });
    }

    // PIN Settings Buttons
    document.getElementById('btn-toggle-pin')?.addEventListener('click', () => {
      if (security.hasPin) removePin();
      else promptSetPin();
    });

    document.getElementById('btn-quick-lock')?.addEventListener('click', lockAppNow);

    // PIN Keypad buttons
    document.querySelectorAll('.keypad-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-key');
        handlePinKey(key);
      });
    });

    // Keyboard support for PIN
    window.addEventListener('keydown', (e) => {
      if (document.getElementById('pin-lock-screen').classList.contains('active')) {
        if (/^[0-9]$/.test(e.key)) {
          handlePinKey(e.key);
        } else if (e.key === 'Backspace') {
          handlePinKey('backspace');
        } else if (e.key === 'Escape') {
          handlePinKey('clear');
        }
      }
    });

    // PWA Install buttons
    document.getElementById('btn-pwa-install')?.addEventListener('click', triggerPWAInstall);
    document.getElementById('btn-guide-install')?.addEventListener('click', () => {
      document.getElementById('modal-install-guide').classList.add('open');
    });

    // Backup & Restore
    document.getElementById('btn-export-backup')?.addEventListener('click', exportBackupJSON);
    document.getElementById('btn-export-csv')?.addEventListener('click', exportTransactionsCSV);

    document.getElementById('btn-trigger-import')?.addEventListener('click', () => {
      document.getElementById('import-file-input').click();
    });

    document.getElementById('import-file-input')?.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleImportFile(e.target.files[0]);
        e.target.value = '';
      }
    });

    document.getElementById('btn-wipe-data')?.addEventListener('click', wipeAllData);

    // Auto-lock on tab switch / window blur if PIN active
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && security.hasPin && security.isUnlocked) {
        lockAppNow();
      }
    });
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================
  function init() {
    loadState();
    setupEventListeners();
    updateSecuritySettingsUI();

    // Set select value for currency
    const currSelect = document.getElementById('currency-select');
    if (currSelect) {
      const match = `${state.currency.code}|${state.currency.symbol}`;
      for (let i = 0; i < currSelect.options.length; i++) {
        if (currSelect.options[i].value === match) {
          currSelect.selectedIndex = i;
          break;
        }
      }
    }

    // Check if initial lock is required
    if (security.hasPin) {
      document.getElementById('pin-lock-screen').classList.add('active');
    }

    renderMetrics();
    renderBudgets();
    renderTransactions();
    registerServiceWorker();

    console.log('VaultBudget initialized with 100% device-local storage.');
  }

  // Run once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
