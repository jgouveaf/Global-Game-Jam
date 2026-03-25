// ========================= AgriCorp Game (LOJA DA FAZENDA COMPLETA) =========================
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

let coins = 100, seeds = 10, crops = [], isWatering = false, wateringTimer = 0;
let W, H, WW = 2800, WH = 1400, mapLoaded = false;

const mapImage = new Image();
mapImage.src = 'sprites/Mapa.png';
mapImage.onload = () => { mapLoaded = true; WW = mapImage.width; WH = mapImage.height; };

const farmField = { x: 1130, y: 326, w: 205, h: 216 };

function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    W = canvas.width; H = canvas.height;
}
resize();
window.addEventListener('resize', resize);

const camera = { x: 0, y: 0 };
let mouseX = 0, mouseY = 0, CAM_SPEED = 20;

function updateHUD() {
    document.getElementById('hud-coins-value').textContent = coins;
    document.getElementById('hud-seeds-value').textContent = seeds;
}

// BOTÃO COMPRAR (Semente)
const btnBuySeed = document.getElementById('btn-buy-seed');
if (btnBuySeed) {
    btnBuySeed.onclick = (e) => {
        e.stopPropagation();
        if (coins >= 10) {
            coins -= 10;
            seeds += 1;
            updateHUD();
        }
    };
}

// BOTOES HUD (LOJA)
const btnOpenShop = document.getElementById('btn-open-shop');
const btnCloseShop = document.getElementById('btn-close-shop');
const shopOverlay = document.getElementById('shop-overlay');

if (btnOpenShop) btnOpenShop.onclick = (e) => { e.stopPropagation(); shopOverlay.classList.remove('hidden'); };
if (btnCloseShop) btnCloseShop.onclick = (e) => { e.stopPropagation(); shopOverlay.classList.add('hidden'); };

// BOTÃO REGAR
document.getElementById('btn-water').onclick = (e) => {
    e.stopPropagation();
    if (isWatering) return;
    isWatering = true;
    wateringTimer = 10;
    const timerUI = document.getElementById('planting-timer');
    timerUI.classList.remove('hidden');

    const scale = Math.max(W / WW, H / WH);
    camera.x = (farmField.x + farmField.w/2) * scale - (W/2);
    camera.y = (farmField.y + farmField.h/2) * scale - (H/2);

    const countdown = setInterval(() => {
        wateringTimer--;
        document.getElementById('timer-sec').textContent = wateringTimer;
        if (wateringTimer <= 0) {
            clearInterval(countdown);
            isWatering = false;
            timerUI.classList.add('hidden');
        }
    }, 1000);
};

// CLICK GERAL (Plantio)
window.addEventListener('mousedown', (e) => {
    const scale = Math.max(W / WW, H / WH);
    if (e.target.tagName === 'BUTTON' || e.target.closest('#hud-top') || e.target.closest('#stats-container') || e.target.closest('#shop-overlay') || e.target.closest('#inventory-overlay')) return;

    if (isWatering && wateringTimer > 0) {
        const worX = (e.clientX + camera.x) / scale;
        const worY = (e.clientY + camera.y) / scale;

        if (worX > farmField.x && worX < farmField.x + farmField.w &&
            worY > farmField.y && worY < farmField.y + farmField.h) {
            
            if (seeds > 0) {
                const block = crops.some(c => Math.hypot(c.x - worX, c.y - worY) < 35);
                if (!block) {
                    crops.push({ x: worX, y: worY });
                    seeds -= 1;
                    updateHUD();
                }
            }
        }
    }
});

window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

function loop(){
    const scale = Math.max(W / WW, H / WH);
    const virtualWW = WW * scale, virtualWH = WH * scale;

    const EDGE = 0.12;
    if (mouseX < W * EDGE) camera.x -= CAM_SPEED;
    if (mouseX > W * (1 - EDGE)) camera.x += CAM_SPEED;
    if (mouseY < H * EDGE) camera.y -= CAM_SPEED;
    if (mouseY > H * (1 - EDGE)) camera.y += CAM_SPEED;

    camera.x = Math.max(0, Math.min(camera.x, virtualWW - W));
    camera.y = Math.max(0, Math.min(camera.y, virtualWH - H));

    ctx.clearRect(0, 0, W, H);
    if (mapLoaded) {
        ctx.save();
        ctx.translate(-camera.x, -camera.y);
        ctx.scale(scale, scale);
        ctx.drawImage(mapImage, 0, 0);
        if (isWatering) {
            ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 4;
            ctx.strokeRect(farmField.x, farmField.y, farmField.w, farmField.h);
        }
        crops.forEach(c => {
            ctx.font = '35px Arial';
            ctx.fillText('🌾', c.x - 17, c.y + 17);
        });
        ctx.restore();
    }
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
updateHUD();
