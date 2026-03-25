// ========================= AgriCorp Game (Versão Restaurada e Limpa) =========================
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

const mapImage = new Image();
mapImage.src = 'sprites/Mapa.png';
let mapLoaded = false;
let WW = 2800, WH = 1400; // Tamanho do mapa

mapImage.onload = () => {
    mapLoaded = true;
    WW = mapImage.width;
    WH = mapImage.height;
};

let W, H;
function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    W = canvas.width;
    H = canvas.height;
}
resize();
window.addEventListener('resize', resize);

const camera = { x: 0, y: 0 };
let mouseX = 0, mouseY = 0;
const EDGE = 0.15;
const CAM_SPEED = 10;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// ESTADOS DE JOGO
let isWatering = false;
let wateringTimer = 0;
const crops = [];

// ÁREA AZUL (Coordenadas aproximadas no mapa 2800x1400)
const blueField = { x: 1580, y: 580, w: 900, h: 540 };

// BOTÃO REGAR
document.getElementById('btn-water').addEventListener('click', () => {
    if (isWatering) return;
    isWatering = true;
    wateringTimer = 10;
    const timerUI = document.getElementById('planting-timer');
    timerUI.classList.remove('hidden');
    
    const countdown = setInterval(() => {
        wateringTimer--;
        document.getElementById('timer-sec').textContent = wateringTimer;
        if (wateringTimer <= 0) {
            clearInterval(countdown);
            isWatering = false;
            timerUI.classList.add('hidden');
        }
    }, 1000);
});

// CLIQUE PARA PLANTAR
window.addEventListener('mousedown', (e) => {
    // Só planta se estiver regando e NÃO clicar em botões
    if (isWatering && wateringTimer > 0 && e.target.tagName !== 'BUTTON') {
        const worldX = e.clientX + camera.x;
        const worldY = e.clientY + camera.y;

        // Verifica se o clique está na área marrom do terreno azul
        if (worldX > blueField.x && worldX < blueField.x + blueField.w &&
            worldY > blueField.y && worldY < blueField.y + blueField.h) {
            
            // Verifica distância para não sobrepor
            const tooClose = crops.some(c => Math.hypot(c.x - worldX, c.y - worldY) < 30);
            if (!tooClose) {
                crops.push({ x: worldX, y: worldY });
            }
        }
    }
});

function updateCamera() {
    if (mouseX < W * EDGE) camera.x -= CAM_SPEED;
    if (mouseX > W * (1 - EDGE)) camera.x += CAM_SPEED;
    if (mouseY < H * EDGE) camera.y -= CAM_SPEED;
    if (mouseY > H * (1 - EDGE)) camera.y += CAM_SPEED;

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
        const spawnX = camera.x + 200 + Math.random() * (W - 400);
        const spawnY = camera.y + 200 + Math.random() * (H - 400);
        
        animalsOnMap.push(new Animal(type, spawnX, spawnY));
        updateHUD();
        updateInventory();
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

    if (mapLoaded) {
        // DESENHA O MAPA 1:1 COMO ANTES
        ctx.drawImage(mapImage, -camera.x, -camera.y);

        // GUIA DA ÁREA (Só se estiver regando)
        if (isWatering) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.strokeRect(blueField.x - camera.x, blueField.y - camera.y, blueField.w, blueField.h);
        }

        // DESENHA PLANTAÇÕES
        crops.forEach(c => {
            ctx.font = '30px Arial';
            ctx.fillText('🌾', c.x - camera.x - 15, c.y - camera.y + 15);
        });
    }

    // Desenhar animais
    animalsOnMap.forEach(anim => {
        anim.update(dt);
        anim.draw();
    });

    updateHUD();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

