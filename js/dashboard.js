// RANSXM Dashboard

let currentPage = 1;
let currentSearch = '';
let currentStatus = '';
let currentSection = 'dashboard';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.requireAuth()) return;
    if (!Auth.requireAdmin()) return;
    
    setupUI();
    setupNavigation();
    await loadStats();
    await loadRecentKeys();
    setupEventListeners();
});

function setupUI() {
    const user = Auth.getUser();
    
    // Set user info in sidebar
    document.getElementById('user-name').textContent = user.email.split('@')[0];
    document.getElementById('user-role').textContent = user.role.toUpperCase();
    document.getElementById('user-initial').textContent = user.email[0].toUpperCase();
    
    // Settings page
    const settingsEmail = document.getElementById('settings-email');
    const settingsRole = document.getElementById('settings-role');
    if (settingsEmail) settingsEmail.value = user.email;
    if (settingsRole) settingsRole.value = user.role;
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const section = link.dataset.section;
            
            // Update active nav
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show section
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            document.getElementById(`section-${section}`).classList.add('active');
            
            currentSection = section;
            
            // Load section data
            switch (section) {
                case 'dashboard':
                    await loadStats();
                    await loadRecentKeys();
                    break;
                case 'keys':
                    currentPage = 1;
                    await loadKeys();
                    break;
                case 'logs':
                    await loadLogs();
                    break;
                case 'users':
                    await loadUsers();
                    break;
                case 'settings':
                    // Already loaded in setupUI
                    break;
            }
        });
    });
}

async function loadStats() {
    const result = await API.getStats();
    
    if (result.stats) {
        document.getElementById('stat-total-keys').textContent = result.stats.totalKeys || 0;
        document.getElementById('stat-active-keys').textContent = result.stats.activeKeys || 0;
        document.getElementById('stat-total-users').textContent = result.stats.totalUsers || 0;
        document.getElementById('stat-today-validations').textContent = result.stats.todayValidations || 0;
    }
}

