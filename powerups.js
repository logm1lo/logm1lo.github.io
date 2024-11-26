// PowerupSystem class definition
class PowerupSystem {
    constructor() {
        this.POWERUPS = {
            MULTIPLIER: {
                cost: 1000,
                duration: 30000, // 30 seconds
                active: false,
                effect: (player) => {
                    player.clickMultiplier *= 2;
                    setTimeout(() => {
                        player.clickMultiplier /= 2;
                        this.updatePowerupStatus('MULTIPLIER', false);
                    }, 30000);
                }
            },
            AUTO_CLICKER: {
                cost: 2000,
                duration: 30000,
                active: false,
                interval: null,
                effect: (player) => {
                    const interval = setInterval(() => {
                        incrementHearts(5); // 5 clicks per second
                    }, 200);
                    this.POWERUPS.AUTO_CLICKER.interval = interval;
                    setTimeout(() => {
                        clearInterval(interval);
                        this.updatePowerupStatus('AUTO_CLICKER', false);
                    }, 30000);
                }
            },
            HEART_BURST: {
                cost: 500,
                duration: 0,
                active: false,
                effect: (player) => {
                    incrementHearts(10);
                }
            },
            SCORE_SHIELD: {
                cost: 3000,
                duration: 0,
                active: false,
                effect: (player) => {
                    player.scoreShield = true;
                }
            },
            RAPID_FIRE: {
                cost: 4000,
                duration: 20000,
                active: false,
                effect: (player) => {
                    player.clickMultiplier *= 3;
                    setTimeout(() => {
                        player.clickMultiplier /= 3;
                        this.updatePowerupStatus('RAPID_FIRE', false);
                    }, 20000);
                }
            },
            LUCKY_CHARM: {
                cost: 5000,
                duration: 30000,
                active: false,
                effect: (player) => {
                    player.luckyCharm = true;
                    setTimeout(() => {
                        player.luckyCharm = false;
                        this.updatePowerupStatus('LUCKY_CHARM', false);
                    }, 30000);
                }
            },
            GOLDEN_HEART: {
                cost: 7500,
                duration: 25000,
                active: false,
                effect: (player) => {
                    player.heartMultiplier *= 10;
                    setTimeout(() => {
                        player.heartMultiplier /= 10;
                        this.updatePowerupStatus('GOLDEN_HEART', false);
                    }, 25000);
                }
            },
            TIME_WARP: {
                cost: 10000,
                duration: 15000,
                active: false,
                effect: (player) => {
                    player.gameSpeed *= 2;
                    setTimeout(() => {
                        player.gameSpeed /= 2;
                        this.updatePowerupStatus('TIME_WARP', false);
                    }, 15000);
                }
            }
        };

        this.initializePowerups();
    }

    initializePowerups() {
        document.querySelectorAll('.buy-button').forEach(button => {
            const powerupItem = button.closest('.powerup-item');
            const powerupId = powerupItem.dataset.powerup;
            button.onclick = () => this.buyPowerup(powerupId);
        });
    }

    async buyPowerup(powerupId) {
        const powerup = this.POWERUPS[powerupId];
        if (!powerup) return;

        try {
            const playerSnapshot = await playersRef.child(userKey).once('value');
            const playerData = playerSnapshot.val();
            const currentHearts = playerData?.hearts || 0;

            if (currentHearts >= powerup.cost && !powerup.active) {
                // Deduct hearts
                await playersRef.child(userKey).update({
                    hearts: currentHearts - powerup.cost
                });

                // Activate powerup
                powerup.active = true;
                this.updatePowerupStatus(powerupId, true);
                
                // Apply powerup effect
                powerup.effect(playerData);
                
                // Play sound effect
                playSound('powerupActivate');
                
                showNotification(`Activated ${powerupId.replace(/_/g, ' ')}!`, 'success');
            } else if (powerup.active) {
                showNotification('This powerup is already active!', 'warning');
            } else {
                showNotification('Not enough hearts!', 'error');
            }
        } catch (error) {
            console.error('Error buying powerup:', error);
            showNotification('Error activating powerup', 'error');
        }
    }

    updatePowerupStatus(powerupId, active) {
        const powerupElement = document.querySelector(`[data-powerup="${powerupId}"]`);
        if (powerupElement) {
            powerupElement.classList.toggle('active', active);
            
            const timer = powerupElement.querySelector('.powerup-timer');
            if (timer && this.POWERUPS[powerupId].duration > 0) {
                if (active) {
                    const duration = this.POWERUPS[powerupId].duration / 1000;
                    timer.textContent = `${duration}s`;
                    this.startPowerupTimer(powerupId, duration);
                } else {
                    timer.textContent = '';
                }
            }
        }
    }

    startPowerupTimer(powerupId, duration) {
        const powerupElement = document.querySelector(`[data-powerup="${powerupId}"]`);
        const timer = powerupElement.querySelector('.powerup-timer');
        let timeLeft = duration;
        
        const interval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                clearInterval(interval);
                timer.textContent = '';
                this.POWERUPS[powerupId].active = false;
            } else {
                timer.textContent = `${timeLeft}s`;
            }
        }, 1000);
    }

    isPowerupActive(powerupId) {
        return this.POWERUPS[powerupId]?.active || false;
    }

    getActivePowerups() {
        return Object.entries(this.POWERUPS)
            .filter(([_, powerup]) => powerup.active)
            .map(([id, _]) => id);
    }

    // Helper method for visual effects
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
                will-change: transform, opacity;
            `;
            
            container.appendChild(heart);
            
            setTimeout(() => {
                container.removeChild(heart);
            }, 1500);
        }
    }
}

// Initialize the PowerupSystem
const powerupSystem = new PowerupSystem();

// Add this to your existing handleClick function
function handleClick(event) {
    if (!playerName) return;
    
    const now = performance.now();
    if (now - lastProcessedClick < MIN_CLICK_INTERVAL) return;
    lastProcessedClick = now;
    
    let heartsToAdd = 1;
    
    // Apply powerup effects
    if (powerupSystem.isPowerupActive('MULTIPLIER')) heartsToAdd *= 2;
    if (powerupSystem.isPowerupActive('RAPID_FIRE')) heartsToAdd *= 3;
    if (powerupSystem.isPowerupActive('LUCKY_CHARM') && Math.random() < 0.3) heartsToAdd *= 5;
    if (powerupSystem.isPowerupActive('GOLDEN_HEART')) heartsToAdd *= 10;
    
    incrementHearts(heartsToAdd);
    displayHeart(event);
} 