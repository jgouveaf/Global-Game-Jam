// ========================= AgriCorp Game =========================
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
let selectedSlot = 0;
let isWatering = false;
let wateringTimer = 0;
const crops = [];
let W, H; 

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

// LOGICA DE DETECÇÃO DO TERRENO "ESCADA" (Aprox. da Foto)
function isPointInBrownField(xw, yw) {
    // Limites verticais e horizontais base do campo central
    if (yw < 570 || yw > 1150) return false;
    if (xw > 2150) return false;

    // Lógica da "Escadinha" no lado esquerdo
    if (yw >= 570 && yw < 685) return xw > 1280;
    if (yw >= 685 && yw < 780) return xw > 1100;
    if (yw >= 780 && yw < 880) return xw > 950;
    if (yw >= 880 && yw < 980) return xw > 820;
    
    return xw > 780; // Base do campo
}

function updateHUD() {
    if(!document.getElementById('hp-bar')) return;
    document.getElementById('hp-bar').style.width = '100%';
    document.getElementById('hud-value').textContent = '100';
    document.getElementById('hud-coins-value').textContent = '0';
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
        const worldX = (e.clientX + camera.x) / scale;
        const worldY = (e.clientY + camera.y) / scale;

        // VERIFICA SE ESTÁ NA ÁREA MARROM ESPECÍFICA
        if (isPointInBrownField(worldX, worldY)) {
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
        ctx.drawImage(mapImage, 0, 0);

        // DESENHAR O CONTORNO DO TERRENO (Debug Visual de Plantio)
        if (isWatering) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(1280, 570); // Início topo-esquerda
            ctx.lineTo(2150, 570); // Topo direito
            ctx.lineTo(2150, 1150); // Base direita
            ctx.lineTo(780,  1150); // Base esquerda
            ctx.lineTo(780,  980);  // Primeiro degrau
            ctx.lineTo(820,  980);
            ctx.lineTo(820,  880);  // Segundo degrau
            ctx.lineTo(950,  880);
            ctx.lineTo(950,  780);  // Terceiro degrau
            ctx.lineTo(1100, 780);
            ctx.lineTo(1100, 685);  // Quarto degrau
            ctx.lineTo(1280, 685);
            ctx.closePath();
            ctx.stroke();
        }
        
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
