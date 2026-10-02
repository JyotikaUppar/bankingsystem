/**
 * NovaTrust Core Banking System - Frontend Application Logic
 */

// Application State
const state = {
  apiUrl: localStorage.getItem('bank_api_url') || (window.location.protocol.startsWith('http') ? '' : 'http://localhost:8080'),
  users: [],
  accounts: [],
  transactions: [],
  isOnline: false,
};

// DOM Element Selectors
const elements = {
  // Navigation & General
  navLinks: document.querySelectorAll('.nav-link'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  pageTitle: document.getElementById('pageTitle'),
  pageSubtitle: document.getElementById('pageSubtitle'),
  statusDot: document.getElementById('statusDot'),
  statusText: document.getElementById('statusText'),
  toastContainer: document.getElementById('toastContainer'),
  refreshBtn: document.getElementById('refreshBtn'),
  seedDemoBtn: document.getElementById('seedDemoBtn'),
  dismissDemoBanner: document.getElementById('dismissDemoBanner'),
  openSettingsBtn: document.getElementById('openSettingsBtn'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  apiUrlInput: document.getElementById('apiUrlInput'),

  // Dashboard Stats
  statTotalBalance: document.getElementById('statTotalBalance'),
  statTotalUsers: document.getElementById('statTotalUsers'),
  statTotalAccounts: document.getElementById('statTotalAccounts'),
  statTotalTransactions: document.getElementById('statTotalTransactions'),
  dashboardAccountsList: document.getElementById('dashboardAccountsList'),
  recentTransactionsTableBody: document.getElementById('recentTransactionsTableBody'),

  // Customers View
  usersTableBody: document.getElementById('usersTableBody'),
  customerCountBadge: document.getElementById('customerCountBadge'),
  searchUserInput: document.getElementById('searchUserInput'),
  openAddUserModalBtn: document.getElementById('openAddUserModalBtn'),
  quickNewUserBtn: document.getElementById('quickNewUserBtn'),
  userModal: document.getElementById('userModal'),
  userForm: document.getElementById('userForm'),
  userModalTitle: document.getElementById('userModalTitle'),
  editUserId: document.getElementById('editUserId'),
  passwordGroup: document.getElementById('passwordGroup'),
  userDetailModal: document.getElementById('userDetailModal'),
  userDetailBody: document.getElementById('userDetailBody'),

  // Accounts View
  allAccountsGrid: document.getElementById('allAccountsGrid'),
  accountCountBadge: document.getElementById('accountCountBadge'),
  filterAccountType: document.getElementById('filterAccountType'),
  openAddAccountModalBtn: document.getElementById('openAddAccountModalBtn'),
  quickNewAccountBtn: document.getElementById('quickNewAccountBtn'),
  accountModal: document.getElementById('accountModal'),
  accountForm: document.getElementById('accountForm'),
  accountUserSelect: document.getElementById('accountUserSelect'),
  accountTypeSelect: document.getElementById('accountTypeSelect'),
  initialDepositInput: document.getElementById('initialDepositInput'),
  // Transactions Hub
  actionTabBtns: document.querySelectorAll('.action-tab-btn'),
  actionForms: document.querySelectorAll('.action-form'),
  depositForm: document.getElementById('depositForm'),
  depositAccountSelect: document.getElementById('depositAccountSelect'),
  depositAmount: document.getElementById('depositAmount'),
  depositDesc: document.getElementById('depositDesc'),
  withdrawForm: document.getElementById('withdrawForm'),
  withdrawAccountSelect: document.getElementById('withdrawAccountSelect'),
  withdrawAmount: document.getElementById('withdrawAmount'),
  withdrawDesc: document.getElementById('withdrawDesc'),
  transferForm: document.getElementById('transferForm'),
  transferFromSelect: document.getElementById('transferFromSelect'),
  transferToSelect: document.getElementById('transferToSelect'),
  transferAmount: document.getElementById('transferAmount'),
  transferDesc: document.getElementById('transferDesc'),
  allTransactionsTableBody: document.getElementById('allTransactionsTableBody'),
  searchTxnNumberInput: document.getElementById('searchTxnNumberInput'),
  searchTxnBtn: document.getElementById('searchTxnBtn'),
  searchTxnResultBox: document.getElementById('searchTxnResultBox'),
  refreshTxnBtn: document.getElementById('refreshTxnBtn'),

  // Statement View
  statementAccountSelect: document.getElementById('statementAccountSelect'),
  generateStatementBtn: document.getElementById('generateStatementBtn'),
  printStatementBtn: document.getElementById('printStatementBtn'),
  statementSheet: document.getElementById('statementSheet'),
  statementMetaBox: document.getElementById('statementMetaBox'),
  statementAccountSummary: document.getElementById('statementAccountSummary'),
  statementTableBody: document.getElementById('statementTableBody')
};

// ==========================================
// 1. API Client Helper Functions
// ==========================================
async function apiRequest(endpoint, method = 'GET', body = null) {
  const url = `${state.apiUrl}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, options);
    const result = await res.json().catch(() => null);

    if (!res.ok) {
      const errMsg = (result && result.message) ? result.message : `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(errMsg);
    }
    return result;
  } catch (err) {
    console.error(`API Error [${method} ${endpoint}]:`, err);
    throw err;
  }
}

