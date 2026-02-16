// Configuration
let chatbotConfig = {
    apiProvider: localStorage.getItem('apiProvider') || 'local',
    model: localStorage.getItem('model') || 'gpt-3.5-turbo',
    temperature: parseFloat(localStorage.getItem('temperature')) || 0.7,
    backendURL: 'http://localhost:5000' // Backend server URL
};

// Responses database for local mode
const botResponses = {
    greeting: [
        'Halo! Apa kabar?',
        'Halooo! 👋 Senang bertemu Anda!',
        'Hi there! Bagaimana kabarnya?'
    ],
    goodbye: [
        'Sampai jumpa! Terima kasih telah berbincang.',
        'Goodbye! Senang mengobrol dengan Anda. 👋',
        'Sampai jumpa lagi! Have a great day! 😊'
    ],
    help: [
        'Saya bisa membantu Anda dengan berbagai pertanyaan. Silakan tanya apapun!',
        'Anda bisa bertanya tentang apapun. Saya di sini untuk membantu!',
        'Ada yang bisa saya bantu? Tanya saja! 😊'
    ],
    name: [
        'Nama saya adalah ChatBot. Senang berkenalan dengan Anda!',
        'Saya adalah ChatBot, asisten digital Anda.',
        'Panggil saja saya ChatBot! 🤖'
    ],
    time: [
        `Jam sekarang adalah ${getCurrentTime()}`,
        `Waktu saat ini: ${getCurrentTime()}`,
        `Sekarang jam ${getCurrentTime()}`
    ],
    date: [
        `Tanggal hari ini adalah ${getCurrentDate()}`,
        `Hari ini adalah ${getCurrentDate()}`,
        `Tanggalnya: ${getCurrentDate()}`
    ],
    default: [
        'Menarik! Bisa jelaskan lebih lanjut?',
        'Ohhh gitu... Ada yang ingin Anda tanyakan lagi?',
        'Saya mengerti. Apakah ada yang bisa saya bantu?',
        'Interesting! 🤔 Apa lagi yang ingin dibicarakan?',
        'Gotcha! Ada pertanyaan lain?'
    ]
};

// Get current time
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
}

