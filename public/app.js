// API Base URL - será automaticamente a URL do Railway quando deployado
const API_BASE = window.location.origin + '/api';

// Tab Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Update active button
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update active content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
    });
});

// Set API endpoint display
document.getElementById('apiEndpoint').textContent = API_BASE;

// Test Connection
async function testConnection() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        
        if (data.status === 'ok') {
            showNotification('✅ Conexão OK! Sistema operacional.', 'success');
            document.getElementById('status').textContent = '🟢 Online';
        } else {
            showNotification('⚠️ Sistema com problemas.', 'warning');
        }
    } catch (error) {
        showNotification('❌ Erro ao conectar com o servidor.', 'error');
        document.getElementById('status').textContent = '🔴 Offline';
    }
}

// Check Health
async function checkHealth() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        
        showNotification(`
            ✅ Sistema Saudável!
            Serviço: ${data.service}
            Ambiente: ${data.environment}
            Hora: ${new Date(data.timestamp).toLocaleString('pt-BR')}
        `, 'success');
    } catch (error) {
        showNotification('❌ Erro ao verificar saúde do sistema.', 'error');
    }
}

// Send Message
async function sendMessage() {
    const phoneNumber = document.getElementById('phoneNumber').value;
    const messageText = document.getElementById('messageText').value;
    
    if (!phoneNumber || !messageText) {
        showNotification('⚠️ Preencha todos os campos!', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/messages/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                number: phoneNumber,
                message: messageText
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('✅ Mensagem enviada com sucesso!', 'success');
            document.getElementById('phoneNumber').value = '';
            document.getElementById('messageText').value = '';
            
            // Update stats
            const statElement = document.querySelector('.stat-number');
            const currentCount = parseInt(statElement.textContent) || 0;
            statElement.textContent = currentCount + 1;
        } else {
            showNotification('❌ Erro ao enviar mensagem.', 'error');
        }
    } catch (error) {
        showNotification('❌ Erro de conexão.', 'error');
    }
}

// Analyze Sentiment
async function analyzeSentiment() {
    const text = document.getElementById('sentimentText').value;
    
    if (!text) {
        showNotification('⚠️ Digite um texto para analisar!', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });
        
        const data = await response.json();
        
        const sentimentEmoji = {
            positive: '😊',
            negative: '😔',
            neutral: '😐'
        };
        
        const sentimentColor = {
            positive: '#10b981',
            negative: '#ef4444',
            neutral: '#6b7280'
        };
        
        document.getElementById('sentimentResult').innerHTML = `
            <div style="padding: 1rem; background: ${sentimentColor[data.sentiment]}20; border-left: 4px solid ${sentimentColor[data.sentiment]};">
                <h4>Resultado da Análise ${sentimentEmoji[data.sentiment]}</h4>
                <p><strong>Sentimento:</strong> ${data.sentiment}</p>
                <p><strong>Resposta Automática:</strong> ${data.autoReply}</p>
            </div>
        `;
    } catch (error) {
        showNotification('❌ Erro ao analisar sentimento.', 'error');
    }
}

// Check WhatsApp Status
async function checkWhatsApp() {
    try {
        const response = await fetch(`${API_BASE}/whatsapp/status`);
        const data = await response.json();
        
        document.getElementById('whatsappStatus').textContent = 
            data.connected ? '✅ Conectado' : '🔴 Desconectado';
        
        showNotification(data.message, data.connected ? 'success' : 'info');
    } catch (error) {
        showNotification('❌ Erro ao verificar WhatsApp.', 'error');
    }
}

// Excel File Upload
document.getElementById('excelFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    showNotification('📊 Processando arquivo Excel...', 'info');
    
    // Simulated processing
    setTimeout(() => {
        document.getElementById('excelResult').innerHTML = `
            <div style="padding: 1rem; background: #10b98120; border-left: 4px solid #10b981;">
                <h4>✅ Arquivo Processado!</h4>
                <p>Nome: ${file.name}</p>
                <p>Tamanho: ${(file.size / 1024).toFixed(2)} KB</p>
                <p>Tipo: ${file.type || 'Excel'}</p>
            </div>
        `;
        showNotification('✅ Excel processado com sucesso!', 'success');
    }, 2000);
});

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initial connection test
window.addEventListener('load', () => {
    testConnection();
});