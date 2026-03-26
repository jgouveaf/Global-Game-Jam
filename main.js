// ========================= AgriCorp Game (Submission Build v19.0) =========================
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

const mapImage = new Image();
mapImage.src = 'sprites/Mapa..png';
let mapLoaded = false, WW = 0, WH = 0, gameState = 'menu';

mapImage.onload = () => { mapLoaded = true; WW = mapImage.width/2; WH = mapImage.height/4; };

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
var coins = 10000, community = 100, isGameOver = false;
var harvestedWheat = 0, harvestedCarrot = 0, totalEggs = 0, totalMeat = 0, totalMilk = 0;
var timeElapsed = 0, decayMultiplier = 1.0;

const animalsOnMap = [];
const animalSprites = { pato: new Image(), galinha: new Image(), coelho: new Image(), ovelha: new Image(), vaca: new Image(), cavalo: new Image() };
animalSprites.pato.src='sprites/Pato.png'; animalSprites.galinha.src='sprites/Galinha.png'; animalSprites.coelho.src='sprites/Coelho.png';
animalSprites.ovelha.src='sprites/Ovelha.png'; animalSprites.vaca.src='sprites/Piskel Vaquinha.png'; animalSprites.cavalo.src='sprites/Cavalo.png';

const animalLots = [
    { type: 'pato',    n: 'Duck',    i: '🦆', p: 150,  y: { e: 1, m: 0, l: 0 } },
    { type: 'coelho',  n: 'Rabbit',  i: '🐇', p: 250,  y: { e: 0, m: 1, l: 0 } },
    { type: 'galinha', n: 'Chicken', i: '🐔', p: 400,  y: { e: 5, m: 0, l: 0 } },
    { type: 'cavalo',  n: 'Horse',   i: '🐎', p: 800,  y: { e: 0, m: 0, l: 0 } },
    { type: 'ovelha',  n: 'Sheep',   i: '🐑', p: 1200, y: { e: 0, m: 3, l: 0 } },
    { type: 'vaca',    n: 'Cow',     i: '🐄', p: 2000, y: { e: 0, m: 10, l: 6 } }
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
        this.type = type; this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.moveTimer = 3000;
    }
    update(dt) {
        this.moveTimer -= dt;
        if (this.moveTimer <= 0) {
            this.vx = (Math.random() - 0.5) * 0.4; this.vy = (Math.random() - 0.5) * 0.4;
            this.moveTimer = 3000 + Math.random() * 3000;
        }
        this.x += this.vx; this.y += this.vy;
        this.x = Math.max(150, Math.min(this.x, 1750)); this.y = Math.max(150, Math.min(this.y, 950));
    }
    draw(scale) {
        const img = animalSprites[this.type];
        if (!img.complete || img.naturalWidth === 0) return;
        const isV = (this.type === 'vaca');
        const fh = isV ? img.height : img.height/2;
        const dw = img.width * scale, dh = fh * scale;
        const dx = (W - WW*scale)/2, dy = (H - WH*scale)/2;
        // DRAW STATIC IMAGE (FRAME 0)
        ctx.drawImage(img, 0, 0, img.width, fh, dx + this.x*scale - dw/2, dy + this.y*scale - dh/2, dw, dh);
    }
}

function updateHUD() {
    if(gameState === 'menu') return;
    const hp = document.getElementById('hp-bar'); if(hp) hp.style.width = community + '%';
    const hV = document.getElementById('hud-value'); if(hV) hV.textContent = Math.round(community);
    const hC = document.getElementById('hud-coins-value'); if(hC) hC.textContent = Math.round(coins);
    const hS = document.getElementById('hud-products-value'); if(hS) hS.textContent = Math.round(harvestedWheat + harvestedCarrot + totalEggs + totalMeat + totalMilk);
    if (community <= 0 && !isGameOver) { isGameOver = true; document.getElementById('game-over-overlay').classList.remove('hidden'); }
}

function updateInventory() {
    const list = document.getElementById('inv-crops-list');
    if (list) {
        list.innerHTML = `<div>🌾 Wheat: ${Math.round(harvestedWheat)}</div><div>🥕 Carrot: ${Math.round(harvestedCarrot)}</div><div>🥚 Eggs: ${totalEggs}</div><div>🥩 Meat: ${totalMeat}</div><div>🥛 Milk: ${totalMilk}</div>`;
    }
}

