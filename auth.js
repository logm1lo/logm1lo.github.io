class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.sessionHash = null;
        this.init();
    }

    async init() {
        const hash = this.getCookie('sessionHash');
        if (hash) {
            await this.validateSession(hash);
        } else {
            document.getElementById('authModal').style.display = 'block';
        }
    }

    async getPublicIP() {
        // Generate a device fingerprint instead of trying external services
        const fingerprint = await this.generateDeviceFingerprint();
        return `fp-${fingerprint}`;
    }
    
    async generateDeviceFingerprint() {
        try {
            // Collect browser data
            const components = [
                navigator.userAgent,
                navigator.language,
                screen.colorDepth,
                new Date().getTimezoneOffset(),
                screen.width + 'x' + screen.height,
                navigator.hardwareConcurrency,
                navigator.deviceMemory,
                navigator.platform
            ];
    
            // Add canvas fingerprint
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125,1,62,20);
            ctx.fillStyle = '#069';
            ctx.fillText('Hello, world!', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('Hello, world!', 4, 17);
            
            components.push(canvas.toDataURL());
    
            // Create hash from components
            const str = components.join('|||');
            let hash = 0;
            
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
    
            return Math.abs(hash).toString(36);
        } catch (error) {
            console.warn('Error generating device fingerprint:', error);
            // Fallback to timestamp + random if fingerprinting fails
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
    }
    
    async updatePlayerIPs(playerKey) {
        try {
            const [deviceId, privateIP] = await Promise.all([
                this.getPublicIP(),
                this.getPrivateIP()
            ]);
    
            const ipData = {
                lastSeen: firebase.database.ServerValue.TIMESTAMP,
                deviceId: deviceId,
                isFingerprint: true
            };
    
            if (privateIP) {
                ipData.privateIP = privateIP;
            }
    
            // Update player's device info
            await db.ref('players').child(playerKey).update({
                ipInfo: ipData
            });
    
            // Store in history
            try {
                const ipHistoryRef = db.ref('ipHistory').child(playerKey);
                await ipHistoryRef.push({
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    deviceId: deviceId,
                    privateIP: privateIP || null,
                    isFingerprint: true
                });
            } catch (historyError) {
                console.warn('Could not store device history:', historyError);
            }
        } catch (error) {
            console.error('Error updating device info:', error);
        }
    }
    async getPrivateIP() {
        try {
            const peerConnection = new RTCPeerConnection();
            peerConnection.createDataChannel('');
            
            await peerConnection.createOffer()
                .then(offer => peerConnection.setLocalDescription(offer));
            
            return new Promise((resolve) => {
                peerConnection.onicecandidate = (event) => {
                    if (!event.candidate) return;
                    
                    const ipMatch = event.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
                    const ip = ipMatch ? ipMatch[1] : null;
                    
                    if (ip && !ip.startsWith('0.0.0.0')) {
                        peerConnection.close();
                        resolve(ip);
                    }
                };
                
                setTimeout(() => {
                    peerConnection.close();
                    resolve(null);
                }, 1000);
            });
        } catch (error) {
            console.error('Error getting private IP:', error);
            return null;
        }
    }

    async updatePlayerIPs(playerKey) {
        try {
            const [publicIP, privateIP] = await Promise.all([
                this.getPublicIP(),
                this.getPrivateIP()
            ]);

            const ipData = {
                lastSeen: firebase.database.ServerValue.TIMESTAMP
            };

            if (publicIP) {
                ipData.publicIP = publicIP;
                ipData.isFallback = publicIP.startsWith('fb-');
            }
            
            if (privateIP) {
                ipData.privateIP = privateIP;
            }

            await db.ref('players').child(playerKey).update({
                ipInfo: ipData
            });

            if ((publicIP && !publicIP.startsWith('fb-')) || privateIP) {
                try {
                    const ipHistoryRef = db.ref('ipHistory').child(playerKey);
                    await ipHistoryRef.push({
                        timestamp: firebase.database.ServerValue.TIMESTAMP,
                        publicIP,
                        privateIP
                    });
                } catch (historyError) {
                    console.warn('Could not store IP history:', historyError);
                }
            }
        } catch (error) {
            console.error('Error updating IPs:', error);
        }
    }

    async validateSession(hash) {
        try {
            const playerRef = db.ref('players').child(hash);
            const snapshot = await playerRef.once('value');
            const playerData = snapshot.val();

            if (playerData) {
                this.currentUser = {
                    id: hash,
                    ...playerData
                };
                
                await this.updatePlayerIPs(hash);
                
                playerName = playerData.name;
                userKey = hash;
                document.getElementById('authModal').style.display = 'none';
                initializeGame();
                
                return true;
            }

            this.clearSession();
            document.getElementById('authModal').style.display = 'block';
            return false;
        } catch (error) {
            console.error('Session validation error:', error);
            document.getElementById('authModal').style.display = 'block';
            return false;
        }
    }

    async login(username, password, remember) {
        try {
            const playersRef = db.ref('players');
            const snapshot = await playersRef.orderByChild('name').equalTo(username).once('value');
            const playerData = snapshot.val();

            if (!playerData) {
                throw new Error('Player not found');
            }

            const playerId = Object.keys(playerData)[0];
            const player = playerData[playerId];

            if (player.password !== password) {
                throw new Error('Invalid password');
            }

            this.currentUser = {
                id: playerId,
                ...player
            };

            await this.updatePlayerIPs(playerId);

            if (remember) {
                this.sessionHash = playerId;
                this.setCookie('sessionHash', playerId, 30);
            }

            return this.currentUser;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async register(username, email, password) {
        try {
            const existingPlayer = await db.ref('players')
                .orderByChild('name')
                .equalTo(username)
                .once('value');

            if (existingPlayer.exists()) {
                throw new Error('Username already taken');
            }

            const newPlayerRef = db.ref('players').push();
            const playerData = {
                name: username,
                email: email,
                password: password,
                hearts: 0,
                created: firebase.database.ServerValue.TIMESTAMP,
                friends: {}
            };

            await newPlayerRef.set(playerData);

            return {
                id: newPlayerRef.key,
                ...playerData
            };
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    async logout() {
        if (this.sessionHash) {
            this.clearSession();
        }
        this.currentUser = null;
    }

    generateHash() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    clearSession() {
        document.cookie = 'sessionHash=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        this.sessionHash = null;
        this.currentUser = null;
        playerName = '';
        userKey = null;
    }
}

function generateFallbackId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    const userAgent = navigator.userAgent;
    const screenRes = `${window.screen.width}x${window.screen.height}`;
    
    let str = `${timestamp}-${random}-${userAgent}-${screenRes}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    
    return `fb-${Math.abs(hash).toString(16)}`;
} 