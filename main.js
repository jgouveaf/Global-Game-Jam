/**
 * AgriCorp - Game Opening Sequence
 * 
 * Este script controla o tempo e as transições de opacidade
 * para uma abertura cinemática baseada na imagem enviada.
 */

document.addEventListener('DOMContentLoaded', () => {
    const productionIntro = document.getElementById('production-intro');
    const gameTitleContainer = document.getElementById('game-title');
    const introElements = document.querySelectorAll('.intro-text');
    const agriCorpTitle = document.querySelector('.game-logo');

    // 1. Mostrar a Produção (A GODFRAME PRODUCTION)
    setTimeout(() => {
        productionIntro.classList.add('visible');
        
        // Fazer aparecer um por um: A -> GODFRAME -> PRODUCTION
        introElements.forEach((el, index) => {
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 800);
        });
    }, 1000);

    // 2. Transição para o nome do jogo (AgriCorp)
    setTimeout(() => {
        // Desvanecer a intro
        productionIntro.style.opacity = '0';
        
        setTimeout(() => {
            productionIntro.classList.add('hidden');
            gameTitleContainer.classList.remove('hidden');
            
            // Forçar reflow
            void gameTitleContainer.offsetWidth;
            gameTitleContainer.classList.add('visible');
            
            // Mostrar AgriCorp com estilo
            setTimeout(() => {
                agriCorpTitle.style.animation = 'fadeInAgri 3.5s forwards ease-in-out';
            }, 500);
        }, 1500);
    }, 6000);
});
