// ========================= AgriCorp Game (REVISÃO TOTAL) =========================
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

const mapImage = new Image();
mapImage.src = 'sprites/Mapa.png';
let mapLoaded = false;
let WW = 2800, WH = 1400; // Fallback caso o load demore

mapImage.onload = () => { 
    mapLoaded = true; 
    WW = mapImage.width; 
    WH = mapImage.height; 
};

let W, H;
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
const CAM_SPEED = 20;

// AREA DE PLANTIO (COORDENADAS DO USUÁRIO)
const firstArea = { x: 1130, y: 326, w: 205, h: 216 };
let crops = [], isWatering = false, wateringTimer = 0;

window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

// DETECÇÃO DE CLIQUE REFORÇADA
window.addEventListener('mousedown', (e) => {
    if (!isWatering || wateringTimer <= 0) return;

    // Se clicar em botão ou HUD, ignora
    if (e.target.tagName === 'BUTTON' || e.target.closest('#hud-top') || e.target.closest('#action-buttons') || e.target.closest('#hotbar-container')) {
        return;
    }

    const scale = Math.max(W / WW, H / WH);
    
    // Matemática exata do clique no mundo escalonado
    const worldX = (e.clientX + camera.x) / scale;
    const worldY = (e.clientY + camera.y) / scale;

    if (worldX > firstArea.x && worldX < firstArea.x + firstArea.w &&
        worldY > firstArea.y && worldY < firstArea.y + firstArea.h) {
        
        const tooClose = crops.some(c => Math.hypot(c.x - worldX, c.y - worldY) < 35);
        if (!tooClose) {
            crops.push({ x: worldX, y: worldY });
        }
    }
});

// BOTÃO REGAR
const btnWater = document.getElementById('btn-water');
const timerUI  = document.getElementById('planting-timer');
const timerSec = document.getElementById('timer-sec');

if (btnWater) {
    btnWater.onclick = (e) => {
        e.stopPropagation();
        if (isWatering) return;
        
        isWatering = true;
        wateringTimer = 10;
        timerUI.classList.remove('hidden');
        timerSec.textContent = wateringTimer;

        // FOCA NO TERRENO
        const scale = Math.max(W / WW, H / WH);
        camera.x = (firstArea.x + firstArea.w / 2) * scale - (W / 2);
        camera.y = (firstArea.y + firstArea.h / 2) * scale - (H / 2);

        const countdown = setInterval(() => {
            wateringTimer--;
            timerSec.textContent = wateringTimer;
            if (wateringTimer <= 0) {
                clearInterval(countdown);
                isWatering = false;
                timerUI.classList.add('hidden');
            }
        }, 1000);
    };
}

function loop(){
    const scale = Math.max(W / WW, H / WH);
    const virtualWW = WW * scale;
    const virtualWH = WH * scale;

    // Câmera dinâmica
    const EDGE = 0.15;
    if (mouseX < W * EDGE) camera.x -= CAM_SPEED;
    if (mouseX > W * (1 - EDGE)) camera.x += CAM_SPEED;
    if (mouseY < H * EDGE) camera.y -= CAM_SPEED;
    if (mouseY > H * (1 - EDGE)) camera.y += CAM_SPEED;

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
            ctx.lineWidth = 4;
            ctx.strokeRect(firstArea.x, firstArea.y, firstArea.w, firstArea.h);
        }

        crops.forEach(c => {
            ctx.font = '35px Arial';
            ctx.fillText('🌾', c.x - 17, c.y + 17);
        });
        ctx.restore();
    }
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
