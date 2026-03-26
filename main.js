// ========================= AgriCorp Game (Animals & Difficulty v13.0) =========================
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

const mapImage = new Image();
mapImage.src = 'sprites/Mapa..png';
let mapLoaded = false, WW = 0, WH = 0;

mapImage.onload = () => { mapLoaded = true; WW = mapImage.width / 2; WH = mapImage.height / 4; };

let W, H;
function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    W = canvas.width; H = canvas.height;
}
resize();
window.addEventListener('resize', resize);

const camera = { x: 0, y: 0 };

// GAME STATES
var coins = 500, community = 80, isGameOver = false;
var harvestedWheat = 0, harvestedCarrot = 0, totalEggs = 0, totalMeat = 0;
var timeElapsed = 0; // Total play time in seconds
var decayMultiplier = 1.0; // Grows over time

const animalsOnMap = [];
const animalSprites = { 
    pato: new Image(), galinha: new Image(), coelho: new Image(), 
    ovelha: new Image(), vaca: new Image(), cavalo: new Image() 
};
animalSprites.pato.src='sprites/Pato.png';
animalSprites.galinha.src='sprites/Galinha.png';
animalSprites.coelho.src='sprites/Coelho.png';
animalSprites.ovelha.src='sprites/Ovelha.png';
animalSprites.vaca.src='sprites/Piskel Vaquinha.png';
animalSprites.cavalo.src='sprites/Cavalo.png';

// ANIMAL SHOP DEFINITIONS
const animalLots = [
    { type: 'pato',    name: 'Duck',    price: 150,  desc: 'Little egg yield',    yield: { coins: 10, egg: 1, meat: 0 } },
    { type: 'coelho',  name: 'Rabbit',  price: 250,  desc: 'Little meat yield',   yield: { coins: 15, egg: 0, meat: 1 } },
    { type: 'galinha', name: 'Chicken', price: 400,  desc: 'Lots of eggs!',       yield: { coins: 30, egg: 5, meat: 0 } },
    { type: 'cavalo',  name: 'Horse',   price: 800,  desc: 'Slows down decay',    yield: { coins: 0,  egg: 0, meat: 0 } },
    { type: 'ovelha',  name: 'Sheep',   price: 1200, desc: 'Normal meat yield',   yield: { coins: 80, egg: 0, meat: 3 } },
    { type: 'vaca',    name: 'Cow',     price: 2000, desc: 'Lots of meat!',       yield: { coins: 200, egg: 0, meat: 10 } }
];

const lots = [
    { id: 1, name: "Northwest Plot", price: 0,    multiplier: 1,  target: 'wheat'  }, 
    { id: 2, name: "North Center Plot", price: 500,  multiplier: 2,  target: 'carrot' }, 
    { id: 3, name: "East Plot A",     price: 1200, multiplier: 4,  target: 'carrot' }, 
    { id: 4, name: "East Plot B",     price: 2500, multiplier: 6,  target: 'wheat'  }, 
    { id: 5, name: "South Center Plot", price: 5000, multiplier: 8,  target: 'wheat'  }, 
    { id: 6, name: "Southeast Plot",    price: 8000, multiplier: 12, target: 'carrot' }
];
let purchasedLotsStatus = [0];

class Animal {
    constructor(type, x, y) {
        this.type = type; this.x = x; this.y = y; this.frame = 0; this.nextFrameTime = 0;
        this.vx = (Math.random() - 0.5) * 1.5; this.vy = (Math.random() - 0.5) * 1.5;
        this.moveTimer = 2000;
    }
    update(dt) {
        this.nextFrameTime += dt;
        if (this.nextFrameTime > 300) { this.frame = (this.frame + 1) % 2; this.nextFrameTime = 0; }
        this.moveTimer -= dt;
        if (this.moveTimer <= 0) {
            this.vx = (Math.random() - 0.5) * 1.5; this.vy = (Math.random() - 0.5) * 1.5;
            this.moveTimer = 2000 + Math.random() * 2000;
        }
        this.x += this.vx; this.y += this.vy;
        this.x = Math.max(200, Math.min(this.x, 1700)); // Limits relative to typical view
        this.y = Math.max(200, Math.min(this.y, 1000));
    }
    draw(scale) {
        const img = animalSprites[this.type];
        if (img.complete && img.naturalWidth > 0) {
            const fh = img.height / 2;
            const dw = img.width * scale;
            const dh = fh * scale;
            ctx.drawImage(img, 0, this.frame * fh, img.width, fh, (W-WW*scale)/2 + this.x*scale - dw/2, (H-WH*scale)/2 + this.y*scale - dh/2, dw, dh);
        }
    }
}

function updateHUD() {
    const hpBar = document.getElementById('hp-bar');
    if(hpBar) hpBar.style.width = community + '%';
    document.getElementById('hud-value').textContent = Math.round(community);
    document.getElementById('hud-coins-value').textContent = Math.round(coins);
    document.getElementById('hud-harvest-value').textContent = Math.round(harvestedWheat + harvestedCarrot);
    document.getElementById('hud-products-value').textContent = Math.round(totalEggs + totalMeat);
    if (community <= 0 && !isGameOver) { isGameOver = true; document.getElementById('game-over-overlay').classList.remove('hidden'); }
}

