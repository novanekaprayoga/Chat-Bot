# 💬 Chat Bot dengan Bootstrap & jQuery

Chatbot modern yang dapat menggunakan API LLM atau beroperasi dengan responses lokal.

## 🚀 Fitur Utama

✅ **Mode Lokal** - Menggunakan responses predefined tanpa API key
✅ **OpenAI GPT Integration** - Hubungkan dengan API OpenAI (GPT-3.5, GPT-4, dll)
✅ **Groq API Support** - Gunakan Groq API untuk respons yang cepat
✅ **Konfigurasi Mudah** - Panel pengaturan built-in
✅ **Responsive Design** - Bekerja di desktop dan mobile
✅ **Smooth Animations** - UI dengan animasi yang menarik
✅ **LocalStorage** - Simpan pengaturan otomatis

## 📦 Teknologi

- **Bootstrap 5** - CSS Framework
- **jQuery 3.6** - JavaScript Library
- **HTML5** - Markup
- **CSS3** - Styling
- **Fetch API** - Untuk API calls

## 🔧 Cara Menggunakan

### 1. Mode Lokal (Default)
Bot akan merespons dengan predefined answers berdasarkan intent detection:
- Sapaan: "Halo", "Pagi", "Hi"
- Perpisahan: "Bye", "Sampai jumpa"
- Tanya waktu: "Jam berapa?"
- Tanya tanggal: "Tanggal berapa?"
- Dan lainnya

### 2. Menggunakan OpenAI API

#### Setup:
1. Buat akun di [OpenAI](https://platform.openai.com)
2. Dapatkan API Key dari dashboard
3. Klik tombol **⚙️ Pengaturan** di chatbot
4. Pilih provider: **OpenAI GPT**
5. Masukkan API Key Anda (format: `sk-...`)
6. Pilih model: GPT-3.5 Turbo, GPT-4, atau GPT-4 Turbo
7. Klik **Simpan**

#### Harga OpenAI:
- GPT-3.5 Turbo: $0.0005 per 1K input tokens
- GPT-4: Lebih mahal, lebih powerful

### 3. Menggunakan Groq API

#### Setup:
1. Buat akun di [Groq](https://console.groq.com)
2. Dapatkan API Key
3. Klik tombol **⚙️ Pengaturan** di chatbot
4. Pilih provider: **Groq API**
5. Masukkan API Key Anda (format: `gsk-...`)
6. Pilih model: Llama 3.1, Mixtral, dll
7. Klik **Simpan**

#### Keuntungan Groq:
- **GRATIS** untuk development
- Response sangat cepat
- Model open-source berkualitas tinggi

## 📱 Pengaturan

### API Provider
- **Local** - Tanpa API key, responses lokal
- **OpenAI GPT** - Chat GPT dengan berbagai versi
- **Groq API** - Open-source models gratis

### Model Selection
- GPT-3.5 Turbo (OpenAI)
- GPT-4 (OpenAI)
- GPT-4 Turbo (OpenAI)
- Llama 3.1 70B (Groq)
- Mixtral 8x7B (Groq)

### Temperature
Pengaturan kreativitas (0-2):
- **0** = Deterministic, konsisten
- **0.7** = Balanced (default)
- **2** = Creative, variasi tinggi

## 📁 Struktur File

```
chat bot/
├── index.html      # Struktur HTML
├── style.css       # Styling
├── script.js       # Logika JavaScript
└── README.md       # Dokumentasi
```

## 🌐 Menjalankan Chatbot

### Cara 1: Direct Open (Rekomendasi untuk file lokal)
```bash
# Windows
start index.html
```

### Cara 2: HTTP Server
```bash
# Python 3
python -m http.server 8000

# Kemudian buka: http://localhost:8000
```

### Cara 3: Live Server (VS Code)
```
1. Install extension: Live Server
2. Klik kanan pada index.html
3. Pilih "Open with Live Server"
```

## 🔐 Security Notes

⚠️ **Penting**: Jangan share API key Anda
- API Key disimpan di LocalStorage (hanya browser lokal)
- Tidak dikirim ke server pihak ketiga (kecuali API provider)
- Untuk production, gunakan backend proxy

## 💡 Tips & Tricks

### Dapatkan API Key Gratis:

**Groq (Rekomendasi)**
- Gratis unlimited untuk development
- Response sangat cepat
- Visit: https://console.groq.com

**OpenAI**
- Trial $5 credit (3 bulan)
- https://platform.openai.com

### Customize Bot

Ubah system prompt di `script.js`:
```javascript
role: 'system',
content: 'Anda adalah chatbot yang helpful, friendly, dan berbahasa Indonesia.'
```

Tambah responses lokal di `botResponses` object.

## 🐛 Troubleshooting

### API tidak bekerja?
1. Cek API key (jangan ada spasi)
2. Cek internet connection
3. Cek CORS (OpenAI/Groq harus allow browser)
4. Buka console browser (F12) untuk error details

### Bot tidak merespons?
1. Reload page
2. Clear LocalStorage: Dev Tools → Application → Clear Storage
3. Cek ke mode Local dulu

## 📝 License

Free to use dan modify

## 👨‍💻 Development

Untuk menambah fitur:
1. Edit `botResponses` untuk mode lokal
2. Ubah system prompt untuk AI responses
3. Tambah event listeners sesuai kebutuhan

Enjoy! 🎉

## **GitHub & Deploy**

- **Jangan commit secrets**: Pastikan file `.env` tidak dimasukkan ke repo. `.gitignore` sudah menyertakan `.env`.
- **Menyiapkan repository GitHub**:

```bash
# Di folder project
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

- **Jika push ditolak karena secret scanning**: hapus nilai sensitif dari file yang berisi key (contoh: `.env.example`) lalu `git commit --amend` dan `git push`.
- **Gunakan Personal Access Token (PAT)** untuk autentikasi saat push jika diminta password. Buat PAT di: https://github.com/settings/tokens (berikan scope `repo`).

- **Membuat release/tag** (opsional):

```bash
# Buat tag versi
git tag -a v1.0.0 -m "v1.0.0"
git push origin v1.0.0
```

- **CI / Deployment**: Untuk deploy, simpan secrets di CI (GitHub Actions Secrets) bukan di repo. Gunakan server backend untuk menyimpan API keys di environment variables.

Jika mau, saya bisa buatkan `CONTRIBUTING.md` atau release draft untuk repo Anda.
