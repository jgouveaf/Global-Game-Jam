// ============================================================
//   AgriCorp – Mapa estilo Vila Medieval RPG (Canvas)
//   Apenas o mapa visual, sem sistema de plantação ainda
// ============================================================
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
let W, H;

function resize(){
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    W = canvas.width; H = canvas.height;
}
resize();
window.addEventListener('resize', resize);

// ========================= PALETA =========================
const P = {
    // Grama (vários tons)
    g1: '#5a9830', g2: '#4a8828', g3: '#3a7820', g4: '#2a6818',
    gL: '#6aaa38', gD: '#2a5810',
    // Terra / Dirt
    d1: '#c8a870', d2: '#b89860', d3: '#a88850', d4: '#988040',
    dD: '#887038', dL: '#d8b880',
    // Floresta / Árvores  
    t1: '#2a6818', t2: '#1a5810', t3: '#124808', t4: '#0a3808',
    tL: '#3a8828', tTrunk: '#4a3018',
    // Água / Rio
    w1: '#3870a8', w2: '#2860a0', w3: '#4880b8', wL: '#5898c8', wD: '#1850a0',
    // Madeira
    wo: '#7a5430', woD: '#5a3a18', woL: '#9a7448',
    // Telhados
    rD: '#3a2810', rL: '#5a4020', rS: '#807060',
    // Pedra
    st: '#788078', stD: '#586860', stL: '#98a098',
    // UI
    bk: '#000000', wh: '#ffffff',
};

// ========================= HELPERS =========================
const box = (x,y,w,h,f,s,lw=1) => {
    ctx.fillStyle=f; ctx.fillRect(x,y,w,h);
    if(s){ctx.strokeStyle=s;ctx.lineWidth=lw;ctx.strokeRect(x,y,w,h);}
};
const circ = (cx,cy,r,f,s,lw=1) => {
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=f;ctx.fill();
    if(s){ctx.strokeStyle=s;ctx.lineWidth=lw;ctx.stroke();}
};
const tri = (pts,f,s,lw=1) => {
    ctx.beginPath();ctx.moveTo(...pts[0]);pts.slice(1).forEach(p=>ctx.lineTo(...p));ctx.closePath();
    ctx.fillStyle=f;ctx.fill();if(s){ctx.strokeStyle=s;ctx.lineWidth=lw;ctx.stroke();}
};

// ========================= TERRENO BASE =========================
function drawGround(){
    // Fundo grama escura
    ctx.fillStyle = P.g3;
    ctx.fillRect(0,0,W,H);
    
    // Variação de grama (checkerboard sutil)
    for(let x=0;x<W;x+=16){
        for(let y=0;y<H;y+=16){
            const v = Math.sin(x*0.02+y*0.03)*0.5 + Math.cos(x*0.01-y*0.02)*0.5;
            if(v > 0.3) { ctx.fillStyle=P.g2; ctx.fillRect(x,y,16,16); }
            else if(v > 0) { ctx.fillStyle=P.g1; ctx.fillRect(x,y,16,16); }
            else if(v < -0.3) { ctx.fillStyle=P.g4; ctx.fillRect(x,y,16,16); }
        }
    }
    
    // Detalhes de grama (folhinhas)
    ctx.fillStyle=P.gL;
    for(let x=8;x<W;x+=32){
        for(let y=10;y<H;y+=32){
            if(Math.random()<0.5) continue; // aleatório mas seed fixo via posição
            const seed = (x*31+y*17)%100;
            if(seed<50){
                ctx.fillRect(x,y,2,5);
                ctx.fillRect(x+4,y+2,2,4);
            }
        }
    }
}

