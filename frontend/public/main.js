import { buildChatPanel } from './chat.js';

const apiBase = '';
const $ = (id) => document.getElementById(id);

// Constrói a interface 100% via JavaScript (sem arquivo HTML)
function h(tag, props = {}, children = []) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'class') el.className = value;
    else if (key === 'id') el.id = value;
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value);
  }
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    if (child == null) continue;
    if (typeof child === 'string') el.appendChild(document.createTextNode(child));
    else el.appendChild(child);
  }
  return el;
}

function ensureRoot() {
  let root = document.getElementById('root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);
  }
  return root;
}

function buildUI() {
  const root = ensureRoot();
  root.innerHTML = '';
  // disponibiliza contexto global para o módulo de chat registrar handlers
  window.__SACS_CTX__ = { apiBase, authHeaders, addLog };
  const chatPanel = buildChatPanel({ h, $, apiBase, authHeaders, addLog, showContactInfoModal });
  const ui = h('div', { class: 'container' }, [
    h('div', { id: 'login' }, [
      h('h2', {}, 'Login'),
      h('input', { id: 'username', placeholder: 'Usuário' }),
      h('input', { id: 'password', placeholder: 'Senha', type: 'password' }),
      h('button', { id: 'btnLogin' }, 'Entrar'),
      h('div', { id: 'loginMsg', class: 'msg' }),
    ]),

    h('div', { id: 'app', class: 'hidden' }, [
      // Barra de navegação principal
      h('div', { class: 'main-nav' }, [
        h('div', { class: 'nav-brand' }, 'SACS'),
        h('div', { class: 'nav-tabs' }, [
          h('button', { id: 'tabConfig', class: 'nav-tab active' }, '⚙️ Configuração'),
          h('button', { id: 'tabChat', class: 'nav-tab' }, '💬 Chat'),
          h('button', { id: 'tabContacts', class: 'nav-tab' }, '👥 Contatos'),
          h('button', { id: 'tabMessaging', class: 'nav-tab' }, '📤 Envio'),
          h('button', { id: 'tabFeedbacks', class: 'nav-tab' }, '💬 Feedbacks'),
          h('button', { id: 'tabStatus', class: 'nav-tab' }, '📊 Status')
        ]),
        h('div', { class: 'nav-user' }, [
          h('span', { class: 'user-name' }, 'Usuário'),
          h('button', { id: 'btnLogout', class: 'btn-logout' }, 'Sair')
        ])
      ]),

      // Conteúdo das abas
      h('div', { class: 'tab-content' }, [
        // === ABA 1: CONFIGURAÇÃO ===
        h('div', { id: 'panelConfig', class: 'tab-panel active' }, [
          h('div', { class: 'config-grid' }, [
            // Seção Excel
            h('div', { class: 'config-card' }, [
              h('h3', {}, '📊 Arquivo Excel'),
              h('div', { class: 'excel-upload-area' }, [
                h('div', { class: 'upload-zone' }, [
                  h('div', { class: 'upload-icon' }, '📁'),
                  h('div', { class: 'upload-text' }, 'Clique ou arraste o arquivo Excel aqui'),
                  h('div', { class: 'upload-hint' }, 'Suporte: .xlsx, .xls (múltiplas abas)'),
                  h('input', { type: 'file', id: 'excelFile', accept: '.xlsx,.xls', class: 'file-input' })
                ]),
                h('div', { id: 'fileInfo', class: 'file-info hidden' }, [
                  h('div', { class: 'file-details' }, [
                    h('div', { class: 'file-name', id: 'fileName' }, ''),
                    h('div', { class: 'file-size', id: 'fileSize' }, '')
                  ]),
                  h('button', { id: 'btnLoadExcel', class: 'btn-primary' }, '📊 Carregar Dados')
                ])
              ])
            ]),

            // Seção Filtros
            h('div', { class: 'config-card' }, [
              h('h3', {}, '🔍 Filtros'),
              h('div', { class: 'filters-grid' }, [
                h('div', { class: 'filter-group' }, [
                  h('label', {}, 'Data Inicial'),
                  h('input', { type: 'date', id: 'dateFrom', class: 'filter-input' })
                ]),
                h('div', { class: 'filter-group' }, [
                  h('label', {}, 'Data Final'),
                  h('input', { type: 'date', id: 'dateTo', class: 'filter-input' })
                ]),
                h('div', { class: 'filter-group' }, [
                  h('label', {}, 'Técnico'),
                  h('input', { id: 'technicianFilter', placeholder: 'Nome do técnico', class: 'filter-input' })
                ]),
                h('div', { class: 'filter-group' }, [
                  h('label', {}, 'Cidade'),
                  h('input', { id: 'cityFilter', placeholder: 'Nome da cidade', class: 'filter-input' })
                ])
              ]),
              h('div', { class: 'filter-actions' }, [
                h('button', { id: 'btnApplyFilter', class: 'btn-primary' }, '🔍 Aplicar Filtro'),
                h('button', { id: 'btnClearFilter', class: 'btn-secondary' }, '🔄 Limpar')
              ])
            ]),

            // Seção WhatsApp
            h('div', { class: 'config-card' }, [
              h('h3', {}, '📱 Status WhatsApp'),
              h('div', { class: 'whatsapp-status' }, [
                h('div', { class: 'status-indicator' }, [
                  h('div', { id: 'waStatusDot', class: 'status-dot offline' }),
                  h('span', { id: 'waStatusText', class: 'status-text' }, 'Desconectado')
                ])
              ]),
              h('div', { class: 'whatsapp-actions' }, [
                h('button', { id: 'btnConnectWA', class: 'btn-primary' }, '🔗 Conectar WhatsApp'),
                h('button', { id: 'btnShowQR', class: 'btn-secondary' }, '📱 Mostrar QR')
              ]),
              h('div', { class: 'qr-container' }, [
                h('img', { id: 'qrCode', class: 'qr-image hidden', alt: 'QR Code' })
              ])
            ])
          ])
        ]),

        // === ABA 2: CHAT ===
        chatPanel,

        // === ABA 3: CONTATOS ===
        h('div', { id: 'panelContacts', class: 'tab-panel' }, [
          h('div', { class: 'contacts-container' }, [
            // Filtros de contatos
            h('div', { class: 'contacts-filters' }, [
              h('div', { class: 'search-group' }, [
                h('input', { id: 'contactSearch', placeholder: '🔍 Buscar contatos...', class: 'search-input' }),
                h('label', { class: 'checkbox-label' }, [
                  h('input', { type: 'checkbox', id: 'phoneOnly', checked: true }),
                  'Apenas com telefone'
                ])
              ])
            ]),

            // Lista de contatos
            h('div', { class: 'contacts-list-container' }, [
              h('div', { class: 'contacts-header' }, [
                h('h3', {}, '📋 Lista de Contatos'),
                h('div', { class: 'contacts-stats' }, [
                  h('span', { id: 'totalContacts', class: 'stat-item' }, 'Total: 0'),
                  h('span', { id: 'filteredContacts', class: 'stat-item' }, 'Filtrados: 0')
                ])
              ]),
              h('div', { class: 'contacts-table-container' }, [
                h('table', { class: 'contacts-table' }, [
                  h('thead', {}, [
                    h('tr', {}, [
                      h('th', {}, 'SA'),
                      h('th', {}, 'Nome'),
                      h('th', {}, 'Telefone'),
                      h('th', {}, 'Cidade'),
                      h('th', {}, 'Técnico'),
                      h('th', {}, 'Data')
                    ])
                  ]),
                  h('tbody', { id: 'contactsTableBody' }, [
                    h('tr', {}, [
                      h('td', { colspan: '6', class: 'no-data' }, 'Carregue um arquivo Excel para ver os contatos')
                    ])
                  ])
                ])
              ])
            ])
          ])
        ]),

        // === ABA 4: ENVIO ===
        h('div', { id: 'panelMessaging', class: 'tab-panel' }, [
          h('div', { class: 'messaging-container' }, [
            // Templates de mensagem
            h('div', { class: 'template-section' }, [
              h('h3', {}, '💬 Template da Mensagem'),
              h('div', { class: 'template-buttons' }, [
                h('button', { class: 'template-btn', 'data-template': 'conexao' }, '🔧 Verificar Conexão'),
                h('button', { class: 'template-btn', 'data-template': 'satisfacao' }, '📊 Pesquisa Satisfação'),
                h('button', { class: 'template-btn', 'data-template': 'suporte' }, '⚠️ Suporte Técnico'),
                h('button', { class: 'template-btn', 'data-template': 'followup' }, '✅ Follow-up'),
                h('button', { class: 'template-btn', 'data-template': 'promocao' }, '🎯 Promoção'),
                h('button', { class: 'template-btn', 'data-template': 'limpar' }, '🔄 Limpeza')
              ]),
              h('textarea', { id: 'messageTemplate', placeholder: 'Digite sua mensagem aqui... Use {nome} para personalizar', rows: '6', class: 'message-textarea' }),
              h('div', { class: 'template-actions' }, [
                h('button', { id: 'btnSaveTemplate', class: 'btn-secondary' }, '💾 Salvar'),
                h('button', { id: 'btnCopyTemplate', class: 'btn-secondary' }, '📋 Copiar')
              ])
            ]),

            // Prévia
            h('div', { class: 'preview-section' }, [
              h('h3', {}, '👁️ Prévia'),
              h('div', { id: 'messagePreview', class: 'preview-content' }, 'A prévia aparecerá aqui...'),
              h('button', { id: 'btnGeneratePreview', class: 'btn-secondary' }, '🔍 Gerar Prévia')
            ]),

            // Controles de envio
            h('div', { class: 'sending-section' }, [
              h('h3', {}, '🚀 Envio em Massa'),
              h('div', { class: 'sending-info' }, [
                h('div', { id: 'sendingStats', class: 'stats-info' }, 'Selecione contatos para enviar'),
                h('div', { class: 'delay-config' }, [
                  h('label', {}, 'Delay mínimo (segundos):'),
                  h('input', { type: 'number', id: 'delayMin', value: '45', min: '30', max: '300', class: 'delay-input' }),
                  h('label', {}, 'Delay máximo (segundos):'),
                  h('input', { type: 'number', id: 'delayMax', value: '120', min: '60', max: '600', class: 'delay-input' })
                ])
              ]),
              h('div', { class: 'sending-actions' }, [
                h('button', { id: 'btnSendBulk', class: 'btn-primary', disabled: true }, '🚀 Enviar para Todos'),
                h('button', { id: 'btnSendTest', class: 'btn-secondary' }, '📝 Teste (1 contato)')
              ]),
              h('div', { class: 'progress-container' }, [
                h('div', { id: 'progressBar', class: 'progress-bar' }, [
                  h('div', { id: 'progressFill', class: 'progress-fill' })
                ]),
                h('div', { id: 'progressText', class: 'progress-text' }, '')
              ])
            ])
          ])
        ]),

        // === ABA 5: FEEDBACKS ===
        h('div', { id: 'panelFeedbacks', class: 'tab-panel' }, [
          h('div', { class: 'feedbacks-container' }, [
            // Controles de feedback
            h('div', { class: 'feedback-controls' }, [
              h('div', { class: 'feedback-filters' }, [
                h('input', { id: 'feedbackSA', placeholder: 'Filtrar por SA...', class: 'filter-input' }),
                h('button', { id: 'btnLoadFeedbacks', class: 'btn-primary' }, '🔍 Buscar'),
                h('button', { id: 'btnLoadSummary', class: 'btn-secondary' }, '📊 Resumo Geral'),
                h('button', { id: 'btnRefreshFeedbacks', class: 'btn-secondary' }, '🔄 Atualizar'),
                h('button', { id: 'btnExportFeedbacks', class: 'btn-secondary' }, '💾 Exportar')
              ])
            ]),

            // Lista de feedbacks
            h('div', { class: 'feedbacks-list' }, [
              h('div', { class: 'feedbacks-header' }, [
                h('h3', {}, '💬 Feedbacks Recebidos')
              ]),
              h('div', { id: 'feedbacksTable', class: 'feedbacks-table-container' }, [
                h('div', { class: 'no-data' }, 'Nenhum feedback encontrado')
              ])
            ])
          ])
        ]),

        // === ABA 6: STATUS ===
        h('div', { id: 'panelStatus', class: 'tab-panel' }, [
          h('div', { class: 'status-container' }, [
            h('div', { class: 'status-grid' }, [
              h('div', { class: 'status-card' }, [
                h('h3', {}, '📊 Estatísticas do Sistema'),
                h('div', { class: 'stats-grid' }, [
                  h('div', { class: 'stat-item' }, [
                    h('div', { class: 'stat-value', id: 'totalMessages' }, '0'),
                    h('div', { class: 'stat-label' }, 'Mensagens Enviadas')
                  ]),
                  h('div', { class: 'stat-item' }, [
                    h('div', { class: 'stat-value', id: 'totalFeedbacks' }, '0'),
                    h('div', { class: 'stat-label' }, 'Feedbacks Recebidos')
                  ]),
                  h('div', { class: 'stat-item' }, [
                    h('div', { class: 'stat-value', id: 'successRate' }, '0%'),
                    h('div', { class: 'stat-label' }, 'Taxa de Sucesso')
                  ])
                ])
              ]),

              h('div', { class: 'status-card' }, [
                h('h3', {}, '📝 Logs do Sistema'),
                h('div', { class: 'logs-container' }, [
                  h('div', { id: 'systemLogs', class: 'logs-content' }, 'Sistema iniciado...'),
                  h('div', { class: 'logs-actions' }, [
                    h('button', { id: 'btnClearLogs', class: 'btn-secondary' }, '🗑️ Limpar'),
                    h('button', { id: 'btnExportLogs', class: 'btn-secondary' }, '💾 Exportar')
                  ])
                ])
              ])
            ])
          ])
        ])
      ])
    ]),
  ]);
  root.appendChild(ui);
}

