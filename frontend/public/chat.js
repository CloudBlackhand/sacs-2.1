export function buildChatPanel(ctx) {
  const { h, $, apiBase, authHeaders, addLog, showContactInfoModal } = ctx;
  return h('div', { id: 'panelChat', class: 'tab-panel' }, [
    h('div', { class: 'whatsapp-container' }, [
      // Header do WhatsApp
      h('div', { class: 'wa-header' }, [
        h('div', { class: 'wa-header-left' }, [
          h('div', { class: 'wa-avatar' }, '👤'),
          h('div', { class: 'wa-title' }, 'SACS WhatsApp')
        ]),
        h('div', { class: 'wa-header-right' }, [
          h('button', { class: 'wa-header-btn', onClick: async () => {
            if (!window.selectedChatId) return;
            const res = await fetch(`${apiBase}/chats/wa/${encodeURIComponent(window.selectedChatId)}/info`, { headers: authHeaders() });
            if (!res.ok) return;
            const info = await res.json();
            showContactInfoModal(info);
          } }, 'ℹ️'),
          h('button', { class: 'wa-header-btn', onClick: () => openChatMenu() }, '⋮')
        ])
      ]),

      // Container principal do chat
      h('div', { class: 'wa-main-container' }, [
        // Sidebar com lista de conversas
        h('div', { class: 'wa-sidebar' }, [
          // Header da sidebar
          h('div', { class: 'wa-sidebar-header' }, [
            h('div', { class: 'wa-sidebar-title' }, 'Conversas'),
            h('button', { id: 'btnLoadChats', class: 'wa-sidebar-btn', onClick: () => loadWhatsAppChats(apiBase, authHeaders, addLog) }, '🔄')
          ]),

          // Barra de busca
          h('div', { class: 'wa-search-container' }, [
            h('div', { class: 'wa-search-box' }, [
              h('span', { class: 'wa-search-icon' }, '🔍'),
              h('input', { id: 'chatSearch', placeholder: 'Pesquisar ou começar nova conversa', class: 'wa-search-input', onInput: filterWhatsAppChats })
            ])
          ]),

          // Lista de conversas
          h('div', { id: 'waChatsList', class: 'wa-chats-list' }, [
            h('div', { id: 'waChatsList', class: 'wa-chats-container' }, [
              h('div', { class: 'wa-empty-state' }, [
                h('div', { class: 'wa-empty-icon' }, '💬'),
                h('div', { class: 'wa-empty-text' }, 'Clique em "Atualizar" para carregar as conversas')
              ])
            ])
          ])
        ]),

        // Área principal do chat
        h('div', { class: 'wa-chat-area' }, [
          // Header do chat selecionado
          h('div', { class: 'wa-chat-header' }, [
            h('div', { class: 'wa-chat-info' }, [
              h('div', { class: 'wa-chat-avatar' }, '👤'),
              h('div', { class: 'wa-chat-details' }, [
                h('div', { class: 'wa-chat-name', id: 'waChatName' }, 'Selecione uma conversa'),
                h('div', { class: 'wa-chat-status', id: 'waChatStatus' }, 'Clique em uma conversa para começar')
              ])
            ]),
            h('div', { class: 'wa-chat-actions' }, [
              h('button', { class: 'wa-chat-btn' }, '📞'),
              h('button', { class: 'wa-chat-btn' }, '📹'),
              h('button', { class: 'wa-chat-btn' }, '⋮')
            ])
          ]),

          // Área de mensagens
          h('div', { class: 'wa-messages-container' }, [
            h('div', { id: 'waMessages', class: 'wa-messages-list' }, [
              h('div', { class: 'wa-welcome-message' }, [
                h('div', { class: 'wa-welcome-icon' }, '💬'),
                h('div', { class: 'wa-welcome-title' }, 'Bem-vindo ao SACS WhatsApp'),
                h('div', { class: 'wa-welcome-text' }, 'Selecione uma conversa na lista à esquerda para começar a responder aos clientes.')
              ])
            ])
          ]),

          // Área de digitação
          h('div', { class: 'wa-composer' }, [
            h('div', { class: 'wa-composer-container' }, [
              h('button', { class: 'wa-composer-btn' }, '😊'),
              h('div', { class: 'wa-input-container' }, [
                h('input', { id: 'waMessageInput', placeholder: 'Digite uma mensagem', class: 'wa-message-input' })
              ]),
              // Anexo
              h('button', { class: 'wa-composer-btn', onClick: () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '*/*';
                input.onchange = () => sendMediaFile(input.files?.[0]);
                input.click();
              } }, '📎'),
              h('button', { id: 'waSendButton', class: 'wa-send-btn', onClick: () => sendCurrentMessage(apiBase, authHeaders, addLog) }, '➤')
            ])
          ])
        ])
      ])
    ])
  ]);
}

