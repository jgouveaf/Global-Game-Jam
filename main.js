// ========================= AgriCorp Game (Versão Corrigida para Área Azul) =========================
const canvas = document.getElementById('gameCanvas') || document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');
let selectedSlot = 0;
let isWatering = false;
let wateringTimer = 0;
const crops = [];
let W, H, WW = 2800, WH = 1400; 

const mapImage = new Image();
mapImage.src = 'sprites/Mapa.png'; // No GitHub
// Se for rodar no rascunho, use 'tileset.jpg'
if (!window.location.href.includes('github')) mapImage.src = 'tileset.jpg';

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

// LOGICA DE DETECÇÃO DO TERRENO AZUL (Direita da Estrada)
function isInsideBlueField(xw, yw) {
    // Limites básicos para o terreno que você pintou de azul
    if (yw < 580 || yw > 1120 || xw < 1550 || xw > 2480) return false;
    
    // Escadinha no lado ESQUERDO desse terreno específico
    if (yw < 695)  return xw > 1850;
    if (yw < 800)  return xw > 1720;
    if (yw < 910)  return xw > 1650;
    
    return xw > 1580;
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
        
        if (isInsideBlueField(worldX, worldY)) {
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

        // FOCAR A CÂMERA NO TERRENO (Para não sumir!)
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
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)'; // Borda azul para indicar a área do usuário
            ctx.setLineDash([10, 5]);
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(1850, 580);
            ctx.lineTo(2480, 580);
            ctx.lineTo(2480, 1120);
            ctx.lineTo(1580, 1120);
            ctx.lineTo(1580, 910);
            ctx.lineTo(1650, 910);
            ctx.lineTo(1650, 800);
            ctx.lineTo(1720, 800);
            ctx.lineTo(1720, 695);
            ctx.lineTo(1850, 695);
            ctx.closePath();
            ctx.stroke();
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
