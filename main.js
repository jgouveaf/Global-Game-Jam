// ========================= AgriCorp Game (Final Polish v14.0) =========================
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
var coins = 10000, community = 100, isGameOver = false; // 10000 for TESTING
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
    { type: 'pato',    name: 'Duck',    img: '🦆', price: 150,  desc: 'Poco ovo', yield: { coins: 5, egg: 1, meat: 0, milk: 0 } },
    { type: 'coelho',  name: 'Rabbit',  img: '🐇', price: 250,  desc: 'Poca carne', yield: { coins: 10, egg: 0, meat: 1, milk: 0 } },
    { type: 'galinha', name: 'Chicken', img: '🐔', price: 400,  desc: 'Mtt ovo!', yield: { coins: 20, egg: 5, meat: 0, milk: 0 } },
    { type: 'cavalo',  name: 'Horse',   img: '🐎', price: 800,  desc: 'Acelera venda', yield: { coins: 0, egg: 0, meat: 0, milk: 0 } },
    { type: 'ovelha',  name: 'Sheep',   img: '🐑', price: 1200, desc: 'Carne normal', yield: { coins: 60, egg: 0, meat: 3, milk: 0 } },
    { type: 'vaca',    name: 'Cow',     img: '🐄', price: 2000, desc: 'Mtt carne/leite', yield: { coins: 150, egg: 0, meat: 8, milk: 5 } }
];

const lots = [
    { id: 1, name: "Northwest", price: 0,    multiplier: 1,  target: 'wheat'  }, 
    { id: 2, name: "North Center", price: 500,  multiplier: 2,  target: 'carrot' }, 
    { id: 3, name: "East A", price: 1200, multiplier: 4,  target: 'carrot' }, 
    { id: 4, name: "East B", price: 2500, multiplier: 6,  target: 'wheat'  }, 
    { id: 5, name: "South Center", price: 5000, multiplier: 8,  target: 'wheat'  }, 
    { id: 6, name: "Southeast", price: 8000, multiplier: 12, target: 'carrot' }
];
let purchasedLotsStatus = [0];

class Animal {
    constructor(type, x, y) {
        this.type = type; this.x = x; this.y = y; this.frame = 0; this.nextFrameTime = 0;
        this.vx = (Math.random() - 0.5) * 1.5; this.vy = (Math.random() - 0.5) * 1.5;
        this.moveTimer = 2000;
    }
    update(dt, frameW, frameH) {
        this.nextFrameTime += dt;
        if (this.nextFrameTime > 300) { this.frame = (this.frame + 1) % 2; this.nextFrameTime = 0; }
        this.moveTimer -= dt;
        if (this.moveTimer <= 0) {
            this.vx = (Math.random() - 0.5) * 1.5; this.vy = (Math.random() - 0.5) * 1.5;
            this.moveTimer = 2000 + Math.random() * 2000;
        }
        
        this.x += this.vx; this.y += this.vy;
        
        // STRICT MAP LIMITS (Stay inside current frame) - Calibrated to not cross fences
        this.x = Math.max(100, Math.min(this.x, 1820)); 
        this.y = Math.max(100, Math.min(this.y, 980));
    }
    draw(scale) {
        const img = animalSprites[this.type];
        if (img.complete && img.naturalWidth > 0) {
            const fh = img.height / 2;
            const dw = img.width * scale;
            const dh = fh * scale;
            const dx = (W - WW * scale) / 2;
            const dy = (H - WH * scale) / 2;
            ctx.drawImage(img, 0, this.frame * fh, img.width, fh, dx + this.x * scale - dw / 2, dy + this.y * scale - dh / 2, dw, dh);
        }
    }
}

function updateHUD() {
    const hpBar = document.getElementById('hp-bar');
    if(hpBar) hpBar.style.width = community + '%';
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

// BREAD WINNING (AUTOMATED)
setInterval(() => {
    if (isGameOver) return;
    purchasedLotsStatus.forEach(idx => {
        const lot = lots[idx];
        const yieldAmount = (lot.target === 'wheat' ? 2 : 5);
        coins += (yieldAmount * lot.multiplier);
        if (lot.target === 'wheat') harvestedWheat += yieldAmount; else harvestedCarrot += yieldAmount;
        community = Math.min(100, community + 0.1); 
    });
    animalsOnMap.forEach(a => {
        const data = animalLots.find(d => d.type === a.type);
        if(!data) return;
        coins += data.yield.coins;
        totalEggs += data.yield.egg;
        totalMeat += data.yield.meat;
        totalMilk += data.yield.milk;
        if (data.yield.egg > 0 || data.yield.meat > 0 || data.yield.milk > 0) community = Math.min(100, community + 0.1);
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
    community -= (0.25 * decayMultiplier) * (1 - reduction);
    updateHUD();
}, 1000);

window.sellEverything = () => {
    const totalItems = harvestedWheat + harvestedCarrot + totalEggs + totalMeat + totalMilk;
    if (totalItems <= 0) { alert("Warehouse is empty!"); return; }
    
    let profit = (harvestedWheat * 2) + (harvestedCarrot * 4) + (totalEggs * 10) + (totalMeat * 25) + (totalMilk * 15);
    coins += profit;
    community = Math.min(100, community + (totalItems * 0.1));
    
    harvestedWheat = 0; harvestedCarrot = 0; totalEggs = 0; totalMeat = 0; totalMilk = 0;
    updateHUD(); updateInventory();
}

function renderShops() {
    const animContainer = document.getElementById('animals-container');
    if(animContainer) {
        animContainer.innerHTML = '';
        animalLots.forEach(a => {
            const div = document.createElement('div');
            div.className = 'shop-card';
            div.innerHTML = `<div class="card-icon">${a.img}</div><h3 style="font-size:10px;">${a.name}</h3><p style="font-size:7px;">${a.desc}</p><button onclick="buyA('${a.type}', ${a.price})" class="buy-btn" style="background:#3498db;">💰 ${a.price}</button>`;
            animContainer.appendChild(div);
        });
    }
    const landContainer = document.getElementById('lots-container');
    if(landContainer) {
        landContainer.innerHTML = '';
        lots.forEach((lot, index) => {
            const isP = purchasedLotsStatus.includes(index);
            const div = document.createElement('div');
            div.className = 'shop-card';
            div.innerHTML = `<img src="sprites/Lote${lot.id}.png" style="width:40px;"><h3>${lot.name}</h3><button onclick="buyL(${index})" class="buy-btn" style="background:${isP?'#27ae60':'#8b4513'}">${isP?'OK':'💰 '+lot.price}</button>`;
            landContainer.appendChild(div);
        });
    }
}

window.buyA = (t, p) => { if(coins>=p){ coins-=p; animalsOnMap.push(new Animal(t, 600+Math.random()*600, 400+Math.random()*300)); updateHUD(); } else alert("No coins!"); };
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

function loop(now){
    const dt = now - lastTime; lastTime = now;
    ctx.fillStyle = "#325e22";
    ctx.fillRect(0, 0, W, H);
    if (mapLoaded) {
        const fI = Math.min(Math.max(0, purchasedLotsStatus.length), 6);
        const fW = mapImage.width / 2, fH = mapImage.height / 4;
        const s = Math.max(W / fW, H / fH);
        ctx.drawImage(mapImage, (fI%2)*fW, Math.floor(fI/2)*fH, fW, fH, (W-fW*s)/2, (H-fH*s)/2, fW*s, fH*s);
        animalsOnMap.forEach(a => { a.update(dt, fW, fH); a.draw(s); });
    }
    requestAnimationFrame(loop);
}
let lastTime = performance.now();
requestAnimationFrame(loop);
