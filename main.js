// ========================= AgriCorp Game (Final Clean Version v10.2) =========================
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

const camera = { x: 300, y: 150 };
let mouseX = 0, mouseY = 0;
const EDGE = 0.08, CAM_SPEED = 18;
window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

// ESTADOS
var moedas = 500, sementesTrigo = 60, sementesCenoura = 30, comunidade = 80, isGameOver = false;
var harvestedTrigo = 0, harvestedCenoura = 0;
const crops = [];

// DEFINIÇÃO DAS ÁREAS DOS LOTES (Coordenadas Reais do Mapa..png)
const lots = [
    { id: 1, name: "Terreno 1", price: 0,    minSeeds: 10, multiplier: 1,  area: { x: 45,   y: 285, w: 250, h: 512 } }, // Esquerda Superior
    { id: 2, name: "Terreno 2", price: 200,  minSeeds: 20, multiplier: 2,  area: { x: 326,  y: 155, w: 185, h: 518 } }, // Centro Superior
    { id: 3, name: "Terreno 3", price: 500,  minSeeds: 30, multiplier: 4,  area: { x: 502,  y: 440, w: 215, h: 285 } }, // Centro estrada
    { id: 4, name: "Terreno 4", price: 850,  minSeeds: 40, multiplier: 6,  area: { x: 740,  y: 442, w: 142, h: 308 } }, // Direita estrada
    { id: 5, name: "Terreno 5", price: 1150, minSeeds: 50, multiplier: 8,  area: { x: 298,  y: 775, w: 205, h: 420 } }, // Inferior Esq.
    { id: 6, name: "Terreno 6", price: 1750, minSeeds: 60, multiplier: 12, area: { x: 1580, y: 580, w: 900, h: 540 } }  // Campo Grande Dir.
];

let purchasedLotsStatus = [0];

// SPRITES
const trigoSprite = new Image(); trigoSprite.src = 'sprites/Trigo.png';
const cenouraSprite = new Image(); cenouraSprite.src = 'sprites/Cenoura.png';

class Crop {
    constructor(x, y, multiplier, type = 'trigo') {
        this.x = x; this.y = y;
        this.type = type;
        this.stage = 0; this.timer = 0;
        this.isSeed = true; this.seedTimer = 0;
        this.multiplier = multiplier;
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
                ctx.drawImage(sprite, sx, sy, fw, fh, -fw, -fh * 2, fw * 2, fh * 2);
            } else {
                ctx.font = '16px Arial';
                ctx.fillText(this.type === 'trigo' ? '🌾' : '🥕', this.x - camera.x - 10, this.y - camera.y);
            }
        }
        ctx.restore();
    }
}

// INVENTÁRIO
var inventoryProducts = { ovos: 0, carne: 0 };
const animalsOnMap = [], animalsUnlocked = ['pato'];
const unlockOrder = ['pato', 'coelho', 'ovelha', 'galinha', 'porco', 'cavalo'];
const animalSprites = { 
    pato: new Image(), galinha: new Image(), coelho: new Image(), 
    ovelha: new Image(), porco: new Image(), cavalo: new Image() 
};
animalSprites.pato.src = 'sprites/Pato.png';
animalSprites.galinha.src = 'sprites/Galinha.png';
animalSprites.coelho.src = 'sprites/Coelho.png';
animalSprites.ovelha.src = 'sprites/Ovelha.png';
animalSprites.porco.src = 'sprites/Porco.png';
animalSprites.cavalo.src = 'sprites/Cavalo.png';

