// ============================================================
//   AgriCorp – Mapa estilo Stardew Valley (referência exata)
//   Sem sistema de plantação ainda — apenas o mapa visual
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
    grassA:'#68a838', grassB:'#58a030', grassC:'#489028', grassD:'#388020',
    grassL:'#78b848',
    dirtA:'#c8a868', dirtB:'#b89858', dirtC:'#a88848', dirtD:'#907838',
    dirtL:'#d8b878',
    barn:'#c83028', barnD:'#a82018', barnL:'#d84838',
    roofA:'#586878', roofB:'#485868', roofC:'#384858', roofD:'#283848',
    wood:'#886030', woodD:'#684020', woodL:'#a87848',
    silo:'#a0a8a8', siloD:'#808888', siloL:'#c0c8c8', siloTop:'#687078',
    wheat:'#d8b840', wheatD:'#b89828', wheatL:'#e8c848',
    vegA:'#48a030', vegB:'#389020', vegC:'#58b840', vegD:'#288018',
    water:'#4080b8', waterL:'#60a0d0',
    fence:'#987050', fenceD:'#785838',
    hay:'#c8a028', hayD:'#a88018',
    truck:'#3870a8', truckD:'#285890', truckW:'#90c0e0',
    pine:'#286828', pineD:'#185018', pineL:'#388838',
    stone:'#808888', stoneD:'#606868',
    bk:'#000', wh:'#fff',
};

// ========================= HELPERS =========================
const box=(x,y,w,h,f,s,lw=1)=>{ctx.fillStyle=f;ctx.fillRect(x,y,w,h);if(s){ctx.strokeStyle=s;ctx.lineWidth=lw;ctx.strokeRect(x,y,w,h);}};
const circ=(cx,cy,r,f,s,lw=1)=>{ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=f;ctx.fill();if(s){ctx.strokeStyle=s;ctx.lineWidth=lw;ctx.stroke();}};
const tri=(pts,f,s,lw=1)=>{ctx.beginPath();ctx.moveTo(...pts[0]);pts.slice(1).forEach(p=>ctx.lineTo(...p));ctx.closePath();ctx.fillStyle=f;ctx.fill();if(s){ctx.strokeStyle=s;ctx.lineWidth=lw;ctx.stroke();}};

// ========================= GRAMA =========================
function drawGrass(){
    for(let x=0;x<W;x+=16){
        for(let y=0;y<H;y+=16){
            ctx.fillStyle=((x/16+y/16)%2===0)?P.grassA:P.grassB;
            ctx.fillRect(x,y,16,16);
        }
    }
    // Folhinhas de grama
    ctx.fillStyle=P.grassL;
    for(let x=6;x<W;x+=28){
        for(let y=8;y<H;y+=28){
            const s=(x*7+y*11)%100;
            if(s<40){ctx.fillRect(x,y,2,5);ctx.fillRect(x+5,y+2,2,4);}
        }
    }
}

// ========================= CAMINHOS DE TERRA =========================
function drawPaths(){
    // Caminho horizontal principal (centro-baixo)
    const py=H*0.62, ph=H*0.12;
    ctx.fillStyle=P.dirtB;
    ctx.fillRect(0, py, W, ph);
    // Textura
    for(let x=0;x<W;x+=10){
        for(let y=py;y<py+ph;y+=10){
            const v=(x*3+y*7)%100;
            if(v<20){ctx.fillStyle=P.dirtL;ctx.fillRect(x,y,10,10);}
            else if(v>80){ctx.fillStyle=P.dirtC;ctx.fillRect(x,y,10,10);}
        }
    }
    // Bordas
    ctx.fillStyle=P.dirtD;
    ctx.fillRect(0,py,W,3);ctx.fillRect(0,py+ph-3,W,3);

    // Caminho vertical (vai pro celeiro)
    const vx=W*0.46, vw=W*0.08;
    ctx.fillStyle=P.dirtB;
    ctx.fillRect(vx, H*0.10, vw, py-H*0.10+ph);
    for(let x=vx;x<vx+vw;x+=10){
        for(let y=H*0.10;y<py+ph;y+=10){
            const v=(x*5+y*9)%100;
            if(v<20){ctx.fillStyle=P.dirtL;ctx.fillRect(x,y,10,10);}
            else if(v>80){ctx.fillStyle=P.dirtC;ctx.fillRect(x,y,10,10);}
        }
    }
    ctx.fillStyle=P.dirtD;
    ctx.fillRect(vx,H*0.10,3,py-H*0.10+ph);ctx.fillRect(vx+vw-3,H*0.10,3,py-H*0.10+ph);

    // Caminho inferior (acesso ao campo de trigo e horta)
    ctx.fillStyle=P.dirtB;
    ctx.fillRect(W*0.10, py, W*0.36, ph);
    ctx.fillRect(W*0.54, py, W*0.30, ph);
}

