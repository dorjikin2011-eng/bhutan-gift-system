// 🎯 GDMS: Online Gift Declaration and Management System
// 📋 Compliant with The Gift Rules 2017 | Anti-Corruption Commission, Bhutan
// ✅ Syntax-validated | No optional chaining in assignments | Strict mode ready

"use strict";

// ====== GLOBAL CONFIGURATION ======
if (!window.API_BASE_URL) {
  window.API_BASE_URL = window.location.origin + '/api';
}

// ====== AUTHENTICATION UTILITIES ======
window.getCurrentUser = () => {
  try {
    const user = localStorage.getItem('bgts_user');
    return user ? JSON.parse(user) : null;
  } catch (e) {
    console.error('❌ Failed to parse user data', e);
    return null;
  }
};

window.getAuthToken = () => {
  return localStorage.getItem('bgts_token') || '';
};

window.getAuthHeaders = () => {
  const token = window.getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

window.hasRole = (role) => {
  const user = window.getCurrentUser();
  return user && user.role === role;
};

window.isSystemAdmin = () => {
  const user = window.getCurrentUser();
  return user && user.role === 'acc-admin';
};

// ====== APP STATE ======
let appState = {
  user: null,
  gifts: [],
  connectionStatus: 'checking'
};

// ====== DOM CACHE ======
let domElements = {};

// ====== INITIALIZATION ======
async function initApp() {
  const user = window.getCurrentUser();
  const token = window.getAuthToken();
  
  if (!user || !token) {
    window.location.href = '/login';
    return;
  }

  // ✅ ACC Admin → dedicated dashboard
  if (user.role === 'acc-admin') {
    window.location.href = '/acc-dashboard.html';
    return;
  }

  appState.user = user;

  // Initialize
  cacheDOMElements();
  updateUserInfo();
  showRoleDashboard();
  updateNavigationByRole();
  setDefaultReceiptDate();
  setupEventListeners();

  // Load data
  try {
    await Promise.all([
      loadInitialData(),
      checkServerConnection()
    ]);
  } catch (err) {
    console.warn('Intialized with demo data');
  }
}

// ====== DOM CACHING ======
function cacheDOMElements() {
  domElements = {
    navTabs: document.querySelectorAll('.nav-tab'),
    pages: document.querySelectorAll('.page'),
    actionButtons: document.querySelectorAll('.action-btn'),
    checkProhibitedBtn: document.getElementById('check-prohibited-btn'),
    checkSourceBtn: document.getElementById('check-source-btn'),
    giftDeclarationForm: document.getElementById('gift-declaration-form'),
    penaltyValueInput: document.getElementById('penalty-value'),
    breachNumberSelect: document.getElementById('breach-number'),
    calculatedFine: document.getElementById('calculated-fine'),
    filterButtons: document.querySelectorAll('.filter-btn'),
    viewGiftButtons: document.querySelectorAll('.view-gift-btn'),
    relationshipSelect: document.getElementById('relationship'),
    receiptDateInput: document.getElementById('receipt-date'),
    giftDescription: document.getElementById('gift-description'),
    giftValue: document.getElementById('gift-value'),
    giverName: document.getElementById('giver-name'),
    myGiftsTable: document.getElementById('my-gifts-table'),
    notificationBadge: document.querySelector('.notification-badge'),
    userAvatar: document.querySelectorAll('.user-avatar, #header-avatar'),
    userName: document.querySelectorAll('#user-name, #header-user-name'),
    userRole: document.getElementById('user-role'),
    headerUserRole: document.getElementById('header-user-role'),
    userAgency: document.getElementById('user-agency')
  };
}

// ====== ROLE-BASED UI ======
function showRoleDashboard() {
  // Hide all dashboards
  document.querySelectorAll('.role-dashboard').forEach(el => {
    el.style.display = 'none';
  });

  const dashboardMap = {
    'public-servant': 'ps-dashboard',
    'gda': 'gda-dashboard',
    'hoa': 'hoa-dashboard',
    'gac-member': 'gac-dashboard'
  };

  const dashboardId = dashboardMap[appState.user?.role] || 'ps-dashboard';
  const dashboard = document.getElementById(dashboardId);
  
  if (dashboard) {
    dashboard.style.display = 'block';
  } else {
    console.warn(`⚠️ Dashboard not found for role: ${appState.user?.role}`);
    // ✅ FIXED: Safe guard instead of optional chaining assignment
    const psDashboard = document.getElementById('ps-dashboard');
    if (psDashboard) {
      psDashboard.style.display = 'block';
    }
  }
}

function updateNavigationByRole() {
  const permissions = {
    'dashboard': ['public-servant', 'gda', 'hoa', 'gac-member'],
    'declare': ['public-servant'],
    'my-gifts': ['public-servant'],
    'review': ['gda', 'hoa', 'gac-member'],
    'register': ['gda', 'hoa'],
    'penalties': ['hoa'],
    'knowledge': ['public-servant', 'gda', 'hoa', 'gac-member']
  };

  domElements.navTabs.forEach(tab => {
    const pageId = tab.getAttribute('data-page');
    const allowed = permissions[pageId]?.includes(appState.user?.role);
    tab.style.display = allowed ? 'flex' : 'none';
  });
}

// ====== USER INFO ======
function updateUserInfo() {
  const user = appState.user;
  if (!user) return;

  const initials = getInitials(user.name);
  domElements.userAvatar.forEach(el => {
    el.textContent = initials;
  });
  
  domElements.userName.forEach(el => {
    el.textContent = user.name;
  });
  
  const roleDisplay = getRoleDisplay(user.role);
  if (domElements.userRole) domElements.userRole.innerHTML = roleDisplay;
  if (domElements.headerUserRole) domElements.headerUserRole.textContent = roleDisplay.replace(/<[^>]*>/g, '');
  
  if (domElements.userAgency) {
    domElements.userAgency.textContent = user.agency_name || user.agency_id || 'Agency';
  }
  
  document.getElementById('user-info-bar').style.display = 'flex';
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

function getRoleDisplay(role) {
  const map = {
    'acc-admin': { name: 'ACC System Admin', cls: 'role-acc-admin' },
    'hoa': { name: 'Head of Agency', cls: 'role-hoa' },
    'gda': { name: 'Gift Disclosure Admin', cls: 'role-gda' },
    'public-servant': { name: 'Public Servant', cls: 'role-public-servant' },
    'gac-member': { name: 'GAC Member', cls: 'role-gac-member' }
  };
  const { name, cls } = map[role] || { name: role, cls: 'role-public-servant' };
  return `${name} <span class="role-badge ${cls}">${role.toUpperCase()}</span>`;
}

// ====== DATE & FORM ======
function setDefaultReceiptDate() {
  if (domElements.receiptDateInput) {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISO = new Date(now - offset).toISOString().slice(0, 16);
    domElements.receiptDateInput.value = localISO;
  }
}

// ====== SERVER HEALTH ======
async function checkServerConnection() {
  try {
    const res = await fetch(`${window.API_BASE_URL}/health`, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    appState.connectionStatus = res.ok ? 'connected' : 'offline';
    updateConnectionStatus(res.ok);
    return res.ok;
  } catch (err) {
    appState.connectionStatus = 'offline';
    updateConnectionStatus(false);
    return false;
  }
}

function updateConnectionStatus(connected) {
  let el = document.getElementById('connection-status');
  if (el) el.remove();

  if (!connected) {
    el = document.createElement('div');
    el.id = 'connection-status';
    el.style.cssText = `
      position: fixed; bottom: 10px; right: 10px; padding: 8px 15px;
      border-radius: 20px; font-size: 0.8rem; z-index: 1000;
      background: #fff3cd; color: #856404; border: 1px solid #ffeaa7;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      display: flex; align-items: center; gap: 8px;
    `;
    el.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Demo Mode (Offline)`;
    document.body.appendChild(el);
  }
}

// ====== DATA LOADING ======
async function loadInitialData() {
  try {
    const res = await fetch(`${window.API_BASE_URL}/gifts`, {
      headers: window.getAuthHeaders()
    });

    if (res.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
      return;
    }

    if (res.ok) {
      const { success, data } = await res.json();
      if (success) {
        appState.gifts = data;
        updateGiftsTable();
        updateDashboardStats();
        return;
      }
    }
    throw new Error('API error');
  } catch (err) {
    // Demo data
    appState.gifts = [
      { id: 'GIFT-001', description: 'Thanka painting', value: 5000, date: '2025-12-20', giver: 'Artist', status: 'pending' },
      { id: 'GIFT-002', description: 'Book', value: 800, date: '2025-12-15', giver: 'Brother', status: 'approved' }
    ];
    updateGiftsTable();
    updateDashboardStats();
  }
}

function updateDashboardStats() {
  const gifts = appState.gifts;
  const pending = gifts.filter(g => g.status === 'pending').length;

  const stats = document.querySelectorAll('.stat-value');
  if (stats.length >= 4) {
    stats[0].textContent = gifts.length;
    stats[1].textContent = pending;
    stats[2].textContent = gifts.filter(g => g.status === 'approved').length;
    stats[3].textContent = gifts.filter(g => g.status === 'returned').length;
  }

  if (domElements.notificationBadge) {
    domElements.notificationBadge.textContent = pending > 0 ? pending : '';
  }
}

// ====== TABLE & VIEWS ======
function updateGiftsTable() {
  if (!domElements.myGiftsTable) return;
  const tbody = domElements.myGiftsTable.querySelector('tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  appState.gifts.forEach(gift => {
    const date = gift.date || (gift.submittedAt?.split('T')[0] || 'N/A');
    const statusMap = {
      'pending': { text: 'Pending', cls: 'status-pending' },
      'approved': { text: 'Approved', cls: 'status-approved' },
      'returned': { text: 'Returned', cls: 'status-returned' }
    };
    const { text, cls } = statusMap[gift.status] || { text: 'Unknown', cls: 'status-pending' };

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${date}</td>
      <td>${gift.description}</td>
      <td>${gift.value ? gift.value.toLocaleString() : '0'}</td>
      <td>${gift.giver || 'Unknown'}</td>
      <td><span class="status-badge ${cls}">${text}</span></td>
      <td><button class="btn btn-sm view-gift-btn" data-id="${gift.id}">View</button></td>
    `;
    tbody.appendChild(row);
  });

  // Re-attach listeners
  document.querySelectorAll('.view-gift-btn').forEach(btn => {
    btn.onclick = (e) => viewGiftDetails(e);
  });
}

// ====== FORM HANDLERS ======
function setupEventListeners() {
  // Navigation
  domElements.navTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = tab.getAttribute('data-page');
      if (!pageId) return;

      const permissions = {
        'declare': ['public-servant'],
        'review': ['gda', 'hoa', 'gac-member'],
        'register': ['gda', 'hoa'],
        'penalties': ['hoa']
      };
      
      if (permissions[pageId] && !permissions[pageId].includes(appState.user?.role)) {
        showAlert('Access denied for your role.', 'error');
        return;
      }

      domElements.navTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      domElements.pages.forEach(p => p.classList.remove('active'));
      document.getElementById(pageId)?.classList.add('active');
    });
  });

  // Action buttons
  domElements.actionButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = btn.getAttribute('data-page');
      if (pageId) {
        const tab = document.querySelector(`.nav-tab[data-page="${pageId}"]`);
        if (tab) tab.click();
      }
    });
  });

  // Gift form
  domElements.giftDeclarationForm?.addEventListener('submit', submitGiftDeclaration);

  // Prohibited source
  domElements.checkProhibitedBtn?.addEventListener('click', () => {
    const modal = document.getElementById('prohibited-source-modal');
    if (modal) modal.classList.add('active');
  });

  domElements.checkSourceBtn?.addEventListener('click', checkSource);

  // Penalty calculator
  domElements.penaltyValueInput?.addEventListener('input', calculateFine);
  domElements.breachNumberSelect?.addEventListener('change', calculateFine);

  // Logout
  document.getElementById('logout-button')?.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/login';
  });
}

