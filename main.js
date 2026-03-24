// ==========================================
//  AgriCorp - Canvas Top-Down Farm Game
// ==========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// -- Dimensões --
const TILE = 32;
let W, H, COLS, ROWS;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    W = canvas.width;
    H = canvas.height;
}
resize();
window.addEventListener('resize', () => { resize(); });

// ==========================================
// ESTADO DO JOGO
// ==========================================
const CROPS = {
    wheat:  { name: 'Trigo',   icon: '🌾', growTime: 5000,  price: 5,  reward: 10  },
    carrot: { name: 'Cenoura', icon: '🥕', growTime: 10000, price: 10, reward: 25  },
    tomato: { name: 'Tomate',  icon: '🍅', growTime: 20000, price: 20, reward: 55  },
    corn:   { name: 'Milho',   icon: '🌽', growTime: 40000, price: 50, reward: 150 },
};
const CROP_KEYS = Object.keys(CROPS);

const state = {
    coins: 50,
    happiness: 0,
    inventory: { wheat: 0, carrot: 0, tomato: 0, corn: 0 },
    selectedSeed: 'wheat',
    plots: Array(9).fill(null).map((_, i) => ({
        id: i,
        state: 'empty', // empty | growing | ready
        cropType: null,
        progress: 0,
        startTime: 0,
    })),
    requests: [],
    notification: null,
    notifTimer: 0,
};

function generateRequest() {
    if (state.requests.length >= 4) return;
    const key = CROP_KEYS[Math.floor(Math.random() * CROP_KEYS.length)];
    const amount = Math.floor(Math.random() * 3) + 2;
    state.requests.push({
        id: Math.random(),
        cropType: key,
        amount,
        rewardCoins: Math.floor(CROPS[key].reward * amount * 1.5),
        rewardHappiness: amount * 2,
    });
}

function showNotif(msg, color = '#27ae60') {
    state.notification = { msg, color };
    state.notifTimer = 120; // frames
}

generateRequest();
setInterval(() => generateRequest(), 8000);

// ==========================================
// LAYOUT — Posições no Canvas
// ==========================================

// Canteiros (3x3 grid), ancorados numa região de terra
function getPlotRect(i) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const gridX = W * 0.32;
    const gridY = H * 0.28;
    const pw = H * 0.14; // tamanho de cada canteiro baseado na altura da tela
    const gap = 12;
    return {
        x: gridX + col * (pw + gap),
        y: gridY + row * (pw + gap),
        w: pw,
        h: pw,
    };
}

// Seed buttons (bottom-center)
function getSeedBtnRect(i) {
    const bw = 130, bh = 50, gap = 12;
    const totalW = CROP_KEYS.length * (bw + gap) - gap;
    const startX = (W - totalW) / 2;
    return {
        x: startX + i * (bw + gap),
        y: H - 80,
        w: bw,
        h: bh,
    };
}

// Request cards (right side)
function getRequestRect(i) {
    const rx = W - 220;
    const ry = H * 0.2 + i * 110;
    return { x: rx, y: ry, w: 200, h: 100 };
}

// ==========================================
// CORES DE TILES (paleta pixel-art)
// ==========================================
const PALETTE = {
    sky:     '#78c8f0',
    grass:   '#78c050',
    grassD:  '#50a030',
    dirt:    '#c89850',
    dirtD:   '#a07038',
    path:    '#d8b878',
    plotDry: '#8b5e3c',
    plotWet: '#5a3520',
    fence:   '#8b5e20',
    barn:    '#c0392b',
    barnRoof:'#2c1810',
    wood:    '#6b3d2c',
    stone:   '#8a9a8a',
    stoneD:  '#6a7a6a',
    silo:    '#a0a8a0',
    water:   '#4080c0',
    hay:     '#d09828',
    ui_bg:   'rgba(0,0,0,0.75)',
    ui_brd:  '#f4b41b',
    white:   '#ffffff',
    black:   '#000000',
};

