/** 
 * Community Farmer - Game Engine 
 * Handles state, farming loop, and community distribution
 */

class FarmGame {
    constructor() {
        this.coins = 50;
        this.happiness = 0;
        this.inventory = {
            wheat: 0,
            carrot: 0,
            tomato: 0,
            corn: 0
        };
        
        this.crops = {
            wheat: { name: 'Trigo', icon: '🌾', growthTime: 5000, price: 5, reward: 10 },
            carrot: { name: 'Cenoura', icon: '🥕', growthTime: 10000, price: 10, reward: 25 },
            tomato: { name: 'Tomate', icon: '🍅', growthTime: 20000, price: 20, reward: 55 },
            corn: { name: 'Milho', icon: '🌽', growthTime: 40000, price: 50, reward: 150 }
        };

        this.selectedSeed = 'wheat';
        this.plots = Array(9).fill(null).map((_, i) => ({
            id: i,
            state: 'empty', // empty, growing, ready
            cropType: null,
            progress: 0,
            startTime: 0
        }));

        this.communityRequests = [];
        this.maxRequests = 5;

        // Elements
        this.coinsEl = document.getElementById('coins');
        this.happinessBar = document.getElementById('happiness-bar');
        this.happinessText = document.getElementById('happiness-text');
        this.inventoryList = document.getElementById('inventory-list');
        this.farmGrid = document.getElementById('farm-grid');
        this.requestsList = document.getElementById('requests-list');
        this.seedShop = document.getElementById('seed-shop');

        this.init();
    }

    init() {
        this.renderFarm();
        this.renderSeedShop();
        this.renderInventory();
        this.generateRequest();
        
        // Loop de atualização
        setInterval(() => this.updatePlots(), 100);
        setInterval(() => {
            if (this.communityRequests.length < this.maxRequests) {
                this.generateRequest();
            }
        }, 8000);

        this.updateStats();
    }

    renderSeedShop() {
        this.seedShop.innerHTML = '';
        Object.entries(this.crops).forEach(([id, crop]) => {
            const btn = document.createElement('button');
            btn.className = `seed-btn ${this.selectedSeed === id ? 'active' : ''}`;
            btn.innerHTML = `<span class="seed-icon">${crop.icon}</span> ${crop.name} ($${crop.price})`;
            btn.onclick = () => {
                this.selectedSeed = id;
                this.renderSeedShop();
            };
            this.seedShop.appendChild(btn);
        });
    }

    renderFarm() {
        this.farmGrid.innerHTML = '';
        this.plots.forEach(plot => {
            const el = document.createElement('div');
            el.className = `plot ${plot.state}`;
            el.id = `plot-${plot.id}`;
            el.onclick = () => this.handlePlotClick(plot);
            
            if (plot.state !== 'empty') {
                const crop = this.crops[plot.cropType];
                el.innerHTML = `
                    <div class="crop-visual ${plot.state === 'ready' ? 'harvest-ready' : ''}">
                        ${plot.state === 'ready' ? crop.icon : '🌱'}
                    </div>
                    ${plot.state === 'growing' ? `
                    <div class="growth-timer">
                        <div class="growth-progress" id="progress-${plot.id}" style="width: ${plot.progress}%"></div>
                    </div>` : ''}
                `;
            }
            
            this.farmGrid.appendChild(el);
        });
    }

    handlePlotClick(plot) {
        if (plot.state === 'empty') {
            const crop = this.crops[this.selectedSeed];
            if (this.coins >= crop.price) {
                this.coins -= crop.price;
                plot.state = 'growing';
                plot.cropType = this.selectedSeed;
                plot.startTime = Date.now();
                plot.progress = 0;
                this.updateStats();
                this.renderFarm();
                this.showNotification(`Plantado ${crop.name}!`);
            } else {
                this.showNotification('Moedas insuficientes!', 'error');
            }
        } else if (plot.state === 'ready') {
            this.inventory[plot.cropType]++;
            this.showNotification(`Colhido ${this.crops[plot.cropType].icon}!`);
            plot.state = 'empty';
            plot.cropType = null;
            plot.progress = 0;
            this.renderInventory();
            this.renderFarm();
            this.updateRequestsButtons();
        }
    }

    updatePlots() {
        const now = Date.now();
        let needsRender = false;

        this.plots.forEach(plot => {
            if (plot.state === 'growing') {
                const crop = this.crops[plot.cropType];
                const elapsed = now - plot.startTime;
                const newProgress = Math.min(100, (elapsed / crop.growthTime) * 100);
                
                plot.progress = newProgress;
                
                const progressEl = document.getElementById(`progress-${plot.id}`);
                if (progressEl) {
                    progressEl.style.width = `${newProgress}%`;
                }

                if (newProgress >= 100) {
                    plot.state = 'ready';
                    needsRender = true;
                }
            }
        });

        if (needsRender) this.renderFarm();
    }