// Health Check
async function checkBackendHealth() {
  try {
    // Try pinging users or actuator
    await fetch(`${state.apiUrl}/api/users`, { method: 'GET' });
    setOnlineStatus(true);
  } catch (e) {
    setOnlineStatus(false);
  }
}

function setOnlineStatus(online) {
  state.isOnline = online;
  if (online) {
    elements.statusDot.classList.remove('offline');
    elements.statusText.textContent = 'API Online';
    elements.statusText.style.color = '#34d399';
  } else {
    elements.statusDot.classList.add('offline');
    elements.statusText.textContent = 'Offline / Connecting';
    elements.statusText.style.color = '#fda4af';
  }
}

// Toast Notifications
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span><span style="font-size: 0.88rem;">${message}</span>`;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Number Formatter
function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
}

// ==========================================
// 2. Navigation & Modal Management
// ==========================================
function navigateToTab(tabName, subaction = null) {
  elements.navLinks.forEach(link => {
    if (link.dataset.tab === tabName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  elements.tabPanes.forEach(pane => {
    if (pane.id === `tab-${tabName}`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  const titles = {
    dashboard: { title: 'Banking Dashboard', sub: 'Overview of institutional assets, customers, and operations' },
    users: { title: 'Customer Directory', sub: 'Manage customer accounts, personal details, and profiles' },
    accounts: { title: 'Bank Accounts Hub', sub: 'Active checking and savings portfolios with instant balances' },
    transactions: { title: 'Transaction Operations', sub: 'Perform deposits, withdrawals, transfers, and trace references' },
    statement: { title: 'Official Account Statements', sub: 'Generate and print verifiable ledger records and passbooks' }
  };

  if (titles[tabName]) {
    elements.pageTitle.textContent = titles[tabName].title;
    elements.pageSubtitle.textContent = titles[tabName].sub;
  }

  // Handle subaction (e.g. deposit, withdraw, transfer)
  if (tabName === 'transactions' && subaction) {
    switchActionSubtab(subaction);
  }
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
}

window.closeModal = closeModal;
window.navigateToTab = navigateToTab;

// Sub-tabs in Transactions Hub
function switchActionSubtab(actionName) {
  elements.actionTabBtns.forEach(btn => {
    if (btn.dataset.action === actionName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  elements.depositForm.style.display = actionName === 'deposit' ? 'block' : 'none';
  elements.withdrawForm.style.display = actionName === 'withdraw' ? 'block' : 'none';
  elements.transferForm.style.display = actionName === 'transfer' ? 'block' : 'none';
}

// Copy to clipboard helper
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`Copied to clipboard: ${text}`, 'success');
  }).catch(() => {
    showToast(`Account: ${text}`, 'info');
  });
}
window.copyToClipboard = copyToClipboard;

// ==========================================
// 3. Data Fetching & Sync
// ==========================================
async function refreshAllData() {
  try {
    await Promise.all([fetchUsers(), fetchAccounts(), fetchTransactions()]);
    setOnlineStatus(true);
    updateDashboardStats();
    populateAccountDropdowns();
  } catch (err) {
    setOnlineStatus(false);
    showToast(`Failed to load data: ${err.message}`, 'error');
  }
}

// Fetch Users
async function fetchUsers() {
  const res = await apiRequest('/api/users');
  state.users = (res && res.data) ? res.data : [];
  renderUsersTable(state.users);
  populateUserDropdown();
  return state.users;
}

// Fetch Accounts
async function fetchAccounts() {
  const res = await apiRequest('/api/accounts');
  state.accounts = (res && res.data) ? res.data : [];
  renderAccountsGrid(state.accounts);
  return state.accounts;
}

// Fetch Transactions
async function fetchTransactions() {
  const res = await apiRequest('/api/transactions');
  state.transactions = (res && res.data) ? res.data : [];
  renderTransactionsLedger(state.transactions);
  renderRecentTransactions(state.transactions);
  return state.transactions;
}

// ==========================================
// 4. Rendering UI Views
// ==========================================

// Dashboard Stats & Lists
function updateDashboardStats() {
  const totalBal = state.accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  elements.statTotalBalance.textContent = formatCurrency(totalBal);
  elements.statTotalUsers.textContent = state.users.length;
  elements.statTotalAccounts.textContent = state.accounts.length;
  elements.statTotalTransactions.textContent = state.transactions.length;

  elements.customerCountBadge.textContent = `${state.users.length} Customers`;
  elements.accountCountBadge.textContent = `${state.accounts.length} Accounts`;

  // Featured Accounts on Dashboard
  const featured = state.accounts.slice(0, 2);
  if (featured.length === 0) {
    elements.dashboardAccountsList.innerHTML = `
      <div class="empty-state" style="padding: 20px;">
        <p>No accounts opened yet. Click "+ Open Account" to create one.</p>
      </div>`;
  } else {
    elements.dashboardAccountsList.innerHTML = featured.map(acc => renderAccountCardHtml(acc)).join('');
  }
}

// Render Users Table
function renderUsersTable(usersList) {
  if (!usersList || usersList.length === 0) {
    elements.usersTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <div class="empty-icon">👥</div>
          <h4>No Customers Found</h4>
          <p>Register a customer using the "Add Customer" button above.</p>
        </td>
      </tr>`;
    return;
  }

  elements.usersTableBody.innerHTML = usersList.map(u => {
    const accCount = (u.accounts && u.accounts.length) || 0;
    return `
      <tr>
        <td><strong>#${u.id}</strong></td>
        <td>
          <div style="font-weight: 700; color: #fff;">${u.firstName} ${u.lastName || ''}</div>
          <small style="color: var(--text-dim);">${u.address || 'Address not listed'}</small>
        </td>
        <td><span style="font-family: var(--font-mono); font-size: 0.82rem;">${u.email}</span></td>
        <td>${u.phoneNumber || '-'}</td>
        <td>${u.age ? u.age + ' yrs' : '-'} • ${u.gender || '-'}</td>
        <td>
          <span class="badge ${accCount > 0 ? 'badge-success' : 'badge-info'}">
            💳 ${accCount} ${accCount === 1 ? 'Account' : 'Accounts'}
          </span>
        </td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${formatDate(u.createdAt)}</td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm" onclick="viewUserDetail(${u.id})" title="View Details">👁️</button>
            <button class="btn btn-secondary btn-sm" onclick="openEditUserModal(${u.id})" title="Edit">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="deleteUser(${u.id})" title="Delete">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Render Accounts Cards
function renderAccountsGrid(accountsList) {
  const filter = elements.filterAccountType.value;
  const filtered = filter === 'ALL' ? accountsList : accountsList.filter(a => a.acctType === filter);

  if (!filtered || filtered.length === 0) {
    elements.allAccountsGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">💳</div>
        <h4>No Accounts Found</h4>
        <p>Open a new Savings or Current account for an existing customer.</p>
      </div>`;
    return;
  }

  elements.allAccountsGrid.innerHTML = filtered.map(acc => renderAccountCardHtml(acc)).join('');
}