function getToken() { return localStorage.getItem('token'); }
function setToken(t) { localStorage.setItem('token', t); }
function clearToken() { localStorage.removeItem('token'); }

function authHeaders() { return { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' }; }

async function login() {
  const username = $('username').value.trim();
  const password = $('password').value.trim();
  const res = await fetch(`${apiBase}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (res.ok) {
    setToken(data.token);
    $('login').classList.add('hidden');
    $('app').classList.remove('hidden');
    // Atualiza status do WhatsApp após login
    try { await checkWhatsAppStatus(); } catch (e) {}
  } else {
    $('loginMsg').innerText = data.error || 'Falha no login';
  }
}

async function sendMsg() {
  const number = $('sendNumber').value.trim();
  const message = $('sendText').value.trim();
  await fetch(`${apiBase}/messages/send`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ number, message }) });
}

async function uploadExcel() {
  const file = $('excelFile').files[0];
  if (!file) return;
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${apiBase}/messages/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${getToken()}` }, body: form });
  const data = await res.json();
  $('uploadResult').innerText = JSON.stringify(data, null, 2);
}

async function refreshStatus() {
  const res = await fetch(`${apiBase}/admin/status`, { headers: authHeaders() });
  if (!res.ok) throw new Error('not admin');
  const { whatsappReady } = await res.json();
  
  const statusDot = $('waStatusDot');
  const statusText = $('waStatusText');
  
  if (whatsappReady) {
    statusDot.className = 'status-dot online';
    statusText.innerText = 'Conectado';
  } else {
    statusDot.className = 'status-dot offline';
    statusText.innerText = 'Aguardando QR/Conectar';
  }
}

