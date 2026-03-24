// ============================================================
//  AgriCorp – Canvas Farm Game
//  Layout fiel à imagem de referência
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

let W, H;
function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    W = canvas.width;
    H = canvas.height;
}
resize();
window.addEventListener('resize', resize);

// ========================= PALETA =========================
const C = {
    grassA :'#78c050', grassB:'#68b040', grassC:'#509030', grassD:'#407820',
    pathA  :'#d8c080', pathB :'#c8b070', pathEdge:'#b89860',
    soilDry:'#a07840', soilWet:'#6a4c20', soilLine:'#88622e',
    fenceP :'#7a5228', fenceR:'#6a4218',
    barn   :'#c03020', barnS :'#9a2010', barnRoof:'#2a1808', barnHL:'#4a2c10',
    wood   :'#8a5a30', woodD :'#6a3a10',
    silo   :'#b0b8a8', siloD :'#8a9888', siloR:'#5a7860',
    mill   :'#9aaa98', millD :'#7a8a78',
    house  :'#e0d088', houseR:'#a02818', houseSide:'#c8b870',
    tank   :'#9a7040', tankW :'#4888c0', tankWL:'#78b8f8',
    truckB :'#2870c0', truckD:'#1850a0', truckW:'#98d0f8',
    treeT  :'#30a828', treeTL:'#50c848', treeTD:'#208018',
    treeTr :'#6a4020',
    haySt  :'#d8a018', hayD  :'#a87810',
    stone  :'#8a9a80', stoneD:'#6a7a60', stoneL:'#aaba98',
    uiBg   :'rgba(8,5,2,0.88)',
    gold   :'#f0c030', goldD :'#b09020',
    uiGreen:'#38c060', uiRed:'#c03020',
    white  :'#ffffff', black:'#000000',
    txtY   :'#f8d040', txtW :'#f0f0f0',
};

// ========================= ESTADO =========================
const CROPS = {
    wheat : { name:'Trigo',   icon:'🌾', grow:5000,  cost:5,  reward:10  },
    carrot: { name:'Cenoura', icon:'🥕', grow:10000, cost:10, reward:25  },
    tomato: { name:'Tomate',  icon:'🍅', grow:20000, cost:20, reward:55  },
    corn  : { name:'Milho',   icon:'🌽', grow:40000, cost:50, reward:150 },
};
const KEYS = Object.keys(CROPS);

