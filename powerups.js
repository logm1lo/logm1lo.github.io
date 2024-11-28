// PowerupSystem class definition
class PowerupSystem {
    constructor() {
        // Initialize multipliers and states
        this.clickMultiplier = 1;
        this.heartMultiplier = 1;
        this.gameSpeed = 1;
        this.scoreShield = false;
        this.luckyCharm = false;
        this.passiveInterval = null;
        this.clicks = 0;

        // Track individual powerup multipliers
        this.activeMultipliers = {
            MULTIPLIER: 1,
            RAPID_FIRE: 1,
            GOLDEN_HEART: 1
        };

        // Override the global handleClick to use multipliers
        const originalHandleClick = window.handleClick;
        window.handleClick = async (event) => {
            if (!playerName) return;
            
            const now = performance.now();
            if (now - lastProcessedClick < MIN_CLICK_INTERVAL) return;
            lastProcessedClick = now;
            
            try {
                clickTimes.push(now);
                
                // Calculate total multiplier by multiplying all active multipliers
                const totalMultiplier = this.activeMultipliers.MULTIPLIER * 
                                      this.activeMultipliers.RAPID_FIRE * 
                                      this.activeMultipliers.GOLDEN_HEART;
                
                // Calculate hearts based on total multiplier
                const heartsToAdd = 1 * totalMultiplier;
                
                const updates = {
                    hearts: firebase.database.ServerValue.increment(heartsToAdd),
                    lastUpdate: firebase.database.ServerValue.TIMESTAMP
                };
                
                await playersRef.child(userKey).update(updates);
                displayHeart(event);
                
                // Update score display immediately
                const scoreElement = document.getElementById('score');
                if (scoreElement) {
                    const currentScore = parseInt(scoreElement.textContent) || 0;
                    scoreElement.textContent = currentScore + heartsToAdd;
                }
                
                this.showFloatingText(`+${heartsToAdd} ❤️ ${
                    Object.entries(this.activeMultipliers)
                        .filter(([_, value]) => value > 1)
                        .map(([key, value]) => `${key}(${value}x)`)
                        .join(' ')
                }`); 
                
                const snapshot = await playersRef.child(userKey).once('value');
                const currentScore = snapshot.val()?.hearts || 0;
                checkMilestone(currentScore);
            } catch (error) {
                console.error('Error in click:', error);
            }
        };

        this.POWERUPS = {
            MULTIPLIER: {
                cost: 150,
                duration: 30000,
                active: false,
                effect: () => {
                    this.activeMultipliers.MULTIPLIER = 2;  // 2x multiplier
                }
            },
            RAPID_FIRE: {
                cost: 500,
                duration: 20000,
                active: false,
                effect: () => {
                    this.activeMultipliers.RAPID_FIRE = 3;  // 3x multiplier
                }
            },
            AUTO_CLICKER: {
                cost: 1000,
                duration: 20000,
                active: false,
                interval: null,
                effect: () => {
                    const interval = setInterval(() => {
                        this.addInstantHearts(10);
                    }, 200);
                    this.POWERUPS.AUTO_CLICKER.interval = interval;
                }
            },
            HEART_BURST: {
                cost: 50,
                duration: 0,
                active: false,
                effect: () => {
                    this.addInstantHearts(70);
                }
            },
            SCORE_SHIELD: {
                cost: 3000,
                duration: 45000,
                active: false,
                effect: () => {
                    this.scoreShield = true;
                    
                    // Override the global handleClick to prevent score loss
                    const originalHandleClick = window.handleClick;
                    window.handleClick = async (event) => {
                        if (!playerName) return;
                        
                        const now = performance.now();
                        if (now - lastProcessedClick < MIN_CLICK_INTERVAL) return;
                        lastProcessedClick = now;
                        
                        try {
                            clickTimes.push(now);
                            const updates = {
                                hearts: firebase.database.ServerValue.increment(1),
                                lastUpdate: firebase.database.ServerValue.TIMESTAMP
                            };
                            await playersRef.child(userKey).update(updates);
                            displayHeart(event);
                            this.showFloatingText('🛡️ +1 ❤️');
                        } catch (error) {
                            console.error('Error in shielded click:', error);
                        }
                    };
                    this.POWERUPS.SCORE_SHIELD.originalHandler = originalHandleClick;
                }
            },
            LUCKY_CHARM: {
                cost: 5000,
                duration: 30000,
                active: false,
                effect: () => {
                    this.luckyCharm = true;
                    
                    // Override handleClick for lucky bonus hearts
                    const originalHandleClick = window.handleClick;
                    window.handleClick = async (event) => {
                        if (!playerName) return;
                        
                        const now = performance.now();
                        if (now - lastProcessedClick < MIN_CLICK_INTERVAL) return;
                        lastProcessedClick = now;
                        
                        try {
                            clickTimes.push(now);
                            // 25% chance for double hearts
                            const luckyBonus = Math.random() < 0.25 ? 2 : 1;
                            const updates = {
                                hearts: firebase.database.ServerValue.increment(luckyBonus),
                                lastUpdate: firebase.database.ServerValue.TIMESTAMP
                            };
                            await playersRef.child(userKey).update(updates);
                            displayHeart(event);
                            this.showFloatingText(luckyBonus === 2 ? '🍀 +2 ❤️' : '+1 ❤️');
                        } catch (error) {
                            console.error('Error in lucky click:', error);
                        }
                    };
                    this.POWERUPS.LUCKY_CHARM.originalHandler = originalHandleClick;
                }
            },
            GOLDEN_HEART: {
                cost: 7500,
                duration: 25000,
                active: false,
                effect: () => {
                    this.activeMultipliers.GOLDEN_HEART = 10;  // 10x multiplier
                }
            },
            TIME_WARP: {
                cost: 10000,
                duration: 15000,
                active: false,
                effect: () => {
                    this.gameSpeed = 2;
                    
                    // Override handleClick for faster processing
                    const originalHandleClick = window.handleClick;
                    window.handleClick = async (event) => {
                        if (!playerName) return;
                        
                        // Reduced click interval during time warp
                        const now = performance.now();
                        if (now - lastProcessedClick < MIN_CLICK_INTERVAL / 2) return;
                        lastProcessedClick = now;
                        
                        try {
                            clickTimes.push(now);
                            const updates = {
                                hearts: firebase.database.ServerValue.increment(1),
                                lastUpdate: firebase.database.ServerValue.TIMESTAMP
                            };
                            await playersRef.child(userKey).update(updates);
                            displayHeart(event);
                            this.showFloatingText('⚡ +1 ❤️');
                        } catch (error) {
                            console.error('Error in time warp click:', error);
                        }
                    };
                    this.POWERUPS.TIME_WARP.originalHandler = originalHandleClick;
                }
            },
            MEGA_BURST: {
                cost: 15000,
                duration: 0,
                active: false,
                effect: async () => {
                    try {
                        // Get current hearts
                        const snapshot = await playersRef.child(userKey).once('value');
                        const currentHearts = snapshot.val()?.hearts || 0;
                        
                        // Add 100 hearts instantly
                        const updates = {
                            hearts: currentHearts + 100,
                            lastUpdate: firebase.database.ServerValue.TIMESTAMP
                        };
                        
                        await playersRef.child(userKey).update(updates);
                        
                        // Update score display immediately
                        const scoreElement = document.getElementById('score');
                        if (scoreElement) {
                            scoreElement.textContent = currentHearts + 100;
                        }
                        
                        this.showFloatingText('💥 +100 ❤️');
                        this.showMegaBurstEffect();
                    } catch (error) {
                        console.error('Error in mega burst:', error);
                    }
                }
            }
        };

        this.inventory = new Map();
        this.initializePowerups();
        this.loadInventory();
        this.initializeInventoryUI();
    }

