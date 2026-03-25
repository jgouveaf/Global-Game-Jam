// ========================= AgriCorp Game (Versão Final com Distanciamento) =========================
const canvas = document.getElementById('gameCanvas') || document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');
let selectedSlot = 0;
let isWatering = false;
let wateringTimer = 0;
const crops = [];
let W, H, WW = 2800, WH = 1400; 

const mapImage = new Image();
// Tenta carregar o mapa correto para qualquer pasta
const currentURL = window.location.href;
if (currentURL.includes('Simulador') || currentURL.includes('GitHub')) {
    mapImage.src = 'sprites/Mapa.png';
} else {
    mapImage.src = 'tileset.jpg';
}

let mapLoaded = false;
mapImage.onload = () => { mapLoaded = true; WW = mapImage.width; WH = mapImage.height; };

function resize(){
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    W = canvas.width;
    H = canvas.height;
}
resize();
window.addEventListener('resize', resize);

const camera = { x: 0, y: 0 };
let mouseX = 0, mouseY = 0;
const EDGE = 0.15;
const CAM_SPEED = 10;

window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

// LOGICA DE DETECÇÃO DO TERRENO AZUL (ESPECÍFICO)
function isInsideBlueField(xw, yw) {
    if (yw < 580 || yw > 1120 || xw < 1550 || xw > 2480) return false;
    if (yw < 695) return xw > 1850;
    if (yw < 800) return xw > 1720;
    if (yw < 910) return xw > 1650;
    return xw > 1580;
}

window.addEventListener('mousedown', (e) => {
    // Evita plantar se clicar em cima de um botão da HUD
    if (e.target.tagName === 'BUTTON' || e.target.closest('.hotbar-slot')) return;

    if (isWatering && wateringTimer > 0) {
        const scale = Math.max(W / WW, H / WH);
        const worldX = (e.clientX + camera.x) / scale;
        const worldY = (e.clientY + camera.y) / scale;

        if (isInsideBlueField(worldX, worldY)) {
            // REGRA: DISTANCIA MÍNIMA ENTRE SEMENTES (30 pixels mundo)
            const MIN_DIST = 35; 
            const tooClose = crops.some(c => Math.hypot(c.x - worldX, c.y - worldY) < MIN_DIST);
            
            if (!tooClose) {
                crops.push({ x: worldX, y: worldY });
            }
        }
    }
});

const btnWater = document.getElementById('btn-water');
const timerUI  = document.getElementById('planting-timer');
const timerSec = document.getElementById('timer-sec');

if(btnWater) {
    btnWater.addEventListener('click', () => {
        if (isWatering) return;
        isWatering = true;
        wateringTimer = 10;
        timerUI.classList.remove('hidden');
        timerSec.textContent = wateringTimer;

        // FOCA NO TERRENO AZUL
        const scale = Math.max(W / WW, H / WH);
        camera.x = (1850 * scale) - (W / 2);
        camera.y = (780 * scale) - (H / 2);

        const countdown = setInterval(() => {
            wateringTimer--;
            timerSec.textContent = wateringTimer;
            if (wateringTimer <= 0) {
                clearInterval(countdown);
                isWatering = false;
                timerUI.classList.add('hidden');
            }
        }, 1000);
    });
}

function updateHUD() {
    const hp = document.getElementById('hp-bar');
    if(hp) hp.style.width = '100%';
}

function loop(){
    const scale = Math.max(W / WW, H / WH);
    const virtualWW = WW * scale;
    const virtualWH = WH * scale;

    if (mouseX < W * EDGE) camera.x -= CAM_SPEED;
    if (mouseX > W * (1-EDGE)) camera.x += CAM_SPEED;
    if (mouseY < H * EDGE) camera.y -= CAM_SPEED;
    if (mouseY > H * (1-EDGE)) camera.y += CAM_SPEED;

    camera.x = Math.max(0, Math.min(camera.x, virtualWW - W));
    camera.y = Math.max(0, Math.min(camera.y, virtualWH - H));

    ctx.clearRect(0, 0, W, H);
    if (mapLoaded) {
        ctx.save();
        ctx.translate(-camera.x, -camera.y);
        ctx.scale(scale, scale);
        ctx.drawImage(mapImage, 0, 0);
        
        if (isWatering) {
            ctx.strokeStyle = '#00ffff'; 
            ctx.setLineDash([10, 5]);
            ctx.lineWidth = 5;
            ctx.strokeRect(1580, 580, 900, 540); 
            ctx.setLineDash([]);
        }
        crops.forEach(c => { ctx.font = '32px Arial'; ctx.fillText('🌾', c.x - 16, c.y + 16); });
        ctx.restore();
    }
    updateHUD();
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
