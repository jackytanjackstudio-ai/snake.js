const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const startBtn = document.getElementById('startBtn');

const GRID_SIZE = 20;
const TILE_COUNT = canvas.width / GRID_SIZE;

let snake = [{ x: 10, y: 10 }];
let velocity = { x: 0, y: 0 };
let food = { x: 15, y: 15 };
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameRunning = false;
let gameLoop;

// Particle system
let particles = [];
let scorePopups = [];
let screenShake = { x: 0, y: 0, intensity: 0 };

// Power-ups
let powerUps = [];
let activePowerUps = {
    shield: 0,
    ghost: 0,
    speed: 0,
    magnet: 0
};

// Animation
let animationFrame = 0;

class Particle {
    constructor(x, y, color, speedX, speedY, life) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.speedX = speedX;
        this.speedY = speedY;
        this.life = life;
        this.maxLife = life;
        this.size = Math.random() * 4 + 2;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += 0.2; // Gravity
        this.life--;
    }

    draw() {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = this.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

class ScorePopup {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.life = 60;
        this.offsetY = 0;
    }

    update() {
        this.offsetY -= 1;
        this.life--;
    }

    draw() {
        const alpha = this.life / 60;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('+' + this.value, this.x, this.y + this.offsetY);
        ctx.restore();
    }
}

highScoreElement.textContent = highScore;