// ========================= GRANDE ÁREA DE TERRA =========================
function drawDirtArea(){
    // Área de terra irregular centro/direita (como na imagem)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(W*0.35, H*0.20);
    ctx.bezierCurveTo(W*0.50, H*0.10,  W*0.85, H*0.15,  W*0.90, H*0.25);
    ctx.bezierCurveTo(W*0.95, H*0.40,  W*0.92, H*0.65,  W*0.85, H*0.80);
    ctx.bezierCurveTo(W*0.75, H*0.90,  W*0.55, H*0.88,  W*0.42, H*0.78);
    ctx.bezierCurveTo(W*0.30, H*0.68,  W*0.28, H*0.50,  W*0.30, H*0.40);
    ctx.bezierCurveTo(W*0.32, H*0.30,  W*0.30, H*0.22,  W*0.35, H*0.20);
    ctx.closePath();
    ctx.clip();
    
    // Base de terra
    ctx.fillStyle = P.d2;
    ctx.fillRect(0,0,W,H);
    
    // Variações de terra
    for(let x=0;x<W;x+=12){
        for(let y=0;y<H;y+=12){
            const v2 = ((x*7+y*13)%100)/100;
            if(v2>0.7) { ctx.fillStyle=P.dL; ctx.fillRect(x,y,12,12); }
            else if(v2>0.5) { ctx.fillStyle=P.d1; ctx.fillRect(x,y,12,12); }
            else if(v2<0.2) { ctx.fillStyle=P.d3; ctx.fillRect(x,y,12,12); }
        }
    }
    
    // Textura de terra (riscas)
    ctx.fillStyle = P.d4;
    for(let x=0;x<W;x+=20){
        for(let y=0;y<H;y+=20){
            const s = (x*3+y*7)%60;
            if(s<15) ctx.fillRect(x,y,8,2);
            if(s>40) ctx.fillRect(x+4,y+8,6,2);
        }
    }
    
    ctx.restore();
    
    // Borda suave (grama invadindo a terra)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(W*0.35, H*0.20);
    ctx.bezierCurveTo(W*0.50, H*0.10,  W*0.85, H*0.15,  W*0.90, H*0.25);
    ctx.bezierCurveTo(W*0.95, H*0.40,  W*0.92, H*0.65,  W*0.85, H*0.80);
    ctx.bezierCurveTo(W*0.75, H*0.90,  W*0.55, H*0.88,  W*0.42, H*0.78);
    ctx.bezierCurveTo(W*0.30, H*0.68,  W*0.28, H*0.50,  W*0.30, H*0.40);
    ctx.bezierCurveTo(W*0.32, H*0.30,  W*0.30, H*0.22,  W*0.35, H*0.20);
    ctx.closePath();
    ctx.strokeStyle = P.g4;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();
}

// ========================= RIO =========================
function drawRiver(){
    const t = Date.now()/3000;
    
    ctx.save();
    ctx.beginPath();
    // Rio curvo no canto inferior esquerdo
    ctx.moveTo(0, H*0.65);
    ctx.bezierCurveTo(W*0.05, H*0.70, W*0.08, H*0.78, W*0.12, H*0.82);
    ctx.bezierCurveTo(W*0.18, H*0.88, W*0.25, H*0.92, W*0.30, H*0.95);
    ctx.lineTo(W*0.35, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.clip();
    
    // Água base
    ctx.fillStyle = P.w2;
    ctx.fillRect(0,0,W,H);
    
    // Ondulações
    for(let x=0;x<W*0.4;x+=8){
        for(let y=H*0.6;y<H;y+=8){
            const wave = Math.sin(x*0.08+t+y*0.05)*0.5;
            ctx.fillStyle = wave>0.1 ? P.w3 : (wave<-0.1 ? P.wD : P.w1);
            ctx.fillRect(x,y,8,8);
        }
    }
    
    // Reflexos
    ctx.fillStyle = 'rgba(120,180,230,0.25)';
    for(let x=10;x<W*0.3;x+=30){
        const yOff = Math.sin(x*0.1+t)*6;
        ctx.fillRect(x, H*0.75+yOff, 16, 3);
    }
    
    ctx.restore();
    
    // Margem do rio
    ctx.strokeStyle = P.g4;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, H*0.65);
    ctx.bezierCurveTo(W*0.05, H*0.70, W*0.08, H*0.78, W*0.12, H*0.82);
    ctx.bezierCurveTo(W*0.18, H*0.88, W*0.25, H*0.92, W*0.30, H*0.95);
    ctx.stroke();
    
    // Margem de terra/areia
    ctx.strokeStyle = P.d3;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H*0.65+3);
    ctx.bezierCurveTo(W*0.05, H*0.70+3, W*0.08, H*0.78+3, W*0.12, H*0.82+3);
    ctx.stroke();
}