// ==========================================
// RENDERIZAÇÃO DO MAPA
// ==========================================
function drawMap() {
    const cx = ctx;

    // --- Fundo: Grama ---
    cx.fillStyle = PALETTE.grass;
    cx.fillRect(0, 0, W, H);

    // Detalhes de grama (pontinhos)
    cx.fillStyle = PALETTE.grassD;
    for (let i = 0; i < W; i += 48) {
        for (let j = 0; j < H; j += 48) {
            cx.fillRect(i + 8, j + 12, 4, 3);
            cx.fillRect(i + 28, j + 30, 3, 4);
        }
    }

    // --- Caminho horizontal (centro) ---
    cx.fillStyle = PALETTE.path;
    cx.fillRect(0, H * 0.55, W, H * 0.12);
    // Detalhe do caminho
    cx.fillStyle = PALETTE.dirtD;
    for (let i = 0; i < W; i += 64) {
        cx.fillRect(i, H * 0.55 + 4, 2, H * 0.12 - 8);
    }

    // --- Caminho vertical (divide mapa) ---
    cx.fillStyle = PALETTE.path;
    cx.fillRect(W * 0.3, 0, W * 0.05, H);
    cx.fillStyle = PALETTE.dirtD;
    for (let j = 0; j < H; j += 64) {
        cx.fillRect(W * 0.3 + 4, j, W * 0.05 - 8, 2);
    }

    // --- Área de solo agrícola ---
    cx.fillStyle = PALETTE.dirtD;
    cx.fillRect(W * 0.3, H * 0.22, W * 0.45, H * 0.35);
    cx.fillStyle = PALETTE.plotDry;
    cx.fillRect(W * 0.31, H * 0.23, W * 0.43, H * 0.33);
    // Listras de arado
    ctx.fillStyle = PALETTE.dirtD;
    for (let i = 0; i < W * 0.43; i += 12) {
        cx.fillRect(W * 0.31 + i, H * 0.23, 2, H * 0.33);
    }

    drawBuildings();
    drawFences();
    drawDecorations();
}