function drawGame() {
    if (!gameRunning) return;

    animationFrame++;

    // Update power-ups
    for (let key in activePowerUps) {
        if (activePowerUps[key] > 0) {
            activePowerUps[key]--;
        }
    }

    // Move snake
    const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };

    // Check wall collision (unless ghost mode active)
    if (!activePowerUps.ghost) {
        if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
            createExplosion(head.x * GRID_SIZE + GRID_SIZE / 2, head.y * GRID_SIZE + GRID_SIZE / 2, '#ff0000');
            addScreenShake(10);
            gameOver();
            return;
        }
    } else {
        // Wrap around in ghost mode
        if (head.x < 0) head.x = TILE_COUNT - 1;
        if (head.x >= TILE_COUNT) head.x = 0;
        if (head.y < 0) head.y = TILE_COUNT - 1;
        if (head.y >= TILE_COUNT) head.y = 0;
    }

    // Check self collision (unless ghost or shield active)
    if (!activePowerUps.ghost && !activePowerUps.shield) {
        if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            createExplosion(head.x * GRID_SIZE + GRID_SIZE / 2, head.y * GRID_SIZE + GRID_SIZE / 2, '#ff0000');
            addScreenShake(10);
            gameOver();
            return;
        }
    }

    snake.unshift(head);

    // Check power-up collision
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        if (head.x === powerUp.x && head.y === powerUp.y) {
            activatePowerUp(powerUp.type);
            createExplosion(powerUp.x * GRID_SIZE + GRID_SIZE / 2, powerUp.y * GRID_SIZE + GRID_SIZE / 2, powerUp.color);
            addScreenShake(3);
            powerUps.splice(i, 1);
        }
    }

    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;

        // Create particle explosion
        createExplosion(food.x * GRID_SIZE + GRID_SIZE / 2, food.y * GRID_SIZE + GRID_SIZE / 2, '#00ff00');

        // Create score popup
        scorePopups.push(new ScorePopup(food.x * GRID_SIZE + GRID_SIZE / 2, food.y * GRID_SIZE + GRID_SIZE / 2, 10));

        // Add screen shake
        addScreenShake(3);

        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }

        placeFood();

        // Spawn power-up randomly (20% chance)
        if (Math.random() < 0.2) {
            spawnPowerUp();
        }
    } else {
        snake.pop();
    }

    // Update screen shake
    if (screenShake.intensity > 0) {
        screenShake.x = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.y = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.intensity *= 0.9;
        if (screenShake.intensity < 0.1) {
            screenShake.intensity = 0;
            screenShake.x = 0;
            screenShake.y = 0;
        }
    }

    // Update particles
    particles = particles.filter(p => {
        p.update();
        return p.life > 0;
    });

    // Update score popups
    scorePopups = scorePopups.filter(p => {
        p.update();
        return p.life > 0;
    });

    // Clear canvas with screen shake
    ctx.save();
    ctx.translate(screenShake.x, screenShake.y);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-20, -20, canvas.width + 40, canvas.height + 40);

    // Draw grid
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= TILE_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(canvas.width, i * GRID_SIZE);
        ctx.stroke();
    }

    // Draw food with pulsing animation
    const foodPulse = Math.sin(animationFrame * 0.1) * 2;
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(food.x * GRID_SIZE + GRID_SIZE / 2, food.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 2 - 2 + foodPulse, 0, Math.PI * 2);
    ctx.fill();

    // Draw glow around food
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff0000';
    ctx.beginPath();
    ctx.arc(food.x * GRID_SIZE + GRID_SIZE / 2, food.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 2 - 2 + foodPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw power-ups
    powerUps.forEach(powerUp => {
        const pulse = Math.sin(animationFrame * 0.15) * 3;
        ctx.fillStyle = powerUp.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = powerUp.color;
        ctx.beginPath();
        ctx.arc(powerUp.x * GRID_SIZE + GRID_SIZE / 2, powerUp.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 2 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Draw power-up icon
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(powerUp.icon, powerUp.x * GRID_SIZE + GRID_SIZE / 2, powerUp.y * GRID_SIZE + GRID_SIZE / 2);
        ctx.shadowBlur = 0;
    });

    // Draw snake
    snake.forEach((segment, index) => {
        if (index === 0) {
            // Draw head with eyes
            let headColor = '#00ff00';
            if (activePowerUps.shield > 0) headColor = '#00ffff';
            if (activePowerUps.ghost > 0) headColor = '#9966ff';

            ctx.fillStyle = headColor;
            if (activePowerUps.shield > 0 || activePowerUps.ghost > 0) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = headColor;
            }
            ctx.fillRect(segment.x * GRID_SIZE + 1, segment.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
            ctx.shadowBlur = 0;

            // Draw eyes based on direction
            ctx.fillStyle = '#fff';
            let eyeX1, eyeY1, eyeX2, eyeY2;

            if (velocity.x === 1) { // Right
                eyeX1 = segment.x * GRID_SIZE + 13;
                eyeY1 = segment.y * GRID_SIZE + 6;
                eyeX2 = segment.x * GRID_SIZE + 13;
                eyeY2 = segment.y * GRID_SIZE + 13;
            } else if (velocity.x === -1) { // Left
                eyeX1 = segment.x * GRID_SIZE + 6;
                eyeY1 = segment.y * GRID_SIZE + 6;
                eyeX2 = segment.x * GRID_SIZE + 6;
                eyeY2 = segment.y * GRID_SIZE + 13;
            } else if (velocity.y === -1) { // Up
                eyeX1 = segment.x * GRID_SIZE + 6;
                eyeY1 = segment.y * GRID_SIZE + 6;
                eyeX2 = segment.x * GRID_SIZE + 13;
                eyeY2 = segment.y * GRID_SIZE + 6;
            } else { // Down
                eyeX1 = segment.x * GRID_SIZE + 6;
                eyeY1 = segment.y * GRID_SIZE + 13;
                eyeX2 = segment.x * GRID_SIZE + 13;
                eyeY2 = segment.y * GRID_SIZE + 13;
            }

            // White of eyes
            ctx.beginPath();
            ctx.arc(eyeX1, eyeY1, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eyeX2, eyeY2, 3, 0, Math.PI * 2);
            ctx.fill();

            // Pupils
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(eyeX1, eyeY1, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eyeX2, eyeY2, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Tongue
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (velocity.x === 1) { // Right
                ctx.moveTo(segment.x * GRID_SIZE + GRID_SIZE, segment.y * GRID_SIZE + GRID_SIZE / 2);
                ctx.lineTo(segment.x * GRID_SIZE + GRID_SIZE + 4, segment.y * GRID_SIZE + GRID_SIZE / 2);
            } else if (velocity.x === -1) { // Left
                ctx.moveTo(segment.x * GRID_SIZE, segment.y * GRID_SIZE + GRID_SIZE / 2);
                ctx.lineTo(segment.x * GRID_SIZE - 4, segment.y * GRID_SIZE + GRID_SIZE / 2);
            } else if (velocity.y === -1) { // Up
                ctx.moveTo(segment.x * GRID_SIZE + GRID_SIZE / 2, segment.y * GRID_SIZE);
                ctx.lineTo(segment.x * GRID_SIZE + GRID_SIZE / 2, segment.y * GRID_SIZE - 4);
            } else if (velocity.y === 1) { // Down
                ctx.moveTo(segment.x * GRID_SIZE + GRID_SIZE / 2, segment.y * GRID_SIZE + GRID_SIZE);
                ctx.lineTo(segment.x * GRID_SIZE + GRID_SIZE / 2, segment.y * GRID_SIZE + GRID_SIZE + 4);
            }
            ctx.stroke();
        } else {
            // Draw body with gradient
            const gradient = ctx.createLinearGradient(
                segment.x * GRID_SIZE,
                segment.y * GRID_SIZE,
                segment.x * GRID_SIZE + GRID_SIZE,
                segment.y * GRID_SIZE + GRID_SIZE
            );
            gradient.addColorStop(0, '#00cc00');
            gradient.addColorStop(1, '#009900');
            ctx.fillStyle = gradient;
            ctx.fillRect(segment.x * GRID_SIZE + 1, segment.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);

            // Add scale pattern
            ctx.fillStyle = '#00aa00';
            ctx.fillRect(segment.x * GRID_SIZE + 3, segment.y * GRID_SIZE + 3, GRID_SIZE - 6, GRID_SIZE - 6);
        }
    });

    // Draw particles
    particles.forEach(p => p.draw());

    // Draw score popups
    scorePopups.forEach(p => p.draw());

    // Draw power-up indicators
    ctx.restore();
    drawPowerUpIndicators();
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        const speed = Math.random() * 3 + 2;
        particles.push(new Particle(
            x,
            y,
            color,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed - 2,
            40
        ));
    }
}

function addScreenShake(intensity) {
    screenShake.intensity = intensity;
}

function spawnPowerUp() {
    const types = [
        { type: 'shield', color: '#00ffff', icon: '🛡' },
        { type: 'ghost', color: '#9966ff', icon: '👻' },
        { type: 'speed', color: '#ffaa00', icon: '⚡' },
        { type: 'magnet', color: '#ff00ff', icon: '🧲' }
    ];

    const powerUp = types[Math.floor(Math.random() * types.length)];

    do {
        powerUp.x = Math.floor(Math.random() * TILE_COUNT);
        powerUp.y = Math.floor(Math.random() * TILE_COUNT);
    } while (
        snake.some(s => s.x === powerUp.x && s.y === powerUp.y) ||
        (food.x === powerUp.x && food.y === powerUp.y) ||
        powerUps.some(p => p.x === powerUp.x && p.y === powerUp.y)
    );

    powerUps.push(powerUp);

    // Remove power-up after 10 seconds
    setTimeout(() => {
        const index = powerUps.indexOf(powerUp);
        if (index > -1) powerUps.splice(index, 1);
    }, 10000);
}

function activatePowerUp(type) {
    if (type === 'shield') {
        activePowerUps.shield = 300; // 5 seconds at 60fps
    } else if (type === 'ghost') {
        activePowerUps.ghost = 300;
    } else if (type === 'speed') {
        activePowerUps.speed = 300;
    } else if (type === 'magnet') {
        activePowerUps.magnet = 300;
    }
}

function drawPowerUpIndicators() {
    let yOffset = 10;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';

    if (activePowerUps.shield > 0) {
        ctx.fillStyle = '#00ffff';
        ctx.fillText('🛡 Shield: ' + Math.ceil(activePowerUps.shield / 60) + 's', 10, yOffset);
        yOffset += 20;
    }
    if (activePowerUps.ghost > 0) {
        ctx.fillStyle = '#9966ff';
        ctx.fillText('👻 Ghost: ' + Math.ceil(activePowerUps.ghost / 60) + 's', 10, yOffset);
        yOffset += 20;
    }
    if (activePowerUps.speed > 0) {
        ctx.fillStyle = '#ffaa00';
        ctx.fillText('⚡ Speed: ' + Math.ceil(activePowerUps.speed / 60) + 's', 10, yOffset);
        yOffset += 20;
    }
    if (activePowerUps.magnet > 0) {
        ctx.fillStyle = '#ff00ff';
        ctx.fillText('🧲 Magnet: ' + Math.ceil(activePowerUps.magnet / 60) + 's', 10, yOffset);
        yOffset += 20;
    }
}

function placeFood() {
    do {
        food.x = Math.floor(Math.random() * TILE_COUNT);
        food.y = Math.floor(Math.random() * TILE_COUNT);
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y) ||
             powerUps.some(p => p.x === food.x && p.y === food.y));
}