async function getQR() {
  const res = await fetch(`${apiBase}/admin/qr`, { headers: authHeaders() });
  if (!res.ok) return;
  const { dataUrl } = await res.json();
  if (dataUrl) $('qrCode').src = dataUrl; else $('qrCode').removeAttribute('src');
}

async function loadWaChats() {
  const res = await fetch(`${apiBase}/chats/wa`, { headers: authHeaders() });
  if (!res.ok) return;
  const chats = await res.json();
  const list = $('wsList');
  list.innerHTML = '';
  const filter = ($('chatFilter')?.value || '').toLowerCase().trim();
  
  for (const c of chats) {
    const name = c.name || c.chat_id;
    if (filter && !String(name).toLowerCase().includes(filter)) continue;
    
    const item = h('div', { class: 'chat-item' }, [
      h('div', { class: 'chat-item-avatar' }, name.charAt(0).toUpperCase()),
      h('div', { class: 'chat-item-content' }, [
        h('div', { class: 'chat-item-name' }, name),
        h('div', { class: 'chat-item-preview' }, c.lastMessage ? String(c.lastMessage).slice(0, 64) : '')
      ])
    ]);
    
    item.addEventListener('click', () => selectChat(c.chat_id, name));
    list.appendChild(item);
  }
}

async function selectChat(chatId, title) {
  selectedChatId = chatId;
  
  // Remove seleção anterior
  document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('selected'));
  
  // Adiciona seleção no item clicado
  event.target.closest('.chat-item').classList.add('selected');
  
  $('chatHeader').innerText = title;
  
  const res = await fetch(`${apiBase}/chats/wa/${encodeURIComponent(chatId)}`, { headers: authHeaders() });
  if (!res.ok) { 
    $('chatHistory').innerHTML = '<div class="error-state">Falha ao carregar histórico</div>'; 
    return; 
  }
  
  const history = await res.json();
  const box = $('chatHistory');
  box.innerHTML = '';
  
  for (const m of history) {
    const messageClass = m.direction === 'outbound' ? 'outgoing' : 'incoming';
    const row = h('div', { class: `message ${messageClass}` }, [
      h('div', { class: 'message-bubble' }, [
        h('div', { class: 'message-text' }, m.body),
        h('div', { class: 'message-time' }, new Date(m.created_at).toLocaleTimeString())
      ])
    ]);
    box.appendChild(row);
  }
  box.scrollTop = box.scrollHeight;
}

