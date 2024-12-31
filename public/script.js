document.addEventListener('DOMContentLoaded', () => {
    const originalWidth = 3032;
    const originalHeight = 2021;
    const HOLD_DURATION = 3000; // 3 seconds in milliseconds

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

    const imageContainer = document.getElementById('image-container');
    const feedback = document.getElementById('feedback');
    const gameImage = document.getElementById('game-image');
    
    let holdTimer = null;
    let holdStartTime = null;
    let progressCircle = null;

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
        // ... (keep your existing confetti code)
    }

    function createMarker(x, y) {
        const newMarker = document.createElement('div');
        newMarker.className = 'marker marker-found';
        newMarker.style.left = `${x}px`;
        newMarker.style.top = `${y}px`;
        imageContainer.appendChild(newMarker);
        return newMarker;
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

    function completeTarget(x, y) {
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
                createMarker(x, y);
            }
        });
        updateFeedback();
    }

    imageContainer.addEventListener('mousedown', (e) => {
        if (checkAllFound()) return;

        const rect = imageContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (checkTarget(x, y)) {
            holdStartTime = Date.now();
            progressCircle = createProgressCircle(x, y);
            
            holdTimer = setInterval(() => {
                updateProgress(holdStartTime);
                
                if (Date.now() - holdStartTime >= HOLD_DURATION) {
                    clearInterval(holdTimer);
                    progressCircle.remove();
                    completeTarget(x, y);
                }
            }, 10);
        }
    });

    document.addEventListener('mouseup', () => {
        if (holdTimer) {
            clearInterval(holdTimer);
            holdTimer = null;
        }
        if (progressCircle) {
            progressCircle.remove();
            progressCircle = null;
        }
    });

    document.addEventListener('mouseleave', () => {
        if (holdTimer) {
            clearInterval(holdTimer);
            holdTimer = null;
        }
        if (progressCircle) {
            progressCircle.remove();
            progressCircle = null;
        }
    });

    // Initialize feedback
    updateFeedback();
});