// Get current date
function getCurrentDate() {
    const now = new Date();
    return now.toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Detect user intent
function detectIntent(message) {
    const lower = message.toLowerCase();

    if (lower.match(/(halo|hi|hey|assalamualaikum|pagi|sore|malam)/)) {
        return 'greeting';
    }
    if (lower.match(/(bye|goodbye|dada|sampai jumpa|sampai ketemu|see you|selamat tinggal)/)) {
        return 'goodbye';
    }
    if (lower.match(/(bantuan|help|apa yang bisa|apa yang bisa kamu)/)) {
        return 'help';
    }
    if (lower.match(/(siapa|nama|siapa kamu|kamu siapa|nama.*(mu|kamu))/)) {
        return 'name';
    }
    if (lower.match(/(jam berapa|sekarang jam|waktu sekarang|jam)/)) {
        return 'time';
    }
    if (lower.match(/(tanggal berapa|hari ini tanggal|tanggal sekarang|tanggal|hari berapa)/)) {
        return 'date';
    }
    
    return 'default';
}

// Get random response
function getRandomResponse(intent) {
    const responses = botResponses[intent] || botResponses.default;
    return responses[Math.floor(Math.random() * responses.length)];
}

// Call OpenAI API via Backend
async function callOpenAIAPI(message) {
    try {
        const response = await fetch(`${chatbotConfig.backendURL}/api/chat/openai`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                model: chatbotConfig.model,
                temperature: chatbotConfig.temperature
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return `⚠️ Error: ${data.error || 'Unknown error'}`;
        }

        return data.message;
    } catch (error) {
        return `❌ Gagal terhubung ke backend: ${error.message}. Pastikan server berjalan di http://localhost:5000`;
    }
}

// Call Groq API via Backend
async function callGroqAPI(message) {
    try {
        const response = await fetch(`${chatbotConfig.backendURL}/api/chat/groq`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                model: chatbotConfig.model,
                temperature: chatbotConfig.temperature
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return `⚠️ Error: ${data.error || 'Unknown error'}`;
        }

        return data.message;
    } catch (error) {
        return `❌ Gagal terhubung ke backend: ${error.message}. Pastikan server berjalan di http://localhost:5000`;
    }
}

// Get bot response
async function getBotResponse(message) {
    if (chatbotConfig.apiProvider === 'openai') {
        return await callOpenAIAPI(message);
    } else if (chatbotConfig.apiProvider === 'groq') {
        return await callGroqAPI(message);
    } else {
        // Local mode
        const intent = detectIntent(message);
        return getRandomResponse(intent);
    }
}

// Add message to chat
function addMessage(text, isUser) {
    const messageClass = isUser ? 'user-message' : 'bot-message';
    const messageHtml = `
        <div class="message ${messageClass}">
            <div class="message-content">
                <p>${escapeHtml(text)}</p>
            </div>
        </div>
    `;
    
    $('#chatMessages').append(messageHtml);
    scrollToBottom();
}

// Escape HTML to prevent XSS
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

// Scroll to bottom of chat
function scrollToBottom() {
    const chatMessages = $('#chatMessages');
    chatMessages.scrollTop(chatMessages[0].scrollHeight);
}

// Show loading spinner
function showLoading() {
    $('#loadingSpinner').removeClass('d-none');
    $('#sendBtnText').text('Menunggu...');
    $('#sendBtn').prop('disabled', true);
}

// Hide loading spinner
function hideLoading() {
    $('#loadingSpinner').addClass('d-none');
    $('#sendBtnText').text('Kirim');
    $('#sendBtn').prop('disabled', false);
}

// Send message
async function sendMessage() {
    const userInput = $('#userInput').val().trim();
    
    if (userInput === '') return;
    
    // Add user message
    addMessage(userInput, true);
    
    // Clear input
    $('#userInput').val('');
    
    // Show loading
    showLoading();
    
    // Get bot response
    const botResponse = await getBotResponse(userInput);
    
    // Hide loading
    hideLoading();
    
    // Add bot message
    addMessage(botResponse, false);
}

// jQuery ready
$(document).ready(function() {
    // Load settings
    loadSettings();

    // Send button click
    $('#sendBtn').click(function() {
        sendMessage();
    });
    
    // Enter key to send
    $('#userInput').keypress(function(e) {
        if (e.which === 13 && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // API Provider change
    $('#apiProvider').change(function() {
        // No longer need to show/hide API key field
        // since API keys are managed in backend via .env
    });

    // Temperature slider
    $('#temperatureSlider').on('input', function() {
        $('#tempValue').text($(this).val());
    });

    // Save settings button
    $('#saveSettingsBtn').click(function() {
        saveSettings();
    });
    
    // Focus input on load
    $('#userInput').focus();
});

// Load settings from localStorage
function loadSettings() {
    $('#apiProvider').val(chatbotConfig.apiProvider);
    $('#modelSelect').val(chatbotConfig.model);
    $('#temperatureSlider').val(chatbotConfig.temperature);
    $('#tempValue').text(chatbotConfig.temperature);
}

// Save settings to localStorage
function saveSettings() {
    chatbotConfig.apiProvider = $('#apiProvider').val();
    chatbotConfig.model = $('#modelSelect').val();
    chatbotConfig.temperature = parseFloat($('#temperatureSlider').val());

    localStorage.setItem('apiProvider', chatbotConfig.apiProvider);
    localStorage.setItem('model', chatbotConfig.model);
    localStorage.setItem('temperature', chatbotConfig.temperature);

    // Show success message
    alert('⚙️ Pengaturan berhasil disimpan!');
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
    if (modal) {
        modal.hide();
    }
}
