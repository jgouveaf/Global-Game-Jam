// ========================= AgriCorp Game (RESTAURAÇÃO TOTAL) =========================
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

const mapImage = new Image();
// Esse é o caminho do seu mapa grande e bonito
mapImage.src = 'sprites/Mapa.png'; 

let mapLoaded = false;
let WW = 2800, WH = 1400; // Tamanho base do mapa grande

mapImage.onload = () => {
    mapLoaded = true;
    WW = mapImage.width;
    WH = mapImage.height;
};

let W, H;
function resize(){
    canvas.width = window.innerWidth;
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

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// LOGICA DE JOGO
let isWatering = false, wateringTimer = 0, crops = [];

// ÁREA AZUL (Canto inferior direito da estrada)
const blueField = { x: 1580, y: 580, w: 900, h: 540 };

// BOTÃO REGAR
document.getElementById('btn-water').addEventListener('click', (e) => {
    e.stopPropagation(); // Impede o clique de vazar pro canvas
    if (isWatering) return;
    isWatering = true;
    wateringTimer = 10;
    const timerUI = document.getElementById('planting-timer');
    timerUI.classList.remove('hidden');
    
    const countdown = setInterval(() => {
        wateringTimer--;
        document.getElementById('timer-sec').textContent = wateringTimer;
        if (wateringTimer <= 0) {
            clearInterval(countdown);
            isWatering = false;
            timerUI.classList.add('hidden');
        }
    }, 1000);
});

// CLIQUE PARA PLANTAR
window.addEventListener('mousedown', (e) => {
    // Só planta se estiver no modo rega e não clicou em botoes ou overlays
    if (isWatering && wateringTimer > 0) {
        if (e.target.tagName === 'BUTTON' || e.target.closest('#hotbar-container') || e.target.closest('#hud-top')) return;
        
        const worldX = e.clientX + camera.x;
        const worldY = e.clientY + camera.y;

        if (worldX > blueField.x && worldX < blueField.x + blueField.w &&
            worldY > blueField.y && worldY < blueField.y + blueField.h) {
            
            // Distancia mínima para não bugar
            const tooClose = crops.some(c => Math.hypot(c.x - worldX, c.y - worldY) < 35);
            if (!tooClose) {
                crops.push({ x: worldX, y: worldY });
            }
        }
    }
});

function loop(){
    // Movimentação da Câmera
    if (mouseX < W * EDGE) camera.x -= CAM_SPEED;
    if (mouseX > W * (1 - EDGE)) camera.x += CAM_SPEED;
    if (mouseY < H * EDGE) camera.y -= CAM_SPEED;
    if (mouseY > H * (1 - EDGE)) camera.y += CAM_SPEED;

    camera.x = Math.max(0, Math.min(camera.x, WW - W));
    camera.y = Math.max(0, Math.min(camera.y, WH - H));

    ctx.clearRect(0, 0, W, H);

    if (mapLoaded) {
        ctx.drawImage(mapImage, -camera.x, -camera.y);
        
        if (isWatering) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 5;
            ctx.setLineDash([10, 5]);
            ctx.strokeRect(blueField.x - camera.x, blueField.y - camera.y, blueField.w, blueField.h);
            ctx.setLineDash([]);
        }

        crops.forEach(c => {
            ctx.font = '35px Arial';
            ctx.fillText('🌾', c.x - camera.x - 17, c.y - camera.y + 17);
        });
    } else {
        // Carregando...
        ctx.fillStyle = "#2d5a27";
        ctx.fillRect(0,0,W,H);
    }
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
