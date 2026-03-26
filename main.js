// ========================= AgriCorp Game (ULTIMATE MASTER v26.0) =========================
// SE VOCÊ VÊ ESSE LOG NO CONSOLE (F12), ESTÁ NA VERSÃO CERTA!
console.log("AGRICORP V26 - DESCRICOES CARREGADAS OK");

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

const mapImage = new Image();
<<<<<<< HEAD
=======
mapImage.src = 'sprites/Mapa..png';
>>>>>>> 03224b3e50b6945081a7ba028d35d40be43afc6a
let mapLoaded = false, WW = 0, WH = 0, gameState = 'menu';

// Tenta vários caminhos para o mapa até um funcionar
const mapPaths = ['sprites/sprites/Mapa..png', 'sprites/sprites/Mapa.png', 'sprites/Mapa.png', 'Mapa.png'];
let currentPathIdx = 0;

function tryLoadMap() {
    if (currentPathIdx >= mapPaths.length) {
        console.error("NÃO FOI POSSÍVEL CARREGAR O MAPA EM NENHUM CAMINHO!");
        return;
    }
    console.log("Tentando carregar mapa em: " + mapPaths[currentPathIdx]);
    mapImage.src = mapPaths[currentPathIdx];
}

mapImage.onload = () => { 
    mapLoaded = true; 
    WW = mapImage.width/2; 
    WH = mapImage.height/4; 
    console.log("MAPA CARREGADO COM SUCESSO! Origem: " + mapImage.src);
};

mapImage.onerror = () => {
    console.warn("Falha ao carregar mapa em: " + mapPaths[currentPathIdx]);
    currentPathIdx++;
    tryLoadMap();
};

tryLoadMap();

let W, H;
function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    W = canvas.width; H = canvas.height;
}
resize();
window.addEventListener('resize', resize);

const clickSnd = new Audio('SomClique.mp3'); 
const natureSnd = new Audio('Natureza.mp3'); 
natureSnd.loop = true;
natureSnd.volume = 0.4;

function play(snd) { 
    if(snd) { 
        snd.currentTime = 0; 
        snd.play().catch(e => {}); 
    } 
}

// DATA - 500 COINS INITIAL
var totalCoinsJam = 500; 
var community = 100, isGameOver = false;
var harvestedWheat = 0, harvestedCarrot = 0, totalEggs = 0, totalMeat = 0, totalMilk = 0;
var timeElapsed = 0, decayMultiplier = 1.0;

const animalsOnMap = [];
const animalSprites = { pato: new Image(), galinha: new Image(), coelho: new Image(), ovelha: new Image(), vaca: new Image(), cavalo: new Image() };
animalSprites.pato.src='sprites/Pato.png'; 
animalSprites.galinha.src='sprites/Galinha.png'; 
animalSprites.coelho.src='sprites/Coelho.png';
animalSprites.ovelha.src='sprites/Ovelha.png'; 
animalSprites.vaca.src='sprites/Piskel Vaquinha.png'; 
animalSprites.cavalo.src='sprites/Cavalo.png';

