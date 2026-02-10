const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverScreen = document.getElementById('game-over');
const startScreen = document.getElementById('start-screen');
const finalScoreElement = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

let score = 0;
let gameActive = false;
let animationId;
let player;
let obstacles = [];
let particles = [];
let frameCount = 0;

// Set canvas size
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class Player {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.radius = 15;
        this.color = '#00ffff';
        this.targetX = this.x;
        this.targetY = this.y;
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }

    update() {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        this.x += dx * 0.15;
        this.y += dy * 0.15;
    }
}

class Obstacle {
    constructor() {
        const side = Math.floor(Math.random() * 4);
        this.radius = Math.random() * 20 + 10;
        this.color = `hsl(${Math.random() * 360}, 70%, 60%)`;

        if (side === 0) { // Top
            this.x = Math.random() * canvas.width;
            this.y = -this.radius;
        } else if (side === 1) { // Right
            this.x = canvas.width + this.radius;
            this.y = Math.random() * canvas.height;
        } else if (side === 2) { // Bottom
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + this.radius;
        } else { // Left
            this.x = -this.radius;
            this.y = Math.random() * canvas.height;
        }

        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        const speed = 2 + (score / 100);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = Math.random() * 3;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.alpha = 1;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.02;
    }
}

function init() {
    player = new Player();
    obstacles = [];
    particles = [];
    score = 0;
    scoreElement.innerText = `Score: ${score}`;
    frameCount = 0;
}

function spawnObstacle() {
    const rate = Math.max(10, 60 - Math.floor(score / 10));
    if (frameCount % rate === 0) {
        obstacles.push(new Obstacle());
    }
}

function checkCollision(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < obj1.radius + obj2.radius;
}

function gameOver() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    gameOverScreen.classList.remove('hidden');
    finalScoreElement.innerText = `Final Score: ${score}`;

    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(player.x, player.y, player.color));
    }
}

function animate() {
    if (!gameActive) return;
    animationId = requestAnimationFrame(animate);

    ctx.fillStyle = 'rgba(5, 5, 5, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    player.update();
    player.draw();

    spawnObstacle();
    frameCount++;

    obstacles.forEach((obstacle, index) => {
        obstacle.update();
        obstacle.draw();

        if (checkCollision(player, obstacle)) {
            gameOver();
        }

        // Remove off-screen obstacles
        if (obstacle.x < -100 || obstacle.x > canvas.width + 100 ||
            obstacle.y < -100 || obstacle.y > canvas.height + 100) {
            obstacles.splice(index, 1);
            score += 10;
            scoreElement.innerText = `Score: ${score}`;
        }
    });

    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
            particle.draw();
        }
    });
}

// Input Handlers
window.addEventListener('mousemove', (e) => {
    if (player) {
        player.targetX = e.clientX;
        player.targetY = e.clientY;
    }
});

const handleTouch = (e) => {
    if (gameActive && player) {
        // Only prevent default and track movement when game is live
        if (e.cancelable) e.preventDefault();
        const touch = e.touches ? e.touches[0] : e;
        player.targetX = touch.clientX;
        player.targetY = touch.clientY;
    }
};

window.addEventListener('touchstart', handleTouch, { passive: false });
window.addEventListener('touchmove', handleTouch, { passive: false });
window.addEventListener('pointermove', (e) => {
    if (gameActive && player && e.pointerType === 'mouse') {
        player.targetX = e.clientX;
        player.targetY = e.clientY;
    }
});

window.addEventListener('keydown', (e) => {

    if (!player) return;
    const step = 30;
    if (e.key === 'ArrowUp') player.targetY -= step;
    if (e.key === 'ArrowDown') player.targetY += step;
    if (e.key === 'ArrowLeft') player.targetX -= step;
    if (e.key === 'ArrowRight') player.targetX += step;
});

startBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    gameActive = true;
    init();
    animate();
});

restartBtn.addEventListener('pointerdown', () => {
    gameOverScreen.classList.add('hidden');
    gameActive = true;
    init();
    animate();
});

// Keep click as fallback
restartBtn.addEventListener('click', (e) => {
    e.stopPropagation();
});