/**
 * Mustang Shelby GT350 - Interactive Scroll Animation Engine
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration Constants ---
    const HERO_FRAMES_COUNT = 228;
    const DOWN_FRAMES_COUNT = 299;
    const TRACK_FRAMES_COUNT = 290;

    const DOWN_COMPONENTS = [
        {
            name: 'OVERVIEW',
            label: 'OVERVIEW',
            start: 0,
            end: 45,
            focus: 0,
            category: 'SHELBY GT350',
            title: 'FASTBACK SHAPE',
            description: 'Classic muscle silhouette optimized for high-speed aerodynamics and intense visual stance.',
            specs: [
                { name: 'Drag Coefficient', value: '0.38 Cd' },
                { name: 'Curb Weight', value: '3,760 lbs' },
                { name: 'Weight Dist.', value: '53/47% F/R' }
            ]
        },
        {
            name: 'COMPONENT SCHEMATIC',
            label: 'COMPONENT SCHEMATIC',
            start: 46,
            end: 110,
            focus: 70,
            category: 'DIGITAL INTELLIGENCE',
            title: 'COMPONENT SCHEMATIC',
            description: 'Digital scan overlays highlight vehicle components, checking parameters and frame integrity in real-time.',
            specs: [
                { name: 'Scan Nodes', value: '45 Active' },
                { name: 'Scan Frequency', value: '120Hz' },
                { name: 'Calibration', value: 'Auto-Track' }
            ]
        },
        {
            name: 'EXPLODED PANEL VIEW',
            label: 'EXPLODED PANEL VIEW',
            start: 111,
            end: 175,
            focus: 150,
            category: 'MODULAR ENGINEERING',
            title: 'EXPLODED PANEL VIEWS',
            description: 'Visualizing the outer skin panels, doors, hood, and trunk lid separating from the inner structural cage.',
            specs: [
                { name: 'Exploded Parts', value: '12 Panels' },
                { name: 'Separation Gap', value: 'Up to 1.5m' },
                { name: 'Panel Material', value: 'Carbon / Aluminum' }
            ]
        },
        {
            name: 'BODY REASSEMBLY',
            label: 'BODY REASSEMBLY',
            start: 176,
            end: 225,
            focus: 200,
            category: 'CAD DESIGN',
            title: 'PANEL REASSEMBLY',
            description: 'The structural body panels smoothly lock back onto the main chassis rails, forming the high-rigidity outer envelope.',
            specs: [
                { name: 'Alignment Spec', value: '< 1.0mm Tolerance' },
                { name: 'Safety Rating', value: '5-Star Impact' },
                { name: 'Rigidity Coefficient', value: '+25% Torsional' }
            ]
        },
        {
            name: 'SKELETON CHASSIS',
            label: 'SKELETON CHASSIS',
            start: 226,
            end: 275,
            focus: 250,
            category: 'ARCHITECTURE',
            title: 'SKELETON ENGINE CAGE',
            description: 'Visualizing the inner skeleton structural core, roll cage, suspension mounts, and wheels with panels removed.',
            specs: [
                { name: 'Frame Material', value: 'High-Strength Steel' },
                { name: 'Safety Cage', value: 'Integrated Safety' },
                { name: 'Wheel Base', value: '107.1 inches' }
            ]
        },
        {
            name: 'ENGINE & SUSPENSION',
            label: 'ENGINE & SUSPENSION',
            start: 276,
            end: 299,
            focus: 299,
            category: 'DRIVETRAIN CORE',
            title: 'VOODOO V8 & SUSPENSION',
            description: 'Complete teardown exposing the 5.2L flat-plane crank V8 engine block, front dual-axis suspension and steering rack.',
            specs: [
                { name: 'Engine Block', value: '5.2L Voodoo V8' },
                { name: 'Redline Limit', value: '8,250 RPM' },
                { name: 'Horsepower Output', value: '526 hp @ 7,500' }
            ]
        }
    ];
    
    const heroImageCache = [];
    const downImageCache = [];
    const trackImageCache = [];
    
    let totalLoaded = 0;
    const totalImages = HERO_FRAMES_COUNT + DOWN_FRAMES_COUNT + TRACK_FRAMES_COUNT;
    
    // --- Canvas Elements & Contexts ---
    const heroCanvas = document.getElementById('hero-canvas');
    const heroCtx = heroCanvas.getContext('2d');
    
    const downCanvas = document.getElementById('down-canvas');
    const downCtx = downCanvas.getContext('2d');

    const trackCanvas = document.getElementById('track-canvas');
    const trackCtx = trackCanvas.getContext('2d');
    
    // --- Scroll & Animation State ---
    const animationState = {
        hero: {
            currentFrame: 0,
            targetFrame: 0,
            lastDrawnFrame: -1
        },
        down: {
            currentFrame: 0,
            targetFrame: 0,
            lastDrawnFrame: -1
        },
        track: {
            currentFrame: 0,
            targetFrame: 0,
            lastDrawnFrame: -1
        }
    };
    
    // Linear Interpolation (lerp) speed - lower values mean smoother, slower lag-follow
    const LERP_FACTOR = 0.08;

    // --- DOM Elements ---
    const preloader = document.getElementById('preloader');
    const loadingPercentageText = document.getElementById('loading-percentage');
    const loadingBar = document.getElementById('loading-bar');
    const scrollIndicator = document.getElementById('scroll-indicator');
    const mainHeader = document.querySelector('.main-header');

    // --- HELPER: Pad frame indices to 3 characters (e.g. 001, 045) ---
    function padIndex(index) {
        return String(index).padStart(3, '0');
    }

    // --- HELPER: Render image to Canvas with "background-size: cover" behavior ---
    function drawImageCover(ctx, img, canvas) {
        if (!img || !img.complete) return;
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        
        const imgRatio = imgWidth / imgHeight;
        const canvasRatio = canvasWidth / canvasHeight;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (canvasRatio > imgRatio) {
            // Canvas is wider than image aspect ratio (crop top/bottom)
            drawWidth = canvasWidth;
            drawHeight = canvasWidth / imgRatio;
            drawX = 0;
            drawY = (canvasHeight - drawHeight) / 2;
        } else {
            // Canvas is taller than image aspect ratio (crop left/right)
            drawWidth = canvasHeight * imgRatio;
            drawHeight = canvasHeight;
            drawX = (canvasWidth - drawWidth) / 2;
            drawY = 0;
        }
        
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    }

    // --- HELPER: Render image to Canvas with "background-size: contain" behavior ---
    function drawImageContain(ctx, img, canvas) {
        if (!img || !img.complete) return;
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        
        const imgRatio = imgWidth / imgHeight;
        const canvasRatio = canvasWidth / canvasHeight;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (canvasRatio > imgRatio) {
            // Canvas is wider than image aspect ratio (letterbox on sides)
            drawWidth = canvasHeight * imgRatio;
            drawHeight = canvasHeight;
            drawX = (canvasWidth - drawWidth) / 2;
            drawY = 0;
        } else {
            // Canvas is taller than image aspect ratio (letterbox on top/bottom)
            drawWidth = canvasWidth;
            drawHeight = canvasWidth / imgRatio;
            drawX = 0;
            drawY = (canvasHeight - drawHeight) / 2;
        }
        
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    }

    // --- Canvas Resize Handler ---
    function resizeCanvases() {
        // Set canvas buffer sizes to match their client display size
        const dpr = window.devicePixelRatio || 1;
        
        [
            { canvas: heroCanvas, ctx: heroCtx, cache: heroImageCache, stateKey: 'hero' },
            { canvas: downCanvas, ctx: downCtx, cache: downImageCache, stateKey: 'down' },
            { canvas: trackCanvas, ctx: trackCtx, cache: trackImageCache, stateKey: 'track' }
        ].forEach(({ canvas, ctx, cache, stateKey }) => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            
            // Enable high-quality image smoothing for pixel-perfect crispness
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Re-draw current active frame to avoid flash on resize
            const activeFrameIndex = Math.round(animationState[stateKey].currentFrame);
            const activeImg = cache[activeFrameIndex];
            if (activeImg) {
                if (stateKey === 'down') {
                    drawImageContain(ctx, activeImg, canvas);
                } else {
                    drawImageCover(ctx, activeImg, canvas);
                }
            }
        });
    }

    // --- Asset Preloader ---
    function preloadAssets(callback) {
        let hasCalledCallback = false;

        function checkProgress() {
            totalLoaded++;
            
            // Calculate progress percentage
            const progress = Math.min(Math.round((totalLoaded / totalImages) * 100), 100);
            loadingBar.style.width = `${progress}%`;
            loadingPercentageText.innerText = `${progress}%`;
            
            if (totalLoaded >= totalImages && !hasCalledCallback) {
                hasCalledCallback = true;
                callback();
            }
        }

        // Helper to load individual images and cache them
        function loadFrame(src, cacheArray, index) {
            const img = new Image();
            img.onload = checkProgress;
            img.onerror = () => {
                console.warn(`Failed to load frame: ${src}`);
                checkProgress(); // Still advance progress so loading overlay doesn't hang
            };
            img.src = src;
            cacheArray[index] = img;
        }

        // Load Hero Frames
        for (let i = 1; i <= HERO_FRAMES_COUNT; i++) {
            const frameSrc = `frames/hero/ezgif-frame-${padIndex(i)}.jpg`;
            loadFrame(frameSrc, heroImageCache, i - 1);
        }

        // Load Down Frames
        for (let i = 1; i <= DOWN_FRAMES_COUNT; i++) {
            const frameSrc = `frames/down/ezgif-frame-${padIndex(i)}.jpg`;
            loadFrame(frameSrc, downImageCache, i - 1);
        }

        // Load Track Frames
        for (let i = 1; i <= TRACK_FRAMES_COUNT; i++) {
            const frameSrc = `third_animation_frames/ezgif-frame-${padIndex(i)}.jpg`;
            loadFrame(frameSrc, trackImageCache, i - 1);
        }
    }

    // --- Text Overlay Activation Logic ---
    function updateTextOverlays(frameIndex, type) {
        if (type === 'down') {
            const activeComponentIndex = DOWN_COMPONENTS.findIndex(c => frameIndex >= c.start && frameIndex <= c.end);
            if (activeComponentIndex !== -1) {
                const activeComp = DOWN_COMPONENTS[activeComponentIndex];
                
                // 1. Highlight active menu item
                const menuItems = document.querySelectorAll('.component-showcase-menu .menu-item');
                menuItems.forEach((item, idx) => {
                    if (idx === activeComponentIndex) {
                        item.classList.add('active');
                        // Auto-scroll menu horizontally on mobile if active item changes
                        if (window.innerWidth <= 768) {
                            item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                        }
                    } else {
                        item.classList.remove('active');
                    }
                });
                
                // 2. Update Spec Card
                const card = document.getElementById('spec-card');
                const categoryEl = document.getElementById('spec-category');
                const titleEl = document.getElementById('spec-title');
                const descEl = document.getElementById('spec-description');
                const listEl = document.getElementById('spec-list');
                
                if (categoryEl && categoryEl.textContent !== activeComp.category) {
                    // Trigger a smooth fade/scale transition in CSS
                    card.classList.add('transitioning');
                    setTimeout(() => {
                        categoryEl.textContent = activeComp.category;
                        titleEl.textContent = activeComp.title;
                        descEl.textContent = activeComp.description;
                        
                        // Rebuild specifications list
                        listEl.innerHTML = activeComp.specs.map(spec => `
                            <li>
                                <span class="spec-label">${spec.name}:</span>
                                <span class="spec-value">${spec.value}</span>
                            </li>
                        `).join('');
                        
                        card.classList.remove('transitioning');
                    }, 250);
                }
            }
            return;
        }

        // Define active ranges for each text card
        const textConfigs = {
            hero: [
                { id: 'hero-text-1', start: 5, end: 65 },
                { id: 'hero-text-2', start: 80, end: 140 },
                { id: 'hero-text-3', start: 155, end: 215 }
            ],
            track: [
                { id: 'track-text-1', start: 10, end: 85 },
                { id: 'track-text-2', start: 105, end: 185 },
                { id: 'track-text-3', start: 205, end: 280 }
            ]
        };

        const configs = textConfigs[type];
        configs.forEach(config => {
            const el = document.getElementById(config.id);
            if (!el) return;
            
            if (frameIndex >= config.start && frameIndex <= config.end) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }

    // --- Audio System ---
    const engineAudio = new Audio('engine_sound.ogg');
    engineAudio.loop = true;
    engineAudio.volume = 0;
    let audioFadeInterval = null;
    let audioActivityTimeout = null;

    // Browser User Activation / Audio Unlocker
    const unlockAudio = () => {
        engineAudio.play().then(() => {
            engineAudio.pause();
            engineAudio.volume = 0;
        }).catch((err) => console.log('Engine audio unlock deferred:', err.message));

        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    function playEngineAudio() {
        if (audioFadeInterval) clearInterval(audioFadeInterval);
        
        engineAudio.play().catch(() => {});
        
        // Fade in to base volume (increased to 0.5)
        audioFadeInterval = setInterval(() => {
            if (engineAudio.volume < 0.5) {
                engineAudio.volume = Math.min(0.5, engineAudio.volume + 0.05);
            } else {
                clearInterval(audioFadeInterval);
            }
        }, 30);
    }

    function stopEngineAudio() {
        if (audioFadeInterval) clearInterval(audioFadeInterval);
        
        audioFadeInterval = setInterval(() => {
            if (engineAudio.volume > 0.05) {
                engineAudio.volume = Math.max(0, engineAudio.volume - 0.05);
            } else {
                engineAudio.volume = 0;
                engineAudio.pause();
                clearInterval(audioFadeInterval);
            }
        }, 30);
    }

    function triggerEngineRev(intensity) {
        if (engineAudio.paused) {
            playEngineAudio();
        }
        
        // Boost playback rate and volume based on scroll speed (increased bounds)
        const targetRate = Math.min(2.0, 1.0 + intensity / 150);
        const targetVol = Math.min(1.0, 0.5 + intensity / 300);
        
        engineAudio.playbackRate = targetRate;
        engineAudio.volume = targetVol;
        
        // Clear existing reset timeout
        if (audioActivityTimeout) clearTimeout(audioActivityTimeout);
        
        // Smoothly decay back to idle after scrolling stops
        audioActivityTimeout = setTimeout(() => {
            // Lerp back to idle
            let decayInterval = setInterval(() => {
                let active = false;
                if (engineAudio.playbackRate > 1.0) {
                    engineAudio.playbackRate = Math.max(1.0, engineAudio.playbackRate - 0.05);
                    active = true;
                }
                if (engineAudio.volume > 0.5) {
                    engineAudio.volume = Math.max(0.5, engineAudio.volume - 0.05);
                    active = true;
                }
                if (!active) {
                    clearInterval(decayInterval);
                }
            }, 30);
        }, 150);
    }

    // --- Section Elements ---
    const sections = {
        hero: document.getElementById('hero-section'),
        heritage: document.getElementById('heritage-section'),
        down: document.getElementById('down-section'),
        precision: document.getElementById('precision-section'),
        track: document.getElementById('track-section'),
        cockpit: document.getElementById('cockpit-section')
    };

    let currentSection = 'hero'; // 'hero', 'heritage', 'down', 'precision', 'track', 'cockpit'
    let heroFrame = 0;
    let downFrame = 0;
    let trackFrame = 1;
    let isTransitioning = false;

    // Highlight active link based on current section state
    function updateActiveNavLink() {
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (href === '#hero-section' && currentSection === 'hero') {
                link.classList.add('active');
            } else if (href === '#heritage-section' && currentSection === 'heritage') {
                link.classList.add('active');
            } else if (href === '#down-section' && (currentSection === 'down' || currentSection === 'precision')) {
                link.classList.add('active');
            } else if (href === '#track-section' && (currentSection === 'track' || currentSection === 'cockpit')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Determine starting section based on scroll position on load
    function initSectionState() {
        const scrollY = window.scrollY;
        const heritageTop = sections.heritage.offsetTop;
        const downTop = sections.down.offsetTop;
        const precisionTop = sections.precision.offsetTop;
        const trackTop = sections.track.offsetTop;
        const cockpitTop = sections.cockpit.offsetTop;

        if (scrollY < heritageTop - 150) {
            currentSection = 'hero';
            heroFrame = 0;
            animationState.hero.targetFrame = 0;
            window.scrollTo(0, 0);
        } else if (scrollY >= heritageTop - 150 && scrollY < downTop - 150) {
            currentSection = 'heritage';
            window.scrollTo(0, heritageTop);
        } else if (scrollY >= downTop - 150 && scrollY < precisionTop - 150) {
            currentSection = 'down';
            downFrame = 0;
            animationState.down.targetFrame = 0;
            window.scrollTo(0, downTop);
        } else if (scrollY >= precisionTop - 150 && scrollY < trackTop - 150) {
            currentSection = 'precision';
            window.scrollTo(0, precisionTop);
        } else if (scrollY >= trackTop - 150 && scrollY < cockpitTop - 150) {
            currentSection = 'track';
            trackFrame = 1;
            animationState.track.targetFrame = 1;
            window.scrollTo(0, trackTop);
        } else {
            currentSection = 'cockpit';
        }
        updateActiveNavLink();
    }

    // --- Header & Indicator scroll styling ---
    function handleScrollState() {
        const scrollY = window.scrollY;
        
        if (scrollY > 50) {
            mainHeader.classList.add('scrolled');
        } else {
            mainHeader.classList.remove('scrolled');
        }
        
        if (scrollY > 100) {
            scrollIndicator.classList.add('fade-out');
        } else {
            scrollIndicator.classList.remove('fade-out');
        }

        // Section transition detection when scrolling normally
        if (isTransitioning) return;

        const heritageTop = sections.heritage.offsetTop;
        const downTop = sections.down.offsetTop;
        const precisionTop = sections.precision.offsetTop;
        const trackTop = sections.track.offsetTop;
        const cockpitTop = sections.cockpit.offsetTop;

        if (currentSection === 'hero') {
            if (scrollY + 50 >= heritageTop) {
                isTransitioning = true;
                currentSection = 'heritage';
                window.scrollTo({ top: heritageTop, behavior: 'smooth' });
                setTimeout(() => {
                    isTransitioning = false;
                }, 800);
            }
        } else if (currentSection === 'heritage') {
            if (scrollY + 50 >= downTop) {
                isTransitioning = true;
                currentSection = 'down';
                downFrame = 0;
                animationState.down.targetFrame = 0;
                window.scrollTo({ top: downTop, behavior: 'smooth' });
                setTimeout(() => {
                    isTransitioning = false;
                }, 800);
            } else if (scrollY <= 50) {
                isTransitioning = true;
                currentSection = 'hero';
                heroFrame = HERO_FRAMES_COUNT - 1;
                animationState.hero.targetFrame = HERO_FRAMES_COUNT - 1;
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => {
                    isTransitioning = false;
                }, 800);
            }
        } else if (currentSection === 'precision') {
            if (scrollY + 50 >= trackTop) {
                isTransitioning = true;
                currentSection = 'track';
                trackFrame = 1;
                animationState.track.targetFrame = 1;
                playEngineAudio();
                window.scrollTo({ top: trackTop, behavior: 'smooth' });
                setTimeout(() => {
                    isTransitioning = false;
                }, 800);
            } else if (scrollY < precisionTop - 50) {
                isTransitioning = true;
                currentSection = 'down';
                downFrame = DOWN_FRAMES_COUNT - 1;
                animationState.down.targetFrame = DOWN_FRAMES_COUNT - 1;
                window.scrollTo({ top: downTop, behavior: 'smooth' });
                setTimeout(() => {
                    isTransitioning = false;
                }, 800);
            }
        } else if (currentSection === 'cockpit') {
            // Re-engage Track section lock if scrolling up from Cockpit sanctuary content
            if (scrollY < cockpitTop - 50) {
                isTransitioning = true;
                currentSection = 'track';
                trackFrame = TRACK_FRAMES_COUNT - 1;
                animationState.track.targetFrame = TRACK_FRAMES_COUNT - 1;
                playEngineAudio();
                window.scrollTo({ top: trackTop, behavior: 'smooth' });
                setTimeout(() => {
                    isTransitioning = false;
                }, 800);
            }
        }
        updateActiveNavLink();
    }

    // --- Wheel event handler (Scroll Jacking) ---
    window.addEventListener('wheel', (e) => {
        if (isTransitioning) {
            e.preventDefault();
            return;
        }

        const delta = e.deltaY;

        if (currentSection === 'hero') {
            // Lock scrolling
            e.preventDefault();

            // Advance hero frames (adjust sensitivity with divisor)
            const framesToAdvance = delta / 15;
            heroFrame = Math.max(0, Math.min(heroFrame + framesToAdvance, HERO_FRAMES_COUNT - 1));
            animationState.hero.targetFrame = heroFrame;

            if (heroFrame >= HERO_FRAMES_COUNT - 1 && delta > 0) {
                // Done with hero, move to heritage content
                isTransitioning = true;
                currentSection = 'heritage';
                window.scrollTo({ top: sections.heritage.offsetTop, behavior: 'smooth' });
                setTimeout(() => {
                    isTransitioning = false;
                }, 800);
            }
        } else if (currentSection === 'down') {
            // Lock scrolling
            e.preventDefault();

            // Advance down frames
            const framesToAdvance = delta / 15;
            downFrame = Math.max(0, Math.min(downFrame + framesToAdvance, DOWN_FRAMES_COUNT - 1));
            animationState.down.targetFrame = downFrame;

            if (downFrame >= DOWN_FRAMES_COUNT - 1 && delta > 0) {
                // Done with down section, transition to standard precision content
                isTransitioning = true;
                currentSection = 'precision';
                sections.precision.scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => {
                    isTransitioning = false;
                }, 800);
            } else if (downFrame <= 0 && delta < 0) {
                // Moving back up to heritage content
                isTransitioning = true;
                currentSection = 'heritage';
                window.scrollTo({ top: sections.heritage.offsetTop, behavior: 'smooth' });
                setTimeout(() => {
                    isTransitioning = false;
                }, 800);
            }
        } else if (currentSection === 'track') {
            // Lock scrolling
            e.preventDefault();

            // Advance track frames
            const framesToAdvance = delta / 15;
            trackFrame = Math.max(1, Math.min(trackFrame + framesToAdvance, TRACK_FRAMES_COUNT - 1));
            animationState.track.targetFrame = trackFrame;
            triggerEngineRev(Math.abs(delta));

            if (trackFrame >= TRACK_FRAMES_COUNT - 1 && delta > 0) {
                // Done with track section, transition to standard cockpit content
                isTransitioning = true;
                currentSection = 'cockpit';
                stopEngineAudio();
                sections.cockpit.scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => {
                    isTransitioning = false;
                }, 800);
            } else if (trackFrame <= 1 && delta < 0) {
                // Moving back up to precision content
                isTransitioning = true;
                currentSection = 'precision';
                stopEngineAudio();
                window.scrollTo({ top: sections.precision.offsetTop, behavior: 'smooth' });
                setTimeout(() => {
                    isTransitioning = false;
                }, 800);
            }
        }
    }, { passive: false });

    // --- Touch Swipe handler for Mobile/Tablet ---
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (isTransitioning) {
            e.preventDefault();
            return;
        }

        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY - touchY; // Swipe up moves page down (positive deltaY)
        touchStartY = touchY;

        if (currentSection === 'hero') {
            e.preventDefault();
            const framesToAdvance = deltaY / 6;
            heroFrame = Math.max(0, Math.min(heroFrame + framesToAdvance, HERO_FRAMES_COUNT - 1));
            animationState.hero.targetFrame = heroFrame;

            if (heroFrame >= HERO_FRAMES_COUNT - 1 && deltaY > 0) {
                isTransitioning = true;
                currentSection = 'heritage';
                window.scrollTo({ top: sections.heritage.offsetTop, behavior: 'smooth' });
                setTimeout(() => {
                    isTransitioning = false;
                }, 800);
            }
        } else if (currentSection === 'down') {
            e.preventDefault();
            const framesToAdvance = deltaY / 6;
            downFrame = Math.max(0, Math.min(downFrame + framesToAdvance, DOWN_FRAMES_COUNT - 1));
            animationState.down.targetFrame = downFrame;

            if (downFrame >= DOWN_FRAMES_COUNT - 1 && deltaY > 0) {
                isTransitioning = true;
                currentSection = 'precision';
                sections.precision.scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => {
                    isTransitioning = false;
                }, 800);
            } else if (downFrame <= 0 && deltaY < 0) {
                isTransitioning = true;
                currentSection = 'heritage';
                window.scrollTo({ top: sections.heritage.offsetTop, behavior: 'smooth' });
                setTimeout(() => {
                    isTransitioning = false;
                }, 800);
            }
        } else if (currentSection === 'track') {
            e.preventDefault();
            const framesToAdvance = deltaY / 6;
            trackFrame = Math.max(1, Math.min(trackFrame + framesToAdvance, TRACK_FRAMES_COUNT - 1));
            animationState.track.targetFrame = trackFrame;
            triggerEngineRev(Math.abs(deltaY) * 2.5);

            if (trackFrame >= TRACK_FRAMES_COUNT - 1 && deltaY > 0) {
                isTransitioning = true;
                currentSection = 'cockpit';
                stopEngineAudio();
                sections.cockpit.scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => {
                    isTransitioning = false;
                }, 800);
            } else if (trackFrame <= 1 && deltaY < 0) {
                isTransitioning = true;
                currentSection = 'precision';
                stopEngineAudio();
                window.scrollTo({ top: sections.precision.offsetTop, behavior: 'smooth' });
                setTimeout(() => {
                    isTransitioning = false;
                }, 800);
            }
        }
    }, { passive: false });

    // Intercept Header Navigation Clicks to keep sections synced
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetEl = document.querySelector(targetId);
            if (!targetEl) return;
            
            isTransitioning = true;
            
            if (targetId === '#track-section') {
                playEngineAudio();
            } else {
                stopEngineAudio();
            }

            if (targetId === '#hero-section') {
                currentSection = 'hero';
                heroFrame = 0;
                animationState.hero.targetFrame = 0;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else if (targetId === '#heritage-section') {
                currentSection = 'heritage';
                window.scrollTo({ top: targetEl.offsetTop, behavior: 'smooth' });
            } else if (targetId === '#down-section') {
                currentSection = 'down';
                downFrame = 0;
                animationState.down.targetFrame = 0;
                window.scrollTo({ top: targetEl.offsetTop, behavior: 'smooth' });
            } else if (targetId === '#track-section') {
                currentSection = 'track';
                trackFrame = 1;
                animationState.track.targetFrame = 1;
                window.scrollTo({ top: targetEl.offsetTop, behavior: 'smooth' });
            }
            updateActiveNavLink();
            
            setTimeout(() => {
                isTransitioning = false;
            }, 800);
        });
    });

    // --- Animation Rendering Loop ---
    function renderLoop() {
        // 1. HERO ANIMATION SMOOTHING (LERP)
        const heroState = animationState.hero;
        heroState.currentFrame += (heroState.targetFrame - heroState.currentFrame) * LERP_FACTOR;
        
        // Draw frame if index has changed and is within bounds
        const roundedHeroFrame = Math.max(0, Math.min(Math.round(heroState.currentFrame), HERO_FRAMES_COUNT - 1));
        if (roundedHeroFrame !== heroState.lastDrawnFrame) {
            const img = heroImageCache[roundedHeroFrame];
            if (img && img.complete) {
                drawImageCover(heroCtx, img, heroCanvas);
                heroState.lastDrawnFrame = roundedHeroFrame;
                updateTextOverlays(roundedHeroFrame, 'hero');
            }
        }

        // 2. DOWN ANIMATION SMOOTHING (LERP)
        const downState = animationState.down;
        downState.currentFrame += (downState.targetFrame - downState.currentFrame) * LERP_FACTOR;
        
        const roundedDownFrame = Math.max(0, Math.min(Math.round(downState.currentFrame), DOWN_FRAMES_COUNT - 1));
        if (roundedDownFrame !== downState.lastDrawnFrame) {
            const img = downImageCache[roundedDownFrame];
            if (img && img.complete) {
                drawImageContain(downCtx, img, downCanvas);
                downState.lastDrawnFrame = roundedDownFrame;
                updateTextOverlays(roundedDownFrame, 'down');
            }
        }

        // 3. TRACK ANIMATION SMOOTHING (LERP)
        const trackState = animationState.track;
        trackState.currentFrame += (trackState.targetFrame - trackState.currentFrame) * LERP_FACTOR;
        
        const roundedTrackFrame = Math.max(0, Math.min(Math.round(trackState.currentFrame), TRACK_FRAMES_COUNT - 1));
        if (roundedTrackFrame !== trackState.lastDrawnFrame) {
            const img = trackImageCache[roundedTrackFrame];
            if (img && img.complete) {
                drawImageCover(trackCtx, img, trackCanvas);
                trackState.lastDrawnFrame = roundedTrackFrame;
                updateTextOverlays(roundedTrackFrame, 'track');
            }
        }
        
        // Loop continuously
        requestAnimationFrame(renderLoop);
    }

    // --- Initialize the Site ---
    function init() {
        // Set canvas sizing on start
        resizeCanvases();
        
        // Attach event listeners
        window.addEventListener('resize', resizeCanvases, { passive: true });
        window.addEventListener('scroll', handleScrollState, { passive: true });
        
        // Map initial section state
        initSectionState();
        handleScrollState();
        
        // Setup magnetic hover buttons from code.html
        const buttons = document.querySelectorAll('.magnetic-btn');
        buttons.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                btn.style.transform = `translate(${x * 0.2}px, ${y * 0.4}px) scale(1.05)`;
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = `translate(0, 0) scale(1)`;
            });
        });

        // Setup scroll reveal animation for Tailwind sections from code.html
        const observerOptions = {
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        document.querySelectorAll('#heritage-section > div, #precision-section > div, #cockpit-section > div').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(40px)';
            el.style.transition = 'all 1s cubic-bezier(0.16, 1, 0.3, 1)';
            observer.observe(el);
        });

        // Setup Component Showcase click listeners
        const showcaseMenuItems = document.querySelectorAll('.component-showcase-menu .menu-item');
        showcaseMenuItems.forEach((item) => {
            item.addEventListener('click', () => {
                if (isTransitioning) return;
                const targetFrame = parseInt(item.getAttribute('data-target-frame'), 10);
                if (!isNaN(targetFrame)) {
                    animationState.down.targetFrame = targetFrame;
                    downFrame = targetFrame;
                }
            });
        });

        // Remove preloader screen
        document.body.classList.add('loaded');
        
        // Start rendering loops
        requestAnimationFrame(renderLoop);
    }

    // Start preloading images immediately
    preloadAssets(init);
});
