const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    camera.width = canvas.width;
    canvas.height = window.innerHeight;
    camera.height = canvas.height;
}

const MAP_PX = 1024;

const mapImage = new Image();
mapImage.src = 'new_map_debug.png';
let mapLoaded = false;
mapImage.onload = () => { 
    mapLoaded = true; 
    console.log("MAP V11 LOADED WITH FENCES!");
};

// Player - Realistic speed
const player = {
    x: 512,
    y: 900,
    width: 24,
    height: 38,
    speed: 5,
    dir: 'down'
};

const camera = {
    x: 0,
    y: 0,
    width: window.innerWidth,
    height: window.innerHeight
};

window.addEventListener('resize', resizeCanvas);

// Menu System
let gameState = 'SPLASH';
const menuOptions = document.querySelectorAll('.menu-option');
let currentMenuIndex = 0;

setTimeout(() => {
    if (gameState === 'SPLASH') gameState = 'MENU';
}, 3500);

function startGame() {
    gameState = 'PLAYING';
    document.getElementById('start-menu').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';
}

const keys = {};
window.addEventListener('keydown', (e) => {
    if (gameState === 'MENU') {
        if (e.key === 'ArrowUp' || e.key === 'w') {
            currentMenuIndex = (currentMenuIndex > 0) ? currentMenuIndex - 1 : menuOptions.length - 1;
        } else if (e.key === 'ArrowDown' || e.key === 's') {
            currentMenuIndex = (currentMenuIndex < menuOptions.length - 1) ? currentMenuIndex + 1 : 0;
        } else if (e.key === 'Enter') startGame();
        return;
    }
    keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Precise Collision
function checkCollision(px, py, pw, ph) {
    const fx = px + pw / 2;
    const fy = py + ph - 4;

    if (fx < 20 || fx > 1004 || fy < 20 || fy > 1004) return true;

    // YARD FENCES (x: 212-812, y: 212-812)
    const LEFT = 210, RIGHT = 814, TOP = 210, BOTTOM = 814;
    const GATE_L = 480, GATE_R = 544;

    if (fx > LEFT && fx < LEFT + 32 && fy > TOP && fy < BOTTOM) return true;
    if (fx > RIGHT - 32 && fx < RIGHT && fy > TOP && fy < BOTTOM) return true;
    if (fy > TOP && fy < TOP + 32 && fx > LEFT && fx < RIGHT) return true;
    if (fy > BOTTOM - 32 && fy < BOTTOM && (fx < GATE_L || fx > GATE_R) && fx > LEFT && fx < RIGHT) return true;

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
        
        // Player
        const px = Math.floor(player.x);
        const py = Math.floor(player.y);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(px + 12, py + 36, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#800020';
        ctx.fillRect(px + 4, py + 16, 16, 16);
        ctx.fillStyle = '#f1c27d';
        ctx.fillRect(px + 2, py + 2, 20, 14);
        ctx.restore();
    }
    requestAnimationFrame(draw);
}
draw();
resizeCanvas();
console.log("SCRIPT VERSION 11 RUNNING!");