function renderAccountCardHtml(acc) {
  const isSavings = acc.acctType === 'SAVINGS';
  const typeClass = isSavings ? 'savings' : 'current';
  const statusBadge = acc.status === 'ACTIVE' 
    ? `<span class="badge badge-success">ACTIVE</span>` 
    : `<span class="badge badge-danger">${acc.status}</span>`;

  return `
    <div class="account-card ${typeClass}">
      <div class="card-top">
        <div class="card-chip"></div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <span class="card-type-tag">${acc.acctType}</span>
          ${statusBadge}
        </div>
      </div>
      
      <div class="card-balance-box">
        <div class="card-balance-label">Available Balance</div>
        <div class="card-balance-amount">${formatCurrency(acc.balance)}</div>
      </div>

      <div class="card-account-no">
        <span>${acc.accountNo}</span>
        <button class="copy-btn" onclick="copyToClipboard('${acc.accountNo}')" title="Copy Account No">📋 Copy</button>
      </div>

      <div class="card-bottom">
        <div>
          <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Account Holder</div>
          <div class="card-holder">${acc.accountHolderName || 'Customer #' + acc.userId}</div>
        </div>
        <div class="card-actions">
          <button class="btn btn-secondary btn-sm" onclick="quickSelectAccountForTxn('${acc.accountNo}', 'deposit')" title="Deposit to this account">📥</button>
          <button class="btn btn-secondary btn-sm" onclick="quickSelectAccountForTxn('${acc.accountNo}', 'withdraw')" title="Withdraw from this account">📤</button>
          <button class="btn btn-secondary btn-sm" onclick="viewStatementForAccount('${acc.accountNo}')" title="View Statement">📜</button>
          <button class="btn btn-danger btn-sm" onclick="closeAccount(${acc.id}, '${acc.accountNo}')" title="Close Account">✕</button>
        </div>
      </div>
    </div>
  `;
}

