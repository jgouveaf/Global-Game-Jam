// ========================= AgriCorp Game (Final English Version v11.2) =========================
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

const mapImage = new Image();
mapImage.src = 'sprites/Mapa..png';
let mapLoaded = false;
let WW = 0, WH = 0; // Current frame size after loading

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

const camera = { x: 0, y: 0 };
let mouseX = 0, mouseY = 0;
const EDGE = 0.08, CAM_SPEED = 20;
window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

// GAME STATES
var coins = 500, wheatSeeds = 60, carrotSeeds = 30, community = 80, isGameOver = false;
var harvestedWheat = 0, harvestedCarrot = 0;
const crops = [];

// LAND DEFINITIONS
// NOTE: Coordinates are Relative to a Single Map Frame (approximately 1920x1080? No, let's keep current WW=2800 scale internally if possible)
// Since the map frame is the full map, I will use its dimensions as the boundary.
const lots = [
    { id: 1, name: "Northwest Field", price: 0,    minSeeds: 10, target: 'wheat',  multiplier: 1,  area: { x: 100,  y: 350, w: 600, h: 450 } }, 
    { id: 2, name: "North Center Field", price: 200,  minSeeds: 20, target: 'carrot', multiplier: 2,  area: { x: 950,  y: 180, w: 500, h: 350 } }, 
    { id: 3, name: "East Mid Field A", price: 500,  minSeeds: 30, target: 'carrot', multiplier: 4,  area: { x: 1650, y: 450, w: 400, h: 300 } }, 
    { id: 4, name: "East Mid Field B", price: 850,  minSeeds: 40, target: 'wheat',  multiplier: 6,  area: { x: 2150, y: 450, w: 400, h: 300 } }, 
    { id: 5, name: "South Center Field", price: 1150, minSeeds: 50, target: 'wheat',  multiplier: 8,  area: { x: 900,  y: 850, w: 550, h: 400 } }, 
    { id: 6, name: "Southeast Field", price: 1750, minSeeds: 60, target: 'carrot', multiplier: 12, area: { x: 1550, y: 850, w: 650, h: 400 } }
];

let purchasedLotsStatus = [0]; // Lot 1 starts owned

// SPRITES
const wheatSprite = new Image(); wheatSprite.src = 'sprites/Trigo.png';
const carrotSprite = new Image(); carrotSprite.src = 'sprites/Cenoura.png';

class Crop {
    constructor(x, y, profitMultiplier, type = 'wheat') {
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
            const sprite = (this.type === 'wheat') ? wheatSprite : carrotSprite;
            if (sprite.complete && sprite.naturalWidth > 0) {
                const isWheat = this.type === 'wheat';
                const fw = sprite.width / (isWheat ? 2 : 1);
                const fh = sprite.height / (isWheat ? 3 : 1);
                let sx = 0, sy = 0;
                if (isWheat) { sx = (this.stage % 2) * fw; sy = Math.floor(this.stage / 2) * fh; }
                
                let scalePulse = (this.stage === 4) ? 1.0 + Math.sin(Date.now() / 300) * 0.05 : 1.0;
                ctx.translate(this.x - camera.x, this.y - camera.y);
                ctx.scale(scalePulse, scalePulse);
                ctx.drawImage(sprite, sx, sy, fw, fh, -fw / 2, -fh, fw, fh);
            }
        }
        ctx.restore();
    }
}

// ANIMALS
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
        this.x = Math.max(100, Math.min(this.x, 2800 - 100)); // Fixed boundaries
        this.y = Math.max(100, Math.min(this.y, 1400 - 100));
    }
    draw() {
        const img = animalSprites[this.type];
        if (img.complete && img.naturalWidth > 0) {
            const fh = img.height / 2;
            ctx.drawImage(img, 0, this.frame * fh, img.width, fh, this.x - camera.x - img.width/2, this.y - camera.y - fh/2, img.width, fh);
        }
    }
}