function drawBuildings() {
    const cx = ctx;

    // === CELEIRO VERMELHO (esquerda) ===
    const bx = W * 0.06, by = H * 0.14;
    const bw = 130, bh = 100;
    // Sombra
    cx.fillStyle = 'rgba(0,0,0,0.2)';
    cx.fillRect(bx + 8, by + 8, bw, bh);
    // Corpo
    cx.fillStyle = PALETTE.barn;
    cx.fillRect(bx, by, bw, bh);
    // Teto (trapézio)
    cx.fillStyle = PALETTE.barnRoof;
    cx.beginPath();
    cx.moveTo(bx - 10, by);
    cx.lineTo(bx + bw / 2, by - 50);
    cx.lineTo(bx + bw + 10, by);
    cx.closePath();
    cx.fill();
    // Porta
    cx.fillStyle = PALETTE.wood;
    cx.fillRect(bx + 40, by + 55, 50, 45);
    cx.fillStyle = '#f0c060';
    cx.fillRect(bx + 57, by + 77, 6, 6);
    // Janela
    cx.fillStyle = PALETTE.wood;
    cx.fillRect(bx + 8, by + 30, 28, 24);
    cx.fillStyle = '#c8e0f8';
    cx.fillRect(bx + 12, by + 34, 20, 16);
    cx.fillStyle = PALETTE.barnRoof;
    cx.fillRect(bx + 20, by + 34, 2, 16);
    cx.fillRect(bx + 12, by + 42, 20, 2);
    // Borda
    cx.strokeStyle = '#000';
    cx.lineWidth = 3;
    cx.strokeRect(bx, by, bw, bh);

    // === SILO (ao lado do celeiro) ===
    const sx = bx + bw + 15, sy = by + 10;
    const sr = 22, sh = 80;
    // Corpo cilíndrico (retângulo + topo redondo)
    cx.fillStyle = PALETTE.silo;
    cx.fillRect(sx - sr, sy, sr * 2, sh);
    cx.fillStyle = PALETTE.stone;
    cx.beginPath();
    cx.ellipse(sx, sy, sr, sr * 0.5, 0, Math.PI, 0, true);
    cx.fill();
    // Cobertura
    cx.fillStyle = '#c0c8c0';
    cx.beginPath();
    cx.moveTo(sx - sr - 4, sy);
    cx.lineTo(sx, sy - 22);
    cx.lineTo(sx + sr + 4, sy);
    cx.closePath();
    cx.fill();
    cx.fillStyle = '#a0a8a0';
    cx.fillRect(sx - sr, sy, 4, sh);
    cx.strokeStyle = '#000';
    cx.lineWidth = 2;
    cx.strokeRect(sx - sr, sy, sr * 2, sh);

    // === CAIXA D'ÁGUA (canto) ===
    const tx = W * 0.12, ty = H * 0.60;
    cx.fillStyle = '#a05020';
    cx.fillRect(tx, ty, 50, 40);
    cx.fillStyle = PALETTE.water;
    cx.fillRect(tx + 3, ty + 3, 44, 20);
    cx.fillStyle = '#6b4020';
    // Pernas
    cx.fillRect(tx + 5, ty + 40, 5, 30);
    cx.fillRect(tx + 40, ty + 40, 5, 30);
    cx.strokeStyle = '#000';
    cx.lineWidth = 2;
    cx.strokeRect(tx, ty, 50, 40);

    // === MOINHO (top left) ===
    const mx = W * 0.13, my = H * 0.08;
    // Torre
    cx.fillStyle = PALETTE.stone;
    cx.fillRect(mx - 18, my + 20, 36, 70);
    cx.fillStyle = PALETTE.stoneD;
    for (let y = my + 25; y < my + 90; y += 12) {
        cx.fillRect(mx - 18, y, 36, 2);
    }
    // Porta
    cx.fillStyle = PALETTE.wood;
    cx.fillRect(mx - 8, my + 65, 16, 25);
    // Pás do moinho
    drawWindmill(cx, mx, my + 30);
    cx.strokeStyle = '#000';
    cx.lineWidth = 2;
    cx.strokeRect(mx - 18, my + 20, 36, 70);

    // === CASA DO AGRICULTOR (canto superior direito) ===
    const hx = W * 0.82, hy = H * 0.10;
    cx.fillStyle = '#e8d090';
    cx.fillRect(hx, hy + 20, 90, 70);
    cx.fillStyle = '#802010';
    cx.beginPath();
    cx.moveTo(hx - 8, hy + 20);
    cx.lineTo(hx + 45, hy - 10);
    cx.lineTo(hx + 98, hy + 20);
    cx.closePath();
    cx.fill();
    cx.fillStyle = PALETTE.wood;
    cx.fillRect(hx + 32, hy + 55, 26, 35);
    cx.fillStyle = '#c8e0f8';
    cx.fillRect(hx + 8, hy + 35, 22, 18);
    cx.fillRect(hx + 60, hy + 35, 22, 18);
    cx.strokeStyle = '#000';
    cx.lineWidth = 2;
    cx.strokeRect(hx, hy + 20, 90, 70);

    // === TRATOR (no caminho) ===
    drawTractor(cx, W * 0.16, H * 0.59);
}

function drawWindmill(cx, x, y) {
    const t = Date.now() / 1000;
    cx.save();
    cx.translate(x, y);
    for (let i = 0; i < 4; i++) {
        cx.save();
        cx.rotate(t * 0.8 + (i * Math.PI / 2));
        cx.fillStyle = '#d4b87a';
        cx.fillRect(-5, 0, 10, 35);
        cx.restore();
    }
    // Centro
    cx.fillStyle = '#a08060';
    cx.beginPath();
    cx.arc(0, 0, 8, 0, Math.PI * 2);
    cx.fill();
    cx.restore();
}

