document.addEventListener('DOMContentLoaded', () => {
    const originalWidth = 3032;
    const originalHeight = 2021;
    const HOLD_DURATION = 3000; // 3 seconds in milliseconds

    const targetAreas = [
        {
            x: 1034,  // First bird
            y: 1358,
            radius: 50,
            found: false
        },
        {
            x: 2752,  // Second bird
            y: 764,
            radius: 100,
            found: false
        }
    ];

    // Zoom and pan variables
    let currentScale = 1;
    let lastScale = 1;
    let startDistance = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let translateX = 0;
    let translateY = 0;
    let initialPinchDistance = 0;
    let initialPinchX = 0;
    let initialPinchY = 0;

    const imageContainer = document.getElementById('image-container');
    const feedback = document.getElementById('feedback');
    const gameImage = document.getElementById('game-image');
    
    let holdTimer = null;
    let holdStartTime = null;
    let progressCircle = null;
    let currentCheckPosition = null;
    let startTimeout = null;

    // Helper function to get coordinates relative to container
    function getPointFromTouch(touch) {
        const rect = imageContainer.getBoundingClientRect();
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
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
        const x = touchX || e.clientX - rect.left;
        const y = touchY || e.clientY - rect.top;

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
            const touch1 = getPointFromTouch(e.touches[0]);
            const touch2 = getPointFromTouch(e.touches[1]);
            
            // Calculate center point between the two touches
            initialPinchX = (touch1.x + touch2.x) / 2;
            initialPinchY = (touch1.y + touch2.y) / 2;
            
            initialPinchDistance = Math.hypot(
                touch1.x - touch2.x,
                touch1.y - touch2.y
            );
            
            lastScale = currentScale;
        } else if (e.touches.length === 1 && currentScale > 1) {
            isDragging = true;
            const touch = getPointFromTouch(e.touches[0]);
            startX = touch.x - translateX;
            startY = touch.y - translateY;
        } else {
            const touch = e.touches[0];
            const rect = imageContainer.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            handleStart(e, x, y);
        }
    }, { passive: false });

    imageContainer.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const touch1 = getPointFromTouch(e.touches[0]);
            const touch2 = getPointFromTouch(e.touches[1]);
            
            const currentPinchX = (touch1.x + touch2.x) / 2;
            const currentPinchY = (touch1.y + touch2.y) / 2;
            
            const pinchDistance = Math.hypot(
                touch1.x - touch2.x,
                touch1.y - touch2.y
            );
            
            const newScale = Math.min(Math.max(1, lastScale * (pinchDistance / initialPinchDistance)), 4);
            
            // Calculate the transform origin offset
            const scaleChange = newScale - currentScale;
            translateX += (initialPinchX - currentPinchX) * currentScale;
            translateY += (initialPinchY - currentPinchY) * currentScale;
            
            currentScale = newScale;
            
            imageContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
        } else if (e.touches.length === 1 && isDragging) {
            const touch = getPointFromTouch(e.touches[0]);
            translateX = touch.x - startX;
            translateY = touch.y - startY;
            
            imageContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
        }
    }, { passive: false });

    imageContainer.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) {
            startDistance = 0;
            lastScale = currentScale;
        }
        if (e.touches.length === 0) {
            isDragging = false;
        }
        handleEnd();
    });

    // Double tap to reset zoom
    let lastTap = 0;
    imageContainer.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTap < 300) {
            if (!isDragging) {
                currentScale = 1;
                lastScale = 1;
                translateX = 0;
                translateY = 0;
                imageContainer.style.transform = 'none';
            }
        }
        lastTap = now;
    });

    // Initialize feedback
    updateFeedback();
});