async function chatSend() {
  const msg = $('chatMessage').value.trim();
  if (!selectedChatId || !msg) return;
  
  const res = await fetch(`${apiBase}/messages/send`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ chatId: selectedChatId, message: msg })
  });
  
  if (res.ok) {
    $('chatMessage').value = '';
    
    // Adiciona mensagem otimisticamente
    const box = $('chatHistory');
    const row = h('div', { class: 'message outgoing' }, [
      h('div', { class: 'message-bubble' }, [
        h('div', { class: 'message-text' }, msg),
        h('div', { class: 'message-time' }, new Date().toLocaleTimeString())
      ])
    ]);
    box.appendChild(row);
    box.scrollTop = box.scrollHeight;
  }
}

function logout() {
  clearToken();
  $('app').classList.add('hidden');
  $('login').classList.remove('hidden');
}

window.addEventListener('DOMContentLoaded', () => {
  buildUI();

  // Event listeners para login e logout
  $('btnLogin').addEventListener('click', login);
  $('btnLogout').addEventListener('click', logout);

  // Event listeners para configuração
  $('excelFile').addEventListener('change', handleFileSelect);
  $('btnLoadExcel').addEventListener('click', loadExcelData);
  $('btnApplyFilter').addEventListener('click', applyFilters);
  $('btnClearFilter').addEventListener('click', clearFilters);
  $('btnConnectWA').addEventListener('click', connectWhatsApp);
  $('btnShowQR').addEventListener('click', showQRCode);

  // Event listeners para chat WhatsApp
  // Chat listeners são registrados pelo módulo chat quando a aba é ativada

  // Event listeners para contatos
  $('contactSearch').addEventListener('input', filterContacts);
  $('phoneOnly').addEventListener('change', filterContacts);

  // Event listeners para envio
  document.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', () => loadTemplate(btn.dataset.template));
  });
  $('btnSaveTemplate').addEventListener('click', saveTemplate);
  $('btnCopyTemplate').addEventListener('click', copyTemplate);
  $('btnGeneratePreview').addEventListener('click', generatePreview);
  $('btnSendBulk').addEventListener('click', sendBulkMessages);
  $('btnSendTest').addEventListener('click', sendTestMessage);

  // Event listeners para feedbacks
  $('btnLoadFeedbacks').addEventListener('click', loadFeedbacks);
  $('btnLoadSummary').addEventListener('click', loadFeedbacksSummary);
  $('btnRefreshFeedbacks').addEventListener('click', refreshFeedbacks);
  $('btnExportFeedbacks').addEventListener('click', exportFeedbacks);

  // Event listeners para status
  $('btnClearLogs').addEventListener('click', clearLogs);
  $('btnExportLogs').addEventListener('click', exportLogs);

  // Navegação entre abas
  const switchTab = (tabId) => {
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    document.getElementById(`panel${tabId.charAt(3).toUpperCase() + tabId.slice(4)}`).classList.add('active');
  };

  $('tabConfig').addEventListener('click', () => switchTab('tabConfig'));
  $('tabChat').addEventListener('click', () => switchTab('tabChat'));
  $('tabContacts').addEventListener('click', () => switchTab('tabContacts'));
  $('tabMessaging').addEventListener('click', () => switchTab('tabMessaging'));
  $('tabFeedbacks').addEventListener('click', () => switchTab('tabFeedbacks'));
  $('tabStatus').addEventListener('click', () => switchTab('tabStatus'));

  // Verificar se já está logado
  if (getToken()) {
    $('login').classList.add('hidden');
    $('app').classList.remove('hidden');
    checkWhatsAppStatus();
  }
});

