document.addEventListener('DOMContentLoaded', () => {
    // Original image dimensions
    const originalWidth = 3032;
    const originalHeight = 2021;

    // Configuration for the hidden objects - easy to modify
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

    const imageContainer = document.getElementById('image-container');
    const feedback = document.getElementById('feedback');
    const gameImage = document.getElementById('game-image');
    
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

    imageContainer.addEventListener('click', (e) => {
        if (checkAllFound()) return;

        const rect = imageContainer.getBoundingClientRect();
        const displayWidth = gameImage.clientWidth;
        const displayHeight = gameImage.clientHeight;
        
        // Get the exact click coordinates relative to the image
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        let foundNew = false;

        targetAreas.forEach((target, index) => {
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
                foundNew = true;
                createMarker(x, y);  // Using exact click coordinates
            }
        });

        updateFeedback();
    });

    // Initialize feedback
    updateFeedback();
});