// ============================================================
//   AgriCorp – Mapa idêntico à imagem de referência
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

// ========================= PALETA (Harvest Moon SNES) =========================
const C = {
    g1:'#88c850', g2:'#70b840', g3:'#58a030', g4:'#408020',   // grama
    p1:'#d8c080', p2:'#c0a868', pe:'#a89050',                  // caminho
    s1:'#a07840', s2:'#886032', s3:'#6b4a28',                  // solo
    sr:'#4a3020',                                               // solo molhado
    fe:'#7a5228', fd:'#5a3818',                                 // cerca
    ba:'#c03020', bs:'#9a2010', br:'#221008',                  // celeiro
    wo:'#8a5a30', wd:'#6a3a10',                                 // madeira
    si:'#b0b8a8', sd:'#8a9888', sr2:'#5a7860',                 // silo
    mi:'#9aaa90', md:'#7a8a70',                                 // moinho
    ho:'#e0d088', hr:'#a02818', hs:'#c8b870',                  // casa
    ta:'#9a7040', tw:'#4888c0', tl:'#78b8f8',                  // tanque
    tb:'#2870c0', td:'#1850a0', tw2:'#90c8f0',                 // trator
    tt:'#30a828', tl2:'#50c848', td2:'#208018', tk:'#6a4020',  // árvore
    hy:'#d8a018', hd:'#b08018',                                 // feno
    ro:'#8a9880', rd:'#6a7860',                                 // pedra
    ui:'rgba(8,5,2,0.92)',
    go:'#f0c030', gd:'#c09020',
    wh:'#ffffff', bk:'#000000',
    ty:'#f8d040', tw3:'#f0f0f0',
};

// ========================= ESTADO DO JOGO =========================
const CROPS = {
    wheat : { name:'Trigo',   icon:'🌾', grow:5000,  cost:5,  reward:10,  color:'#d8c060', color2:'#f0e080' },
    carrot: { name:'Cenoura', icon:'🥕', grow:10000, cost:10, reward:25,  color:'#30a830', color2:'#50d050' },
    tomato: { name:'Tomate',  icon:'🍅', grow:20000, cost:20, reward:55,  color:'#38b838', color2:'#60e060' },
    corn  : { name:'Milho',   icon:'🌽', grow:40000, cost:50, reward:150, color:'#d0c040', color2:'#f0e060' },
};
const KEYS = Object.keys(CROPS);

// 4 seções de campo, posicionadas para cobrir a área de lavoura da imagem
// Cada seção = área clicável que representa uma parcela de plantação
const G = {
    coins:50, happy:0,
    inv  :{ wheat:0, carrot:0, tomato:0, corn:0 },
    seed :'wheat',
    fields: Array(4).fill(null).map((_,i)=>({ id:i, state:'empty', crop:null, prog:0, t0:0 })),
    reqs:[], notif:null, ntimer:0,
};

function addReq(){
    if(G.reqs.length>=4) return;
    const k=KEYS[Math.floor(Math.random()*KEYS.length)];
    const n=Math.floor(Math.random()*3)+2;
    G.reqs.push({ id:Math.random(), crop:k, n, coins:Math.floor(CROPS[k].reward*n*1.5), happy:n*2 });
}
addReq(); setInterval(addReq,8000);
function notif(m,c='#38c060'){ G.notif={m,c}; G.ntimer=160; }

