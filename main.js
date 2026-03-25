// ========================= AgriCorp Game (Final Clean Version v10) =========================
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

const camera = { x: 1300, y: 450 };
let mouseX = 0, mouseY = 0;
const EDGE = 0.15, CAM_SPEED = 10;
window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

// ESTADOS
var moedas = 500, sementesTrigo = 60, comunidade = 80, isGameOver = false, harvestedTrigo = 0;
const crops = [], blueField = { x: 1580, y: 580, w: 900, h: 540 };

// SISTEMA DE LOTES
let currentLotIndex = 0;
let purchasedLotsStatus = [0]; // Lote 1 já começa comprado

const lots = [
    { id: 1, price: 0, minSeeds: 20, multiplier: 1, name: "Lote 1" },
    { id: 2, price: 200, minSeeds: 25, multiplier: 2, name: "Lote 2" },
    { id: 3, price: 500, minSeeds: 35, multiplier: 4, name: "Lote 3" },
    { id: 4, price: 850, minSeeds: 40, multiplier: 6, name: "Lote 4" },
    { id: 5, price: 1150, minSeeds: 50, multiplier: 8, name: "Lote 5" },
    { id: 6, price: 1750, minSeeds: 70, multiplier: 12, name: "Lote 6" }
];

const trigoSprite = new Image();
trigoSprite.src = 'sprites/Trigo.png';