    generateRequest() {
        const cropKeys = Object.keys(this.crops);
        const randomCrop = cropKeys[Math.floor(Math.random() * cropKeys.length)];
        const amount = Math.floor(Math.random() * 5) + 2;
        
        const request = {
            id: Date.now() + Math.random(),
            cropType: randomCrop,
            amount: amount,
            rewardCoins: Math.floor(this.crops[randomCrop].reward * amount * 1.5),
            rewardHappiness: amount * 2
        };

        this.communityRequests.push(request);
        this.renderRequests();
    }

    renderRequests() {
        this.requestsList.innerHTML = '';
        this.communityRequests.forEach(req => {
            const crop = this.crops[req.cropType];
            const hasEnough = this.inventory[req.cropType] >= req.amount;
            
            const el = document.createElement('div');
            el.className = 'request-card';
            el.innerHTML = `
                <div class="request-info">
                    <span class="request-crop">${req.amount}x ${crop.icon} ${crop.name}</span>
                    <span class="request-reward">Recompensa: $${req.rewardCoins} + Happy</span>
                </div>
                <button class="distribute-btn" ${hasEnough ? '' : 'disabled'} id="req-btn-${req.id}">
                    ${hasEnough ? 'Distribuir' : 'Faltando itens'}
                </button>
            `;
            
            el.querySelector('button').onclick = () => this.fulfillRequest(req);
            this.requestsList.appendChild(el);
        });
    }

    updateRequestsButtons() {
        this.communityRequests.forEach(req => {
            const btn = document.getElementById(`req-btn-${req.id}`);
            if (btn) {
                const hasEnough = this.inventory[req.cropType] >= req.amount;
                btn.disabled = !hasEnough;
                btn.innerText = hasEnough ? 'Distribuir' : 'Faltando itens';
            }
        });
    }

    fulfillRequest(request) {
        if (this.inventory[request.cropType] >= request.amount) {
            this.inventory[request.cropType] -= request.amount;
            this.coins += request.rewardCoins;
            this.happiness = Math.min(100, this.happiness + request.rewardHappiness);
            
            this.communityRequests = this.communityRequests.filter(r => r.id !== request.id);
            
            this.updateStats();
            this.renderInventory();
            this.renderRequests();
            this.showNotification('Comunidade agradecida! +Happiness');

            if (this.happiness >= 100) {
                this.victory();
            }
        }
    }

    renderInventory() {
        this.inventoryList.innerHTML = '';
        Object.entries(this.inventory).forEach(([id, count]) => {
            if (count > 0) {
                const item = document.createElement('div');
                item.className = 'inventory-item';
                item.style.padding = '8px';
                item.style.border = '2px solid var(--pixel-white)';
                item.style.background = 'var(--pixel-black)';
                item.style.fontSize = '8px';
                item.innerHTML = `<b>${this.crops[id].icon} ${count}</b>`;
                this.inventoryList.appendChild(item);
            }
        });
    }

    updateStats() {
        this.coinsEl.innerText = this.coins;
        this.happinessBar.style.width = `${this.happiness}%`;
        this.happinessText.innerText = `${this.happiness}%`;
    }

    showNotification(message, type = 'success') {
        const note = document.createElement('div');
        note.className = `notification notification-${type}`;
        note.innerText = message;
        
        document.body.appendChild(note);
        setTimeout(() => note.remove(), 2500);
    }

    victory() {
        const modal = document.createElement('div');
        modal.className = 'victory-modal';
        modal.style.position = 'fixed';
        modal.style.inset = '0';
        modal.style.background = 'rgba(0,0,0,0.8)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '2000';
        modal.style.color = 'white';
        modal.style.textAlign = 'center';
        modal.innerHTML = `
            <div>
                <h1 style="font-size: 4rem; margin-bottom: 20px;">🎉 VITÓRIA!</h1>
                <p style="font-size: 1.5rem; margin-bottom: 30px;">Você sustentou a comunidade com sucesso!</p>
                <button onclick="location.reload()" style="padding: 15px 40px; font-size: 1.2rem; cursor: pointer; border-radius: 12px; border: none; background: #22C55E; color: white;">Jogar Novamente</button>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

// Iniciar o jogo
window.onload = () => {
    window.game = new FarmGame();
};
