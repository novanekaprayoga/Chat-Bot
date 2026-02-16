# Contributing

Terima kasih karena ingin berkontribusi ke proyek **Chat Bot** 🎉

Berikut panduan singkat agar kontribusi bisa cepat diterima:

## 1. Fork & Branch
- Fork repo dan clone ke lokal.
- Buat branch fitur dari `dev` dengan nama yang jelas:
  - `feature/<deskripsi-singkat>`
  - `fix/<deskripsi-singkat>`

## 2. Development
- Jalankan server lokal untuk menguji perubahan:
  ```bash
  npm install
  npm start
  # atau untuk frontend saja
  python -m http.server 8000
  ```
- Ikuti gaya kode yang ada (JavaScript + jQuery + Bootstrap).
- Jangan commit credentials (mis. file `.env`). Gunakan `.env.example` untuk panduan.

## 3. Commit
- Gunakan pesan commit yang jelas dan singkat, misal:
  - `feat: tambah fitur X`
  - `fix: perbaiki bug Y`
  - `docs: perbarui README`

## 4. Pull Request
- Push branch Anda ke fork, lalu buat Pull Request ke `dev` branch pada repo utama.
- Jelaskan perubahan, kenapa diperlukan, dan langkah untuk mengetesnya.
- Tag reviewer bila perlu.

## 5. Issue & Bug Report
- Sebelum membuat issue, cek apakah sudah ada issue serupa.
- Saat membuat issue, sertakan:
  - Judul singkat
  - Langkah reproduksi
  - Hasil yang diharapkan dan hasil aktual
  - Log/console error bila ada

## 6. Code Review
- Setelah PR dibuat, maintainer akan melakukan review.
- Lakukan perubahan bila diminta, lalu push update ke branch PR yang sama.

## 7. Lisensi & Kontribusi
Dengan mengirim PR, Anda menyetujui kontribusi Anda akan dilisensikan di bawah lisensi proyek.

---
Jika butuh template issue/PR atau panduan testing lebih rinci, beri tahu saya — saya bantu buatkan.