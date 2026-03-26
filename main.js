// ========================= AgriCorp Game (Automated Version v12.0) =========================
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

const mapImage = new Image();
mapImage.src = 'sprites/Mapa..png';
let mapLoaded = false;
let WW = 0, WH = 0; // Sprite Frame dimensions

mapImage.onload = () => { 
    mapLoaded = true;
    WW = mapImage.width / 2;    // Sprite sheet has 2 columns
    WH = mapImage.height / 4;   // Sprite sheet has 4 rows
};

let W, H;
function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    W = canvas.width; H = canvas.height;
}
resize();
window.addEventListener('resize', resize);

// Camera is now FIXED (Locked)
const camera = { x: 0, y: 0 };

// GAME STATES
var coins = 500, harvestedWheat = 0, harvestedCarrot = 0, community = 80, isGameOver = false;
const animalsOnMap = [];
const animalSprites = { pato: new Image(), galinha: new Image(), coelho: new Image(), ovelha: new Image(), porco: new Image(), cavalo: new Image() };
animalSprites.pato.src='sprites/Pato.png'; animalSprites.galinha.src='sprites/Galinha.png'; animalSprites.coelho.src='sprites/Coelho.png';
animalSprites.ovelha.src='sprites/Ovelha.png'; animalSprites.porco.src='sprites/Porco.png'; animalSprites.cavalo.src='sprites/Cavalo.png';

// LAND DEFINITIONS
const lots = [
    { id: 1, name: "Northwest Plot", price: 0,    multiplier: 1,  target: 'wheat'  }, 
    { id: 2, name: "North Center Plot", price: 200,  multiplier: 2,  target: 'carrot' }, 
    { id: 3, name: "East Plot A",     price: 500,  multiplier: 4,  target: 'carrot' }, 
    { id: 4, name: "East Plot B",     price: 850,  multiplier: 6,  target: 'wheat'  }, 
    { id: 5, name: "South Center Plot", price: 1150, multiplier: 8,  target: 'wheat'  }, 
    { id: 6, name: "Southeast Plot",    price: 1750, multiplier: 12, target: 'carrot' }
];

let purchasedLotsStatus = [0]; // Starts at Lot 1

class Animal {
    constructor(type, x, y) {
        this.type = type; this.x = x; this.y = y; this.frame = 0; this.nextFrameTime = 0;
        this.vx = (Math.random() - 0.5) * 1.0; this.vy = (Math.random() - 0.5) * 1.0;
        this.moveTimer = 2000;
    }
    update(dt) {
        this.nextFrameTime += dt;
        if (this.nextFrameTime > 300) { this.frame = (this.frame + 1) % 2; this.nextFrameTime = 0; }
        this.moveTimer -= dt;
        if (this.moveTimer <= 0) {
            this.vx = (Math.random() - 0.5) * 1.0; this.vy = (Math.random() - 0.5) * 1.0;
            this.moveTimer = 2000 + Math.random() * 2000;
        }
        this.x += this.vx; this.y += this.vy;
        this.x = Math.max(200, Math.min(this.x, 1500)); // Keep them in reachable areas
        this.y = Math.max(200, Math.min(this.y, 800));
    }
    draw(scaleFix) {
        const img = animalSprites[this.type];
        if (img.complete && img.naturalWidth > 0) {
            const fh = img.height / 2;
            ctx.drawImage(img, 0, this.frame * fh, img.width, fh, (this.x) * scaleFix - (img.width/2), (this.y) * scaleFix - (fh/2), img.width * scaleFix, fh * scaleFix);
        }
    }
}

function updateHUD() {
    const hpBar = document.getElementById('hp-bar');
    if(hpBar) hpBar.style.width = community + '%';
    document.getElementById('hud-value').textContent = Math.round(community);
    document.getElementById('hud-coins-value').textContent = Math.round(coins);
    document.getElementById('hud-harvest-value').textContent = Math.round(harvestedWheat + harvestedCarrot);
    if (community <= 0 && !isGameOver) { 
        isGameOver = true; 
        document.getElementById('game-over-overlay').classList.remove('hidden'); 
    }
}

function updateInventory() {
    const seedList = document.getElementById('inv-seeds-list');
    if (seedList) seedList.innerHTML = `<div class="inv-item">🌾 Wheat: ${Math.round(harvestedWheat)} | 🥕 Carrot: ${Math.round(harvestedCarrot)}</div>`;
}

