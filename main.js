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

// ========================= PLAYER & INPUT (from script.js) =========================
const player = {
    x: 512,
    y: 512,
    width: 32,
    height: 48,
    speed: 5,
    dir: 'down'
};
const keys = {};
window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

const playerImage = new Image();
playerImage.src = 'player_sprite.png'; // No root
let playerLoaded = false;
playerImage.onload = () => { playerLoaded = true; };


const camera = { x: 0, y: 0 };
let WW = 2000; // World Width (will update when image loads)
let WH = 2000; // World Height

const mapImage = new Image();
mapImage.src = 'sprites/Gemini_Generated_Image_h3gzs5h3gzs5h3gz.png';
let mapLoaded = false;
mapImage.onload = () => { 
    mapLoaded = true;
    WW = mapImage.width;
    WH = mapImage.height;
};



function applyPhysics() {
    let vx = 0; let vy = 0;
    if (keys['a'] || keys['arrowleft']) { vx = -player.speed; player.dir = 'left'; }
    if (keys['d'] || keys['arrowright']) { vx = player.speed; player.dir = 'right'; }
    if (keys['w'] || keys['arrowup']) { vy = -player.speed; player.dir = 'up'; }
    if (keys['s'] || keys['arrowdown']) { vy = player.speed; player.dir = 'down'; }
    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
    
    // Bounds check
    const newX = player.x + vx;
    const newY = player.y + vy;
    if (newX >= 0 && newX <= WW - player.width) player.x = newX;
    if (newY >= 0 && newY <= WH - player.height) player.y = newY;

    // Follow camera
    camera.x = player.x + player.width/2 - W/2;
    camera.y = player.y + player.height/2 - H/2;
}



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

// ========================= MAPA COMPLETO =========================
function drawMap(){
    if(mapLoaded){
        ctx.drawImage(mapImage, 0, 0);
    } else {
        // Placeholder se a imagem demorar
        ctx.fillStyle = '#68a838';
        ctx.fillRect(0,0, WW, WH);
    }
}



// ========================= PLAYER RENDER =========================
function drawPlayer(){
    const px = Math.floor(player.x);
    const py = Math.floor(player.y);
    
    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 44, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Player
    if(playerLoaded){
        ctx.drawImage(playerImage, px, py, player.width, player.height);
    } else {
        ctx.fillStyle = '#800020';
        ctx.fillRect(px + 4, py + 16, 24, 24);
    }
}

// ========================= LOOP =========================
function loop(){
    applyPhysics();
    ctx.clearRect(0,0,W,H);
    
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    drawMap();
    drawPlayer();
    ctx.restore();

    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