function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    startBtn.textContent = 'Restart Game';
    alert(`Game Over! Your score: ${score}`);
}

function startGame() {
    snake = [{ x: 10, y: 10 }];
    velocity = { x: 1, y: 0 };
    score = 0;
    scoreElement.textContent = score;
    particles = [];
    scorePopups = [];
    powerUps = [];
    activePowerUps = { shield: 0, ghost: 0, speed: 0, magnet: 0 };
    screenShake = { x: 0, y: 0, intensity: 0 };
    placeFood();
    gameRunning = true;
    startBtn.textContent = 'Game Running...';

    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(drawGame, 150);
}

document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;

    switch(e.key) {
        case 'ArrowUp':
            if (velocity.y === 0) {
                velocity = { x: 0, y: -1 };
            }
            break;
        case 'ArrowDown':
            if (velocity.y === 0) {
                velocity = { x: 0, y: 1 };
            }
            break;
        case 'ArrowLeft':
            if (velocity.x === 0) {
                velocity = { x: -1, y: 0 };
            }
            break;
        case 'ArrowRight':
            if (velocity.x === 0) {
                velocity = { x: 1, y: 0 };
            }
            break;
    }
    e.preventDefault();
});

startBtn.addEventListener('click', startGame);

// Mobile touch controls
const upBtn = document.getElementById('upBtn');
const downBtn = document.getElementById('downBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

function changeDirection(newVelocity) {
    if (!gameRunning) return;

    if (newVelocity.x !== 0 && velocity.x === 0) {
        velocity = newVelocity;
    } else if (newVelocity.y !== 0 && velocity.y === 0) {
        velocity = newVelocity;
    }
}

upBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    changeDirection({ x: 0, y: -1 });
});

downBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    changeDirection({ x: 0, y: 1 });
});

leftBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    changeDirection({ x: -1, y: 0 });
});

rightBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    changeDirection({ x: 1, y: 0 });
});

// Click events for desktop testing
upBtn.addEventListener('click', () => changeDirection({ x: 0, y: -1 }));
downBtn.addEventListener('click', () => changeDirection({ x: 0, y: 1 }));
leftBtn.addEventListener('click', () => changeDirection({ x: -1, y: 0 }));
rightBtn.addEventListener('click', () => changeDirection({ x: 1, y: 0 }));

// Swipe controls for mobile
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, false);

canvas.addEventListener('touchend', (e) => {
    if (!gameRunning) return;

    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
}, false);

function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const minSwipeDistance = 30;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0 && velocity.x === 0) {
                velocity = { x: 1, y: 0 };
            } else if (deltaX < 0 && velocity.x === 0) {
                velocity = { x: -1, y: 0 };
            }
        }
    } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0 && velocity.y === 0) {
                velocity = { x: 0, y: 1 };
            } else if (deltaY < 0 && velocity.y === 0) {
                velocity = { x: 0, y: -1 };
            }
        }
    }
}
