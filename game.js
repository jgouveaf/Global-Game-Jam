// ========================= AgriCorp Game (VERSÃO VALIDADA) =========================
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

let coins = 100, seeds = 10, harvestedWheat = 0, crops = [];
let isWatering = false, wateringTimer = 0, W, H, WW = 2800, WH = 1400, mapLoaded = false;

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
let mouseX = 0, mouseY = 0, CAM_SPEED = 22;

function updateHUD() {
    document.getElementById('hud-coins-value').textContent = coins;
    document.getElementById('hud-seeds-value').textContent = seeds;
    document.getElementById('hud-harvest-value').textContent = harvestedWheat;
}

// LOJA E AVISO
function showWarning() {
    const w = document.getElementById('money-warning');
    w.classList.remove('hidden');
    setTimeout(() => w.classList.add('hidden'), 2000);
}

document.getElementById('btn-buy-seed').onclick = (e) => {
    e.stopPropagation();
    if (coins >= 10) { coins -= 10; seeds += 1; updateHUD(); }
    else { showWarning(); }
};

document.getElementById('btn-open-shop').onclick = (e) => { e.stopPropagation(); document.getElementById('shop-overlay').classList.remove('hidden'); };
document.getElementById('btn-close-shop').onclick = (e) => { e.stopPropagation(); document.getElementById('shop-overlay').classList.add('hidden'); };

// PLANTIO (PointerDown é mais garantido que MouseDown)
canvas.addEventListener('pointerdown', (e) => {
    if (!isWatering || wateringTimer <= 0) return;

    const scale = Math.max(W / WW, H / WH);
    const worldX = (e.clientX + camera.x) / scale;
    const worldY = (e.clientY + camera.y) / scale;

    // Se clicar dentro da área alvo
    if (worldX > farmField.x && worldX < farmField.x + farmField.w &&
        worldY > farmField.y && worldY < farmField.y + farmField.h) {
        
        if (seeds > 0) {
            const overlap = crops.some(c => Math.hypot(c.x - worldX, c.y - worldY) < 30);
            if (!overlap) {
                crops.push({ x: worldX, y: worldY, age: 0, state: 'seedling' });
                seeds -= 1;
                updateHUD();
            }
        }
    }
});

// REGAR
document.getElementById('btn-water').onclick = (e) => {
    e.stopPropagation();
    if (isWatering) return;
    isWatering = true;
    wateringTimer = 10;
    document.getElementById('planting-timer').classList.remove('hidden');

    const scale = Math.max(W / WW, H / WH);
    camera.x = (farmField.x + farmField.w/2) * scale - (W/2);
    camera.y = (farmField.y + farmField.h/2) * scale - (H/2);

    const countdown = setInterval(() => {
        wateringTimer--;
        document.getElementById('timer-sec').textContent = wateringTimer;
        if (wateringTimer <= 0) {
            clearInterval(countdown);
            isWatering = false;
            document.getElementById('planting-timer').classList.add('hidden');
        }
    }, 1000);
};

window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

let lastTime = Date.now();
function loop(){
    const dt = (Date.now() - lastTime) / 1000;
    lastTime = Date.now();

    const scale = Math.max(W / WW, H / WH);
    const virtualWW = WW * scale, virtualWH = WH * scale;

    const EDGE = 0.12;
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
        ctx.drawImage(mapImage, 0, 0);

        if (isWatering) {
            ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 4;
            ctx.strokeRect(farmField.x, farmField.y, farmField.w, farmField.h);
        }

        // CRESCIMENTO E COLHEITA
        for (let i = crops.length - 1; i >= 0; i--) {
            let p = crops[i];
            p.age += dt;

            // ESTADO: MUDA (0-10s)
            if (p.age < 10) {
                ctx.font = '28px Arial';
                ctx.fillText('🌱', p.x - 14, p.y + 14);
            } 
            // ESTADO: COLHEITA (10-12s - Fica visível antes de sumir)
            else if (p.age < 12) {
                ctx.font = '38px Arial';
                ctx.fillText('🌾', p.x - 19, p.y + 19);
            }
            // FINALIZA: VAI PRO INVENTÁRIO
            else {
                crops.splice(i, 1);
                harvestedWheat += 1;
                updateHUD();
            }
        }
        ctx.restore();
    }
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
updateHUD();
