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
            // Check if username exists
            const existingPlayer = await db.ref('players')
                .orderByChild('name')
                .equalTo(username)
                .once('value');

            if (existingPlayer.exists()) {
                throw new Error('Username already taken');
            }

            // Create new player
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