function drawTractor(cx, x, y) {
    // Corpo
    cx.fillStyle = '#2080c0';
    cx.fillRect(x, y, 70, 35);
    cx.fillStyle = '#1060a0';
    cx.fillRect(x + 40, y - 12, 30, 20);
    // Janela
    cx.fillStyle = '#c8eeff';
    cx.fillRect(x + 44, y - 10, 22, 14);
    // Rodas
    cx.fillStyle = '#1a1a1a';
    cx.beginPath();
    cx.arc(x + 18, y + 36, 16, 0, Math.PI * 2);
    cx.fill();
    cx.fillStyle = '#555';
    cx.beginPath();
    cx.arc(x + 18, y + 36, 8, 0, Math.PI * 2);
    cx.fill();
    cx.fillStyle = '#1a1a1a';
    cx.beginPath();
    cx.arc(x + 58, y + 36, 13, 0, Math.PI * 2);
    cx.fill();
    cx.fillStyle = '#555';
    cx.beginPath();
    cx.arc(x + 58, y + 36, 6, 0, Math.PI * 2);
    cx.fill();
    cx.strokeStyle = '#000';
    cx.lineWidth = 2;
    cx.strokeRect(x, y, 70, 35);
}

function drawFences() {
    const cx = ctx;
    cx.fillStyle = PALETTE.fence;
    // Cerca superior da área agrícola
    const fx = W * 0.31, fy = H * 0.22, fw = W * 0.43;
    for (let i = 0; i < fw; i += 20) {
        cx.fillRect(fx + i, fy, 4, 20);
        cx.fillRect(fx + i, fy + 3, 20, 4);
        cx.fillRect(fx + i, fy + 10, 20, 4);
    }
    // Cerca esquerda
    const fh = H * 0.33;
    for (let j = 0; j < fh; j += 20) {
        cx.fillRect(fx, fy + 20 + j, 20, 4);
        cx.fillRect(fx, fy + 20 + j, 4, 20);
    }
}

function drawDecorations() {
    const cx = ctx;
    // Árvores
    drawTree(ctx, W * 0.04, H * 0.40);
    drawTree(ctx, W * 0.91, H * 0.42);
    drawTree(ctx, W * 0.95, H * 0.40);
    // Fardos de feno
    drawHay(ctx, W * 0.19, H * 0.22);
    drawHay(ctx, W * 0.22, H * 0.26);
}

function drawTree(cx, x, y) {
    cx.fillStyle = '#3a2010';
    cx.fillRect(x - 5, y, 10, 28);
    cx.fillStyle = '#308030';
    cx.beginPath();
    cx.arc(x, y, 22, 0, Math.PI * 2);
    cx.fill();
    cx.fillStyle = '#40a040';
    cx.beginPath();
    cx.arc(x - 6, y - 6, 14, 0, Math.PI * 2);
    cx.fill();
}

function drawHay(cx, x, y) {
    cx.fillStyle = PALETTE.hay;
    cx.fillRect(x, y, 28, 22);
    cx.fillStyle = '#b07820';
    for (let i = 4; i < 22; i += 6) cx.fillRect(x, y + i, 28, 2);
    cx.strokeStyle = '#806010'; cx.lineWidth = 2;
    cx.strokeRect(x, y, 28, 22);
}

// ==========================================
// RENDERIZAÇÃO DOS CANTEIROS (Plots)
// ==========================================
function drawPlots() {
    state.plots.forEach((plot, i) => {
        const r = getPlotRect(i);
        // Solo
        ctx.fillStyle = plot.state === 'empty' ? PALETTE.plotDry : '#4a2e12';
        ctx.fillRect(r.x, r.y, r.w, r.h);
        // Linhas de terra
        ctx.fillStyle = plot.state === 'empty' ? PALETTE.dirtD : '#3a2010';
        for (let k = 0; k < r.w; k += 10) ctx.fillRect(r.x + k, r.y, 2, r.h);
        // Borda
        const isHover = hoveredPlot === i;
        ctx.strokeStyle = isHover ? '#fff' : '#3a1a05';
        ctx.lineWidth = isHover ? 3 : 2;
        ctx.strokeRect(r.x, r.y, r.w, r.h);

        if (plot.state === 'growing') {
            // Barra de progresso
            ctx.fillStyle = '#000';
            ctx.fillRect(r.x + 4, r.y + r.h - 12, r.w - 8, 8);
            ctx.fillStyle = PALETTE.grassD;
            ctx.fillRect(r.x + 4, r.y + r.h - 12, (r.w - 8) * (plot.progress / 100), 8);
            // Muda
            drawEmoji('🌱', r.x + r.w / 2, r.y + r.h / 2, 28);
        } else if (plot.state === 'ready') {
            const bounce = Math.sin(Date.now() / 200) * 4;
            drawEmoji(CROPS[plot.cropType].icon, r.x + r.w / 2, r.y + r.h / 2 + bounce, 38);
        }
    });
}

