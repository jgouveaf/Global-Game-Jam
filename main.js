// ========================= AgriCorp Game (Versão Restaurada e Limpa) =========================
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

const mapImage = new Image();
mapImage.src = 'sprites/Mapa.png';
let mapLoaded = false;
let WW = 2800, WH = 1400; // Tamanho do mapa

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
const CAM_SPEED = 10;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// ESTADOS DE JOGO
let isWatering = false;
let wateringTimer = 0;
const crops = [];

// ÁREA AZUL (Coordenadas aproximadas no mapa 2800x1400)
const blueField = { x: 1580, y: 580, w: 900, h: 540 };

// BOTÃO REGAR
document.getElementById('btn-water').addEventListener('click', () => {
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
    // Só planta se estiver regando e NÃO clicar em botões
    if (isWatering && wateringTimer > 0 && e.target.tagName !== 'BUTTON') {
        const worldX = e.clientX + camera.x;
        const worldY = e.clientY + camera.y;

        // Verifica se o clique está na área marrom do terreno azul
        if (worldX > blueField.x && worldX < blueField.x + blueField.w &&
            worldY > blueField.y && worldY < blueField.y + blueField.h) {
            
            // Verifica distância para não sobrepor
            const tooClose = crops.some(c => Math.hypot(c.x - worldX, c.y - worldY) < 30);
            if (!tooClose) {
                crops.push({ x: worldX, y: worldY });
            }
        }
    }
});

function updateCamera() {
    if (mouseX < W * EDGE) camera.x -= CAM_SPEED;
    if (mouseX > W * (1 - EDGE)) camera.x += CAM_SPEED;
    if (mouseY < H * EDGE) camera.y -= CAM_SPEED;
    if (mouseY > H * (1 - EDGE)) camera.y += CAM_SPEED;

    camera.x = Math.max(0, Math.min(camera.x, WW - W));
    camera.y = Math.max(0, Math.min(camera.y, WH - H));
}

function loop(){
    updateCamera();
    ctx.clearRect(0, 0, W, H);

    if (mapLoaded) {
        // DESENHA O MAPA 1:1 COMO ANTES
        ctx.drawImage(mapImage, -camera.x, -camera.y);

        // GUIA DA ÁREA (Só se estiver regando)
        if (isWatering) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.strokeRect(blueField.x - camera.x, blueField.y - camera.y, blueField.w, blueField.h);
        }

        // DESENHA PLANTAÇÕES
        crops.forEach(c => {
            ctx.font = '30px Arial';
            ctx.fillText('🌾', c.x - camera.x - 15, c.y - camera.y + 15);
        });
    }

    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
