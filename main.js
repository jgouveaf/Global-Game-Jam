// ========================= AgriCorp Game (Final Build v17.0) =========================
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

const mapImage = new Image();
mapImage.src = 'sprites/Mapa..png';
let mapLoaded = false, WW = 0, WH = 0, gameState = 'menu';

mapImage.onload = () => { mapLoaded = true; WW = mapImage.width / 2; WH = mapImage.height / 4; };

let W, H;
function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    W = canvas.width; H = canvas.height;
}
resize();
window.addEventListener('resize', resize);

// GAME STATES
var coins = 500, community = 100, isGameOver = false;
var harvestedWheat = 0, harvestedCarrot = 0, totalEggs = 0, totalMeat = 0, totalMilk = 0, horseCount = 0;
var timeElapsed = 0, decayMultiplier = 1.0;

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

const animalLots = [
    { type: 'pato',    name: 'Duck',    icon: '🦆', price: 150,  yield: { e: 1, m: 0, l: 0 } },
    { type: 'coelho',  name: 'Rabbit',  icon: '🐇', price: 250,  yield: { e: 0, m: 1, l: 0 } },
    { type: 'galinha', name: 'Chicken', icon: '🐔', price: 400,  yield: { e: 5, m: 0, l: 0 } },
    { type: 'cavalo',  name: 'Horse',   icon: '🐎', price: 800,  yield: { e: 0, m: 0, l: 0 } },
    { type: 'ovelha',  name: 'Sheep',   icon: '🐑', price: 1200, yield: { e: 0, m: 3, l: 0 } },
    { type: 'vaca',    name: 'Cow',     icon: '🐄', price: 2000, yield: { e: 0, m: 10, l: 6 } }
];

const lots = [
    { id: 1, n: "NW Plot", p: 0,    m: 1,  t: 'wheat'  }, 
    { id: 2, n: "NC Plot", p: 800,  m: 2,  t: 'carrot' }, 
    { id: 3, n: "EA Plot", p: 2000, m: 4,  t: 'carrot' }, 
    { id: 4, n: "EB Plot", p: 4500, m: 6,  t: 'wheat'  }, 
    { id: 5, n: "SC Plot", p: 8000, m: 8,  t: 'wheat'  }, 
    { id: 6, n: "SE Plot", p: 15000, m: 12, t: 'carrot' }
];
let purchasedLotsStatus = [0];

class Animal {
    constructor(type, x, y) {
        this.type = type; this.x = x; this.y = y; this.frame = 0; this.nextFrameTime = 0;
        this.vx = (Math.random() - 0.5) * 0.6; // SLOWER MOVEMENT
        this.vy = (Math.random() - 0.5) * 0.6;
        this.moveTimer = 3000;
    }
    update(dt) {
        this.nextFrameTime += dt;
        if (this.nextFrameTime > 400) { this.frame = (this.frame + 1) % 2; this.nextFrameTime = 0; }
        this.moveTimer -= dt;
        if (this.moveTimer <= 0) {
            this.vx = (Math.random() - 0.5) * 0.6; this.vy = (Math.random() - 0.5) * 0.6;
            this.moveTimer = 2000 + Math.random() * 3000;
        }
        this.x += this.vx; this.y += this.vy;
        // STAY INSIDE GREEN AREAS (Relative World Coords)
        this.x = Math.max(150, Math.min(this.x, 1750)); 
        this.y = Math.max(150, Math.min(this.y, 950));
    }
    draw(scale) {
        const img = animalSprites[this.type];
        if (img.complete && img.naturalSize > 0) return;
        const isV = (this.type === 'vaca');
        const fh = isV ? img.height : img.height/2;
        const dw = img.width * scale, dh = fh * scale;
        const dx = (W - WW*scale)/2, dy = (H - WH*scale)/2;
        ctx.drawImage(img, 0, this.frame * (isV?0:img.height/2), img.width, fh, dx + this.x*scale - dw/2, dy + this.y*scale - dh/2, dw, dh);
    }
}

function updateHUD() {
    if(gameState === 'menu') return;
    document.getElementById('hp-bar').style.width = community + '%';
    document.getElementById('hud-value').textContent = Math.round(community);
    document.getElementById('hud-coins-value').textContent = Math.round(coins);
    const storageTotal = Math.round(harvestedWheat + harvestedCarrot + totalEggs + totalMeat + totalMilk);
    document.getElementById('hud-products-value').textContent = storageTotal;
    if (community <= 0 && !isGameOver) { isGameOver = true; document.getElementById('game-over-overlay').classList.remove('hidden'); }
}

function updateInventory() {
    const list = document.getElementById('inv-crops-list');
    if (list) {
        list.innerHTML = `
            <div>🌾 Wheat: ${Math.round(harvestedWheat)}</div>
            <div>🥕 Carrot: ${Math.round(harvestedCarrot)}</div>
            <div>🥚 Eggs: ${totalEggs}</div>
            <div>🥩 Meat: ${totalMeat}</div>
            <div>🥛 Milk: ${totalMilk}</div>
        `;
    }
}

