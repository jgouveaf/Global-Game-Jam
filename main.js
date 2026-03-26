// ========================= AgriCorp Game (Final Final Polish v15.0) =========================
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
var coins = 10000, community = 100, isGameOver = false; // 10000 coins for YOU to test!
var harvestedWheat = 0, harvestedCarrot = 0, totalEggs = 0, totalMeat = 0, totalMilk = 0;
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
    { type: 'pato',    name: 'Duck',    img: 'sprites/Pato.png',    price: 150,  desc: 'Little Egg', yield: { coins: 8, egg: 1, meat: 0, milk: 0 } },
    { type: 'coelho',  name: 'Rabbit',  img: 'sprites/Coelho.png',  price: 250,  desc: 'Little Meat', yield: { coins: 15, egg: 0, meat: 1, milk: 0 } },
    { type: 'galinha', name: 'Chicken', img: 'sprites/Galinha.png', price: 400,  desc: 'Lots of Eggs!', yield: { coins: 25, egg: 5, meat: 0, milk: 0 } },
    { type: 'cavalo',  name: 'Horse',   img: 'sprites/Cavalo.png',  price: 800,  desc: 'Speed Up Sales', yield: { coins: 0, egg: 0, meat: 0, milk: 0 } },
    { type: 'ovelha',  name: 'Sheep',   img: 'sprites/Ovelha.png',  price: 1200, desc: 'Normal Meat', yield: { coins: 70, egg: 0, meat: 3, milk: 0 } },
    { type: 'vaca',    name: 'Cow',     img: 'sprites/Piskel Vaquinha.png', price: 2000, desc: 'Lots of Meat/Milk', yield: { coins: 180, egg: 0, meat: 10, milk: 6 } }
];

const lots = [
    { id: 1, name: "Northwest", price: 0,    m: 1,  tgt: 'wheat'  }, 
    { id: 2, name: "North Center", price: 500,  m: 2,  tgt: 'carrot' }, 
    { id: 3, name: "East A", price: 1200, m: 4,  tgt: 'carrot' }, 
    { id: 4, name: "East B", price: 2500, m: 6,  tgt: 'wheat'  }, 
    { id: 5, name: "South Center", price: 5000, m: 8,  tgt: 'wheat'  }, 
    { id: 6, name: "Southeast", price: 8000, m: 12, tgt: 'carrot' }
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
        
        // Strict map limits to prevent animals from going to the road or out of map
        this.x = Math.max(100, Math.min(this.x, 1820)); 
        this.y = Math.max(100, Math.min(this.y, 980));
    }
    draw(scale) {
        const img = animalSprites[this.type];
        if (img.complete && img.naturalSize > 0) return; // safeguard
        const fh = img.height / (this.type === 'vaca' ? 1 : 2); // some are frames, some single
        // Standard draw logic with camera fixed offset
        const dx = (W - WW*scale)/2; const dy = (H - WH*scale)/2;
        ctx.drawImage(img, 0, this.frame * (img.height/2), img.width, (img.height/2), dx + this.x*scale - (img.width*scale)/2, dy + this.y*scale - (fh*scale)/2, img.width*scale, fh*scale);
    }
}

function updateHUD() {
    const hp = document.getElementById('hp-bar'); if(hp) hp.style.width = community + '%';
    document.getElementById('hud-value').textContent = Math.round(community);
    document.getElementById('hud-coins-value').textContent = Math.round(coins);
    document.getElementById('hud-harvest-value').textContent = Math.round(harvestedWheat + harvestedCarrot);
    document.getElementById('hud-products-value').textContent = Math.round(totalEggs + totalMeat + totalMilk);
    if (community <= 0 && !isGameOver) { isGameOver = true; document.getElementById('game-over-overlay').classList.remove('hidden'); }
}

function updateInventory() {
    const list = document.getElementById('inv-crops-list');
    if (list) {
        list.innerHTML = `
            <div class="inv-item"><img src="sprites/Trigo.png" class="pixel-icon"> Wheat: ${Math.round(harvestedWheat)}</div>
            <div class="inv-item"><img src="sprites/Cenoura.png" class="pixel-icon"> Carrot: ${Math.round(harvestedCarrot)}</div>
            <div class="inv-item"><img src="sprites/ovo.png" class="pixel-icon"> Eggs: ${totalEggs}</div>
            <div class="inv-item">🥩 Meat: ${totalMeat}</div>
            <div class="inv-item">🥛 Milk: ${totalMilk}</div>
        `;
    }
}

