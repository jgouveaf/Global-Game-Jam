// ========================= AgriCorp Game (REFINO DE PLANTIO) =========================
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
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
const CAM_SPEED = 14;

window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

// AREA DE PLANTIO (TERRENO AZUL)
const blueField = { x: 1575, y: 605, w: 915, h: 520 };

window.addEventListener('mousedown', (e) => {
    // Bloqueia plantio se clicar na HUD
    if (e.target.tagName === 'BUTTON' || e.target.closest('#hotbar-container') || e.target.closest('#hud-top')) return;

    if (isWatering && wateringTimer > 0) {
        const worldX = e.clientX + camera.x;
        const worldY = e.clientY + camera.y;

        // Verifica se clicou dentro do campo marrom
        if (worldX > blueField.x && worldX < blueField.x + blueField.w &&
            worldY > blueField.y && worldY < blueField.y + blueField.h) {
            
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

        // CÂMERA FOCA NO TERRENO GRADUALMENTE
        camera.x = blueField.x + (blueField.w / 2) - (W / 2);
        camera.y = blueField.y + (blueField.h / 2) - (H / 2);

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
    // Movimentação (Suavizada)
    if (mouseX < W * EDGE) camera.x -= CAM_SPEED;
    if (mouseX > W * (1 - EDGE)) camera.x += CAM_SPEED;
    if (mouseY < H * EDGE) camera.y -= CAM_SPEED;
    if (mouseY > H * (1 - EDGE)) camera.y += CAM_SPEED;

    camera.x = Math.max(0, Math.min(camera.x, WW - W));
    camera.y = Math.max(0, Math.min(camera.y, WH - H));

    ctx.clearRect(0, 0, W, H);

    if (mapLoaded) {
        ctx.drawImage(mapImage, -camera.x, -camera.y);
        
        // GUIA DE PLANTIO (Ciano Vibrante)
        if (isWatering) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 4;
            ctx.setLineDash([10, 5]);
            ctx.strokeRect(blueField.x - camera.x, blueField.y - camera.y, blueField.w, blueField.h);
            ctx.setLineDash([]);
            
            ctx.fillStyle = 'rgba(0, 255, 255, 0.05)';
            ctx.fillRect(blueField.x - camera.x, blueField.y - camera.y, blueField.w, blueField.h);
        }

        crops.forEach(c => {
            ctx.font = '35px Arial';
            ctx.fillText('🌾', c.x - camera.x - 17, c.y - camera.y + 17);
        });
    } else {
        ctx.fillStyle = "#2d5a27";
        ctx.fillRect(0,0,W,H);
    }
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
