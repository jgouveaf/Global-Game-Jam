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
    console.log("MAP LOADED WITH FENCES!");
};

// Player
const player = {
    x: 512,
    y: 850,
    width: 24,
    height: 38,
    speed: 5,
    dir: 'down'
};

window.addEventListener('resize', resizeCanvas);

// Menu System
let gameState = 'MENU'; // Start directly in MENU
const startMenu = document.getElementById('start-menu');
const gameUI = document.getElementById('game-ui');

function startGame() {
    console.log("Starting Game... V15 (Force Play)");
    gameState = 'PLAYING';
    if(startMenu) startMenu.setAttribute('style', 'display: none !important'); // Force hide
    if(gameUI) gameUI.style.display = 'block';
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

// Click handlers for the new button
const playButton = document.querySelector('[data-action="play"]');
if (playButton) {
    playButton.onclick = (e) => {
        console.log("Button Clicked!");
        startGame();
    };
} else {
    console.error("Play button not found!");
}

// Precise Collision
function checkCollision(px, py, pw, ph) {
    const fx = px + pw / 2;
    const fy = py + ph - 4;
    // Map bounds
    if (fx < 30 || fx > 994 || fy < 30 || fy > 994) return true;
    
    // Fence Enclosure (approx rectangle in center from new_map_debug.png)
    const L = 160, R = 860, T = 160, B = 860;
    const GL = 480, GR = 544;
    
    if (fx > L && fx < L+20 && fy > T && fy < B) return true; // Left
    if (fx > R-20 && fx < R && fy > T && fy < B) return true; // Right
    if (fy > T && fy < T+20 && fx > L && fx < R) return true; // Top
    if (fy > B-20 && fy < B && (fx < GL || fx > GR) && fx > L && fx < R) return true; // Bottom
    
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
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(Math.floor(player.x+12), Math.floor(player.y+36), 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Body
        ctx.fillStyle = '#800020';
        ctx.fillRect(Math.floor(player.x+4), Math.floor(player.y+16), 16, 16);
        ctx.restore();
    }
    requestAnimationFrame(draw);
}
resizeCanvas();
draw();
console.log("SCRIPT VERSION 15 - READY!");