    async getHearts() {
        const snapshot = await firebase.database().ref(`players/${userKey}/hearts`).once('value');
        return snapshot.val() || 0;
    }

    async setHearts(amount) {
        await firebase.database().ref(`players/${userKey}/hearts`).set(amount);
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = amount;
        }
    }

    deactivatePowerup(powerupId) {
        const powerup = this.POWERUPS[powerupId];
        if (!powerup || !powerup.active) return;

        powerup.active = false;

        // Reset specific multiplier when powerup ends
        if (this.activeMultipliers.hasOwnProperty(powerupId)) {
            this.activeMultipliers[powerupId] = 1;
        }

        switch(powerupId) {
            case 'SCORE_SHIELD':
                this.scoreShield = false;
                if (powerup.originalHandler) window.handleClick = powerup.originalHandler;
                break;
            case 'LUCKY_CHARM':
                this.luckyCharm = false;
                if (powerup.originalHandler) window.handleClick = powerup.originalHandler;
                break;
            case 'GOLDEN_HEART':
                if (powerup.originalHandler) window.handleClick = powerup.originalHandler;
                break;
            case 'TIME_WARP':
                this.gameSpeed = 1;
                if (powerup.originalHandler) window.handleClick = powerup.originalHandler;
                break;
            case 'MULTIPLIER':
            case 'RAPID_FIRE':
                this.clickMultiplier = 1;
                if (powerup.originalHandler) {
                    window.handleClick = powerup.originalHandler;  
                }
                break;
            // MEGA_BURST doesn't need deactivation as it's instant
        }

        this.updateInventoryDisplay();
        this.showNotification(`${powerupId.replace(/_/g, ' ')} has worn off`, 'info');
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
            
            this.updateInventoryDisplay();
        } catch (error) {
            console.error('Error loading inventory:', error);
        }
    }

    initializeInventoryUI() {
        const inventoryButton = document.getElementById('inventoryButton');
        const inventoryModal = document.getElementById('inventoryModal');
        
        if (!inventoryButton || !inventoryModal) {
            console.error('Missing elements:', {
                button: !!inventoryButton,
                modal: !!inventoryModal
            });
            return;
        }

        // Clear any existing event listeners
        const newButton = inventoryButton.cloneNode(true);
        inventoryButton.parentNode.replaceChild(newButton, inventoryButton);

        // Add click handler
        newButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            inventoryModal.style.display = 'block';
            this.updateInventoryDisplay();
        });

        // Remove the duplicate event listeners from index.html
        const closeButton = inventoryModal.querySelector('.close-button');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                inventoryModal.style.display = 'none';
            });
        }

        // Handle clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === inventoryModal) {
                inventoryModal.style.display = 'none';
            }
        });
    }

    showMegaBurstEffect() {
        // Create visual effect for mega burst
        const effect = document.createElement('div');
        effect.className = 'mega-burst-effect';
        document.body.appendChild(effect);

        // Remove effect after animation
        setTimeout(() => {
            effect.remove();
        }, 1000);
    }

    updateInventoryDisplay() {
        const inventoryGrid = document.querySelector('.inventory-grid');
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
            AUTO_CLICKER: 'Automatically clicks 10 times per second',
            HEART_BURST: 'Creates 70 hearts instantly',
            SCORE_SHIELD: 'Protects 30% of your score in battles',
            RAPID_FIRE: 'Triple click value for 20 seconds',
            LUCKY_CHARM: '30% chance for 5x hearts per click',
            GOLDEN_HEART: 'Hearts worth 10x more for 25 seconds',
            TIME_WARP: 'Double game speed for 15 seconds',
            MEGA_BURST: 'Instant burst of 100 hearts'
        };
        return descriptions[powerupId] || 'Special powerup';
    }

    async buyPowerup(powerupId) {
        const powerup = this.POWERUPS[powerupId];
        if (!powerup) {
            console.error('Invalid powerup:', powerupId);
            return;
        }

        try {
            // Get current hearts from Firebase
            const playerSnapshot = await firebase.database().ref(`players/${userKey}`).once('value');
            const playerData = playerSnapshot.val();
            const currentHearts = playerData?.hearts || 0;
            if (currentHearts >= powerup.cost) {
                // Deduct hearts
                await firebase.database().ref(`players/${userKey}/hearts`).set(currentHearts - powerup.cost);

                // Add to inventory
                const currentCount = this.inventory.get(powerupId) || 0;
                const newCount = currentCount + 1;
                this.inventory.set(powerupId, newCount);
                
                await firebase.database().ref(`players/${userKey}/inventory/${powerupId}`).set(newCount);

                // Play purchase sound
                const purchaseSound = document.getElementById('purchaseSound');
                if (purchaseSound) {
                    purchaseSound.play().catch(e => console.log('Sound play failed:', e));
                }

                this.updateInventoryDisplay();
                showNotification(`Purchased ${powerupId.replace(/_/g, ' ')}!`, 'success');
            } else {
                showNotification('Not enough hearts!', 'error');
            }
        } catch (error) {
            console.error('Error buying powerup:', error);
            showNotification('Error purchasing powerup', 'error');
        }
    }

    initializePowerups() {
        const buyButtons = document.querySelectorAll('.buy-button');
        buyButtons.forEach(button => {
            const powerupItem = button.closest('.powerup-item');
            if (!powerupItem) {
                console.error('Buy button not inside powerup-item');
                return;
            }

            const powerupId = powerupItem.dataset.powerup;
            if (!powerupId) {
                console.error('Missing powerup ID for item:', powerupItem);
                return;
            }
            
            button.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await this.buyPowerup(powerupId);
            };
        });
    }

    updatePowerupStatus(powerupId, active) {
        const powerup = this.POWERUPS[powerupId];
        if (!powerup) return;

        powerup.active = active;
        this.updateInventoryDisplay();

        if (active && powerup.duration > 0) {
            setTimeout(() => {
                this.deactivatePowerup(powerupId);
            }, powerup.duration);
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 2500);
    }

    addInstantHearts(amount) {
        firebase.database().ref(`players/${userKey}/hearts`).once('value')
            .then(snapshot => {
                const currentHearts = snapshot.val() || 0;
                const newHearts = currentHearts + amount;
                return firebase.database().ref(`players/${userKey}/hearts`).set(newHearts);
            })
            .then(() => {
                // Update displays after Firebase update
                const scoreElements = document.querySelectorAll('#score, .score-value, .heart-count');
                scoreElements.forEach(element => {
                    if (element) element.textContent = newHearts;
                });
            })
            .catch(error => console.error('Error adding hearts:', error));
    }

    updateClickHandler() {
        // Get the heart element
        const heartButton = document.querySelector('.heart-button');
        if (!heartButton) return;

        // Update the click handler
        heartButton.onclick = async (e) => {
            e.preventDefault();
            const amount = this.handleHeartClick(1); // Base amount is 1
            
            try {
                const snapshot = await firebase.database().ref(`players/${userKey}/hearts`).once('value');
                const currentHearts = snapshot.val() || 0;
                await firebase.database().ref(`players/${userKey}/hearts`).set(currentHearts + amount);
                
                // Update the display
                const scoreElement = document.getElementById('score');
                if (scoreElement) {
                    scoreElement.textContent = currentHearts + amount;
                }

                if (amount > 1) {
                    this.showNotification(`+${amount} hearts!`, 'success');
                }
            } catch (error) {
                console.error('Error updating hearts:', error);
            }
        };
    }

    async usePowerup(powerupId) {
        const count = this.inventory.get(powerupId) || 0;
        
        if (count <= 0) {
            this.showNotification('You don\'t have any of this powerup!', 'error');
            return;
        }

        const powerup = this.POWERUPS[powerupId];
        if (!powerup) {
            console.error('Invalid powerup:', powerupId);
            return;
        }

        if (powerup.active) {
            this.showNotification('This powerup is already active!', 'warning');
            return;
        }

        try {
            // Decrease inventory count
            this.inventory.set(powerupId, count - 1);
            await firebase.database().ref(`players/${userKey}/inventory/${powerupId}`).set(count - 1);

            // Activate powerup
            powerup.active = true;
            powerup.effect();

            // Set timer for duration-based powerups
            if (powerup.duration > 0) {
                setTimeout(() => {
                    this.deactivatePowerup(powerupId);
                }, powerup.duration);
            }

            this.updateInventoryDisplay();
            this.showNotification(`Activated ${powerupId.replace(/_/g, ' ')}!`, 'success');

        } catch (error) {
            console.error('Error using powerup:', error);
            this.showNotification('Error activating powerup', 'error');
        }
    }

    updateInventoryDisplay() {
        const inventoryGrid = document.querySelector('.inventory-grid');
        if (!inventoryGrid) return;

        // Clear existing inventory
        inventoryGrid.innerHTML = '';

        // Add items from inventory
        for (const [powerupId, count] of this.inventory) {
            if (count > 0) {
                const powerupElement = document.createElement('div');
                powerupElement.className = 'inventory-item';
                powerupElement.innerHTML = `
                    <div class="powerup-icon">${this.getPowerupIcon(powerupId)}</div>
                    <div class="powerup-name">${powerupId.replace(/_/g, ' ')}</div>
                    <div class="powerup-description">${this.getPowerupDescription(powerupId)}</div>
                    <div class="powerup-count">x${count}</div>
                    <button class="use-button">Use</button>
                `;

                const useButton = powerupElement.querySelector('.use-button');
                useButton.onclick = () => this.usePowerup(powerupId);

                inventoryGrid.appendChild(powerupElement);
            }
        }
    }

    updateAllHeartDisplays(hearts) {
        // Try to update all possible heart display elements
        const displays = [
            document.getElementById('score'),
            document.getElementById('heartCount'),
            document.querySelector('.score-display'),
            document.querySelector('.heart-count')
        ];

        displays.forEach(display => {
            if (display) {
                display.textContent = hearts;
            }
        });
    }

    showFloatingText(text) {
        // Create floating text element
        const floatingText = document.createElement('div');
        floatingText.className = 'floating-text';
        floatingText.textContent = text;
        
        // Position it near the heart button if it exists, or center of screen
        const heartButton = document.querySelector('.heart-button');
        if (heartButton) {
            const rect = heartButton.getBoundingClientRect();
            floatingText.style.left = `${rect.left + rect.width/2}px`;
            floatingText.style.top = `${rect.top}px`;
        } else {
            floatingText.style.left = '50%';
            floatingText.style.top = '50%';
            floatingText.style.transform = 'translate(-50%, -50%)';
        }

        document.body.appendChild(floatingText);

        // Remove after animation
        setTimeout(() => {
            floatingText.remove();
        }, 1000);
    }

    // Add method to check if elements exist
    checkElements() {
        const heartButton = document.querySelector('.heart-button');
        const scoreElement = document.getElementById('score');
        
        if (!heartButton) console.error('Heart button not found');
        if (!scoreElement) console.error('Score element not found');
        
        return heartButton && scoreElement;
    }
}

