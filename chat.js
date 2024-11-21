class ChatSystem {
    constructor(auth) {
        this.auth = auth;
        this.currentTab = 'all';
        this.init();
    }

    init() {
        this.initializeListeners();
        this.setupChatUI();
    }

    initializeListeners() {
        const wishesRef = db.ref('wishes');
        
        wishesRef.on('child_added', (snapshot) => {
            const message = snapshot.val();
            if (this.shouldShowMessage(message)) {
                this.displayMessage(message);
            }
        });
    }

    shouldShowMessage(message) {
        if (this.currentTab === 'all') return true;
        if (this.currentTab === 'friends' && this.auth.currentUser) {
            return this.auth.currentUser.friends && 
                   (this.auth.currentUser.friends[message.playerId] || 
                    message.playerId === this.auth.currentUser.id);
        }
        return false;
    }

    async sendMessage(text) {
        if (!text.trim()) return;

        try {
            const messageData = {
                playerId: this.auth.currentUser ? this.auth.currentUser.id : 'guest',
                playerName: this.auth.currentUser ? this.auth.currentUser.name : 'Guest',
                text: text,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };

            await db.ref('wishes').push(messageData);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    displayMessage(message) {
        const chatMessages = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');
        
        const isCurrentUser = this.auth.currentUser && 
                             message.playerId === this.auth.currentUser.id;
        
        messageElement.className = `chat-message ${isCurrentUser ? 'sent' : 'received'}`;
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="message-username">${message.playerName}</span>
                <span class="message-time">${this.formatTime(message.timestamp)}</span>
            </div>
            <div class="message-text">${message.text}</div>
        `;

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    setupChatUI() {
        const chatToggle = document.querySelector('.chat-toggle');
        const chatSystem = document.querySelector('.chat-system');
        const chatTabs = document.querySelectorAll('.chat-tab');
        const chatInput = document.getElementById('chatInput');
        const sendButton = document.getElementById('sendMessage');

        chatToggle.addEventListener('click', () => {
            chatSystem.classList.toggle('collapsed');
            chatToggle.textContent = chatSystem.classList.contains('collapsed') ? '▼' : '▲';
        });

        chatTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                chatTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentTab = tab.dataset.chat;
                this.refreshMessages();
            });
        });

        sendButton.addEventListener('click', () => {
            this.sendMessage(chatInput.value);
            chatInput.value = '';
        });

        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage(chatInput.value);
                chatInput.value = '';
            }
        });
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    async refreshMessages() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        
        const messages = await db.ref('wishes')
            .orderByChild('timestamp')
            .limitToLast(50)
            .once('value');
        
        messages.forEach(snapshot => {
            const message = snapshot.val();
            if (this.shouldShowMessage(message)) {
                this.displayMessage(message);
            }
        });
    }
} 