// Chat-specific behavior hooks
function $(id){ return document.getElementById(id); }

async function loadWhatsAppChats(apiBase, authHeaders, addLog) {
  try {
    const res = await fetch(`${apiBase}/chats/wa`, { headers: authHeaders() });
    if (!res.ok) { addLog && addLog('Erro ao carregar conversas WhatsApp'); return; }
    const chats = await res.json();
    const container = $('waChatsList');
    container.innerHTML = '';
    if (!Array.isArray(chats) || chats.length === 0) {
      container.innerHTML = `<div class="wa-empty-state"><div class="wa-empty-icon">💬</div><div class="wa-empty-text">Nenhuma conversa encontrada</div></div>`;
      return;
    }
    chats.forEach(chat => {
      const item = document.createElement('div');
      item.className = 'wa-chat-item';
      item.dataset.chatId = chat.chat_id;
      item.innerHTML = `<div class="wa-chat-avatar" data-fallback="${(chat.name||' ').toString().charAt(0).toUpperCase()}"></div>
      <div class="wa-chat-content">
        <div class="wa-chat-header"><div class="wa-chat-name">${chat.name || chat.chat_id}</div><div class="wa-chat-time"></div></div>
        <div class="wa-chat-preview">${chat.lastMessage ? String(chat.lastMessage).slice(0,50) : 'Nenhuma mensagem'}</div>
      </div>`;
      item.addEventListener('click', () => selectWhatsAppChat(chat.chat_id, apiBase, authHeaders));
      container.appendChild(item);
      // carrega avatar em background (não bloqueante)
      loadProfilePic(chat.chat_id, apiBase, authHeaders).then(url => {
        if (!url) return;
        const avatar = item.querySelector('.wa-chat-avatar');
        if (avatar) {
          avatar.style.backgroundImage = `url('${url}')`;
          avatar.textContent = '';
        }
      });
    });
  } catch (err) { addLog && addLog('Erro ao carregar conversas: ' + err.message); }
}

async function selectWhatsAppChat(chatId, apiBase, authHeaders) {
  window.selectedChatId = chatId;
  document.querySelectorAll('.wa-chat-item').forEach(el => el.classList.remove('selected'));
  const clicked = document.querySelector(`.wa-chat-item[data-chat-id="${CSS.escape(chatId)}"]`);
  if (clicked) clicked.classList.add('selected');
  await loadWhatsAppMessages(chatId, apiBase, authHeaders);
  updateChatHeader(chatId, apiBase, authHeaders);
  startPolling(chatId, apiBase, authHeaders);
}

async function loadWhatsAppMessages(chatId, apiBase, authHeaders) {
  const res = await fetch(`${apiBase}/chats/wa/${encodeURIComponent(chatId)}`, { headers: authHeaders() });
  if (!res.ok) return;
  const messages = await res.json();
  const container = $('waMessages');
  container.innerHTML = '';
  messages.forEach(m => {
    const isOut = m.direction === 'outbound';
    const row = document.createElement('div');
    row.className = `wa-message ${isOut ? 'wa-message-outgoing':'wa-message-incoming'}`;
    row.innerHTML = `<div class="wa-message-bubble"><div class="wa-message-text">${escapeHtml(m.body || '')}</div><div class="wa-message-time">${formatTime(m.timestamp || m.created_at)}</div></div>`;
    container.appendChild(row);
  });
  container.scrollTop = container.scrollHeight;
}