// ========================= CAMINHOS =========================
function drawPaths(){
    ctx.strokeStyle = P.d3;
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    
    // Caminho principal (conectando casas)
    ctx.beginPath();
    ctx.moveTo(W*0.38, H*0.45);
    ctx.bezierCurveTo(W*0.50, H*0.50, W*0.60, H*0.52, W*0.72, H*0.50);
    ctx.stroke();
    
    // Caminho para cima
    ctx.beginPath();
    ctx.moveTo(W*0.50, H*0.48);
    ctx.lineTo(W*0.52, H*0.28);
    ctx.stroke();
    
    // Caminho para baixo
    ctx.beginPath();
    ctx.moveTo(W*0.55, H*0.52);
    ctx.bezierCurveTo(W*0.50, H*0.62, W*0.48, H*0.70, W*0.55, H*0.78);
    ctx.stroke();
    
    // Detalhes no caminho (pedrinhas)
    ctx.fillStyle = P.d4;
    for(let i=0;i<30;i++){
        const px = W*0.38 + (W*0.35) * (i/30) + Math.sin(i*2)*8;
        const py = H*0.46 + Math.sin(i*0.5)*12;
        ctx.fillRect(px, py, 4, 3);
    }
}

// ========================= ÁRVORE RPG =========================
function drawTreeRPG(x, y, size=1, dark=0){
    const s = size;
    const trunk = P.tTrunk;
    
    // Tronco
    ctx.fillStyle = trunk;
    ctx.fillRect(x-3*s, y+10*s, 6*s, 14*s);
    
    // Copa (3 camadas sobrepostas para profundidade)
    const base = dark ? P.t3 : P.t1;
    const mid  = dark ? P.t4 : P.t2;
    const top  = dark ? P.t2 : P.tL;
    
    circ(x, y+8*s, 16*s, mid);
    circ(x-6*s, y+4*s, 13*s, base);
    circ(x+7*s, y+6*s, 12*s, base);
    circ(x-2*s, y-2*s, 11*s, top);
    circ(x+4*s, y+2*s, 10*s, top);
    
    // Highlight
    ctx.fillStyle = 'rgba(100,180,80,0.15)';
    circ(x-4*s, y-4*s, 7*s, 'rgba(100,180,80,0.15)');
}

// ========================= ARBUSTO =========================
function drawBush(x, y, s=1){
    circ(x, y, 10*s, P.t1);
    circ(x-4*s, y-3*s, 8*s, P.tL);
    circ(x+5*s, y-2*s, 7*s, P.g1);
}

