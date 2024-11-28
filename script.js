// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBinhf3-PpbAeQaQKToNnLHBBBxVQeLbp4",
    authDomain: "yayy-93c45.firebaseapp.com",
    databaseURL: "https://yayy-93c45-default-rtdb.asia-southeast1.firebasedatabase.app", // Make sure this matches your database URL
    projectId: "yayy-93c45",
    storageBucket: "yayy-93c45.appspot.com",
    messagingSenderId: "281901593072",
    appId: "1:281901593072:web:614dff92e64d25669c6d35",
    measurementId: "G-JB3PWXQ56M"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Check Firebase initialization
console.log("Firebase initialized:", firebase.apps.length > 0);

// Get DOM elements
const heartsContainer = document.getElementById("hearts-container");
const poster = document.getElementById("poster");

function displayWish(wishData) {
    const wishContainer = document.getElementById("wishes-container");
    const wishElement = document.createElement("div");
    wishElement.className = "wish";
    wishElement.style.top = `${wishData.y}px`;
    wishElement.style.left = `${wishData.x}px`;
    wishElement.innerText = `${wishData.name}: ${wishData.text}`;
    wishContainer.appendChild(wishElement);
}


// Function to add a heart locally on the screen
function addHeart(x, y) {
    console.log("Adding heart at:", x, y); // Debug log for heart position
    const heart = document.createElement("div");
    heart.className = "heart";
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    heart.innerText = "❤️";
    heartsContainer.appendChild(heart);

    // Remove the heart after 3 seconds
    setTimeout(() => heart.remove(), 3000);
}

// Add event listener to the poster
poster.addEventListener("click", () => {
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;

    console.log("Poster clicked. Adding heart and saving to Firebase.");

    // Add heart locally
    addHeart(x, y);

    // Push the heart's coordinates to Firebase
    db.ref("hearts").push({ x, y })
        .then(() => console.log("Heart saved to Firebase"))
        .catch((error) => console.error("Error saving heart to Firebase:", error));
});

// Listen for hearts added in Firebase
db.ref("hearts").on("child_added", (data) => {
    const heart = data.val();
    console.log("Heart retrieved from Firebase:", heart);
    addHeart(heart.x, heart.y);
});

// Add this after your existing Firebase initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing PowerupSystem...');
    window.powerupSystem = new PowerupSystem();
});

class PowerupSystem {
    constructor() {
        this.POWERUPS = {
            MULTIPLIER: {
                cost: 1000,
                duration: 30000,
                active: false,
                effect: () => {
                    this.clickMultiplier *= 2;
                }
            },
            AUTO_CLICKER: {
                cost: 2000,
                duration: 20000,
                active: false,
                interval: null,
                effect: () => {
                    const interval = setInterval(() => {
                        this.addInstantHearts(5);
                    }, 200);
                    this.POWERUPS.AUTO_CLICKER.interval = interval;
                }
            },
            HEART_BURST: {
                cost: 500,
                duration: 0,
                active: false,
                effect: () => {
                    this.addInstantHearts(10);
                }
            },
            SCORE_SHIELD: {
                cost: 3000,
                duration: 45000,
                active: false,
                effect: () => {
                    this.scoreShield = true;
                }
            },
            RAPID_FIRE: {
                cost: 4000,
                duration: 20000,
                active: false,
                effect: () => {
                    this.clickMultiplier *= 3;
                }
            },
            LUCKY_CHARM: {
                cost: 5000,
                duration: 30000,
                active: false,
                effect: () => {
                    this.luckyCharm = true;
                }
            },
            GOLDEN_HEART: {
                cost: 7500,
                duration: 25000,
                active: false,
                effect: () => {
                    this.heartMultiplier *= 10;
                }
            },
            TIME_WARP: {
                cost: 10000,
                duration: 15000,
                active: false,
                effect: () => {
                    this.gameSpeed *= 2;
                }
            },
            MEGA_BURST: {
                cost: 15000,
                duration: 0,
                active: false,
                effect: () => {
                    this.addInstantHearts(100);
                    this.showMegaBurstEffect();
                }
            }
        };

        // Initialize variables
        this.clickMultiplier = 1;
        this.heartMultiplier = 1;
        this.gameSpeed = 1;
        this.scoreShield = false;
        this.luckyCharm = false;
        this.activePowerups = new Map();

        // Initialize shop
        this.initializePowerups();

        // Initialize inventory system
        this.inventory = new Map();
        this.loadInventory();
        this.initializeInventoryUI();
    }

