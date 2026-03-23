const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();

// ============================================
// MAP IMAGE APPROACH - Uses a single image as the entire map
// ============================================
const MAP_PX = 1024; // Map image size in pixels
const GRID = 16;     // 16x16 invisible collision grid
const CELL = MAP_PX / GRID; // 64px per cell

const mapImage = new Image();
mapImage.src = 'farm_map.png';
let mapLoaded = false;
mapImage.onload = () => { mapLoaded = true; };

// ============================================
// COLLISION MAP (16x16 grid overlay on the image)
// 0 = walkable, 1 = solid
// Based on the farm layout:
// Row 0-1: Trees/grass border
// Row 2-3: House area top / fences
// Row 4-5: House center
// Row 6: Path below house
// Row 7-8: Farm patches
// Row 9-10: Farm patches / lake starts
// Row 11-12: Lake / crops
// Row 13-14: Lake bottom / trees
// Row 15: Border trees
// ============================================
const collisionMap = [
    // 0  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15
    [ 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], // 0 - trees top
    [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 1 - grass
    [ 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1], // 2 - fence top + house
    [ 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1], // 3 - house
    [ 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1], // 4 - house + pig pen
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 5 - yard below house
    [ 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1], // 6 - fence + path
    [ 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1], // 7 - dirt patch left
    [ 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1], // 8 - dirt patch + crops
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 9 - path
    [ 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], // 10 - lake top
    [ 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 11 - lake + crops
    [ 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 12 - lake bottom
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], // 13 - grass
    [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 14 - fence bottom
    [ 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], // 15 - border trees
];

// Player
const player = {
    x: 7.5 * CELL, // Center of the path
    y: 9 * CELL,
    width: 28,
    height: 40,
    speed: 4,
    dir: 'down'
};

const camera = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height
};

window.addEventListener('resize', () => {
    resizeCanvas();
    camera.width = canvas.width;
    camera.height = canvas.height;
});

// Menu System
let gameState = 'SPLASH';
const menuOptions = document.querySelectorAll('.menu-option');
let currentMenuIndex = 0;

setTimeout(() => {
    if (gameState === 'SPLASH') {
        gameState = 'MENU';
    }
}, 3500);

function updateMenuUI() {
    menuOptions.forEach((opt, idx) => {
        if (idx === currentMenuIndex) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });
}

function startGame() {
    gameState = 'PLAYING';
    document.getElementById('start-menu').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';
}

// Inputs
const keys = {};

window.addEventListener('keydown', (e) => {
    if (gameState === 'MENU') {
        if (e.key === 'ArrowUp' || e.key === 'w') {
            currentMenuIndex = (currentMenuIndex > 0) ? currentMenuIndex - 1 : menuOptions.length - 1;
            updateMenuUI();
        } else if (e.key === 'ArrowDown' || e.key === 's') {
            currentMenuIndex = (currentMenuIndex < menuOptions.length - 1) ? currentMenuIndex + 1 : 0;
            updateMenuUI();
        } else if (e.key === 'Enter') {
            const action = menuOptions[currentMenuIndex].getAttribute('data-action');
            if (action === 'play') startGame();
            else if (action === 'settings') alert("Settings menu coming soon!");
            else if (action === 'quit') alert("Game Closed.");
        }
        return;
    }
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('contextmenu', e => e.preventDefault());

// Collision Check
function checkCollision(px, py, pw, ph) {
    // Check all four corners of the player hitbox
    const points = [
        { x: px + 4, y: py + ph * 0.5 },       // bottom-left (feet area)
        { x: px + pw - 4, y: py + ph * 0.5 },   // bottom-right
        { x: px + 4, y: py + ph - 2 },           // very bottom-left
        { x: px + pw - 4, y: py + ph - 2 },      // very bottom-right
    ];
    
    for (const p of points) {
        const cx = Math.floor(p.x / CELL);
        const cy = Math.floor(p.y / CELL);
        
        if (cx < 0 || cx >= GRID || cy < 0 || cy >= GRID) return true;
        if (collisionMap[cy][cx] === 1) return true;
    }
    return false;
}

function applyPhysics() {
    let vx = 0; let vy = 0;
    if (keys['a'] || keys['arrowleft']) { vx = -player.speed; player.dir = 'left'; }
    if (keys['d'] || keys['arrowright']) { vx = player.speed; player.dir = 'right'; }
    if (keys['w'] || keys['arrowup']) { vy = -player.speed; player.dir = 'up'; }
    if (keys['s'] || keys['arrowdown']) { vy = player.speed; player.dir = 'down'; }
    
    if (vx !== 0 && vy !== 0) {
        vx *= 0.707;
        vy *= 0.707;
    }
    
    player.x += vx;
    if (checkCollision(player.x, player.y, player.width, player.height)) player.x -= vx;
    
    player.y += vy;
    if (checkCollision(player.x, player.y, player.width, player.height)) player.y -= vy;

    player.x = Math.max(0, Math.min(player.x, MAP_PX - player.width));
    player.y = Math.max(0, Math.min(player.y, MAP_PX - player.height));
    
    camera.x = player.x + player.width / 2 - camera.width / 2;
    camera.y = player.y + player.height / 2 - camera.height / 2;
    
    camera.x = Math.max(0, Math.min(camera.x, MAP_PX - camera.width));
    camera.y = Math.max(0, Math.min(camera.y, MAP_PX - camera.height));
}

function drawWorld() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));

    if (mapLoaded) {
        ctx.imageSmoothingEnabled = false; // Keep pixel art crisp
        ctx.drawImage(mapImage, 0, 0, MAP_PX, MAP_PX);
    }
}

function drawPlayer() {
    const px = Math.floor(player.x);
    const py = Math.floor(player.y);
    
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(px + 14, py + 38, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (Shirt)
    ctx.fillStyle = '#800020';
    ctx.fillRect(px + 4, py + 18, 20, 16);
    
    // Legs
    ctx.fillStyle = '#222';
    ctx.fillRect(px + 6, py + 34, 6, 6);
    ctx.fillRect(px + 16, py + 34, 6, 6);
    
    // Head/Skin
    ctx.fillStyle = '#f1c27d';
    ctx.fillRect(px + 4, py + 2, 20, 18);

    // Hair
    ctx.fillStyle = '#4a3018';
    ctx.fillRect(px + 2, py, 24, 6);
    if (player.dir === 'left') {
        ctx.fillRect(px + 2, py + 6, 8, 12);
        ctx.fillStyle = '#000';
        ctx.fillRect(px + 8, py + 10, 3, 3);
    } else if (player.dir === 'right') {
        ctx.fillRect(px + 18, py + 6, 8, 12);
        ctx.fillStyle = '#000';
        ctx.fillRect(px + 17, py + 10, 3, 3);
    } else if (player.dir === 'up') {
        ctx.fillRect(px + 2, py + 6, 24, 12);
    } else { // down
        ctx.fillRect(px + 2, py + 6, 6, 12);
        ctx.fillRect(px + 20, py + 6, 6, 12);
        ctx.fillStyle = '#000';
        ctx.fillRect(px + 8, py + 10, 3, 3);
        ctx.fillRect(px + 17, py + 10, 3, 3);
    }
}

function gameLoop() {
    if (gameState === 'PLAYING') {
        applyPhysics();
        
        drawWorld();
        drawPlayer();
        
        ctx.restore();
    }
    requestAnimationFrame(gameLoop);
}

// Support clicking directly on menu items
menuOptions.forEach((opt, idx) => {
    opt.addEventListener('click', () => {
        currentMenuIndex = idx;
        updateMenuUI();
        const action = opt.getAttribute('data-action');
        if (action === 'play') startGame();
        else if (action === 'settings') alert("Settings menu coming soon!");
        else if (action === 'quit') alert("Game Closed.");
    });
    opt.addEventListener('mouseenter', () => {
        currentMenuIndex = idx;
        updateMenuUI();
    });
});

gameLoop();