function updateInventory() {
    const cropList = document.getElementById('inv-crops-list');
    if (cropList) cropList.innerHTML = `🌾 Wheat: ${Math.round(harvestedWheat)}<br>🥕 Carrot: ${Math.round(harvestedCarrot)}`;
    const animList = document.getElementById('inv-animals-list');
    if (animList) animList.innerHTML = `🥚 Eggs: ${totalEggs}<br>🍖 Meat: ${totalMeat}<br>🐎 Horse Bonus: x${animalsOnMap.filter(a=>a.type==='cavalo').length}`;
}

// PERIODIC PRODUCTION
setInterval(() => {
    if (isGameOver) return;
    // Lands Production
    purchasedLotsStatus.forEach(idx => {
        const lot = lots[idx];
        const yieldAmount = (lot.target === 'wheat' ? 2 : 5);
        coins += (yieldAmount * lot.multiplier);
        if (lot.target === 'wheat') harvestedWheat += yieldAmount; else harvestedCarrot += yieldAmount;
        community = Math.min(100, community + 0.2); 
    });
    // Animal Production
    animalsOnMap.forEach(a => {
        const data = animalLots.find(d => d.type === a.type);
        if(!data) return;
        coins += data.yield.coins;
        totalEggs += data.yield.egg;
        totalMeat += data.yield.meat;
        if (data.yield.egg > 0 || data.yield.meat > 0) community = Math.min(100, community + 0.1);
    });
    updateHUD(); updateInventory();
}, 8000);

// PROGRESSIVE COMMUNITY DECAY
setInterval(() => {
    if (isGameOver) return;
    timeElapsed++;
    // Difficulty increases every 45s
    if (timeElapsed % 45 === 0) decayMultiplier += 0.15;
    
    let horseCount = animalsOnMap.filter(a => a.type === 'cavalo').length;
    let horseReduction = Math.min(0.6, horseCount * 0.1); // Max 60% reduction
    
    const baseDecay = 0.2;
    const finalDecay = (baseDecay * decayMultiplier) * (1 - horseReduction);
    
    community -= finalDecay;
    updateHUD();
}, 1000);

function renderShops() {
    // Lands Shop
    const landContainer = document.getElementById('lots-container');
    if(landContainer) {
        landContainer.innerHTML = '';
        lots.forEach((lot, index) => {
            const isPurchased = purchasedLotsStatus.includes(index);
            const lotDiv = document.createElement('div');
            lotDiv.className = 'shop-card';
            lotDiv.style.border = isPurchased ? '3px solid #ffd700' : '3px solid #555';
            lotDiv.innerHTML = `<h3 style="color:#ffd700; font-size:9px;">${lot.name}</h3><p style="font-size:7px;">Yield: x${lot.multiplier}</p><button id="buy-lot-${index}" class="buy-btn" style="background:${isPurchased?'#27ae60':'#8b4513'}">${isPurchased?'OWNED':'💰 '+lot.price}</button>`;
            landContainer.appendChild(lotDiv);
            if (!isPurchased) document.getElementById(`buy-lot-${index}`).onclick = () => { if (coins >= lot.price) { coins -= lot.price; purchasedLotsStatus.push(index); updateHUD(); renderShops(); } else alert('No coins!'); };
        });
    }
    // Animal Shop
    const animContainer = document.getElementById('animals-container');
    if(animContainer) {
        animContainer.innerHTML = '';
        animalLots.forEach(a => {
            const div = document.createElement('div');
            div.className = 'shop-card';
            div.innerHTML = `<div class="card-icon">${(a.type==='vaca'?'🐄':(a.type==='cavalo'?'🐎':(a.type==='pato'?'🦆':(a.type==='coelho'?'🐇':(a.type==='galinha'?'🐔':'🐑')))))}</div><h3 style="font-size:10px;">${a.name}</h3><p style="font-size:7px;">${a.desc}</p><button id="buy-anim-${a.type}" class="buy-btn" style="background:#3498db;">💰 ${a.price}</button>`;
            animContainer.appendChild(div);
            document.getElementById(`buy-anim-${a.type}`).onclick = () => { if (coins >= a.price) { coins -= a.price; animalsOnMap.push(new Animal(a.type, 1000 + (Math.random()-0.5)*800, 600 + (Math.random()-0.5)*400)); updateHUD(); updateInventory(); } else alert('No coins!'); };
        });
    }
}

window.onload = () => {
    const bind = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
    bind('btn-open-inventory', () => { updateInventory(); document.getElementById('inventory-overlay').classList.remove('hidden'); });
    bind('btn-inv-voltar', () => document.getElementById('inventory-overlay').classList.add('hidden'));
    bind('btn-open-lots', () => { renderShops(); document.getElementById('lots-overlay').classList.remove('hidden'); });
    bind('btn-open-animals', () => { renderShops(); document.getElementById('animal-shop-overlay').classList.remove('hidden'); });
    updateHUD(); updateInventory();
};

let lastTime = performance.now();
function loop(now){
    const dt = now - lastTime; lastTime = now;
    ctx.fillStyle = "#325e22";
    ctx.fillRect(0, 0, W, H);
    if (mapLoaded) {
        const frameIndex = Math.min(Math.max(0, purchasedLotsStatus.length), 6);
        const frameCol = frameIndex % 2, frameRow = Math.floor(frameIndex / 2);
        const frameW = mapImage.width / 2, frameH = mapImage.height / 4;
        const scale = Math.max(W / frameW, H / frameH);
        ctx.drawImage(mapImage, frameCol*frameW, frameRow*frameH, frameW, frameH, (W-frameW*scale)/2, (H-frameH*scale)/2, frameW*scale, frameH*scale);
        animalsOnMap.forEach(a => { a.update(dt); a.draw(scale); });
    }
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
