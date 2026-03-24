// ============================================================
//   AgriCorp – Mapa com câmera controlada pelo mouse
// ============================================================
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
let W, H;

function resize(){
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    W = canvas.width;
    H = canvas.height;
}
resize();
window.addEventListener('resize', resize);

// ========================= MAPA =========================
const mapImage = new Image();
mapImage.src = 'sprites/Mapa.png';
let mapLoaded = false;
let WW = 2800;
let WH = 1400;
mapImage.onload = () => {
    mapLoaded = true;
    WW = mapImage.width;
    WH = mapImage.height;
};

// ========================= ESTADO DO JOGO =========================
let gameState = 'PLAYING'; // PLAYING, ASK_SHOP, IN_SHOP

// Área do Celeiro Cinza (World Coordinates)
const BARN_ZONE = { x: 2320, y: 100, w: 200, h: 250 };

// Moedas
let moedas = 0;
const coinsValueEl = document.getElementById('hud-coins-value');

// ========================= UI SELECTORS =========================
const shopConfirm = document.getElementById('shop-confirm');
const shopOverlay = document.getElementById('shop-overlay');

const btnSim    = document.getElementById('btn-shop-sim');
const btnNao    = document.getElementById('btn-shop-nao');
const btnVoltar = document.getElementById('btn-shop-voltar');

// LISTENERS
btnSim.onclick    = () => { gameState = 'IN_SHOP'; shopConfirm.classList.add('hidden'); shopOverlay.classList.remove('hidden'); };
btnNao.onclick    = () => { gameState = 'PLAYING'; shopConfirm.classList.add('hidden'); };
btnVoltar.onclick = () => { gameState = 'PLAYING'; shopOverlay.classList.add('hidden'); };

canvas.onclick = (e) => {
    if (gameState !== 'PLAYING') return;

    // Converter clique na tela para coordenadas do mundo
    const worldX = e.clientX + camera.x;
    const worldY = e.clientY + camera.y;

    // Verificar se clicou no celeiro
    if (worldX >= BARN_ZONE.x && worldX <= BARN_ZONE.x + BARN_ZONE.w &&
        worldY >= BARN_ZONE.y && worldY <= BARN_ZONE.y + BARN_ZONE.h) {
        gameState = 'ASK_SHOP';
        shopConfirm.classList.remove('hidden');
    }
};

// ========================= CÂMERA (mouse) =========================
const camera = { x: 0, y: 0 };
let mouseX = 0, mouseY = 0;

const EDGE = 0.18;
const CAM_SPEED = 6;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function updateCamera() {
    if (gameState !== 'PLAYING') return;

    const leftZone   = W * EDGE;
    const rightZone  = W * (1 - EDGE);
    const topZone    = H * EDGE;
    const bottomZone = H * (1 - EDGE);

    if (mouseX < leftZone)   camera.x -= CAM_SPEED;
    if (mouseX > rightZone)  camera.x += CAM_SPEED;
    if (mouseY < topZone)    camera.y -= CAM_SPEED;
    if (mouseY > bottomZone) camera.y += CAM_SPEED;

    // Limitar câmera ao mapa
    camera.x = Math.max(0, Math.min(camera.x, WW - W));
    camera.y = Math.max(0, Math.min(camera.y, WH - H));
}

// ========================= HUD COMUNIDADE =========================
let comunidade = 100;
const hpBar   = document.getElementById('hp-bar');
const hpValue = document.getElementById('hud-value');

function updateHUD() {
    const pct = Math.max(0, Math.min(comunidade, 100));
    hpBar.style.width = pct + '%';
    hpValue.textContent = Math.round(pct);
    
    if (pct > 60) hpBar.style.background = 'url("sprites/barac.png") left center / auto 100%';
    
    // Moedas
    coinsValueEl.textContent = moedas;
}

// ========================= LOOP PRINCIPAL =========================
function loop(){
    updateCamera();
    ctx.clearRect(0, 0, W, H);

    if (!mapLoaded) {
        ctx.fillStyle = '#2d5a1b';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = '16px monospace';
        ctx.fillText('Carregando mapa...', W/2 - 80, H/2);
    } else {
        ctx.drawImage(mapImage, -camera.x, -camera.y);
        
        // Texto "LOJA" em cima do celeiro
        ctx.save();
        ctx.font = '16px "Press Start 2P", cursive';
        ctx.textAlign = 'center';
        // Sombra/Borda
        ctx.fillStyle = '#000';
        ctx.fillText('LOJA', BARN_ZONE.x + BARN_ZONE.w/2 - camera.x + 2, BARN_ZONE.y - camera.y - 10 + 2);
        // Texto Principal
        ctx.fillStyle = '#fff';
        ctx.fillText('LOJA', BARN_ZONE.x + BARN_ZONE.w/2 - camera.x, BARN_ZONE.y - camera.y - 10);
        ctx.restore();
    }

    updateHUD();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
