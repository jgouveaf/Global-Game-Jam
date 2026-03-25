// ========================= AgriCorp Game (Coordenadas Exatas) =========================
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
let isWatering = false, wateringTimer = 0, crops = [], W, H;
let WW = 2800, WH = 1400; 

const mapImage = new Image();
mapImage.src = 'sprites/Mapa.png';
let mapLoaded = false;
mapImage.onload = () => { 
    mapLoaded = true; 
    WW = mapImage.width; 
    WH = mapImage.height; 
};

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
const EDGE = 0.15, CAM_SPEED = 15;

window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

// AREA DE PLANTIO (COORDENADAS EXATAS DO USUÁRIO)
// X de 1130 até 1335 | Y de 326 até 542
const firstArea = {
    x: 1130, 
    y: 326, 
    w: 1335 - 1130, // 205
    h: 542 - 326    // 216
};

window.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('#hotbar-container') || e.target.closest('#hud-top')) return;
    
    if (isWatering && wateringTimer > 0) {
        const worldX = e.clientX + camera.x;
        const worldY = e.clientY + camera.y;

        // VERIFICA SE ESTÁ DENTRO DA ÁREA QUE VOCÊ PASSOU
        if (worldX > firstArea.x && worldX < firstArea.x + firstArea.w &&
            worldY > firstArea.y && worldY < firstArea.y + firstArea.h) {
            
            const tooClose = crops.some(c => Math.hypot(c.x - worldX, c.y - worldY) < 30);
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

        // CÂMERA FOCA NESSA ÁREA ESPECÍFICA
        camera.x = firstArea.x + (firstArea.w / 2) - (W / 2);
        camera.y = firstArea.y + (firstArea.h / 2) - (H / 2);

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
            ctx.lineWidth = 4;
            ctx.setLineDash([10, 5]);
            ctx.strokeRect(firstArea.x - camera.x, firstArea.y - camera.y, firstArea.w, firstArea.h);
            
            // Texto de depuração continua para ajudar se precisar recalibrar
            ctx.fillStyle = "white";
            ctx.font = "12px Arial";
            ctx.fillText(`X: ${Math.round(camera.x + mouseX)} Y: ${Math.round(camera.y + mouseY)}`, mouseX + 15, mouseY);
        }

        crops.forEach(c => {
            ctx.font = '35px Arial';
            ctx.fillText('🌾', c.x - camera.x - 17, c.y - camera.y + 17);
        });
    }
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
