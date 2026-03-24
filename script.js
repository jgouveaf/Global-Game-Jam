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
    console.log("MAP V14 LOADED WITH FENCES!");
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
let gameState = 'SPLASH';
const menuOptions = document.querySelectorAll('.menu-option');
const splashScreen = document.getElementById('splash-screen');
const startMenu = document.getElementById('start-menu');
const gameUI = document.getElementById('game-ui');

// Auto transition from Splash to Menu
setTimeout(() => {
    if (gameState === 'SPLASH') {
        gameState = 'MENU';
        if(splashScreen) splashScreen.style.display = 'none';
        if(startMenu) startMenu.style.display = 'flex'; // Usually flex/block based on CSS
        console.log("Transitioned to MENU");
    }
}, 3000);

function startGame() {
    console.log("Starting Game... V14");
    gameState = 'PLAYING';
    if(startMenu) startMenu.style.display = 'none';
    if(splashScreen) splashScreen.style.display = 'none';
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

// Click handlers for menu
menuOptions.forEach(opt => {
    opt.addEventListener('click', (e) => {
        e.preventDefault();
        const action = opt.getAttribute('data-action');
        console.log("Clicked:", action);
        if (action === 'play') startGame();
        else if (action === 'settings') alert("Settings!");
    });
});

// Collision
function checkCollision(px, py, pw, ph) {
    const fx = px + pw / 2;
    const fy = py + ph - 4;
    // Map bounds
    if (fx < 30 || fx > 994 || fy < 30 || fy > 994) return true;
    
    // Fence Fence (approx rectangle in center)
    // Left: 180, Right: 840, Top: 180, Bottom: 840
    const GATE_L = 470, GATE_R = 554;
    if (fx > 180 && fx < 210 && fy > 180 && fy < 840) return true; // Left
    if (fx > 810 && fx < 840 && fy > 180 && fy < 840) return true; // Right
    if (fy > 180 && fy < 210 && fx > 180 && fx < 840) return true; // Top
    if (fy > 810 && fy < 840 && (fx < GATE_L || fx > GATE_R) && fx > 180 && fx < 840) return true; // Bottom
    
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
console.log("SCRIPT VERSION 14 - FULLY WORKING!");