class Animal {
    constructor(type, x, y) {
        this.type = type; this.x = x; this.y = y;
        this.frame = 0; this.nextFrameTime = 0; this.productionTimer = 0;
        this.productionInterval = 5000 + Math.random() * 5000;
        this.vx = 0; this.vy = 0; this.moveTimer = 0;
    }
    update(dt) {
        this.nextFrameTime += dt;
        if (this.nextFrameTime > 300) { this.frame = (this.frame + 1) % 2; this.nextFrameTime = 0; }
        this.productionTimer += dt;
        if (this.productionTimer >= this.productionInterval) { this.produce(); this.productionTimer = 0; }
        this.moveTimer -= dt;
        if (this.moveTimer <= 0) {
            if (Math.random() > 0.4) { this.vx = (Math.random() - 0.5) * 1.5; this.vy = (Math.random() - 0.5) * 1.5; }
            else { this.vx = 0; this.vy = 0; }
            this.moveTimer = 2000 + Math.random() * 3000;
        }
        this.x += this.vx; this.y += this.vy;
        const margin = 100;
        this.x = Math.max(margin, Math.min(this.x, WW - margin));
        this.y = Math.max(margin, Math.min(this.y, WH - margin));
    }
    produce() {
        if (this.type === 'pato' || this.type === 'galinha') inventoryProducts.ovos++;
        else if (this.type !== 'cavalo') inventoryProducts.carne++;
        updateInventory();
    }
    draw() {
        const img = animalSprites[this.type];
        if (img.complete && img.naturalWidth > 0) {
            const fw = img.width, fh = img.height / 2;
            ctx.drawImage(img, 0, this.frame * fh, fw, fh, this.x - camera.x - fw/2, this.y - camera.y - fh/2, fw, fh);
        } else {
            ctx.font = '24px Arial';
            ctx.fillText({pato:'🦆', galinha:'🐔', coelho:'🐇', ovelha:'🐑', porco:'🐖', cavalo:'🐎'}[this.type] || '🐾', this.x - camera.x - 12, this.y - camera.y + 12);
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

window.sellItem = (type) => {
    if (inventoryProducts[type] <= 0) return;
    inventoryProducts[type]--;
    const gain = type === 'ovos' ? 10 : 25;
    moedas += gain * 2; comunidade = Math.min(100, comunidade + gain);
    updateHUD(); updateInventory();
};

window.buySeeds = (type, price) => {
    if (moedas >= price) {
        moedas -= price;
        if (type === 'trigo') sementesTrigo += 5; else sementesCenoura += 5;
        updateHUD(); updateInventory();
    } else alert("Sem moedas!");
};

window.buyAnimal = (type, price) => {
    if (moedas >= price) {
        moedas -= price;
        animalsOnMap.push(new Animal(type, camera.x + 400 + Math.random()*200, camera.y + 400 + Math.random()*200));
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
        lotDiv.style.padding = '15px'; lotDiv.style.textAlign = 'center';
        lotDiv.innerHTML = `
            <img src="sprites/Lote${lot.id}.png" style="width: 80px; height: 80px; image-rendering: pixelated; margin-bottom: 5px;">
            <h3 style="color: #ffd700; font-size: 10px; font-family:'Press Start 2P';">${lot.name}</h3>
            <p style="font-size: 7px; margin: 5px 0;">Multiplicador: x${lot.multiplier}</p>
            <p style="font-size: 7px; color: #aaa;">Sementes: ${lot.minSeeds}</p>
            <button id="buy-lot-${index}" style="width: 100%; border: 2px solid #fff; padding: 10px; font-family: 'Press Start 2P'; font-size: 6px; cursor: pointer; background: ${isPurchased ? '#27ae60' : '#8b4513'}; color: #fff;">
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
    console.log("AgriCorp v10.2 Initializing...");
    const bind = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
    bind('btn-open-shop', () => document.getElementById('shop-overlay').classList.remove('hidden'));
    bind('btn-shop-voltar', () => document.getElementById('shop-overlay').classList.add('hidden'));
    bind('btn-open-inventory', () => document.getElementById('inventory-overlay').classList.remove('hidden'));
    bind('btn-inv-voltar', () => document.getElementById('inventory-overlay').classList.add('hidden'));
    bind('btn-buy-seed', () => { if (moedas >= 10) { moedas -= 10; sementesTrigo += 5; updateHUD(); updateInventory(); } else alert("Sem moedas!"); });
    bind('btn-open-lots', () => { renderLots(); document.getElementById('lots-overlay').classList.remove('hidden'); });
    bind('btn-lots-voltar', () => document.getElementById('lots-overlay').classList.add('hidden'));

    bind('btn-water', () => {
        let plantedCount = 0;
        purchasedLotsStatus.forEach(idx => {
            const a = lots[idx].area; const spacing = 110;
            for (let yy = a.y + 40; yy < a.y + a.h - 40; yy += spacing) {
                for (let xx = a.x + 40; xx < a.x + a.w - 40; xx += spacing) {
                    if ((sementesTrigo > 0 || sementesCenoura > 0) && !crops.some(c => Math.hypot(c.x-xx, c.y-yy) < 50)) {
                        const type = sementesTrigo > 0 ? 'trigo' : 'cenoura';
                        crops.push(new Crop(xx, yy, lots[idx].multiplier, type));
                        if(type === 'trigo') sementesTrigo--; else sementesCenoura--;
                        plantedCount++;
                    }
                }
            }
        });
        updateHUD(); updateInventory();
    });

    setInterval(() => { if (!isGameOver) { comunidade -= 0.3; updateHUD(); } }, 1000);
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
    
    ctx.clearRect(0, 0, W, H);
    if (mapLoaded) {
        ctx.drawImage(mapImage, -camera.x, -camera.y);
        for (let i = crops.length - 1; i >= 0; i--) {
            const c = crops[i]; c.update(dt); c.draw();
            if (c.stage === 4) {
                const gain = 2 * c.multiplier;
                if (c.type === 'trigo') harvestedTrigo += 2; else harvestedCenoura += 2;
                moedas += gain; crops.splice(i, 1); updateHUD();
            }
        }
    }
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