// ========================= FLORESTA DENSA =========================
function drawForest(){
    // Floresta esquerda (muito densa)
    const treesLeft = [
        // [x%, y%, size, dark]
        [0.02,0.15,1.2,1],[0.06,0.10,1.1,1],[0.10,0.08,1.3,1],[0.14,0.12,1.0,1],
        [0.01,0.28,1.1,1],[0.05,0.25,1.2,1],[0.09,0.22,1.0,1],[0.13,0.20,1.1,0],
        [0.03,0.38,1.0,1],[0.07,0.35,1.3,1],[0.11,0.32,1.1,0],[0.15,0.30,1.0,0],
        [0.02,0.48,1.1,1],[0.06,0.45,1.0,1],[0.10,0.42,1.2,0],[0.14,0.40,0.9,0],
        [0.04,0.55,1.0,1],[0.08,0.52,1.1,1],[0.12,0.50,0.9,0],
        [0.01,0.62,1.2,1],[0.05,0.60,1.0,1],[0.09,0.58,1.1,0],
        [0.17,0.15,1.0,0],[0.20,0.18,0.9,0],[0.18,0.28,1.1,0],[0.22,0.25,0.8,0],
        [0.16,0.38,0.9,0],[0.20,0.35,1.0,0],[0.23,0.32,0.8,0],
        [0.17,0.48,0.8,0],[0.21,0.45,0.9,0],
        [0.03,0.70,1.0,1],[0.07,0.68,0.9,1],
    ];
    
    // Floresta topo
    const treesTop = [
        [0.25,0.05,1.1,1],[0.30,0.03,1.0,1],[0.35,0.06,1.2,1],[0.40,0.04,0.9,1],
        [0.45,0.05,1.0,1],[0.50,0.03,1.1,1],[0.55,0.06,0.9,1],[0.60,0.04,1.0,1],
        [0.65,0.05,1.1,1],[0.70,0.03,0.9,1],[0.75,0.06,1.0,1],[0.80,0.04,1.1,1],
        [0.85,0.05,0.9,1],[0.90,0.03,1.0,1],[0.95,0.06,0.9,1],
        [0.28,0.12,0.9,0],[0.33,0.10,1.0,0],[0.38,0.11,0.8,0],
        [0.68,0.10,0.9,0],[0.73,0.12,0.8,0],
        [0.88,0.10,0.9,0],[0.93,0.12,0.8,0],
    ];
    
    // Árvores dispersas na direita
    const treesRight = [
        [0.88,0.30,0.9,0],[0.92,0.35,1.0,0],[0.95,0.28,0.8,0],
        [0.90,0.55,0.9,0],[0.94,0.52,0.8,0],
        [0.88,0.72,0.9,0],[0.92,0.70,1.0,0],
    ];
    
    // Todas as árvores, ordenadas por Y para "profundidade"
    const allTrees = [...treesLeft,...treesTop,...treesRight];
    allTrees.sort((a,b)=>a[1]-b[1]);
    allTrees.forEach(([tx,ty,ts,td]) => drawTreeRPG(W*tx, H*ty, ts, td));
}

// ========================= CASA DE MADEIRA PEQUENA =========================
function drawHut(x, y, w=60, h=45, roofColor=null){
    const rc = roofColor || P.rD;
    // Sombra
    ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.fillRect(x+4,y+4,w,h);
    // Paredes
    box(x, y, w, h, P.woL, P.bk, 1);
    // Linhas de tábua
    ctx.fillStyle=P.wo;
    for(let i=6;i<h;i+=8) ctx.fillRect(x+1,y+i,w-2,5);
    ctx.fillStyle='rgba(255,255,255,0.06)';
    for(let i=6;i<h;i+=8) ctx.fillRect(x+1,y+i,w-2,2);
    // Telhado
    tri([[x-8,y],[x+w/2,y-h*0.65],[x+w+8,y]], rc, P.bk, 1);
    // Listras no telhado
    ctx.fillStyle='rgba(255,255,255,0.08)';
    for(let i=0;i<h*0.65;i+=6){
        const ratio = i/(h*0.65);
        const lx = x-8 + (w/2+8)*ratio;
        const rxx = x+w+8 - (w/2+8)*ratio;
        ctx.fillRect(lx, y-i, rxx-lx, 3);
    }
    // Porta
    const dw=w*0.22, dh=h*0.50;
    box(x+w/2-dw/2, y+h-dh, dw, dh, P.woD, P.bk, 1);
    ctx.fillStyle='#c0a040'; ctx.fillRect(x+w/2+dw/4, y+h-dh/2, 3, 3);
    // Janela
    if(w>40){
        box(x+6, y+h*0.28, 14, 12, P.woD, P.bk, 1);
        box(x+7, y+h*0.28+1, 12, 10, '#8ab8d0', null);
        ctx.fillStyle=P.woD; ctx.fillRect(x+12,y+h*0.28+1,2,10);
    }
}

