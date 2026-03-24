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
mapImage.onload = () => { mapLoaded = true; };

const playerImage = new Image();
playerImage.src = 'player_sprite.png';
let playerLoaded = false;
playerImage.onload = () => { playerLoaded = true; };

// Player - Precise collision and sprite
const player = {
    x: 512,
    y: 900,
    width: 32,
    height: 48,
    speed: 5,
    dir: 'down'
};

window.addEventListener('resize', resizeCanvas);

// Menu System
let gameState = 'MENU';
const startMenu = document.getElementById('start-menu');
const gameUI = document.getElementById('game-ui');

function startGame() {
    gameState = 'PLAYING';
    if(startMenu) startMenu.style.display = 'none';
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

const playBtn = document.querySelector('[data-action="play"]');
if (playBtn) playBtn.onclick = startGame;

// Collision Rules (Perimeter of the Yard)
function checkCollision(px, py, pw, ph) {
    const fx = px + pw / 2;
    const fy = py + ph - 4; // Feet only

    if (fx < 30 || fx > 994 || fy < 30 || fy > 994) return true;

    // FENCE BOUNDS (based on the map image)
    const L = 160, R = 860, T = 160, B = 860;
    const G_L = 475, G_R = 548;

    // We only block the "thick" part of the fence
    if (fx >= L && fx <= L+32 && fy >= T && fy <= B) return true; // Left
    if (fx >= R-32 && fx <= R && fy >= T && fy <= B) return true; // Right
    if (fy >= T && fy <= T+32 && fx >= L && fx <= R) return true; // Top
    if (fy >= B-20 && fy <= B && (fx < G_L || fx > G_R) && fx >= L && fx <= R) return true; // Bottom (gate)

    return false;
}

function applyPhysics() {
    let vx = 0; let vy = 0;
    if (keys['a'] || keys['arrowleft']) { vx = -player.speed; player.dir = 'left'; }
    if (keys['d'] || keys['arrowright']) { vx = player.speed; player.dir = 'right'; }
    if (keys['w'] || keys['arrowup']) { vy = -player.speed; player.dir = 'up'; }
    if (keys['s'] || keys['arrowdown']) { vy = player.speed; player.dir = 'down'; }
    
    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
    
    if (!checkCollision(player.x + vx, player.y, player.width, player.height)) player.x += vx;
    if (!checkCollision(player.x, player.y + vy, player.width, player.height)) player.y += vy;

    // Smooth Camera
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

        // 1. DRAW BASE MAP
        if (mapLoaded) ctx.drawImage(mapImage, 0, 0, MAP_PX, MAP_PX);

        // 2. DRAW PLAYER
        const px = Math.floor(player.x);
        const py = Math.floor(player.y);
        
        // Simple Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(px + 16, py + 44, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        if (playerLoaded) {
            ctx.drawImage(playerImage, px, py, player.width, player.height);
        } else {
            ctx.fillStyle = '#800020';
            ctx.fillRect(px + 4, py + 16, 24, 24);
        }

        // 3. DEPTH SORTING (Draw fences OVER player if player is "behind" them)
        // If player is north of the top fence, or west of the left fence, etc.
        // But the most common is the top fence.
        const L=160, R=860, T=160, B=860;
        
        // If player is "behind" the top fence (y < 210 approx)
        if (player.y + player.height < T + 40) {
            // Draw ONLY the top fence part from the map image again
            ctx.drawImage(mapImage, L, T, R-L, 40, L, T, R-L, 40);
        }
        
        // If player is behind bottom fence (y < 860) but we usually want player BEHIND bottom fence when Y is less than fence Y.
        // Actually, player is behind if player.y + height is less than object.y.
        
        // Simple heuristic: Redraw all fence layers on top if player Y is smaller than them.
        if (player.y + player.height < T + 60) ctx.drawImage(mapImage, L, T, R-L, 60, L, T, R-L, 60);
        if (player.y + player.height < B + 20 && player.y + player.height > B - 40) {
             // Redraw bottom fence on top
             ctx.drawImage(mapImage, L, B-20, R-L, 60, L, B-20, R-L, 60);
        }

        ctx.restore();
    }
    requestAnimationFrame(draw);
}
resizeCanvas();
draw();
console.log("SCRIPT V16 - Depth Sorting & Sprite Ready!");