// ==========================================
// HUD (Renderizar UI no Canvas)
// ==========================================
function drawHUD() {
    // -- Barra superior --
    ctx.fillStyle = 'rgba(0,0,0,0.80)';
    ctx.fillRect(0, 0, W, 56);
    ctx.strokeStyle = PALETTE.ui_brd;
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, W, 56);

    drawPixelText(`MOEDAS: ${state.coins}`, 20, 32, '#f4b41b', 12);
    drawPixelText(`HAPPY: ${state.happiness}%`, W / 2 - 80, 32, '#f4b41b', 12);

    // Barra de felicidade
    ctx.fillStyle = '#222';
    ctx.fillRect(W / 2 + 60, 18, 200, 20);
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(W / 2 + 60, 18, 200 * (state.happiness / 100), 20);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 + 60, 18, 200, 20);

    // Inventário
    let iX = W - 400;
    drawPixelText('INV:', iX - 40, 32, '#fff', 8);
    Object.entries(state.inventory).forEach(([key, val]) => {
        if (val > 0) {
            drawEmoji(CROPS[key].icon, iX + 10, 28, 20);
            drawPixelText(`${val}`, iX + 22, 35, '#fff', 8);
            iX += 45;
        }
    });

    // -- Seed Buttons (inferior) --
    CROP_KEYS.forEach((key, i) => {
        const r = getSeedBtnRect(i);
        const active = state.selectedSeed === key;
        ctx.fillStyle = active ? PALETTE.ui_brd : 'rgba(0,0,0,0.8)';
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = active ? '#fff' : PALETTE.ui_brd;
        ctx.lineWidth = 3;
        ctx.strokeRect(r.x, r.y, r.w, r.h);
        drawEmoji(CROPS[key].icon, r.x + 22, r.y + 25, 22);
        drawPixelText(CROPS[key].name, r.x + 36, r.y + 20, active ? '#000' : '#fff', 7);
        drawPixelText(`$${CROPS[key].price}`, r.x + 36, r.y + 38, active ? '#333' : '#f4b41b', 7);
    });

    // -- Request Cards (direita) --
    const rPanelX = W - 225;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(rPanelX - 5, 65, 225, H - 130);
    ctx.strokeStyle = PALETTE.ui_brd;
    ctx.lineWidth = 3;
    ctx.strokeRect(rPanelX - 5, 65, 225, H - 130);
    drawPixelText('VILA', rPanelX + 65, 92, PALETTE.ui_brd, 10);

    state.requests.forEach((req, i) => {
        const r = getRequestRect(i);
        if (r.y + r.h > H - 90) return;
        const hasEnough = state.inventory[req.cropType] >= req.amount;

        ctx.fillStyle = '#fff';
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = hasEnough ? '#27ae60' : '#888';
        ctx.lineWidth = 2;
        ctx.strokeRect(r.x, r.y, r.w, r.h);

        drawEmoji(CROPS[req.cropType].icon, r.x + 20, r.y + 28, 24);
        drawPixelText(`${req.amount}x ${CROPS[req.cropType].name}`, r.x + 40, r.y + 28, '#000', 7);
        drawPixelText(`+$${req.rewardCoins}`, r.x + 40, r.y + 45, '#1a7', 7);

        // Botão distribuir
        ctx.fillStyle = hasEnough ? '#27ae60' : '#aaa';
        ctx.fillRect(r.x + 10, r.y + 65, r.w - 20, 25);
        drawPixelText(hasEnough ? 'DISTRIBUIR' : 'FALTANDO', r.x + 50, r.y + 81, '#fff', 6);
    });

    // Notificação
    if (state.notification && state.notifTimer > 0) {
        const alpha = Math.min(1, state.notifTimer / 30);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = state.notification.color;
        ctx.fillRect(W / 2 - 160, H / 2 - 30, 320, 60);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
        ctx.strokeRect(W / 2 - 160, H / 2 - 30, 320, 60);
        drawPixelText(state.notification.msg, W / 2 - 140, H / 2 + 8, '#fff', 10);
        ctx.globalAlpha = 1;
        state.notifTimer--;
    }
}