function updateHUD() {
    const hpBar = document.getElementById('hp-bar');
    if(hpBar) hpBar.style.width = community + '%';
    document.getElementById('hud-value').textContent = Math.round(community);
    document.getElementById('hud-coins-value').textContent = Math.round(coins);
    document.getElementById('hud-seeds-value').textContent = wheatSeeds + carrotSeeds;
    document.getElementById('hud-harvest-value').textContent = harvestedWheat + harvestedCarrot;
    if (community <= 0 && !isGameOver) { isGameOver = true; document.getElementById('game-over-overlay').classList.remove('hidden'); }
}

function updateInventory() {
    const seedList = document.getElementById('inv-seeds-list');
    if (seedList) seedList.innerHTML = `<div class="inv-item">🌾 Wheat: ${wheatSeeds} | 🥕 Carrot: ${carrotSeeds}</div>`;
}

window.buySeeds = (type, price) => {
    if (coins >= price) {
        coins -= price;
        if (type === 'wheat' || type === 'trigo') wheatSeeds += 5; else carrotSeeds += 5;
        updateHUD(); updateInventory();
    } else alert("No coins!");
};

window.buyAnimal = (type, price) => {
    if (coins >= price) {
        coins -= price;
        animalsOnMap.push(new Animal(type, 1500 + Math.random() * 500, 200 + Math.random() * 300));
        updateHUD();
        alert(`You bought a ${type.toUpperCase()}!`);
    } else alert("Not enough coins!");
}

function renderLots() {
    const container = document.getElementById('lots-container');
    if(!container) return;
    container.innerHTML = '';
    lots.forEach((lot, index) => {
        const isPurchased = purchasedLotsStatus.includes(index);
        const lotDiv = document.createElement('div');
        lotDiv.className = 'shop-card';
        lotDiv.style.background = isPurchased ? 'rgba(46, 204, 113, 0.2)' : 'rgba(0,0,0,0.5)';
        lotDiv.style.border = isPurchased ? '3px solid #ffd700' : '3px solid #555';
        lotDiv.innerHTML = `
            <img src="sprites/Lote${lot.id}.png" style="width: 50px; height: 50px; image-rendering: pixelated; margin-bottom: 5px;" onerror="this.src='sprites/Mapa..png'; this.style.objectFit='none'; this.style.objectPosition='0 0';">
            <p style="color: #ffd700; font-size: 8px; font-family:'Press Start 2P',cursive;">${lot.name}</p>
            <p style="font-size: 7px; color:#fff;">Grows: ${lot.target.toUpperCase()} (x${lot.multiplier})</p>
            <button id="buy-lot-${index}" style="width: 100%; padding: 5px; font-family: 'Press Start 2P'; font-size: 6px; cursor: pointer; background: ${isPurchased ? '#27ae60' : '#8b4513'}; color: #fff;">
                ${isPurchased ? 'OWNED' : '💰 ' + lot.price}
            </button>
        `;
        container.appendChild(lotDiv);
        if (!isPurchased) {
            document.getElementById(`buy-lot-${index}`).onclick = () => {
                if (coins >= lot.price) {
                    coins -= lot.price; purchasedLotsStatus.push(index);
                    updateHUD(); renderLots();
                } else alert('Insufficient coins!');
            };
        }
    });
}

