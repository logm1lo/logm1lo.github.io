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

        // Direct initialization
        console.log('PowerupSystem constructor called');
        this.setupShopListeners();
    }

    setupShopListeners() {
        console.log('Setting up shop listeners');
        
        // Setup shop modal
        const shopButton = document.getElementById('shopButton');
        const shopModal = document.getElementById('shopModal');
        const closeButton = shopModal?.querySelector('.close-button');

        if (shopButton && shopModal) {
            shopButton.onclick = () => {
                console.log('Shop opened');
                shopModal.style.display = 'block';
                this.updatePowerupPrices();
            };

            if (closeButton) {
                closeButton.onclick = () => shopModal.style.display = 'none';
            }
        }

        // Setup buy buttons with direct onclick handlers
        document.querySelectorAll('.powerup-item').forEach(item => {
            const buyButton = item.querySelector('.buy-button');
            const powerupType = item.dataset.powerup;
            
            if (buyButton && powerupType) {
                console.log('Setting up button for:', powerupType);
                
                // Direct onclick handler
                buyButton.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Buy clicked:', powerupType);
                    
                    const currentHearts = parseInt(document.getElementById('score').textContent) || 0;
                    const powerup = this.POWERUPS[powerupType];
                    
                    if (currentHearts >= powerup.cost) {
                        // Deduct hearts immediately
                        const newHearts = currentHearts - powerup.cost;
                        document.getElementById('score').textContent = newHearts;
                        
                        // Update Firebase
                        firebase.database().ref('players').child(userKey).update({
                            hearts: newHearts
                        }).then(() => {
                            console.log('Purchase successful:', powerupType);
                            this.activatePowerup(powerupType);
                            this.showNotification(`${powerupType.replace(/_/g, ' ')} purchased!`, 'success');
                            
                            // Play sound
                            const sound = document.getElementById('purchaseSound');
                            if (sound) sound.play().catch(e => console.log('Sound error:', e));
                            
                        }).catch(error => {
                            console.error('Purchase failed:', error);
                            // Rollback hearts if Firebase update fails
                            document.getElementById('score').textContent = currentHearts;
                            this.showNotification('Purchase failed!', 'error');
                        });
                        
                        this.updatePowerupPrices();
                    } else {
                        this.showNotification('Not enough hearts!', 'error');
                    }
                };
            }
        });

        // Update prices initially
        this.updatePowerupPrices();
    }

    updatePowerupPrices() {
        const currentHearts = parseInt(document.getElementById('score')?.textContent) || 0;
        
        document.querySelectorAll('.powerup-item').forEach(item => {
            const powerupType = item.dataset.powerup;
            const powerup = this.POWERUPS[powerupType];
            const buyButton = item.querySelector('.buy-button');
            
            if (powerup && buyButton) {
                const canAfford = currentHearts >= powerup.cost;
                buyButton.disabled = !canAfford;
                buyButton.textContent = canAfford ? 'Buy' : 'Not enough hearts';
                buyButton.style.backgroundColor = canAfford ? '#4CAF50' : '#cccccc';
            }
        });
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

    activatePowerup(type) {
        console.log('Activating powerup:', type);
        const powerup = this.POWERUPS[type];
        
        if (!powerup) {
            console.error('Invalid powerup type:', type);
            return;
        }

        // Apply the powerup effect
        powerup.active = true;
        powerup.effect();

        // For duration-based powerups
        if (powerup.duration > 0) {
            if (this.activePowerups.has(type)) {
                clearTimeout(this.activePowerups.get(type));
            }

            const timer = setTimeout(() => {
                this.deactivatePowerup(type);
            }, powerup.duration);

            this.activePowerups.set(type, timer);
            this.updatePowerupUI(type, true);
        } else {
            // For instant powerups
            this.deactivatePowerup(type);
        }
    }

    deactivatePowerup(type) {
        const powerup = this.POWERUPS[type];
        if (!powerup) return;

        powerup.active = false;

        // Reverse the powerup effects
        switch(type) {
            case 'MULTIPLIER':
                this.clickMultiplier /= 2;
                break;
            case 'AUTO_CLICKER':
                if (powerup.interval) {
                    clearInterval(powerup.interval);
                    powerup.interval = null;
                }
                break;
            case 'SCORE_SHIELD':
                this.scoreShield = false;
                break;
            case 'RAPID_FIRE':
                this.clickMultiplier /= 3;
                break;
            case 'LUCKY_CHARM':
                this.luckyCharm = false;
                break;
            case 'GOLDEN_HEART':
                this.heartMultiplier /= 10;
                break;
            case 'TIME_WARP':
                this.gameSpeed /= 2;
                break;
        }

        this.updatePowerupUI(type, false);
        this.activePowerups.delete(type);
    }

    showMegaBurstEffect() {
        const container = document.getElementById('hearts-container');
        const numHearts = 20;
        
        for (let i = 0; i < numHearts; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart mega-burst';
            heart.innerHTML = '💖';
            
            const x = Math.random() * container.offsetWidth;
            const y = Math.random() * container.offsetHeight;
            
            heart.style.cssText = `
                left: ${x}px;
                top: ${y}px;
                animation-delay: ${i * 50}ms;
            `;
            
            container.appendChild(heart);
            
            setTimeout(() => {
                heart.remove();
            }, 1500);
        }
    }

    addInstantHearts(amount) {
        const currentHearts = parseInt(document.getElementById('score').textContent) || 0;
        const newHearts = currentHearts + amount;
        document.getElementById('score').textContent = newHearts;
        
        firebase.database().ref('players').child(userKey).update({
            hearts: newHearts
        });
    }
}

// Initialize PowerupSystem immediately and on DOM load
let powerupSystem = new PowerupSystem();

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, reinitializing PowerupSystem');
    powerupSystem = new PowerupSystem();
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
