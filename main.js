// ========================= AgriCorp Game (Final Clean Version v10.5) =========================
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

const mapImage = new Image();
mapImage.src = 'sprites/Mapa..png';
let mapLoaded = false;
let WW = 2800, WH = 1400; 

mapImage.onload = () => { mapLoaded = true; WW = mapImage.width; WH = mapImage.height; };

let W, H;
function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    W = canvas.width; H = canvas.height;
}
resize();
window.addEventListener('resize', resize);

canvas.addEventListener('dblclick', () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
});

const camera = { x: 0, y: 0 };
let mouseX = 0, mouseY = 0;
const EDGE = 0.08, CAM_SPEED = 20;
window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

// ESTADOS
var moedas = 500, sementesTrigo = 60, sementesCenoura = 30, comunidade = 80, isGameOver = false;
var harvestedTrigo = 0, harvestedCenoura = 0;
const crops = [];

// DEFINIÇÃO DOS LOTES (Coordenadas Extra-Safe reduzidas para centralização)
const lots = [
    { id: 1, name: "Terreno 1", price: 0,    minSeeds: 10, target: 'trigo',   multiplier: 1,  area: { x: 300,  y: 400, w: 600, h: 500 } },
    { id: 2, name: "Terreno 2", price: 200,  minSeeds: 20, target: 'cenoura', multiplier: 2,  area: { x: 1200, y: 200, w: 500, h: 300 } },
    { id: 3, name: "Terreno 3", price: 500,  minSeeds: 30, target: 'cenoura', multiplier: 4,  area: { x: 1800, y: 500, w: 400, h: 150 } },
    { id: 4, name: "Terreno 4", price: 850,  minSeeds: 40, target: 'trigo',   multiplier: 6,  area: { x: 2300, y: 500, w: 300, h: 150 } },
    { id: 5, name: "Terreno 5", price: 1150, minSeeds: 50, target: 'trigo',   multiplier: 8,  area: { x: 1100, y: 800, w: 500, h: 250 } },
    { id: 6, name: "Terreno 6", price: 1750, minSeeds: 60, target: 'cenoura', multiplier: 12, area: { x: 1700, y: 900, w: 600, h: 300 } }
];

let purchasedLotsStatus = [0];

// SPRITES
const trigoSprite = new Image(); trigoSprite.src = 'sprites/Trigo.png';
const cenouraSprite = new Image(); cenouraSprite.src = 'sprites/Cenoura.png';

class Crop {
    constructor(x, y, profitMultiplier, type = 'trigo') {
        this.x = x; this.y = y;
        this.type = type;
        this.stage = 0; this.timer = 0;
        this.isSeed = true; this.seedTimer = 0;
        this.multiplier = profitMultiplier;
    }
    update(dt) {
        if (this.isSeed) {
            this.seedTimer += dt;
            if (this.seedTimer > 3000) this.isSeed = false;
        } else if (this.stage < 4) {
            this.timer += dt;
            if (this.timer > 5000) { this.stage++; this.timer = 0; }
        }
    }
    draw() {
        ctx.save();
        if (this.isSeed) {
            ctx.fillStyle = '#8b4513'; ctx.beginPath(); ctx.arc(this.x - camera.x, this.y - camera.y, 4, 0, Math.PI * 2); ctx.fill();
        } else {
            const sprite = (this.type === 'trigo') ? trigoSprite : cenouraSprite;
            if (sprite.complete && sprite.naturalWidth > 0) {
                const isTrigo = this.type === 'trigo';
                const fw = sprite.width / (isTrigo ? 2 : 1);
                const fh = sprite.height / (isTrigo ? 3 : 1);
                let sx = 0, sy = 0;
                if (isTrigo) { sx = (this.stage % 2) * fw; sy = Math.floor(this.stage / 2) * fh; }
                
                let scalePulse = (this.stage === 4) ? 1.0 + Math.sin(Date.now() / 300) * 0.05 : 1.0;
                ctx.translate(this.x - camera.x, this.y - camera.y);
                ctx.scale(scalePulse, scalePulse);
                ctx.drawImage(sprite, sx, sy, fw, fh, -fw / 2, -fh, fw, fh);
            }
        }
        ctx.restore();
    }
}

