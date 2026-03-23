const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();

const MAP_PX = 1024;

const mapImage = new Image();
mapImage.src = 'farm_map.png';
let mapLoaded = false;
mapImage.onload = () => { mapLoaded = true; };

// Player - Precise start and realistic hitbox
const player = {
    x: 512, // Start middle bottom path
    y: 800,
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
            else if (action === 'settings') alert("Settings coming soon!");
            else if (action === 'quit') alert("Bye!");
        }
        return;
    }
    keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// ============================================
// PRECISE PIXEL COLLISION (Tightened for the Farm Image)
// ============================================
function checkCollision(px, py, pw, ph) {
    const fx = px + pw / 2;
    const fy = py + ph - 4; // Check feet area only

    // 1. OUTER BOUNDS
    if (fx < 30 || fx > 994 || fy < 30 || fy > 994) return true;

    // 2. HOUSE (Central-Top)
    // House area: x: 380 to 640, y: < 220
    if (fx > 380 && fx < 640 && fy < 230) return true;

    // 3. POND (Bottom-Left)
    // Pond area: x: < 250, y: > 800
    if (fx < 250 && fy > 800) return true;

    // 4. FENCES (Perimeter)
    // Left fence line: x offset 60px
    if (fx < 100 && fy < 900) return true;
    // Right fence line: x offset 940px
    if (fx > 940 && fy < 900) return true;
    // Top fence line (excluding gap for house)
    if (fy < 100 && (fx < 380 || fx > 640)) return true;
    // Bottom fence line (excluding gate at x: 480-550)
    if (fy > 930 && (fx < 480 || fx > 550)) return true;

    // 5. DECORATIONS (Well, Trees at corners)
    // Well: right side mid
    if (fx > 840 && fx < 920 && fy > 440 && fy < 540) return true;
    // Trees at corners
    if (fx < 120 && fy < 120) return true; // Top left
    if (fx > 900 && fy < 120) return true; // Top right
    if (fx > 900 && fy > 900) return true; // Bottom right
    if (fx < 120 && fy > 900) return true; // Bottom left corner

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
    
    if (!checkCollision(player.x + vx, player.y, player.width, player.height)) {
        player.x += vx;
    }
    
    if (!checkCollision(player.x, player.y + vy, player.width, player.height)) {
        player.y += vy;
    }

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

    ctx.fillStyle = '#800020';
    ctx.fillRect(px + 4, py + 16, 16, 16);
    ctx.fillStyle = '#111';
    ctx.fillRect(px + 4, py + 32, 6, 6);
    ctx.fillRect(px + 14, py + 32, 6, 6);
    ctx.fillStyle = '#f1c27d';
    ctx.fillRect(px + 2, py + 2, 20, 14);

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

menuOptions.forEach((opt, idx) => {
    opt.addEventListener('click', () => {
        currentMenuIndex = idx;
        const action = opt.getAttribute('data-action');
        if (action === 'play') startGame();
        else if (action === 'settings') alert("Settings!");
        else if (action === 'quit') alert("Bye!");
    });
});

gameLoop();
