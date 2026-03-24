// ============================================================
//   AgriCorp – Mapa com câmera controlada pelo mouse
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
let selectedSlot = 0;
let isWatering = false;
let wateringTimer = 0;
const crops = [];
let W, H;

// Terreno central (com a escadinha e muro de pedra no topo)
const field1 = { x: 1000, y: 580, w: 1050, h: 630 };

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
window.addEventListener('mousedown', (e) => {
    if (isWatering && wateringTimer > 0) {
        // Coordenadas mundo (considerando a câmera)
        const worldX = e.clientX + camera.x;
        const worldY = e.clientY + camera.y;

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

        // INDICADOR VISUAL DO TERRENO (Mostra onde plantar se estiver regando)
        if (isWatering) {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 4;
            ctx.strokeRect(field1.x - camera.x, field1.y - camera.y, field1.w, field1.h);
        }
        
        // DESENHAR PLANTAÇÕES (Trigo)
        crops.forEach(crop => {
            ctx.font = '32px Arial';
            ctx.fillText('🌾', crop.x - camera.x - 16, crop.y - camera.y + 16);
        });
    }

    updateHUD();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