// PASSIVE GROWTH (NO COINS)
setInterval(() => {
    if (isGameOver || gameState === 'menu') return;
    purchasedLotsStatus.forEach(idx => {
        const lot = lots[idx];
        if (lot.t === 'wheat') harvestedWheat += (2 * lot.m); else harvestedCarrot += (5 * lot.m);
    });
    animalsOnMap.forEach(a => {
        const d = animalLots.find(i => i.type === a.type);
        if(!d) return;
        totalEggs += d.yield.e; totalMeat += d.yield.m; totalMilk += d.yield.l;
    });
    updateInventory(); updateHUD();
}, 8000);

// FASTER DECAY
setInterval(() => {
    if (isGameOver || gameState === 'menu') return;
    timeElapsed++;
    if (timeElapsed % 30 === 0) decayMultiplier += 0.25; // Accelerates every 30s
    let horseReduction = Math.min(0.65, animalsOnMap.filter(a=>a.type==='cavalo').length * 0.12);
    community -= (0.45 * decayMultiplier) * (1 - horseReduction); // HIGHER BASE DECAY
    updateHUD();
}, 1000);

window.sellEverything = () => {
    const totalItems = harvestedWheat + harvestedCarrot + totalEggs + totalMeat + totalMilk;
    if (totalItems <= 0) return;
    let profit = (harvestedWheat * 2) + (harvestedCarrot * 4) + (totalEggs * 8) + (totalMeat * 20) + (totalMilk * 12);
    coins += profit; 
    community = Math.min(100, community + (totalItems * 0.1)); // Selling feeds community
    harvestedWheat = 0; harvestedCarrot = 0; totalEggs = 0; totalMeat = 0; totalMilk = 0;
    updateHUD(); updateInventory();
}

function renderShops() {
    const landC = document.getElementById('lots-container');
    if(landC) {
        landC.innerHTML = '';
        lots.forEach((lot, i) => {
            const isO = purchasedLotsStatus.includes(i), isN = purchasedLotsStatus.length===i, isL = !isO && !isN;
            const div = document.createElement('div'); div.className = 'shop-card';
            div.style.opacity = isL?'0.5':'1';
            div.innerHTML = `<img src="sprites/Lote${lot.id}.png" style="width:40px; ${isL?'filter:grayscale(1)':''}"><h3>${lot.n}</h3><button onclick="buyL(${i})" class="buy-btn" style="background:${isO?'#27ae60':(isL?'#444':'#8b4513')};" ${isL?'disabled':''}>${isO?'OWNED':(isL?'LOCKED':'💰 '+lot.p)}</button>`;
            landC.appendChild(div);
        });
    }
    const animC = document.getElementById('animals-container');
    if(animC) {
        animC.innerHTML = '';
        animalLots.forEach(a => {
            const div = document.createElement('div'); div.className = 'shop-card';
            div.innerHTML = `<div style="font-size:32px;">${a.icon}</div><h3>${a.name}</h3><button onclick="buyA('${a.type}', ${a.price})" class="buy-btn" style="background:#3498db;">💰 ${a.price}</button>`;
            animC.appendChild(div);
        });
    }
}

window.buyA = (t,p) => { if(coins>=p){ coins-=p; animalsOnMap.push(new Animal(t, 1000+(Math.random()-0.5)*800, 600+(Math.random()-0.5)*400)); updateHUD(); updateInventory(); } };
window.buyL = (i) => { if(coins>=lots[i].p && !purchasedLotsStatus.includes(i)){ coins-=lots[i].p; purchasedLotsStatus.push(i); updateHUD(); renderShops(); } };

window.onload = () => {
    document.getElementById('btn-play').onclick = () => {
        gameState = 'playing';
        document.getElementById('menu-overlay').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
    };
    document.getElementById('btn-exit').onclick = () => { location.reload(); };
    
    document.getElementById('btn-open-inventory').onclick = () => { updateInventory(); document.getElementById('inventory-overlay').classList.remove('hidden'); };
    document.getElementById('btn-inv-voltar').onclick = () => document.getElementById('inventory-overlay').classList.add('hidden');
    document.getElementById('btn-open-lots').onclick = () => { renderShops(); document.getElementById('lots-overlay').classList.remove('hidden'); };
    document.getElementById('btn-open-animals').onclick = () => { renderShops(); document.getElementById('animal-shop-overlay').classList.remove('hidden'); };
    document.getElementById('btn-sell-manual').onclick = sellEverything;
};

let lastTime = performance.now();
function loop(now){
    const dt = now - lastTime; lastTime = now;
    if (gameState === 'playing') {
        ctx.fillStyle = "#325e22"; ctx.fillRect(0,0,W,H);
        if (mapLoaded) {
            const fI = Math.min(Math.max(0, purchasedLotsStatus.length), 6), fW = mapImage.width/2, fH = mapImage.height/4, s = Math.max(W/fW, H/fH);
            ctx.drawImage(mapImage, (fI%2)*fW, Math.floor(fI/2)*fH, fW, fH, (W-fW*s)/2, (H-fH*s)/2, fW*s, fH*s);
            animalsOnMap.forEach(a => { a.update(dt); a.draw(s); });
        }
    }
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