// Variáveis globais
let excelData = [];
let filteredContacts = [];
let currentTemplate = '';
let selectedChatId = null;
let whatsAppChats = [];

// Funções para configuração
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    $('fileName').textContent = file.name;
    $('fileSize').textContent = formatFileSize(file.size);
    $('fileInfo').classList.remove('hidden');
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function loadExcelData() {
  const file = $('excelFile').files[0];
  if (!file) {
    alert('Selecione um arquivo Excel primeiro');
    return;
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch(`${apiBase}/messages/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      excelData = data.rows || [];
      filteredContacts = [...excelData];
      updateContactsTable();
      addLog('Excel carregado com sucesso: ' + excelData.length + ' contatos');
    } else {
      throw new Error('Erro ao carregar Excel');
    }
  } catch (err) {
    alert('Erro ao carregar Excel: ' + err.message);
    addLog('Erro ao carregar Excel: ' + err.message);
  }
}

function applyFilters() {
  const dateFrom = $('dateFrom').value;
  const dateTo = $('dateTo').value;
  const technician = $('technicianFilter').value.toLowerCase();
  const city = $('cityFilter').value.toLowerCase();

  filteredContacts = excelData.filter(contact => {
    // Filtros de data (se implementado no backend)
    // Filtros de técnico e cidade
    const techMatch = !technician || (contact.technician && contact.technician.toLowerCase().includes(technician));
    const cityMatch = !city || (contact.city && contact.city.toLowerCase().includes(city));
    
    return techMatch && cityMatch;
  });

  updateContactsTable();
  addLog(`Filtros aplicados: ${filteredContacts.length} contatos encontrados`);
}

function clearFilters() {
  $('dateFrom').value = '';
  $('dateTo').value = '';
  $('technicianFilter').value = '';
  $('cityFilter').value = '';
  filteredContacts = [...excelData];
  updateContactsTable();
  addLog('Filtros limpos');
}

function updateContactsTable() {
  const tbody = $('contactsTableBody');
  tbody.innerHTML = '';

  if (filteredContacts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="no-data">Nenhum contato encontrado</td></tr>';
    return;
  }

  filteredContacts.forEach(contact => {
    const row = h('tr', {}, [
      h('td', {}, contact.sa || ''),
      h('td', {}, contact.nome || ''),
      h('td', {}, contact.telefone || ''),
      h('td', {}, contact.cidade || ''),
      h('td', {}, contact.technician || ''),
      h('td', {}, contact.data || '')
    ]);
    tbody.appendChild(row);
  });

  $('totalContacts').textContent = `Total: ${excelData.length}`;
  $('filteredContacts').textContent = `Filtrados: ${filteredContacts.length}`;
}

function filterContacts() {
  const search = $('contactSearch').value.toLowerCase();
  const phoneOnly = $('phoneOnly').checked;

  const filtered = filteredContacts.filter(contact => {
    const searchMatch = !search || 
      (contact.nome && contact.nome.toLowerCase().includes(search)) ||
      (contact.sa && contact.sa.toLowerCase().includes(search)) ||
      (contact.telefone && contact.telefone.includes(search));
    
    const phoneMatch = !phoneOnly || (contact.telefone && contact.telefone.trim() !== '');
    
    return searchMatch && phoneMatch;
  });

  updateContactsTable(filtered);
}

// Funções para WhatsApp
async function connectWhatsApp() {
  try {
    const res = await fetch(`${apiBase}/admin/status`, { headers: authHeaders() });
    if (res.ok) {
      const { whatsappReady } = await res.json();
      updateWhatsAppStatus(whatsappReady);
    }
  } catch (err) {
    addLog('Erro ao conectar WhatsApp: ' + err.message);
  }
}

async function showQRCode() {
  try {
    const res = await fetch(`${apiBase}/admin/qr`, { headers: authHeaders() });
    if (res.ok) {
      const { dataUrl } = await res.json();
      if (dataUrl) {
        $('qrCode').src = dataUrl;
        $('qrCode').classList.remove('hidden');
      }
    }
  } catch (err) {
    addLog('Erro ao mostrar QR Code: ' + err.message);
  }
}

function updateWhatsAppStatus(ready) {
  const dot = $('waStatusDot');
  const text = $('waStatusText');
  
  if (ready) {
    dot.className = 'status-dot online';
    text.textContent = 'Conectado';
  } else {
    dot.className = 'status-dot offline';
    text.textContent = 'Desconectado';
  }
}

async function checkWhatsAppStatus() {
  try {
    await connectWhatsApp();
  } catch (err) {
    // Ignora erro se não for admin
  }
}

// Templates de mensagem
const templates = {
  conexao: 'Olá! Aqui é a equipe da Desk. Queremos saber como está sua conexão?',
  satisfacao: 'Olá! Estamos fazendo uma pesquisa de satisfação. Como você avalia nosso serviço?',
  suporte: 'Olá! Detectamos um problema técnico. Nossa equipe entrará em contato em breve.',
  followup: 'Olá! Estamos acompanhando seu caso. Há alguma novidade?',
  promocao: 'Olá! Temos uma oferta especial para você. Gostaria de saber mais?',
  limpar: 'Olá! Estamos fazendo uma limpeza de dados. Confirma que ainda é nosso cliente?'
};

function loadTemplate(templateName) {
  currentTemplate = templateName;
  $('messageTemplate').value = templates[templateName] || '';
  generatePreview();
}

function saveTemplate() {
  const template = $('messageTemplate').value;
  localStorage.setItem('savedTemplate', template);
  addLog('Template salvo');
}

function copyTemplate() {
  const template = $('messageTemplate').value;
  navigator.clipboard.writeText(template);
  addLog('Template copiado');
}

function generatePreview() {
  const template = $('messageTemplate').value;
  if (filteredContacts.length > 0) {
    const sampleContact = filteredContacts[0];
    const preview = template.replace(/{nome}/g, sampleContact.nome || 'Cliente');
    $('messagePreview').textContent = preview;
  } else {
    $('messagePreview').textContent = 'Carregue contatos para gerar prévia';
  }
}

// Funções de envio
async function sendBulkMessages() {
  if (filteredContacts.length === 0) {
    alert('Nenhum contato selecionado');
    return;
  }

  const template = $('messageTemplate').value;
  if (!template.trim()) {
    alert('Digite uma mensagem');
    return;
  }

  const delayMin = parseInt($('delayMin').value);
  const delayMax = parseInt($('delayMax').value);

  try {
    $('btnSendBulk').disabled = true;
    $('progressFill').style.width = '0%';
    $('progressText').textContent = 'Iniciando envio...';

    let sent = 0;
    for (const contact of filteredContacts) {
      if (contact.telefone) {
        const message = template.replace(/{nome}/g, contact.nome || 'Cliente');
        
        await fetch(`${apiBase}/messages/send`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ number: contact.telefone, message })
        });

        sent++;
        const progress = (sent / filteredContacts.length) * 100;
        $('progressFill').style.width = progress + '%';
        $('progressText').textContent = `Enviado: ${sent}/${filteredContacts.length}`;

        // Delay aleatório
        const delay = Math.random() * (delayMax - delayMin) + delayMin;
        await new Promise(resolve => setTimeout(resolve, delay * 1000));
      }
    }

    addLog(`Envio em massa concluído: ${sent} mensagens enviadas`);
    $('progressText').textContent = 'Envio concluído!';
  } catch (err) {
    addLog('Erro no envio em massa: ' + err.message);
  } finally {
    $('btnSendBulk').disabled = false;
  }
}

async function sendTestMessage() {
  if (filteredContacts.length === 0) {
    alert('Nenhum contato disponível para teste');
    return;
  }

  const template = $('messageTemplate').value;
  if (!template.trim()) {
    alert('Digite uma mensagem');
    return;
  }

  const testContact = filteredContacts[0];
  const message = template.replace(/{nome}/g, testContact.nome || 'Cliente');

  try {
    await fetch(`${apiBase}/messages/send`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ number: testContact.telefone, message })
    });

    addLog(`Teste enviado para ${testContact.nome} (${testContact.telefone})`);
  } catch (err) {
    addLog('Erro no teste: ' + err.message);
  }
}

// Funções para feedbacks
async function loadFeedbacks() {
  const sa = $('feedbackSA').value;
  try {
    let url = `${apiBase}/insights/messages`;
    if (sa) {
      url += `?sa=${sa}`;
    }
    
    const res = await fetch(url, { headers: authHeaders() });
    if (res.ok) {
      const feedbacks = await res.json();
      displayFeedbacks(feedbacks);
    }
  } catch (err) {
    addLog('Erro ao carregar feedbacks: ' + err.message);
  }
}

function displayFeedbacks(feedbacks) {
  const container = $('feedbacksTable');
  
  if (feedbacks.length === 0) {
    container.innerHTML = '<div class="no-data">Nenhum feedback encontrado</div>';
    return;
  }

  container.innerHTML = '';
  feedbacks.forEach(feedback => {
    const card = h('div', { class: 'feedback-card' }, [
      h('div', { class: 'feedback-header' }, [
        h('span', { class: 'feedback-sa' }, feedback.sa || 'N/A'),
        h('span', { class: 'feedback-date' }, new Date(feedback.created_at).toLocaleString())
      ]),
      h('div', { class: 'feedback-content' }, feedback.body),
      h('div', { class: 'feedback-sentiment' }, getSentimentEmoji(feedback.sentiment))
    ]);
    container.appendChild(card);
  });
}

async function loadFeedbacksSummary() {
  try {
    const res = await fetch(`${apiBase}/insights/summary`, { headers: authHeaders() });
    if (res.ok) {
      const summary = await res.json();
      displayFeedbacksSummary(summary);
    }
  } catch (err) {
    addLog('Erro ao carregar resumo: ' + err.message);
  }
}

function displayFeedbacksSummary(summary) {
  const container = $('feedbacksTable');
  container.innerHTML = '<div class="summary-container">';
  
  summary.forEach(item => {
    const stat = h('div', { class: 'summary-stat' }, [
      h('div', { class: 'summary-value' }, item.qty),
      h('div', { class: 'summary-label' }, item.sentiment)
    ]);
    container.appendChild(stat);
  });
}

function refreshFeedbacks() {
  loadFeedbacks();
}

function exportFeedbacks() {
  addLog('Exportação de feedbacks (não implementada)');
}

// Funções para status
function addLog(message) {
  const logs = $('systemLogs');
  const timestamp = new Date().toLocaleTimeString();
  logs.innerHTML += `[${timestamp}] ${message}\n`;
  logs.scrollTop = logs.scrollHeight;
}

function clearLogs() {
  $('systemLogs').innerHTML = 'Sistema iniciado...\n';
}

function exportLogs() {
  const logs = $('systemLogs').innerText;
  const blob = new Blob([logs], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sacs-logs-${new Date().toISOString().split('T')[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// Funções para chat WhatsApp
async function loadWhatsAppChats() {
  try {
    const res = await fetch(`${apiBase}/chats/wa`, { headers: authHeaders() });
    if (!res.ok) {
      addLog('Erro ao carregar conversas WhatsApp');
      return;
    }
    
    whatsAppChats = await res.json();
    displayWhatsAppChats(whatsAppChats);
    addLog(`Carregadas ${whatsAppChats.length} conversas WhatsApp`);
  } catch (err) {
    addLog('Erro ao carregar conversas: ' + err.message);
  }
}

function displayWhatsAppChats(chats) {
  const container = $('waChatsList');
  container.innerHTML = '';
  
  if (chats.length === 0) {
    container.innerHTML = `
      <div class="wa-empty-state">
        <div class="wa-empty-icon">💬</div>
        <div class="wa-empty-text">Nenhuma conversa encontrada</div>
      </div>
    `;
    return;
  }
  
  chats.forEach(chat => {
    const chatItem = h('div', { class: 'wa-chat-item', 'data-chat-id': chat.chat_id }, [
      h('div', { class: 'wa-chat-avatar' }, chat.name ? chat.name.charAt(0).toUpperCase() : '👤'),
      h('div', { class: 'wa-chat-content' }, [
        h('div', { class: 'wa-chat-header' }, [
          h('div', { class: 'wa-chat-name' }, chat.name || chat.chat_id),
          h('div', { class: 'wa-chat-time' }, formatTime(chat.timestamp))
        ]),
        h('div', { class: 'wa-chat-preview' }, chat.lastMessage ? chat.lastMessage.slice(0, 50) : 'Nenhuma mensagem')
      ])
    ]);
    
    chatItem.addEventListener('click', () => selectWhatsAppChat(chat));
    container.appendChild(chatItem);
  });
}

function filterWhatsAppChats() {
  const search = $('chatSearch').value.toLowerCase();
  const filtered = whatsAppChats.filter(chat => 
    (chat.name && chat.name.toLowerCase().includes(search)) ||
    (chat.chat_id && chat.chat_id.toLowerCase().includes(search))
  );
  displayWhatsAppChats(filtered);
}

async function selectWhatsAppChat(chat) {
  selectedChatId = chat.chat_id;
  
  // Remove seleção anterior
  document.querySelectorAll('.wa-chat-item').forEach(item => item.classList.remove('selected'));
  
  // Adiciona seleção
  event.target.closest('.wa-chat-item').classList.add('selected');
  
  // Atualiza header
  $('waChatName').textContent = chat.name || chat.chat_id;
  $('waChatStatus').textContent = 'online';
  
  // Carrega mensagens
  await loadWhatsAppMessages(chat.chat_id);
}

async function loadWhatsAppMessages(chatId) {
  try {
    const res = await fetch(`${apiBase}/chats/wa/${encodeURIComponent(chatId)}`, { headers: authHeaders() });
    if (!res.ok) {
      addLog('Erro ao carregar mensagens');
      return;
    }
    
    const messages = await res.json();
    displayWhatsAppMessages(messages);
  } catch (err) {
    addLog('Erro ao carregar mensagens: ' + err.message);
  }
}

function displayWhatsAppMessages(messages) {
  const container = $('waMessages');
  container.innerHTML = '';
  
  if (messages.length === 0) {
    container.innerHTML = `
      <div class="wa-welcome-message">
        <div class="wa-welcome-icon">💬</div>
        <div class="wa-welcome-title">Nenhuma mensagem</div>
        <div class="wa-welcome-text">Inicie uma conversa enviando uma mensagem</div>
      </div>
    `;
    return;
  }
  
  messages.forEach(message => {
    const messageElement = createWhatsAppMessage(message);
    container.appendChild(messageElement);
  });
  
  // Scroll para baixo
  container.scrollTop = container.scrollHeight;
}

function createWhatsAppMessage(message) {
  const isOutgoing = message.direction === 'outbound';
  const messageClass = isOutgoing ? 'wa-message-outgoing' : 'wa-message-incoming';
  
  const messageElement = h('div', { class: `wa-message ${messageClass}` }, [
    h('div', { class: 'wa-message-bubble' }, [
      h('div', { class: 'wa-message-text' }, message.body),
      h('div', { class: 'wa-message-time' }, formatTime(message.created_at))
    ])
  ]);
  
  return messageElement;
}

function handleChatKeyPress(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendWhatsAppMessage();
  }
}

async function sendWhatsAppMessage() {
  const message = $('waMessageInput').value.trim();
  if (!message || !selectedChatId) return;
  
  try {
    const res = await fetch(`${apiBase}/messages/send`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ chatId: selectedChatId, message })
    });
    
    if (res.ok) {
      // Limpa input
      $('waMessageInput').value = '';
      
      // Adiciona mensagem otimisticamente
      const messageData = {
        body: message,
        direction: 'outbound',
        created_at: new Date().toISOString()
      };
      
      const messageElement = createWhatsAppMessage(messageData);
      $('waMessages').appendChild(messageElement);
      $('waMessages').scrollTop = $('waMessages').scrollHeight;
      
      addLog(`Mensagem enviada para ${selectedChatId}`);
    } else {
      addLog('Erro ao enviar mensagem');
    }
  } catch (err) {
    addLog('Erro ao enviar mensagem: ' + err.message);
  }
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// Modal de informações do contato
function showContactInfoModal(info) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const modal = document.createElement('div');
  modal.className = 'modal';
  const header = h('div', { class: 'modal-header' }, [
    h('div', { class: 'modal-title' }, info.name || info.number || 'Contato'),
    h('button', { class: 'modal-close', onClick: () => overlay.remove() }, '✕')
  ]);
  const body = h('div', { class: 'modal-body' }, [
    info.profilePicUrl ? h('img', { src: info.profilePicUrl, class: 'modal-avatar', alt: 'Foto do perfil' }) : null,
    h('div', { class: 'modal-row' }, [h('strong', {}, 'Número: '), h('span', {}, info.number || '-')]),
    h('div', { class: 'modal-row' }, [h('strong', {}, 'Sobre: '), h('span', {}, info.about || '-')]),
    h('div', { class: 'modal-row' }, [h('strong', {}, 'Verificado: '), h('span', {}, info.verifiedName ? 'Sim' : 'Não')]),
  ]);
  modal.appendChild(header);
  modal.appendChild(body);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}



