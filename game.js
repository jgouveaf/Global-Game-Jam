// ========================= AgriCorp Game (Versão Full Screen corrigida) =========================
const canvas = document.getElementById('gameCanvas') || document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');
let selectedSlot = 0;
let isWatering = false;
let wateringTimer = 0;
const crops = [];
let W, H, WW = 2800, WH = 1400; 

const mapImage = new Image();
mapImage.src = 'tileset.jpg'; // Usando o tileset local se Mapa.png não estiver aqui
let mapLoaded = false;

function resize(){
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    W = canvas.width;
    H = canvas.height;
}
resize();
window.addEventListener('resize', resize);

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
    mouseX = e.clientX; mouseY = e.clientY;
});

function isInsideBrownField(xw, yw) {
    if (yw < 600 || yw > 1180 || xw > 2180) return false;
    if (yw < 710)  return xw > 1290;
    if (yw < 805)  return xw > 1110;
    if (yw < 905)  return xw > 960;
    if (yw < 1005) return xw > 830;
    return xw > 790;
}

function updateCamera() {
    const scale = Math.max(W / WW, H / WH);
    const virtualWW = WW * scale;
    const virtualWH = WH * scale;
    if (mouseX < W * EDGE)      camera.x -= CAM_SPEED;
    if (mouseX > W * (1-EDGE)) camera.x += CAM_SPEED;
    if (mouseY < H * EDGE)      camera.y -= CAM_SPEED;
    if (mouseY > H * (1-EDGE)) camera.y += CAM_SPEED;
    camera.x = Math.max(0, Math.min(camera.x, virtualWW - W));
    camera.y = Math.max(0, Math.min(camera.y, virtualWH - H));
}

window.addEventListener('mousedown', (e) => {
    if (isWatering && wateringTimer > 0) {
        const scale = Math.max(W / WW, H / WH);
        const worldX = (e.clientX + camera.x) / scale;
        const worldY = (e.clientY + camera.y) / scale;
        if (isInsideBrownField(worldX, worldY)) {
            crops.push({ x: worldX, y: worldY, type: 'wheat' });
        }
    }
});

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

function loop(){
    updateCamera();
    ctx.clearRect(0, 0, W, H);
    const scale = Math.max(W / WW, H / WH);
    if (mapLoaded) {
        ctx.save();
        ctx.translate(-camera.x, -camera.y);
        ctx.scale(scale, scale);
        ctx.drawImage(mapImage, 0, 0);
        if (isWatering) {
            ctx.strokeStyle = 'white';
            ctx.setLineDash([10, 5]);
            ctx.lineWidth = 5;
            ctx.strokeRect(1000, 600, 1000, 580); // Um guia visual simples
            ctx.setLineDash([]);
        }
        crops.forEach(crop => {
            ctx.font = '32px Arial';
            ctx.fillText('🌾', crop.x - 16, crop.y + 16);
        });
        ctx.restore();
    }
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