// Define image paths
const CLOSED_IMAGE = './close.png';
const OPEN_IMAGE = './open.jpg';

// Get the popcat element
const popcat = document.getElementById('popcat');
const audio = new Audio('https://logm1lo.github.io/pop.mp3');

// Add styling to make the image 5x bigger and center it
popcat.style.width = '1000px';
popcat.style.height = '1000px';
popcat.style.objectFit = 'contain';

// Center the image
popcat.style.position = 'fixed';  // or 'absolute' if you prefer
popcat.style.top = '50%';
popcat.style.left = '50%';
popcat.style.transform = 'translate(-50%, -50%)';
popcat.style.margin = '0';
popcat.style.padding = '0';

// Set initial image
popcat.src = CLOSED_IMAGE;

// Function to change image
function changeImage(isOpen) {
    popcat.src = isOpen ? OPEN_IMAGE : CLOSED_IMAGE;
    console.log('Image changed to:', popcat.src); // Debug log
}

// Mouse events with both capture and bubble phase
document.addEventListener('mousedown', function(e) {
    changeImage(true);
    audio.currentTime = 0;
    audio.play().catch(err => console.log('Sound play error:', err));
    
    if (window.handleClick) {
        window.handleClick(e);
    }
    displayHeart(e);
}, true); // Use capture phase