class Crop {
    constructor(x, y, multiplier) {
        this.x = x; this.y = y;
        this.stage = 0; // 0 a 4 (Frames do sprite)
        this.timer = 0;
        this.isSeed = true; // Começa como semente
        this.seedTimer = 0;
        this.multiplier = multiplier; // Salva o multiplicador do lote onde foi plantado
    }
    update(dt) {
        if (this.isSeed) {
            this.seedTimer += dt;
            if (this.seedTimer > 3000) { this.isSeed = false; } // Vira broto após 3s
        } else if (this.stage < 4) {
            this.timer += dt;
            if (this.timer > 6000) { this.stage++; this.timer = 0; }
        }
    }
    draw() {
        if (this.isSeed) {
            ctx.fillStyle = '#8b4513';
            ctx.beginPath();
            ctx.arc(this.x - camera.x, this.y - camera.y, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (trigoSprite.complete && trigoSprite.naturalWidth > 0) {
            // Sprite 2x3
            const fw = trigoSprite.width / 2;
            const fh = trigoSprite.height / 3;
            const sx = (this.stage % 2) * fw;
            const sy = Math.floor(this.stage / 2) * fh;
            ctx.drawImage(trigoSprite, sx, sy, fw, fh, this.x - camera.x - fw, this.y - camera.y - fh * 2, fw * 2, fh * 2);
        } else {
            ctx.font = '20px Arial';
            ctx.fillText('🌱', this.x - camera.x - 10, this.y - camera.y);
        }
    }
}


// INVENTÁRIO DE PRODUTOS
var inventoryProducts = { ovos: 0, carne: 0 };

// ANIMAIS
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
    document.getElementById('hud-seeds-value').textContent = sementesTrigo;
    const harvestEl = document.getElementById('hud-harvest-value');
    if (harvestEl) harvestEl.textContent = harvestedTrigo;
    
    document.querySelectorAll('.shop-card').forEach(card => {
        const title = card.querySelector('h3');
        if (!title) return;
        const type = title.textContent.toLowerCase();
        if (unlockOrder.includes(type)) {
            const unlocked = animalsUnlocked.includes(type);
            card.style.opacity = unlocked ? "1" : "0.3";
            card.style.pointerEvents = unlocked ? "auto" : "none";
            card.style.filter = unlocked ? "none" : "grayscale(100%)";
        }
    });

    if (comunidade <= 0 && !isGameOver) {
        isGameOver = true;
        document.getElementById('game-over-overlay').classList.remove('hidden');
    }
}

function updateInventory() {
    // Sementes
    const seedList = document.getElementById('inv-seeds-list');
    if (seedList) seedList.innerHTML = `<div class="inv-item">🌾 Trigo x${sementesTrigo}</div>`;

    // Animais
    const list = document.getElementById('inv-animals-list');
    if (list) {
        const counts = {};
        animalsOnMap.forEach(a => counts[a.type] = (counts[a.type] || 0) + 1);
        list.innerHTML = '';
        const emojiMap = { pato: '🦆', galinha: '🐔', coelho: '🐇', ovelha: '🐑', porco: '🐖', cavalo: '🐎' };
        if (animalsOnMap.length === 0) list.innerHTML = '<div class="inv-item">Nenhum comprado</div>';
        else {
            for (const [type, count] of Object.entries(counts)) {
                const div = document.createElement('div'); div.className = 'inv-item';
                div.innerHTML = `${emojiMap[type] || ''} ${type.toUpperCase()}: ${count}`;
                list.appendChild(div);
            }
        }
    }

    // Produtos
    const prodList = document.getElementById('inv-products-list');
    if (prodList) {
        prodList.innerHTML = `
            <div class="inv-item" style="display:flex; justify-content: space-between; align-items: center;">
                <div>🥚 OVOS: ${inventoryProducts.ovos}</div>
                <button onclick="sellItem('ovos')" style="padding: 5px; background: #2ecc71; border: 2px solid #fff; font-family:'Press Start 2P'; font-size:6px; cursor:pointer;">VENDER (6s)</button>
            </div>
            <div class="inv-item" style="display:flex; justify-content: space-between; align-items: center; margin-top:5px;">
                <div>🥩 CARNES: ${inventoryProducts.carne}</div>
                <button onclick="sellItem('carne')" style="padding: 5px; background: #2ecc71; border: 2px solid #fff; font-family:'Press Start 2P'; font-size:6px; cursor:pointer;">VENDER (6s)</button>
            </div>
        `;
    }
}

var isSelling = false;
window.sellItem = (type) => {
    if (isSelling) return;
    if (inventoryProducts[type] <= 0) { alert("Sem estoque!"); return; }

    isSelling = true;
    inventoryProducts[type]--;
    updateInventory();

    const hasHorse = animalsOnMap.some(a => a.type === 'cavalo');
    const sellTime = hasHorse ? 3000 : 6000;
    const status = document.getElementById('sell-status');
    status.textContent = `VENDENDO ${type.toUpperCase()}... (${sellTime / 1000}s)`;

    setTimeout(() => {
        const gain = type === 'ovos' ? 10 : 25;
        comunidade = Math.min(100, comunidade + gain);
        moedas += gain * 2;
        status.textContent = `VENDIDO! +${gain} COMUNIDADE`;
        isSelling = false;
        updateHUD();
        setTimeout(() => { status.textContent = ''; }, 2000);
    }, sellTime);
};

window.buyAnimal = (type, price) => {
    if (!animalsUnlocked.includes(type)) { alert("Animal bloqueado!"); return; }
    if (moedas >= price) {
        moedas -= price;
        animalsOnMap.push(new Animal(type, camera.x + 400 + Math.random()*200, camera.y + 400 + Math.random()*200));
        const idx = unlockOrder.indexOf(type);
        if (idx !== -1 && idx < unlockOrder.length - 1) {
            const next = unlockOrder[idx + 1];
            if (!animalsUnlocked.includes(next)) animalsUnlocked.push(next);
        }
        updateHUD(); updateInventory();
    } else alert("Sem moedas!");
};

// Interface da Loja de Lotes
function renderLots() {
    const container = document.getElementById('lots-container');
    if(!container) return;
    container.innerHTML = '';

    lots.forEach((lot, index) => {
        const isSelected = currentLotIndex === index;
        const isPurchased = purchasedLotsStatus.includes(index);
        
        const lotDiv = document.createElement('div');
        lotDiv.style.background = isSelected ? '#333' : '#1a1a1a';
        lotDiv.style.border = isSelected ? '3px solid #ffd700' : '3px solid #555';
        lotDiv.style.padding = '15px';
        lotDiv.style.borderRadius = '8px';
        lotDiv.style.display = 'flex';
        lotDiv.style.flexDirection = 'column';
        lotDiv.style.gap = '10px';
        lotDiv.style.fontFamily = "'Press Start 2P'";
        lotDiv.style.textAlign = 'center';

        lotDiv.innerHTML = `
            <div style="width: 100%; height: 60px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); border: 2px solid #444; border-radius: 4px;">
                <img src="sprites/Lote${index + 1}.png" style="max-width: 100%; max-height: 100%; image-rendering: pixelated;">
            </div>
            <h3 style="color: #ffd700; font-size: 10px;">${lot.name}</h3>
            <p style="font-size: 6px; line-height: 1.5;">Multiplicador: x${lot.multiplier}</p>
            <p style="font-size: 6px; color: #aaa;">Sementes necessárias: ${lot.minSeeds}</p>
            <p style="font-size: 6px; color: #0f0;">Preço: ${lot.price}</p>
            <button id="buy-lot-${index}" style="width: 100%; border: 2px solid #fff; padding: 5px; font-family: 'Press Start 2P'; font-size: 6px; cursor: pointer; background: ${isPurchased ? (isSelected ? '#ffd700' : '#8b4513') : '#444'}; color: #fff;">
                ${isPurchased ? (isSelected ? (index === currentLotIndex ? 'ATIVO' : 'SELECIONAR') : 'SELECIONAR') : 'COMPRAR'}
            </button>
        `;

        container.appendChild(lotDiv);

        const btn = document.getElementById(`buy-lot-${index}`);
        btn.addEventListener('click', () => {
            if (isPurchased) {
                currentLotIndex = index;
                renderLots();
            } else {
                if (moedas >= lot.price) {
                    moedas -= lot.price;
                    purchasedLotsStatus.push(index);
                    currentLotIndex = index;
                    updateHUD();
                    renderLots();
                } else {
                    alert('Moedas insuficientes!');
                }
            }
        });
    });
}

window.onload = () => {
    console.log("AgriCorp v10 Initializing...");
    const bind = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
    bind('btn-open-shop', () => document.getElementById('shop-overlay').classList.remove('hidden'));
    bind('btn-shop-voltar', () => document.getElementById('shop-overlay').classList.add('hidden'));
    bind('btn-open-inventory', () => document.getElementById('inventory-overlay').classList.remove('hidden'));
    bind('btn-inv-voltar', () => document.getElementById('inventory-overlay').classList.add('hidden'));
    bind('btn-buy-seed', () => { if (moedas >= 10) { moedas -= 10; sementesTrigo++; updateHUD(); updateInventory(); } else alert("Sem moedas!"); });

    bind('btn-open-lots', () => {
        renderLots();
        document.getElementById('lots-overlay').classList.remove('hidden');
    });
    
    bind('btn-water', () => {
        const activeLot = lots[currentLotIndex];
        if (sementesTrigo < activeLot.minSeeds) {
            alert(`Você precisa de pelo menos ${activeLot.minSeeds} sementes para plantar no ${activeLot.name}!`);
            return;
        }

        let plantedCount = 0;
        let occupiesCount = 0;
        const spacing = 130;
        for (let yy = blueField.y + 60; yy < blueField.y + blueField.h - 60; yy += spacing) {
            for (let xx = blueField.x + 60; xx < blueField.x + blueField.w - 60; xx += spacing) {
                const isOccupied = crops.some(c => Math.hypot(c.x - xx, c.y - yy) < 60);
                if (isOccupied) {
                    occupiesCount++;
                } else if (sementesTrigo > 0) {
                    crops.push(new Crop(xx, yy, activeLot.multiplier)); 
                    sementesTrigo--; 
                    plantedCount++;
                }
            }
        }
        
        updateHUD(); updateInventory();
        const timerEl = document.getElementById('planting-timer');
        if (timerEl) {
            if (plantedCount > 0) {
                timerEl.innerHTML = `PLANTADO ${plantedCount} SEMENTES NO ${activeLot.name}!`;
            } else if (occupiesCount > 0) {
                timerEl.innerHTML = `TERRENO OCUPADO! COLHA ANTES DE PLANTAR NOVAMENTE.`;
            } else {
                timerEl.innerHTML = `SEM SEMENTES DISPONÍVEIS!`;
            }
            timerEl.classList.remove('hidden');
            setTimeout(() => timerEl.classList.add('hidden'), 3000);
        }
    });

    setInterval(() => { if (!isGameOver) { comunidade -= 0.5; updateHUD(); } }, 1000);
    updateHUD(); updateInventory();
    renderLots();
};

canvas.onmousedown = (e) => {
    const rect = canvas.getBoundingClientRect();
    const wx = (e.clientX - rect.left) + camera.x, wy = (e.clientY - rect.top) + camera.y;
    const cropIdx = crops.findIndex(c => Math.hypot(c.x - wx, c.y - wy) < 60 && c.stage === 4);
    if (cropIdx !== -1) {
        const crop = crops[cropIdx];
        crops.splice(cropIdx, 1);
        
        // 1 Semente = 2 Unidades de Colheita
        harvestedTrigo += 2;
        
        // Lucro = Quantidade_Colhida * Multiplicador do Lote
        const profit = 2 * crop.multiplier;
        moedas += profit;
        
        updateHUD(); 
        return;
    }
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
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
        ctx.strokeRect(blueField.x - camera.x, blueField.y - camera.y, blueField.w, blueField.h);
        ctx.restore();
        crops.forEach(c => { c.update(dt); c.draw(); });
    }
    animalsOnMap.forEach(a => { a.update(dt); a.draw(); });
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
