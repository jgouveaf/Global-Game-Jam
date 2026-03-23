const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const tileSize = 40;
let cols = Math.ceil(window.innerWidth / tileSize);
let rows = Math.ceil(window.innerHeight / tileSize);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.ceil(canvas.width / tileSize);
    rows = Math.ceil(canvas.height / tileSize);
    // Note: Re-generating world on resize would wipe progress, 
    // so we just ensure the drawing knows the new bounds.
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Block Types
const BLOCKS = {
    AIR: 0,
    DIRT: 1,
    GRASS: 2,
    STONE: 3,
    WOOD: 4,
    LEAVES: 5
};

const BLOCK_COLORS = {
    [BLOCKS.DIRT]: '#8b5a2b',
    [BLOCKS.GRASS]: '#32cd32',
    [BLOCKS.STONE]: '#808080',
    [BLOCKS.WOOD]: '#deb887',
    [BLOCKS.LEAVES]: '#228b22'
};

// World Data
let world = [];
function generateWorld() {
    for (let y = 0; y < rows; y++) {
        world[y] = [];
        for (let x = 0; x < cols; x++) {
            if (y < 7) {
                world[y][x] = BLOCKS.AIR;
            } else if (y === 7) {
                world[y][x] = Math.random() < 0.9 ? BLOCKS.GRASS : BLOCKS.AIR; // basic rugged surface
            } else if (y < 11) {
                world[y][x] = BLOCKS.DIRT;
            } else {
                world[y][x] = BLOCKS.STONE;
            }
        }
    }
    
    // Add a tree
    world[6][4] = BLOCKS.WOOD;
    world[5][4] = BLOCKS.WOOD;
    world[4][4] = BLOCKS.LEAVES;
    world[4][3] = BLOCKS.LEAVES;
    world[4][5] = BLOCKS.LEAVES;
    world[3][4] = BLOCKS.LEAVES;
}
generateWorld();


// Player
const player = {
    x: 400,
    y: 100,
    width: 24,
    height: 36,
    vx: 0,
    vy: 0,
    speed: 4,
    jumpForce: 8,
    gravity: 0.4,
    grounded: false,
    color: '#ff4500' 
};

// Menu System
let gameState = 'SPLASH'; // SPLASH, MENU or PLAYING
const menuOptions = document.querySelectorAll('.menu-option');
let currentMenuIndex = 0;

// Splash sequence: GODFRAME -> AGRICORP -> MENU
setTimeout(() => {
    const godframe = document.getElementById('splash-godframe');
    const agricorp = document.getElementById('splash-agricorp');
    if (godframe) godframe.style.display = 'none';
    if (agricorp) agricorp.style.display = 'flex';
    
    setTimeout(() => {
        if (agricorp) agricorp.style.display = 'none';
        gameState = 'MENU';
    }, 3000);
}, 3000);

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
    
    // Reset player position just in case
    player.x = 400;
    player.y = 100;
    player.vx = 0;
    player.vy = 0;
}

// Inputs
const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false };

let selectedBlock = BLOCKS.DIRT;

// Mouse
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
            if (action === 'play') {
                startGame();
            } else if (action === 'settings') {
                alert("Settings menu coming soon!");
            } else if (action === 'quit') {
                alert("Game Closed.");
                document.getElementById('start-menu').style.display = 'none';
            }
        }
        return; // Don't process game inputs
    }

    if (keys.hasOwnProperty(e.key) || e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        keys[e.key] = true;
    }
    if (e.key >= '1' && e.key <= '5') {
        selectedBlock = parseInt(e.key);
        updateHotbar();
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key) || e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        keys[e.key] = false;
    }
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

document.querySelectorAll('.slot').init = function() {
    document.querySelectorAll('.slot').forEach(slot => {
        slot.addEventListener('click', () => {
            selectedBlock = parseInt(slot.getAttribute('data-block'));
            updateHotbar();
        });
    });
}
document.querySelectorAll('.slot').init();
updateHotbar();

function checkCollision(x, y, w, h) {
    const startX = Math.floor(x / tileSize);
    const endX = Math.floor((x + w - 0.1) / tileSize);
    const startY = Math.floor(y / tileSize);
    const endY = Math.floor((y + h - 0.1) / tileSize);

    for (let cy = startY; cy <= endY; cy++) {
        for (let cx = startX; cx <= endX; cx++) {
            if (cy >= 0 && cy < rows && cx >= 0 && cx < cols) {
                if (world[cy][cx] !== BLOCKS.AIR) {
                    return true;
                }
            } else {
                if (cy >= rows || cx < 0 || cx >= cols) return true;
            }
        }
    }
    return false;
}