// ========================= CAMPO DE TRIGO (ESQUERDA) =========================
function drawWheatField(){
    const fx=W*0.04, fy=H*0.15, fw=W*0.32, fh=H*0.42;

    // Solo base
    box(fx,fy,fw,fh,P.dirtC);

    // Fileiras de trigo
    const rowH=12;
    for(let row=0;row<fh;row+=rowH){
        // Terra entre fileiras
        ctx.fillStyle=(Math.floor(row/rowH)%2===0)?'#8a6830':'#7a5828';
        ctx.fillRect(fx,fy+row,fw,rowH);

        // Hastes de trigo
        for(let x=fx+3;x<fx+fw-2;x+=6){
            const h=rowH*0.85;
            // Haste
            ctx.fillStyle='#90a038';
            ctx.fillRect(x,fy+row+rowH-h,2,h);
            // Espiga (topo amarelo)
            ctx.fillStyle=P.wheat;
            ctx.fillRect(x-1,fy+row+rowH-h-2,4,4);
            ctx.fillStyle=P.wheatL;
            ctx.fillRect(x,fy+row+rowH-h-2,2,2);
        }
    }

    // Borda do campo
    ctx.strokeStyle=P.dirtD;ctx.lineWidth=2;ctx.strokeRect(fx,fy,fw,fh);
}

// ========================= HORTA (DIREITA DO CELEIRO) =========================
function drawVegetableGarden(){
    const gx=W*0.62, gy=H*0.18, gw=W*0.22, gh=H*0.38;

    // Solo
    box(gx,gy,gw,gh,'#6a4a28');

    // Grid de canteiros
    const cellW=gw/5, cellH=gh/6;
    for(let col=0;col<5;col++){
        for(let row=0;row<6;row++){
            const cx=gx+col*cellW, cy=gy+row*cellH;
            // Solo do canteiro
            ctx.fillStyle=(row+col)%2===0?'#7a5a30':'#6a4a28';
            ctx.fillRect(cx+1,cy+1,cellW-2,cellH-2);

            // Plantinha
            const type=(col*3+row*7)%4;
            const px=cx+cellW/2, py2=cy+cellH/2;
            if(type===0){
                // Cenoura (folha verde + raiz)
                ctx.fillStyle=P.vegA;
                ctx.fillRect(px-2,py2-4,4,4);ctx.fillRect(px-4,py2-6,2,3);ctx.fillRect(px+2,py2-6,2,3);
                ctx.fillStyle='#e07020';
                ctx.fillRect(px-1,py2,2,5);
            } else if(type===1){
                // Tomate
                ctx.fillStyle=P.vegC;
                ctx.fillRect(px-3,py2-3,6,3);
                circ(px,py2+2,4,'#d03020');
            } else if(type===2){
                // Alface
                circ(px,py2,5,P.vegA);
                circ(px,py2-1,3,P.vegC);
            } else {
                // Milho
                ctx.fillStyle=P.vegA;
                ctx.fillRect(px-1,py2-6,2,10);
                ctx.fillStyle='#e0c040';
                ctx.fillRect(px-2,py2-2,4,5);
            }
        }
    }

    // Cerca ao redor da horta
    drawFenceH(gx-4,gy-6,gw+8);
    drawFenceH(gx-4,gy+gh,gw+8);
    drawFenceV(gx-6,gy-6,gh+12);
    drawFenceV(gx+gw+2,gy-6,gh+12);

    ctx.strokeStyle='rgba(0,0,0,0.2)';ctx.lineWidth=1;ctx.strokeRect(gx,gy,gw,gh);
}