// BREAD WINNING (PASSIVE PRODUCTION)
setInterval(() => {
    if (isGameOver) return;
    purchasedLotsStatus.forEach(idx => {
        const lot = lots[idx];
        const yieldAmount = (lot.target === 'wheat' ? 2 : 5); // Carrots give more
        const revenue = (yieldAmount * lot.multiplier);
        
        coins += revenue;
        if (lot.target === 'wheat') harvestedWheat += yieldAmount;
        else harvestedCarrot += yieldAmount;
        
        community = Math.min(100, community + 0.1); // Production helps health
    });
    updateHUD(); updateInventory();
}, 8000); // Production happens every 8 seconds

// COMMUNITY DECAY
setInterval(() => { if (!isGameOver) { community -= 0.15; updateHUD(); } }, 1000);

function renderLots() {
    const container = document.getElementById('lots-container');
    if(!container) return; container.innerHTML = '';
    lots.forEach((lot, index) => {
        const isPurchased = purchasedLotsStatus.includes(index);
        const lotDiv = document.createElement('div');
        lotDiv.className = 'shop-card';
        lotDiv.style.background = isPurchased ? 'rgba(46, 204, 113, 0.2)' : 'rgba(0,0,0,0.5)';
        lotDiv.style.border = isPurchased ? '3px solid #ffd700' : '3px solid #555';
        lotDiv.innerHTML = `
            <img src="sprites/Lote${lot.id}.png" style="width: 50px; height: 50px; image-rendering: pixelated; margin-bottom: 5px;">
            <p style="color: #ffd700; font-size: 8px;">${lot.name}</p>
            <p style="font-size: 7px; color:#fff;">Production: ${lot.target.toUpperCase()} (x${lot.multiplier})</p>
            <button id="buy-lot-${index}" style="width: 100%; padding: 8px; font-family:'Press Start 2P'; font-size: 6px; cursor: pointer; background: ${isPurchased ? '#27ae60' : '#8b4513'}; color: #fff;">
                ${isPurchased ? 'OK' : '💰 ' + lot.price}
            </button>
        `;
        container.appendChild(lotDiv);
        if (!isPurchased) {
            document.getElementById(`buy-lot-${index}`).onclick = () => {
                if (coins >= lot.price) {
                    coins -= lot.price; 
                    purchasedLotsStatus.push(index);
                    updateHUD(); renderLots();
                } else alert('Insufficient coins!');
            };
        }
    });
}

window.buyAnimal = (type, price) => {
    if (coins >= price) {
        coins -= price;
        animalsOnMap.push(new Animal(type, 800 + Math.random() * 500, 400 + Math.random() * 300));
        updateHUD(); updateInventory();
    } else alert("Not enough coins!");
}

window.onload = () => {
    const bind = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
    bind('btn-open-inventory', () => { updateInventory(); document.getElementById('inventory-overlay').classList.remove('hidden'); });
    bind('btn-inv-voltar', () => document.getElementById('inventory-overlay').classList.add('hidden'));
    bind('btn-open-lots', () => { renderLots(); document.getElementById('lots-overlay').classList.remove('hidden'); });
    updateHUD(); updateInventory(); renderLots();
};

let lastTime = performance.now();
function loop(now){
    const dt = now - lastTime; lastTime = now;
    
    // Fill background with nature green
    ctx.fillStyle = "#325e22";
    ctx.fillRect(0, 0, W, H);

    if (mapLoaded) {
        // Frame Selection based on land ownership count
        const frameIndex = Math.min(Math.max(0, purchasedLotsStatus.length), 6); // 1 land = Index 1 (Frame 2), etc.
        const frameCol = frameIndex % 2;
        const frameRow = Math.floor(frameIndex / 2);
        
        const frameW = mapImage.width / 2;
        const frameH = mapImage.height / 4;
        const sx = frameCol * frameW;
        const sy = frameRow * frameH;

        // SCALE MAP TO FIT SCREEN WIDTH AND HEIGHT (Locked camera)
        // This ensures the map is fixed and no "black void" is seen.
        const scale = Math.max(W / frameW, H / frameH);
        
        // Draw centered map
        const dx = (W - frameW * scale) / 2;
        const dy = (H - frameH * scale) / 2;
        ctx.drawImage(mapImage, sx, sy, frameW, frameH, dx, dy, frameW * scale, frameH * scale);
        
        // Update Animals (relative to scale)
        const scaleFix = scale; 
        animalsOnMap.forEach(a => { a.update(dt); a.draw(scaleFix); });
    }
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
