/**
 * AgriCorp - Game Opening Sequence
 * 
 * Este script controla o tempo e as transições de opacidade
 * para uma abertura cinemática baseada na imagem enviada.
 */

document.addEventListener('DOMContentLoaded', () => {
    const productionIntro = document.getElementById('production-intro');
    const gameTitleContainer = document.getElementById('game-title');
    const mainMenuContainer = document.getElementById('main-menu');
    const introElements = document.querySelectorAll('.intro-text');
    const agriCorpTitle = document.querySelector('.game-logo');

    // Botões do Menu
    const startBtn = document.getElementById('start-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const exitBtn = document.getElementById('exit-btn');

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
                
                // 3. Transição para o Menu Principal após o logo
                setTimeout(() => {
                    // Subir o logo levemente para dar espaço ao menu
                    agriCorpTitle.style.transition = 'transform 2s cubic-bezier(0.4, 0, 0.2, 1), opacity 2s';
                    agriCorpTitle.style.transform = 'translateY(-120px) scale(0.6)';
                    
                    // Mostrar menu
                    setTimeout(() => {
                        mainMenuContainer.classList.remove('hidden');
                        void mainMenuContainer.offsetWidth;
                        mainMenuContainer.classList.add('visible');
                    }, 1000);
                }, 5000); // Espera 5s após o logo começar a aparecer
            }, 500);
        }, 1500);
    }, 6000);

    // Eventos simples para os botões do menu
    startBtn.addEventListener('click', () => {
        alert('Iniciando o jogo AgriCorp...');
    });

    settingsBtn.addEventListener('click', () => {
        alert('Abrindo configurações...');
    });

    exitBtn.addEventListener('click', () => {
        if(confirm('Deseja realmente sair?')) {
            window.close(); // Tenta fechar a aba
        }
    });
});
