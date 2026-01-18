// RANSXM Dashboard

let currentPage = 1;
let currentSearch = '';
let currentStatus = '';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.requireAuth()) return;
    if (!Auth.requireAdmin()) return;
    
    setupUI();
    await loadStats();
    await loadKeys();
    setupEventListeners();
});

function setupUI() {
    const user = Auth.getUser();
    
    // Set user info in sidebar
    document.getElementById('user-name').textContent = user.email.split('@')[0];
    document.getElementById('user-role').textContent = user.role.toUpperCase();
    document.getElementById('user-initial').textContent = user.email[0].toUpperCase();
}

async function loadStats() {
    const result = await API.getStats();
    
    if (result.stats) {
        document.getElementById('stat-total-keys').textContent = result.stats.totalKeys;
        document.getElementById('stat-active-keys').textContent = result.stats.activeKeys;
        document.getElementById('stat-total-users').textContent = result.stats.totalUsers;
        document.getElementById('stat-today-validations').textContent = result.stats.todayValidations;
    }
}

async function loadKeys() {
    const container = document.getElementById('keys-table-body');
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
        document.getElementById('page-info').textContent = `Page ${result.page} of ${result.totalPages}`;
        document.getElementById('prev-btn').disabled = result.page <= 1;
        document.getElementById('next-btn').disabled = result.page >= result.totalPages;
    } else {
        container.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <h3>No keys found</h3>
                        <p>Create your first key to get started</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

function setupEventListeners() {
    // Search
    document.getElementById('search-input').addEventListener('input', debounce((e) => {
        currentSearch = e.target.value;
        currentPage = 1;
        loadKeys();
    }, 300));
    
    // Status filter
    document.getElementById('status-filter').addEventListener('change', (e) => {
        currentStatus = e.target.value;
        currentPage = 1;
        loadKeys();
    });
    
    // Pagination
    document.getElementById('prev-btn').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadKeys();
        }
    });
    
    document.getElementById('next-btn').addEventListener('click', () => {
        currentPage++;
        loadKeys();
    });
    
    // Create key modal
    document.getElementById('create-key-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const expires = document.getElementById('key-expires').value;
        const maxUses = document.getElementById('key-max-uses').value;
        
        const result = await API.createKey({
            expires_at: expires ? new Date(expires).toISOString() : null,
            max_uses: parseInt(maxUses) || 1
        });
        
        if (result.key) {
            closeModal('create-key-modal');
            showAlert(`Key created: ${result.key.key_value}`, 'success');
            loadKeys();
            loadStats();
        } else {
            showAlert(result.error || 'Failed to create key', 'error');
        }
    });
    
    // Bulk create form
    document.getElementById('bulk-create-form').addEventListener('submit', async (e) => {
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
            
            loadKeys();
            loadStats();
        } else {
            showAlert(result.error || 'Failed to create keys', 'error');
        }
    });
}

// Helper functions
function copyKey(key) {
    navigator.clipboard.writeText(key);
    showAlert('Key copied to clipboard', 'success');
}

async function editKey(id) {
    // For now, just toggle status
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

async function resetHWID(id) {
    if (confirm('Reset HWID for this key?')) {
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
    if (confirm('Are you sure you want to delete this key?')) {
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

