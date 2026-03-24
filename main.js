// ========================= AgriCorp Game =========================
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
let selectedSlot = 0;
let isWatering = false;
let wateringTimer = 0;
const crops = [];
let W, H; 

// Terreno central (Calibrado conforme a foto)
const field1 = { x: 1050, y: 780, w: 430, h: 350 };

function resize(){
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    W = canvas.width;
    H = canvas.height;
}
resize();
window.addEventListener('resize', resize);

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

const camera = { x: 0, y: 0 };
let mouseX = 0, mouseY = 0;
const EDGE = 0.15;
const CAM_SPEED = 8;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function updateCamera() {
    // Escala para garantir tela cheia sem distorção (Cover)
    const scale = Math.max(W / WW, H / WH);
    const virtualWW = WW * scale;
    const virtualWH = WH * scale;

    const leftZone   = W * EDGE;
    const rightZone  = W * (1 - EDGE);
    const topZone    = H * EDGE;
    const bottomZone = H * (1 - EDGE);

    if (mouseX < leftZone)   camera.x -= CAM_SPEED;
    if (mouseX > rightZone)  camera.x += CAM_SPEED;
    if (mouseY < topZone)    camera.y -= CAM_SPEED;
    if (mouseY > bottomZone) camera.y += CAM_SPEED;

    camera.x = Math.max(0, Math.min(camera.x, virtualWW - W));
    camera.y = Math.max(0, Math.min(camera.y, virtualWH - H));
}

function updateHUD() {
    if(!document.getElementById('hp-bar')) return;
    const pct = 100; // Valor fixo para exemplo
    document.getElementById('hp-bar').style.width = pct + '%';
    document.getElementById('hud-value').textContent = Math.round(pct);
    document.getElementById('hud-coins-value').textContent = 0;
}

// ========================= INVENTÁRIO =========================
window.addEventListener('keydown', (e) => {
    if (e.key >= '1' && e.key <= '9') {
        selectedSlot = parseInt(e.key) - 1;
        updateHotbarVisual();
    } else if (e.key === '0') {
        selectedSlot = 9;
        updateHotbarVisual();
    }
});

function updateHotbarVisual() {
    const slots = document.querySelectorAll('.hotbar-slot');
    slots.forEach((slot, index) => {
        if (index === selectedSlot) slot.classList.add('active');
        else slot.classList.remove('active');
    });
}

// ========================= CONTROLE DE PLANTIO =========================
const btnWater = document.getElementById('btn-water');
const timerUI = document.getElementById('planting-timer');
const timerSec = document.getElementById('timer-sec');

if(btnWater) {
    btnWater.addEventListener('click', () => {
        if (isWatering) return;
        isWatering = true;
        wateringTimer = 10;
        timerUI.classList.remove('hidden');
        timerSec.textContent = wateringTimer;
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

window.addEventListener('mousedown', (e) => {
    if (isWatering && wateringTimer > 0) {
        const scale = Math.max(W / WW, H / WH);
        // Ajusta as coordenadas do mouse para o mundo escalonado
        const worldX = (e.clientX + camera.x) / scale;
        const worldY = (e.clientY + camera.y) / scale;

        if (worldX > field1.x && worldX < field1.x + field1.w &&
            worldY > field1.y && worldY < field1.y + field1.h) {
            crops.push({ x: worldX, y: worldY, type: 'wheat' });
        }
    }
});

function loop(){
    updateCamera();
    ctx.clearRect(0, 0, W, H);
    const scale = Math.max(W / WW, H / WH);

    if (!mapLoaded) {
        ctx.fillStyle = '#2d5a1b';
        ctx.fillRect(0, 0, W, H);
    } else {
        ctx.save();
        ctx.translate(-camera.x, -camera.y);
        ctx.scale(scale, scale);
        
        // Desenha o mapa
        ctx.drawImage(mapImage, 0, 0);

        // INDICADOR VISUAL DO TERRENO
        if (isWatering) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(field1.x, field1.y, field1.w, field1.h);
            ctx.setLineDash([]);
        }
        
        // DESENHAR PLANTAÇÕES
        crops.forEach(crop => {
            ctx.font = '28px Arial';
            ctx.fillText('🌾', crop.x - 14, crop.y + 14);
        });
        ctx.restore();
    }

    updateHUD();
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
