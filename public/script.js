// ================================
//  AkademiBot — Frontend Script
// ================================

// State
let uploadMode = 'text';
let selectedFile = null;
let messageCount = 0;
let isLoading = false;
const SESSION_ID = 'session_' + Math.random().toString(36).substr(2, 9);

// Konfigurasi marked.js untuk render markdown
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true,
});

// ============================
// UI: Upload Mode
// ============================
function setUploadMode(mode) {
  uploadMode = mode;

  // Update tab active state
  document.querySelectorAll('.upload-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.mode === mode);
  });

  const fileSection = document.getElementById('file-upload-section');
  const fileInput = document.getElementById('file-input');
  const uploadLabelText = document.getElementById('upload-label-text');

  if (mode === 'text') {
    fileSection.style.display = 'none';
    selectedFile = null;
    updateFileBar();
  } else {
    fileSection.style.display = 'block';

    if (mode === 'image') {
      fileInput.accept = 'image/jpeg,image/png,image/gif,image/webp';
      uploadLabelText.textContent = 'Pilih gambar (JPG, PNG, GIF)';
    } else if (mode === 'document') {
      fileInput.accept = '.pdf,.txt,.md,.docx';
      uploadLabelText.textContent = 'Pilih dokumen (PDF, TXT, MD)';
    }
  }
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  selectedFile = file;

  // Update preview di sidebar
  const preview = document.getElementById('upload-preview');
  const previewName = document.getElementById('preview-name');
  const previewIcon = document.getElementById('preview-icon');

  preview.style.display = 'flex';
  previewName.textContent = file.name;
  previewIcon.textContent = uploadMode === 'image' ? '🖼️' : '📄';

  // Update file bar di area input
  updateFileBar();
}

function updateFileBar() {
  const bar = document.getElementById('input-file-bar');
  const nameEl = document.getElementById('input-file-name');
  const iconEl = document.getElementById('input-file-icon');

  if (selectedFile) {
    bar.style.display = 'flex';
    nameEl.textContent = selectedFile.name;
    iconEl.textContent = uploadMode === 'image' ? '🖼️' : '📄';
  } else {
    bar.style.display = 'none';
  }
}

function removeFile() {
  selectedFile = null;
  document.getElementById('file-input').value = '';
  document.getElementById('upload-preview').style.display = 'none';
  updateFileBar();
}

function triggerFileUpload() {
  if (uploadMode === 'text') {
    // Kalau mode text, ganti ke image mode dulu
    setUploadMode('image');
  }
  document.getElementById('file-input').click();
}

// ============================
// UI: Sidebar Toggle (Mobile)
// ============================
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('visible');
}

// ============================
// CHAT: Kirim Pesan
// ============================
async function sendMessage() {
  if (isLoading) return;

  const input = document.getElementById('chat-input');
  const message = input.value.trim();

  if (!message && !selectedFile) return;

  // Sembunyikan welcome screen
  hideWelcome();

  // Tentukan endpoint dan tipe
  let endpoint, displayMessage;

  if (selectedFile && uploadMode === 'image') {
    endpoint = '/api/analyze-image';
    displayMessage = message || 'Analisis gambar ini.';
  } else if (selectedFile && uploadMode === 'document') {
    endpoint = '/api/analyze-document';
    displayMessage = message || 'Ringkas dokumen ini.';
  } else {
    endpoint = '/api/chat';
    displayMessage = message;
  }

  // Tampilkan pesan user
  addUserMessage(displayMessage, selectedFile);

  // Reset input
  input.value = '';
  autoResize(input);

  // Simpan & reset file
  const fileToSend = selectedFile;
  const modeToSend = uploadMode;
  removeFile();

  // Update counter
  messageCount++;
  updateCounter();

  // Tampilkan typing indicator
  const typingId = addTypingIndicator();

  // Disable tombol send
  setLoadingState(true);

  try {
    let data;

    if (fileToSend) {
      // Multipart form data untuk file
      const formData = new FormData();
      if (modeToSend === 'image') {
        formData.append('image', fileToSend);
      } else {
        formData.append('document', fileToSend);
      }
      if (message) formData.append('prompt', message);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      data = await response.json();
    } else {
      // JSON untuk chat teks biasa
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId: SESSION_ID }),
      });
      data = await response.json();
    }

    // Hapus typing indicator
    removeTypingIndicator(typingId);

    if (data.error) {
      addBotMessage(`❌ **Error:** ${data.error}`);
    } else {
      addBotMessage(data.reply);
      messageCount++;
      updateCounter();
    }

  } catch (error) {
    removeTypingIndicator(typingId);
    addBotMessage('❌ **Gagal terhubung ke server.** Pastikan server berjalan dan API Key sudah dikonfigurasi di file `.env`.');
    console.error('Fetch error:', error);
  }

  setLoadingState(false);
}

