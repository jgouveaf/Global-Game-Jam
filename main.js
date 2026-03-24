// ========================= AgriCorp Game =========================
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
let selectedSlot = 0;
let isWatering = false;
let wateringTimer = 0;
const crops = [];
let W, H, WW = 2800, WH = 1400; // Valores padrão antes do load

const mapImage = new Image();
mapImage.src = 'sprites/Mapa.png';
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

// LOGICA DE DETECÇÃO DO TERRENO ESPECÍFICO (MARROM)
function isInsideBrownField(xw, yw) {
    if (yw < 600 || yw > 1180 || xw > 2180) return false;
    
    // Escadinha do lado esquerdo
    if (yw < 710) return xw > 1290;
    if (yw < 805) return xw > 1110;
    if (yw < 905) return xw > 960;
    if (yw < 1005) return xw > 830;
    
    return xw > 790;
}

function updateCamera() {
    // Escala para Modo 'Cover' (Preencher tela inteira sem bordas vazias)
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
        // Calcula a posição real no mundo escalonado do mapa
        const worldX = (e.clientX + camera.x) / scale;
        const worldY = (e.clientY + camera.y) / scale;

        if (isInsideBrownField(worldX, worldY)) {
            crops.push({ x: worldX, y: worldY, type: 'wheat' });
        }
    }
});

function updateHUD() {
    const elHp = document.getElementById('hp-bar');
    if (elHp) { elHp.style.width = '100%'; document.getElementById('hud-value').textContent = '100'; }
    const elCoins = document.getElementById('hud-coins-value');
    if (elCoins) elCoins.textContent = '0';
}

function loop(){
    updateCamera();
    ctx.clearRect(0, 0, W, H);
    const scale = Math.max(W / WW, H / WH);

    if (!mapLoaded) {
        ctx.fillStyle = '#325e22'; // Verde grama apenas no carregamento
        ctx.fillRect(0, 0, W, H);
    } else {
        ctx.save();
        ctx.translate(-camera.x, -camera.y);
        ctx.scale(scale, scale);
        
        ctx.drawImage(mapImage, 0, 0);

        // DELIMITADOR DO TERRENO (Debug Visual modo Rega)
        if (isWatering) {
            ctx.strokeStyle = 'white';
            ctx.setLineDash([10, 5]);
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(1290, 600);
            ctx.lineTo(2180, 600);
            ctx.lineTo(2180, 1180);
            ctx.lineTo(790, 1180);
            ctx.lineTo(790, 1005);
            ctx.lineTo(830, 1005);
            ctx.lineTo(830, 905);
            ctx.lineTo(960, 905);
            ctx.lineTo(960, 805);
            ctx.lineTo(1110, 805);
            ctx.lineTo(1110, 710);
            ctx.lineTo(1290, 710);
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
    updateHUD();
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
