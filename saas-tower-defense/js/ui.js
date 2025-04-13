/**
 * UI Manager for SaaS Tower Defense
 * Handles UI interactions and updates
 */
class UIManager {
    constructor(game) {
        this.game = game;
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // UI state
        this.selectedTower = null;
        this.placingTower = null;
        this.gameSpeed = 1;
        this.paused = false;
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    /**
     * Set up all event listeners for UI elements
     */
    setupEventListeners() {
        // Canvas event listeners for tower placement and selection
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        
        // Tower buttons
        document.getElementById('sales-tower-btn').addEventListener('click', () => {
            this.placingTower = 'SALES';
            this.selectedTower = null;
            this.updateTowerInfo();
        });
        
        document.getElementById('csm-tower-btn').addEventListener('click', () => {
            this.placingTower = 'CSM';
            this.selectedTower = null;
            this.updateTowerInfo();
        });
        
        // Tower actions
        document.getElementById('upgrade-tower-btn').addEventListener('click', () => {
            if (this.selectedTower) {
                this.game.upgradeTower(this.selectedTower);
                this.updateTowerInfo();
            }
        });
        
        document.getElementById('sell-tower-btn').addEventListener('click', () => {
            if (this.selectedTower) {
                this.game.sellTower(this.selectedTower);
                this.selectedTower = null;
                this.updateTowerInfo();
            }
        });
        
        // Product upgrade
        document.getElementById('product-upgrade-btn').addEventListener('click', () => {
            this.game.startProductUpgrade();
        });
        
        // Game speed controls
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.paused = !this.paused;
            document.getElementById('pause-btn').textContent = this.paused ? 'Play' : 'Pause';
            
            if (!this.paused) {
                this.game.resume();
            }
        });
        
        document.getElementById('normal-speed-btn').addEventListener('click', () => {
            this.gameSpeed = 1;
            this.updateSpeedButtons();
        });
        
