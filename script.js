const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();

const MAP_PX = 1024;

const mapImage = new Image();
mapImage.src = 'farm_map_final.png?v=' + new Date().getTime();
let mapLoaded = false;
mapImage.onload = () => { mapLoaded = true; };

// Player - Precise collision hitbox
const player = {
    x: 512, // Start middle bottom (near the gate)
    y: 850,
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
        }
        return;
    }
    keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// ============================================
// PRECISE FENCE COLLISION (based on a 600x600 yard in center)
// ============================================
function checkCollision(px, py, pw, ph) {
    const fx = px + pw / 2;
    const fy = py + ph - 4; // Check feet area only

    // OUTER MAP BOUNDS
    if (fx < 20 || fx > 1004 || fy < 20 || fy > 1004) return true;

    // FENCE ENCLOSURE (approx coordinates for the central yard)
    // Yard is from x: 212-812, y: 212-812
    const fenceOffset = 15; // Tightness
    
    // LEFT Fence line
    if (fx > 200 && fx < 232 && fy > 200 && fy < 820) return true;
    
    // RIGHT Fence line
    if (fx > 792 && fx < 824 && fy > 200 && fy < 820) return true;
    
    // TOP Fence line
    if (fy > 200 && fy < 232 && fx > 200 && fx < 824) return true;
    
    // BOTTOM Fence line (with GATE at x: 480-544)
    if (fy > 792 && fy < 824 && (fx < 480 || fx > 544) && fx > 200 && fx < 824) return true;

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

    camera.x = player.x + player.width/2 - canvas.width/2;
    camera.y = player.y + player.height/2 - canvas.height/2;
    
    camera.x = Math.max(0, Math.min(camera.x, MAP_PX - canvas.width));
    camera.y = Math.max(0, Math.min(camera.y, MAP_PX - canvas.height));
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
    });
});

gameLoop();