// PERIODIC PRODUCTION
setInterval(() => {
    if (isGameOver) return;
    purchasedLotsStatus.forEach(idx => {
        const lot = lots[idx];
        const yieldAmt = (lot.tgt === 'wheat' ? 2 : 5);
        coins += (yieldAmt * lot.m);
        if (lot.tgt === 'wheat') harvestedWheat += yieldAmt; else harvestedCarrot += yieldAmt;
        community = Math.min(100, community + 0.1); 
    });
    animalsOnMap.forEach(a => {
        const d = animalLots.find(i => i.type === a.type);
        if(!d) return;
        coins += d.yield.coins; totalEggs += d.yield.egg; totalMeat += d.yield.meat; totalMilk += d.yield.milk;
        if (d.yield.egg > 0 || d.yield.meat > 0 || d.yield.milk > 0) community = Math.min(100, community + 0.1);
    });
    updateHUD(); updateInventory();
}, 8000);

// PROGRESSIVE DECAY
setInterval(() => {
    if (isGameOver) return;
    timeElapsed++;
    if (timeElapsed % 45 === 0) decayMultiplier += 0.2;
    let horseCount = animalsOnMap.filter(a => a.type === 'cavalo').length;
    let reduction = Math.min(0.7, horseCount * 0.12);
    community -= (0.2 * decayMultiplier) * (1 - reduction);
    updateHUD();
}, 1000);

window.sellEverything = () => {
    const totalItems = harvestedWheat + harvestedCarrot + totalEggs + totalMeat + totalMilk;
    if (totalItems <= 0) return;
    let profit = (harvestedWheat * 2) + (harvestedCarrot * 4) + (totalEggs * 10) + (totalMeat * 25) + (totalMilk * 15);
    coins += profit; community = Math.min(100, community + (totalItems * 0.15));
    harvestedWheat = 0; harvestedCarrot = 0; totalEggs = 0; totalMeat = 0; totalMilk = 0;
    updateHUD(); updateInventory();
}

function renderShops() {
    const landC = document.getElementById('lots-container');
    if(landC) {
        landC.innerHTML = '';
        lots.forEach((lot, i) => {
            const isP = purchasedLotsStatus.includes(i);
            const div = document.createElement('div'); div.className = 'shop-card';
            div.innerHTML = `<img src="sprites/Lote${lot.id}.png" style="width:40px;"><h3>${lot.name}</h3><button onclick="buyL(${i})" class="buy-btn" style="background:${isP?'#27ae60':'#8b4513'}">${isP?'OWNED':'💰 '+lot.price}</button>`;
            landC.appendChild(div);
        });
    }
    const animC = document.getElementById('animals-container');
    if(animC) {
        animC.innerHTML = '';
        animalLots.forEach(a => {
            const div = document.createElement('div'); div.className = 'shop-card';
            div.innerHTML = `<img src="${a.img}" class="pixel-icon" style="width:32px; height:32px; object-fit: cover;"><h3>${a.name}</h3><p style="font-size:7px;">${a.desc}</p><button onclick="buyA('${a.type}', ${a.price})" class="buy-btn" style="background:#3498db;">💰 ${a.price}</button>`;
            animC.appendChild(div);
        });
    }
}

window.buyA = (t, p) => { if(coins>=p){ coins-=p; animalsOnMap.push(new Animal(t, 1000 + (Math.random()-0.5)*800, 600 + (Math.random()-0.5)*400)); updateHUD(); } };
window.buyL = (i) => { if(coins>=lots[i].price && !purchasedLotsStatus.includes(i)){ coins-=lots[i].price; purchasedLotsStatus.push(i); updateHUD(); renderShops(); } };

window.onload = () => {
    const bind = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
    bind('btn-open-inventory', () => { updateInventory(); document.getElementById('inventory-overlay').classList.remove('hidden'); });
    bind('btn-inv-voltar', () => document.getElementById('inventory-overlay').classList.add('hidden'));
    bind('btn-open-lots', () => { renderShops(); document.getElementById('lots-overlay').classList.remove('hidden'); });
    bind('btn-open-animals', () => { renderShops(); document.getElementById('animal-shop-overlay').classList.remove('hidden'); });
    bind('btn-sell-manual', sellEverything);
    updateHUD(); updateInventory();
};

let lastTime = performance.now();
function loop(now){
    const dt = now - lastTime; lastTime = now;
    ctx.fillStyle = "#325e22"; ctx.fillRect(0, 0, W, H);
    if (mapLoaded) {
        const fI = Math.min(Math.max(0, purchasedLotsStatus.length), 6), fW = mapImage.width/2, fH = mapImage.height/4, s = Math.max(W/fW, H/fH);
        ctx.drawImage(mapImage, (fI%2)*fW, Math.floor(fI/2)*fH, fW, fH, (W-fW*s)/2, (H-fH*s)/2, fW*s, fH*s);
        animalsOnMap.forEach(a => { a.update(dt); a.draw(s); });
    }
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
