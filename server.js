require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Chatbot backend is running',
        timestamp: new Date().toISOString()
    });
});

// Check API Keys endpoint (for frontend)
app.get('/api/config', (req, res) => {
    res.json({
        hasOpenAI: !!OPENAI_API_KEY,
        hasGroq: !!GROQ_API_KEY,
        timestamp: new Date().toISOString()
    });
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
