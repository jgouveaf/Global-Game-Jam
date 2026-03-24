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
let WW = 2800; // Tamanho padrão até a imagem carregar
let WH = 1400;
mapImage.onload = () => {
    mapLoaded = true;
    WW = mapImage.width;
    WH = mapImage.height;
};

// ========================= CÂMERA (mouse) =========================
const camera = { x: 0, y: 0 };
let mouseX = 0, mouseY = 0;

// Zona "safe" central: movimento só quando o mouse vai para as bordas
const EDGE = 0.18; // 18% da borda ativa scroll
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

    if (mouseX < leftZone)   camera.x -= CAM_SPEED * (1 - mouseX / leftZone);
    if (mouseX > rightZone)  camera.x += CAM_SPEED * ((mouseX - rightZone) / (W * EDGE));
    if (mouseY < topZone)    camera.y -= CAM_SPEED * (1 - mouseY / topZone);
    if (mouseY > bottomZone) camera.y += CAM_SPEED * ((mouseY - bottomZone) / (H * EDGE));

    // Limitar câmera ao mapa
    camera.x = Math.max(0, Math.min(camera.x, WW - W));
    camera.y = Math.max(0, Math.min(camera.y, WH - H));
}

// ========================= HUD COMUNIDADE =========================
let comunidade = 100; // 0 a 100

const hpBar   = document.getElementById('hp-bar');
const hpValue = document.getElementById('hud-value');

function updateHUD() {
    const pct = Math.max(0, Math.min(comunidade, 100));
    hpBar.style.width = pct + '%';
    hpValue.textContent = Math.round(pct);

    // Cor muda conforme valor
    if (pct > 60) {
        hpBar.style.background = 'linear-gradient(90deg, #8b0000, #e00000, #ff4444)';
    } else if (pct > 30) {
        hpBar.style.background = 'linear-gradient(90deg, #7a3000, #cc5500, #ff8800)';
    } else {
        hpBar.style.background = 'linear-gradient(90deg, #5a0000, #990000, #cc0000)';
    }
}

// ========================= LOOP PRINCIPAL =========================
function loop(){
    updateCamera();
    ctx.clearRect(0, 0, W, H);

    // Fundo verde escuro enquanto mapa carrega
    if (!mapLoaded) {
        ctx.fillStyle = '#2d5a1b';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = '16px monospace';
        ctx.fillText('Carregando mapa...', W/2 - 80, H/2);
    } else {
        // Desenha o mapa com offset da câmera
        ctx.drawImage(mapImage, -camera.x, -camera.y);
    }

    updateHUD();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
