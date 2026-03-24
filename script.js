/* Global Game Jam - AgriCorp (Versão Limpa - Fullscreen & Mouse) */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

const mapImage = new Image();
mapImage.src = 'sprites/world_map.png'; // Verifique se o nome está exato
let mapLoaded = false;
mapImage.onload = () => { mapLoaded = true; };

window.addEventListener('resize', resizeCanvas);

// Posição do Mouse para interações
const mouse = { x: 0, y: 0, clicked: false };

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('mousedown', () => { mouse.clicked = true; });
window.addEventListener('mouseup', () => { mouse.clicked = false; });

function draw() {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. DESENHA O MAPA EM TELA CHEIA (Fullscreen)
    if (mapLoaded) {
        ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#68a838'; // Cor de fundo se o mapa falhar
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. EFEITO DE CLIQUE DO MOUSE
    if (mouse.clicked) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 15, 0, Math.PI * 2);
        ctx.stroke();
    }

    requestAnimationFrame(draw);
}

resizeCanvas();
draw();
