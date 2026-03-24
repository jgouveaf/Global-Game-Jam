// ============================================================
//   AgriCorp – Mapa com câmera controlada pelo mouse
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
let selectedSlot = 0;
let isWatering = false;
let wateringTimer = 0;
const crops = [];

// Definição do Único Terreno permitido por enquanto (Superior Esquerdo)
const field1 = { x: 140, y: 240, w: 700, h: 440 };

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
    const leftZone   = W * EDGE;
    const rightZone  = W * (1 - EDGE);
    const topZone    = H * EDGE;
    const bottomZone = H * (1 - EDGE);

    if (mouseX < leftZone)   camera.x -= CAM_SPEED;
    if (mouseX > rightZone)  camera.x += CAM_SPEED;
    if (mouseY < topZone)    camera.y -= CAM_SPEED;
    if (mouseY > bottomZone) camera.y += CAM_SPEED;

    // Se o mapa for menor que a tela, centraliza (evita bordas pretas)
    if (WW < W) {
        camera.x = -(W - WW) / 2;
    } else {
        camera.x = Math.max(0, Math.min(camera.x, WW - W));
    }

    if (WH < H) {
        camera.y = -(H - WH) / 2;
    } else {
        camera.y = Math.max(0, Math.min(camera.y, WH - H));
    }
}

// ========================= HUD =========================
let comunidade = 100;
let moedas = 0;

function updateHUD() {
    const pct = Math.max(0, Math.min(comunidade, 100));
    document.getElementById('hp-bar').style.width = pct + '%';
    document.getElementById('hud-value').textContent = Math.round(pct);
    document.getElementById('hud-coins-value').textContent = moedas;
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

btnWater.addEventListener('click', () => {
    if (isWatering) return; // Evita cliques múltiplos
    
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

// Listener de clique no Mapa para plantar
canvas.addEventListener('mousedown', (e) => {
    if (isWatering && wateringTimer > 0) {
        // Coordenadas mundo (considerando a câmera e o tamanho do canvas na tela)
        const rect = canvas.getBoundingClientRect();
        const mouseXCanvas = e.clientX - rect.left;
        const mouseYCanvas = e.clientY - rect.top;
        
        const worldX = mouseXCanvas + camera.x;
        const worldY = mouseYCanvas + camera.y;

        // Verifica se clicou no Terreno 1 (Superior Esquerdo)
        if (worldX > field1.x && worldX < field1.x + field1.w &&
            worldY > field1.y && worldY < field1.y + field1.h) {
            
            // Planta Trigo 🌾
            crops.push({ x: worldX, y: worldY, type: 'wheat' });
        }
    }
});

// ========================= LOOP =========================
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
        
        // DESENHAR PLANTAÇÕES (Trigo)
        crops.forEach(crop => {
            ctx.font = '24px Arial';
            ctx.fillText('🌾', crop.x - camera.x - 12, crop.y - camera.y + 12);
        });
    }

    updateHUD();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
