const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();

const tileSize = 64; 
const WORLD_COLS = 32;
const WORLD_ROWS = 32;

// Tileset support
const tileset = new Image();
tileset.src = 'tileset.jpg';
let tilesetLoaded = false;
tileset.onload = () => { tilesetLoaded = true; };

// Block Types mapped to tileset 1x5 order
const BLOCKS = {
    GRASS: 0,
    DIRT: 1,
    WATER: 2,
    STONE: 3,
    CROPS: 4,
    FENCE: 5,
    HOUSE: 6,
    PATH: 7,
    WELL: 8
};

const BLOCK_COLORS = {
    [BLOCKS.DIRT]: '#8b5a2b',
    [BLOCKS.GRASS]: '#32cd32',
    [BLOCKS.STONE]: '#808080',
    [BLOCKS.CROPS]: '#ffaa00',
    [BLOCKS.WATER]: '#1e90ff',
    [BLOCKS.FENCE]: '#4b2e1b',
    [BLOCKS.HOUSE]: '#a0522d',
    [BLOCKS.PATH]: '#c2b280',
    [BLOCKS.WELL]: '#555'
};

// Solid: Water, Stone, Fence, House, Well
const SOLID_BLOCKS = [BLOCKS.STONE, BLOCKS.WATER, BLOCKS.FENCE, BLOCKS.HOUSE, BLOCKS.WELL];

// World Data
let world = [];
function generateWorld() {
    for (let y = 0; y < WORLD_ROWS; y++) {
        world[y] = [];
        for (let x = 0; x < WORLD_COLS; x++) {
            // Default: Grass
            world[y][x] = BLOCKS.GRASS;
            
            // LAKE (Bottom Left)
            if (x >= 1 && x <= 7 && y >= 18 && y <= 26) world[y][x] = BLOCKS.WATER;
            
            // HOUSE (Top Center)
            if (x >= 12 && x <= 20 && y >= 3 && y <= 9) world[y][x] = BLOCKS.HOUSE;
            
            // FENCES (Perimeter of the main yard)
            if ((y === 2 || y === 28) && x >= 4 && x <= 27) world[y][x] = BLOCKS.FENCE;
            if ((x === 4 || x === 27) && y >= 2 && y <= 28) world[y][x] = BLOCKS.FENCE;
            
            // FARM PATCHES (Center)
            // Left Patch (Empty/Tillable)
            if (x >= 8 && x <= 13 && y >= 14 && y <= 23) world[y][x] = BLOCKS.DIRT;
            // Right Patch (Crops)
            if (x >= 17 && x <= 22 && y >= 14 && y <= 23) world[y][x] = BLOCKS.CROPS;
            
            // PATHS
            if (x === 15 && y > 9 && y < 28) world[y][x] = BLOCKS.PATH; // vertical
            if (y === 12 && x >= 8 && x <= 22) world[y][x] = BLOCKS.PATH; // horizontal top of patches
            if (y === 25 && x >= 8 && x <= 22) world[y][x] = BLOCKS.PATH; // horizontal bottom
            
            // WELL (Right side)
            if (x >= 24 && x <= 26 && y >= 14 && y <= 16) world[y][x] = BLOCKS.WELL;
        }
    }
}
generateWorld();


// Player
const player = {
    x: 15 * tileSize,
    y: 11 * tileSize,
    width: 32,
    height: 48,
    vx: 0,
    vy: 0,
    speed: 6,
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
let gameState = 'SPLASH'; // SPLASH, MENU or PLAYING
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
const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false };
let selectedBlock = BLOCKS.DIRT;
const mouse = { x: 0, y: 0, leftDown: false, rightDown: false };

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
    if (keys.hasOwnProperty(e.key) || e.key.startsWith('Arrow')) keys[e.key] = true;
    if (e.key >= '1' && e.key <= '5') {
        selectedBlock = parseInt(e.key);
        updateHotbar();
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key) || e.key.startsWith('Arrow')) keys[e.key] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', (e) => {
    if (gameState !== 'PLAYING') return;
    if (e.button === 0) mouse.leftDown = true;
    if (e.button === 2) mouse.rightDown = true;
    handleMiningAndPlacing();
    e.preventDefault();
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.leftDown = false;
    if (e.button === 2) mouse.rightDown = false;
});
canvas.addEventListener('contextmenu', e => e.preventDefault());

function updateHotbar() {
    document.querySelectorAll('.slot').forEach(slot => {
        slot.classList.remove('selected');
        if (parseInt(slot.getAttribute('data-block')) === selectedBlock) {
            slot.classList.add('selected');
        }
    });
}
document.querySelectorAll('.slot').forEach(slot => {
    slot.addEventListener('click', () => {
        selectedBlock = parseInt(slot.getAttribute('data-block'));
        updateHotbar();
    });
});
updateHotbar();

function checkCollision(x, y, w, h) {
    const startX = Math.floor(x / tileSize);
    const endX = Math.floor((x + w - 0.1) / tileSize);
    const startY = Math.floor(y / tileSize);
    const endY = Math.floor((y + h - 0.1) / tileSize);

    for (let cy = startY; cy <= endY; cy++) {
        for (let cx = startX; cx <= endX; cx++) {
            if (cy >= 0 && cy < WORLD_ROWS && cx >= 0 && cx < WORLD_COLS) {
                if (SOLID_BLOCKS.includes(world[cy][cx])) return true;
            } else {
                return true; // Map bounds are solid
            }
        }
    }
    return false;
}