function escapeHtml(s){ return s.replace(/[&<>\"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
function formatTime(ts){ if(!ts) return ''; const d = new Date(ts*1000 || ts); return d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); }

async function loadProfilePic(chatId, apiBase, authHeaders) {
  try {
    const res = await fetch(`${apiBase}/chats/wa/${encodeURIComponent(chatId)}/info`, { headers: authHeaders() });
    if (!res.ok) return null;
    const info = await res.json();
    return info.profilePicUrl || null;
  } catch { return null; }
}

function updateChatHeader(chatId, apiBase, authHeaders) {
  fetch(`${apiBase}/chats/wa/${encodeURIComponent(chatId)}/info`, { headers: authHeaders() })
    .then(r => r.ok ? r.json() : null)
    .then(info => {
      if (!info) return;
      const nameEl = $('waChatName');
      const statusEl = $('waChatStatus');
      if (nameEl) nameEl.textContent = info.name || info.number || chatId;
      if (statusEl) statusEl.textContent = 'online';
    })
    .catch(() => {});
}

function startPolling(chatId, apiBase, authHeaders) {
  if (window.__SACS_CHAT_POLL__) clearInterval(window.__SACS_CHAT_POLL__);
  window.__SACS_CHAT_POLL__ = setInterval(() => {
    if (window.selectedChatId !== chatId) return;
    loadWhatsAppMessages(chatId, apiBase, authHeaders);
  }, 4000);
}

function openChatMenu() {
  const menu = document.createElement('div');
  menu.style.position = 'absolute';
  menu.style.right = '16px';
  menu.style.top = '60px';
  menu.style.background = '#202c33';
  menu.style.border = '1px solid #374045';
  menu.style.borderRadius = '8px';
  menu.style.zIndex = 1000;
  menu.innerHTML = `<div style="padding:8px 12px; cursor:pointer; color:#e9edef">Ver perfil</div>`;
  menu.firstChild.addEventListener('click', async () => {
    const { apiBase, authHeaders } = window.__SACS_CTX__ || {};
    const chatId = window.selectedChatId;
    if (!apiBase || !authHeaders || !chatId) return;
    const res = await fetch(`${apiBase}/chats/wa/${encodeURIComponent(chatId)}/info`, { headers: authHeaders() });
    if (res.ok) showContactInfoModal(await res.json());
    document.body.removeChild(menu);
  });
  document.body.appendChild(menu);
  const close = (e) => { if (!menu.contains(e.target)) { document.body.removeChild(menu); document.removeEventListener('click', close, true); } };
  setTimeout(() => document.addEventListener('click', close, true), 0);
}

function filterWhatsAppChats() {
  const q = (document.getElementById('chatSearch')?.value || '').toLowerCase().trim();
  const items = document.querySelectorAll('.wa-chat-item');
  items.forEach(it => {
    const name = it.querySelector('.wa-chat-name')?.textContent?.toLowerCase() || '';
    const id = it.dataset.chatId?.toLowerCase() || '';
    it.style.display = (!q || name.includes(q) || id.includes(q)) ? '' : 'none';
  });
}

async function sendCurrentMessage(apiBase, authHeaders, addLog) {
  const input = document.getElementById('waMessageInput');
  const msg = (input?.value || '').trim();
  const chatId = window.selectedChatId;
  if (!msg || !chatId) return;
  try {
    const res = await fetch(`${apiBase}/messages/send`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ chatId, message: msg })
    });
    if (res.ok) {
      input.value = '';
      const container = $('waMessages');
      const row = document.createElement('div');
      row.className = 'wa-message wa-message-outgoing';
      row.innerHTML = `<div class="wa-message-bubble"><div class="wa-message-text">${escapeHtml(msg)}</div><div class="wa-message-time">${formatTime(Date.now())}</div></div>`;
      container.appendChild(row);
      container.scrollTop = container.scrollHeight;
    } else {
      addLog && addLog('Erro ao enviar mensagem');
    }
  } catch (err) {
    addLog && addLog('Erro ao enviar mensagem: ' + err.message);
  }
}

async function sendMediaFile(file) {
  const { apiBase, authHeaders, addLog } = window.__SACS_CTX__ || {};
  const chatId = window.selectedChatId;
  if (!file || !apiBase || !authHeaders || !chatId) return;
  try {
    const form = new FormData();
    form.append('file', file);
    form.append('chatId', chatId);
    const res = await fetch(`${apiBase}/messages/send-media`, { method: 'POST', headers: { 'Authorization': authHeaders().Authorization }, body: form });
    if (!res.ok) throw new Error('Falha ao enviar mídia');
    addLog && addLog(`Mídia enviada: ${file.name}`);
    // Atualiza histórico após envio
    await loadWhatsAppMessages(chatId, apiBase, authHeaders);
  } catch (err) {
    addLog && addLog('Erro ao enviar mídia: ' + err.message);
  }
}

// Delegação de eventos para botões/inputs que podem ainda não existir
document.addEventListener('click', (e) => {
  const { apiBase, authHeaders, addLog } = window.__SACS_CTX__ || {};
  if (!apiBase || !authHeaders) return;
  const t = e.target;
  if (t && t.id === 'btnLoadChats') {
    loadWhatsAppChats(apiBase, authHeaders, addLog);
  }
  if (t && t.id === 'waSendButton') {
    sendCurrentMessage(apiBase, authHeaders, addLog);
  }
  if (t && t.id === 'tabChat') {
    // ao ativar a aba chat, carregar conversas
    setTimeout(() => loadWhatsAppChats(apiBase, authHeaders, addLog), 0);
  }
});

document.addEventListener('keydown', (e) => {
  const { apiBase, authHeaders, addLog } = window.__SACS_CTX__ || {};
  if (!apiBase || !authHeaders) return;
  if (e.target && e.target.id === 'waMessageInput' && e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendCurrentMessage(apiBase, authHeaders, addLog);
  }
});



