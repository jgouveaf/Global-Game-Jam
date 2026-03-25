// ========================= AgriCorp Game (MOTOR RECONSTRUÍDO) =========================
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
const EDGE = 0.15, CAM_SPEED = 18;

window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

// AREA DE PLANTIO (COORDENADAS EXATAS DO USUÁRIO)
const firstArea = { x: 1130, y: 326, w: 1335 - 1130, h: 542 - 326 };

window.addEventListener('mousedown', (e) => {
    // Escala atual do mapa na tela cheia (Modo Cover)
    const scale = Math.max(W / WW, H / WH);
    
    // Se o botão regar ou qualquer outro estiver na frente, ignora o plantio
    if (e.target.tagName === 'BUTTON' || e.target.closest('#action-buttons')) return;

    if (isWatering && wateringTimer > 0) {
        // CORREÇÃO DE COORDENADA NO MUNDO ESCALONADO
        const worldX = (e.clientX + camera.x) / scale;
        const worldY = (e.clientY + camera.y) / scale;

        if (worldX > firstArea.x && worldX < firstArea.x + firstArea.w &&
            worldY > firstArea.y && worldY < firstArea.y + firstArea.h) {
            
            const tooClose = crops.some(c => Math.hypot(c.x - worldX, c.y - worldY) < 30);
            if (!tooClose) crops.push({ x: worldX, y: worldY });
        }
    }
});

// EVENTO DO BOTÃO (Regar)
const btnWater = document.getElementById('btn-water');
const timerUI  = document.getElementById('planting-timer');
const timerSec = document.getElementById('timer-sec');

if(btnWater) {
    btnWater.onclick = () => {
        if (isWatering) return;
        isWatering = true;
        wateringTimer = 10;
        timerUI.classList.remove('hidden');
        timerSec.textContent = wateringTimer;

        // FOCA O CENTRO DA CÂMERA NA ÁREA DE PLANTIO (Ajustado para o novo Scale)
        const scale = Math.max(W / WW, H / WH);
        camera.x = (firstArea.x + firstArea.w/2) * scale - (W/2);
        camera.y = (firstArea.y + firstArea.h/2) * scale - (H/2);

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
    // Escalonamento Cover (Tela Cheia sem preto)
    const scale = Math.max(W / WW, H / WH);
    const virtualWW = WW * scale;
    const virtualWH = WH * scale;

    // Movimentação da Câmera
    if (mouseX < W * EDGE)      camera.x -= CAM_SPEED;
    if (mouseX > W * (1 - EDGE)) camera.x += CAM_SPEED;
    if (mouseY < H * EDGE)      camera.y -= CAM_SPEED;
    if (mouseY > H * (1 - EDGE)) camera.y += CAM_SPEED;

    camera.x = Math.max(0, Math.min(camera.x, virtualWW - W));
    camera.y = Math.max(0, Math.min(camera.y, virtualWH - H));

    ctx.clearRect(0, 0, W, H);

    if (mapLoaded) {
        ctx.save();
        ctx.translate(-camera.x, -camera.y);
        ctx.scale(scale, scale);
        
        // DESENHAR MAPA ESCALONADO
        ctx.drawImage(mapImage, 0, 0);

        // GUIA DE PLANTIO
        if (isWatering) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 5;
            ctx.strokeRect(firstArea.x, firstArea.y, firstArea.w, firstArea.h);
            
            // Texto de depuração dinâmico baseado na escala
            ctx.fillStyle = "white";
            ctx.font = "14px Arial";
            ctx.fillText(`X: ${Math.round((camera.x + mouseX)/scale)} Y: ${Math.round((camera.y + mouseY)/scale)}`, (camera.x + mouseX + 15)/scale, (camera.y + mouseY)/scale);
        }

        // DESENHAR CADA TRIGO
        crops.forEach(c => {
            ctx.font = '35px Arial';
            ctx.fillText('🌾', c.x - 17, c.y + 17);
        });
        ctx.restore();
    }
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