function applyPhysics() {
    // Horizontal Movement
    if (keys.a || keys.ArrowLeft) player.vx = -player.speed;
    else if (keys.d || keys.ArrowRight) player.vx = player.speed;
    else player.vx = 0;

    player.x += player.vx;
    if (checkCollision(player.x, player.y, player.width, player.height)) {
        if (player.vx > 0) {
            player.x = Math.floor((player.x + player.width) / tileSize) * tileSize - player.width;
        } else if (player.vx < 0) {
            player.x = Math.floor(player.x / tileSize) * tileSize + tileSize;
        }
        player.vx = 0;
    }

    // Vertical Movement
    player.vy += player.gravity;
    if (player.vy > 12) player.vy = 12;

    player.y += player.vy;
    player.grounded = false;

    if (checkCollision(player.x, player.y, player.width, player.height)) {
        if (player.vy > 0) { // falling
            player.y = Math.floor((player.y + player.height) / tileSize) * tileSize - player.height;
            player.grounded = true;
            player.vy = 0;
        } else if (player.vy < 0) { // jumping into ceiling
            player.y = Math.floor(player.y / tileSize) * tileSize + tileSize;
            player.vy = 0;
        }
    }

    // Jump
    if ((keys.w || keys.ArrowUp) && player.grounded) {
        player.vy = -player.jumpForce;
        player.grounded = false;
    }
}

function handleMiningAndPlacing() {
    const cx = Math.floor(mouse.x / tileSize);
    const cy = Math.floor(mouse.y / tileSize);

    const playerCenter = { x: player.x + player.width/2, y: player.y + player.height/2 };
    const maxReach = 180;
    const dist = Math.hypot((cx * tileSize + tileSize/2) - playerCenter.x, (cy * tileSize + tileSize/2) - playerCenter.y);
    
    if (cx >= 0 && cx < cols && cy >= 0 && cy < rows && dist < maxReach) {
        if (mouse.leftDown) { // Mine
            world[cy][cx] = BLOCKS.AIR;
        } else if (mouse.rightDown) { // Place
            if (world[cy][cx] === BLOCKS.AIR) {
                const rx = cx * tileSize;
                const ry = cy * tileSize;
                const rw = tileSize;
                const rh = tileSize;
                
                if (!(player.x < rx + rw && 
                      player.x + player.width > rx && 
                      player.y < ry + rh && 
                      player.y + player.height > ry)) {
                    world[cy][cx] = selectedBlock;
                }
            }
        }
    }
}

function drawWorld() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#E0F6FF");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const block = world[y][x];
            if (block !== BLOCKS.AIR) {
                ctx.fillStyle = BLOCK_COLORS[block];
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                
                ctx.fillStyle = "rgba(255,255,255,0.15)";
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, 4);
                ctx.fillRect(x * tileSize, y * tileSize, 4, tileSize);
                
                ctx.fillStyle = "rgba(0,0,0,0.15)";
                ctx.fillRect(x * tileSize, y * tileSize + tileSize - 4, tileSize, 4);
                ctx.fillRect(x * tileSize + tileSize - 4, y * tileSize, 4, tileSize);
                
                ctx.strokeStyle = "rgba(0,0,0,0.4)";
                ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
        }
    }
}

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    ctx.fillStyle = "white";
    if (player.vx >= 0) {
        ctx.fillRect(player.x + 14, player.y + 6, 6, 6);
        ctx.fillStyle = "black";
        ctx.fillRect(player.x + 16, player.y + 8, 2, 2);
    } else {
        ctx.fillRect(player.x + 4, player.y + 6, 6, 6);
        ctx.fillStyle = "black";
        ctx.fillRect(player.x + 4, player.y + 8, 2, 2);
    }
}

function drawHighlight() {
     const cx = Math.floor(mouse.x / tileSize);
     const cy = Math.floor(mouse.y / tileSize);
     const playerCenter = { x: player.x + player.width/2, y: player.y + player.height/2 };
     const dist = Math.hypot((cx * tileSize + tileSize/2) - playerCenter.x, (cy * tileSize + tileSize/2) - playerCenter.y);
     
     if (cx >= 0 && cx < cols && cy >= 0 && cy < rows && dist < 180) {
         ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
         ctx.lineWidth = 2;
         ctx.strokeRect(cx * tileSize, cy * tileSize, tileSize, tileSize);
         ctx.lineWidth = 1;
     }
}

function gameLoop() {
    if (gameState === 'PLAYING') {
        applyPhysics();
        
        if (mouse.leftDown || mouse.rightDown) {
            handleMiningAndPlacing();
        }

        drawWorld();
        drawHighlight();
        drawPlayer();
    }

    requestAnimationFrame(gameLoop);
}

// Support clicking directly on menu items
menuOptions.forEach((opt, idx) => {
    opt.addEventListener('click', () => {
        currentMenuIndex = idx;
        updateMenuUI();
        const action = opt.getAttribute('data-action');
        if (action === 'play') {
            startGame();
        } else if (action === 'settings') {
            alert("Settings menu coming soon!");
        } else if (action === 'quit') {
            alert("Game Closed.");
            document.getElementById('start-menu').style.display = 'none';
        }
    });
    
    // Update visual index purely on hover for nice UX
    opt.addEventListener('mouseenter', () => {
        currentMenuIndex = idx;
        updateMenuUI();
    });
});

gameLoop();