async function loadRecentKeys() {
    const container = document.getElementById('recent-keys-body');
    if (!container) return;
    
    container.innerHTML = '<tr><td colspan="6"><div class="loading"><div class="spinner"></div> Loading...</div></td></tr>';
    
    const result = await API.getKeys({ limit: 5 });
    
    if (result.keys && result.keys.length > 0) {
        container.innerHTML = result.keys.map(key => `
            <tr>
                <td><span class="key-display">${key.key_value}</span></td>
                <td><span class="badge badge-${key.status}">${key.status}</span></td>
                <td>${key.hwid ? key.hwid.substring(0, 15) + '...' : '-'}</td>
                <td>${key.current_uses}/${key.max_uses > 0 ? key.max_uses : '∞'}</td>
                <td>${new Date(key.created_at).toLocaleDateString()}</td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn" onclick="copyKey('${key.key_value}')" title="Copy">📋</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } else {
        container.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 30px; color: #888;">No keys yet. Create your first key!</td></tr>';
    }
}

async function loadKeys() {
    const container = document.getElementById('keys-table-body');
    if (!container) return;
    
    container.innerHTML = '<tr><td colspan="7"><div class="loading"><div class="spinner"></div> Loading...</div></td></tr>';
    
    const result = await API.getKeys({
        page: currentPage,
        search: currentSearch,
        status: currentStatus
    });
    
    if (result.keys && result.keys.length > 0) {
        container.innerHTML = result.keys.map(key => `
            <tr>
                <td><span class="key-display">${key.key_value}</span></td>
                <td><span class="badge badge-${key.status}">${key.status}</span></td>
                <td>${key.hwid ? key.hwid.substring(0, 20) + '...' : '-'}</td>
                <td>${key.current_uses}/${key.max_uses > 0 ? key.max_uses : '∞'}</td>
                <td>${key.expires_at ? new Date(key.expires_at).toLocaleDateString() : 'Never'}</td>
                <td>${new Date(key.created_at).toLocaleDateString()}</td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn" onclick="copyKey('${key.key_value}')" title="Copy">📋</button>
                        <button class="action-btn" onclick="editKey('${key.id}')" title="Edit">✏️</button>
                        <button class="action-btn" onclick="resetHWID('${key.id}')" title="Reset HWID">🔄</button>
                        <button class="action-btn danger" onclick="deleteKey('${key.id}')" title="Delete">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Update pagination
        const pageInfo = document.getElementById('page-info');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        if (pageInfo) pageInfo.textContent = `Page ${result.page || 1}`;
        if (prevBtn) prevBtn.disabled = (result.page || 1) <= 1;
        if (nextBtn) nextBtn.disabled = !result.keys || result.keys.length < 20;
    } else {
        container.innerHTML = `
            <tr>
                <td colspan="7">
                    <div style="text-align: center; padding: 40px; color: #888;">
                        <h3>No keys found</h3>
                        <p>Create your first key to get started</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

async function loadLogs() {
    const container = document.getElementById('logs-table-body');
    if (!container) return;
    
    container.innerHTML = '<tr><td colspan="6"><div class="loading"><div class="spinner"></div> Loading logs...</div></td></tr>';
    
    const result = await API.getLogs({ limit: 50 });
    
    if (result.logs && result.logs.length > 0) {
        container.innerHTML = result.logs.map(log => `
            <tr>
                <td><span class="key-display">${log.keys?.key_value || 'Unknown'}</span></td>
                <td>${log.hwid ? log.hwid.substring(0, 20) + '...' : '-'}</td>
                <td>${log.game_id || '-'}</td>
                <td>${log.executor || '-'}</td>
                <td>${log.ip_address || '-'}</td>
                <td>${new Date(log.used_at).toLocaleString()}</td>
            </tr>
        `).join('');
    } else {
        container.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 30px; color: #888;">No usage logs yet</td></tr>';
    }
}

async function refreshLogs() {
    await loadLogs();
    showAlert('Logs refreshed', 'success');
}

async function loadUsers() {
    const container = document.getElementById('users-table-body');
    if (!container) return;
    
    container.innerHTML = '<tr><td colspan="3"><div class="loading"><div class="spinner"></div> Loading users...</div></td></tr>';
    
    const result = await API.getUsers();
    
    if (result.users && result.users.length > 0) {
        container.innerHTML = result.users.map(user => `
            <tr>
                <td>${user.email}</td>
                <td><span class="badge badge-${user.role === 'admin' ? 'active' : 'disabled'}">${user.role}</span></td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
            </tr>
        `).join('');
    } else {
        container.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 30px; color: #888;">No users found</td></tr>';
    }
}

function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            currentSearch = e.target.value;
            currentPage = 1;
            loadKeys();
        }, 300));
    }
    
    // Status filter
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            currentStatus = e.target.value;
            currentPage = 1;
            loadKeys();
        });
    }
    
    // Pagination
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadKeys();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentPage++;
            loadKeys();
        });
    }
    
    // Create key form
    const createKeyForm = document.getElementById('create-key-form');
    if (createKeyForm) {
        createKeyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const expires = document.getElementById('key-expires').value;
            const maxUses = document.getElementById('key-max-uses').value;
            const note = document.getElementById('key-note')?.value || '';
            
            const result = await API.createKey({
                expires_at: expires ? new Date(expires).toISOString() : null,
                max_uses: parseInt(maxUses) || 1,
                note: note
            });
            
            if (result.key) {
                closeModal('create-key-modal');
                showAlert(`Key created: ${result.key.key_value}`, 'success');
                
                // Copy to clipboard
                navigator.clipboard.writeText(result.key.key_value);
                
                if (currentSection === 'dashboard') {
                    loadRecentKeys();
                } else {
                    loadKeys();
                }
                loadStats();
            } else {
                showAlert(result.error || 'Failed to create key', 'error');
            }
        });
    }
    
    // Bulk create form
    const bulkCreateForm = document.getElementById('bulk-create-form');
    if (bulkCreateForm) {
        bulkCreateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const count = document.getElementById('bulk-count').value;
            const expires = document.getElementById('bulk-expires').value;
            const maxUses = document.getElementById('bulk-max-uses').value;
            
            const result = await API.bulkCreateKeys({
                count: parseInt(count),
                expires_at: expires ? new Date(expires).toISOString() : null,
                max_uses: parseInt(maxUses) || 1
            });
            
            if (result.keys) {
                closeModal('bulk-create-modal');
                showAlert(`${result.keys.length} keys created successfully`, 'success');
                
                // Show keys in a list
                const keysList = result.keys.map(k => k.key_value).join('\n');
                if (confirm('Copy all keys to clipboard?')) {
                    navigator.clipboard.writeText(keysList);
                }
                
                if (currentSection === 'dashboard') {
                    loadRecentKeys();
                } else {
                    loadKeys();
                }
                loadStats();
            } else {
                showAlert(result.error || 'Failed to create keys', 'error');
            }
        });
    }
    
    // Edit key form
    const editKeyForm = document.getElementById('edit-key-form');
    if (editKeyForm) {
        editKeyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const id = document.getElementById('edit-key-id').value;
            const status = document.getElementById('edit-key-status').value;
            const note = document.getElementById('edit-key-note').value;
            
            const result = await API.updateKey(id, { status, note });
            
            if (result.key) {
                closeModal('edit-key-modal');
                showAlert('Key updated', 'success');
                loadKeys();
            } else {
                showAlert(result.error || 'Failed to update', 'error');
            }
        });
    }
}

// Helper functions
function copyKey(key) {
    navigator.clipboard.writeText(key);
    showAlert('Key copied to clipboard', 'success');
}

async function editKey(id) {
    // Get key details
    const result = await API.getKeys({ search: '' });
    const key = result.keys?.find(k => k.id === id);
    
    if (key) {
        document.getElementById('edit-key-id').value = key.id;
        document.getElementById('edit-key-value').value = key.key_value;
        document.getElementById('edit-key-status').value = key.status;
        document.getElementById('edit-key-note').value = key.note || '';
        openModal('edit-key-modal');
    } else {
        // Fallback to prompt
        const newStatus = prompt('Enter new status (active, disabled, banned):');
        if (newStatus && ['active', 'disabled', 'banned'].includes(newStatus)) {
            const result = await API.updateKey(id, { status: newStatus });
            if (result.key) {
                showAlert('Key updated', 'success');
                loadKeys();
            } else {
                showAlert(result.error || 'Failed to update', 'error');
            }
        }
    }
}

async function resetHWID(id) {
    if (confirm('Reset HWID for this key? This will allow it to be used on a new device.')) {
        const result = await API.resetHWID(id);
        if (result.key) {
            showAlert('HWID reset successfully', 'success');
            loadKeys();
        } else {
            showAlert(result.error || 'Failed to reset HWID', 'error');
        }
    }
}

async function deleteKey(id) {
    if (confirm('Are you sure you want to delete this key? This cannot be undone.')) {
        const result = await API.deleteKey(id);
        if (!result.error) {
            showAlert('Key deleted', 'success');
            loadKeys();
            loadStats();
        } else {
            showAlert(result.error || 'Failed to delete', 'error');
        }
    }
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    // Reset forms
    const form = document.querySelector(`#${id} form`);
    if (form) form.reset();
}

function showAlert(message, type) {
    const container = document.getElementById('alert-container');
    if (!container) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    container.appendChild(alert);
    
    setTimeout(() => alert.remove(), 5000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function logout() {
    Auth.logout();
}