document.addEventListener('mouseup', function() {
    changeImage(false);
}, true); // Use capture phase

// Touch events
document.addEventListener('touchstart', function(e) {
    e.preventDefault();
    changeImage(true);
    audio.currentTime = 0;
    audio.play().catch(err => console.log('Sound play error:', err));
    
    if (window.handleClick) {
        // Create a synthetic event with the touch coordinates
        const touch = e.touches[0];
        const clickEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY
        };
        window.handleClick(clickEvent);
        displayHeart(clickEvent);
    }
}, { passive: false });

document.addEventListener('touchend', function(e) {
    e.preventDefault();
    changeImage(false);
}, { passive: false });

// Prevent image dragging
popcat.addEventListener('dragstart', function(e) {
    e.preventDefault();
});

// Preload images
const preloadImages = () => {
    const openImg = new Image();
    const closedImg = new Image();
    
    openImg.onload = () => console.log('Open image preloaded successfully');
    openImg.onerror = () => console.error('Failed to load open image:', OPEN_IMAGE);
    
    closedImg.onload = () => console.log('Closed image preloaded successfully');
    closedImg.onerror = () => console.error('Failed to load closed image:', CLOSED_IMAGE);
    
    openImg.src = OPEN_IMAGE;
    closedImg.src = CLOSED_IMAGE;
};