// Render Transactions in Ledger
function renderTransactionsLedger(transactionsList) {
  if (!transactionsList || transactionsList.length === 0) {
    elements.allTransactionsTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <div class="empty-icon">⚡</div>
          <h4>No Transactions Recorded</h4>
          <p>Make a deposit, withdrawal, or transfer to see the ledger in action.</p>
        </td>
      </tr>`;
    return;
  }

  // Sort descending by ID or createdAt
  const sorted = [...transactionsList].sort((a, b) => (b.id || 0) - (a.id || 0));

  elements.allTransactionsTableBody.innerHTML = sorted.map(t => {
    let typeBadge = '';
    let amountSign = '';
    let amountColor = '#ffffff';

    if (t.transactionType === 'DEPOSIT') {
      typeBadge = `<span class="badge badge-success">📥 DEPOSIT</span>`;
      amountSign = '+';
      amountColor = '#34d399';
    } else if (t.transactionType === 'WITHDRAWAL') {
      typeBadge = `<span class="badge badge-danger">📤 WITHDRAWAL</span>`;
      amountSign = '-';
      amountColor = '#fda4af';
    } else {
      typeBadge = `<span class="badge badge-info">🔁 TRANSFER</span>`;
      amountSign = '⇄';
      amountColor = '#38bdf8';
    }

    return `
      <tr>
        <td><code style="font-family: var(--font-mono); color: #818cf8;">${t.transactionNo}</code></td>
        <td>${typeBadge}</td>
        <td>${t.fromAccountNo ? `<span style="font-family: var(--font-mono);">${t.fromAccountNo}</span>` : '<span style="color: var(--text-dim);">-</span>'}</td>
        <td>${t.toAccountNo ? `<span style="font-family: var(--font-mono);">${t.toAccountNo}</span>` : '<span style="color: var(--text-dim);">-</span>'}</td>
        <td style="font-weight: 700; color: ${amountColor};">${amountSign} ${formatCurrency(t.amount)}</td>
        <td style="font-weight: 600;">${t.remainingBalance != null ? formatCurrency(t.remainingBalance) : '-'}</td>
        <td style="color: var(--text-muted); font-size: 0.85rem;">${t.description || '-'}</td>
        <td style="font-size: 0.78rem; color: var(--text-dim);">${formatDate(t.createdAt)}</td>
      </tr>
    `;
  }).join('');
}

// Render Recent Transactions on Dashboard (First 5)
function renderRecentTransactions(transactionsList) {
  if (!transactionsList || transactionsList.length === 0) {
    elements.recentTransactionsTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-dim); padding: 24px;">No recent transactions</td>
      </tr>`;
    return;
  }

  const recent = [...transactionsList].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 5);

  elements.recentTransactionsTableBody.innerHTML = recent.map(t => {
    let typeBadge = '';
    let amountSign = '';
    let amountColor = '#ffffff';

    if (t.transactionType === 'DEPOSIT') {
      typeBadge = `<span class="badge badge-success">DEPOSIT</span>`;
      amountSign = '+';
      amountColor = '#34d399';
    } else if (t.transactionType === 'WITHDRAWAL') {
      typeBadge = `<span class="badge badge-danger">WITHDRAW</span>`;
      amountSign = '-';
      amountColor = '#fda4af';
    } else {
      typeBadge = `<span class="badge badge-info">TRANSFER</span>`;
      amountSign = '⇄';
      amountColor = '#38bdf8';
    }

    const acctsDisplay = t.fromAccountNo && t.toAccountNo 
      ? `${t.fromAccountNo} ➔ ${t.toAccountNo}`
      : (t.toAccountNo || t.fromAccountNo || '-');

    return `
      <tr>
        <td><code style="font-family: var(--font-mono); color: #818cf8; font-size: 0.8rem;">${t.transactionNo}</code></td>
        <td>${typeBadge}</td>
        <td style="font-family: var(--font-mono); font-size: 0.8rem;">${acctsDisplay}</td>
        <td style="font-weight: 700; color: ${amountColor};">${amountSign} ${formatCurrency(t.amount)}</td>
        <td>${t.remainingBalance != null ? formatCurrency(t.remainingBalance) : '-'}</td>
        <td style="font-size: 0.78rem; color: var(--text-dim);">${formatDate(t.createdAt)}</td>
      </tr>
    `;
  }).join('');
}

// Populate Dropdowns
function populateUserDropdown() {
  const options = state.users.map(u => `<option value="${u.id}">${u.firstName} ${u.lastName || ''} (ID: ${u.id} - ${u.email})</option>`).join('');
  elements.accountUserSelect.innerHTML = `<option value="">-- Choose a Customer --</option>` + options;
}

function populateAccountDropdowns() {
  const options = state.accounts.map(a => `
    <option value="${a.accountNo}">${a.accountNo} - ${a.accountHolderName || 'User #' + a.userId} (${a.acctType}: ${formatCurrency(a.balance)})</option>
  `).join('');

  const defaultOption = `<option value="">-- Choose Account --</option>`;
  elements.depositAccountSelect.innerHTML = defaultOption + options;
  elements.withdrawAccountSelect.innerHTML = defaultOption + options;
  elements.transferFromSelect.innerHTML = `<option value="">-- Select Source Account --</option>` + options;
  elements.transferToSelect.innerHTML = `<option value="">-- Select Destination Account --</option>` + options;
  elements.statementAccountSelect.innerHTML = `<option value="">-- Select Account --</option>` + options;
}

function quickSelectAccountForTxn(accountNo, type) {
  navigateToTab('transactions', type);
  if (type === 'deposit') {
    elements.depositAccountSelect.value = accountNo;
    elements.depositAmount.focus();
  } else if (type === 'withdraw') {
    elements.withdrawAccountSelect.value = accountNo;
    elements.withdrawAmount.focus();
  }
}
window.quickSelectAccountForTxn = quickSelectAccountForTxn;

