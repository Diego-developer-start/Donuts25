class Chatbot {
    constructor() {
        this.chatContainer = null;
        this.chatMessages = null;
        this.chatInput = null;
        this.sendButton = null;
        this.isOpen = false;
        this.init();
    }

    init() {
        // Criar elementos do chatbot
        this.createChatInterface();
        this.setupEventListeners();
    }

    createChatInterface() {
        // Criar container principal
        this.chatContainer = document.createElement('div');
        this.chatContainer.className = 'chatbot-container';
        this.chatContainer.innerHTML = `
            <div class="chatbot-header">
                <h3>Assistente Virtual</h3>
                <button class="minimize-btn">−</button>
            </div>
            <div class="chatbot-messages"></div>
            <div class="chatbot-input-container">
                <input type="text" class="chatbot-input" placeholder="Digite sua mensagem...">
                <button class="send-btn">Enviar</button>
            </div>
        `;

        // Adicionar ao body
        document.body.appendChild(this.chatContainer);

        // Referências aos elementos
        this.chatMessages = this.chatContainer.querySelector('.chatbot-messages');
        this.chatInput = this.chatContainer.querySelector('.chatbot-input');
        this.sendButton = this.chatContainer.querySelector('.send-btn');
        this.minimizeButton = this.chatContainer.querySelector('.minimize-btn');

        // Adicionar mensagem inicial
        this.addMessage('Olá! Como posso ajudar você hoje?', 'bot');
    }

    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        this.minimizeButton.addEventListener('click', () => this.toggleChat());
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        // Adicionar mensagem do usuário
        this.addMessage(message, 'user');
        this.chatInput.value = '';

        try {
            console.log('Enviando mensagem:', message);
            
            // Fazer requisição para o servidor
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Resposta recebida:', data);

            if (data.error) {
                throw new Error(data.error);
            }

            this.addMessage(data.response, 'bot');
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            this.addMessage('Desculpe, ocorreu um erro. Por favor, tente novamente.', 'bot');
        }
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message`;
        messageDiv.textContent = text;
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        this.chatContainer.classList.toggle('minimized');
        this.minimizeButton.textContent = this.isOpen ? '−' : '+';
    }
}

// Inicializar o chatbot quando o documento estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new Chatbot();
}); 