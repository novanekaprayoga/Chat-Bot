// ==================== ADVANCED CHATBOT SYSTEM ====================
// Dengan: Conversations, Chat History, Markdown, Typing Indicator, Search, Export

// Configuration
let chatbotConfig = {
    apiProvider: localStorage.getItem('apiProvider') || 'local',
    model: localStorage.getItem('model') || 'gpt-3.5-turbo',
    temperature: parseFloat(localStorage.getItem('temperature')) || 0.7,
    backendURL: 'http://localhost:5000',
    currentConversationId: localStorage.getItem('currentConversationId') || null
};

// Load marked library for markdown support
const markdownConfig = {
    breaks: true,
    gfm: true
};

// Escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Format markdown or escape HTML
function formatMessage(text) {
    try {
        // If marked is available, use it
        if (typeof marked !== 'undefined') {
            return marked.parse(escapeHtml(text));
        }
    } catch (e) {
        console.warn('Markdown parsing failed, using plain text');
    }
    return `<p>${escapeHtml(text)}</p>`;
}

// ==================== CONVERSATION MANAGEMENT ====================

async function loadConversations() {
    try {
        const res = await fetch(`${chatbotConfig.backendURL}/api/conversations`);
        const data = await res.json();
        
        if (data.success) {
            renderConversationsList(data.data);
        }
    } catch (error) {
        console.error('Error loading conversations:', error);
    }
}

function renderConversationsList(conversations) {
    const list = document.getElementById('conversationsList');
    list.innerHTML = '';
    
    conversations.forEach(conv => {
        const div = document.createElement('div');
        div.className = 'conversation-item' + (chatbotConfig.currentConversationId === conv.id ? ' active' : '');
        div.innerHTML = `
            <div class="conv-info">
                <div class="conv-title">${escapeHtml(conv.title)}</div>
                <div class="conv-meta">${conv.message_count} pesan • ${new Date(conv.updated_at).toLocaleDateString('id-ID')}</div>
            </div>
            <button class="btn-conv-delete" data-id="${conv.id}" title="Hapus">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        div.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-conv-delete')) {
                openConversation(conv.id);
            }
        });
        
        div.querySelector('.btn-conv-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteConversation(conv.id);
        });
        
        list.appendChild(div);
    });
}

async function createNewConversation() {
    try {
        const title = prompt('Nama chat baru:', 'Chat ' + new Date().toLocaleDateString('id-ID'));
        if (!title) return;
        
        const res = await fetch(`${chatbotConfig.backendURL}/api/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        });
        
        const data = await res.json();
        
        if (data.success) {
            chatbotConfig.currentConversationId = data.id;
            localStorage.setItem('currentConversationId', data.id);
            
            await loadConversations();
            openConversation(data.id);
            showNotification('✅ Chat baru dibuat!');
        }
    } catch (error) {
        console.error('Error creating conversation:', error);
        showNotification('❌ Gagal membuat chat baru');
    }
}

async function openConversation(conversationId) {
    try {
        const res = await fetch(`${chatbotConfig.backendURL}/api/conversations/${conversationId}`);
        const data = await res.json();
        
        if (data.success) {
            chatbotConfig.currentConversationId = conversationId;
            localStorage.setItem('currentConversationId', conversationId);
            
            // Update UI
            loadConversations();
            renderMessages(data.messages);
            
            document.getElementById('chatTitle').textContent = data.conversation.title;
            document.getElementById('userInput').focus();
        }
    } catch (error) {
        console.error('Error opening conversation:', error);
        showNotification('❌ Gagal membuka chat');
    }
}

async function deleteConversation(conversationId) {
    if (!confirm('Hapus chat ini? Ini tidak bisa di-undo.')) return;
    
    try {
        await fetch(`${chatbotConfig.backendURL}/api/conversations/${conversationId}`, {
            method: 'DELETE'
        });
        
        loadConversations();
        
        if (chatbotConfig.currentConversationId === conversationId) {
            chatbotConfig.currentConversationId = null;
            localStorage.removeItem('currentConversationId');
            document.getElementById('chatMessages').innerHTML = '';
            document.getElementById('chatTitle').textContent = 'ChatBot AI';
        }
        
        showNotification('✅ Chat dihapus');
    } catch (error) {
        console.error('Error deleting conversation:', error);
    }
}

// ==================== MESSAGE MANAGEMENT ====================

function renderMessages(messages) {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    
    messages.forEach(msg => {
        addMessageToDOM(msg.sender, msg.content, msg.markdown_content, true);
    });
    
    scrollToBottom();
}

