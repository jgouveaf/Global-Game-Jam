/**
 * AgriCorp Game Logic
 * Handle map generation, tileset rendering and character movement.
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const cursorInfo = document.getElementById('cursor-info');

// Constants
const TILE_SIZE = 64; // Visual size on screen
const MAP_SIZE = 20;  // 20x20 Tiles
const FPS = 60;

// Tile Definitions
const TILE = {
    GRASS: 0,
    DIRT: 1,
    WATER: 2,
    STONE: 3,
    CROPS: 4
};

// Game State
let tilesetLoaded = false;
const tileset = new Image();
tileset.src = 'tileset.jpg';

const player = {
    x: 1, // Tile units
    y: 1,
    targetX: 1,
    targetY: 1,
    speed: 0.15,
    moving: false,
    color: '#00f2ff'
};

const inventory = {
    slots: [
        { type: 'SEED', name: 'Trigo', emoji: '🌾', count: 12 },
        { type: 'SEED', name: 'Milho', emoji: '🌽', count: 8 },
        { type: 'SEED', name: 'Cenoura', emoji: '🥕', count: 5 },
        { type: 'UPGRADE', name: 'Regador Rápido', emoji: '⚡', count: 1, active: false },
        { type: 'TOOL', name: 'Pá', emoji: '🧹', count: 1 },
        { type: 'EMPTY' },
        { type: 'EMPTY' },
        { type: 'EMPTY' },
        { type: 'EMPTY' },
        { type: 'EMPTY' }
    ],
    selectedSlot: 0,
    activeUpgrades: []
};

const map = [];
const keys = {};

// Handle Input
window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    
    // Quick switch items with numbers
    if (e.key >= '1' && e.key <= '9') {
        inventory.selectedSlot = parseInt(e.key) - 1;
        renderInventory();
    } else if (e.key === '0') {
        inventory.selectedSlot = 9;
        renderInventory();
    }
});
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// Init
tileset.onload = () => {
    tilesetLoaded = true;
    resize();
    generateMap();
    requestAnimationFrame(gameLoop);
};

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);

function generateMap() {
    for (let y = 0; y < MAP_SIZE; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_SIZE; x++) {
            // Perlin-like simple noise map (basic)
            const d = Math.sqrt(Math.pow(x - MAP_SIZE/2, 2) + Math.pow(y - MAP_SIZE/2, 2));
            const noise = Math.random();
            
            if (d > MAP_SIZE / 2.2) {
                map[y][x] = TILE.WATER; // Ocean borders
            } else if (noise < 0.2) {
                map[y][x] = TILE.STONE; // Random rocks
            } else if (noise < 0.4) {
                map[y][x] = TILE.DIRT; // Dirt patches
            } else {
                map[y][x] = TILE.GRASS; // Open grass
            }
        }
    }
    // Find a valid starting spot for the player
    for (let y = 1; y < MAP_SIZE-1; y++) {
        for (let x = 1; x < MAP_SIZE-1; x++) {
            if (isWalkable(x, y)) {
                player.x = x;
                player.y = y;
                player.targetX = x;
                player.targetY = y;
                return;
            }
        }
    }
}

function isWalkable(tx, ty) {
    if (tx < 0 || tx >= MAP_SIZE || ty < 0 || ty >= MAP_SIZE) return false;
    const tileType = map[ty][tx];
    // Rule: Water and Stone are NOT walkable
    return tileType !== TILE.WATER && tileType !== TILE.STONE;
}

function update() {
    if (!player.moving) {
        let dx = 0, dy = 0;
        if (keys['w'] || keys['arrowup']) dy = -1;
        else if (keys['s'] || keys['arrowdown']) dy = 1;
        else if (keys['a'] || keys['arrowleft']) dx = -1;
        else if (keys['d'] || keys['arrowright']) dx = 1;

        if (dx !== 0 || dy !== 0) {
            const nextX = player.x + dx;
            const nextY = player.y + dy;
            if (isWalkable(nextX, nextY)) {
                player.targetX = nextX;
                player.targetY = nextY;
                player.moving = true;
            }
        }
    }

    if (player.moving) {
        const dx = player.targetX - player.x;
        const dy = player.targetY - player.y;
        
        if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) {
            player.x = player.targetX;
            player.y = player.targetY;
            player.moving = false;
        } else {
            player.x += dx * player.speed;
            player.y += dy * player.speed;
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate Offsets to Center Player
    const offsetX = canvas.width / 2 - player.x * TILE_SIZE;
    const offsetY = canvas.height / 2 - player.y * TILE_SIZE;

    // Draw Map
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const tileIdx = map[y][x];
            
            // Slice the 1x5 tileset
            // Assuming the image width x height. Width is 5 * TILE_HEIGHT
            const sourceW = tileset.width / 5;
            const sourceH = tileset.height;
            
            ctx.drawImage(
                tileset,
                tileIdx * sourceW, 0, sourceW, sourceH, // Source
                offsetX + x * TILE_SIZE, offsetY + y * TILE_SIZE, TILE_SIZE, TILE_SIZE // Dest
            );
        }
    }

    // Draw Player (Simple Circle for now)
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(
        offsetX + player.x * TILE_SIZE + TILE_SIZE / 2, 
        offsetY + player.y * TILE_SIZE + TILE_SIZE / 2, 
        15, 0, Math.PI * 2
    );
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Crosshair over player
    ctx.lineWidth = 1;
    ctx.strokeRect(
        offsetX + player.x * TILE_SIZE,
        offsetY + player.y * TILE_SIZE,
        TILE_SIZE, TILE_SIZE
    );
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Mouse Cursor Indicator
window.addEventListener('mousemove', (e) => {
    const offsetX = canvas.width / 2 - player.x * TILE_SIZE;
    const offsetY = canvas.height / 2 - player.y * TILE_SIZE;
    
    const worldX = Math.floor((e.clientX - offsetX) / TILE_SIZE);
    const worldY = Math.floor((e.clientY - offsetY) / TILE_SIZE);
    
    cursorInfo.style.left = `${offsetX + worldX * TILE_SIZE}px`;
    cursorInfo.style.top = `${offsetY + worldY * TILE_SIZE}px`;
});
// UI Rendering Functions
function renderInventory() {
    const bar = document.getElementById('inventory-hotbar');
    bar.innerHTML = '';
    
    inventory.slots.forEach((slot, index) => {
        const div = document.createElement('div');
        div.className = `inv-slot ${inventory.selectedSlot === index ? 'active' : ''}`;
        
        // Slot number (1, 2, ..., 0)
        const slotNum = index === 9 ? 0 : index + 1;
        div.innerHTML = `<span class="slot-number">${slotNum}</span>`;
        
        if (slot.type !== 'EMPTY') {
            div.innerHTML += `
                <span class="item-icon">${slot.emoji}</span>
                <span class="item-count">${slot.count}</span>
            `;
        }
        
        div.onclick = () => {
            inventory.selectedSlot = index;
            renderInventory();
        };
        
        bar.appendChild(div);
    });
}

function addUpgrade(upgrade) {
    if (!inventory.activeUpgrades.find(u => u.name === upgrade.name)) {
        inventory.activeUpgrades.push(upgrade);
        renderUpgrades();
        
        // Example logic: tool upgrades could last X seconds
        setTimeout(() => {
            inventory.activeUpgrades = inventory.activeUpgrades.filter(u => u.name !== upgrade.name);
            renderUpgrades();
        }, 15000); // 15s duration
    }
}

function renderUpgrades() {
    const list = document.getElementById('active-upgrades');
    list.innerHTML = '';
    
    inventory.activeUpgrades.forEach(u => {
        const div = document.createElement('div');
        div.className = 'upgrade-pill';
        div.innerHTML = `<span>${u.emoji}</span> <strong>${u.name}</strong>`;
        list.appendChild(div);
    });
}

// Inicializa a UI
renderInventory();
renderUpgrades();
