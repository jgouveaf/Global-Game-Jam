const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const camera = {
    x: 0,
    y: 0,
    width: window.innerWidth,
    height: window.innerHeight
};

function resizeCanvas() {
    canvas.width = window.innerWidth;
    camera.width = canvas.width;
    canvas.height = window.innerHeight;
    camera.height = canvas.height;
}

const MAP_PX = 1024;

const mapImage = new Image();
mapImage.src = 'new_map_debug.png?v=' + new Date().getTime();
let mapLoaded = false;
mapImage.onload = () => { 
    mapLoaded = true; 
    console.log("MAP V12 LOADED WITH FENCES!");
};

// Player
const player = {
    x: 512,
    y: 900,
    width: 24,
    height: 38,
    speed: 5,
    dir: 'down'
};

window.addEventListener('resize', resizeCanvas);

// Menu System
let gameState = 'SPLASH';
const menuOptions = document.querySelectorAll('.menu-option');
let currentMenuIndex = 0;

setTimeout(() => {
    if (gameState === 'SPLASH') gameState = 'MENU';
}, 2000); // Shorter splash for faster testing

function startGame() {
    console.log("Starting Game...");
    gameState = 'PLAYING';
    document.getElementById('start-menu').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';
}

const keys = {};
window.addEventListener('keydown', (e) => {
    if (gameState === 'MENU') {
        if (e.key === 'Enter') startGame();
        return;
    }
    keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Click handlers for menu
menuOptions.forEach(opt => {
    opt.addEventListener('click', () => {
        if (opt.getAttribute('data-action') === 'play') startGame();
    });
});

// Collision
function checkCollision(px, py, pw, ph) {
    const fx = px + pw / 2;
    const fy = py + ph - 4;
    // Outer bounds
    if (fx < 20 || fx > 1004 || fy < 20 || fy > 1004) return true;
    // Enclosure
    const L = 160, R = 860, T = 160, B = 860;
    const GL = 480, GR = 544;
    // Simple box perimeter collision
    if (fy > T && fy < T+20 && fx > L && fx < R) return true; // Top
    if (fx > L && fx < L+20 && fy > T && fy < B) return true; // Left
    if (fx > R-20 && fx < R && fy > T && fy < B) return true; // Right
    if (fy > B-20 && fy < B && (fx < GL || fx > GR) && fx > L && fx < R) return true; // Bottom (with gate)
    return false;
}

function applyPhysics() {
    let vx = 0; let vy = 0;
    if (keys['a'] || keys['arrowleft']) vx = -player.speed;
    if (keys['d'] || keys['arrowright']) vx = player.speed;
    if (keys['w'] || keys['arrowup']) vy = -player.speed;
    if (keys['s'] || keys['arrowdown']) vy = player.speed;
    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
    
    if (!checkCollision(player.x + vx, player.y, player.width, player.height)) player.x += vx;
    if (!checkCollision(player.x, player.y + vy, player.width, player.height)) player.y += vy;

    camera.x = Math.max(0, Math.min(player.x + player.width/2 - canvas.width/2, MAP_PX - canvas.width));
    camera.y = Math.max(0, Math.min(player.y + player.height/2 - canvas.height/2, MAP_PX - canvas.height));
}

function draw() {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'PLAYING') {
        applyPhysics();
        ctx.save();
        ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));
        if (mapLoaded) ctx.drawImage(mapImage, 0, 0, MAP_PX, MAP_PX);
        
        ctx.fillStyle = '#800020';
        ctx.fillRect(Math.floor(player.x+4), Math.floor(player.y+16), 16, 16);
        ctx.restore();
    }
    requestAnimationFrame(draw);
}
resizeCanvas();
draw();
console.log("SCRIPT VERSION 12 - PLAY BUTTON FIXED!");