// ==========================================
// 5. Operations: Customer Management
// ==========================================
elements.userForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const editId = elements.editUserId.value;

  const payload = {
    firstName: document.getElementById('userFirstName').value.trim(),
    lastName: document.getElementById('userLastName').value.trim(),
    email: document.getElementById('userEmail').value.trim(),
    password: document.getElementById('userPassword').value,
    age: parseInt(document.getElementById('userAge').value, 10),
    gender: document.getElementById('userGender').value,
    phoneNumber: document.getElementById('userPhone').value.trim(),
    address: document.getElementById('userAddress').value.trim(),
  };

  try {
    if (editId) {
      // Update
      const res = await apiRequest(`/api/users/${editId}`, 'PUT', payload);
      showToast(res.message || 'Customer updated successfully!', 'success');
    } else {
      // Create
      const res = await apiRequest('/api/users', 'POST', payload);
      showToast(res.message || 'Customer registered successfully!', 'success');
    }
    closeModal('userModal');
    elements.userForm.reset();
    elements.editUserId.value = '';
    await refreshAllData();
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
});

function openCreateUserModal() {
  elements.editUserId.value = '';
  elements.userModalTitle.textContent = 'Register New Customer';
  elements.passwordGroup.style.display = 'block';
  document.getElementById('userPassword').required = true;
  elements.userForm.reset();
  openModal('userModal');
}

async function openEditUserModal(id) {
  try {
    const res = await apiRequest(`/api/users/${id}`);
    const u = res.data;
    if (!u) return;

    elements.editUserId.value = u.id;
    elements.userModalTitle.textContent = `Edit Customer #${u.id}`;
    document.getElementById('userFirstName').value = u.firstName || '';
    document.getElementById('userLastName').value = u.lastName || '';
    document.getElementById('userEmail').value = u.email || '';
    document.getElementById('userAge').value = u.age || 21;
    document.getElementById('userGender').value = u.gender || 'Male';
    document.getElementById('userPhone').value = u.phoneNumber || '';
    document.getElementById('userAddress').value = u.address || '';

    // Password is required by DTO on update in backend
    document.getElementById('userPassword').value = 'password123';
    elements.passwordGroup.style.display = 'block';

    openModal('userModal');
  } catch (err) {
    showToast(`Error opening user: ${err.message}`, 'error');
  }
}
window.openEditUserModal = openEditUserModal;

async function deleteUser(id) {
  if (!confirm(`Are you sure you want to delete customer #${id}? All associated data may be affected.`)) {
    return;
  }
  try {
    const res = await apiRequest(`/api/users/${id}`, 'DELETE');
    showToast(res.message || 'Customer removed successfully', 'success');
    await refreshAllData();
  } catch (err) {
    showToast(`Delete failed: ${err.message}`, 'error');
  }
}
window.deleteUser = deleteUser;

async function viewUserDetail(id) {
  try {
    const res = await apiRequest(`/api/users/${id}`);
    const u = res.data;
    if (!u) return;

    const accHtml = (u.accounts && u.accounts.length > 0)
      ? u.accounts.map(a => `
        <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-family: var(--font-mono); font-weight: 600;">${a.accountNo}</span>
            <span class="badge ${a.acctType === 'SAVINGS' ? 'badge-info' : 'badge-success'}" style="margin-left: 8px;">${a.acctType}</span>
          </div>
          <div style="font-weight: 700; color: #34d399;">${formatCurrency(a.balance)}</div>
        </div>
      `).join('')
      : '<p style="color: var(--text-dim); margin-top: 8px;">No bank accounts associated with this customer yet.</p>';

    elements.userDetailBody.innerHTML = `
      <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 20px;">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #06b6d4); display: flex; align-items: center; justify-content: center; font-size: 1.6rem;">
          👤
        </div>
        <div>
          <h3 style="font-size: 1.2rem; color: #fff;">${u.firstName} ${u.lastName || ''}</h3>
          <p style="color: var(--text-muted); font-size: 0.85rem;">Client ID: #${u.id} • Registered ${formatDate(u.createdAt)}</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; font-size: 0.88rem;">
        <div><strong style="color: var(--text-muted);">Email:</strong> <div>${u.email}</div></div>
        <div><strong style="color: var(--text-muted);">Phone:</strong> <div>${u.phoneNumber || 'N/A'}</div></div>
        <div><strong style="color: var(--text-muted);">Age & Gender:</strong> <div>${u.age || '-'} years, ${u.gender || '-'}</div></div>
        <div><strong style="color: var(--text-muted);">Address:</strong> <div>${u.address || 'N/A'}</div></div>
      </div>

      <h4 style="font-size: 0.95rem; border-top: 1px solid var(--border-color); padding-top: 16px;">Linked Bank Accounts</h4>
      ${accHtml}
    `;
    openModal('userDetailModal');
  } catch (err) {
    showToast(`Failed to load customer profile: ${err.message}`, 'error');
  }
}
window.viewUserDetail = viewUserDetail;

// ==========================================
// 6. Operations: Account Management
// ==========================================
function openCreateAccountModal() {
  populateUserDropdown();
  if (!state.users || state.users.length === 0) {
    showToast('Please register a customer first before opening an account', 'info');
    openCreateUserModal();
    return;
  }
  openModal('accountModal');
}
window.openCreateAccountModal = openCreateAccountModal;

