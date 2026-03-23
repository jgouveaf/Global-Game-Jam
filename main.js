/**
 * AgriCorp - Game Opening Sequence & Menu
 * Tiempos refinados para uma experiência mais fluida.
 */

document.addEventListener('DOMContentLoaded', () => {
    const productionIntro = document.getElementById('production-intro');
    const gameTitleContainer = document.getElementById('game-title');
    const mainMenuContainer = document.getElementById('main-menu');
    const introElements = document.querySelectorAll('.intro-text');
    const agriCorpTitle = document.querySelector('.game-logo');

    // Botões
    const startBtn = document.getElementById('start-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const exitBtn = document.getElementById('exit-btn');

    // 1. Mostrar Produtora
    setTimeout(() => {
        productionIntro.classList.add('visible');
        introElements.forEach((el, index) => {
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 600);
        });
    }, 500);

    // 2. Transição para Logo AgriCorp
    setTimeout(() => {
        productionIntro.style.opacity = '0';
        
        setTimeout(() => {
            productionIntro.classList.add('hidden');
            gameTitleContainer.classList.remove('hidden');
            void gameTitleContainer.offsetWidth; // Reflow
            gameTitleContainer.classList.add('visible');
            
            setTimeout(() => {
                agriCorpTitle.style.animation = 'fadeInAgri 2s forwards ease-in-out';
                
                // 3. Transição para o Menu (Corrigido para remover a animação que travava o transform)
                setTimeout(() => {
                    // Remover a animação para permitir que o 'transform' manual funcione
                    agriCorpTitle.style.animation = 'none';
                    agriCorpTitle.style.opacity = '1';
                    
                    // Logo sobe
                    agriCorpTitle.style.transition = 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 1.2s';
                    agriCorpTitle.style.transform = 'translateY(-120px) scale(0.5)';
                    
                    // Menu aparece
                    setTimeout(() => {
                        mainMenuContainer.classList.remove('hidden');
                        void mainMenuContainer.offsetWidth;
                        mainMenuContainer.classList.add('visible');
                    }, 500);
                }, 4000); 
            }, 500);
        }, 1000);
    }, 4500); // Intro dura menos tempo (4.5s)

    // Eventos
    startBtn.addEventListener('click', () => alert('Iniciando...'));
    settingsBtn.addEventListener('click', () => alert('Configurações...'));
    exitBtn.addEventListener('click', () => confirm('Sair?') && window.close());
});