// ========================= GRANDE SALÃO / CELEIRO =========================
function drawGreatHall(x, y){
    const w=140, h=100;
    // Sombra
    ctx.fillStyle='rgba(0,0,0,0.18)'; ctx.fillRect(x+8,y+8,w,h);
    // Paredes (madeira escura)
    box(x, y, w, h, '#4a3020', P.bk, 2);
    // Tábuas
    ctx.fillStyle='#3a2010';
    for(let i=8;i<h;i+=10) ctx.fillRect(x+2,y+i,w-4,6);
    ctx.fillStyle='rgba(180,140,80,0.08)';
    for(let i=8;i<h;i+=10) ctx.fillRect(x+2,y+i,w-4,2);
    // Telhado alto e pontiagudo (dark)
    const peakY = y - h*0.80;
    tri([[x-14,y],[x+w/2,peakY],[x+w+14,y]], '#2a1808', P.bk, 2);
    // Textura telhado
    ctx.fillStyle='rgba(100,80,50,0.15)';
    for(let i=0;i<h*0.80;i+=8){
        const ratio = i/(h*0.80);
        const lx = x-14 + (w/2+14)*ratio;
        const rxx = x+w+14 - (w/2+14)*ratio;
        ctx.fillRect(lx, y-i, rxx-lx, 4);
    }
    // Ridge
    ctx.fillStyle='#5a4030'; ctx.fillRect(x+w/2-3,peakY,6,h*0.80);
    // Portas grandes duplas
    const dw=w*0.28, dh=h*0.55;
    box(x+w/2-dw/2-dw/2, y+h-dh, dw, dh, '#3a2010', P.bk, 1);
    box(x+w/2+2, y+h-dh, dw, dh, '#3a2010', P.bk, 1);
    // Detalhes porta
    ctx.fillStyle='#5a4030';
    ctx.fillRect(x+w/2-dw-2, y+h-dh+4, 2, dh-8);
    ctx.fillRect(x+w/2+dw, y+h-dh+4, 2, dh-8);
    // Janelas laterais
    box(x+6, y+20, 18, 16, '#2a1808', P.bk, 1);
    box(x+8, y+22, 14, 12, '#6898b0', null);
    ctx.fillStyle='#2a1808'; ctx.fillRect(x+14,y+22,2,12);
    box(x+w-24, y+20, 18, 16, '#2a1808', P.bk, 1);
    box(x+w-22, y+22, 14, 12, '#6898b0', null);
    ctx.fillStyle='#2a1808'; ctx.fillRect(x+w-16,y+22,2,12);
}

// ========================= CANTEIROS DE CULTIVO =========================
function drawCropPlots(){
    // Pequenas fileiras de cultivo (como na imagem, no centro)
    const plots = [
        { x: W*0.40, y: H*0.55, w: 60, h: 40, crop:'🌾' },
        { x: W*0.40, y: H*0.62, w: 60, h: 40, crop:'🥕' },
        { x: W*0.48, y: H*0.55, w: 55, h: 40, crop:'🌽' },
        { x: W*0.48, y: H*0.62, w: 55, h: 40, crop:'🍅' },
    ];
    
    plots.forEach(p => {
        // Solo de plantação
        box(p.x, p.y, p.w, p.h, '#6a4a28', null);
        // Fileiras
        ctx.fillStyle = '#8a6838';
        for(let row=0;row<p.h;row+=8){
            ctx.fillRect(p.x, p.y+row, p.w, 5);
            ctx.fillStyle='#5a3a18';
            ctx.fillRect(p.x, p.y+row+5, p.w, 3);
            ctx.fillStyle='#8a6838';
        }
        // Plantinhas verdes
        ctx.fillStyle='#50a830';
        for(let c=p.x+4;c<p.x+p.w-4;c+=10){
            for(let r=p.y+2;r<p.y+p.h-4;r+=8){
                ctx.fillRect(c, r, 4, 4);
                ctx.fillStyle='#60b848';
                ctx.fillRect(c+1, r, 2, 3);
                ctx.fillStyle='#50a830';
            }
        }
        // Borda sutil
        ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=1; ctx.strokeRect(p.x,p.y,p.w,p.h);
    });
}