window.onload = () => {
    const bind = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
    bind('btn-open-shop', () => document.getElementById('shop-overlay').classList.remove('hidden'));
    bind('btn-shop-voltar', () => document.getElementById('shop-overlay').classList.add('hidden'));
    bind('btn-open-inventory', () => document.getElementById('inventory-overlay').classList.remove('hidden'));
    bind('btn-inv-voltar', () => document.getElementById('inventory-overlay').classList.add('hidden'));
    bind('btn-open-lots', () => { renderLots(); document.getElementById('lots-overlay').classList.remove('hidden'); });
    bind('btn-lots-voltar', () => document.getElementById('lots-overlay').classList.add('hidden'));

    bind('btn-buy-seed', () => buySeeds('wheat', 10));

    bind('btn-water', () => {
        purchasedLotsStatus.forEach(idx => {
            const lot = lots[idx];
            const a = lot.area;
            const spacing = 110; 
            for (let yy = a.y; yy < a.y + a.h; yy += spacing) {
                for (let xx = a.x; xx < a.x + a.w; xx += spacing) {
                    const type = lot.target;
                    const hasSeeds = (type === 'wheat' && wheatSeeds > 0) || (type === 'carrot' && carrotSeeds > 0);
                    if (hasSeeds && !crops.some(c => Math.hypot(c.x-xx, c.y-yy) < 60)) {
                        crops.push(new Crop(xx, yy, lot.multiplier, type));
                        if(type === 'wheat') wheatSeeds--; else carrotSeeds--;
                    }
                }
            }
        });
        updateHUD(); updateInventory();
    });

    setInterval(() => { if (!isGameOver) { community -= 0.1; updateHUD(); } }, 1000);
    updateHUD(); updateInventory(); renderLots();
};

let lastTime = performance.now();
function loop(now){
    const dt = now - lastTime; lastTime = now;
    if (mouseX < W * EDGE) camera.x -= CAM_SPEED;
    if (mouseX > W * (1 - EDGE)) camera.x += CAM_SPEED;
    if (mouseY < H * EDGE) camera.y -= CAM_SPEED;
    if (mouseY > H * (1 - EDGE)) camera.y += CAM_SPEED;
    
    // Limits
    const currentWW = 2800; // Expected world width for coordinate mapping
    const currentWH = 1400; // Expected world height
    camera.x = Math.max(0, Math.min(camera.x, currentWW - W));
    camera.y = Math.max(0, Math.min(camera.y, currentWH - H));
    
    // CLEAR BACKGROUND WITH GRASS GREEN (to remove the "black thing")
    ctx.fillStyle = "#325e22"; // Dark grass green
    ctx.fillRect(0, 0, W, H);

    if (mapLoaded) {
        // Find which frame to use based on purchased lots
        // purchasedLotsStatus.length: 1 owned (Lot 1) = Frame 2 ... 6 owned (Lot 6) = Frame 7
        const lotCount = purchasedLotsStatus.length;
        const currentFrame = lotCount; // Lot 1 owned = count is 1, so Frame 2. Lot 6 owned = count is 6, so Frame 7.
        // wait, Lot 1 owns usually start = 1. So if 1 lot owned, count=1.
        // Actually, frame 1 = 0 lots owned? If Lot 1 starts owned, use Frame 2 (index 1).
        
        let frameIndex = Math.min(Math.max(0, currentFrame), 6); // Max frame 7 (index 6)
        
        const frameCol = frameIndex % 2;
        const frameRow = Math.floor(frameIndex / 2);
        
        const frameW = mapImage.width / 2;
        const frameH = mapImage.height / 4;
        const sx = frameCol * frameW;
        const sy = frameRow * frameH;

        // Scale map to fill the screen better if needed, but here we draw 1:1 with camera
        ctx.drawImage(mapImage, sx, sy, frameW, frameH, -camera.x, -camera.y, frameW, frameH);
        
        // Draw Animals
        animalsOnMap.forEach(a => { a.update(dt); a.draw(); });

        // Update & Draw Crops
        for (let i = crops.length - 1; i >= 0; i--) {
            const c = crops[i]; c.update(dt); c.draw();
            if (c.stage === 4) {
                // Carrot gives more than wheat
                // Wheat yield = 2, Carrot yield = 4
                const yieldAmount = (c.type === 'wheat' ? 2 : 4);
                const basePrice = (c.type === 'wheat' ? 5 : 10);
                const totalGain = (basePrice * c.multiplier) * yieldAmount;
                
                if (c.type === 'wheat') harvestedWheat += yieldAmount; 
                else harvestedCarrot += yieldAmount;
                
                coins += totalGain; 
                crops.splice(i, 1); 
                updateHUD();
                community = Math.min(100, community + 0.3);
            }
        }
    }
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
