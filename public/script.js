document.addEventListener('DOMContentLoaded', () => {
    const originalWidth = 3032;
    const originalHeight = 2021;
    const HOLD_DURATION = 3000;
    const MAX_ZOOM = 4;
    const MIN_ZOOM = 1;
 
    const targetAreas = [
        {
            x: 1034,
            y: 1358,
            radius: 50,
            found: false
        },
        {
            x: 2752,
            y: 764,
            radius: 100,
            found: false
        }
    ];
 
    let holdTimer = null;
    let holdStartTime = null;
    let progressCircle = null;
    let currentCheckPosition = null;
    let startTimeout = null;
 
    // Zoom and pan state
    let initialScale = 1;
    let currentScale = 1;
    let initialDistance = 0;
    let currentTransformX = 0;
    let currentTransformY = 0;
    let lastX = 0;
    let lastY = 0;
    let isDragging = false;
 
    const imageContainer = document.getElementById('image-container');
    const feedback = document.getElementById('feedback');
    const gameImage = document.getElementById('game-image');
 
    // Prevent context menu
    imageContainer.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });
 
    gameImage.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });
 
    function getBoundaries() {
        const rect = imageContainer.getBoundingClientRect();
        const containerWidth = rect.width;
        const containerHeight = rect.height;
        
        // Calculate current image dimensions at scale
        const scaledWidth = containerWidth * currentScale;
        const scaledHeight = containerHeight * currentScale;
        
        // Using divisor of 5 for tight boundaries
        const maxTranslateX = Math.abs(scaledWidth - containerWidth) / 5;
        const maxTranslateY = Math.abs(scaledHeight - containerHeight) / 5;
 
        return {
            maxTranslateX,
            maxTranslateY,
            containerWidth,
            containerHeight,
            scaledWidth,
            scaledHeight
        };
    }
 
    function constrainTransform() {
        const bounds = getBoundaries();
        
        // If not zoomed, center image
        if (currentScale <= 1) {
            currentTransformX = 0;
            currentTransformY = 0;
            return;
        }
 
        // Hard constrain the translations
        currentTransformX = currentTransformX > bounds.maxTranslateX ? bounds.maxTranslateX : 
                           currentTransformX < -bounds.maxTranslateX ? -bounds.maxTranslateX : 
                           currentTransformX;
                           
        currentTransformY = currentTransformY > bounds.maxTranslateY ? bounds.maxTranslateY : 
                           currentTransformY < -bounds.maxTranslateY ? -bounds.maxTranslateY : 
                           currentTransformY;
    }
 
    function updateTransform() {
        constrainTransform();
        imageContainer.style.transformOrigin = 'center center';
        imageContainer.style.transform = `translate(${currentTransformX}px, ${currentTransformY}px) scale(${currentScale})`;
    }
 
    function createProgressCircle(x, y) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        circle.setAttribute('class', 'progress-circle');
        circle.setAttribute('viewBox', '0 0 36 36');
        circle.style.left = `${x}px`;
        circle.style.top = `${y}px`;
 
        const backgroundCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        backgroundCircle.setAttribute('class', 'background');
        backgroundCircle.setAttribute('cx', '18');
        backgroundCircle.setAttribute('cy', '18');
        backgroundCircle.setAttribute('r', '16');
 
        const progressArc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        progressArc.setAttribute('class', 'progress');
        progressArc.setAttribute('cx', '18');
        progressArc.setAttribute('cy', '18');
        progressArc.setAttribute('r', '16');
        progressArc.setAttribute('stroke-dasharray', '100.53096491487338');
        progressArc.setAttribute('stroke-dashoffset', '100.53096491487338');
 
        circle.appendChild(backgroundCircle);
        circle.appendChild(progressArc);
        imageContainer.appendChild(circle);
 
        return circle;
    }
 
    function updateProgress(startTime) {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / HOLD_DURATION, 1);
        const progressArc = progressCircle.querySelector('.progress');
        const circumference = 2 * Math.PI * 16;
        const offset = circumference - (progress * circumference);
        progressArc.setAttribute('stroke-dashoffset', offset);
    }
 
    function createConfetti() {
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        for (let i = 0; i < 150; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = `${Math.random() * viewportWidth}px`;
            confetti.style.top = `${viewportHeight * 0.2}px`;
            
            const colors = [
                '#ff0', '#f00', '#0f0', '#0ff', '#00f', 
                '#f0f', '#FFD700', '#C0C0C0', '#FF69B4', '#7FFF00'
            ];
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            const size = 5 + Math.random() * 10;
            confetti.style.width = `${size}px`;
            confetti.style.height = `${size}px`;
            
            confetti.style.animation = `confetti ${1.5 + Math.random() * 3}s linear forwards`;
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 4000);
        }
    }
 
    function checkAllFound() {
        return targetAreas.every(target => target.found);
    }
 
    function updateFeedback() {
        const foundCount = targetAreas.filter(target => target.found).length;
        const totalTargets = targetAreas.length;
        
        if (checkAllFound()) {
            feedback.textContent = 'Congratulations! You found all the birds!';
            feedback.className = 'feedback success success-animation';
            createConfetti();
        } else {
            feedback.textContent = `Keep looking! You've found ${foundCount} of ${totalTargets} birds.`;
            feedback.className = 'feedback';
        }
    }
 
    function checkTarget(x, y) {
        const displayWidth = gameImage.clientWidth;
        const displayHeight = gameImage.clientHeight;
        
        for (let target of targetAreas) {
            if (target.found) continue;
 
            const scaledTargetX = (target.x * displayWidth) / originalWidth;
            const scaledTargetY = (target.y * displayHeight) / originalHeight;
            const scaledRadius = (target.radius * displayWidth) / originalWidth;
 
            const distance = Math.sqrt(
                Math.pow(x - scaledTargetX, 2) + 
                Math.pow(y - scaledTargetY, 2)
            );
 
            if (distance <= scaledRadius) {
                return true;
            }
        }
        return false;
    }
 
    function completeCheck(x, y) {
        const isTarget = checkTarget(x, y);
        
        if (isTarget) {
            progressCircle.querySelector('.progress').style.stroke = '#4CAF50';
            progressCircle.classList.add('found-target');
            const displayWidth = gameImage.clientWidth;
            const displayHeight = gameImage.clientHeight;
            
            targetAreas.forEach((target) => {
                if (target.found) return;
 
                const scaledTargetX = (target.x * displayWidth) / originalWidth;
                const scaledTargetY = (target.y * displayHeight) / originalHeight;
                const scaledRadius = (target.radius * displayWidth) / originalWidth;
 
                const distance = Math.sqrt(
                    Math.pow(x - scaledTargetX, 2) + 
                    Math.pow(y - scaledTargetY, 2)
                );
 
                if (distance <= scaledRadius) {
                    target.found = true;
                }
            });
            updateFeedback();
        } else {
            progressCircle.querySelector('.progress').style.stroke = '#ff0000';
        }
 
        progressCircle.classList.add('pulse');
 
        if (!isTarget) {
            setTimeout(() => {
                if (progressCircle) {
                    progressCircle.remove();
                }
            }, 500);
        }
    }
 
    function handleStart(e, touchX, touchY) {
        if (checkAllFound()) return;
 
        const rect = imageContainer.getBoundingClientRect();
        
        // Get raw click coordinates
        let x = touchX || e.clientX - rect.left;
        let y = touchY || e.clientY - rect.top;
 
        // If zoomed, adjust coordinates
        if (currentScale > 1) {
            // Get coordinates relative to transformed position
            const transformedX = (x - currentTransformX) / currentScale;
            const transformedY = (y - currentTransformY) / currentScale;
            x = transformedX;
            y = transformedY;
        }
 
        if (startTimeout) {
            clearTimeout(startTimeout);
        }
 
        startTimeout = setTimeout(() => {
            holdStartTime = Date.now();
            progressCircle = createProgressCircle(x, y);
            currentCheckPosition = { x, y };
            
            holdTimer = setInterval(() => {
                updateProgress(holdStartTime);
                
                if (Date.now() - holdStartTime >= HOLD_DURATION) {
                    clearInterval(holdTimer);
                    holdTimer = null;
                    completeCheck(currentCheckPosition.x, currentCheckPosition.y);
                }
            }, 10);
        }, 200);
    }
 
    function handleEnd() {
        if (startTimeout) {
            clearTimeout(startTimeout);
            startTimeout = null;
        }
 
        if (holdTimer) {
            clearInterval(holdTimer);
            holdTimer = null;
        }
        if (progressCircle && !progressCircle.classList.contains('pulse')) {
            progressCircle.remove();
            progressCircle = null;
        }
        currentCheckPosition = null;
    }
 
    // Mouse Events
    imageContainer.addEventListener('mousedown', handleStart);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('mouseleave', handleEnd);
 
    // Touch Events
    imageContainer.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            
            initialDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            initialScale = currentScale;
            
            lastX = (touch1.clientX + touch2.clientX) / 2;
            lastY = (touch1.clientY + touch2.clientY) / 2;
        } else if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = imageContainer.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
 
            // Start the selection circle regardless of zoom level
            handleStart(e, x, y);
 
            // If zoomed in, also enable dragging
            if (currentScale > 1) {
                isDragging = true;
                lastX = touch.clientX - currentTransformX;
                lastY = touch.clientY - currentTransformY;
            }
        }
    }, { passive: false });
 
    imageContainer.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            
            const distance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            
            const newScale = Math.min(Math.max(
                initialScale * (distance / initialDistance),
                MIN_ZOOM
            ), MAX_ZOOM);
            
            if (newScale !== currentScale) {
                currentScale = newScale;
                const midX = (touch1.clientX + touch2.clientX) / 2;
                const midY = (touch1.clientY + touch2.clientY) / 2;
                
                currentTransformX += midX - lastX;
                currentTransformY += midY - lastY;
                lastX = midX;
                lastY = midY;
                
                updateTransform();
            }
        } else if (e.touches.length === 1 && isDragging) {
            const touch = e.touches[0];
            currentTransformX = touch.clientX - lastX;
            currentTransformY = touch.clientY - lastY;
            updateTransform();
        }
    }, { passive: false });
 
    imageContainer.addEventListener('touchend', (e) => {
        if (e.touches.length === 0) {
            isDragging = false;
            updateTransform();
        }
        handleEnd();
    });
 
    // Initialize feedback
    updateFeedback();
 });