const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();

const MAP_PX = 1024;
const CELL = 32; // Precision grid (32x32 for 1024px)

const mapImage = new Image();
mapImage.src = 'farm_map.png';
let mapLoaded = false;
mapImage.onload = () => { mapLoaded = true; };

// Player - Realistic speed and hitbox
const player = {
    x: 18 * CELL, // Start on the path!
    y: 28 * CELL,
    width: 24,
    height: 38,
    speed: 5,
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

// Precise Collision Rules based on the Map Reference
function checkCollision(px, py, pw, ph) {
    // Check points near the feet/hitbox - 32px grid is 32x32 cells
    const feetX_L = (px + 4);
    const feetX_R = (px + pw - 4);
    const feetY = (py + ph - 2);
    
    // Check multiple collision points for precision
    const points = [
        { x: feetX_L, y: feetY },
        { x: feetX_R, y: feetY },
        { x: (feetX_L + feetX_R)/2, y: feetY }
    ];

    for(let pt of points) {
        const cx = Math.floor(pt.x / CELL);
        const cy = Math.floor(pt.y / CELL);

        // Map Bounds
        if (cx < 0 || cx >= 32 || cy < 0 || cy >= 32) return true;

        // HOUSE (Center Top) - approx x: 10-22, y: 1-9
        if (cx >= 10 && cx <= 22 && cy >= 1 && cy <= 9) return true;

        // LAKE (Bottom Left) - approx x: 0-9, y: 20-28
        if (cx >= 0 && cx <= 9 && cy >= 20 && cy <= 28) return true;

        // FENCES
        // Top perimeter
        if (cy === 3 && (cx < 10 || cx > 22)) return true;
        // Side perimeters
        if (cx === 6 && (cy > 3 && cy < 28)) return true;
        if (cx === 27 && (cy > 3 && cy < 28)) return true;
        // Bottom perimeter (gate at 18)
        if (cy === 28 && (cx < 17 || cx > 19) && (cx > 6 && cx < 27)) return true;

        // WELL
        if (cx >= 24 && cx <= 26 && cy >= 14 && cy <= 16) return true;

        // TREES (Corners)
        if (cx < 4 && cy < 4) return true;
        if (cx > 28 && cy < 4) return true;
        if (cx < 4 && cy > 28) return true;
        if (cx > 28 && cy > 28) return true;
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

    // Camera follow
    camera.x = player.x + player.width/2 - camera.width/2;
    camera.y = player.y + player.height/2 - camera.height/2;
    
    camera.x = Math.max(0, Math.min(camera.x, MAP_PX - camera.width));
    camera.y = Math.max(0, Math.min(camera.y, MAP_PX - camera.height));
}

function drawWorld() {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));

    if (mapLoaded) {
        ctx.drawImage(mapImage, 0, 0, MAP_PX, MAP_PX);
    }
}

function drawPlayer() {
    const px = Math.floor(player.x);
    const py = Math.floor(player.y);
    
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(px + 12, py + 36, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#800020';
    ctx.fillRect(px + 4, py + 16, 16, 16);
    
    // Legs
    ctx.fillStyle = '#111';
    ctx.fillRect(px + 4, py + 32, 6, 6);
    ctx.fillRect(px + 14, py + 32, 6, 6);
    
    // Head
    ctx.fillStyle = '#f1c27d';
    ctx.fillRect(px + 2, py + 2, 20, 14);

    // Eyes/Hair based on direction
    ctx.fillStyle = '#4a3018';
    ctx.fillRect(px + 0, py, 24, 4);
    
    ctx.fillStyle = '#000';
    if(player.dir === 'down') {
        ctx.fillRect(px + 6, py + 8, 3, 3);
        ctx.fillRect(px + 15, py + 8, 3, 3);
    } else if(player.dir === 'left') {
        ctx.fillRect(px + 4, py + 8, 3, 3);
    } else if(player.dir === 'right') {
        ctx.fillRect(px + 17, py + 8, 3, 3);
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

// Menu handling
menuOptions.forEach((opt, idx) => {
    opt.addEventListener('click', () => {
        currentMenuIndex = idx;
        const action = opt.getAttribute('data-action');
        if (action === 'play') startGame();
        else if (action === 'settings') alert("Settings coming soon!");
        else if (action === 'quit') alert("Bye!");
    });
});

gameLoop();
