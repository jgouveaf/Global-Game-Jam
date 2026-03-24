// ==========================================
//  AgriCorp - Canvas Top-Down Farm
//  Visual Overhaul: rich pixel-art world
// ==========================================

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

// ==========================================
//  PALETTE – Stardew / Harvest Moon vibes
// ==========================================
const P = {
    // Terrain
    sky        : '#afe0f0',
    grassA     : '#78c850',
    grassB     : '#60b040',
    grassC     : '#50a030',
    grassD     : '#408020',
    pathA      : '#d8c090',
    pathB      : '#c0a870',
    pathC      : '#a89058',
    dirt       : '#a87840',
    dirtD      : '#886030',
    soil       : '#6b4a28',
    soilW      : '#4a2e12',
    soilLine   : '#3a2008',
    // Buildings
    barn       : '#c0392b',
    barnSide   : '#a02828',
    barnRoof   : '#2c1c10',
    barnRoofL  : '#483018',
    wood       : '#7b4a28',
    woodD      : '#5a3018',
    silo       : '#b8c0b0',
    siloD      : '#909890',
    siloRoof   : '#70887a',
    house      : '#e8d898',
    houseWall  : '#d8c880',
    houseRoof  : '#882218',
    stone      : '#8a9888',
    stoneD     : '#6a7868',
    stoneL     : '#aab8a8',
    water      : '#3878c8',
    waterL     : '#60a0f0',
    // Decor
    treeT      : '#30a030',
    treeTL     : '#48c048',
    treeTD     : '#208020',
    treeTrunk  : '#5a3820',
    hay        : '#d8a820',
    hayD       : '#b08018',
    fence      : '#9a7040',
    fenceD     : '#7a5020',
    // UI
    uiBg       : 'rgba(20,12,8,0.85)',
    uiBrd      : '#f0c040',
    uiBrdD     : '#b89020',
    uiGreen    : '#38c060',
    uiRed      : '#c83828',
    white      : '#ffffff',
    black      : '#000000',
    textYellow : '#f8d040',
    textWhite  : '#f0f0f0',
};

// ==========================================
//  GAME STATE
// ==========================================
const CROPS = {
    wheat : { name:'Trigo',   icon:'🌾', grow:5000,  cost:5,  reward:10  },
    carrot: { name:'Cenoura', icon:'🥕', grow:10000, cost:10, reward:25  },
    tomato: { name:'Tomate',  icon:'🍅', grow:20000, cost:20, reward:55  },
    corn  : { name:'Milho',   icon:'🌽', grow:40000, cost:50, reward:150 },
};
const KEYS = Object.keys(CROPS);

const G = {
    coins: 50,
    happy: 0,
    inv  : { wheat:0, carrot:0, tomato:0, corn:0 },
    seed : 'wheat',
    plots: Array(9).fill(null).map((_,i) => ({
        id:i, state:'empty', crop:null, prog:0, t0:0
    })),
    reqs : [],
    notif: null,
    ntimer: 0,
};

function addReq() {
    if (G.reqs.length >= 4) return;
    const k = KEYS[Math.floor(Math.random()*KEYS.length)];
    const n = Math.floor(Math.random()*3)+2;
    G.reqs.push({ id:Math.random(), crop:k, n, coins:Math.floor(CROPS[k].reward*n*1.5), happy:n*2 });
}
addReq();
setInterval(addReq, 8000);

function notif(m, c='#27ae60') { G.notif={m,c}; G.ntimer=150; }

// ==========================================
//  LAYOUT helpers
// ==========================================
function plotRect(i) {
    const col=i%3, row=Math.floor(i/3);
    const pw=Math.min(H*0.15, W*0.09);
    const gap=10;
    const gw= pw*3 + gap*2;
    const gh= pw*3 + gap*2;
    const gx= W*0.35 ;
    const gy= H*0.25;
    return { x: gx+col*(pw+gap), y: gy+row*(pw+gap), w:pw, h:pw };
}
function seedBtn(i) {
    const bw=140, bh=64, gap=14;
    const total = KEYS.length*(bw+gap)-gap;
    return { x:(W-total)/2+i*(bw+gap), y:H-80, w:bw, h:bh };
}
function reqCard(i) {
    const rx=W-230, ry=H*0.17+i*118;
    return { x:rx, y:ry, w:210, h:108 };
}