// ==========================================
// HELPERS DE DESENHO
// ==========================================
function drawPixelText(text, x, y, color, size) {
    ctx.font = `${size}px 'Press Start 2P', monospace`;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

function drawEmoji(emoji, cx, cy, size) {
    ctx.font = `${size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, cx, cy);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
}

// ==========================================
// INTERAÇÃO (Mouse)
// ==========================================
let hoveredPlot = -1;

canvas.addEventListener('mousemove', (e) => {
    const mx = e.clientX, my = e.clientY;
    hoveredPlot = -1;
    state.plots.forEach((_, i) => {
        const r = getPlotRect(i);
        if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) hoveredPlot = i;
    });
    canvas.style.cursor = hoveredPlot >= 0 ? 'pointer' : 'default';
});

canvas.addEventListener('click', (e) => {
    const mx = e.clientX, my = e.clientY;

    // Click nos canteiros
    state.plots.forEach((plot, i) => {
        const r = getPlotRect(i);
        if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
            if (plot.state === 'empty') {
                const crop = CROPS[state.selectedSeed];
                if (state.coins >= crop.price) {
                    state.coins -= crop.price;
                    plot.state = 'growing';
                    plot.cropType = state.selectedSeed;
                    plot.startTime = Date.now();
                    showNotif(`Plantado: ${crop.name}`);
                } else {
                    showNotif('Sem moedas!', '#c0392b');
                }
            } else if (plot.state === 'ready') {
                state.inventory[plot.cropType]++;
                showNotif(`Colhido!`);
                plot.state = 'empty';
                plot.cropType = null;
            }
        }
    });

    // Click nas seed buttons
    CROP_KEYS.forEach((key, i) => {
        const r = getSeedBtnRect(i);
        if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
            state.selectedSeed = key;
        }
    });

    // Click nos botões de distribuir
    state.requests.forEach((req, i) => {
        const r = getRequestRect(i);
        const btnY = r.y + 65;
        if (mx >= r.x + 10 && mx <= r.x + r.w - 10 && my >= btnY && my <= btnY + 25) {
            if (state.inventory[req.cropType] >= req.amount) {
                state.inventory[req.cropType] -= req.amount;
                state.coins += req.rewardCoins;
                state.happiness = Math.min(100, state.happiness + req.rewardHappiness);
                state.requests = state.requests.filter(r => r.id !== req.id);
                showNotif('Vila agradecida! +Felicidade');
            }
        }
    });
});

// ==========================================
// LOOP PRINCIPAL
// ==========================================
let lastTime = 0;
function gameLoop(ts) {
    const dt = ts - lastTime;
    lastTime = ts;

    // Atualiza crescimento
    state.plots.forEach(plot => {
        if (plot.state === 'growing') {
            const crop = CROPS[plot.cropType];
            plot.progress = Math.min(100, ((Date.now() - plot.startTime) / crop.growTime) * 100);
            if (plot.progress >= 100) plot.state = 'ready';
        }
    });

    // Limpa tela
    ctx.clearRect(0, 0, W, H);

    // Renderiza mapa
    drawMap();

    // Renderiza canteiros
    drawPlots();

    // Renderiza HUD
    drawHUD();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