elements.accountForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userSelect = elements.accountUserSelect || document.getElementById('accountUserSelect');
  const typeSelect = elements.accountTypeSelect || document.getElementById('accountTypeSelect');
  const depositInput = elements.initialDepositInput || document.getElementById('initialDepositInput');
  const submitBtn = document.getElementById('submitAccountBtn') || elements.accountForm.querySelector('button[type="submit"]');

  const userId = userSelect ? userSelect.value : '';
  const acctType = typeSelect ? typeSelect.value : 'SAVINGS';
  const initialDeposit = parseFloat(depositInput ? depositInput.value : 0) || 0.0;

  if (!userId) {
    showToast('Please select a customer first', 'error');
    return;
  }

  const payload = {
    userId: parseInt(userId, 10),
    acctType,
    initialDeposit
  };

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Opening Account...';
  }

  try {
    const res = await apiRequest('/api/accounts', 'POST', payload);
    showToast(res.message || 'Bank account opened successfully!', 'success');
    closeModal('accountModal');
    elements.accountForm.reset();
    await refreshAllData();
  } catch (err) {
    showToast(`Failed to open account: ${err.message}`, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Open Account';
    }
  }
});

async function closeAccount(id, accountNo) {
  if (!confirm(`Are you sure you want to close account ${accountNo}?`)) {
    return;
  }
  try {
    const res = await apiRequest(`/api/accounts/${id}`, 'DELETE');
    showToast(res.message || `Account ${accountNo} closed successfully`, 'success');
    await refreshAllData();
  } catch (err) {
    showToast(`Error closing account: ${err.message}`, 'error');
  }
}
window.closeAccount = closeAccount;

// ==========================================
// 7. Operations: Transactions
// ==========================================

// Deposit
elements.depositForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const accountNo = elements.depositAccountSelect.value;
  const amount = parseFloat(elements.depositAmount.value);
  const description = elements.depositDesc.value.trim() || 'Cash deposit';

  if (!accountNo) {
    showToast('Please choose an account', 'error');
    return;
  }

  try {
    const res = await apiRequest('/api/transactions/deposit', 'POST', { accountNo, amount, description });
    showToast(res.message || `Successfully deposited ${formatCurrency(amount)}!`, 'success');
    elements.depositAmount.value = '';
    elements.depositDesc.value = '';
    await refreshAllData();
  } catch (err) {
    showToast(`Deposit failed: ${err.message}`, 'error');
  }
});

// Withdraw
elements.withdrawForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const accountNo = elements.withdrawAccountSelect.value;
  const amount = parseFloat(elements.withdrawAmount.value);
  const description = elements.withdrawDesc.value.trim() || 'Cash withdrawal';

  if (!accountNo) {
    showToast('Please choose an account', 'error');
    return;
  }

  try {
    const res = await apiRequest('/api/transactions/withdraw', 'POST', { accountNo, amount, description });
    showToast(res.message || `Successfully withdrawn ${formatCurrency(amount)}!`, 'success');
    elements.withdrawAmount.value = '';
    elements.withdrawDesc.value = '';
    await refreshAllData();
  } catch (err) {
    showToast(`Withdrawal failed: ${err.message}`, 'error');
  }
});

// Transfer
elements.transferForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fromAccountNo = elements.transferFromSelect.value;
  const toAccountNo = elements.transferToSelect.value;
  const amount = parseFloat(elements.transferAmount.value);
  const description = elements.transferDesc.value.trim() || 'Fund Transfer';

  if (!fromAccountNo || !toAccountNo) {
    showToast('Please select both source and destination accounts', 'error');
    return;
  }
  if (fromAccountNo === toAccountNo) {
    showToast('Source and destination accounts must be different', 'error');
    return;
  }

  try {
    const res = await apiRequest('/api/transactions/transfer', 'POST', {
      fromAccountNo,
      toAccountNo,
      amount,
      description
    });
    showToast(res.message || `Transferred ${formatCurrency(amount)} successfully!`, 'success');
    elements.transferAmount.value = '';
    elements.transferDesc.value = '';
    await refreshAllData();
  } catch (err) {
    showToast(`Transfer failed: ${err.message}`, 'error');
  }
});

