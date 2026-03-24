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
let moedas = 0;

function updateHUD() {
    const pct = Math.max(0, Math.min(comunidade, 100));
    document.getElementById('hp-bar').style.width = pct + '%';
    document.getElementById('hud-value').textContent = Math.round(pct);
    document.getElementById('hud-coins-value').textContent = moedas;
}

// ========================= INVENTÁRIO =========================
let selectedSlot = 0;
window.addEventListener('keydown', (e) => {
    if (e.key >= '1' && e.key <= '9') {
        selectedSlot = parseInt(e.key) - 1;
        updateHotbarVisual();
    } else if (e.key === '0') {
        selectedSlot = 9;
        updateHotbarVisual();
    }
});

function updateHotbarVisual() {
    const slots = document.querySelectorAll('.hotbar-slot');
    slots.forEach((slot, index) => {
        if (index === selectedSlot) slot.classList.add('active');
        else slot.classList.remove('active');
    });
}

// ========================= LOOP =========================
function loop(){
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

    updateHUD();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