// INVENTÁRIO & ANIMAIS
var inventoryProducts = { ovos: 0, carne: 0 };
const animalsOnMap = [];
const animalSprites = { pato: new Image(), galinha: new Image(), coelho: new Image(), ovelha: new Image(), porco: new Image(), cavalo: new Image() };
animalSprites.pato.src='sprites/Pato.png'; animalSprites.galinha.src='sprites/Galinha.png'; animalSprites.coelho.src='sprites/Coelho.png';
animalSprites.ovelha.src='sprites/Ovelha.png'; animalSprites.porco.src='sprites/Porco.png'; animalSprites.cavalo.src='sprites/Cavalo.png';

class Animal {
    constructor(type, x, y) {
        this.type = type; this.x = x; this.y = y; this.frame = 0; this.nextFrameTime = 0;
        this.vx = 0; this.vy = 0; this.moveTimer = 0;
    }
    update(dt) {
        this.nextFrameTime += dt;
        if (this.nextFrameTime > 300) { this.frame = (this.frame + 1) % 2; this.nextFrameTime = 0; }
        this.moveTimer -= dt;
        if (this.moveTimer <= 0) {
            this.vx = (Math.random() - 0.5) * 1.5; this.vy = (Math.random() - 0.5) * 1.5;
            this.moveTimer = 2000 + Math.random() * 3000;
        }
        this.x += this.vx; this.y += this.vy;
        this.x = Math.max(100, Math.min(this.x, WW - 100));
        this.y = Math.max(100, Math.min(this.y, WH - 100));
    }
    draw() {
        const img = animalSprites[this.type];
        if (img.complete && img.naturalWidth > 0) {
            const fw = img.width, fh = img.height / 2;
            ctx.drawImage(img, 0, this.frame * fh, fw, fh, this.x - camera.x - fw/2, this.y - camera.y - fh/2, fw, fh);
        }
    }
}

function updateHUD() {
    const hpBar = document.getElementById('hp-bar');
    if(hpBar) hpBar.style.width = comunidade + '%';
    document.getElementById('hud-value').textContent = Math.round(comunidade);
    document.getElementById('hud-coins-value').textContent = Math.round(moedas);
    document.getElementById('hud-seeds-value').textContent = sementesTrigo + sementesCenoura;
    document.getElementById('hud-harvest-value').textContent = harvestedTrigo + harvestedCenoura;
    if (comunidade <= 0 && !isGameOver) { isGameOver = true; document.getElementById('game-over-overlay').classList.remove('hidden'); }
}

function updateInventory() {
    const seedList = document.getElementById('inv-seeds-list');
    if (seedList) seedList.innerHTML = `<div class="inv-item">🌾 Trigo: ${sementesTrigo} | 🥕 Cenoura: ${sementesCenoura}</div>`;
}

window.buySeeds = (type, price) => {
    if (moedas >= price) {
        moedas -= price;
        if (type === 'trigo') sementesTrigo += 5; else sementesCenoura += 5;
        updateHUD(); updateInventory();
    } else alert("Sem moedas!");
};