        document.getElementById('fast-speed-btn').addEventListener('click', () => {
            this.gameSpeed = 2;
            this.updateSpeedButtons();
        });
        
        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Initial canvas resize
        this.resizeCanvas();
    }
    
    /**
     * Resize canvas to fit container
     */
    resizeCanvas() {
        const container = document.getElementById('game-canvas-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }
    
    /**
     * Handle click on the canvas
     * @param {MouseEvent} e - Click event
     */
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // If placing a tower, try to place it
        if (this.placingTower) {
            if (this.game.canPlaceTower({ x, y })) {
                this.game.placeTower(this.placingTower, { x, y });
                this.placingTower = null;
            }
            return;
        }
        
        // Otherwise, try to select a tower
        const tower = this.game.getTowerAt({ x, y });
        
        if (tower) {
            this.selectedTower = tower;
        } else {
            this.selectedTower = null;
        }
        
        this.updateTowerInfo();
    }
    
    /**
     * Handle mouse movement on the canvas
     * @param {MouseEvent} e - Mouse move event
     */
    handleCanvasMouseMove(e) {
        if (!this.placingTower) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Store position for drawing preview
        this.placingPosition = { x, y };
        
        // Update cursor based on placement validity
        if (this.game.canPlaceTower({ x, y })) {
            this.canvas.style.cursor = 'pointer';
        } else {
            this.canvas.style.cursor = 'not-allowed';
        }
    }
    
    /**
     * Update tower info panel
     */
    updateTowerInfo() {
        const infoPanel = document.getElementById('tower-info');
        const detailsElement = document.getElementById('tower-details');
        
        if (this.selectedTower) {
            infoPanel.classList.remove('hidden');
            
            const tower = this.selectedTower;
            const upgradeInfo = tower.getUpgradeCost();
            
            // Display tower details
            detailsElement.innerHTML = `
                <p>Type: ${tower.type}</p>
                <p>Level: ${tower.level}</p>
                <p>Range: ${tower.range.toFixed(0)}</p>
                <p>Targets: ${tower.currentTargets.length}/${tower.maxTargets}</p>
                <p>Burnout: ${tower.burnoutLevel.toFixed(0)}%</p>
                <p>Upgrade cost: ${MetricsCalculator.formatCurrency(tower.getUpgradeCost())}</p>
                <p>Sell value: ${MetricsCalculator.formatCurrency(tower.getSellValue())}</p>
                <div class="targeting-options">
                    <select id="targeting-strategy">
                        ${this.getTargetingOptions(tower.type, tower.targetingStrategy)}
                    </select>
                </div>
            `;
            
            // Set up targeting strategy dropdown
            document.getElementById('targeting-strategy').addEventListener('change', (e) => {
                if (this.selectedTower) {
                    this.selectedTower.targetingStrategy = e.target.value;
                }
            });
            
            // Update upgrade button state
            document.getElementById('upgrade-tower-btn').disabled = 
                !this.game.canAfford(tower.getUpgradeCost());
            
        } else {
            infoPanel.classList.add('hidden');
        }
    }
    
    /**
     * Get targeting options HTML
     * @param {string} towerType - Type of tower
     * @param {string} currentStrategy - Current strategy
     * @returns {string} - HTML for select options
     */
    getTargetingOptions(towerType, currentStrategy) {
        if (towerType === 'SALES') {
            return `
                <option value="DEFAULT" ${currentStrategy === 'DEFAULT' ? 'selected' : ''}>Any Customer</option>
                <option value="PROSPECTS" ${currentStrategy === 'PROSPECTS' ? 'selected' : ''}>Prospects Only</option>
                <option value="UPSELL" ${currentStrategy === 'UPSELL' ? 'selected' : ''}>Active Customers (Upsell)</option>
                <option value="WINBACK" ${currentStrategy === 'WINBACK' ? 'selected' : ''}>Churned Customers</option>
                <option value="ENTERPRISE" ${currentStrategy === 'ENTERPRISE' ? 'selected' : ''}>Enterprise Customers</option>
                <option value="SMB" ${currentStrategy === 'SMB' ? 'selected' : ''}>SMB Customers</option>
            `;
        } else if (towerType === 'CSM') {
            return `
                <option value="DEFAULT" ${currentStrategy === 'DEFAULT' ? 'selected' : ''}>Any Active Customer</option>
                <option value="RED" ${currentStrategy === 'RED' ? 'selected' : ''}>Red Health Customers</option>
                <option value="YELLOW" ${currentStrategy === 'YELLOW' ? 'selected' : ''}>Yellow Health Customers</option>
                <option value="GREEN" ${currentStrategy === 'GREEN' ? 'selected' : ''}>Green Health Customers</option>
            `;
        }
        
        return '';
    }
    
    /**
     * Update speed buttons based on current speed
     */
    updateSpeedButtons() {
        document.getElementById('normal-speed-btn').classList.toggle('active', this.gameSpeed === 1);
        document.getElementById('fast-speed-btn').classList.toggle('active', this.gameSpeed === 2);
    }
    
    /**
     * Update product upgrade progress
     * @param {number} progress - Progress (0-1)
     * @param {boolean} active - Whether upgrade is active
     */
    updateProductProgress(progress, active) {
        const progressElement = document.getElementById('product-progress');
        const fillElement = progressElement.querySelector('.progress-fill');
        
        if (active) {
            progressElement.classList.remove('hidden');
            fillElement.style.width = `${progress * 100}%`;
        } else {
            progressElement.classList.add('hidden');
        }
    }
    
    /**
     * Draw the game scene
     */
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw path
        if (this.game.path) {
            this.drawPath();
        }
        
        // Draw customers
        for (const customer of this.game.customers) {
            customer.draw(this.ctx);
        }
        
        // Draw towers
        for (const tower of this.game.towers) {
            tower.draw(this.ctx, tower === this.selectedTower);
        }
        
        // Draw tower placement preview
        if (this.placingTower && this.placingPosition) {
            this.drawTowerPreview();
        }
    }
    
    /**
     * Draw the infinity path
     */
    drawPath() {
        this.ctx.beginPath();
        
        // Sample the path at many points to draw it
        const numPoints = 100;
        let firstPoint = true;
        
        for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            const point = this.game.path.getPointAtPosition(t);
            
            if (firstPoint) {
                this.ctx.moveTo(point.x, point.y);
                firstPoint = false;
            } else {
                this.ctx.lineTo(point.x, point.y);
            }
        }
        
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 20;
        this.ctx.stroke();
        
        // Draw renewal point at center
        const center = this.game.path.getPointAtPosition(0.5);
        this.ctx.beginPath();
        this.ctx.arc(center.x, center.y, 15, 0, Math.PI * 2);
        this.ctx.fillStyle = '#fbbc05'; // Yellow
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.closePath();
    }
    
    /**
     * Draw tower placement preview
     */
    drawTowerPreview() {
        const { x, y } = this.placingPosition;
        const canPlace = this.game.canPlaceTower({ x, y });
        
        // Draw tower outline
        this.ctx.beginPath();
        this.ctx.rect(x - 10, y - 10, 20, 20);
        this.ctx.strokeStyle = canPlace ? '#34a853' : '#ea4335';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.fillStyle = `${this.ctx.strokeStyle}33`; // 20% opacity
        this.ctx.fill();
        this.ctx.closePath();
        
        // Draw range preview
        this.ctx.beginPath();
        const range = this.placingTower === 'SALES' ? 100 : 80;
        this.ctx.arc(x, y, range, 0, Math.PI * 2);
        this.ctx.strokeStyle = canPlace ? '#34a853' : '#ea4335';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        this.ctx.fillStyle = `${this.ctx.strokeStyle}11`; // 7% opacity
        this.ctx.fill();
        this.ctx.closePath();
    }
}