const animalLots = [
<<<<<<< HEAD
    { type: 'pato',    n: 'Duck',    img: 'sprites/sprites/Pato.png',    p: 150,  desc: "🥚 Produce Eggs" },
    { type: 'coelho',  n: 'Rabbit',  img: 'sprites/sprites/Coelho.png',  p: 250,  desc: "🥩 Produce Meat" },
    { type: 'galinha', n: 'Chicken', img: 'sprites/sprites/Galinha.png', p: 400,  desc: "🥚 High Egg Yield++" },
    { type: 'cavalo',  n: 'Horse',   img: 'sprites/sprites/Cavalo.png',  p: 800,  desc: "📎 STOPS BAR DECAY!" },
    { type: 'ovelha',  n: 'Sheep',   img: 'sprites/sprites/Ovelha.png',  p: 1200, desc: "🥩 Med Meat Yield" },
    { type: 'vaca',    n: 'Cow',     img: 'sprites/sprites/Piskel Vaquinha.png', p: 2000, desc: "🥩 Meat & 🥛 Milk++" }
=======
    { type: 'pato',    n: 'Duck',    img: 'sprites/Pato.png',    p: 150,  desc: "🥚 Produce Eggs" },
    { type: 'coelho',  n: 'Rabbit',  img: 'sprites/Coelho.png',  p: 250,  desc: "🥩 Produce Meat" },
    { type: 'galinha', n: 'Chicken', img: 'sprites/Galinha.png', p: 400,  desc: "🥚 High Egg Yield++" },
    { type: 'cavalo',  n: 'Horse',   img: 'sprites/Cavalo.png',  p: 800,  desc: "🐎 STOPS BAR DECAY!" },
    { type: 'ovelha',  n: 'Sheep',   img: 'sprites/Ovelha.png',  p: 1200, desc: "🥩 Med Meat Yield" },
    { type: 'vaca',    n: 'Cow',     img: 'sprites/Piskel Vaquinha.png', p: 2000, desc: "🥩 Meat & 🥛 Milk++" }
>>>>>>> 03224b3e50b6945081a7ba028d35d40be43afc6a
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
        this.vx = (Math.random() - 0.5) * 0.4; this.vy = (Math.random() - 0.5) * 0.4;
        this.moveTimer = 3000;
    }
    update(dt) {
        this.moveTimer -= dt;
        if (this.moveTimer <= 0) {
            this.vx = (Math.random() - 0.5) * 0.4; this.vy = (Math.random() - 0.5) * 0.4;
            this.moveTimer = 2000 + Math.random() * 4000;
        }
        this.x += this.vx; this.y += this.vy;
        this.x = Math.max(200, Math.min(this.x, 1700)); this.y = Math.max(200, Math.min(this.y, 900));
    }
    draw(scale) {
        const img = animalSprites[this.type];
        if (!img.complete || img.naturalWidth === 0) return;
        const dw = img.width * scale, dh = img.height * scale;
        const dx = (W - WW*scale)/2, dy = (H - WH*scale)/2;
        ctx.drawImage(img, 0, 0, img.width, img.height, dx + this.x*scale - dw/2, dy + this.y*scale - dh/2, dw, dh);
    }
}

function updateHUD() {
    if(gameState === 'menu') return;
    const hp = document.getElementById('hp-bar'); if(hp) hp.style.width = community + '%';
    const hV = document.getElementById('hud-value'); if(hV) hV.textContent = Math.round(community);
    const hC = document.getElementById('hud-coins-value'); if(hC) hC.textContent = Math.round(totalCoinsJam);
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
        const lt = lots[idx]; if (lt.t === 'wheat') harvestedWheat += (2 * lt.m); else harvestedCarrot += (5 * lt.m);
    });
    animalsOnMap.forEach(a => {
        const d = (a.type==='pato')?{e:2,m:0,l:0}:(a.type==='galinha')?{e:8,m:0,l:0}:(a.type==='coelho')?{e:0,m:1,l:0}:(a.type==='ovelha')?{e:0,m:3,l:0}:(a.type==='vaca')?{e:0,m:8,l:5}:{e:0,m:0,l:0};
        totalEggs += d.e; totalMeat += d.m; totalMilk += d.l;
    });
    updateInventory(); updateHUD();
}, 8000);

setInterval(() => {
    if (isGameOver || gameState === 'menu') return;
    timeElapsed++; 
    if (timeElapsed > 0 && timeElapsed % 120 === 0) decayMultiplier += 0.5;
    let hR = Math.min(0.70, animalsOnMap.filter(a=>a.type==='cavalo').length * 0.15);
    community -= (0.45 * decayMultiplier) * (1 - hR);
    updateHUD();
}, 1000);