// ========================= CERCA =========================
function drawFence(x1,y1,x2,y2){
    const dx=x2-x1, dy=y2-y1;
    const len=Math.sqrt(dx*dx+dy*dy);
    const steps=Math.floor(len/14);
    for(let i=0;i<=steps;i++){
        const t=i/steps;
        const px=x1+dx*t, py=y1+dy*t;
        ctx.fillStyle='#7a5428';
        ctx.fillRect(px-2, py-8, 4, 14);
    }
    // Rails
    ctx.strokeStyle='#6a4418'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(x1,y1-4); ctx.lineTo(x2,y2-4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1,y1+2); ctx.lineTo(x2,y2+2); ctx.stroke();
}

// ========================= PEDRAS DECORATIVAS =========================
function drawRocks(x,y){
    circ(x,  y,    8, P.st, P.bk, 1);
    circ(x+12,y+4, 6, P.stD,P.bk, 1);
    circ(x+4, y+8, 5, P.stL,null);
}

// ========================= POÇO =========================
function drawWell(x,y){
    // Base circular
    circ(x,y,16,'#808880',P.bk,2);
    circ(x,y,12,P.w3,null);
    // Destaque água
    circ(x,y,8,P.wL,null);
    // Suportes
    ctx.fillStyle=P.woD;
    ctx.fillRect(x-2,y-26,4,28);
    // Telhado mini
    tri([[x-14,y-24],[x,y-34],[x+14,y-24]],'#5a4020',P.bk,1);
    // Corda
    ctx.strokeStyle='#a08050'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(x,y-24); ctx.lineTo(x,y-10); ctx.stroke();
}

// ========================= FLORES =========================
function drawFlowers(x,y,count=5){
    const colors = ['#e8e040','#e06080','#d040d0','#e0a020','#f0f0f0'];
    for(let i=0;i<count;i++){
        const fx=x+(i*8)%30-15, fy=y+((i*13)%20)-10;
        ctx.fillStyle=P.g1;
        ctx.fillRect(fx,fy+3,2,4);
        circ(fx+1,fy+2,3,colors[i%colors.length]);
    }
}

// ========================= MAPA COMPLETO =========================
function drawMap(){
    drawGround();
    drawDirtArea();
    drawRiver();
    drawPaths();
    
    // Canteiros de cultivo
    drawCropPlots();
    
    // Cercas
    drawFence(W*0.38, H*0.53, W*0.56, H*0.53);
    drawFence(W*0.38, H*0.53, W*0.38, H*0.72);
    drawFence(W*0.38, H*0.72, W*0.56, H*0.72);
    drawFence(W*0.56, H*0.53, W*0.56, H*0.72);
    
    // Grande Salão (centro-topo, madeira escura)
    drawGreatHall(W*0.44, H*0.18);
    
    // Casas pequenas espalhadas
    drawHut(W*0.60, H*0.42, 55, 40, '#4a3818');  // casa 1
    drawHut(W*0.72, H*0.52, 50, 38, '#3a2810');  // casa 2
    drawHut(W*0.32, H*0.40, 48, 36, '#5a4020');  // casa 3
    drawHut(W*0.65, H*0.72, 45, 34, '#4a3818');  // casa 4
    drawHut(W*0.78, H*0.35, 52, 38, '#3a2810');  // casa 5
    
    // Pedras decorativas
    drawRocks(W*0.55, H*0.48);
    drawRocks(W*0.70, H*0.62);
    drawRocks(W*0.35, H*0.30);
    
    // Poço (centro da vila)
    drawWell(W*0.52, H*0.45);
    
    // Flores
    drawFlowers(W*0.58, H*0.38);
    drawFlowers(W*0.42, H*0.48);
    drawFlowers(W*0.68, H*0.46);
    
    // Arbustos
    drawBush(W*0.26, H*0.50, 0.9);
    drawBush(W*0.28, H*0.58, 0.7);
    drawBush(W*0.82, H*0.45, 0.8);
    drawBush(W*0.85, H*0.60, 0.7);
    drawBush(W*0.75, H*0.82, 0.9);
    drawBush(W*0.60, H*0.82, 0.8);
    
    // Floresta densa (bordas)
    drawForest();
}

// ========================= LOOP =========================
function loop(){
    ctx.clearRect(0,0,W,H);
    drawMap();
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
