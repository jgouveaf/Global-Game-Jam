/** 
 * Global Game Jam - AgriCorp Engine 
 */

class FarmGame {
    constructor() {
        this.coins = 50;
        this.happiness = 0;
        this.inventory = { wheat: 0, carrot: 0, tomato: 0, corn: 0 };
        this.crops = {
            wheat: { name: 'Trigo', icon: '🌾', growthTime: 5000, price: 5, reward: 10 },
            carrot: { name: 'Cenoura', icon: '🥕', growthTime: 10000, price: 10, reward: 25 },
            tomato: { name: 'Tomate', icon: '🍅', growthTime: 20000, price: 20, reward: 55 },
            corn: { name: 'Milho', icon: '🌽', growthTime: 40000, price: 50, reward: 150 }
        };
        this.selectedSeed = 'wheat';
        this.plots = Array(9).fill(null).map((_, i) => ({
            id: i, state: 'empty', cropType: null, progress: 0, startTime: 0
        }));
        this.communityRequests = [];
        this.maxRequests = 5;

        // Elementos
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
        setInterval(() => this.updatePlots(), 100);
        setInterval(() => {
            if (this.communityRequests.length < this.maxRequests) this.generateRequest();
        }, 8000);
        this.updateStats();
    }

    renderSeedShop() {
        this.seedShop.innerHTML = '';
        Object.entries(this.crops).forEach(([id, crop]) => {
            const btn = document.createElement('button');
            btn.className = `seed-btn ${this.selectedSeed === id ? 'active' : ''}`;
            btn.innerHTML = `<span style="font-size: 20px;">${crop.icon}</span> <span>${crop.name}</span> <span>($${crop.price})</span>`;
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
            el.onclick = () => this.handlePlotClick(plot);
            
            if (plot.state !== 'empty') {
                const crop = this.crops[plot.cropType];
                el.innerHTML = `
                    <div class="crop-visual ${plot.state === 'ready' ? 'harvest-ready' : ''}">
                        ${plot.state === 'ready' ? crop.icon : ''}
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
                this.updateStats();
                this.renderFarm();
                this.showNotification(`Plantado: ${crop.name}`);
            } else {
                this.showNotification('Sem moedas!', 'error');
            }
        } else if (plot.state === 'ready') {
            this.inventory[plot.cropType]++;
            plot.state = 'empty';
            plot.cropType = null;
            this.renderInventory();
            this.renderFarm();
            this.updateRequestsButtons();
            this.showNotification('Colhido!');
        }
    }

    updatePlots() {
        const now = Date.now();
        let needsRender = false;
        this.plots.forEach(plot => {
            if (plot.state === 'growing') {
                const crop = this.crops[plot.cropType];
                const elapsed = now - plot.startTime;
                plot.progress = Math.min(100, (elapsed / crop.growthTime) * 100);
                const pEl = document.getElementById(`progress-${plot.id}`);
                if (pEl) pEl.style.width = `${plot.progress}%`;
                if (plot.progress >= 100) { plot.state = 'ready'; needsRender = true; }
            }
        });
        if (needsRender) this.renderFarm();
    }

    generateRequest() {
        const cropKeys = Object.keys(this.crops);
        const randomCrop = cropKeys[Math.floor(Math.random() * cropKeys.length)];
        const amount = Math.floor(Math.random() * 3) + 2;
        const request = {
            id: Math.random(), cropType: randomCrop, amount: amount,
            rewardCoins: Math.floor(this.crops[randomCrop].reward * amount * 1.5),
            rewardHappiness: amount * 2
        };
        this.communityRequests.push(request);
        this.renderRequests();
    }

    renderRequests() {
        this.requestsList.innerHTML = '';
        this.communityRequests.forEach(req => {
            const hasEnough = this.inventory[req.cropType] >= req.amount;
            const el = document.createElement('div');
            el.className = 'request-card';
            el.innerHTML = `
                <div class="request-info">
                    ${req.amount}x ${this.crops[req.cropType].icon}<br>
                    +$${req.rewardCoins}
                </div>
                <button class="distribute-btn" ${hasEnough ? '' : 'disabled'} id="req-btn-${req.id}">
                    OK
                </button>
            `;
            el.querySelector('button').onclick = () => this.fulfillRequest(req);
            this.requestsList.appendChild(el);
        });
    }

    updateRequestsButtons() {
        this.communityRequests.forEach(req => {
            const btn = document.getElementById(`req-btn-${req.id}`);
            if (btn) btn.disabled = !(this.inventory[req.cropType] >= req.amount);
        });
    }

    fulfillRequest(req) {
        if (this.inventory[req.cropType] >= req.amount) {
            this.inventory[req.cropType] -= req.amount;
            this.coins += req.rewardCoins;
            this.happiness = Math.min(100, this.happiness + req.rewardHappiness);
            this.communityRequests = this.communityRequests.filter(r => r.id !== req.id);
            this.updateStats();
            this.renderInventory();
            this.renderRequests();
            this.showNotification('Valeu!');
        }
    }

    renderInventory() {
        this.inventoryList.innerHTML = '';
        Object.entries(this.inventory).forEach(([id, count]) => {
            if (count > 0) {
                const item = document.createElement('div');
                item.style.padding = '4px';
                item.style.border = '2px solid #000';
                item.style.fontSize = '8px';
                item.innerHTML = `${this.crops[id].icon}${count}`;
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
        setTimeout(() => note.remove(), 2000);
    }
}

window.onload = () => { window.game = new FarmGame(); };