// Transaction Lookup by Reference
elements.searchTxnBtn.addEventListener('click', async () => {
  const ref = elements.searchTxnNumberInput.value.trim();
  if (!ref) {
    showToast('Please enter a transaction reference number', 'error');
    return;
  }

  try {
    const res = await apiRequest(`/api/transactions/reference/${encodeURIComponent(ref)}`);
    const t = res.data;
    if (!t) {
      elements.searchTxnResultBox.style.display = 'block';
      elements.searchTxnResultBox.innerHTML = `<p style="color: #fda4af;">No transaction found with reference "${ref}".</p>`;
      return;
    }

    elements.searchTxnResultBox.style.display = 'block';
    elements.searchTxnResultBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span class="badge ${t.transactionType === 'DEPOSIT' ? 'badge-success' : t.transactionType === 'WITHDRAWAL' ? 'badge-danger' : 'badge-info'}">
          ${t.transactionType}
        </span>
        <span style="font-family: var(--font-mono); font-size: 0.85rem; color: #818cf8;">${t.transactionNo}</span>
      </div>
      <div style="font-size: 1.5rem; font-weight: 800; color: #fff; margin-bottom: 8px;">${formatCurrency(t.amount)}</div>
      <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
        <div><strong>Source Account:</strong> ${t.fromAccountNo || 'Cash / Deposit Desk'}</div>
        <div><strong>Destination Account:</strong> ${t.toAccountNo || 'Cash / ATM'}</div>
        <div><strong>Remaining Balance:</strong> ${t.remainingBalance != null ? formatCurrency(t.remainingBalance) : 'N/A'}</div>
        <div><strong>Date:</strong> ${formatDate(t.createdAt)}</div>
        <div><strong>Note:</strong> ${t.description || 'None'}</div>
      </div>
    `;
  } catch (err) {
    elements.searchTxnResultBox.style.display = 'block';
    elements.searchTxnResultBox.innerHTML = `<p style="color: #fda4af;">Transaction lookup failed: ${err.message}</p>`;
  }
});

// ==========================================
// 8. Operations: Statements & Passbook
// ==========================================
async function viewStatementForAccount(accountNo) {
  navigateToTab('statement');
  elements.statementAccountSelect.value = accountNo;
  await generateStatementForAccount(accountNo);
}
window.viewStatementForAccount = viewStatementForAccount;

elements.generateStatementBtn.addEventListener('click', async () => {
  const accountNo = elements.statementAccountSelect.value;
  if (!accountNo) {
    showToast('Please select an account first', 'error');
    return;
  }
  await generateStatementForAccount(accountNo);
});

async function generateStatementForAccount(accountNo) {
  try {
    const [stmtRes, accRes] = await Promise.all([
      apiRequest(`/api/transactions/statement/${encodeURIComponent(accountNo)}`),
      apiRequest(`/api/accounts/number/${encodeURIComponent(accountNo)}`)
    ]);

    const txns = stmtRes.data || [];
    const acc = accRes.data || {};

    let totalCredits = 0;
    let totalDebits = 0;

    txns.forEach(t => {
      if (t.transactionType === 'DEPOSIT' || (t.transactionType === 'TRANSFER' && t.toAccountNo === accountNo)) {
        totalCredits += (t.amount || 0);
      } else {
        totalDebits += (t.amount || 0);
      }
    });

    elements.statementMetaBox.innerHTML = `
      <div><strong>Statement Date:</strong> ${new Date().toLocaleDateString()}</div>
      <div><strong>Account No:</strong> <span style="font-family: var(--font-mono);">${accountNo}</span></div>
      <div><strong>Status:</strong> ${acc.status || 'ACTIVE'}</div>
    `;

    elements.statementAccountSummary.innerHTML = `
      <div>
        <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Account Holder</div>
        <div style="font-weight: 700; color: #0f172a; font-size: 1.1rem;">${acc.accountHolderName || 'Customer #' + acc.userId}</div>
        <small style="color: #64748b;">${acc.acctType} Portfolio</small>
      </div>
      <div>
        <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Current Balance</div>
        <div style="font-weight: 800; color: #10b981; font-size: 1.3rem;">${formatCurrency(acc.balance)}</div>
        <small style="color: #64748b;">Ledger verified</small>
      </div>
      <div>
        <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Total Credits / Debits</div>
        <div style="font-size: 0.9rem; font-weight: 600; color: #0f172a;">
          <span style="color: #10b981;">+${formatCurrency(totalCredits)}</span> / 
          <span style="color: #f43f5e;">-${formatCurrency(totalDebits)}</span>
        </div>
        <small style="color: #64748b;">${txns.length} total entries</small>
      </div>
    `;

    if (txns.length === 0) {
      elements.statementTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: #64748b; padding: 24px;">
            No transactions found for this account.
          </td>
        </tr>`;
    } else {
      elements.statementTableBody.innerHTML = txns.map(t => {
        const isCredit = t.transactionType === 'DEPOSIT' || (t.transactionType === 'TRANSFER' && t.toAccountNo === accountNo);
        const sign = isCredit ? '+' : '-';
        const color = isCredit ? '#10b981' : '#f43f5e';

        return `
          <tr>
            <td>${formatDate(t.createdAt)}</td>
            <td><code style="font-family: var(--font-mono); font-size: 0.8rem;">${t.transactionNo}</code></td>
            <td><strong>${t.transactionType}</strong></td>
            <td>${t.description || '-'}</td>
            <td style="font-weight: 700; color: ${color};">${sign} ${formatCurrency(t.amount)}</td>
            <td style="font-weight: 600;">${t.remainingBalance != null ? formatCurrency(t.remainingBalance) : '-'}</td>
          </tr>
        `;
      }).join('');
    }

    elements.statementSheet.classList.add('active');
    elements.printStatementBtn.style.display = 'inline-flex';
  } catch (err) {
    showToast(`Failed to generate statement: ${err.message}`, 'error');
  }
}

