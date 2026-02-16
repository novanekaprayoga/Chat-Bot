# 🔐 Setup Chatbot dengan Backend Secure

Panduan lengkap untuk setup chatbot dengan API key yang aman menggunakan environment variables di backend.

## 🚀 Quick Start

### Step 1: Install Dependencies
```bash
cd "c:\Users\novan\OneDrive\Desktop\chat bot"
npm install
```

### Step 2: Setup Environment Variables
1. Copy file `.env.example` menjadi `.env`:
```bash
copy .env.example .env
```

2. Buka file `.env` dan masukkan API key:
```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
# atau
GROQ_API_KEY=gsk-xxxxxxxxxxxxx
```

### Step 3: Jalankan Backend Server
```bash
npm start
```
Server akan berjalan di `http://localhost:5000`

### Step 4: Jalankan Frontend
Di terminal lain:
```bash
python -m http.server 8000
```
Akses chatbot di `http://localhost:8000`

---

## 📋 Persyaratan

- **Node.js** (v14+) - Download dari https://nodejs.org
- **Python 3** - Untuk menjalankan HTTP server (atau gunakan live server)
- **API Key** dari OpenAI atau Groq (opsional, untuk mode non-local)

---

## 🔑 Dapatkan API Key

### OpenAI (Berbayar, tapi ada trial)
1. Buat akun: https://platform.openai.com/signup
2. Go to: https://platform.openai.com/account/api-keys
3. Generate API key baru
4. Copy ke file `.env`: `OPENAI_API_KEY=sk-...`

Harga: Mulai dari $0.0005 per 1K tokens

### Groq (GRATIS! 🎉)
1. Buat akun: https://console.groq.com/keys
2. Generate API key
3. Copy ke file `.env`: `GROQ_API_KEY=gsk-...`

Gratis unlimited untuk development!

---

## 📁 Struktur Project

```
chat bot/
├── index.html          # Frontend HTML
├── style.css           # Styling
├── script.js           # Frontend JavaScript
├── server.js           # Backend Express server
├── package.json        # Dependencies
├── .env                # Environment variables (JANGAN COMMIT!)
├── .env.example        # Template (aman untuk commit)
├── .gitignore          # Ignore .env
└── README.md           # Dokumentasi
```

---

## 🔒 Security Features

✅ **API Key di Backend** - Tidak expose ke frontend/browser
✅ **Environment Variables** - Aman di file `.env`
✅ **CORS Protection** - Backend hanya terima dari localhost
✅ **No Hardcoding** - API key tidak di source code

---

## 🛠️ API Endpoints

### Backend Endpoints

#### Health Check
```
GET http://localhost:5000/api/health
```

#### Check Available APIs
```
GET http://localhost:5000/api/config
```
Response:
```json
{
  "hasOpenAI": true,
  "hasGroq": false,
  "timestamp": "2024-02-15T10:30:00.000Z"
}
```

#### Chat with OpenAI
```
POST http://localhost:5000/api/chat/openai
Content-Type: application/json

{
  "message": "Halo, apa kabar?",
  "model": "gpt-3.5-turbo",
  "temperature": 0.7
}
```

#### Chat with Groq
```
POST http://localhost:5000/api/chat/groq
Content-Type: application/json

{
  "message": "Halo, apa kabar?",
  "model": "llama-3.1-70b-versatile",
  "temperature": 0.7
}
```

---

## 🎯 Mode Penggunaan

### 1. Local Mode (Default)
- Tidak butuh API key
- Responses dari lokal database
- Instant, tidak ada delay

### 2. OpenAI Mode
- Butuh: `OPENAI_API_KEY` di `.env`
- Pilih model: GPT-3.5, GPT-4, GPT-4 Turbo
- Response lebih smart dan natural
- Berbayar

### 3. Groq Mode
- Butuh: `GROQ_API_KEY` di `.env`
- Pilih model: Llama 3.1, Mixtral, dll
- Response cepat
- GRATIS untuk development

---

## 🐛 Troubleshooting

### Masalah: "Gagal terhubung ke backend"

**Solusi:**
1. Pastikan backend server berjalan: `npm start`
2. Cek port 5000 tidak terpakai: `netstat -ano | findstr 5000`
3. Reload halaman browser (Ctrl+Shift+R)

### Masalah: "API key tidak dikonfigurasi"

**Solusi:**
1. Buka file `.env`
2. Pastikan ada `OPENAI_API_KEY=sk-...` atau `GROQ_API_KEY=gsk-...`
3. Restart server: `npm start`

### Masalah: "npm: command not found"

**Solusi:**
1. Install Node.js dari https://nodejs.org
2. Restart terminal
3. Cek: `node --version`

### Masalah: Port 5000 sudah terpakai

**Solusi:**
```bash
# Ubah port di .env
PORT=5001

# Atau kill process yang menggunakan port 5000
netstat -ano | findstr 5000
taskkill /PID <PID> /F
```

---

## 🚀 Deploy (Production)

Untuk production, gunakan:
- **Vercel/Netlify** untuk frontend
- **Heroku/Railway/Render** untuk backend
- **Set environment variables** di platform hosting

Contoh untuk Heroku:
```bash
heroku config:set OPENAI_API_KEY=sk-...
```

---

## 📝 Notes

- Jangan commit file `.env` ke Git (sudah di `.gitignore`)
- Jangan share API key dengan siapa pun
- Pantau penggunaan API di dashboard provider
- Update dependencies secara berkala: `npm update`

---

## 🤝 Support

Jika ada masalah:
1. Cek console browser (F12)
2. Cek server logs (terminal)
3. Baca error message dengan teliti
4. Coba restart browser & server

Enjoy! 🎉