// ========================= CERCAS =========================
function drawFenceH(x,y,w){
    for(let i=0;i<w;i+=14){
        ctx.fillStyle=P.fence;
        ctx.fillRect(x+i,y,4,14);
    }
    ctx.fillStyle=P.fenceD;
    ctx.fillRect(x,y+3,w,3);
    ctx.fillRect(x,y+9,w,3);
}
function drawFenceV(x,y,h){
    for(let i=0;i<h;i+=14){
        ctx.fillStyle=P.fence;
        ctx.fillRect(x,y+i,14,4);
    }
    ctx.fillStyle=P.fenceD;
    ctx.fillRect(x+3,y,3,h);
    ctx.fillRect(x+9,y,3,h);
}

// ========================= CELEIRO VERMELHO =========================
function drawBarn(){
    const bx=W*0.40, by=H*0.14;
    const bw=W*0.18, bh=H*0.40;

    // Sombra
    ctx.fillStyle='rgba(0,0,0,0.15)';ctx.fillRect(bx+8,by+8,bw,bh);

    // Paredes
    box(bx,by,bw,bh,P.barn,P.bk,2);
    // Tábuas horizontais
    ctx.fillStyle=P.barnD;
    for(let i=8;i<bh;i+=12) ctx.fillRect(bx+2,by+i,bw-4,7);
    ctx.fillStyle=P.barnL;
    for(let i=8;i<bh;i+=12) ctx.fillRect(bx+2,by+i,bw-4,2);

    // Teto (cinza-azulado, estilo gambrel/mansard)
    const roofH=bh*0.50;
    const rx=bx-12, rw=bw+24;
    // Parte inferior do teto (inclinação suave)
    tri([[rx,by],[bx+bw/2,by-roofH],[rx+rw,by]], P.roofB, P.bk, 2);
    // Linhas de telha
    ctx.fillStyle=P.roofA;
    for(let i=0;i<roofH;i+=8){
        const ratio=i/roofH;
        const lx=rx+(bw/2+12)*ratio;
        const rxx=rx+rw-(bw/2+12)*ratio;
        ctx.fillRect(lx,by-i,rxx-lx,4);
    }
    // Ridge
    ctx.fillStyle=P.roofD;ctx.fillRect(bx+bw/2-3,by-roofH,6,roofH);

    // Fachada triangular (frontão vermelho visível sob o teto)
    tri([[bx+4,by],[bx+bw/2,by-roofH+10],[bx+bw-4,by]], P.barnD);

    // X decorativo no frontão
    ctx.strokeStyle='#e8e0d0';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(bx+bw*0.30,by-roofH*0.15);ctx.lineTo(bx+bw*0.70,by-roofH*0.55);ctx.stroke();
    ctx.beginPath();ctx.moveTo(bx+bw*0.70,by-roofH*0.15);ctx.lineTo(bx+bw*0.30,by-roofH*0.55);ctx.stroke();

    // Janela do sótão
    box(bx+bw/2-10, by-roofH*0.42, 20, 16, P.woodD, P.bk, 1);
    box(bx+bw/2-8, by-roofH*0.42+2, 16, 12, '#a0c8e0', null);
    ctx.fillStyle=P.woodD;ctx.fillRect(bx+bw/2-1,by-roofH*0.42+2,2,12);

    // Portas grandes
    const dw=bw*0.30, dh=bh*0.45;
    const dx=bx+bw/2-dw/2, dy=by+bh-dh;
    box(dx,dy,dw/2-2,dh,P.woodD,P.bk,2);
    box(dx+dw/2+2,dy,dw/2-2,dh,P.woodD,P.bk,2);
    box(dx+2,dy+2,dw/2-6,dh-4,P.wood,null);
    box(dx+dw/2+4,dy+2,dw/2-6,dh-4,P.wood,null);
    // Maçanetas
    circ(dx+dw/2-6,dy+dh/2,3,'#c0a040',P.bk,1);
    circ(dx+dw/2+6,dy+dh/2,3,'#c0a040',P.bk,1);

    // Janela lateral esquerda
    box(bx+8,by+bh*0.25,22,18,P.woodD,P.bk,1);
    box(bx+10,by+bh*0.25+2,18,14,'#a0c8e0',null);
    ctx.fillStyle=P.woodD;ctx.fillRect(bx+18,by+bh*0.25+2,2,14);ctx.fillRect(bx+10,by+bh*0.25+8,18,2);

    // Janela lateral direita
    box(bx+bw-30,by+bh*0.25,22,18,P.woodD,P.bk,1);
    box(bx+bw-28,by+bh*0.25+2,18,14,'#a0c8e0',null);
    ctx.fillStyle=P.woodD;ctx.fillRect(bx+bw-20,by+bh*0.25+2,2,14);ctx.fillRect(bx+bw-28,by+bh*0.25+8,18,2);
}

