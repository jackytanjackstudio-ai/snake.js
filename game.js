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

highScoreElement.textContent = highScore;

function drawGame() {
    if (!gameRunning) return;

    // Move snake
    const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };

    // Check wall collision
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        gameOver();
        return;
    }

    // Check self collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }

    snake.unshift(head);

    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;

        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }

        placeFood();
    } else {
        snake.pop();
    }

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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

    // Draw food
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(food.x * GRID_SIZE + GRID_SIZE / 2, food.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw snake
    snake.forEach((segment, index) => {
        if (index === 0) {
            // Draw head with eyes
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(segment.x * GRID_SIZE + 1, segment.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);

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
}

function placeFood() {
    do {
        food.x = Math.floor(Math.random() * TILE_COUNT);
        food.y = Math.floor(Math.random() * TILE_COUNT);
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
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