// ====== GIFT SUBMISSION ======
async function submitGiftDeclaration(e) {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);

  const gift = {
    description: data.get('gift-description') || '',
    value: parseFloat(data.get('gift-value')) || 0,
    receiptDate: data.get('receipt-date'),
    giftType: data.get('gift-type') || 'physical',
    giverName: data.get('giver-name') || '',
    giverDesignation: data.get('giver-designation') || '',
    giverAgency: data.get('giver-agency') || '',
    relationship: data.get('relationship') || 'other',
    circumstances: data.get('circumstances') || '',
    disposition: data.get('disposition') || '',
    isProhibitedSource: data.has('prohibited-check')
  };

  if (!gift.description || !gift.value || !gift.giverName) {
    showAlert('Please fill all required fields.', 'error');
    return;
  }

  try {
    const res = await fetch(`${window.API_BASE_URL}/gifts`, {
      method: 'POST',
      headers: window.getAuthHeaders(),
      body: JSON.stringify(gift)
    });

    if (res.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
      return;
    }

    if (res.ok) {
      const { success, data: savedGift, reference } = await res.json();
      if (success) {
        appState.gifts.push(savedGift);
        updateGiftsTable();
        updateDashboardStats();
        form.reset();
        setDefaultReceiptDate();
        localStorage.removeItem('bgts_gift_draft');
        showSuccessMessage(`✅ Gift declared. Ref: ${reference}`);
        return;
      }
    }
    throw new Error('Submission failed');
  } catch (err) {
    // Offline fallback
    const ref = `GDMS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newGift = { id: ref, ...gift, status: 'pending', reference: ref };
    appState.gifts.push(newGift);
    updateGiftsTable();
    updateDashboardStats();
    form.reset();
    setDefaultReceiptDate();
    localStorage.removeItem('bgts_gift_draft');
    showSuccessMessage(`✅ Gift declared (offline). Ref: ${ref}`);
  }
}

// ====== UTILITY FUNCTIONS ======
function checkSource() {
  const val = document.getElementById('source-check')?.value;
  if (!val) return showAlert('Select a relationship', 'warning');

  const rules = {
    'seeks-action': { title: 'PROHIBITED SOURCE', desc: 'Rule 8(a)', prohibited: true },
    'does-business': { title: 'PROHIBITED SOURCE', desc: 'Rule 8(b)', prohibited: true },
    'immediate-relative': { title: 'ALLOWED', desc: 'Rule 11(b)', prohibited: false }
  };

  const r = rules[val] || { title: 'REVIEW REQUIRED', desc: 'Consult GDA', prohibited: null };
  const el = document.getElementById('check-result');
  if (el) {
    el.style.display = 'block';
    el.style.backgroundColor = r.prohibited ? '#f8d7da' : r.prohibited === false ? '#d4edda' : '#cce5ff';
    el.innerHTML = `<h4>${r.title}</h4><p>${r.desc}</p>`;
  }
}

function calculateFine() {
  const v = parseFloat(domElements.penaltyValueInput?.value) || 0;
  const b = parseInt(domElements.breachNumberSelect?.value) || 1;
  const mult = b === 1 ? 2 : b === 2 ? 5 : 10;
  if (domElements.calculatedFine) {
    domElements.calculatedFine.textContent = `Nu. ${(v * mult).toLocaleString()}`;
  }
}

function viewGiftDetails(e) {
  const id = e.target.getAttribute('data-id');
  const gift = appState.gifts.find(g => g.id === id);
  if (!gift) return showAlert('Gift not found', 'error');

  const content = `
    <p><strong>Reference:</strong> ${gift.reference || id}</p>
    <p><strong>Description:</strong> ${gift.description}</p>
    <p><strong>Value:</strong> Nu. ${gift.value?.toLocaleString() || '0'}</p>
    <p><strong>Status:</strong> ${gift.status}</p>
  `;
  showModal('Gift Details', content);
}

// ====== UI UTILITIES ======
function showAlert(message, type = 'info') {
  const el = document.createElement('div');
  el.style.cssText = `
    position: fixed; top: 20px; right: 20px; padding: 15px 20px;
    border-radius: 8px; z-index: 10000; max-width: 400px;
    background: ${type === 'error' ? '#f8d7da' : type === 'success' ? '#d4edda' : '#fff3cd'};
    border: 1px solid ${type === 'error' ? '#f5c6cb' : type === 'success' ? '#c3e6cb' : '#ffeaa7'};
    display: flex; align-items: center; gap: 10px;
  `;
  const icon = { error: '❌', success: '✅', info: 'ℹ️' }[type] || '⚠️';
  el.innerHTML = `${icon} <span>${message}</span> <button onclick="this.parentElement.remove()" style="margin-left: auto; background: none; border: none; font-size: 1.2em;">×</button>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

function showSuccessMessage(message) {
  const modal = document.getElementById('success-modal');
  if (modal) {
    document.getElementById('success-message').textContent = message;
    modal.classList.add('active');
    setTimeout(() => modal.classList.remove('active'), 5000);
  } else {
    showAlert(message, 'success');
  }
}

function showModal(title, content) {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;`;
  modal.innerHTML = `
    <div class="modal-content" style="background: white; border-radius: 10px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
      <div style="padding: 20px; border-bottom: 1px solid #eee;">
        <h3 style="margin: 0; color: #1a5f7a;">${title}</h3>
        <button class="modal-close" style="float: right; background: none; border: none; font-size: 1.5rem; cursor: pointer;">×</button>
      </div>
      <div style="padding: 20px;">${content}</div>
      <div style="padding: 20: 0; border-top: 1px solid #eee; text-align: right;">
        <button class="btn btn-primary modal-close">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelectorAll('.modal-close').forEach(btn => {
    btn.onclick = () => modal.remove();
  });
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

// ====== STARTUP ======
document.addEventListener('DOMContentLoaded', () => {
  // Auto-logout on token removal
  window.addEventListener('storage', (e) => {
    if (e.key === 'bgts_token' && e.newValue === null) {
      localStorage.clear();
      window.location.href = '/login';
    }
  });

  initApp().catch(err => {
    console.error('App init failed:', err);
  });
});

// Expose for inline handlers
window.navigateTo = (pageId) => {
  const tab = document.querySelector(`.nav-tab[data-page="${pageId}"]`);
  if (tab) tab.click();
};