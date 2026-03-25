// ========================= AgriCorp Game (Final Clean Version v10.1) =========================
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

// Função Tela Cheia
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
    }
}
canvas.addEventListener('dblclick', toggleFullScreen);

const camera = { x: 400, y: 200 };
let mouseX = 0, mouseY = 0;
const EDGE = 0.1, CAM_SPEED = 15;
window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

// ESTADOS
var moedas = 500, sementesTrigo = 60, sementesCenoura = 30, comunidade = 80, isGameOver = false;
var harvestedTrigo = 0, harvestedCenoura = 0;
const crops = [];

// DEFINIÇÃO DAS ÁREAS DOS LOTES (Coordenadas reais no Mapa..png)
const lots = [
    { id: 1, name: "Terreno 1", price: 0,    minSeeds: 10, multiplier: 1,  area: { x: 50,   y: 230, w: 250, h: 420 } },
    { id: 2, name: "Terreno 2", price: 200,  minSeeds: 20, multiplier: 2,  area: { x: 330,  y: 130, w: 180, h: 520 } },
    { id: 3, name: "Terreno 3", price: 500,  minSeeds: 30, multiplier: 4,  area: { x: 50,   y: 770, w: 220, h: 420 } },
    { id: 4, name: "Terreno 4", price: 850,  minSeeds: 40, multiplier: 6,  area: { x: 290,  y: 780, w: 210, h: 410 } },
    { id: 5, name: "Terreno 5", price: 1150, minSeeds: 50, multiplier: 8,  area: { x: 1440, y: 530, w: 220, h: 810 } },
    { id: 6, name: "Terreno 6", price: 1750, minSeeds: 60, multiplier: 12, area: { x: 2090, y: 530, w: 420, h: 810 } }
];

let purchasedLotsStatus = [0]; // Começa com o Terreno 1 desbloqueado

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
                ctx.save(); ctx.translate(this.x - camera.x, this.y - camera.y); ctx.scale(scalePulse, scalePulse);
                ctx.drawImage(sprite, sx, sy, fw, fh, -fw, -fh * 2, fw * 2, fh * 2); ctx.restore();
            } else {
                ctx.font = '20px Arial'; ctx.fillText(this.type === 'trigo' ? '🌾' : '🥕', this.x - camera.x - 10, this.y - camera.y);
            }
        }
    }
}

// ANIMAIS
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
            const em = {pato:'🦆', galinha:'🐔', coelho:'🐇', ovelha:'🐑', porco:'🐖', cavalo:'🐎'};
            ctx.fillText(em[this.type] || '🐾', this.x - camera.x - 12, this.y - camera.y + 12);
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
    
    if (comunidade <= 0 && !isGameOver) {
        isGameOver = true;
        document.getElementById('game-over-overlay').classList.remove('hidden');
    }
}

function updateInventory() {
    const seedList = document.getElementById('inv-seeds-list');
    if (seedList) seedList.innerHTML = `<div class="inv-item">🌾 Trigo: ${sementesTrigo} | 🥕 Cenoura: ${sementesCenoura}</div>`;
    
    const list = document.getElementById('inv-animals-list');
    if (list) {
        const counts = {}; animalsOnMap.forEach(a => counts[a.type] = (counts[a.type] || 0) + 1);
        list.innerHTML = '';
        if (animalsOnMap.length === 0) list.innerHTML = '<div class="inv-item">Nenhum comprado</div>';
        else {
            for (const [type, count] of Object.entries(counts)) {
                const div = document.createElement('div'); div.className = 'inv-item';
                div.innerHTML = `${type.toUpperCase()}: ${count}`; list.appendChild(div);
            }
        }
    }
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
        lotDiv.style.background = isPurchased ? 'rgba(46, 204, 113, 0.2)' : '#1a1a1a';
        lotDiv.style.border = isPurchased ? '3px solid #2ecc71' : '3px solid #555';
        lotDiv.style.padding = '15px'; lotDiv.style.borderRadius = '8px';
        lotDiv.style.display = 'flex'; lotDiv.style.flexDirection = 'column'; lotDiv.style.gap = '10px';
        lotDiv.style.fontFamily = "'Press Start 2P'"; lotDiv.style.textAlign = 'center';
        lotDiv.innerHTML = `
            <div style="width: 100%; height: 60px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); border: 2px solid #444; border-radius: 4px;">
                <img src="sprites/Lote${lot.id}.png" style="max-width: 100%; max-height: 100%; image-rendering: pixelated;">
            </div>
            <h3 style="color: #ffd700; font-size: 10px;">${lot.name}</h3>
            <p style="font-size: 6px;">Multiplicador: x${lot.multiplier}</p>
            <p style="font-size: 6px; color: #aaa;">Sementes necessárias: ${lot.minSeeds}</p>
            <p style="font-size: 6px; color: #0f0;">Preço: ${lot.price}</p>
            <button id="buy-lot-${index}" style="width: 100%; border: 2px solid #fff; padding: 10px; font-family: 'Press Start 2P'; font-size: 6px; cursor: pointer; background: ${isPurchased ? '#27ae60' : '#8b4513'}; color: #fff;">
                ${isPurchased ? 'DESBLOQUEADO' : 'COMPRAR'}
            </button>
        `;
        container.appendChild(lotDiv);
        if (!isPurchased) {
            document.getElementById(`buy-lot-${index}`).addEventListener('click', () => {
                if (moedas >= lot.price) {
                    moedas -= lot.price; purchasedLotsStatus.push(index);
                    updateHUD(); renderLots();
                } else alert('Moedas insuficientes!');
            });
        }
    });
}

window.onload = () => {
    console.log("AgriCorp v10.1 Initializing...");
    const bind = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
    bind('btn-open-shop', () => document.getElementById('shop-overlay').classList.remove('hidden'));
    bind('btn-shop-voltar', () => document.getElementById('shop-overlay').classList.add('hidden'));
    bind('btn-open-inventory', () => document.getElementById('inventory-overlay').classList.remove('hidden'));
    bind('btn-inv-voltar', () => document.getElementById('inventory-overlay').classList.add('hidden'));
    bind('btn-buy-seed', () => { if (moedas >= 10) { moedas -= 10; sementesTrigo += 5; updateHUD(); updateInventory(); } else alert("Sem moedas!"); });
    bind('btn-open-lots', () => { renderLots(); document.getElementById('lots-overlay').classList.remove('hidden'); });
    
    bind('btn-water', () => {
        let plantedTotal = 0;
        purchasedLotsStatus.forEach(idx => {
            const lot = lots[idx]; const area = lot.area; const spacing = 110;
            for (let yy = area.y + 40; yy < area.y + area.h - 40; yy += spacing) {
                for (let xx = area.x + 40; xx < area.x + area.w - 40; xx += spacing) {
                    const hasSeed = sementesTrigo > 0 || sementesCenoura > 0;
                    if (hasSeed && !crops.some(c => Math.hypot(c.x - xx, c.y - yy) < 50)) {
                        const type = sementesTrigo > 0 ? 'trigo' : 'cenoura';
                        crops.push(new Crop(xx, yy, lot.multiplier, type));
                        if (type === 'trigo') sementesTrigo--; else sementesCenoura--;
                        plantedTotal++;
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
                const yieldAmount = 2;
                if (c.type === 'trigo') harvestedTrigo += yieldAmount; else harvestedCenoura += yieldAmount;
                moedas += yieldAmount * c.multiplier; crops.splice(i, 1); updateHUD();
            }
        }
    }
    animalsOnMap.forEach(a => { a.update(dt); a.draw(); });
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
