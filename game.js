// ========================= AgriCorp Game (Loja e Upgrades) =========================
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
let selectedSlot = 0;
let isWatering = false, wateringTimer = 0, crops = [], W, H, WW = 2800, WH = 1400; 

const mapImage = new Image();
mapImage.src = 'sprites/Mapa.png';
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
const CAM_SPEED = 12;

window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

// SELEÇÃO DE SLOTS (1-0)
window.addEventListener('keydown', (e) => {
    let key = e.key;
    if (key >= '1' && key <= '9') selectedSlot = parseInt(key) - 1;
    else if (key === '0') selectedSlot = 9;
    
    // Atualiza visual hotbar
    const slots = document.querySelectorAll('.hotbar-slot');
    slots.forEach((s, i) => {
        if (i === selectedSlot) {
            s.style.borderColor = '#ffd700';
            s.style.boxShadow = '0 0 15px #ffd700';
            s.classList.add('active');
        } else {
            s.style.borderColor = '#000';
            s.style.boxShadow = 'none';
            s.classList.remove('active');
        }
    });
});

// LOGICA DE DETECÇÃO DO TERRENO AZUL (SINCERIDADE TOTAL)
const blueField = { x: 1580, y: 580, w: 900, h: 540 };

function isInsideBlueField(xw, yw) {
    if (yw < 580 || yw > 1120 || xw < 1550 || xw > 2480) return false;
    if (yw < 695) return xw > 1850;
    if (yw < 800) return xw > 1720;
    if (yw < 910) return xw > 1650;
    return xw > 1580;
}

window.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('#hotbar-container')) return;
    if (isWatering && wateringTimer > 0) {
        const worldX = e.clientX + camera.x;
        const worldY = e.clientY + camera.y;

        if (isInsideBlueField(worldX, worldY)) {
            const MIN_DIST = 35; 
            const tooClose = crops.some(c => Math.hypot(c.x - worldX, c.y - worldY) < MIN_DIST);
            if (!tooClose) crops.push({ x: worldX, y: worldY });
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

        // FOCA NO TERRENO AZUL (CÂMERA)
        camera.x = 1850 - (W / 2);
        camera.y = 780 - (H / 2);

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
    if (mouseX < W * EDGE)      camera.x -= CAM_SPEED;
    if (mouseX > W * (1-EDGE)) camera.x += CAM_SPEED;
    if (mouseY < H * EDGE)      camera.y -= CAM_SPEED;
    if (mouseY > H * (1-EDGE)) camera.y += CAM_SPEED;

    camera.x = Math.max(0, Math.min(camera.x, WW - W));
    camera.y = Math.max(0, Math.min(camera.y, WH - H));

    ctx.clearRect(0, 0, W, H);
    if (mapLoaded) {
        ctx.drawImage(mapImage, -camera.x, -camera.y);
        
        if (isWatering) {
            ctx.strokeStyle = '#00ffff'; 
            ctx.setLineDash([10, 5]);
            ctx.lineWidth = 5;
            ctx.strokeRect(blueField.x - camera.x, blueField.y - camera.y, blueField.w, blueField.h);
            ctx.setLineDash([]);
        }
        crops.forEach(c => { ctx.font = '35px Arial'; ctx.fillText('🌾', c.x - camera.x - 17, c.y - camera.y + 17); });
    }
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