const G = {
    coins:50, happy:0,
    inv  :{ wheat:0, carrot:0, tomato:0, corn:0 },
    seed :'wheat',
    plots: Array(9).fill(null).map((_,i)=>({ id:i, state:'empty', crop:null, prog:0, t0:0 })),
    reqs :[], notif:null, ntimer:0,
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
const pxT=(text,x,y,col,sz)=>{ ctx.font=`${sz}px 'Press Start 2P',monospace`; ctx.fillStyle=col; ctx.textAlign='left'; ctx.textBaseline='alphabetic'; ctx.fillText(text,x,y); };
const emo=(e,cx,cy,sz)=>{ ctx.font=`${sz}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(e,cx,cy); ctx.textAlign='left'; ctx.textBaseline='alphabetic'; };
const box=(x,y,w,h,f,s='',lw=2)=>{ ctx.fillStyle=f; ctx.fillRect(x,y,w,h); if(s){ctx.strokeStyle=s;ctx.lineWidth=lw;ctx.strokeRect(x,y,w,h);} };
const tri=(pts,f,s='',lw=2)=>{ ctx.beginPath(); ctx.moveTo(...pts[0]); pts.slice(1).forEach(p=>ctx.lineTo(...p)); ctx.closePath(); ctx.fillStyle=f; ctx.fill(); if(s){ctx.strokeStyle=s;ctx.lineWidth=lw;ctx.stroke();} };
const circ=(cx,cy,r,f,s='',lw=2)=>{ ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle=f; ctx.fill(); if(s){ctx.strokeStyle=s;ctx.lineWidth=lw;ctx.stroke();} };
function bevel(x,y,w,h,t=3){ ctx.fillStyle='rgba(255,255,255,0.18)'; ctx.fillRect(x,y,w,t); ctx.fillRect(x,y,t,h); ctx.fillStyle='rgba(0,0,0,0.28)'; ctx.fillRect(x,y+h-t,w,t); ctx.fillRect(x+w-t,y,t,h); }

// ========================= LAYOUT =========================
// O campo de cultivo fica na região centro-direita,
// replicando a posição da imagem de referência
function fieldOrigin(){ return { x: W*0.48, y: H*0.22 }; }
function plotRect(i){
    const col=i%3, row=Math.floor(i/3);
    const pw=Math.min(H*0.135, W*0.085);
    const gap=8;
    const {x:ox,y:oy}=fieldOrigin();
    return { x:ox+col*(pw+gap)+24, y:oy+row*(pw+gap)+24, w:pw, h:pw };
}
function seedBtn(i){
    const bw=136,bh=62,gap=12;
    const total=KEYS.length*(bw+gap)-gap;
    return { x:(W-total)/2+i*(bw+gap), y:H-78, w:bw, h:bh };
}
function reqCard(i){ return { x:W-232, y:H*0.18+i*116, w:218, h:106 }; }

// ========================= TERRENO =========================
function drawGrass(){
    // Base checker
    for(let gx=0;gx<W;gx+=32){
        for(let gy=0;gy<H;gy+=32){
            ctx.fillStyle=(Math.floor(gx/32+gy/32))%2===0?C.grassA:C.grassB;
            ctx.fillRect(gx,gy,32,32);
        }
    }
    // Grass tufts
    ctx.fillStyle=C.grassC;
    for(let gx=14;gx<W;gx+=44){ for(let gy=18;gy<H;gy+=44){
        ctx.fillRect(gx,gy,3,7); ctx.fillRect(gx+6,gy+3,3,5);
        ctx.fillStyle=C.grassD; ctx.fillRect(gx+1,gy+1,2,5); ctx.fillStyle=C.grassC;
    }}
}

function drawPaths(){
    // Horizontal main path (runs left-right, center of image)
    const py=H*0.585, ph=H*0.13;
    for(let x=0;x<W;x+=2){ ctx.fillStyle=(x/2)%2===0?C.pathA:C.pathB; ctx.fillRect(x,py,2,ph); }
    box(0,py,W,4,C.pathEdge); box(0,py+ph-4,W,4,C.pathEdge);
    // Pebbles on path
    ctx.fillStyle=C.stoneD;
    for(let x=28;x<W;x+=52){ ctx.fillRect(x,py+10,12,7); ctx.fillRect(x+26,py+22,9,5); ctx.fillRect(x+10,py+34,15,6); }

    // Small vertical connector path between barn area and crop field
    const vpx=W*0.455, vph=H*0.585-H*0.22;
    for(let y=H*0.22;y<H*0.585;y+=2){ ctx.fillStyle=(y/2)%2===0?C.pathA:C.pathB; ctx.fillRect(vpx,y,W*0.04,2); }
    box(vpx,H*0.22,4,vph,C.pathEdge); box(vpx+W*0.04-4,H*0.22,4,vph,C.pathEdge);
}

// ========================= CERCA DO CAMPO =========================
function drawFieldFence(){
    const {x:ox,y:oy}=fieldOrigin();
    const pw=Math.min(H*0.135,W*0.085), gap=8;
    const fw=3*(pw+gap)+16, fh=3*(pw+gap)+16;
    const fx=ox, fy=oy, gateW=40;

    // Top rail
    for(let x=0;x<fw;x+=18){ box(fx+x,fy,5,22,C.fenceP); box(fx+x,fy+4,18,4,C.fenceR); box(fx+x,fy+14,18,4,C.fenceR); }
    // Left rail
    for(let y=22;y<fh;y+=18){ box(fx,fy+y,5,22,C.fenceP); box(fx+2,fy+y,4,18,C.fenceR); box(fx+10,fy+y,4,18,C.fenceR); }
    // Bottom rail – has gate opening in middle
    for(let x=0;x<fw;x+=18){
        const cx=fx+x;
        if(cx>fx+fw*0.35&&cx<fx+fw*0.35+gateW) continue; // gate gap
        box(cx,fy+fh-4,5,22,C.fenceP); box(cx,fy+fh-1,18,4,C.fenceR); box(cx,fy+fh+9,18,4,C.fenceR);
    }
    // Right rail
    for(let y=22;y<fh;y+=18){ box(fx+fw,fy+y,5,22,C.fenceP); box(fx+fw+2,fy+y,4,18,C.fenceR); box(fx+fw+10,fy+y,4,18,C.fenceR); }
}

// ========================= ÁRVORES =========================
function drawTree(x,y,s=1){
    box(x-4*s,y+14*s,9*s,26*s,C.treeTr,C.black,1);
    circ(x,y+8*s,24*s,C.treeTD,C.black,1);
    circ(x+2*s,y+4*s,20*s,C.treeT,null);
    circ(x-7*s,y+2*s,14*s,C.treeTL,null);
    circ(x+10*s,y+10*s,12*s,C.treeTL,null);
}

// ========================= FENO =========================
function drawHay(x,y){
    box(x,y,34,24,C.haySt,C.black,2);
    ctx.fillStyle=C.hayD; for(let i=5;i<24;i+=7) ctx.fillRect(x,y+i,34,3);
    ctx.fillStyle='rgba(0,0,0,0.1)'; ctx.fillRect(x+4,y+24,34,5);
}

// ========================= MOINHO =========================
function drawWindmill(){
    // Position: far left, slightly top
    const mx=W*0.07, my=H*0.12;
    const t=Date.now()/1000;
    // Base/foundation
    box(mx-14,my+96,28,12,C.stoneD,C.black,2);
    // Tower (trapezoidal)
    ctx.fillStyle=C.mill;
    ctx.beginPath(); ctx.moveTo(mx-20,my+98); ctx.lineTo(mx-13,my+22); ctx.lineTo(mx+13,my+22); ctx.lineTo(mx+20,my+98); ctx.closePath(); ctx.fill();
    ctx.strokeStyle=C.black; ctx.lineWidth=2; ctx.stroke();
    // Stone stripes
    ctx.fillStyle=C.millD; for(let y=my+30;y<my+98;y+=10) ctx.fillRect(mx-18+(y-my)/7,y,32-(y-my)/5,2);
    // Door arch
    ctx.fillStyle=C.woodD;
    ctx.beginPath(); ctx.arc(mx,my+86,10,Math.PI,0); ctx.lineTo(mx+10,my+98); ctx.lineTo(mx-10,my+98); ctx.closePath(); ctx.fill();
    ctx.strokeStyle=C.black; ctx.lineWidth=1; ctx.stroke();
    // Blades – animated
    ctx.save(); ctx.translate(mx,my+28);
    for(let i=0;i<4;i++){
        ctx.save(); ctx.rotate(t*0.65+i*Math.PI/2);
        // Blade (wider, tapered)
        ctx.fillStyle='#e8d898'; ctx.strokeStyle=C.black; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(-5,3); ctx.lineTo(5,3); ctx.lineTo(3,42); ctx.lineTo(-3,42); ctx.closePath();
        ctx.fill(); ctx.stroke();
        // Cross brace
        ctx.strokeStyle=C.woodD; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(0,5); ctx.lineTo(0,40); ctx.stroke();
        ctx.restore();
    }
    circ(0,0,7,C.wood,C.black,2); ctx.restore();
}

// ========================= CELEIRO =========================
function drawBarn(){
    const bx=W*0.22, by=H*0.12;
    const bw=160, bh=115;
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.14)'; ctx.fillRect(bx+12,by+12,bw,bh);
    // Main wall
    box(bx,by,bw,bh,C.barn,C.black,3);
    // Plank texture
    ctx.fillStyle='rgba(0,0,0,0.07)'; for(let i=0;i<bh;i+=18) ctx.fillRect(bx+2,by+i,bw-4,10);
    // Cross boards (diagonal X on doors)
    ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(bx+38,by+62); ctx.lineTo(bx+100,by+bh); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx+100,by+62); ctx.lineTo(bx+38,by+bh); ctx.stroke();
    // Roof
    tri([[bx-14,by],[bx+bw/2,by-62],[bx+bw+14,by]],C.barnRoof,C.black,3);
    ctx.fillStyle=C.barnHL; ctx.fillRect(bx+bw/2-4,by-62,8,62); // ridge
    // Roof accent
    ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(bx+bw/2-40,by-58,38,58); ctx.fillRect(bx+bw/2+4,by-52,35,52);
    // Left window
    box(bx+8,by+28,32,26,C.woodD,C.black,2);
    box(bx+10,by+30,28,22,'#b0d8f0',null);
    ctx.fillStyle=C.woodD; ctx.fillRect(bx+23,by+30,2,22); ctx.fillRect(bx+10,by+41,28,2);
    // Double doors
    box(bx+38,by+62,30,bh-62,C.woodD,C.black,2);
    box(bx+40,by+64,28,bh-66,C.wood,null);
    box(bx+70,by+62,30,bh-62,C.woodD,C.black,2);
    box(bx+72,by+64,28,bh-66,C.wood,null);
    circ(bx+69,by+bh-25,4,'#d0a040',C.black,1);
    // Side panel
    ctx.fillStyle=C.barnS; ctx.fillRect(bx+bw,by+15,22,bh-10);
    ctx.strokeStyle=C.black; ctx.lineWidth=2; ctx.strokeRect(bx+bw,by+15,22,bh-10);
    ctx.fillStyle='rgba(0,0,0,0.08)'; for(let i=0;i<bh-10;i+=16) ctx.fillRect(bx+bw+2,by+15+i,18,9);
}

// ========================= SILO =========================
function drawSilo(){
    const sx=W*0.22+192, sy=H*0.12+8;
    const sr=24, sh=96;
    ctx.fillStyle='rgba(0,0,0,0.12)'; ctx.fillRect(sx-sr+8,sy+8,sr*2,sh);
    box(sx-sr,sy,sr*2,sh,C.silo,C.black,2);
    ctx.fillStyle=C.siloD; for(let x=sx-sr+8;x<sx+sr;x+=10) ctx.fillRect(x,sy,2,sh);
    // Dome
    ctx.fillStyle=C.siloR; ctx.beginPath(); ctx.ellipse(sx,sy,sr,sr*0.55,0,Math.PI,0,true); ctx.fill(); ctx.strokeStyle=C.black; ctx.lineWidth=2; ctx.stroke();
    // Cone roof
    tri([[sx-sr-5,sy],[sx,sy-28],[sx+sr+5,sy]],C.siloD,C.black,2);
    // Vent ring at top
    circ(sx,sy-28,5,'#7a8870',C.black,1);
}

// ========================= FARMHOUSE (TOP-RIGHT) =========================
function drawFarmhouse(){
    const hx=W*0.78, hy=H*0.09;
    const hw=95, hh=75;
    ctx.fillStyle='rgba(0,0,0,0.12)'; ctx.fillRect(hx+10,hy+30,hw,hh);
    // Walls
    box(hx,hy+22,hw,hh,C.house,C.black,2);
    box(hx+hw,hy+28,14,hh-6,C.houseSide,null); ctx.strokeStyle=C.black; ctx.lineWidth=1; ctx.strokeRect(hx+hw,hy+28,14,hh-6);
    // Roof
    tri([[hx-10,hy+22],[hx+hw/2,hy-12],[hx+hw+10,hy+22]],C.houseR,C.black,2);
    ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(hx+hw/2-3,hy-12,6,34);
    // Chimney
    box(hx+hw-28,hy-20,12,34,C.stoneD,C.black,2);
    ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(hx+hw-28,hy-22,12,5);
    // Door
    box(hx+34,hy+62,22,hh-42,C.wood,C.black,2);
    circ(hx+45,hy+87,3,'#d0a040',C.black,1);
    // Windows
    box(hx+4,hy+38,22,18,C.woodD,C.black,2);
    box(hx+6,hy+40,18,14,'#b0d8f0',null);
    ctx.fillStyle=C.woodD; ctx.fillRect(hx+14,hy+40,2,14); ctx.fillRect(hx+6,hy+47,18,2);
    box(hx+68,hy+38,22,18,C.woodD,C.black,2);
    box(hx+70,hy+40,18,14,'#b0d8f0',null);
    ctx.fillStyle=C.woodD; ctx.fillRect(hx+78,hy+40,2,14); ctx.fillRect(hx+70,hy+47,18,2);
    // Porch sign
    box(hx+20,hy+20,54,14,'#c8b060',C.black,1);
    pxT('LOJA',hx+24,hy+31,'#5a2000',6);
}

// ========================= CAIXA D'ÁGUA =========================
function drawWaterTower(){
    const tx=W*0.88, ty=H*0.62;
    const tw=54, th=42;
    // Legs & braces
    ctx.fillStyle=C.woodD; ctx.fillRect(tx+6,ty+th,6,34); ctx.fillRect(tx+tw-12,ty+th,6,34);
    ctx.strokeStyle=C.wood; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(tx+9,ty+th+4); ctx.lineTo(tx+tw-9,ty+th+30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx+tw-9,ty+th+4); ctx.lineTo(tx+9,ty+th+30); ctx.stroke();
    // Tank body
    box(tx,ty,tw,th,C.tank,C.black,2);
    // Water visible
    box(tx+3,ty+4,tw-6,20,C.tankW,null);
    ctx.fillStyle=C.tankWL; ctx.fillRect(tx+3,ty+4,tw-6,5);
    // Barrel bands
    ctx.fillStyle=C.wood; ctx.fillRect(tx,ty+14,tw,4); ctx.fillRect(tx,ty+30,tw,4);
    // Roof
    tri([[tx-4,ty],[tx+tw/2,ty-14],[tx+tw+4,ty]],C.woodD,C.black,2);
    // Pipe
    box(tx+tw/2-4,ty+th,8,8,C.stoneD,C.black,1);
}

// ========================= TRATOR =========================
function drawTractor(){
    // Reference image: tractor (blue) on the horizontal path, center-left of image
    const t0x=W*0.20, t0y=H*0.595;
    // Big rear wheel
    circ(t0x+16,t0y+42,22,C.black,C.black,2);
    circ(t0x+16,t0y+42,12,'#3a3a3a',null);
    ctx.fillStyle='#666'; [0,60,120,180,240,300].forEach(a=>{ const r=a*Math.PI/180; ctx.fillRect(t0x+16+Math.cos(r)*8-2,t0y+42+Math.sin(r)*8-2,4,4); });
    // Body
    box(t0x,t0y+10,74,38,C.truckB,C.black,2);
    // Hood
    box(t0x+46,t0y-2,30,28,C.truckD,C.black,2);
    // Exhaust
    box(t0x+68,t0y-18,7,20,'#888',C.black,1); box(t0x+66,t0y-20,11,4,'#555',C.black,1);
    // Cab window
    box(t0x+48,t0y,26,20,C.truckW,C.black,2);
    ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fillRect(t0x+50,t0y+2,10,10);
    // Front wheel
    circ(t0x+64,t0y+44,14,C.black,C.black,2);
    circ(t0x+64,t0y+44,7,'#3a3a3a',null);
    // Headlight
    circ(t0x+78,t0y+22,5,'#f8f050',C.black,1);
}

// ========================= MAPA COMPLETO =========================
function drawMap(){
    drawGrass();
    drawPaths();
    drawFieldFence();
    drawTree(W*0.02+5, H*0.35);
    drawTree(W*0.04,   H*0.68, 0.85);
    drawTree(W*0.935,  H*0.38);
    drawTree(W*0.965,  H*0.32, 0.9);
    drawTree(W*0.73,   H*0.10, 0.8);
    drawHay(W*0.175, H*0.24);
    drawHay(W*0.22,  H*0.30);
    drawBarn();
    drawSilo();
    drawWindmill();
    drawWaterTower();
    drawFarmhouse();
    drawTractor();
}

// ========================= CANTEIROS =========================
let hov=-1;
function drawPlots(){
    G.plots.forEach((p,i)=>{
        const r=plotRect(i);
        const isH=hov===i;
        // Solo
        box(r.x,r.y,r.w,r.h,p.state==='empty'?C.soilDry:C.soilWet);
        // Arado – listras horizontais e verticais, estilo plantation
        ctx.fillStyle=C.soilLine;
        for(let k=0;k<r.h;k+=9) ctx.fillRect(r.x,r.y+k,r.w,2);
        for(let k=0;k<r.w;k+=12) ctx.fillRect(r.x+k,r.y,2,r.h);
        // Borda
        ctx.strokeStyle=isH?'#fff':C.fenceR; ctx.lineWidth=isH?3:2; ctx.strokeRect(r.x,r.y,r.w,r.h);
        if(isH){ ctx.strokeStyle='rgba(255,255,180,0.4)'; ctx.lineWidth=1; ctx.strokeRect(r.x+3,r.y+3,r.w-6,r.h-6); }

        if(p.state==='growing'){
            ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(r.x+5,r.y+r.h-14,r.w-10,10);
            const g=ctx.createLinearGradient(r.x+5,0,r.x+5+(r.w-10)*(p.prog/100),0);
            g.addColorStop(0,'#48e070'); g.addColorStop(1,'#a0f040');
            ctx.fillStyle=g; ctx.fillRect(r.x+5,r.y+r.h-14,(r.w-10)*(p.prog/100),10);
            ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1; ctx.strokeRect(r.x+5,r.y+r.h-14,r.w-10,10);
            emo('🌱',r.x+r.w/2,r.y+r.h/2,r.w*0.48);
        } else if(p.state==='ready'){
            const b=Math.sin(Date.now()/160)*6;
            ctx.fillStyle='rgba(255,255,100,0.12)'; ctx.beginPath(); ctx.arc(r.x+r.w/2,r.y+r.h/2,r.w*0.38,0,Math.PI*2); ctx.fill();
            emo(CROPS[p.crop].icon,r.x+r.w/2,r.y+r.h/2+b,r.w*0.54);
        }
    });
}

// ========================= HUD =========================
function drawHUD(){
    // Top bar
    ctx.fillStyle='rgba(8,4,2,0.90)'; ctx.fillRect(0,0,W,58);
    ctx.fillStyle=C.gold; ctx.fillRect(0,54,W,4);
    bevel(0,0,W,58,3);

    pxT(`MOEDAS: ${G.coins}`, 20, 35, C.txtY, 12);

    // Happiness
    const bx=W/2-130, by=14, bw=260, bh=28;
    pxT('HAPPY', bx-76, by+20, C.txtY, 9);
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(bx,by,bw,bh);
    const grd=ctx.createLinearGradient(bx,0,bx+bw,0);
    grd.addColorStop(0,'#30c060'); grd.addColorStop(0.6,'#80d040'); grd.addColorStop(1,'#f8e000');
    ctx.fillStyle=grd; ctx.fillRect(bx,by,bw*(G.happy/100),bh);
    ctx.strokeStyle=C.gold; ctx.lineWidth=2; ctx.strokeRect(bx,by,bw,bh);
    bevel(bx,by,bw,bh,2);
    pxT(`${G.happy}%`, bx+bw/2-14, by+20, C.txtW, 8);

    // Inventory
    let ix=W-440; pxT('INV',ix-52,36,C.txtY,8);
    Object.entries(G.inv).forEach(([k,v])=>{ if(v>0){
        ctx.fillStyle='rgba(255,255,255,0.10)'; ctx.fillRect(ix-2,8,44,44);
        emo(CROPS[k].icon,ix+18,30,22); pxT(`${v}`,ix+4,54,C.txtW,7); ix+=50;
    }});

    // Seed buttons (bottom)
    KEYS.forEach((k,i)=>{
        const r=seedBtn(i), act=G.seed===k;
        if(act){ const g2=ctx.createLinearGradient(r.x,r.y,r.x,r.y+r.h); g2.addColorStop(0,'#f8e040'); g2.addColorStop(1,'#b09010'); ctx.fillStyle=g2; }
        else     ctx.fillStyle='rgba(8,4,2,0.88)';
        ctx.fillRect(r.x,r.y,r.w,r.h);
        ctx.strokeStyle=act?C.white:C.gold; ctx.lineWidth=act?3:2; ctx.strokeRect(r.x,r.y,r.w,r.h);
        bevel(r.x,r.y,r.w,r.h,3);
        emo(CROPS[k].icon,r.x+26,r.y+30,26);
        pxT(CROPS[k].name,r.x+42,r.y+24,act?C.black:C.txtW,6);
        pxT(`$${CROPS[k].cost}`,r.x+42,r.y+44,act?'#444':C.txtY,7);
    });

    // Vila panel (right side)
    const vx=W-240, vy=58, vw=236, vh=H-58-84;
    ctx.fillStyle='rgba(8,4,2,0.90)'; ctx.fillRect(vx,vy,vw,vh);
    ctx.fillStyle=C.gold; ctx.fillRect(vx,vy,vw,4); ctx.strokeStyle=C.gold; ctx.lineWidth=2; ctx.strokeRect(vx,vy,vw,vh);
    bevel(vx,vy,vw,vh,3);
    ctx.fillStyle='rgba(255,200,30,0.10)'; ctx.fillRect(vx,vy,vw,30);
    pxT('VILA',vx+76,vy+22,C.txtY,11);

    G.reqs.forEach((req,i)=>{
        const r=reqCard(i); if(r.y+r.h>H-90) return;
        const has=G.inv[req.crop]>=req.n;
        ctx.fillStyle=has?'rgba(20,60,30,0.92)':'rgba(42,20,10,0.92)'; ctx.fillRect(r.x,r.y,r.w,r.h);
        ctx.strokeStyle=has?C.uiGreen:'#806030'; ctx.lineWidth=2; ctx.strokeRect(r.x,r.y,r.w,r.h);
        bevel(r.x,r.y,r.w,r.h,3);
        emo(CROPS[req.crop].icon,r.x+20,r.y+28,24);
        pxT(`${req.n}x ${CROPS[req.crop].name}`,r.x+36,r.y+22,C.txtW,6);
        ctx.fillStyle='#80e090'; ctx.font='8px Press Start 2P,monospace'; ctx.fillText(`+$${req.coins}`,r.x+36,r.y+42);

        const by2=r.y+r.h-30, bh2=22;
        const bg=ctx.createLinearGradient(r.x+6,by2,r.x+6,by2+bh2);
        if(has){ bg.addColorStop(0,'#50d878'); bg.addColorStop(1,'#28944a'); }
        else    { bg.addColorStop(0,'#685040'); bg.addColorStop(1,'#503828'); }
        ctx.fillStyle=bg; ctx.fillRect(r.x+6,by2,r.w-12,bh2);
        ctx.strokeStyle=has?'#80f0a0':'#807060'; ctx.lineWidth=1; ctx.strokeRect(r.x+6,by2,r.w-12,bh2);
        bevel(r.x+6,by2,r.w-12,bh2,2);
        pxT(has?'DISTRIBUIR':'FALTANDO',r.x+16,by2+15,C.txtW,5);
    });

    // Notificação central
    if(G.notif&&G.ntimer>0){
        const a=Math.min(1,G.ntimer/30);
        ctx.globalAlpha=a;
        const nw=340,nh=58,nx=W/2-nw/2,ny=H*0.44;
        ctx.fillStyle=G.notif.c; ctx.fillRect(nx,ny,nw,nh);
        ctx.strokeStyle='#fff'; ctx.lineWidth=4; ctx.strokeRect(nx,ny,nw,nh);
        bevel(nx,ny,nw,nh,4);
        pxT(G.notif.m,nx+18,ny+36,'#fff',9);
        ctx.globalAlpha=1; G.ntimer--;
    }
}

// ========================= INPUT =========================
canvas.addEventListener('mousemove',e=>{
    const mx=e.clientX,my=e.clientY; hov=-1;
    G.plots.forEach((_,i)=>{ const r=plotRect(i); if(mx>=r.x&&mx<=r.x+r.w&&my>=r.y&&my<=r.y+r.h) hov=i; });
    canvas.style.cursor=hov>=0?'pointer':'default';
});
canvas.addEventListener('click',e=>{
    const mx=e.clientX,my=e.clientY;
    G.plots.forEach((p,i)=>{
        const r=plotRect(i); if(mx<r.x||mx>r.x+r.w||my<r.y||my>r.y+r.h) return;
        if(p.state==='empty'){
            const c=CROPS[G.seed];
            if(G.coins>=c.cost){ G.coins-=c.cost; p.state='growing'; p.crop=G.seed; p.t0=Date.now(); notif(`Plantado: ${c.name}`); }
            else notif('Sem moedas!',C.uiRed);
        } else if(p.state==='ready'){
            G.inv[p.crop]++; notif(`Colhido! ${CROPS[p.crop].icon}`); p.state='empty'; p.crop=null;
        }
    });
    KEYS.forEach((k,i)=>{ const r=seedBtn(i); if(mx>=r.x&&mx<=r.x+r.w&&my>=r.y&&my<=r.y+r.h) G.seed=k; });
    G.reqs.forEach(req=>{
        const r=reqCard(G.reqs.indexOf(req));
        const by2=r.y+r.h-30;
        if(mx>=r.x+6&&mx<=r.x+r.w-6&&my>=by2&&my<=by2+22){
            if(G.inv[req.crop]>=req.n){
                G.inv[req.crop]-=req.n; G.coins+=req.coins; G.happy=Math.min(100,G.happy+req.happy);
                G.reqs=G.reqs.filter(r2=>r2.id!==req.id); notif('Vila agradecida! ❤️');
            }
        }
    });
});

// ========================= LOOP =========================
function loop(){
    G.plots.forEach(p=>{
        if(p.state==='growing'){ p.prog=Math.min(100,(Date.now()-p.t0)/CROPS[p.crop].grow*100); if(p.prog>=100) p.state='ready'; }
    });
    ctx.clearRect(0,0,W,H);
    drawMap(); drawPlots(); drawHUD();
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