setInterval(() => {
    if (isGameOver || gameState === 'menu') return;
    purchasedLotsStatus.forEach(idx => {
        const lot = lots[idx]; if (lot.t === 'wheat') harvestedWheat += (2 * lot.m); else harvestedCarrot += (5 * lot.m);
    });
    animalsOnMap.forEach(a => {
        const d = animalLots.find(i => i.type === a.type); if(d) { totalEggs += d.y.e; totalMeat += d.y.m; totalMilk += d.y.l; }
    });
    updateInventory(); updateHUD();
}, 8000);

setInterval(() => {
    if (isGameOver || gameState === 'menu') return;
    timeElapsed++; if (timeElapsed % 25 === 0) decayMultiplier += 0.35; // FALLING FASTER
    let hR = Math.min(0.70, animalsOnMap.filter(a=>a.type==='cavalo').length * 0.15);
    community -= (0.55 * decayMultiplier) * (1 - hR);
    updateHUD();
}, 1000);

window.sellE = () => {
    const total = harvestedWheat + harvestedCarrot + totalEggs + totalMeat + totalMilk;
    if (total <= 0) return;
    coins += (harvestedWheat * 2) + (harvestedCarrot * 4) + (totalEggs * 8) + (totalMeat * 25) + (totalMilk * 12);
    community = Math.min(100, community + (total * 0.15));
    harvestedWheat = 0; harvestedCarrot = 0; totalEggs = 0; totalMeat = 0; totalMilk = 0;
    updateHUD(); updateInventory();
}

function renderShops() {
    const landC = document.getElementById('lots-container');
    if(landC) {
        landC.innerHTML = '';
        lots.forEach((lt, i) => {
            const isO = purchasedLotsStatus.includes(i), isN = purchasedLotsStatus.length===i, isL = !isO && !isN;
            const div = document.createElement('div'); div.className = 'shop-card'; 
            div.innerHTML = `<img src="sprites/Lote${lt.id}.png" style="width:30px; ${isL?'filter:grayscale(1)':''}"><h3>${lt.n}</h3><button onclick="bL(${i})" class="buy-btn" style="background:${isO?'#27ae60':(isL?'#444':'#8b4513')};" ${isL?'disabled':''}>${isO?'OWNED':(isL?'LOCKED':'💰 '+lt.p)}</button>`;
            landC.appendChild(div);
        });
    }
    const animC = document.getElementById('animals-container');
    if(animC) {
        animC.innerHTML = '';
        animalLots.forEach(a => {
            const div = document.createElement('div'); div.className = 'shop-card';
            div.innerHTML = `<div style="font-size:32px;">${a.i}</div><h3>${a.n}</h3><button onclick="bA('${a.type}', ${a.p})" class="buy-btn" style="background:#3498db;">💰 ${a.p}</button>`;
            animC.appendChild(div);
        });
    }
}
window.bA = (t,p) => { if(coins>=p){ coins-=p; animalsOnMap.push(new Animal(t, 1000+(Math.random()-0.5)*800, 600+(Math.random()-0.5)*400)); updateHUD(); updateInventory(); } };
window.bL = (i) => { if(coins>=lots[i].p && !purchasedLotsStatus.includes(i)){ coins-=lots[i].p; purchasedLotsStatus.push(i); updateHUD(); renderShops(); } };

window.onload = () => {
    const safe = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
    safe('btn-play', () => { gameState = 'playing'; document.getElementById('menu-overlay').classList.add('hidden'); document.getElementById('game-ui').classList.remove('hidden'); });
    safe('btn-exit', () => { location.reload(); });
    safe('btn-open-inventory', () => { updateInventory(); document.getElementById('inventory-overlay').classList.remove('hidden'); });
    safe('btn-inv-voltar', () => document.getElementById('inventory-overlay').classList.add('hidden'));
    safe('btn-open-lots', () => { renderShops(); document.getElementById('lots-overlay').classList.remove('hidden'); });
    safe('btn-open-animals', () => { renderShops(); document.getElementById('animal-shop-overlay').classList.remove('hidden'); });
    safe('btn-open-tutorial', () => { document.getElementById('tutorial-overlay').classList.remove('hidden'); });
    safe('btn-close-tut', () => { document.getElementById('tutorial-overlay').classList.add('hidden'); });
    safe('btn-sell-manual', sellE);
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