    initializePowerups() {
        console.log('Initializing powerup buttons...');
        document.querySelectorAll('.buy-button').forEach(button => {
            const powerupItem = button.closest('.powerup-item');
            const powerupId = powerupItem.dataset.powerup;
            console.log('Setting up button for:', powerupId);
            
            button.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Buy clicked for:', powerupId);
                await this.buyPowerup(powerupId);
            };
        });
    }

    initializeInventoryUI() {
        const inventoryButton = document.getElementById('inventoryButton');
        const inventoryModal = document.getElementById('inventoryModal');
        
        console.log('Initializing inventory UI...');
        console.log('Found inventory button:', !!inventoryButton);
        console.log('Found inventory modal:', !!inventoryModal);
        
        if (!inventoryButton) {
            console.error('Inventory button not found in the DOM');
            return;
        }
        
        if (!inventoryModal) {
            console.error('Inventory modal not found in the DOM');
            return;
        }

        inventoryButton.addEventListener('click', (e) => {
            console.log('Inventory button clicked');
            e.preventDefault();
            e.stopPropagation();
            inventoryModal.style.display = 'block';
            this.updateInventoryDisplay();
        });

        const closeButton = inventoryModal.querySelector('.close-button');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                console.log('Close button clicked');
                inventoryModal.style.display = 'none';
            });
        } else {
            console.error('Close button not found in modal');
        }

        // Cleanup old event listeners
        if (this.closeModalHandler) {
            window.removeEventListener('click', this.closeModalHandler);
        }

        // Store the handler for future cleanup
        this.closeModalHandler = (event) => {
            if (event.target === inventoryModal) {
                inventoryModal.style.display = 'none';
            }
        };
        window.addEventListener('click', this.closeModalHandler);
    }

    async loadInventory() {
        try {
            const snapshot = await firebase.database()
                .ref(`players/${userKey}/inventory`)
                .once('value');
            const inventoryData = snapshot.val() || {};
            
            Object.entries(inventoryData).forEach(([powerupId, count]) => {
                this.inventory.set(powerupId, count);
            });
            
            console.log('Loaded inventory:', this.inventory);
        } catch (error) {
            console.error('Error loading inventory:', error);
        }
    }

    async buyPowerup(powerupId) {
        console.log('Attempting to buy:', powerupId);
        const powerup = this.POWERUPS[powerupId];
        if (!powerup) return;

        try {
            // Get current player data from Firebase
            const playerSnapshot = await firebase.database().ref('players').child(userKey).once('value');
            const playerData = playerSnapshot.val();
            const currentHearts = playerData?.hearts || 0;

            console.log('Current hearts:', currentHearts, 'Cost:', powerup.cost);

            if (currentHearts >= powerup.cost && !powerup.active) {
                try {
                    // Deduct hearts and add to inventory
                    await firebase.database().ref(`players/${userKey}`).update({
                        hearts: currentHearts - powerup.cost,
                        [`inventory/${powerupId}`]: firebase.database.ServerValue.increment(1)
                    });

                    // Update local inventory
                    const currentCount = this.inventory.get(powerupId) || 0;
                    this.inventory.set(powerupId, currentCount + 1);

                    // Update displays
                    document.getElementById('score').textContent = currentHearts - powerup.cost;
                    this.updateInventoryDisplay();

                    this.showNotification(`${powerupId.replace(/_/g, ' ')} added to inventory!`, 'success');
                } catch (error) {
                    console.error('Purchase failed:', error);
                    this.showNotification('Purchase failed!', 'error');
                }
            } else if (powerup.active) {
                this.showNotification('This powerup is already active!', 'warning');
            } else {
                this.showNotification('Not enough hearts!', 'error');
            }
        } catch (error) {
            console.error('Error buying powerup:', error);
            this.showNotification('Failed to purchase powerup', 'error');
        }
    }

    addInstantHearts(amount) {
        const scoreElement = document.getElementById('score');
        const currentHearts = parseInt(scoreElement.textContent) || 0;
        const newHearts = currentHearts + amount;
        
        // Update Firebase
        firebase.database().ref(`players/${userKey}`).update({
            hearts: newHearts
        });
        
        // Update local display
        scoreElement.textContent = newHearts;
    }

    updatePowerupUI(powerupType, active) {
        const powerupItem = document.querySelector(`.powerup-item[data-powerup="${powerupType}"]`);
        if (!powerupItem) return;

        const timerDiv = powerupItem.querySelector('.powerup-timer');
        if (!timerDiv) return;

        if (active && this.POWERUPS[powerupType].duration > 0) {
            powerupItem.classList.add('active');
            let timeLeft = this.POWERUPS[powerupType].duration / 1000;
            
            const updateTimer = setInterval(() => {
                timeLeft--;
                if (timeLeft <= 0) {
                    clearInterval(updateTimer);
                    timerDiv.textContent = '';
                    powerupItem.classList.remove('active');
                } else {
                    timerDiv.textContent = `${timeLeft}s`;
                }
            }, 1000);
        }
    }

    showMegaBurstEffect() {
        const container = document.getElementById('hearts-container');
        for (let i = 0; i < 20; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart mega-burst';
            heart.innerHTML = '💖';
            
            const x = Math.random() * container.offsetWidth;
            const y = Math.random() * container.offsetHeight;
            
            heart.style.left = `${x}px`;
            heart.style.top = `${y}px`;
            
            container.appendChild(heart);
            
            setTimeout(() => heart.remove(), 1500);
        }
    }

    showNotification(message, type = 'success') {
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            document.body.appendChild(notification);
        }

        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';

        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    updateInventoryDisplay() {
        const inventoryGrid = document.querySelector('#inventoryModal .inventory-grid');
        if (!inventoryGrid) return;

        inventoryGrid.innerHTML = '';

        if (this.inventory.size === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-inventory-message';
            emptyMessage.textContent = 'Your inventory is empty. Purchase powerups from the shop!';
            inventoryGrid.appendChild(emptyMessage);
            return;
        }

        this.inventory.forEach((count, powerupId) => {
            if (count > 0) {
                const powerup = this.POWERUPS[powerupId];
                const powerupElement = document.createElement('div');
                powerupElement.className = 'powerup-item';
                powerupElement.innerHTML = `
                    <div class="powerup-icon">${this.getPowerupIcon(powerupId)}</div>
                    <div class="powerup-name">${powerupId.replace(/_/g, ' ')}</div>
                    <div class="powerup-description">${this.getPowerupDescription(powerupId)}</div>
                    <div class="powerup-count">Owned: ${count}</div>
                    <button class="use-button" ${powerup.active ? 'disabled' : ''}>
                        ${powerup.active ? 'Active' : 'Use'}
                    </button>
                `;

                const useButton = powerupElement.querySelector('.use-button');
                useButton.onclick = () => this.usePowerup(powerupId);

                inventoryGrid.appendChild(powerupElement);
            }
        });
    }

    getPowerupIcon(powerupId) {
        const icons = {
            MULTIPLIER: '⚡',
            AUTO_CLICKER: '🤖',
            HEART_BURST: '💥',
            SCORE_SHIELD: '🛡️',
            RAPID_FIRE: '🔥',
            LUCKY_CHARM: '🍀',
            GOLDEN_HEART: '💝',
            TIME_WARP: '⌛',
            MEGA_BURST: '💥'
        };
        return icons[powerupId] || '🎁';
    }

    getPowerupDescription(powerupId) {
        const descriptions = {
            MULTIPLIER: 'Double your clicks for 30 seconds',
            AUTO_CLICKER: 'Automatically clicks 5 times per second',
            HEART_BURST: 'Creates 10 hearts instantly',
            SCORE_SHIELD: 'Protects 30% of your score in battles',
            RAPID_FIRE: 'Triple click value for 20 seconds',
            LUCKY_CHARM: '30% chance for 5x hearts per click',
            GOLDEN_HEART: 'Hearts worth 10x more for 25 seconds',
            TIME_WARP: 'Double game speed for 15 seconds',
            MEGA_BURST: 'Instant burst of 100 hearts'
        };
        return descriptions[powerupId] || 'Special powerup';
    }

    async usePowerup(powerupId) {
        const count = this.inventory.get(powerupId) || 0;
        if (count <= 0) {
            this.showNotification('You don\'t have any of this powerup!', 'error');
            return;
        }

        const powerup = this.POWERUPS[powerupId];
        if (powerup.active) {
            this.showNotification('This powerup is already active!', 'warning');
            return;
        }

        this.inventory.set(powerupId, count - 1);
        await firebase.database().ref(`players/${userKey}/inventory/${powerupId}`).set(count - 1);

        powerup.active = true;
        this.updatePowerupStatus(powerupId, true);
        powerup.effect();

        this.updateInventoryDisplay();
        this.showNotification(`Activated ${powerupId.replace(/_/g, ' ')}!`, 'success');
    }

    initializeModals() {
        window.addEventListener('click', (event) => {
            if (event.target === shopModal) {
                shopModal.style.display = 'none';
            }
            if (event.target === inventoryModal) {
                inventoryModal.style.display = 'none';
            }
        });
    }
}

