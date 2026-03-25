// ============================================================
//   AgriCorp – Mapa com câmera controlada pelo mouse
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
let W, H;

function resize(){
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    W = canvas.width;
    H = canvas.height;
}
resize();
window.addEventListener('resize', resize);

// ========================= MAPA =========================
const mapImage = new Image();
mapImage.src = 'sprites/Mapa.png';
let mapLoaded = false;
let WW = 2800;
let WH = 1400;
mapImage.onload = () => {
    mapLoaded = true;
    WW = mapImage.width;
    WH = mapImage.height;
};

// ========================= CÂMERA (mouse) =========================
const camera = { x: 0, y: 0 };
let mouseX = 0, mouseY = 0;

const EDGE = 0.18;
const CAM_SPEED = 6;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function updateCamera() {
    const leftZone   = W * EDGE;
    const rightZone  = W * (1 - EDGE);
    const topZone    = H * EDGE;
    const bottomZone = H * (1 - EDGE);

    if (mouseX < leftZone)   camera.x -= CAM_SPEED;
    if (mouseX > rightZone)  camera.x += CAM_SPEED;
    if (mouseY < topZone)    camera.y -= CAM_SPEED;
    if (mouseY > bottomZone) camera.y += CAM_SPEED;

    camera.x = Math.max(0, Math.min(camera.x, WW - W));
    camera.y = Math.max(0, Math.min(camera.y, WH - H));
}

// ========================= HUD =========================
let comunidade = 100;
let moedas = 1000; // Começando com moedas para testar a loja

function updateHUD() {
    const pct = Math.max(0, Math.min(comunidade, 100));
    const hpBar = document.getElementById('hp-bar');
    if(hpBar) hpBar.style.width = pct + '%';
    
    const hudVal = document.getElementById('hud-value');
    if(hudVal) hudVal.textContent = Math.round(pct);
    
    const coinVal = document.getElementById('hud-coins-value');
    if(coinVal) coinVal.textContent = moedas;
}

// ========================= ANIMAIS =========================
const animalsOnMap = [];
const animalSprites = {
    pato: new Image(),
    galinha: new Image(),
    coelho: new Image(),
    ovelha: new Image()
};
animalSprites.pato.src    = 'sprites/Pato.png';
animalSprites.galinha.src = 'sprites/Galinha.png';
animalSprites.coelho.src  = 'sprites/Coelho.png';
animalSprites.ovelha.src  = 'sprites/Ovelha.png';

class Animal {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.frame = 0;
        this.nextFrameTime = 0;
        this.productionTimer = 0;
        this.productionInterval = 5000 + Math.random() * 5000; // 5-10 segundos
    }

    update(dt) {
        // Animação: alterna entre os 2 frames a cada 300ms
        this.nextFrameTime += dt;
        if (this.nextFrameTime > 300) {
            this.frame = (this.frame + 1) % 2;
            this.nextFrameTime = 0;
        }

        // Produção: Gera moedas baseado no tipo
        this.productionTimer += dt;
        if (this.productionTimer >= this.productionInterval) {
            this.produce();
            this.productionTimer = 0;
        }
    }

    produce() {
        // Lógica de produção do usuário
        // pato dê menos ovo (5), galinha dê mais (15)
        // coelho carne (10), ovelha da mais carne (40)
        switch (this.type) {
            case 'pato':    moedas += 5; break;
            case 'galinha': moedas += 15; break;
            case 'coelho':  moedas += 10; break;
            case 'ovelha':  moedas += 40; break;
        }
        updateHUD();
    }

    draw() {
        const img = animalSprites[this.type];
        if (img.complete) {
            const fw = img.width;
            const fh = img.height / 2;
            // Centraliza o sprite na posição x,y
            ctx.drawImage(
                img,
                0, this.frame * fh, fw, fh,
                this.x - camera.x - fw/2, this.y - camera.y - fh/2, fw, fh
            );
        }
    }
}

function updateInventory() {
    const list = document.getElementById('inv-animals-list');
    if (!list) return;
    
    if (animalsOnMap.length === 0) {
        list.innerHTML = '<div class="inv-item">Nenhum animal comprado</div>';
        return;
    }

    const counts = {};
    animalsOnMap.forEach(a => {
        counts[a.type] = (counts[a.type] || 0) + 1;
    });

    list.innerHTML = '';
    const emojiMap = { pato: '🦆', galinha: '🐔', coelho: '🐇', ovelha: '🐑' };
    
    for (const [type, count] of Object.entries(counts)) {
        const div = document.createElement('div');
        div.className = 'inv-item';
        div.textContent = `${emojiMap[type] || ''} ${type.charAt(0).toUpperCase() + type.slice(1)} (${count})`;
        list.appendChild(div);
    }
}

function buyAnimal(type, price) {
    if (moedas >= price) {
        moedas -= price;
        // Posicionamento aleatório perto do centro do mapa visível ou fixo
        const spawnX = camera.x + 200 + Math.random() * (W - 400);
        const spawnY = camera.y + 200 + Math.random() * (H - 400);
        
        animalsOnMap.push(new Animal(type, spawnX, spawnY));
        updateHUD();
        updateInventory();
        console.log(`Comprou ${type}!`);
    } else {
        alert("Moedas insuficientes!");
    }
}


// ========================= LOOP =========================
let lastTime = performance.now();

function loop(now){
    const dt = now - lastTime;
    lastTime = now;

    updateCamera();
    ctx.clearRect(0, 0, W, H);

    if (!mapLoaded) {
        ctx.fillStyle = '#2d5a1b';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = '16px monospace';
        ctx.fillText('Carregando mapa...', W/2 - 80, H/2);
    } else {
        ctx.drawImage(mapImage, -camera.x, -camera.y);
    }

    // Desenhar animais
    animalsOnMap.forEach(anim => {
        anim.update(dt);
        anim.draw();
    });

    updateHUD();
    requestAnimationFrame(loop);
}

// Iniciar o loop com performance.now()
requestAnimationFrame(loop);

