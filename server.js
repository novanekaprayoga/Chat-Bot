require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database
const dbPath = path.join(__dirname, 'chatbot.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('✅ Database connected');
        initializeDatabase();
    }
});

// Promise wrapper for database operations
const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
};

const dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

// Create tables if not exist
async function initializeDatabase() {
    try {
        await dbRun(`
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                title TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                message_count INTEGER DEFAULT 0
            )
        `);

        await dbRun(`
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                sender TEXT NOT NULL,
                content TEXT NOT NULL,
                markdown_content TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id)
            )
        `);

        console.log('✅ Database tables initialized');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));
app.use(express.static(__dirname));

// Environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ============ HEALTH & CONFIG ============

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Chatbot backend is running',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/config', (req, res) => {
    res.json({
        hasOpenAI: !!OPENAI_API_KEY,
        hasGroq: !!GROQ_API_KEY,
        timestamp: new Date().toISOString()
    });
});

// ============ CONVERSATIONS ============

// Get all conversations
app.get('/api/conversations', async (req, res) => {
    try {
        const conversations = await dbAll(`
            SELECT id, title, created_at, updated_at, message_count 
            FROM conversations 
            ORDER BY updated_at DESC
        `);
        
        res.json({ success: true, data: conversations || [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new conversation
app.post('/api/conversations', async (req, res) => {
    try {
        const { title } = req.body;
        const id = uuidv4();
        
        await dbRun(`
            INSERT INTO conversations (id, title) 
            VALUES (?, ?)
        `, [id, title || 'New Chat']);
        
        res.json({ success: true, id, title: title || 'New Chat' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get conversation with messages
app.get('/api/conversations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const conversation = await dbGet(`
            SELECT * FROM conversations WHERE id = ?
        `, [id]);
        
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        
        const messages = await dbAll(`
            SELECT id, sender, content, markdown_content, created_at 
            FROM messages 
            WHERE conversation_id = ? 
            ORDER BY created_at ASC
        `, [id]);
        
        res.json({ success: true, conversation, messages: messages || [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete conversation
app.delete('/api/conversations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await dbRun('DELETE FROM messages WHERE conversation_id = ?', [id]);
        await dbRun('DELETE FROM conversations WHERE id = ?', [id]);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ MESSAGES ============

// Add message to conversation
app.post('/api/conversations/:id/messages', async (req, res) => {
    try {
        const { id: conversationId } = req.params;
        const { sender, content, markdown_content } = req.body;
        const messageId = uuidv4();
        
        await dbRun(`
            INSERT INTO messages (id, conversation_id, sender, content, markdown_content) 
            VALUES (?, ?, ?, ?, ?)
        `, [messageId, conversationId, sender, content, markdown_content]);
        
        // Update conversation updated_at and message_count
        const count = await dbGet(`
            SELECT COUNT(*) as cnt FROM messages WHERE conversation_id = ?
        `, [conversationId]);
        
        await dbRun(`
            UPDATE conversations 
            SET updated_at = CURRENT_TIMESTAMP, message_count = ?
            WHERE id = ?
        `, [count.cnt, conversationId]);
        
        res.json({ success: true, id: messageId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search messages
app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.length < 2) {
            return res.json({ success: true, data: [] });
        }
        
        const results = await dbAll(`
            SELECT m.*, c.title as conversation_title
            FROM messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE m.content LIKE ? OR c.title LIKE ?
            ORDER BY m.created_at DESC
            LIMIT 50
        `, [`%${q}%`, `%${q}%`]);
        
        res.json({ success: true, data: results || [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export chat
app.get('/api/conversations/:id/export', async (req, res) => {
    try {
        const { id } = req.params;
        const { format } = req.query;
        
        const conversation = await dbGet(`
            SELECT * FROM conversations WHERE id = ?
        `, [id]);
        
        const messages = await dbAll(`
            SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC
        `, [id]);
        
        if (format === 'json') {
            res.json({ conversation, messages });
        } else {
            // Default: Text format
            let text = `Chat: ${conversation.title}\nCreated: ${conversation.created_at}\n\n`;
            (messages || []).forEach(msg => {
                text += `[${msg.sender.toUpperCase()}] ${new Date(msg.created_at).toLocaleString('id-ID')}\n`;
                text += msg.content + '\n\n';
            });
            
            res.type('text/plain').send(text);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ CHAT API ============

// Enhanced local responses dengan context awareness
const enhancedBotResponses = {
    greeting: [
        'Halo! Senang bertemu Anda! 👋',
        'Assalamualaikum! Ada yang bisa dibantu?',
        'Malam! Bagaimana kabar Anda hari ini?',
        'Hei! Apa kabar? 😊'
    ],
    goodbye: [
        'Sampai jumpa! Terima kasih telah berbincang 👋',
        'Goodbye! Senang mengobrol dengan Anda!',
        'Sampai ketemu lagi! Semoga harimu menyenangkan! 😊'
    ],
    help: [
        'Saya bisa membantu Anda dengan:\n• Menjawab pertanyaan\n• Chat santai\n• Info waktu & tanggal\n• Dan banyak hal lainnya! 🎉',
        'Apa yang bisa saya bantu? Tanyakan apapun! 😊'
    ],
    joke: [
        '😄 Apa bedanya programmer dengan dunia nyata? Di dunia nyata, orang pikir kamu jenius kalau kamu pakai Google. Di programming, orang pikir kamu bego kalau kamu TIDAK pakai Google!',
        '🎭 Kenapa programmer selalu merasa sendirian? Karena mereka selalu dalam 1 loop tak terbatas!',
        '💻 Berapa programmer yang butuh untuk ganti bohlam? Bukan masalah programmer-nya, tapi masalah hardware!'
    ],
    default: [
        'Menarik! Bisa jelaskan lebih lanjut?',
        'Oh gitu... Punya pertanyaan lain? 🤔',
        'Interesting! Ada yang ingin dibicarakan lagi?',
        'Aku paham. Apa yang bisa saya bantu lagi?'
    ]
};

function detectIntent(message) {
    const lower = message.toLowerCase();

    if (lower.match(/(halo|hi|hey|assalamualaikum|pagi|sore|malam|hiya)/i)) {
        return 'greeting';
    }
    if (lower.match(/(bye|goodbye|dada|sampai jumpa|sampai ketemu|see you|selamat tinggal|farewell)/i)) {
        return 'goodbye';
    }
    if (lower.match(/(bantuan|help|apa yang bisa|apa yang bisa kamu|gimana caranya)/i)) {
        return 'help';
    }
    if (lower.match(/(joke|lawak|bercanda|humor|lucu)/i)) {
        return 'joke';
    }
    if (lower.match(/(jam berapa|sekarang jam|waktu sekarang|jam|pukul)/i)) {
        return 'time';
    }
    if (lower.match(/(tanggal berapa|hari ini tanggal|tanggal sekarang|tanggal|hari berapa|bulan apa)/i)) {
        return 'date';
    }
    if (lower.match(/(siapa|nama|siapa kamu|kamu siapa)/i)) {
        return 'name';
    }
    
    return 'default';
}

function getRandomResponse(intent) {
    const responses = {
        ...enhancedBotResponses,
        time: [`Jam sekarang adalah ${getCurrentTime()}`],
        date: [`Tanggal hari ini adalah ${getCurrentDate()}`],
        name: ['Nama saya ChatBot AI, asisten digital Anda! 🤖']
    };
    
    const items = responses[intent] || responses.default;
    return items[Math.floor(Math.random() * items.length)];
}

function getCurrentTime() {
    return new Date().toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
}

function getCurrentDate() {
    return new Date().toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Local chat endpoint
app.post('/api/chat/local', (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message diperlukan' });
        }

        const intent = detectIntent(message);
        const response = getRandomResponse(intent);
        
        res.json({
            success: true,
            message: response,
            intent
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// OpenAI endpoint
app.post('/api/chat/openai', async (req, res) => {
    try {
        if (!OPENAI_API_KEY) {
            return res.status(400).json({ 
                error: 'OpenAI API key tidak dikonfigurasi di server' 
            });
        }

        const { message, model = 'gpt-3.5-turbo', temperature = 0.7 } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message diperlukan' });
        }

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model,
                messages: [
                    {
                        role: 'system',
                        content: 'Anda adalah chatbot yang helpful, friendly, dan berbahasa Indonesia. Jawab pertanyaan dengan singkat dan jelas.'
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                temperature,
                max_tokens: 500
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json({
            success: true,
            message: response.data.choices[0].message.content,
            usage: response.data.usage
        });
    } catch (error) {
        console.error('OpenAI Error:', error.response?.data || error.message);
        res.status(500).json({
            error: error.response?.data?.error?.message || 'Gagal menghubungi OpenAI API'
        });
    }
});

// Groq endpoint
app.post('/api/chat/groq', async (req, res) => {
    try {
        if (!GROQ_API_KEY) {
            return res.status(400).json({ 
                error: 'Groq API key tidak dikonfigurasi di server' 
            });
        }

        const { message, model = 'llama-3.3-70b-versatile', temperature = 0.7 } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message diperlukan' });
        }

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model,
                messages: [
                    {
                        role: 'system',
                        content: 'Anda adalah chatbot yang helpful, friendly, dan berbahasa Indonesia. Jawab pertanyaan dengan singkat dan jelas.'
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                temperature,
                max_tokens: 500
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json({
            success: true,
            message: response.data.choices[0].message.content,
            usage: response.data.usage
        });
    } catch (error) {
        console.error('Groq Error:', error.response?.data || error.message);
        res.status(500).json({
            error: error.response?.data?.error?.message || 'Gagal menghubungi Groq API'
        });
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Chatbot backend berjalan di http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`⚙️  Config check: http://localhost:${PORT}/api/config`);
    
    if (!OPENAI_API_KEY && !GROQ_API_KEY) {
        console.warn('⚠️  WARNING: Tidak ada API key yang dikonfigurasi!');
        console.warn('   Set OPENAI_API_KEY atau GROQ_API_KEY di file .env');
    }
});
