/**
 * Enhanced JavaScript for CuteCrush Website
 * Adds music control, enhanced animations, and improved UX
 */

$(document).ready(function() {
    // Music control functionality
    const audio = document.getElementById('audio');
    const musicToggle = document.getElementById('musicToggle');
    let isMusicPlaying = false;
    
    // Initialize music control
    function initMusicControl() {
        musicToggle.addEventListener('click', function() {
            if (isMusicPlaying) {
                audio.pause();
                musicToggle.classList.add('muted');
                musicToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
            } else {
                audio.play().catch(function(error) {
                    console.log('Audio play failed:', error);
                });
                musicToggle.classList.remove('muted');
                musicToggle.innerHTML = '<i class="fas fa-music"></i>';
            }
            isMusicPlaying = !isMusicPlaying;
        });
        
        // Auto-play music when user interacts (to comply with browser policies)
        document.addEventListener('click', function() {
            if (!isMusicPlaying && audio.paused) {
                audio.play().then(function() {
                    isMusicPlaying = true;
                    musicToggle.classList.remove('muted');
                    musicToggle.innerHTML = '<i class="fas fa-music"></i>';
                }).catch(function(error) {
                    console.log('Auto-play failed:', error);
                });
            }
        }, { once: true });
    }
    
    // Enhanced button hover effects
    function initButtonEffects() {
        $('.love-btn').hover(
            function() {
                $(this).addClass('btn-hover');
                createRippleEffect($(this));
            },
            function() {
                $(this).removeClass('btn-hover');
            }
        );
    }
    
    // Create ripple effect on button click
    function createRippleEffect(button) {
        const ripple = $('<span class="ripple"></span>');
        button.append(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    // Enhanced sparkle effects
    function initSparkleEffects() {
        setInterval(() => {
            createRandomSparkle();
        }, 3000);
    }
    
    function createRandomSparkle() {
        const sparkle = $('<div class="random-sparkle">✨</div>');
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        
        sparkle.css({
            position: 'fixed',
            left: x + 'px',
            top: y + 'px',
            fontSize: '20px',
            pointerEvents: 'none',
            zIndex: 1000,
            animation: 'sparkle 2s ease-in-out'
        });
        
        $('body').append(sparkle);
        
        setTimeout(() => {
            sparkle.remove();
        }, 2000);
    }
    
    // Enhanced typing effect for text generation
    function enhancedTextGenerate() {
        const text = "Vì Sang đẹp try vlllll";
        const input = $("#txtReason");
        let index = 0;
        
        function typeNextChar() {
            if (index < text.length) {
                input.val(input.val() + text.charAt(index));
                index++;
                setTimeout(typeNextChar, 100);
            }
        }
        
        typeNextChar();
    }
    
    // Enhanced SweetAlert configurations
    function enhancedSweetAlert() {
        // Override the original text generation
        const originalTextGenerate = window.textGenerate;
        window.textGenerate = enhancedTextGenerate;
        
        // Enhanced SweetAlert styling
        Swal.getContainer = function() {
            return $('.swal2-container');
        };
        
        // Add custom CSS for better SweetAlert appearance
        $('<style>')
            .prop('type', 'text/css')
            .html(`
                .swal2-popup {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                    color: white !important;
                }
                .swal2-title {
                    color: white !important;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.3) !important;
                }
                .swal2-content {
                    color: rgba(255,255,255,0.9) !important;
                }
                .swal2-confirm {
                    background: linear-gradient(45deg, #ff6b6b, #ff8e8e) !important;
                    border: none !important;
                    border-radius: 25px !important;
                    padding: 12px 30px !important;
                    font-weight: 600 !important;
                }
                .swal2-confirm:hover {
                    background: linear-gradient(45deg, #ff5252, #ff7676) !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 5px 15px rgba(255,107,107,0.4) !important;
                }
            `)
            .appendTo('head');
    }
    
    // Enhanced mobile experience
    function enhanceMobileExperience() {
        if (window.innerWidth <= 768) {
            // Add touch feedback
            $('.love-btn').on('touchstart', function() {
                $(this).addClass('touch-active');
            }).on('touchend', function() {
                $(this).removeClass('touch-active');
            });
            
            // Optimize for mobile performance
            $('.floating-hearts .heart').css('animation-duration', '8s');
        }
    }
    
    // Enhanced accessibility
    function enhanceAccessibility() {
        // Add keyboard navigation
        $(document).keydown(function(e) {
            switch(e.keyCode) {
                case 37: // Left arrow
                    $('#no').focus();
                    break;
                case 39: // Right arrow
                    $('#yes').focus();
                    break;
                case 13: // Enter
                    if ($('#yes').is(':focus')) {
                        $('#yes').click();
                    } else if ($('#no').is(':focus')) {
                        $('#no').click();
                    }
                    break;
                case 77: // M key for music toggle
                    $('#musicToggle').click();
                    break;
            }
        });
        
        // Add ARIA labels
        $('#yes').attr('aria-label', 'Nút đồng ý yêu');
        $('#no').attr('aria-label', 'Nút từ chối');
        $('#musicToggle').attr('aria-label', 'Bật/tắt nhạc');
    }
    
    // Performance optimizations
    function optimizePerformance() {
        // Debounce scroll events
        let scrollTimeout;
        $(window).scroll(function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
                // Handle scroll events
            }, 100);
        });
        
        // Optimize animations for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            $('*').css('animation-duration', '0.01ms');
            $('*').css('animation-iteration-count', '1');
        }
    }
    
    // Enhanced error handling
    function enhanceErrorHandling() {
        // Handle audio loading errors
        audio.addEventListener('error', function() {
            console.log('Audio failed to load');
            musicToggle.style.display = 'none';
        });
        
        // Handle image loading errors
        $('img').on('error', function() {
            $(this).hide();
        });
    }
    
    // Initialize all enhancements
    function initEnhancements() {
        initMusicControl();
        initButtonEffects();
        initSparkleEffects();
        enhancedSweetAlert();
        enhanceMobileExperience();
        enhanceAccessibility();
        optimizePerformance();
        enhanceErrorHandling();
        
        // Add loading completion animation
        setTimeout(() => {
            $('.content').addClass('loaded');
        }, 1000);
    }
    
    // Start enhancements after a short delay
    setTimeout(initEnhancements, 500);
});

// Add CSS for new effects
$('<style>')
    .prop('type', 'text/css')
    .html(`
        .btn-hover {
            transform: translateY(-2px) !important;
        }
        
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255,255,255,0.3);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .touch-active {
            transform: scale(0.95) !important;
        }
        
        .content.loaded {
            animation: contentLoaded 0.8s ease-out;
        }
        
        @keyframes contentLoaded {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .random-sparkle {
            position: fixed;
            pointer-events: none;
            z-index: 1000;
        }
        
        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }
    `)
    .appendTo('head');