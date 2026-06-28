# 🤖 AkademiBot — Asisten Akademik Mahasiswa Informatika

Chatbot AI berbasis **Gemini 2.5 Flash** untuk membantu mahasiswa Informatika dalam belajar, debugging kode, memahami konsep kuliah, dan menulis laporan akademik.

## ✨ Fitur Utama

- **💬 Chat Teks** — Tanya apa saja seputar informatika & akademik
- **🖼️ Analisis Gambar** — Unggah screenshot kode, diagram, atau soal untuk dianalisis
- **📄 Analisis Dokumen** — Unggah PDF/TXT untuk diringkas atau dijelaskan
- **🧠 Memori Percakapan** — Mengingat konteks dalam satu sesi
- **🎯 Topik Cepat** — Shortcut ke topik populer (Algoritma, Jaringan, Keamanan, Cloud)
- **📝 Markdown Support** — Kode, tabel, dan formatting tampil dengan rapi
- **📱 Responsive** — Bisa dipakai di HP maupun laptop

## 🛠️ Tech Stack

| Layer    | Teknologi                         |
|----------|-----------------------------------|
| Backend  | Node.js + Express.js              |
| AI Model | Gemini 2.5 Flash (Google)         |
| Frontend | Vanilla HTML + CSS + JavaScript   |
| Upload   | Multer (multipart/form-data)      |
| Render   | Marked.js + Highlight.js          |

## 📡 API Endpoints

| Method | Endpoint              | Deskripsi                     |
|--------|-----------------------|-------------------------------|
| POST   | `/api/chat`           | Chat teks dengan memori sesi  |
| POST   | `/api/analyze-image`  | Analisis gambar (JPG/PNG)     |
| POST   | `/api/analyze-document` | Analisis dokumen (PDF/TXT)  |
| POST   | `/api/reset`          | Reset sesi percakapan         |
| GET    | `/api/status`         | Cek status server             |

## 🎛️ Konfigurasi Parameter AI

| Parameter   | Nilai | Alasan                              |
|-------------|-------|-------------------------------------|
| temperature | 0.7   | Cukup kreatif tapi tetap akurat     |
| top_k       | 40    | Balans keragaman & relevansi        |
| top_p       | 0.95  | Kurangi output random               |
| max_tokens  | 2048  | Cukup untuk penjelasan panjang      |

## 📁 Struktur Proyek

```
├── public/
│   ├── index.html    # Frontend
│   ├── style.css     # Styling (Dark Academic Theme)
│   └── script.js     # Logic frontend
├── package.json      # Dependencies & scripts
└── README.md         # Dokumentasi ini
```

## 🎨 Use Case & Parameter Kreatif

**Use Case:** Asisten Akademik Mahasiswa Informatika

**Domain Pengetahuan:**
- Pemrograman (Python, JavaScript, Java, C++)
- Algoritma & Struktur Data
- Jaringan Komputer & Multimedia
- Keamanan Siber & Aplikasi
- Cloud Computing
- Simulasi Komputer
- Penulisan laporan & tugas

**Gaya Bahasa:** Santai dan informatif (bukan formal kaku), menggunakan bahasa Indonesia natural dengan istilah teknis yang dijelaskan.

**Fitur Memory:** Menggunakan in-memory conversation history per session ID, menyimpan hingga 20 pesan terakhir.

## 👤 Author

**Naufal Aqiilah Noor Amarullah** — Mahasiswa S1 Informatika, UIN Sunan Kalijaga Yogyakarta

---

*Final Project — AI Productivity and AI API Integration for Developers*
