// ========================= AgriCorp Game (MOTOR COM CICLO DE COLHEITA) =========================
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ESTADO DO JOGADOR
let coins = 100, seeds = 10, harvestedWheat = 0;
let crops = []; // {x, y, age: 0}
let isWatering = false, wateringTimer = 0;

const mapImage = new Image();
mapImage.src = 'sprites/Mapa.png';
let mapLoaded = false, W, H, WW = 2800, WH = 1400;

mapImage.onload = () => { mapLoaded = true; WW = mapImage.width; WH = mapImage.height; };

function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    W = canvas.width; H = canvas.height;
}
resize();
window.addEventListener('resize', resize);

const camera = { x: 0, y: 0 };
let mouseX = 0, mouseY = 0, CAM_SPEED = 20;

const farmField = { x: 1130, y: 326, w: 205, h: 216 };

function updateHUD() {
    document.getElementById('hud-coins-value').textContent = coins;
    document.getElementById('hud-seeds-value').textContent = seeds;
    document.getElementById('hud-harvest-value').textContent = harvestedWheat;
}

// AVISO DE DINHEIRO
function showNoMoneyWarning() {
    const warning = document.getElementById('money-warning');
    warning.classList.remove('hidden');
    setTimeout(() => { warning.classList.add('hidden'); }, 2000);
}

// LOJA
document.getElementById('btn-buy-seed').onclick = (e) => {
    e.stopPropagation();
    if (coins >= 10) {
        coins -= 10;
        seeds += 1;
        updateHUD();
    } else {
        showNoMoneyWarning();
    }
};

const shopOverlay = document.getElementById('shop-overlay');
document.getElementById('btn-open-shop').onclick = (e) => { e.stopPropagation(); shopOverlay.classList.remove('hidden'); };
document.getElementById('btn-close-shop').onclick = (e) => { e.stopPropagation(); shopOverlay.classList.add('hidden'); };

// PLANTIO (🌱)
window.addEventListener('mousedown', (e) => {
    const scale = Math.max(W / WW, H / WH);
    if (e.target.tagName === 'BUTTON' || e.target.closest('#hud-top') || e.target.closest('#stats-container') || e.target.closest('#shop-overlay')) return;

    if (isWatering && wateringTimer > 0) {
        const worX = (e.clientX + camera.x) / scale;
        const worY = (e.clientY + camera.y) / scale;

        if (worX > farmField.x && worX < farmField.x + farmField.w &&
            worY > farmField.y && worY < farmField.y + farmField.h) {
            
            if (seeds > 0) {
                const dist = 35; 
                const block = crops.some(c => Math.hypot(c.x - worX, c.y - worY) < dist);
                if (!block) {
                    // CRIA UMA MUDA (Idade começa em 0)
                    crops.push({ x: worX, y: worY, age: 0 });
                    seeds -= 1;
                    updateHUD();
                }
            }
        }
    }
});

// BOTÃO REGAR
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
    const now = Date.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

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

        // LÓGICA DE CRESCIMENTO E COLHEITA
        for (let i = crops.length - 1; i >= 0; i--) {
            let p = crops[i];
            p.age += dt; // Incrementa a idade do trigo em segundos

            // Se for jovem (< 10s), desenha uma mudinha
            if (p.age < 10) {
                ctx.font = '25px Arial';
                ctx.fillText('🌱', p.x - 12, p.y + 12);
            } 
            // Se já cresceu (>= 10s), desenha trigo dourado e colhe!
            else {
                ctx.font = '35px Arial';
                ctx.fillText('🌾', p.x - 17, p.y + 17);
                
                // Colheita automática: some do mapa e vai pro inventário
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