// Initialize when the page loads
window.addEventListener('load', preloadImages);

// Add additional click handler to body
document.body.addEventListener('click', function(e) {
    changeImage(true);
    setTimeout(() => changeImage(false), 100); // Change back after 100ms
});

// Initialize PowerupSystem when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.powerupSystem = new PowerupSystem();
}); 

// Update the displayHeart function with more precise positioning
function displayHeart(event) {
    // Get the exact click coordinates
    const x = event.clientX || event.touches?.[0]?.clientX;
    const y = event.clientY || event.touches?.[0]?.clientY;
    
    console.log('Click position:', { x, y }); // Debug log
    
    // Create heart element
    const heart = document.createElement('div');
    heart.innerHTML = '❤️';
    heart.className = 'floating-heart';
    
    // Style the heart for precise positioning
    Object.assign(heart.style, {
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: '9999',
        fontSize: '24px', // Make heart size consistent
        userSelect: 'none',
        transition: 'all 0.5s ease-out'
    });
    
    document.body.appendChild(heart);
    
    // Add floating animation
    requestAnimationFrame(() => {
        heart.style.opacity = '0';
        heart.style.transform = `translate(-50%, ${y - 50}px)`;
    });
    
    // Remove after animation
    setTimeout(() => heart.remove(), 1000);
}

// Update click handler to ensure event propagation
document.addEventListener('click', function(e) {
    displayHeart(e);
}, { capture: true }); // Use capture to ensure we get the event first

// Update mousedown handler
document.addEventListener('mousedown', function(e) {
    changeImage(true);
    audio.currentTime = 0;
    audio.play().catch(err => console.log('Sound play error:', err));
    
    if (window.handleClick) {
        window.handleClick(e);
    }
}, true);

// Update touch handler
document.addEventListener('touchstart', function(e) {
    e.preventDefault();
    changeImage(true);
    audio.currentTime = 0;
    audio.play().catch(err => console.log('Sound play error:', err));
    
    const touch = e.touches[0];
    const clickEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        preventDefault: () => {}
    };
    
    displayHeart(clickEvent);
    
    if (window.handleClick) {
        window.handleClick(clickEvent);
    }
}, { passive: false }); 