// ========================= HELPERS =========================
const pxt=(t,x,y,col,sz)=>{ ctx.font=`${sz}px 'Press Start 2P',monospace`; ctx.fillStyle=col; ctx.textAlign='left'; ctx.textBaseline='alphabetic'; ctx.fillText(t,x,y); };
const emo=(e,cx,cy,sz)=>{ ctx.font=`${sz}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(e,cx,cy); ctx.textAlign='left'; ctx.textBaseline='alphabetic'; };
const box=(x,y,w,h,f,s,lw=2)=>{ ctx.fillStyle=f; ctx.fillRect(x,y,w,h); if(s){ctx.strokeStyle=s;ctx.lineWidth=lw;ctx.strokeRect(x,y,w,h);} };
const tri=(pts,f,s,lw=2)=>{ ctx.beginPath(); ctx.moveTo(...pts[0]); pts.slice(1).forEach(p=>ctx.lineTo(...p)); ctx.closePath(); ctx.fillStyle=f; ctx.fill(); if(s){ctx.strokeStyle=s;ctx.lineWidth=lw;ctx.stroke();} };
const circ=(cx,cy,r,f,s,lw=2)=>{ ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle=f; ctx.fill(); if(s){ctx.strokeStyle=s;ctx.lineWidth=lw;ctx.stroke();} };
function bevel(x,y,w,h,t=3){
    ctx.fillStyle='rgba(255,255,255,0.18)'; ctx.fillRect(x,y,w,t); ctx.fillRect(x,y,t,h);
    ctx.fillStyle='rgba(0,0,0,0.28)'; ctx.fillRect(x,y+h-t,w,t); ctx.fillRect(x+w-t,y,t,h);
}

// ========================= LAYOUT DINÂMICO (escala com tela) =========================
// Proporções baseadas na imagem de referência (900×430 original)
// Caminho horizontal: y ≈ 60–73% da altura
// Celeiro: x≈25%, y≈10%  Moinho: x≈8%, y≈8%
// Campo: x≈48%..83%, y≈15%..58%
// Farmhouse: x≈72%,y≈8%  Silo:x≈40%

function fieldRect(i){
    // 4 seções lado a lado no campo de lavoura (2 cols x 2 rows)
    const col=i%2, row=Math.floor(i/2);
    const fx=W*0.50, fy=H*0.20;
    const fw=(W*0.84-W*0.50)/2 - 8;   // largura de cada seção
    const fh=(H*0.57-H*0.20)/2 - 8;   // altura de cada seção
    return { x:fx+col*(fw+8), y:fy+row*(fh+8), w:fw, h:fh };
}

function seedBtn(i){
    const bw=136,bh=64,gap=12;
    const tot=KEYS.length*(bw+gap)-gap;
    return { x:(W-tot)/2+i*(bw+gap), y:H-78, w:bw, h:bh };
}

function reqCard(i){ return { x:W-236, y:H*0.17+i*116, w:218, h:106 }; }

// ========================= TERRENO =========================
function drawGrass(){
    for(let gx=0;gx<W;gx+=32) for(let gy=0;gy<H;gy+=32){
        ctx.fillStyle=(Math.floor(gx/32+gy/32))%2===0?C.g1:C.g2;
        ctx.fillRect(gx,gy,32,32);
    }
    ctx.fillStyle=C.g3;
    for(let gx=14;gx<W;gx+=44) for(let gy=18;gy<H;gy+=44){
        ctx.fillRect(gx,gy,3,7); ctx.fillRect(gx+7,gy+4,3,5);
        ctx.fillStyle=C.g4; ctx.fillRect(gx+1,gy+2,2,5); ctx.fillStyle=C.g3;
    }
}

function drawPaths(){
    // Caminho horizontal principal
    const py=H*0.60, ph=H*0.125;
    for(let x=0;x<W;x+=2){ ctx.fillStyle=(x/2)%2===0?C.p1:C.p2; ctx.fillRect(x,py,2,ph); }
    box(0,py,W,4,C.pe); box(0,py+ph-4,W,4,C.pe);
    // Pedregulhos no caminho
    ctx.fillStyle=C.rd;
    for(let x=40;x<W;x+=60){ ctx.fillRect(x,py+8,14,8); ctx.fillRect(x+30,py+22,10,6); ctx.fillRect(x+16,py+36,12,7); }

    // Caminho vertical da esquerda (conecta celeiro ao caminho)
    const vx=W*0.36, vw=W*0.055;
    for(let y=H*0.20;y<H*0.60;y+=2){ ctx.fillStyle=(y/2)%2===0?C.p1:C.p2; ctx.fillRect(vx,y,vw,2); }
    box(vx,H*0.20,4,H*0.40,C.pe); box(vx+vw-4,H*0.20,4,H*0.40,C.pe);

    // Caminho de acesso ao campo (bordas direita)
    const vx2=W*0.84, vw2=W*0.04;
    for(let y=H*0.20;y<H*0.60;y+=2){ ctx.fillStyle=(y/2)%2===0?C.p1:C.p2; ctx.fillRect(vx2,y,vw2,2); }
}

// ========================= MOINHO =========================
function drawWindmill(){
    const mx=W*0.09, my=H*0.10;
    const t=Date.now()/1000;
    // Base
    box(mx-14,my+102,30,12,C.rd,C.bk,2);
    // Torre trapezoidal
    ctx.fillStyle=C.mi;
    ctx.beginPath(); ctx.moveTo(mx-22,my+104); ctx.lineTo(mx-14,my+22); ctx.lineTo(mx+14,my+22); ctx.lineTo(mx+22,my+104); ctx.closePath(); ctx.fill();
    ctx.strokeStyle=C.bk; ctx.lineWidth=2; ctx.stroke();
    // Linhas de pedra
    ctx.fillStyle=C.md; for(let y=my+30;y<my+104;y+=10) ctx.fillRect(mx-20+(y-my)/7,y,34-(y-my)/5,2);
    // Janelinha
    box(mx-6,my+50,12,14,'#a0c0d8',C.bk,1);
    ctx.fillStyle=C.md; ctx.fillRect(mx-1,my+50,2,14); ctx.fillRect(mx-6,my+56,12,2);
    // Porta
    ctx.fillStyle=C.wd; ctx.beginPath(); ctx.arc(mx,my+92,9,Math.PI,0); ctx.lineTo(mx+9,my+104); ctx.lineTo(mx-9,my+104); ctx.closePath(); ctx.fill();
    ctx.strokeStyle=C.bk; ctx.lineWidth=1; ctx.stroke();
    // Pás animadas
    ctx.save(); ctx.translate(mx,my+28);
    for(let i=0;i<4;i++){
        ctx.save(); ctx.rotate(t*0.65+i*Math.PI/2);
        ctx.fillStyle='#e8d898'; ctx.strokeStyle=C.bk; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(-5,3); ctx.lineTo(5,3); ctx.lineTo(3,44); ctx.lineTo(-3,44); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.strokeStyle=C.wd; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(0,5); ctx.lineTo(0,42); ctx.stroke();
        ctx.restore();
    }
    circ(0,0,8,C.wo,C.bk,2); ctx.restore();
}

// ========================= CELEIRO (fiel à imagem pixel art) =========================
function drawBarn(){
    // Âncora dinâmica
    const CX = W*0.295;        // centro horizontal do celeiro
    const BASE = H*0.52;       // base do celeiro (bottom)

    // Dimensões escaladas pela tela
    const S   = Math.min(W/12, H/6.5);  // fator de escala
    const BW  = S*5;    // largura do corpo central
    const BH  = S*3.5;  // altura do corpo central
    const WW  = S*1.6;  // largura das asas
    const WH  = S*2.4;  // altura das asas

    // Posições derivadas
    const bx = CX - BW/2;      // esquerda do corpo
    const by = BASE - BH;      // topo do corpo
    const wx_L = bx - WW;      // esquerda da asa esq
    const wy   = BASE - WH;    // topo das asas

    // --- SOMBRA ---
    ctx.fillStyle='rgba(0,0,0,0.15)';
    ctx.fillRect(wx_L+6, wy+8, BW+2*WW, WH+6);

    // ======================== CORPO & ASAS ========================
    // Função para desenhar parede de troncos laranja
    function logWall(x,y,w,h){
        // Fundo laranja
        ctx.fillStyle='#d86828';
        ctx.fillRect(x,y,w,h);
        // Linhas de tronco (mais escuras)
        const lh = Math.max(4, S*0.4);
        for(let i=0;i<h;i+=lh){
            ctx.fillStyle='#b85020';
            ctx.fillRect(x, y+i, w, Math.max(1,lh*0.35));
            // Highlight topo do tronco
            ctx.fillStyle='rgba(255,180,100,0.22)';
            ctx.fillRect(x, y+i, w, Math.max(1,lh*0.2));
        }
        ctx.strokeStyle='#000'; ctx.lineWidth=2; ctx.strokeRect(x,y,w,h);
    }

    // Asa esquerda
    logWall(wx_L, wy, WW, WH);
    // Asa direita
    logWall(bx+BW, wy, WW, WH);
    // Corpo central (desenhado por cima para sobrepor bordas das asas)
    logWall(bx, by, BW, BH);

    // ======================== TETOS ========================
    // Função para drawn um telhado com listras de tábua HORIZONTAIS
    // paralelas à calha (como na imagem de ref)
    function plankRoof(px, py, pw, peek_x, peek_y) {
        // Duas faces: esquerda e direita do pico
        const faces = [
            { pts: [[px, py], [peek_x, peek_y], [peek_x, py]], side:'L' },
            { pts: [[peek_x, peek_y], [px+pw, py], [peek_x, py]], side:'R' },
        ];
        const stripeH = Math.max(4, S*0.35);
        const cLight = '#e8d090', cDark = '#c8a858';

        faces.forEach(face => {
            ctx.save();
            ctx.beginPath();
            face.pts.forEach(([fx,fy], i) => i===0 ? ctx.moveTo(fx,fy) : ctx.lineTo(fx,fy));
            ctx.closePath();
            ctx.clip();

            // Listras horizontais
            const top = peek_y - stripeH;
            const bot = py + stripeH;
            for(let y2=top; y2<bot; y2+=stripeH){
                ctx.fillStyle = Math.floor((y2-top)/stripeH)%2===0 ? cLight : cDark;
                ctx.fillRect(px-4, y2, pw+8, stripeH);
            }
            ctx.restore();

            // Borda do triângulo
            ctx.beginPath();
            face.pts.forEach(([fx,fy],i) => i===0 ? ctx.moveTo(fx,fy) : ctx.lineTo(fx,fy));
            ctx.closePath();
            ctx.strokeStyle='#000'; ctx.lineWidth=2; ctx.stroke();
        });
    }

    // Teto da asa esquerda
    plankRoof(wx_L-3, wy, WW+3, wx_L+WW/2+2, wy - WH*0.48);
    // Teto da asa direita
    plankRoof(bx+BW-3, wy, WW+6, bx+BW+WW/2+1, wy - WH*0.48);
    // Teto principal (mais alto)
    plankRoof(wx_L-4, by, BW+2*WW+8, CX, by - BH*0.65);

    // Cume do topo
    const peakY = by - BH*0.65;
    circ(CX, peakY, S*0.18, '#b89050', '#000', 1);

    // ======================== JANELAS ========================
    const winW = S*0.7, winH = S*0.6;
    const winY = wy + WH*0.32;
    // Asa esquerda
    const wL = wx_L + WW*0.15;
    box(wL, winY, winW, winH, '#8a5020', '#000', 2);
    box(wL+2, winY+2, winW-4, winH-4, '#f0c860', null);
    ctx.fillStyle='#8a5020'; ctx.fillRect(wL,winY+winH/2-1,winW,2); ctx.fillRect(wL+winW/2-1,winY,2,winH);
    // Asa direita
    const wR = bx+BW + WW*0.15;
    box(wR, winY, winW, winH, '#8a5020', '#000', 2);
    box(wR+2, winY+2, winW-4, winH-4, '#f0c860', null);
    ctx.fillStyle='#8a5020'; ctx.fillRect(wR,winY+winH/2-1,winW,2); ctx.fillRect(wR+winW/2-1,winY,2,winH);

    // ======================== PORTA ========================
    const doorW = BW*0.25, doorH = BH*0.45;
    const doorX = CX - doorW/2, doorY2 = BASE - doorH;
    box(doorX, doorY2, doorW, doorH, '#5a3010', '#000', 2);
    // Tábuas verticais na porta
    ctx.fillStyle='#7a4820';
    for(let d=doorX+Math.floor(S*0.25);d<doorX+doorW-2;d+=Math.floor(S*0.22)) ctx.fillRect(d,doorY2+2,2,doorH-4);
    // Highlight porta
    ctx.fillStyle='rgba(255,180,60,0.10)'; ctx.fillRect(doorX+2,doorY2+2,doorW-4,doorH*0.4);
}

// ========================= SILO =========================
function drawSilo(){
    const sx=W*0.25+Math.min(175,W*0.155)+24, sy=H*0.11+8;
    const sr=26, sh=Math.min(100,H*0.28);
    ctx.fillStyle='rgba(0,0,0,0.12)'; ctx.fillRect(sx-sr+8,sy+8,sr*2,sh);
    box(sx-sr,sy,sr*2,sh,C.si,C.bk,2);
    ctx.fillStyle=C.sd; for(let x=sx-sr+9;x<sx+sr;x+=11) ctx.fillRect(x,sy,2,sh);
    ctx.fillStyle=C.sr2; ctx.beginPath(); ctx.ellipse(sx,sy,sr,sr*0.55,0,Math.PI,0,true); ctx.fill(); ctx.strokeStyle=C.bk; ctx.lineWidth=2; ctx.stroke();
    tri([[sx-sr-5,sy],[sx,sy-30],[sx+sr+5,sy]],C.sd,C.bk,2);
    circ(sx,sy-30,5,'#6a8870',C.bk,1);
}

// ========================= FEN E OUTROS ASSETS =========================
function drawHay(x,y,w=36,h=26){
    box(x,y,w,h,C.hy,C.bk,2);
    ctx.fillStyle=C.hd; for(let i=5;i<h;i+=7) ctx.fillRect(x,y+i,w,3);
    ctx.fillStyle='rgba(0,0,0,0.1)'; ctx.fillRect(x+4,y+h,w,5);
}

function drawTree(x,y,sc=1){
    box(x-4*sc,y+16*sc,9*sc,28*sc,C.tk,C.bk,1);
    circ(x,y+10*sc,25*sc,C.td2,C.bk,1);
    circ(x+2*sc,y+5*sc,21*sc,C.tt,null);
    circ(x-8*sc,y+3*sc,15*sc,C.tl2,null);
    circ(x+11*sc,y+12*sc,13*sc,C.tl2,null);
}

// ========================= FARMHOUSE =========================
function drawFarmhouse(){
    const hx=W*0.72, hy=H*0.09;
    const hw=Math.min(100,W*0.09), hh=Math.min(80,H*0.22);
    ctx.fillStyle='rgba(0,0,0,0.12)'; ctx.fillRect(hx+10,hy+28,hw,hh);
    box(hx,hy+22,hw,hh,C.ho,C.bk,2);
    box(hx+hw,hy+30,14,hh-8,C.hs,null); ctx.strokeStyle=C.bk; ctx.lineWidth=1; ctx.strokeRect(hx+hw,hy+30,14,hh-8);
    tri([[hx-10,hy+22],[hx+hw/2,hy-14],[hx+hw+10,hy+22]],C.hr,C.bk,2);
    ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(hx+hw/2-3,hy-14,6,36);
    box(hx+hw-26,hy-22,12,36,C.rd,C.bk,2);
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(hx+hw-26,hy-24,12,6);
    // Portico / varanda
    box(hx,hy+hh+22,hw,10,C.hs,C.bk,1);
    box(hx+6,hy+22,6,hh,C.hs,C.bk,1); box(hx+hw-12,hy+22,6,hh,C.hs,C.bk,1);
    // Door
    box(hx+hw*0.38,hy+hh*0.52,hw*0.24,hh*0.48,C.wo,C.bk,2);
    circ(hx+hw*0.50,hy+hh*0.90,3,'#d0a040',C.bk,1);
    // Windows
    box(hx+6,hy+38,22,18,C.wd,C.bk,2); box(hx+8,hy+40,18,14,'#a8d8f0',null);
    ctx.fillStyle=C.wd; ctx.fillRect(hx+16,hy+40,2,14); ctx.fillRect(hx+8,hy+47,18,2);
    box(hx+hw-28,hy+38,22,18,C.wd,C.bk,2); box(hx+hw-26,hy+40,18,14,'#a8d8f0',null);
    ctx.fillStyle=C.wd; ctx.fillRect(hx+hw-18,hy+40,2,14); ctx.fillRect(hx+hw-26,hy+47,18,2);
    // Sign
    box(hx+hw*0.20,hy+20,hw*0.60,14,'#c8b060',C.bk,1);
    pxt('LOJA',hx+hw*0.22,hy+31,'#5a2000',6);
}

// ========================= CAIXA D'ÁGUA =========================
function drawWaterTower(){
    const tx=W*0.89, ty=H*0.62;
    const tw=56,th=44;
    ctx.fillStyle=C.wd; ctx.fillRect(tx+7,ty+th,6,36); ctx.fillRect(tx+tw-13,ty+th,6,36);
    ctx.strokeStyle=C.wo; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(tx+10,ty+th+4); ctx.lineTo(tx+tw-10,ty+th+32); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx+tw-10,ty+th+4); ctx.lineTo(tx+10,ty+th+32); ctx.stroke();
    box(tx,ty,tw,th,C.ta,C.bk,2);
    box(tx+3,ty+4,tw-6,22,C.tw,null);
    ctx.fillStyle=C.tl; ctx.fillRect(tx+3,ty+4,tw-6,6);
    ctx.fillStyle=C.wo; ctx.fillRect(tx,ty+16,tw,4); ctx.fillRect(tx,ty+32,tw,4);
    tri([[tx-4,ty],[tx+tw/2,ty-15],[tx+tw+4,ty]],C.wd,C.bk,2);
    box(tx+tw/2-4,ty+th,8,8,C.rd,C.bk,1);
}

// ========================= TRATOR =========================
function drawTractor(){
    const tx=W*0.24, ty=H*0.615;
    // Roda traseira grande
    circ(tx+18,ty+44,24,C.bk,null);
    circ(tx+18,ty+44,13,'#3a3a3a',null);
    ctx.fillStyle='#666'; [0,60,120,180,240,300].forEach(a=>{ const r=a*Math.PI/180; ctx.fillRect(tx+18+Math.cos(r)*8-2,ty+44+Math.sin(r)*8-2,4,4); });
    // Corpo
    box(tx,ty+10,76,38,C.tb,C.bk,2);
    // Capô
    box(tx+48,ty-2,30,28,C.td,C.bk,2);
    // Escapamento
    box(tx+70,ty-20,7,20,'#909090',C.bk,1); box(tx+68,ty-22,11,4,'#606060',C.bk,1);
    // Janela cabine
    box(tx+50,ty,26,20,C.tw2,C.bk,2);
    ctx.fillStyle='rgba(255,255,255,0.28)'; ctx.fillRect(tx+52,ty+2,10,10);
    // Roda dianteira
    circ(tx+66,ty+46,15,C.bk,null); circ(tx+66,ty+46,8,'#3a3a3a',null);
    // Farol
    circ(tx+80,ty+20,5,'#f8f050',C.bk,1);
}

// ========================= CERCA DO CAMPO =========================
function drawFieldFence(){
    const fx=W*0.49, fy=H*0.15;
    const fw=W*0.84-W*0.49, fh=H*0.57-H*0.15;
    const gateStart=fw*0.35, gateW=50;

    // Trilhos top
    for(let x=0;x<fw;x+=20){
        box(fx+x, fy, 5,24,C.fe); box(fx+x,fy+4,20,4,C.fd); box(fx+x,fy+14,20,4,C.fd);
    }
    // Trilhos left
    for(let y=24;y<fh;y+=20){
        box(fx, fy+y, 5,24,C.fe); box(fx+2,fy+y,4,20,C.fd); box(fx+10,fy+y,4,20,C.fd);
    }
    // Trilhos right
    for(let y=24;y<fh;y+=20){
        box(fx+fw, fy+y, 5,24,C.fe); box(fx+fw+2,fy+y,4,20,C.fd); box(fx+fw+10,fy+y,4,20,C.fd);
    }
    // Trilhos bottom com portão
    for(let x=0;x<fw;x+=20){
        if(x>=gateStart && x<gateStart+gateW) continue;
        box(fx+x,fy+fh,5,24,C.fe); box(fx+x,fy+fh+3,20,4,C.fd); box(fx+x,fy+fh+13,20,4,C.fd);
    }
}

// ========================= CAMPO DE LAVOURA (4 seções) =========================
let hov=-1;

// Desenha fileiras de cultivo dentro de uma área
function drawCropRows(field, rect){
    const { x,y,w,h } = rect;
    const rowH = Math.max(8, h/8);
    const c = CROPS[field.crop||'wheat'];
    const isReady = field.state==='ready';
    const isGrow  = field.state==='growing';
    const isEmpty = field.state==='empty';

    for(let row=0;row<Math.floor(h/rowH);row++){
        const ry = y+row*rowH;
        // Solo base
        ctx.fillStyle = isEmpty ? C.s1 : (isReady ? c.color : C.sr);
        ctx.fillRect(x,ry,w,rowH-2);
        // Linha entre fileiras
        ctx.fillStyle=C.s2; ctx.fillRect(x,ry+rowH-2,w,2);

        if(!isEmpty){
            // Plantinhas: pequenos retângulos simulando cultivo
            const plantW = 10, plantGap = 14;
            for(let px2=x+6;px2<x+w-8;px2+=plantGap){
                if(isReady){
                    // Planta madura colorida
                    ctx.fillStyle=c.color2;
                    ctx.fillRect(px2, ry+1, plantW-2, rowH-4);
                    // Sombra
                    ctx.fillStyle='rgba(0,0,0,0.12)'; ctx.fillRect(px2+plantW-2,ry+3,2,rowH-5);
                } else {
                    // Muda
                    const ph = Math.max(3, (rowH-4)*(field.prog/100));
                    ctx.fillStyle='#40b040';
                    ctx.fillRect(px2+2,ry+rowH-4-ph,5,ph+2);
                }
            }
        }
    }

    // Borda e hover
    const isH=hov===field.id;
    ctx.strokeStyle=isH?'#fff':(isEmpty?C.fd:'rgba(255,255,255,0.6)');
    ctx.lineWidth=isH?3:1.5; ctx.strokeRect(x+1,y+1,w-2,h-2);
    if(isH){ ctx.strokeStyle='rgba(255,255,180,0.4)'; ctx.lineWidth=1; ctx.strokeRect(x+4,y+4,w-8,h-8); }

    // Barra de progresso se crescendo
    if(isGrow){
        box(x+6,y+h-14,w-12,10,'rgba(0,0,0,0.5)');
        const grd=ctx.createLinearGradient(x+6,0,x+6+(w-12)*(field.prog/100),0);
        grd.addColorStop(0,'#40e060'); grd.addColorStop(1,'#a0f040');
        ctx.fillStyle=grd; ctx.fillRect(x+6,y+h-14,(w-12)*(field.prog/100),10);
        ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1; ctx.strokeRect(x+6,y+h-14,w-12,10);
    }

    // Ícone central se pronto (pulsando)
    if(isReady){
        const b=Math.sin(Date.now()/180)*4;
        ctx.fillStyle='rgba(255,255,100,0.15)'; ctx.beginPath(); ctx.arc(x+w/2,y+h/2,30,0,Math.PI*2); ctx.fill();
        emo(c.icon, x+w/2, y+h/2+b, 36);
    }

    // Label da seção
    if(!isEmpty && field.crop){
        ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(x+4,y+4,w-8,16);
        pxt(CROPS[field.crop].name.substring(0,6).toUpperCase(), x+8, y+15, '#fff', 6);
    }
}

function drawField(){
    // Fundo de terra do campo inteiro
    const fx=W*0.49, fy=H*0.15, fw=W*0.84-W*0.49, fh=H*0.57-H*0.15;
    box(fx+5,fy+24,fw-5,fh,C.s1);
    // Linhas de arado no fundo
    ctx.fillStyle=C.s2; for(let k=0;k<fh;k+=10) ctx.fillRect(fx+5,fy+24+k,fw-5,2);
    for(let k=0;k<fw-5;k+=14) ctx.fillRect(fx+5+k,fy+24,2,fh);

    // 4 seções clicáveis
    G.fields.forEach((f,i)=>{ drawCropRows(f, fieldRect(i)); });
}

// ========================= MAPA COMPLETO =========================
function drawMap(){
    drawGrass();
    drawPaths();
    drawFieldFence();
    drawField();
    // Árvores
    drawTree(W*0.025,H*0.34);
    drawTree(W*0.04, H*0.68, 0.85);
    drawTree(W*0.93, H*0.36);
    drawTree(W*0.96, H*0.30, 0.9);
    drawTree(W*0.70, H*0.09, 0.78);
    // Feno
    drawHay(W*0.175, H*0.22);
    drawHay(W*0.21, H*0.28, 30, 22);
    // Edifícios
    drawBarn();
    drawSilo();
    drawWindmill();
    drawWaterTower();
    drawFarmhouse();
    drawTractor();
}

// ========================= HUD =========================
function drawHUD(){
    // Barra top
    ctx.fillStyle='rgba(8,4,2,0.92)'; ctx.fillRect(0,0,W,58);
    ctx.fillStyle=C.go; ctx.fillRect(0,54,W,4);
    bevel(0,0,W,58,3);

    pxt(`MOEDAS: ${G.coins}`,20,35,C.ty,12);

    // Barra felicidade
    const bx=W/2-130,by=14,bw=260,bh=28;
    pxt('HAPPY',bx-76,by+20,C.ty,9);
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(bx,by,bw,bh);
    const gr=ctx.createLinearGradient(bx,0,bx+bw,0);
    gr.addColorStop(0,'#30c060'); gr.addColorStop(0.6,'#80d040'); gr.addColorStop(1,'#f8e000');
    ctx.fillStyle=gr; ctx.fillRect(bx,by,bw*(G.happy/100),bh);
    ctx.strokeStyle=C.go; ctx.lineWidth=2; ctx.strokeRect(bx,by,bw,bh);
    bevel(bx,by,bw,bh,2);
    pxt(`${G.happy}%`,bx+bw/2-14,by+20,C.tw3,8);

    // Inventário
    let ix=W-440; pxt('INV',ix-52,36,C.ty,8);
    Object.entries(G.inv).forEach(([k,v])=>{ if(v>0){
        ctx.fillStyle='rgba(255,255,255,0.10)'; ctx.fillRect(ix-2,8,44,44);
        emo(CROPS[k].icon,ix+18,30,22); pxt(`${v}`,ix+4,54,C.tw3,7); ix+=50;
    }});

    // Seed buttons
    KEYS.forEach((k,i)=>{
        const r=seedBtn(i),act=G.seed===k;
        if(act){const g2=ctx.createLinearGradient(r.x,r.y,r.x,r.y+r.h);g2.addColorStop(0,'#f8e040');g2.addColorStop(1,'#b09010');ctx.fillStyle=g2;}
        else ctx.fillStyle='rgba(8,4,2,0.90)';
        ctx.fillRect(r.x,r.y,r.w,r.h);
        ctx.strokeStyle=act?C.wh:C.go; ctx.lineWidth=act?3:2; ctx.strokeRect(r.x,r.y,r.w,r.h);
        bevel(r.x,r.y,r.w,r.h,3);
        emo(CROPS[k].icon,r.x+26,r.y+30,26);
        pxt(CROPS[k].name,r.x+42,r.y+24,act?C.bk:C.tw3,6);
        pxt(`$${CROPS[k].cost}`,r.x+42,r.y+44,act?'#444':C.ty,7);
    });

    // Vila panel
    const vx=W-242,vy=58,vw=238,vh=H-58-86;
    ctx.fillStyle='rgba(8,4,2,0.92)'; ctx.fillRect(vx,vy,vw,vh);
    ctx.fillStyle=C.go; ctx.fillRect(vx,vy,vw,4); ctx.strokeStyle=C.go; ctx.lineWidth=2; ctx.strokeRect(vx,vy,vw,vh);
    bevel(vx,vy,vw,vh,3);
    ctx.fillStyle='rgba(255,200,30,0.10)'; ctx.fillRect(vx,vy,vw,30);
    pxt('PEDIDOS DA VILA',vx+18,vy+22,C.ty,8);

    G.reqs.forEach((req,i)=>{
        const r=reqCard(i); if(r.y+r.h>H-90) return;
        const has=G.inv[req.crop]>=req.n;
        ctx.fillStyle=has?'rgba(20,60,30,0.92)':'rgba(42,20,10,0.92)'; ctx.fillRect(r.x,r.y,r.w,r.h);
        ctx.strokeStyle=has?C.uiGreen||'#38c060':'#806030'; ctx.lineWidth=2; ctx.strokeRect(r.x,r.y,r.w,r.h);
        bevel(r.x,r.y,r.w,r.h,3);
        emo(CROPS[req.crop].icon,r.x+20,r.y+28,24);
        pxt(`${req.n}x ${CROPS[req.crop].name}`,r.x+36,r.y+22,C.tw3,6);
        ctx.fillStyle='#80e090'; ctx.font='8px Press Start 2P,monospace'; ctx.fillText(`+$${req.coins}`,r.x+36,r.y+42);
        const by2=r.y+r.h-30,bh2=22;
        const bg=ctx.createLinearGradient(r.x+6,by2,r.x+6,by2+bh2);
        if(has){bg.addColorStop(0,'#50d878');bg.addColorStop(1,'#28944a');}
        else{bg.addColorStop(0,'#685040');bg.addColorStop(1,'#503828');}
        ctx.fillStyle=bg; ctx.fillRect(r.x+6,by2,r.w-12,bh2);
        ctx.strokeStyle=has?'#80f0a0':'#807060'; ctx.lineWidth=1; ctx.strokeRect(r.x+6,by2,r.w-12,bh2);
        bevel(r.x+6,by2,r.w-12,bh2,2);
        pxt(has?'DISTRIBUIR':'FALTANDO',r.x+16,by2+15,C.tw3,5);
    });

    // Notificação
    if(G.notif&&G.ntimer>0){
        const a=Math.min(1,G.ntimer/30); ctx.globalAlpha=a;
        const nw=340,nh=56,nx=W/2-nw/2,ny=H*0.44;
        ctx.fillStyle=G.notif.c; ctx.fillRect(nx,ny,nw,nh);
        ctx.strokeStyle='#fff'; ctx.lineWidth=4; ctx.strokeRect(nx,ny,nw,nh);
        bevel(nx,ny,nw,nh,4);
        pxt(G.notif.m,nx+18,ny+36,'#fff',9);
        ctx.globalAlpha=1; G.ntimer--;
    }
}

// ========================= INPUT =========================
canvas.addEventListener('mousemove',e=>{
    const mx=e.clientX,my=e.clientY; hov=-1;
    G.fields.forEach((_,i)=>{ const r=fieldRect(i); if(mx>=r.x&&mx<=r.x+r.w&&my>=r.y&&my<=r.y+r.h) hov=i; });
    canvas.style.cursor=hov>=0?'pointer':'default';
});

canvas.addEventListener('click',e=>{
    const mx=e.clientX,my=e.clientY;

    // Seções de campo
    G.fields.forEach((f,i)=>{
        const r=fieldRect(i);
        if(mx<r.x||mx>r.x+r.w||my<r.y||my>r.y+r.h) return;
        if(f.state==='empty'){
            const c=CROPS[G.seed];
            if(G.coins>=c.cost){ G.coins-=c.cost; f.state='growing'; f.crop=G.seed; f.t0=Date.now(); notif(`Plantado: ${c.name}`); }
            else notif('Sem moedas!','#c03020');
        } else if(f.state==='ready'){
            G.inv[f.crop]+=3; notif(`Colhido! ${CROPS[f.crop].icon}`); f.state='empty'; f.crop=null;
        }
    });

    // Botões de semente
    KEYS.forEach((k,i)=>{ const r=seedBtn(i); if(mx>=r.x&&mx<=r.x+r.w&&my>=r.y&&my<=r.y+r.h) G.seed=k; });

    // Distribuir
    G.reqs.forEach(req=>{
        const r=reqCard(G.reqs.indexOf(req)), by2=r.y+r.h-30;
        if(mx>=r.x+6&&mx<=r.x+r.w-6&&my>=by2&&my<=by2+22){
            if(G.inv[req.crop]>=req.n){
                G.inv[req.crop]-=req.n; G.coins+=req.coins;
                G.happy=Math.min(100,G.happy+req.happy);
                G.reqs=G.reqs.filter(r2=>r2.id!==req.id); notif('Vila agradecida! ❤️');
            }
        }
    });
});

// ========================= LOOP =========================
function loop(){
    G.fields.forEach(f=>{
        if(f.state==='growing'){ f.prog=Math.min(100,(Date.now()-f.t0)/CROPS[f.crop].grow*100); if(f.prog>=100) f.state='ready'; }
    });
    ctx.clearRect(0,0,W,H);
    drawMap(); drawHUD();
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