function renderLots() {
    const container = document.getElementById('lots-container');
    if(!container) return;
    container.innerHTML = '';
    lots.forEach((lot, index) => {
        const isPurchased = purchasedLotsStatus.includes(index);
        const lotDiv = document.createElement('div');
        lotDiv.className = 'shop-card';
        lotDiv.style.background = isPurchased ? 'rgba(46, 204, 113, 0.2)' : 'rgba(0,0,0,0.5)';
        lotDiv.style.border = isPurchased ? '3px solid #2ecc71' : '3px solid #555';
        lotDiv.style.padding = '10px'; lotDiv.style.textAlign = 'center';
        lotDiv.innerHTML = `
            <img src="sprites/Lote${lot.id}.png" style="width: 50px; height: 50px; image-rendering: pixelated; margin-bottom: 5px;">
            <p style="color: #ffd700; font-size: 8px; font-family:'Press Start 2P';">${lot.name}</p>
            <p style="font-size: 7px; color:#fff;">Planta: ${lot.target.toUpperCase()} (x${lot.multiplier})</p>
            <button id="buy-lot-${index}" style="width: 100%; padding: 5px; font-family: 'Press Start 2P'; font-size: 6px; cursor: pointer; background: ${isPurchased ? '#27ae60' : '#8b4513'}; color: #fff;">
                ${isPurchased ? 'OK' : '💰 ' + lot.price}
            </button>
        `;
        container.appendChild(lotDiv);
        if (!isPurchased) {
            document.getElementById(`buy-lot-${index}`).onclick = () => {
                if (moedas >= lot.price) {
                    moedas -= lot.price; purchasedLotsStatus.push(index);
                    updateHUD(); renderLots();
                } else alert('Moedas insuficientes!');
            };
        }
    });
}

window.onload = () => {
    console.log("AgriCorp v10.5 Initializing... [Black Bars Fix]");
    const bind = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
    bind('btn-open-shop', () => document.getElementById('shop-overlay').classList.remove('hidden'));
    bind('btn-shop-voltar', () => document.getElementById('shop-overlay').classList.add('hidden'));
    bind('btn-open-inventory', () => document.getElementById('inventory-overlay').classList.remove('hidden'));
    bind('btn-inv-voltar', () => document.getElementById('inventory-overlay').classList.add('hidden'));
    bind('btn-open-lots', () => { renderLots(); document.getElementById('lots-overlay').classList.remove('hidden'); });
    bind('btn-lots-voltar', () => document.getElementById('lots-overlay').classList.add('hidden'));

    bind('btn-water', () => {
        purchasedLotsStatus.forEach(idx => {
            const lot = lots[idx];
            const a = lot.area;
            const spacing = 100; 
            for (let yy = a.y; yy < a.y + a.h; yy += spacing) {
                for (let xx = a.x; xx < a.x + a.w; xx += spacing) {
                    const type = lot.target;
                    const canPlant = (type === 'trigo' && sementesTrigo > 0) || (type === 'cenoura' && sementesCenoura > 0);
                    if (canPlant && !crops.some(c => Math.hypot(c.x-xx, c.y-yy) < 50)) {
                        crops.push(new Crop(xx, yy, lot.multiplier, type));
                        if(type === 'trigo') sementesTrigo--; else sementesCenoura--;
                    }
                }
            }
        });
        updateHUD(); updateInventory();
    });

    setInterval(() => { if (!isGameOver) { comunidade -= 0.2; updateHUD(); } }, 1000);
    updateHUD(); updateInventory(); renderLots();
};

let lastTime = performance.now();
function loop(now){
    const dt = now - lastTime; lastTime = now;
    if (mouseX < W * EDGE) camera.x -= CAM_SPEED;
    if (mouseX > W * (1 - EDGE)) camera.x += CAM_SPEED;
    if (mouseY < H * EDGE) camera.y -= CAM_SPEED;
    if (mouseY > H * (1 - EDGE)) camera.y += CAM_SPEED;
    camera.x = Math.max(0, Math.min(camera.x, WW - W));
    camera.y = Math.max(0, Math.min(camera.y, WH - H));
    
    // FORÇAR FUNDO PRETO ANTES DE DESENHAR O MAPA
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    if (mapLoaded) {
        ctx.drawImage(mapImage, -camera.x, -camera.y);
        for (let i = crops.length - 1; i >= 0; i--) {
            const c = crops[i]; c.update(dt); c.draw();
            if (c.stage === 4) {
                const yieldMultiplier = 2; // Regra: cada semente gera 2 unidades
                const basePrice = (c.type === 'trigo' ? 5 : 10);
                const totalGain = (basePrice * c.multiplier) * yieldMultiplier;
                
                if (c.type === 'trigo') harvestedTrigo += yieldMultiplier; 
                else harvestedCenoura += yieldMultiplier;
                
                moedas += totalGain; 
                crops.splice(i, 1); 
                updateHUD();
            }
        }
    }
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
