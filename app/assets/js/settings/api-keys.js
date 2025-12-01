/**
 * API Keys Management
 */

import { getSupabaseClient, getAuthToken } from '../auth.js';

let apiKeys = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadAPIKeys();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('create-key-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await createAPIKey();
    });
}

async function loadAPIKeys() {
    try {
        const client = await getSupabaseClient();
        if (!client) {
            document.getElementById('api-keys-list').innerHTML = 
                '<p style="color: rgba(255, 255, 255, 0.7);">Database not available.</p>';
            return;
        }

        const { data: { user } } = await client.auth.getUser();
        if (!user) {
            window.location.href = '/app/login.html';
            return;
        }

        const { data: keys, error } = await client
            .from('api_keys')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        apiKeys = keys || [];
        renderAPIKeys();
    } catch (error) {
        console.error('Error loading API keys:', error);
        document.getElementById('api-keys-list').innerHTML = 
            '<p style="color: #ef4444;">Failed to load API keys.</p>';
    }
}

function renderAPIKeys() {
    const list = document.getElementById('api-keys-list');
    if (!list) return;

    if (apiKeys.length === 0) {
        list.innerHTML = '<p style="color: rgba(255, 255, 255, 0.7);">No API keys created yet.</p>';
        return;
    }

    list.innerHTML = apiKeys.map(key => {
        const createdDate = new Date(key.created_at).toLocaleDateString();
        const expiresDate = key.expires_at ? new Date(key.expires_at).toLocaleDateString() : 'Never';
        const lastUsed = key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never';
        const isExpired = key.expires_at && new Date(key.expires_at) < new Date();

        return `
            <div class="api-key-item">
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 0.5rem 0; color: #ffffff;">${escapeHtml(key.name)}</h3>
                    <div class="api-key-value">${key.key}</div>
                    <div style="margin-top: 0.5rem; font-size: 0.875rem; color: rgba(255, 255, 255, 0.7);">
                        Created: ${createdDate} | Expires: ${expiresDate} | Last Used: ${lastUsed}
                        ${isExpired ? ' | <span style="color: #ef4444;">EXPIRED</span>' : ''}
                        ${!key.active ? ' | <span style="color: #ef4444;">INACTIVE</span>' : ''}
                    </div>
                    <div style="margin-top: 0.5rem; font-size: 0.875rem; color: rgba(255, 255, 255, 0.7);">
                        Rate Limit: ${key.rate_limit} req/min
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-danger btn-small" onclick="revokeKey('${key.id}')" style="padding: 0.5rem 1rem;">
                        ${key.active ? 'Revoke' : 'Delete'}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Attach copy handlers
    document.querySelectorAll('.api-key-value').forEach(el => {
        el.style.cursor = 'pointer';
        el.title = 'Click to copy';
        el.addEventListener('click', () => {
            const text = el.textContent;
            navigator.clipboard.writeText(text).then(() => {
                const original = el.textContent;
                el.textContent = 'Copied!';
                setTimeout(() => {
                    el.textContent = original;
                }, 2000);
            });
        });
    });
}

async function createAPIKey() {
    try {
        const name = document.getElementById('key-name').value;
        const rateLimit = parseInt(document.getElementById('rate-limit').value) || 100;
        const expiresAt = document.getElementById('expires-at').value || null;

        if (!name) {
            alert('Please enter a key name');
            return;
        }

        const client = await getSupabaseClient();
        if (!client) {
            alert('Database not available');
            return;
        }

        const { data: { user } } = await client.auth.getUser();
        if (!user) {
            window.location.href = '/app/login.html';
            return;
        }

        // Generate API key
        const key = `cn_${generateRandomString(32)}`;

        const { data: newKey, error } = await client
            .from('api_keys')
            .insert({
                user_id: user.id,
                key: key,
                name: name,
                rate_limit: rateLimit,
                expires_at: expiresAt,
                active: true
            })
            .select()
            .single();

        if (error) throw error;

        // Show key to user (only time it's visible)
        const keyDisplay = prompt(
            'API Key Created!\n\nCopy this key now - you will not be able to see it again:\n\n' + key,
            key
        );

        hideCreateModal();
        await loadAPIKeys();
    } catch (error) {
        console.error('Error creating API key:', error);
        alert('Failed to create API key: ' + error.message);
    }
}

window.revokeKey = async function(keyId) {
    if (!confirm('Are you sure you want to revoke this API key? It will stop working immediately.')) {
        return;
    }

    try {
        const client = await getSupabaseClient();
        if (!client) {
            alert('Database not available');
            return;
        }

        const { data: { user } } = await client.auth.getUser();
        if (!user) return;

        const { error } = await client
            .from('api_keys')
            .update({ active: false })
            .eq('id', keyId)
            .eq('user_id', user.id);

        if (error) throw error;

        await loadAPIKeys();
    } catch (error) {
        console.error('Error revoking API key:', error);
        alert('Failed to revoke API key: ' + error.message);
    }
};

window.showCreateModal = function() {
    document.getElementById('create-modal').classList.add('active');
    document.getElementById('key-name').value = '';
    document.getElementById('rate-limit').value = '100';
    document.getElementById('expires-at').value = '';
};

window.hideCreateModal = function() {
    document.getElementById('create-modal').classList.remove('active');
};

function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


