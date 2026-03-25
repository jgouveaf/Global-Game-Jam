// ========================= AgriCorp Game (Final Clean Version) =========================
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

const mapImage = new Image();
mapImage.src = 'sprites/Mapa.png';
let mapLoaded = false;
let WW = 2800, WH = 1400; 

mapImage.onload = () => {
    mapLoaded = true;
    WW = mapImage.width;
    WH = mapImage.height;
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
const EDGE = 0.15, CAM_SPEED = 10;
window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

// ESTADOS
let isWatering = false, wateringTimer = 0, moedas = 2000, sementesTrigo = 10, comunidade = 100;
const crops = [], blueField = { x: 1580, y: 580, w: 900, h: 540 };

// ANIMAIS
const animalsOnMap = [], animalsUnlocked = ['pato'];
const unlockOrder = ['pato', 'coelho', 'ovelha', 'galinha', 'porco', 'cavalo'];
const animalSprites = { pato: new Image(), galinha: new Image(), coelho: new Image(), ovelha: new Image(), porco: new Image(), cavalo: new Image() };
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
        const pay = {pato:5, galinha:15, coelho:10, ovelha:35, porco:60, cavalo:120};
        moedas += pay[this.type] || 0;
        updateHUD();
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
    
    // Atualiza Loja
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
}

function updateInventory() {
    const list = document.getElementById('inv-animals-list');
    if (!list) return;
    const counts = {};
    animalsOnMap.forEach(a => counts[a.type] = (counts[a.type] || 0) + 1);
    list.innerHTML = '';
    const emojiMap = { pato: '🦆', galinha: '🐔', coelho: '🐇', ovelha: '🐑', porco: '🐖', cavalo: '🐎' };
    if (animalsOnMap.length === 0) list.innerHTML = '<div class="inv-item">Nenhum comprado</div>';
    for (const [type, count] of Object.entries(counts)) {
        const div = document.createElement('div'); div.className = 'inv-item';
        div.textContent = `${emojiMap[type] || ''} ${type.charAt(0).toUpperCase() + type.slice(1)} (${count})`;
        list.appendChild(div);
    }
}

function buyAnimal(type, price) {
    if (moedas >= price) {
        moedas -= price;
        const spawnX = camera.x + 200 + Math.random() * (W - 400);
        const spawnY = camera.y + 200 + Math.random() * (H - 400);
        animalsOnMap.push(new Animal(type, spawnX, spawnY));
        const idx = unlockOrder.indexOf(type);
        if (idx !== -1 && idx < unlockOrder.length - 1) {
            const next = unlockOrder[idx + 1];
            if (!animalsUnlocked.includes(next)) animalsUnlocked.push(next);
        }
        updateHUD(); updateInventory();
    } else alert("Sem moedas!");
}

// INICIALIZADOR DE EVENTOS
window.onload = () => {
    document.getElementById('btn-open-shop').onclick = () => document.getElementById('shop-overlay').classList.remove('hidden');
    document.getElementById('btn-shop-voltar').onclick = () => document.getElementById('shop-overlay').classList.add('hidden');
    document.getElementById('btn-open-inventory').onclick = () => document.getElementById('inventory-overlay').classList.remove('hidden');
    document.getElementById('btn-inv-voltar').onclick = () => document.getElementById('inventory-overlay').classList.add('hidden');
    
    document.getElementById('btn-buy-seed').onclick = () => {
        if (moedas >= 10) { moedas -= 10; sementesTrigo++; updateHUD(); }
        else alert("Sem moedas!");
    };
    
    document.getElementById('btn-water').onclick = () => {
        if (isWatering) return;
        isWatering = true; wateringTimer = 10;
        document.getElementById('planting-timer').classList.remove('hidden');
        const itv = setInterval(() => {
            wateringTimer--;
            document.getElementById('timer-sec').textContent = wateringTimer;
            if (wateringTimer <= 0) { clearInterval(itv); isWatering = false; document.getElementById('planting-timer').classList.add('hidden'); }
        }, 1000);
    };
    
    updateHUD();
};

window.onmousedown = (e) => {
    if (isWatering && wateringTimer > 0 && e.target.tagName !== 'BUTTON') {
        const wx = e.clientX + camera.x, wy = e.clientY + camera.y;
        if (wx > blueField.x && wx < blueField.x + blueField.w && wy > blueField.y && wy < blueField.y + blueField.h) {
            if (!crops.some(c => Math.hypot(c.x-wx, c.y-wy) < 30)) crops.push({x:wx, y:wy});
        }
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
        if (isWatering) { ctx.strokeStyle = '#0ff'; ctx.lineWidth = 3; ctx.strokeRect(blueField.x-camera.x, blueField.y-camera.y, blueField.w, blueField.h); }
        crops.forEach(c => { ctx.font = '30px Arial'; ctx.fillText('🌾', c.x - camera.x - 15, c.y - camera.y + 15); });
    }
    animalsOnMap.forEach(a => { a.update(dt); a.draw(); });
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