// ==========================================
//  DRAW HELPERS
// ==========================================
const px = (text,x,y,color,size) => {
    ctx.font=`${size}px 'Press Start 2P',monospace`;
    ctx.fillStyle=color;
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText(text,x,y);
};
const emoji = (e,cx,cy,sz) => {
    ctx.font=`${sz}px serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(e,cx,cy);
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
};
const rect = (x,y,w,h,fill,stroke,lw=2)=>{
    ctx.fillStyle=fill; ctx.fillRect(x,y,w,h);
    if(stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=lw; ctx.strokeRect(x,y,w,h); }
};
const tri=(pts,fill,stroke,lw=2)=>{
    ctx.beginPath(); ctx.moveTo(...pts[0]);
    pts.slice(1).forEach(p=>ctx.lineTo(...p)); ctx.closePath();
    ctx.fillStyle=fill; ctx.fill();
    if(stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=lw; ctx.stroke(); }
};
const circle=(cx,cy,r,fill,stroke,lw=2)=>{
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
    ctx.fillStyle=fill; ctx.fill();
    if(stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=lw; ctx.stroke(); }
};

// Pixel border – raised bevel effect
function pixelBorder(x,y,w,h, light='rgba(255,255,255,0.25)', dark='rgba(0,0,0,0.35)', bw=4){
    ctx.fillStyle=light;
    ctx.fillRect(x,y,w,bw); ctx.fillRect(x,y,bw,h);
    ctx.fillStyle=dark;
    ctx.fillRect(x,y+h-bw,w,bw); ctx.fillRect(x+w-bw,y,bw,h);
}

// ==========================================
//  TERRAIN
// ==========================================
function drawTerrain(){
    // Checkerboard grass
    for(let gx=0;gx<W;gx+=32){
        for(let gy=0;gy<H;gy+=32){
            ctx.fillStyle=(Math.floor(gx/32)+Math.floor(gy/32))%2===0?P.grassA:P.grassB;
            ctx.fillRect(gx,gy,32,32);
        }
    }
    // Grass tufts
    ctx.fillStyle=P.grassC;
    for(let gx=16;gx<W;gx+=48){
        for(let gy=20;gy<H;gy+=48){
            ctx.fillRect(gx,gy,3,6); ctx.fillRect(gx+5,gy+2,3,4);
            ctx.fillStyle=P.grassD; ctx.fillRect(gx+2,gy+1,2,4); ctx.fillStyle=P.grassC;
        }
    }

    // Horizontal path
    for(let x=0;x<W;x+=2){
        ctx.fillStyle=(x/2)%2===0?P.pathA:P.pathB;
        ctx.fillRect(x,H*0.60,2,H*0.14);
    }
    // Path edges
    ctx.fillStyle=P.pathC; ctx.fillRect(0,H*0.60,W,4);
    ctx.fillStyle=P.pathC; ctx.fillRect(0,H*0.74-4,W,4);
    // Path stones
    ctx.fillStyle=P.stoneD;
    for(let x=30;x<W;x+=60){
        ctx.fillRect(x, H*0.60+10, 14, 8);
        ctx.fillRect(x+30, H*0.60+24, 10, 6);
    }

    // Vertical path
    for(let y=0;y<H;y+=2){
        ctx.fillStyle=(y/2)%2===0?P.pathA:P.pathB;
        ctx.fillRect(W*0.30,y,W*0.05,2);
    }
    ctx.fillStyle=P.pathC;
    ctx.fillRect(W*0.30,0,4,H); ctx.fillRect(W*0.35-4,0,4,H);

    // Farm soil area
    ctx.fillStyle=P.dirtD;
    ctx.fillRect(W*0.35-8, H*0.22-8, W*0.42+16, H*0.40+16);
    ctx.fillStyle=P.dirt;
    ctx.fillRect(W*0.35, H*0.22, W*0.42, H*0.40);
    // Soil rows
    ctx.fillStyle=P.dirtD;
    for(let i=0;i<W*0.42;i+=14){
        ctx.fillRect(W*0.35+i, H*0.22, 2, H*0.40);
    }
    for(let j=0;j<H*0.40;j+=14){
        ctx.fillRect(W*0.35, H*0.22+j, W*0.42, 2);
    }
}

// ==========================================
//  BUILDINGS
// ==========================================
function drawBarn(){
    const bx=W*0.06, by=H*0.10;
    const bw=150, bh=110;
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.15)';
    ctx.fillRect(bx+12,by+12,bw,bh);
    // Front wall
    rect(bx, by, bw, bh, P.barn, P.barnD, 3);
    // Side shadow
    rect(bx+bw, by+10, 18, bh-8, P.barnSide, null);
    ctx.strokeStyle=P.black; ctx.lineWidth=2;
    ctx.strokeRect(bx,by,bw,bh);
    // White horizontal planks
    ctx.fillStyle='rgba(255,255,255,0.08)';
    for(let i=0;i<bh;i+=16) ctx.fillRect(bx+2,by+i,bw-4,8);
    // Roof
    tri([[bx-12,by],[bx+bw/2,by-60],[bx+bw+12,by]], P.barnRoof, P.black, 3);
    // Roof highlight
    ctx.fillStyle=P.barnRoofL;
    ctx.fillRect(bx+bw/2-4,by-60,8,60);
    // Door (double)
    rect(bx+38, by+60, 28, bh-60, P.woodD, P.black, 2);
    rect(bx+68, by+60, 28, bh-60, P.woodD, P.black, 2);
    rect(bx+40, by+62, 24, bh-64, P.wood, null);
    rect(bx+70, by+62, 24, bh-64, P.wood, null);
    // Door handle
    circle(bx+65, by+bh-25, 4, '#d0a840', P.black, 1);
    // Window
    rect(bx+8, by+30, 30, 24, P.woodD, P.black, 2);
    rect(bx+10, by+32, 26, 20, '#b8ddf8', null);
    // Window cross
    ctx.fillStyle=P.woodD;
    ctx.fillRect(bx+22, by+32, 2, 20); ctx.fillRect(bx+10, by+42, 26, 2);
}

function drawSilo(){
    const sx=W*0.06+175, sy=H*0.10+5;
    const sr=24, sh=90;
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.12)';
    ctx.fillRect(sx-sr+8, sy+8, sr*2, sh);
    // Body
    rect(sx-sr, sy, sr*2, sh, P.silo, P.black, 2);
    // Vertical lines
    ctx.fillStyle=P.siloD;
    for(let x=sx-sr+8;x<sx+sr;x+=10) ctx.fillRect(x, sy, 2, sh);
    // Dome top
    ctx.fillStyle=P.siloRoof;
    ctx.beginPath(); ctx.ellipse(sx, sy, sr, sr*0.6, 0, Math.PI, 0, true); ctx.fill();
    ctx.strokeStyle=P.black; ctx.lineWidth=2; ctx.stroke();
    // Cone roof
    tri([[sx-sr-5,sy],[sx,sy-30],[sx+sr+5,sy]], P.siloD, P.black, 2);
}

function drawWindmill(){
    const mx=W*0.14, my=H*0.10;
    const t=Date.now()/1000;
    // Tower
    ctx.fillStyle=P.stone;
    ctx.beginPath();
    ctx.moveTo(mx-22, my+100); ctx.lineTo(mx-14, my+20);
    ctx.lineTo(mx+14, my+20); ctx.lineTo(mx+22, my+100);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle=P.black; ctx.lineWidth=2; ctx.stroke();
    // Stone lines
    ctx.fillStyle=P.stoneD;
    for(let y=my+30;y<my+100;y+=12) ctx.fillRect(mx-20+(y-my)/6, y, 38-(y-my)/4, 2);
    // Door
    rect(mx-8, my+75, 16, 25, P.woodD, P.black, 2);
    // Blades
    ctx.save(); ctx.translate(mx, my+30);
    for(let i=0;i<4;i++){
        ctx.save(); ctx.rotate(t*0.7+i*Math.PI/2);
        // Blade
        ctx.fillStyle='#e8d898'; ctx.strokeStyle=P.black; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(-4,2); ctx.lineTo(4,2); ctx.lineTo(3,38); ctx.lineTo(-3,38); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.restore();
    }
    circle(0,0,8,P.wood,P.black,2); ctx.restore();
}

function drawWaterTower(){
    const tx=W*0.14, ty=H*0.65;
    const tw=56;
    // Legs
    ctx.fillStyle=P.woodD; ctx.lineWidth=2;
    ctx.fillRect(tx+4, ty+46, 6, 35);
    ctx.fillRect(tx+tw-10, ty+46, 6, 35);
    // Cross brace
    ctx.strokeStyle=P.wood; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(tx+7,ty+52); ctx.lineTo(tx+tw-7,ty+76); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx+tw-7,ty+52); ctx.lineTo(tx+7,ty+76); ctx.stroke();
    // Tank
    rect(tx, ty, tw, 46, P.woodD, P.black, 2);
    rect(tx+2, ty+2, tw-4, 30, P.water, null);
    ctx.fillStyle=P.waterL;
    ctx.fillRect(tx+2, ty+2, tw-4, 6);
    // Roof
    tri([[tx-4,ty],[tx+tw/2,ty-16],[tx+tw+4,ty]], P.wood, P.black, 2);
    // Bands
    ctx.fillStyle=P.wood;
    ctx.fillRect(tx, ty+14, tw, 4); ctx.fillRect(tx, ty+32, tw, 4);
}

function drawFarmhouse(){
    const hx=W*0.84, hy=H*0.09;
    const hw=100, hh=80;
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.12)'; ctx.fillRect(hx+8,hy+28,hw,hh);
    // Walls
    rect(hx, hy+20, hw, hh, P.house, P.black, 2);
    // Side shading
    rect(hx+hw, hy+28, 14, hh-6, P.houseWall, null);
    // Roof
    tri([[hx-8,hy+20],[hx+hw/2,hy-15],[hx+hw+8,hy+20]], P.houseRoof, P.black, 2);
    ctx.fillStyle='rgba(255,255,255,0.1)';
    ctx.fillRect(hx+hw/2-3,hy-15,6,35);
    // Chimney
    rect(hx+hw-28, hy-20, 14, 35, P.stone, P.black, 2);
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(hx+hw-28,hy-22,14,6);
    // Door
    rect(hx+38, hy+60, 24, hh-40, P.wood, P.black, 2);
    circle(hx+50, hy+90, 3, '#d0a840', P.black, 1);
    // Windows
    rect(hx+6, hy+36, 24, 20, P.woodD, P.black, 2);
    rect(hx+8, hy+38, 20, 16, '#b8ddf8', null);
    ctx.fillStyle=P.woodD; ctx.fillRect(hx+17,hy+38,2,16); ctx.fillRect(hx+8,hy+46,20,2);
    rect(hx+70, hy+36, 24, 20, P.woodD, P.black, 2);
    rect(hx+72, hy+38, 20, 16, '#b8ddf8', null);
    ctx.fillStyle=P.woodD; ctx.fillRect(hx+81,hy+38,2,16); ctx.fillRect(hx+72,hy+46,20,2);
}

function drawTractor(){
    const tx=W*0.17, ty=H*0.615;
    // Big rear wheel
    circle(tx+14, ty+44, 22, '#1a1a1a', P.black, 2);
    circle(tx+14, ty+44, 12, '#3a3a3a', null);
    ctx.fillStyle='#555'; [0,60,120,180,240,300].forEach(a=>{
        const r=a*Math.PI/180;
        ctx.fillRect(tx+14+Math.cos(r)*7-2, ty+44+Math.sin(r)*7-2,4,4);
    });
    // Body
    rect(tx, ty+10, 72, 36, '#2878c0', P.black, 2);
    // Hood
    rect(tx+44, ty-4, 32, 26, '#1858a0', P.black, 2);
    // Exhaust
    rect(tx+66, ty-16, 8, 18, '#888', P.black, 1);
    ctx.fillStyle='#555'; ctx.fillRect(tx+64, ty-17, 12, 4);
    // Cab window
    rect(tx+46, ty-2, 28, 20, '#9ad0f8', P.black,2);
    // Anti-glare
    ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.fillRect(tx+48, ty, 10, 10);
    // Front small wheel
    circle(tx+62, ty+46, 14, '#1a1a1a', P.black, 2);
    circle(tx+62, ty+46, 7, '#3a3a3a', null);
    // Head light
    circle(tx+76, ty+20, 5, '#f8f060', P.black, 1);
}

function drawFences(){
    // Top of soil area
    const fx=W*0.35-6, fy=H*0.22-6;
    const fw=W*0.42+12;
    ctx.fillStyle=P.fence;
    for(let x=0;x<fw;x+=20){
        ctx.fillRect(fx+x, fy, 5, 24);      // post
        ctx.fillStyle=P.fenceD; ctx.fillRect(fx+x,fy+3,20,4);  // rail
        ctx.fillStyle=P.fence;  ctx.fillRect(fx+x,fy+13,20,4); // rail 2
    }
    // Left side
    const fh=H*0.40+12;
    for(let y=24;y<fh;y+=20){
        ctx.fillRect(fx, fy+y, 5, 24);
        ctx.fillStyle=P.fenceD; ctx.fillRect(fx,fy+y+3,20,4);
        ctx.fillStyle=P.fence;  ctx.fillRect(fx,fy+y+13,20,4);
    }
}

function drawTree(x,y){
    // Trunk
    rect(x-5, y+15, 12, 28, P.treeTrunk, P.black, 1);
    // Canopy layers
    circle(x, y+10, 28, P.treeTD,  P.black, 1);
    circle(x+2, y+6, 24, P.treeT,   null);
    circle(x-6, y+4, 18, P.treeTL,  null);
    circle(x+10,y+12,14, P.treeTL,  null);
}

function drawHay(x,y){
    rect(x,y,36,26,P.hay,P.black,2);
    ctx.fillStyle=P.hayD;
    for(let i=5;i<26;i+=7) ctx.fillRect(x,y+i,36,3);
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.1)'; ctx.fillRect(x+4,y+26,36,5);
}

function drawMap(){
    drawTerrain();
    drawFences();
    // Trees
    drawTree(W*0.05, H*0.38+20);
    drawTree(W*0.24, H*0.36);
    drawTree(W*0.92, H*0.40);
    drawTree(W*0.96, H*0.36);
    drawTree(W*0.89, H*0.14);
    // Hay bales
    drawHay(W*0.20, H*0.22);
    drawHay(W*0.24, H*0.27);
    // Buildings
    drawBarn();
    drawSilo();
    drawWindmill();
    drawWaterTower();
    drawFarmhouse();
    drawTractor();
}

// ==========================================
//  PLOTS
// ==========================================
let hovered=-1;
function drawPlots(){
    G.plots.forEach((p,i)=>{
        const r=plotRect(i);
        // Wet/dry soil
        const isHov=hovered===i;
        ctx.fillStyle=p.state==='empty'?P.soil:P.soilW;
        ctx.fillRect(r.x,r.y,r.w,r.h);
        // Soil texture lines
        ctx.fillStyle=P.soilLine;
        for(let k=0;k<r.w;k+=10) ctx.fillRect(r.x+k,r.y,2,r.h);
        for(let k=0;k<r.h;k+=10) ctx.fillRect(r.x,r.y+k,r.w,2);
        // Border
        ctx.strokeStyle=isHov?'#fff':P.fenceD;
        ctx.lineWidth=isHov?3:2;
        ctx.strokeRect(r.x,r.y,r.w,r.h);
        if(isHov){
            ctx.strokeStyle='rgba(255,255,200,0.4)';
            ctx.lineWidth=1;
            ctx.strokeRect(r.x+3,r.y+3,r.w-6,r.h-6);
        }
        // Crop
        if(p.state==='growing'){
            // Progress bar background
            ctx.fillStyle='rgba(0,0,0,0.5)';
            ctx.fillRect(r.x+4,r.y+r.h-14,r.w-8,10);
            ctx.fillStyle='#38c060';
            ctx.fillRect(r.x+4,r.y+r.h-14,(r.w-8)*(p.prog/100),10);
            ctx.strokeStyle='rgba(255,255,255,0.4)';
            ctx.lineWidth=1; ctx.strokeRect(r.x+4,r.y+r.h-14,r.w-8,10);
            emoji('🌱',r.x+r.w/2,r.y+r.h/2,r.w*0.45);
        } else if(p.state==='ready'){
            const b=Math.sin(Date.now()/180)*5;
            emoji(CROPS[p.crop].icon, r.x+r.w/2, r.y+r.h/2+b, r.w*0.55);
            // Shine effect
            ctx.fillStyle='rgba(255,255,100,0.15)';
            ctx.beginPath(); ctx.arc(r.x+r.w/2,r.y+r.h/2,r.w*0.40,0,Math.PI*2); ctx.fill();
        }
    });
}

// ==========================================
//  HUD
// ==========================================
function drawHUD(){
    const hh=60;
    // Top bar bg
    ctx.fillStyle='rgba(10,6,2,0.90)';
    ctx.fillRect(0,0,W,hh);
    ctx.fillStyle=P.uiBrd; ctx.fillRect(0,hh-4,W,4); // gold line
    pixelBorder(0,0,W,hh,'rgba(255,255,255,0.12)','rgba(0,0,0,0.4)',4);

    px(`MOEDAS: ${G.coins}`, 24, 36, P.textYellow, 12);

    // Happiness bar
    const bx=W/2-120, by=16, bw=240, bh=28;
    px('HAPPY', bx-80, by+20, P.textYellow, 9);
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(bx,by,bw,bh);
    // Gradient bar
    const grad=ctx.createLinearGradient(bx,0,bx+bw,0);
    grad.addColorStop(0,'#38c060'); grad.addColorStop(0.6,'#80d040'); grad.addColorStop(1,'#f0e000');
    ctx.fillStyle=grad;
    ctx.fillRect(bx,by,bw*(G.happy/100),bh);
    ctx.strokeStyle=P.uiBrd; ctx.lineWidth=2; ctx.strokeRect(bx,by,bw,bh);
    px(`${G.happy}%`, bx+bw/2-14, by+20, P.textWhite, 8);

    // Inventory
    let ix=W-440;
    px('INV', ix-50, 36, P.textYellow, 8);
    Object.entries(G.inv).forEach(([k,v])=>{
        if(v>0){
            ctx.fillStyle='rgba(255,255,255,0.12)';
            ctx.fillRect(ix-2,8,44,44);
            emoji(CROPS[k].icon,ix+18,30,22);
            px(`${v}`,ix+4,54,P.textWhite,7);
            ix+=50;
        }
    });

    // --- SEED BUTTONS ---
    KEYS.forEach((k,i)=>{
        const r=seedBtn(i);
        const active=G.seed===k;
        const t=Date.now()/1000;
        if(active){
            const g2=ctx.createLinearGradient(r.x,r.y,r.x,r.y+r.h);
            g2.addColorStop(0,'#f8e040'); g2.addColorStop(1,'#c09010');
            ctx.fillStyle=g2;
        } else {
            ctx.fillStyle='rgba(10,6,2,0.85)';
        }
        ctx.fillRect(r.x,r.y,r.w,r.h);
        ctx.strokeStyle=active?P.white:P.uiBrd; ctx.lineWidth=active?3:2;
        ctx.strokeRect(r.x,r.y,r.w,r.h);
        pixelBorder(r.x,r.y,r.w,r.h,'rgba(255,255,255,0.2)','rgba(0,0,0,0.3)',3);
        emoji(CROPS[k].icon, r.x+26, r.y+28, 26);
        px(CROPS[k].name, r.x+42, r.y+22, active?P.black:P.textWhite, 6);
        px(`$${CROPS[k].cost}`, r.x+42, r.y+42, active?'#555':P.textYellow, 7);
    });

    // --- VILA PANEL ---
    const px2=W-240, py2=62, pw2=235, ph2=H-62-90;
    ctx.fillStyle='rgba(8,4,2,0.90)';
    ctx.fillRect(px2,py2,pw2,ph2);
    ctx.strokeStyle=P.uiBrd; ctx.lineWidth=3; ctx.strokeRect(px2,py2,pw2,ph2);
    pixelBorder(px2,py2,pw2,ph2,'rgba(255,210,30,0.15)','rgba(0,0,0,0.4)',4);

    // Title
    ctx.fillStyle='rgba(255,200,30,0.15)'; ctx.fillRect(px2,py2,pw2,28);
    px('VILA', px2+70, py2+20, P.textYellow, 11);

    G.reqs.forEach((req,i)=>{
        const r=reqCard(i);
        if(r.y+r.h>H-100) return;
        const has=G.inv[req.crop]>=req.n;
        // Card bg
        ctx.fillStyle=has?'rgba(30,80,40,0.9)':'rgba(40,20,10,0.9)';
        ctx.fillRect(r.x,r.y,r.w,r.h);
        ctx.strokeStyle=has?P.uiGreen:'#886030';
        ctx.lineWidth=2; ctx.strokeRect(r.x,r.y,r.w,r.h);
        pixelBorder(r.x,r.y,r.w,r.h,'rgba(255,255,255,0.1)','rgba(0,0,0,0.3)',3);
        // Content
        emoji(CROPS[req.crop].icon, r.x+20, r.y+28, 26);
        px(`${req.n}x ${CROPS[req.crop].name}`, r.x+36, r.y+22, P.textWhite, 6);
        ctx.fillStyle='#80e0a0'; ctx.font='8px Press Start 2P,monospace';
        ctx.fillText(`+$${req.coins}`, r.x+36, r.y+42);
        // Distribute button
        const by2=r.y+r.h-32, bh2=24;
        const bg=ctx.createLinearGradient(r.x+6,by2,r.x+6,by2+bh2);
        if(has){ bg.addColorStop(0,'#48d070'); bg.addColorStop(1,'#28904a'); }
        else    { bg.addColorStop(0,'#605040'); bg.addColorStop(1,'#483828'); }
        ctx.fillStyle=bg; ctx.fillRect(r.x+6,by2,r.w-12,bh2);
        ctx.strokeStyle=has?'#80f0a0':'#807060'; ctx.lineWidth=1;
        ctx.strokeRect(r.x+6,by2,r.w-12,bh2);
        pixelBorder(r.x+6,by2,r.w-12,bh2,'rgba(255,255,255,0.2)','rgba(0,0,0,0.2)',2);
        px(has?'DISTRIBUIR':'FALTANDO', r.x+16, by2+16, P.textWhite, 6);
    });

    // --- NOTIFICATION ---
    if(G.notif && G.ntimer>0){
        const alpha=Math.min(1,G.ntimer/30);
        ctx.globalAlpha=alpha;
        const nw=320,nh=56,nx=W/2-nw/2,ny=H*0.42;
        ctx.fillStyle=G.notif.c; ctx.fillRect(nx,ny,nw,nh);
        ctx.strokeStyle='#fff'; ctx.lineWidth=4; ctx.strokeRect(nx,ny,nw,nh);
        pixelBorder(nx,ny,nw,nh,'rgba(255,255,255,0.35)','rgba(0,0,0,0.3)',4);
        px(G.notif.m, nx+18, ny+34, '#fff', 9);
        ctx.globalAlpha=1;
        G.ntimer--;
    }
}

// ==========================================
//  INPUT
// ==========================================
canvas.addEventListener('mousemove',e=>{
    const mx=e.clientX, my=e.clientY;
    hovered=-1;
    G.plots.forEach((_,i)=>{
        const r=plotRect(i);
        if(mx>=r.x&&mx<=r.x+r.w&&my>=r.y&&my<=r.y+r.h) hovered=i;
    });
    canvas.style.cursor=hovered>=0?'pointer':'default';
});

canvas.addEventListener('click',e=>{
    const mx=e.clientX, my=e.clientY;
    // Plots
    G.plots.forEach((p,i)=>{
        const r=plotRect(i);
        if(mx<r.x||mx>r.x+r.w||my<r.y||my>r.y+r.h) return;
        if(p.state==='empty'){
            const c=CROPS[G.seed];
            if(G.coins>=c.cost){
                G.coins-=c.cost; p.state='growing'; p.crop=G.seed; p.t0=Date.now();
                notif(`Plantado: ${c.name}`);
            } else notif('Sem moedas!', P.uiRed);
        } else if(p.state==='ready'){
            G.inv[p.crop]++; notif(`Colhido! ${CROPS[p.crop].icon}`);
            p.state='empty'; p.crop=null;
        }
    });
    // Seed buttons
    KEYS.forEach((k,i)=>{ const r=seedBtn(i); if(mx>=r.x&&mx<=r.x+r.w&&my>=r.y&&my<=r.y+r.h) G.seed=k; });
    // Distribute buttons
    G.reqs.forEach(req=>{
        const r=reqCard(G.reqs.indexOf(req));
        const by2=r.y+r.h-32;
        if(mx>=r.x+6&&mx<=r.x+r.w-6&&my>=by2&&my<=by2+24){
            if(G.inv[req.crop]>=req.n){
                G.inv[req.crop]-=req.n; G.coins+=req.coins;
                G.happy=Math.min(100,G.happy+req.happy);
                G.reqs=G.reqs.filter(r=>r.id!==req.id);
                notif('Vila agradecida! ❤️');
            }
        }
    });
});

// ==========================================
//  MAIN LOOP
// ==========================================
function loop(){
    G.plots.forEach(p=>{
        if(p.state==='growing'){
            p.prog=Math.min(100,(Date.now()-p.t0)/CROPS[p.crop].grow*100);
            if(p.prog>=100) p.state='ready';
        }
    });
    ctx.clearRect(0,0,W,H);
    drawMap();
    drawPlots();
    drawHUD();
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
