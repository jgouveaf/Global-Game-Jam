/* Global Game Jam - AgriCorp (Versão com Mapa e UI) */
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
mapImage.src = 'sprites/world_map.png';
let mapLoaded = false;
mapImage.onload = () => { mapLoaded = true; };

const playerImage = new Image();
<<<<<<< HEAD
playerImage.src = 'sprites/player_sprite.png'; // Updated path
=======
playerImage.src = 'sprites/player_sprite.png';
>>>>>>> f3c2e9b220bc255987e89e594e6c25ff7f527f8e
let playerLoaded = false;
playerImage.onload = () => { playerLoaded = true; };

// Jogador - Posição inicial e atributos
const player = {
    x: 512,
    y: 512,
    width: 32,
    height: 48,
    speed: 5,
    dir: 'down'
};

window.addEventListener('resize', resizeCanvas);

// Sistema de Jogo (Simples)
let gameState = 'PLAYING';

const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Colisões Simples nas Bordas
function checkCollision(px, py, pw, ph) {
    if (px < 0 || px > MAP_PX - pw || py < 0 || py > MAP_PX - ph) return true;
    return false;
}

function applyPhysics() {
    let vx = 0; let vy = 0;
    if (keys['a'] || keys['arrowleft']) { vx = -player.speed; player.dir = 'left'; }
    if (keys['d'] || keys['arrowright']) { vx = player.speed; player.dir = 'right'; }
    if (keys['w'] || keys['arrowup']) { vy = -player.speed; player.dir = 'up'; }
    if (keys['s'] || keys['arrowdown']) { vy = player.speed; player.dir = 'down'; }

<<<<<<< HEAD
=======
    // Velocidade constante na diagonal (70.7%)
>>>>>>> f3c2e9b220bc255987e89e594e6c25ff7f527f8e
    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

    if (!checkCollision(player.x + vx, player.y, player.width, player.height)) player.x += vx;
    if (!checkCollision(player.x, player.y + vy, player.width, player.height)) player.y += vy;

    // Câmera segue o jogador suavemente
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

        // 1. DESENHA O MAPA DE FUNDO
        if (mapLoaded) {
            ctx.drawImage(mapImage, 0, 0, MAP_PX, MAP_PX);
        } else {
            // Placeholder enquanto carrega
            ctx.fillStyle = '#68a838';
            ctx.fillRect(0,0, MAP_PX, MAP_PX);
        }

        // 2. DESENHA O JOGADOR
        const px = Math.floor(player.x);
        const py = Math.floor(player.y);

<<<<<<< HEAD
        // Simple Shadow
=======
        // Sombra simples sob os pés
>>>>>>> f3c2e9b220bc255987e89e594e6c25ff7f527f8e
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(px + 16, py + 44, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        if (playerLoaded) {
            ctx.drawImage(playerImage, px, py, player.width, player.height);
        } else {
            // Quadrado vermelho clássico se o sprite estiver ausente
            ctx.fillStyle = '#800020';
            ctx.fillRect(px + 4, py + 16, 24, 24);
        }

<<<<<<< HEAD
        // 3. DEPTH SORTING (Draw fences OVER player if player is "behind" them)
        const L=160, R=860, T=160, B=860;

        // If player is "behind" the top fence
        if (player.y + player.height < T + 40) {
            ctx.drawImage(mapImage, L, T, R-L, 40, L, T, R-L, 40);
        }

        if (player.y + player.height < T + 60) ctx.drawImage(mapImage, L, T, R-L, 60, L, T, R-L, 60);
        if (player.y + player.height < B + 20 && player.y + player.height > B - 40) {
             ctx.drawImage(mapImage, L, B-20, R-L, 60, L, B-20, R-L, 60);
        }

=======
>>>>>>> f3c2e9b220bc255987e89e594e6c25ff7f527f8e
        ctx.restore();
    }
    requestAnimationFrame(draw);
}

resizeCanvas();
draw();