// Initialize PowerupSystem once
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing PowerupSystem...');
    window.powerupSystem = new PowerupSystem();
});

// Add debug button to test click handling
document.addEventListener('DOMContentLoaded', () => {
    const debugButton = document.createElement('button');
    debugButton.textContent = 'Debug Shop';
    debugButton.style.position = 'fixed';
    debugButton.style.bottom = '10px';
    debugButton.style.right = '10px';
    debugButton.style.zIndex = '9999';
    debugButton.onclick = () => {
        console.log('Debug: Testing shop functionality');
        console.log('PowerupSystem:', powerupSystem);
        console.log('Buy buttons:', document.querySelectorAll('.powerup-item .buy-button').length);
        console.log('Current hearts:', document.getElementById('score')?.textContent);
    };
    document.body.appendChild(debugButton);
});

// Debug helper
window.debugPowerups = () => {
    const system = window.powerupSystem;
    if (!system) {
        console.error('PowerupSystem not initialized!');
        return;
    }

    console.log('Current hearts:', document.getElementById('score')?.textContent);
    console.log('PowerupSystem state:', system);
    console.log('Powerup items:', document.querySelectorAll('.powerup-item').length);
    console.log('Buy buttons:', document.querySelectorAll('.powerup-item .buy-button').length);
};

// Required global variables that should be defined elsewhere
let userKey;        // User's Firebase key
let playerName;     // Player's name


