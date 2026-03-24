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

// ========================= MOEDAS =========================
let moedas = 0;
const coinsValueEl = document.getElementById('hud-coins-value');

// Carrega spritesheet de moeda e recorta no mini-canvas do HUD
const currencySheet = new Image();
currencySheet.src = 'sprites/currency.png';
currencySheet.onload = () => {
    const coinCanvas = document.getElementById('coin-icon');
    const coinCtx = coinCanvas.getContext('2d');
    coinCtx.imageSmoothingEnabled = false;
    // A spritesheet é ~512x512; as moedas douradas ficam ~no canto inferior-direito
    // Recortamos a moeda principal (aprox 320,300 de 80x80 pixels na imagem)
    const sw = currencySheet.width;
    const sh = currencySheet.height;
    coinCtx.drawImage(
        currencySheet,
        sw * 0.60, sh * 0.55,   // sx, sy  – posição da moeda no sheet
        sw * 0.15, sh * 0.18,   // sWidth, sHeight – tamanho do recorte
        0, 0, 40, 40            // destino: preenche o canvas de 40x40
    );
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
let comunidade = 100;

const hpBar   = document.getElementById('hp-bar');
const hpValue = document.getElementById('hud-value');

function updateHUD() {
    // Barra de comunidade
    const pct = Math.max(0, Math.min(comunidade, 100));
    hpBar.style.width = pct + '%';
    hpValue.textContent = Math.round(pct);
    if (pct > 60) {
        hpBar.style.background = 'linear-gradient(90deg, #8b0000, #e00000, #ff4444)';
    } else if (pct > 30) {
        hpBar.style.background = 'linear-gradient(90deg, #7a3000, #cc5500, #ff8800)';
    } else {
        hpBar.style.background = 'linear-gradient(90deg, #5a0000, #990000, #cc0000)';
    }

    // Moedas
    coinsValueEl.textContent = moedas;
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