// ============================
// CHAT: Quick Topic
// ============================
function sendQuickTopic(topic) {
  const input = document.getElementById('chat-input');
  input.value = topic;
  autoResize(input);
  input.focus();
}

// ============================
// CHAT: Reset
// ============================
async function resetChat() {
  try {
    await fetch('/api/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: SESSION_ID }),
    });
  } catch (e) { /* silent fail */ }

  document.getElementById('messages-container').innerHTML = '';
  document.getElementById('welcome-container').style.display = 'flex';
  messageCount = 0;
  updateCounter();
}

// ============================
// DOM: Tambah Pesan
// ============================
function addUserMessage(text, file = null) {
  const container = document.getElementById('messages-container');
  const time = getCurrentTime();

  const div = document.createElement('div');
  div.className = 'message-row user';
  div.innerHTML = `
    <div class="msg-avatar user-avatar">👤</div>
    <div class="message-content">
      <span class="msg-sender">Kamu</span>
      <div class="msg-bubble">
        ${file ? `<div class="msg-file-attachment">${uploadMode === 'image' ? '🖼️' : '📄'} ${file.name}</div>` : ''}
        ${escapeHtml(text)}
      </div>
      <span class="msg-time">${time}</span>
    </div>
  `;

  container.appendChild(div);
  scrollToBottom();
}

function addBotMessage(text) {
  const container = document.getElementById('messages-container');
  const time = getCurrentTime();

  const div = document.createElement('div');
  div.className = 'message-row bot';

  const rendered = renderMarkdown(text);

  div.innerHTML = `
    <div class="msg-avatar bot-avatar">🤖</div>
    <div class="message-content">
      <span class="msg-sender">AkademiBot</span>
      <div class="msg-bubble">${rendered}</div>
      <span class="msg-time">${time}</span>
    </div>
  `;

  container.appendChild(div);

  // Highlight kode setelah render
  div.querySelectorAll('pre code').forEach(block => {
    hljs.highlightElement(block);
  });

  scrollToBottom();
}

function addTypingIndicator() {
  const container = document.getElementById('messages-container');
  const id = 'typing_' + Date.now();

  const div = document.createElement('div');
  div.className = 'message-row bot';
  div.id = id;
  div.innerHTML = `
    <div class="msg-avatar bot-avatar">🤖</div>
    <div class="message-content">
      <span class="msg-sender">AkademiBot</span>
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  `;

  container.appendChild(div);
  scrollToBottom();
  return id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ============================
// Helpers
// ============================
function hideWelcome() {
  const welcome = document.getElementById('welcome-container');
  if (welcome) welcome.style.display = 'none';
}

function scrollToBottom() {
  const body = document.getElementById('chat-body');
  requestAnimationFrame(() => {
    body.scrollTop = body.scrollHeight;
  });
}

function getCurrentTime() {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function updateCounter() {
  const counter = document.getElementById('msg-counter');
  if (messageCount > 0) {
    counter.style.display = 'inline';
    counter.textContent = `${messageCount} pesan`;
  } else {
    counter.style.display = 'none';
  }
}

function setLoadingState(loading) {
  isLoading = loading;
  const btn = document.getElementById('btn-send');
  btn.disabled = loading;
}

function handleKeyDown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 180) + 'px';
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function renderMarkdown(text) {
  try {
    return marked.parse(text);
  } catch (e) {
    return escapeHtml(text);
  }
}

// ============================
// Init
// ============================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('chat-input').focus();

  // Set mode awal
  setUploadMode('text');
});