function addMessageToDOM(sender, content, markdownContent, isExisting = false) {
    const messageClass = sender === 'user' ? 'user-message' : 'bot-message';
    const div = document.createElement('div');
    div.className = `message ${messageClass}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Use markdown content if available, otherwise format content
    if (markdownContent) {
        contentDiv.innerHTML = markdownContent;
    } else {
        contentDiv.innerHTML = formatMessage(content);
    }
    
    div.appendChild(contentDiv);
    
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.appendChild(div);
    
    if (!isExisting) {
        scrollToBottom();
    }
}

function showTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'message bot-message typing-indicator';
    div.id = 'typingIndicator';
    div.innerHTML = `
        <div class="message-content">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    document.getElementById('chatMessages').appendChild(div);
    scrollToBottom();
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

async function saveMessage(sender, content) {
    if (!chatbotConfig.currentConversationId) {
        await createNewConversation();
    }
    
    try {
        const markdownContent = typeof marked !== 'undefined' ? marked.parse(content) : null;
        
        await fetch(`${chatbotConfig.backendURL}/api/conversations/${chatbotConfig.currentConversationId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender,
                content,
                markdown_content: markdownContent
            })
        });
    } catch (error) {
        console.error('Error saving message:', error);
    }
}

// ==================== CHAT FUNCTIONS ====================

async function getBotResponse(message) {
    const provider = chatbotConfig.apiProvider;
    const url = `${chatbotConfig.backendURL}/api/chat/${provider}`;
    
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                model: chatbotConfig.model,
                temperature: chatbotConfig.temperature
            })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            return `⚠️ Error: ${data.error || 'Unknown error'}`;
        }
        
        return data.message;
    } catch (error) {
        return `❌ Gagal: ${error.message}. Pastikan server berjalan di ${chatbotConfig.backendURL}`;
    }
}

async function sendMessage() {
    const userInput = document.getElementById('userInput');
    const message = userInput.value.trim();
    
    if (!message) return;
    
    // Check if conversation exists, if not create one
    if (!chatbotConfig.currentConversationId) {
        await createNewConversation();
    }
    
    // Add user message
    addMessageToDOM('user', message);
    await saveMessage('user', message);
    
    // Clear input
    userInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Get bot response
    const botResponse = await getBotResponse(message);
    
    // Remove typing indicator
    removeTypingIndicator();
    
    // Add bot message
    addMessageToDOM('bot', botResponse);
    await saveMessage('bot', botResponse);
    
    // Update conversation list
    loadConversations();
}

// ==================== SEARCH & EXPORT ====================

async function searchMessages() {
    const query = document.getElementById('searchInput').value.trim();
    
    if (query.length < 2) {
        showNotification('Minimal 2 karakter untuk search');
        return;
    }
    
    try {
        const res = await fetch(`${chatbotConfig.backendURL}/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        if (data.success) {
            renderSearchResults(data.data);
            document.getElementById('searchModal').style.display = 'block';
        }
    } catch (error) {
        console.error('Error searching:', error);
    }
}

function renderSearchResults(results) {
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = '';
    
    if (results.length === 0) {
        resultsDiv.innerHTML = '<p class="search-no-results">Tidak ada hasil ditemukan</p>';
        return;
    }
    
    results.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.innerHTML = `
            <div class="search-result-title">${escapeHtml(msg.conversation_title)}</div>
            <div class="search-result-content">[${msg.sender}] ${escapeHtml(msg.content.substring(0, 100))}...</div>
            <div class="search-result-date">${new Date(msg.created_at).toLocaleString('id-ID')}</div>
        `;
        
        div.addEventListener('click', () => {
            openConversation(msg.conversation_id);
            document.getElementById('searchModal').style.display = 'none';
        });
        
        resultsDiv.appendChild(div);
    });
}

async function exportCurrentChat(format = 'txt') {
    if (!chatbotConfig.currentConversationId) {
        showNotification('Tidak ada chat yang dipilih');
        return;
    }
    
    try {
        const res = await fetch(
            `${chatbotConfig.backendURL}/api/conversations/${chatbotConfig.currentConversationId}/export?format=${format}`
        );
        
        if (format === 'json') {
            const data = await res.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            downloadBlob(blob, `chat-${new Date().getTime()}.json`);
        } else {
            const text = await res.text();
            const blob = new Blob([text], { type: 'text/plain' });
            downloadBlob(blob, `chat-${new Date().getTime()}.txt`);
        }
        
        showNotification('✅ Chat diexport!');
    } catch (error) {
        console.error('Error exporting:', error);
        showNotification('❌ Gagal export chat');
    }
}

function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// ==================== SETTINGS ====================

function loadSettings() {
    document.getElementById('apiProvider').value = chatbotConfig.apiProvider;
    document.getElementById('modelSelect').value = chatbotConfig.model;
    document.getElementById('temperatureSlider').value = chatbotConfig.temperature;
    document.getElementById('tempValue').textContent = chatbotConfig.temperature;
}

function saveSettings() {
    chatbotConfig.apiProvider = document.getElementById('apiProvider').value;
    chatbotConfig.model = document.getElementById('modelSelect').value;
    chatbotConfig.temperature = parseFloat(document.getElementById('temperatureSlider').value);

    localStorage.setItem('apiProvider', chatbotConfig.apiProvider);
    localStorage.setItem('model', chatbotConfig.model);
    localStorage.setItem('temperature', chatbotConfig.temperature);

    showNotification('✅ Pengaturan disimpan!');
    bootstrap.Modal.getInstance(document.getElementById('settingsModal')).hide();
}

// ==================== UI HELPERS ====================

function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

// ==================== INIT ====================

document.addEventListener('DOMContentLoaded', () => {
    // Load conversations
    loadConversations();
    loadSettings();

    // Event listeners
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('userInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    document.getElementById('newChatBtn').addEventListener('click', createNewConversation);
    
    document.getElementById('temperatureSlider').addEventListener('input', (e) => {
        document.getElementById('tempValue').textContent = e.target.value;
    });

    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    
    document.getElementById('clearChatBtn').addEventListener('click', () => {
        if (confirm('Hapus semua pesan di chat ini?')) {
            document.getElementById('chatMessages').innerHTML = '';
            showNotification('✅ Chat dihapus');
        }
    });

    document.getElementById('searchBtn').addEventListener('click', searchMessages);
    document.getElementById('exportBtn').addEventListener('click', () => {
        exportCurrentChat('txt');
    });

    document.getElementById('toggleSidebarBtn').addEventListener('click', toggleSidebar);
    
    // Focus input
    document.getElementById('userInput').focus();
});