window.sellE = () => {
    play(clickSnd);
    const total = harvestedWheat + harvestedCarrot + totalEggs + totalMeat + totalMilk;
    if (total <= 0) return;
    totalCoinsJam += (harvestedWheat * 4) + (harvestedCarrot * 6) + (totalEggs * 15) + (totalMeat * 40) + (totalMilk * 25);
    community = Math.min(100, community + (total * 1.5));
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
<<<<<<< HEAD
            div.innerHTML = `<img src="sprites/sprites/Lote${lt.id}.png" style="width:30px; ${isL?'filter:grayscale(1)':''}"><h3>${lt.n}</h3><button onclick="bL(${i})" class="buy-btn" style="background:${isO?'#27ae60':(isL?'#444':'#8b4513')};" ${isL?'disabled':''}>${isO?'OWNED':(isL?'LOCKED':'💰 '+lt.p)}</button>`;
=======
            div.innerHTML = `<img src="sprites/Lote${lt.id}.png" style="width:30px; ${isL?'filter:grayscale(1)':''}"><h3>${lt.n}</h3><button onclick="bL(${i})" class="buy-btn" style="background:${isO?'#27ae60':(isL?'#444':'#8b4513')};" ${isL?'disabled':''}>${isO?'OWNED':(isL?'LOCKED':'💰 '+lt.p)}</button>`;
>>>>>>> 03224b3e50b6945081a7ba028d35d40be43afc6a
            landC.appendChild(div);
        });
    }
    const animC = document.getElementById('animals-container');
    if(animC) {
        animC.innerHTML = '';
        animalLots.forEach(a => {
            const div = document.createElement('div'); div.className = 'shop-card';
            div.innerHTML = `<img src="${a.img}" style="width:32px; height:auto; display:block; margin: 0 auto 5px; image-rendering: pixelated;">
                             <h3>${a.n}</h3>
                             <p style="font-size: 6px !important; color: #ffd700; margin-bottom: 8px;">${a.desc}</p>
                             <button onclick="bA('${a.type}', ${a.p})" class="buy-btn" style="background:#3498db;">💰 ${a.p}</button>`;
            animC.appendChild(div);
        });
    }
}
window.bA = (t,p) => { play(clickSnd); if(totalCoinsJam>=p){ totalCoinsJam-=p; animalsOnMap.push(new Animal(t, 1000+(Math.random()-0.5)*800, 600+(Math.random()-0.5)*400)); updateHUD(); updateInventory(); } };
window.bL = (i) => { play(clickSnd); if(totalCoinsJam>=lots[i].p && !purchasedLotsStatus.includes(i)){ totalCoinsJam-=lots[i].p; purchasedLotsStatus.push(i); updateHUD(); renderShops(); } };

window.onload = () => {
    const safe = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = () => { play(clickSnd); fn(); }; };
    safe('btn-play', () => { gameState = 'playing'; document.getElementById('menu-overlay').classList.add('hidden'); document.getElementById('game-ui').classList.remove('hidden'); play(natureSnd); });
    safe('btn-exit', () => { location.reload(); });
    safe('btn-open-inventory', () => { updateInventory(); document.getElementById('inventory-overlay').classList.remove('hidden'); });
    safe('btn-inv-voltar', () => document.getElementById('inventory-overlay').classList.add('hidden'));
    safe('btn-open-lots', () => { renderShops(); document.getElementById('lots-overlay').classList.remove('hidden'); });
    safe('btn-open-animals', () => { renderShops(); document.getElementById('animal-shop-overlay').classList.remove('hidden'); });
    safe('btn-open-tutorial', () => { document.getElementById('tutorial-overlay').classList.remove('hidden'); });
    safe('btn-close-tut', () => { document.getElementById('tutorial-overlay').classList.add('hidden'); });
    safe('btn-open-credits', () => { document.getElementById('credits-overlay').classList.remove('hidden'); });
    safe('btn-sell-manual', window.sellE);
};

let lastTime = performance.now();
function loop(now){
    const dt = now - lastTime; lastTime = now;
    if (gameState === 'playing') {
        ctx.fillStyle = "#325e22"; ctx.fillRect(0,0,W,H);
        if (mapLoaded) {
            // Mapa centralizado em tela cheia
            const fI = Math.min(Math.max(0, purchasedLotsStatus.length), 6);
            const fW = mapImage.width/2, fH = mapImage.height/4;
            const s = Math.max(W/fW, H/fH);
            const drawX = (W - fW*s)/2;
            const drawY = (H - fH*s)/2;
            ctx.drawImage(mapImage, (fI%2)*fW, Math.floor(fI/2)*fH, fW, fH, drawX, drawY, fW*s, fH*s);
            animalsOnMap.forEach(a => { a.update(dt); a.draw(s); });
        }
    }
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