// ========================= SILO =========================
function drawSilo(){
    const sx=W*0.36, sy=H*0.08;
    const sw=36, sh=H*0.50;

    // Sombra
    ctx.fillStyle='rgba(0,0,0,0.12)';ctx.fillRect(sx+6,sy+6,sw,sh);

    // Corpo cilíndrico
    box(sx,sy,sw,sh,P.silo,P.bk,2);
    // Linhas verticais
    ctx.fillStyle=P.siloD;
    for(let x=sx+8;x<sx+sw-4;x+=8) ctx.fillRect(x,sy,2,sh);
    // Bandas horizontais
    ctx.fillStyle=P.siloD;
    ctx.fillRect(sx,sy+sh*0.20,sw,4);
    ctx.fillRect(sx,sy+sh*0.50,sw,4);
    ctx.fillRect(sx,sy+sh*0.80,sw,4);
    // Highlight
    ctx.fillStyle=P.siloL;
    ctx.fillRect(sx+4,sy,8,sh);

    // Dome top
    ctx.fillStyle=P.siloTop;
    ctx.beginPath();ctx.ellipse(sx+sw/2,sy,sw/2,sw*0.4,0,Math.PI,0,true);ctx.fill();
    ctx.strokeStyle=P.bk;ctx.lineWidth=2;ctx.stroke();

    // Cone roof
    tri([[sx-4,sy],[sx+sw/2,sy-sw*0.7],[sx+sw+4,sy]], P.siloTop, P.bk, 2);
    // Vent
    circ(sx+sw/2,sy-sw*0.7,4,P.siloD,P.bk,1);
}

// ========================= FARDOS DE FENO =========================
function drawHayBale(x,y,w=30,h=22){
    box(x,y,w,h,P.hay,P.bk,1);
    ctx.fillStyle=P.hayD;
    for(let i=4;i<h;i+=6) ctx.fillRect(x,y+i,w,3);
    // Sombra embaixo
    ctx.fillStyle='rgba(0,0,0,0.1)';ctx.fillRect(x+2,y+h,w,4);
}

// ========================= CAMINHONETE AZUL =========================
function drawTruck(){
    const tx=W*0.47, ty=H*0.63;
    const tw=60, th=32;

    // Roda traseira
    circ(tx+14,ty+th+4,10,P.bk);circ(tx+14,ty+th+4,5,'#404040');
    // Roda dianteira
    circ(tx+tw-12,ty+th+4,8,P.bk);circ(tx+tw-12,ty+th+4,4,'#404040');

    // Caçamba
    box(tx,ty+8,tw*0.5,th-4,P.truckD,P.bk,1);
    box(tx+2,ty+10,tw*0.5-4,th-8,'#2a4878',null);

    // Cabine
    box(tx+tw*0.48,ty,tw*0.52,th+2,P.truck,P.bk,1);
    // Janela
    box(tx+tw*0.52,ty+4,tw*0.44,th*0.55,P.truckW,P.bk,1);
    ctx.fillStyle='rgba(255,255,255,0.2)';ctx.fillRect(tx+tw*0.54,ty+6,tw*0.20,th*0.45);
    // Farol
    circ(tx+tw+2,ty+th-6,4,'#f8e840',P.bk,1);
    // Para-choque
    box(tx+tw-4,ty+th,8,6,'#888',P.bk,1);
}