elements.printStatementBtn.addEventListener('click', () => {
  window.print();
});

// ==========================================
// 9. Demo Data Seeder (Perfect for Presentation!)
// ==========================================
elements.seedDemoBtn.addEventListener('click', async () => {
  if (!confirm('This will seed demo customers, accounts, and sample transactions to showcase the system to your teacher. Proceed?')) {
    return;
  }

  showToast('Seeding sample banking data...', 'info');

  try {
    // 1. Create Demo Customer 1
    const user1Res = await apiRequest('/api/users', 'POST', {
      firstName: 'Sophia',
      lastName: 'Vance',
      email: `sophia.vance.${Date.now().toString().slice(-4)}@fintech.io`,
      password: 'password123',
      age: 28,
      gender: 'Female',
      phoneNumber: '+1 415-555-0142',
      address: '742 Evergreen Terrace, Springfield'
    });
    const user1 = user1Res.data;

    // 2. Create Demo Customer 2
    const user2Res = await apiRequest('/api/users', 'POST', {
      firstName: 'Alexander',
      lastName: 'Sterling',
      email: `alex.sterling.${Date.now().toString().slice(-4)}@capital.com`,
      password: 'password123',
      age: 34,
      gender: 'Male',
      phoneNumber: '+1 212-555-0199',
      address: '100 Wall Street, New York, NY'
    });
    const user2 = user2Res.data;

    // 3. Open Savings Account for User 1 with $2,500 initial deposit
    const acc1Res = await apiRequest('/api/accounts', 'POST', {
      userId: user1.id,
      acctType: 'SAVINGS',
      initialDeposit: 2500.0
    });
    const acc1 = acc1Res.data;

    // 4. Open Current Account for User 2 with $5,000 initial deposit
    const acc2Res = await apiRequest('/api/accounts', 'POST', {
      userId: user2.id,
      acctType: 'CURRENT',
      initialDeposit: 5000.0
    });
    const acc2 = acc2Res.data;

    // 5. Perform a Deposit
    await apiRequest('/api/transactions/deposit', 'POST', {
      accountNo: acc1.accountNo,
      amount: 750.0,
      description: 'Consulting bonus deposit'
    });

    // 6. Perform a Transfer from User 2 to User 1
    await apiRequest('/api/transactions/transfer', 'POST', {
      fromAccountNo: acc2.accountNo,
      toAccountNo: acc1.accountNo,
      amount: 1200.0,
      description: 'Retainer fee payment'
    });

    showToast('✨ Demo data seeded successfully! 2 customers, 2 accounts, and transactions created.', 'success');
    await refreshAllData();
  } catch (err) {
    showToast(`Seeding error: ${err.message}`, 'error');
  }
});

// ==========================================
// 10. Event Listeners & Initialization
// ==========================================

// Nav Links
elements.navLinks.forEach(link => {
  link.addEventListener('click', () => {
    navigateToTab(link.dataset.tab);
  });
});

// Action Subtabs
elements.actionTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    switchActionSubtab(btn.dataset.action);
  });
});

// Filter Accounts
elements.filterAccountType.addEventListener('change', () => {
  renderAccountsGrid(state.accounts);
});

// Customer Search
elements.searchUserInput.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase().trim();
  if (!q) {
    renderUsersTable(state.users);
    return;
  }
  const filtered = state.users.filter(u => {
    const fullName = `${u.firstName} ${u.lastName || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const phone = (u.phoneNumber || '').toLowerCase();
    return fullName.includes(q) || email.includes(q) || phone.includes(q);
  });
  renderUsersTable(filtered);
});

// Refresh Buttons
elements.refreshBtn.addEventListener('click', refreshAllData);
elements.refreshTxnBtn.addEventListener('click', fetchTransactions);

// Quick Modals
elements.quickNewUserBtn.addEventListener('click', openCreateUserModal);
elements.openAddUserModalBtn.addEventListener('click', openCreateUserModal);
elements.quickNewAccountBtn.addEventListener('click', openCreateAccountModal);
elements.openAddAccountModalBtn.addEventListener('click', openCreateAccountModal);

// Settings Modal
elements.openSettingsBtn.addEventListener('click', () => {
  elements.apiUrlInput.value = state.apiUrl;
  openModal('settingsModal');
});

elements.saveSettingsBtn.addEventListener('click', () => {
  const url = elements.apiUrlInput.value.trim();
  state.apiUrl = url;
  localStorage.setItem('bank_api_url', url);
  closeModal('settingsModal');
  showToast(`API URL set to: ${url || 'Same origin'}`, 'info');
  refreshAllData();
});

// Dismiss Demo Banner
elements.dismissDemoBanner.addEventListener('click', () => {
  document.querySelector('.demo-banner').style.display = 'none';
});

// Initial boot
(async function init() {
  await checkBackendHealth();
  await refreshAllData().catch(() => {});
  // Check health every 15 seconds
  setInterval(checkBackendHealth, 15000);
})();
