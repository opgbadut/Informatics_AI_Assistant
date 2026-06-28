require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { GoogleGenAI } = require("@google/genai");
const path = require("path");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Inisialisasi Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// System prompt untuk Asisten Akademik Mahasiswa
const SYSTEM_PROMPT = `Kamu adalah AkademiBot, asisten akademik cerdas untuk mahasiswa Informatika. 
Kamu membantu mahasiswa dengan:
- Penjelasan konsep pemrograman (Python, JavaScript, Java, C++, dst.)
- Debugging dan review kode
- Materi kuliah seperti Algoritma, Struktur Data, Jaringan, Keamanan Siber, Cloud Computing
- Tips belajar dan manajemen waktu
- Panduan penulisan laporan dan tugas akademik
- Referensi dan sumber belajar terpercaya

Gaya bahasa: Santai namun tetap informatif dan akurat. Gunakan bahasa Indonesia yang natural. 
Boleh sesekali gunakan istilah teknis tapi selalu berikan penjelasannya.
Jika ada kode, format dengan markdown code block yang sesuai.
Jika pertanyaan di luar domain akademik/teknologi, tetap bantu tapi ingatkan fokus utamamu.
Berikan respons yang terstruktur dengan poin-poin bila perlu, tapi tidak terlalu kaku.`;

// Menyimpan sesi percakapan per sessionId (in-memory)
const conversationHistory = new Map();

// Helper: ambil atau buat history sesi
function getSessionHistory(sessionId) {
  if (!conversationHistory.has(sessionId)) {
    conversationHistory.set(sessionId, []);
  }
  return conversationHistory.get(sessionId);
}

// =====================
// ENDPOINT: Chat Teks
// =====================
app.post("/api/chat", async (req, res) => {
  const { message, sessionId = "default" } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({ error: "Pesan tidak boleh kosong." });
  }

  try {
    const history = getSessionHistory(sessionId);

    // Tambah pesan user ke history
    history.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Buat chat dengan history yang ada
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,      // Cukup kreatif tapi tetap akurat untuk akademik
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      history: history.slice(0, -1), // history tanpa pesan terakhir (akan dikirim via sendMessage)
    });

    const response = await chat.sendMessage({ message });
    const botReply = response.text;

    // Simpan balasan bot ke history
    history.push({
      role: "model",
      parts: [{ text: botReply }],
    });

    // Batasi history agar tidak terlalu panjang (simpan 20 pesan terakhir)
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    res.json({
      reply: botReply,
      sessionId,
      messageCount: history.length,
    });
  } catch (error) {
    console.error("Error chat:", error.message);
    res.status(500).json({ error: "Gagal mendapatkan respons dari AI. Coba lagi." });
  }
});

// =====================
// ENDPOINT: Analisis Gambar (soal, diagram, kode screenshot)
// =====================
app.post("/api/analyze-image", upload.single("image"), async (req, res) => {
  const { prompt = "Jelaskan gambar ini dalam konteks akademik atau teknologi." } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: "Tidak ada gambar yang diunggah." });
  }

  try {
    const imageBase64 = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.5,
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: imageBase64,
              },
            },
            { text: prompt },
          ],
        },
      ],
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error("Error analyze image:", error.message);
    res.status(500).json({ error: "Gagal menganalisis gambar." });
  }
});

// =====================
// ENDPOINT: Analisis Dokumen (PDF, TXT — misal soal UAS, jurnal, laporan)
// =====================
app.post("/api/analyze-document", upload.single("document"), async (req, res) => {
  const { prompt = "Ringkas dan jelaskan isi dokumen ini." } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: "Tidak ada dokumen yang diunggah." });
  }

  try {
    const docBase64 = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.4,
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: docBase64,
              },
            },
            { text: prompt },
          ],
        },
      ],
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error("Error analyze document:", error.message);
    res.status(500).json({ error: "Gagal menganalisis dokumen." });
  }
});

// =====================
// ENDPOINT: Reset sesi percakapan
// =====================
app.post("/api/reset", (req, res) => {
  const { sessionId = "default" } = req.body;
  conversationHistory.delete(sessionId);
  res.json({ message: "Sesi percakapan direset.", sessionId });
});

// =====================
// ENDPOINT: Info status server
// =====================
app.get("/api/status", (req, res) => {
  res.json({
    status: "running",
    model: "gemini-2.5-flash",
    useCase: "Asisten Akademik Mahasiswa Informatika",
    activeSessions: conversationHistory.size,
  });
});

// Serve index.html untuk semua route yang tidak dikenal (SPA fallback)
app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🤖 AkademiBot server berjalan di http://localhost:${PORT}`);
  console.log(`📚 Use Case: Asisten Akademik Mahasiswa Informatika`);
  console.log(`🔑 API Key: ${process.env.GEMINI_API_KEY ? "✅ Terkonfigurasi" : "❌ Belum diset"}`);
});