// ========================= PINHEIRO =========================
function drawPine(x,y,s=1){
    // Tronco
    ctx.fillStyle='#5a3820';
    ctx.fillRect(x-3*s,y+20*s,6*s,14*s);

    // 3 camadas de copa (triângulos empilhados)
    tri([[x-18*s,y+24*s],[x,y+2*s],[x+18*s,y+24*s]], P.pineD,P.bk,1);
    tri([[x-15*s,y+16*s],[x,y-6*s],[x+15*s,y+16*s]], P.pine,P.bk,1);
    tri([[x-12*s,y+8*s],[x,y-14*s],[x+12*s,y+8*s]], P.pineL,P.bk,1);
}

// ========================= ÁRVORE FOLHOSA =========================
function drawTree(x,y,s=1){
    ctx.fillStyle='#5a3820';
    ctx.fillRect(x-3*s,y+14*s,7*s,18*s);
    circ(x,y+10*s,16*s,P.grassD,P.bk,1);
    circ(x+2*s,y+6*s,14*s,P.grassA);
    circ(x-5*s,y+4*s,10*s,P.grassL);
    circ(x+8*s,y+8*s,9*s,P.grassL);
}

// ========================= BARRIL / TORRE DE ÁGUA =========================
function drawWaterBarrel(x,y){
    // Pernas
    ctx.fillStyle=P.woodD;
    ctx.fillRect(x+4,y+32,5,24);ctx.fillRect(x+35,y+32,5,24);
    // Corpo
    box(x,y,44,32,P.wood,P.bk,2);
    box(x+3,y+4,38,16,P.water,null);
    ctx.fillStyle=P.waterL;ctx.fillRect(x+3,y+4,38,5);
    // Bandas
    ctx.fillStyle=P.woodD;
    ctx.fillRect(x,y+12,44,3);ctx.fillRect(x,y+24,44,3);
    // Teto
    tri([[x-3,y],[x+22,y-12],[x+47,y]],P.woodD,P.bk,1);
}

// ========================= MAPA COMPLETO =========================
function drawMap(){
    drawGrass();
    drawPaths();

    // Campo de trigo (esquerda)
    drawWheatField();

    // Horta (direita do celeiro)
    drawVegetableGarden();

    // Fardos de feno (perto do silo)
    drawHayBale(W*0.32, H*0.48);
    drawHayBale(W*0.34, H*0.52, 26, 20);
    drawHayBale(W*0.30, H*0.52, 24, 18);

    // Celeiro
    drawBarn();

    // Silo
    drawSilo();

    // Caminhonete
    drawTruck();

    // Torre de água (direita)
    drawWaterBarrel(W*0.86, H*0.38);

    // Pinheiros (borda direita)
    drawPine(W*0.90, H*0.08, 1.1);
    drawPine(W*0.94, H*0.14, 0.9);
    drawPine(W*0.92, H*0.22, 1.0);
    drawPine(W*0.96, H*0.06, 0.8);
    drawPine(W*0.88, H*0.30, 0.9);

    // Árvores folhosas (topo e cantos)
    drawTree(W*0.04, H*0.05, 1.0);
    drawTree(W*0.10, H*0.03, 0.9);
    drawTree(W*0.16, H*0.06, 0.8);
    drawTree(W*0.04, H*0.60, 0.9);
    drawTree(W*0.08, H*0.64, 0.8);
    drawTree(W*0.86, H*0.60, 0.9);

    // Cerca ao redor do campo de trigo
    drawFenceH(W*0.04-4, H*0.14, W*0.32+8);
    drawFenceH(W*0.04-4, H*0.57, W*0.32+8);
    drawFenceV(W*0.04-6, H*0.14, H*0.43);
    drawFenceV(W*0.36+2, H*0.14, H*0.43);
}

// ========================= LOOP =========================
function loop(){
    ctx.clearRect(0,0,W,H);
    drawMap();
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