function applyPhysics() {
    let vx = 0; let vy = 0;
    if (keys.a || keys.ArrowLeft) { vx = -player.speed; player.dir = 'left'; }
    if (keys.d || keys.ArrowRight) { vx = player.speed; player.dir = 'right'; }
    if (keys.w || keys.ArrowUp) { vy = -player.speed; player.dir = 'up'; }
    if (keys.s || keys.ArrowDown) { vy = player.speed; player.dir = 'down'; }
    
    // Normalize diagonal speed
    if (vx !== 0 && vy !== 0) {
        vx *= 0.707;
        vy *= 0.707;
    }
    
    player.x += vx;
    if (checkCollision(player.x, player.y, player.width, player.height)) player.x -= vx;
    
    player.y += vy;
    if (checkCollision(player.x, player.y, player.width, player.height)) player.y -= vy;

    // Boundary constraint
    player.x = Math.max(0, Math.min(player.x, WORLD_COLS * tileSize - player.width));
    player.y = Math.max(0, Math.min(player.y, WORLD_ROWS * tileSize - player.height));
    
    // Update Camera
    camera.x = player.x + player.width/2 - camera.width/2;
    camera.y = player.y + player.height/2 - camera.height/2;
    
    // Clamp Camera to world bounds
    camera.x = Math.max(0, Math.min(camera.x, WORLD_COLS * tileSize - camera.width));
    camera.y = Math.max(0, Math.min(camera.y, WORLD_ROWS * tileSize - camera.height));
}

function handleMiningAndPlacing() {
    // Disabled functionality as requested: destroy and place are disabled.
    return;
}

function drawWorld() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    const startCol = Math.max(0, Math.floor(camera.x / tileSize));
    const endCol = Math.min(WORLD_COLS, startCol + Math.ceil(camera.width / tileSize) + 1);
    const startRow = Math.max(0, Math.floor(camera.y / tileSize));
    const endRow = Math.min(WORLD_ROWS, startRow + Math.ceil(camera.height / tileSize) + 1);

    for (let y = startRow; y < endRow; y++) {
        for (let x = startCol; x < endCol; x++) {
            const block = world[y][x];
            
            if (tilesetLoaded && block < 5) {
                 // Slicing the tileset (1x5 layout)
                 const sourceW = tileset.width / 5;
                 const sourceH = tileset.height;
                 ctx.drawImage(
                    tileset,
                    block * sourceW, 0, sourceW, sourceH,
                    x * tileSize, y * tileSize, tileSize, tileSize
                 );
            } else {
                // Fallback for new tiles or while loading
                ctx.fillStyle = BLOCK_COLORS[block] || "#000";
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
        }
    }
}

function drawPlayer() {
    // Draw player with top-down aesthetic
    const px = player.x;
    const py = player.y;
    
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 46, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (Shirt)
    ctx.fillStyle = '#800020'; // Burgundy
    ctx.fillRect(px + 4, py + 20, 24, 20);
    
    // Legs
    ctx.fillStyle = '#111';
    ctx.fillRect(px + 6, py + 40, 8, 8); // left leg
    ctx.fillRect(px + 18, py + 40, 8, 8); // right leg
    
    // Head/Skin
    ctx.fillStyle = '#f1c27d';
    ctx.fillRect(px + 2, py + 2, 28, 22);

    // Hair
    ctx.fillStyle = '#4a3018';
    ctx.fillRect(px + 0, py, 32, 8); // top
    if (player.dir === 'left') {
        ctx.fillRect(px + 0, py + 8, 12, 14); // side
        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(px + 6, py + 12, 4, 4);
    } else if (player.dir === 'right') {
        ctx.fillRect(px + 20, py + 8, 12, 14); // side
        ctx.fillStyle = '#000';
        ctx.fillRect(px + 22, py + 12, 4, 4);
    } else if (player.dir === 'up') {
        ctx.fillRect(px + 0, py + 8, 32, 14); // full back of head
    } else { // down
        ctx.fillRect(px + 0, py + 8, 8, 14); // left side
        ctx.fillRect(px + 24, py + 8, 8, 14); // right side
        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(px + 8, py + 12, 4, 4);
        ctx.fillRect(px + 20, py + 12, 4, 4);
    }
}

function drawHighlight() {
     const worldMouseX = mouse.x + camera.x;
     const worldMouseY = mouse.y + camera.y;
     const cx = Math.floor(worldMouseX / tileSize);
     const cy = Math.floor(worldMouseY / tileSize);
     
     const playerCenter = { x: player.x + player.width/2, y: player.y + player.height/2 };
     const maxReach = 200;
     const dist = Math.hypot((cx * tileSize + tileSize/2) - playerCenter.x, (cy * tileSize + tileSize/2) - playerCenter.y);
     
     if (cx >= 0 && cx < WORLD_COLS && cy >= 0 && cy < WORLD_ROWS && dist < maxReach) {
         ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
         ctx.lineWidth = 2;
         ctx.strokeRect(cx * tileSize, cy * tileSize, tileSize, tileSize);
         ctx.lineWidth = 1;
     }
}

function gameLoop() {
    if (gameState === 'PLAYING') {
        applyPhysics();
        if (mouse.leftDown || mouse.rightDown) handleMiningAndPlacing();
        
        drawWorld();
        drawHighlight();
        drawPlayer();
        
        ctx.restore(); // restore from camera translation
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
