/**
 * Main Game Controller for SaaS Tower Defense
 */
class Game {
    constructor() {
        // Game components
        this.path = null;
        this.customers = [];
        this.towers = [];
        this.ui = new UIManager(this);
        this.metrics = new MetricsCalculator();
        
        // Game state
        this.capital = 500000; // Starting capital: $500K
        this.towerIdCounter = 0;
        this.customerIdCounter = 0;
        this.frameCount = 0;
        this.running = false;
        this.gameOver = false;
        
        // Product upgrade state
        this.productUpgradeActive = false;
        this.productUpgradeProgress = 0;
        this.productUpgradeCost = 0;
        
        // Tower placement constraints
        this.gridSize = 20; // Size of placement grid
        this.pathBuffer = 30; // Minimum distance from path
        
        // Game balance settings
        this.prospectSpawnRate = 0.05; // Chance per frame to spawn a prospect
        this.customerTypes = ['SMALL', 'MEDIUM', 'ENTERPRISE'];
        this.typeWeights = [0.6, 0.3, 0.1]; // Probabilities for each type
        
        // Initialize the game
        this.init();
    }
    
    /**
     * Initialize the game
     */
    init() {
        // Create the infinity path
        this.createPath();
        
        // Spawn initial customers
        this.spawnInitialProspects(10);
        
        // Start game loop
        this.start();
    }
    
    /**
     * Create the infinity-shaped path
     */
    createPath() {
        // Create a path using your existing path code
        // This will depend on your path.js implementation
        this.path = new InfinityPath(
            this.ui.canvas.width / 2, 
            this.ui.canvas.height / 2,
            this.ui.canvas.width * 0.4,
            this.ui.canvas.height * 0.3
        );
    }
    
    /**
     * Spawn initial prospects around the path
     * @param {number} count - Number of prospects to spawn
     */
    spawnInitialProspects(count) {
        for (let i = 0; i < count; i++) {
            this.spawnProspect();
        }
    }
    
    /**
     * Spawn a new prospect at a random position off the edge of the screen
     * @returns {Customer} - New prospect
     */
    spawnProspect() {
        // Determine customer type
        const type = this.getRandomCustomerType();
        
        // Create customer using the edge spawning method
        const customer = Customer.spawnAtMapEdge(
            this,
            `customer_${this.customerIdCounter++}`,
            type
        );
        
        // Add to customers array
        this.customers.push(customer);
        
        return customer;
    }
    
    /**
     * Get random customer type based on weights
     * @returns {string} - Customer type
     */
    getRandomCustomerType() {
        const rand = Math.random();
        let sum = 0;
        
        for (let i = 0; i < this.typeWeights.length; i++) {
            sum += this.typeWeights[i];
            if (rand < sum) {
                return this.customerTypes[i];
            }
        }
        
        return this.customerTypes[0];
    }
    
    /**
     * Start the game loop
     */
    start() {
        this.running = true;
        requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * Resume paused game
     */
    resume() {
        if (!this.running) {
            this.running = true;
            requestAnimationFrame(() => this.gameLoop());
        }
    }
    
    /**
     * Main game loop
     */
    gameLoop() {
        // Skip if paused
        if (!this.running) {
            return;
        }
        
        // Skip if game over
        if (this.gameOver) {
            return;
        }
        
        // Get game speed from UI
        const speed = this.ui.gameSpeed;
        
        // Update game state (multiple times based on speed)
        for (let i = 0; i < speed; i++) {
            this.update();
        }
        
        // Draw the current state
        this.ui.draw();
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * Update game state for one frame
     */
    update() {
        this.frameCount++;
        
        // Spawn new prospects randomly
        if (Math.random() < this.prospectSpawnRate) {
            this.spawnProspect();
        }
        
        // Update all customers
        for (const customer of this.customers) {
            customer.move(this.path, this);
        }
        
        // Update all towers
        for (const tower of this.towers) {
            tower.updateTargeting(this.customers);
            tower.update();
        }
        
        // Update product upgrade if active
        if (this.productUpgradeActive) {
            this.updateProductUpgrade();
        }
        
        // Calculate and update metrics
        this.updateMetrics();
        
        // Check game over condition
        this.checkGameOver();
    }
    
    /**
     * Check if game is over
     */
    checkGameOver() {
        const activeCustomers = this.customers.filter(c => 
            c.status === 'ACTIVE' || c.status === 'GOLD'
        );
        
        if (activeCustomers.length === 0 && this.capital < Tower.getCost('CSM')) {
            this.gameOver = true;
            this.running = false;
            // Instead of an alert, show the Game Over modal
            showGameOverModal();
        }
    }
    
    /**
     * Update product upgrade progress
     */
    updateProductUpgrade() {
        // Increment progress
        this.productUpgradeProgress += 0.001;
        
        // Update UI
        this.ui.updateProductProgress(this.productUpgradeProgress, true);
        
        // Check if complete
        if (this.productUpgradeProgress >= 1) {
            this.completeProductUpgrade();
        }
    }
    
    /**
     * Complete product upgrade
     */
    completeProductUpgrade() {
        // Reset state
        this.productUpgradeActive = false;
        this.productUpgradeProgress = 0;
        
        // Update UI
        this.ui.updateProductProgress(0, false);
        
        // Apply effects to all customers
        for (const customer of this.customers) {
            if (customer.status === 'ACTIVE' || customer.status === 'GOLD') {
                // 80% chance of positive effect
                if (Math.random() < 0.8) {
                    // Improve health
                    customer.increaseHealth(Math.random() * 20);
                    
                    // Improve trust
                    customer.increaseTrust(Math.random() * 10);
                    
                    // Small chance of spend increase
                    if (Math.random() < 0.3) {
                        customer.increaseSpend(0.05 + Math.random() * 0.1); // 5-15% increase
                    }
                } else {
                    // Small chance of negative effect
                    customer.health = Math.max(0, customer.health - Math.random() * 10);
                    customer.trust = Math.max(0, customer.trust - Math.random() * 5);
                    customer.updateVisuals();
                }
            }
        }
    }
    
    /**
     * Update metrics and UI
     */
    updateMetrics() {
        // Calculate total spent on towers
        const totalSpentOnTowers = this.towers.reduce((sum, tower) => {
            const baseCost = Tower.getCost(tower.type);
            const upgradeCost = tower.getUpgradeCostSum();
            return sum + baseCost + upgradeCost;
        }, 0);
        
        // Calculate metrics
        const metrics = this.metrics.calculateMetrics(this.customers, totalSpentOnTowers);
        
        // Update UI (every 30 frames to avoid too many DOM updates)
        if (this.frameCount % 30 === 0) {
            this.metrics.updateUI();
            
            // Update capital display
            document.getElementById('capital').textContent = 
                MetricsCalculator.formatCurrency(this.capital);
                
            // Update burn rate display if product upgrade active
            if (this.productUpgradeActive) {
                document.getElementById('burn-rate').textContent = 
                    `-${MetricsCalculator.formatCurrency(this.productUpgradeCost / 100)}`;
            } else {
                document.getElementById('burn-rate').textContent = '$0';
            }
        }
    }
    
    /**
     * Check if a tower can be placed at a position
     * @param {Object} position - {x, y} position
     * @returns {boolean} - True if can place
     */
    canPlaceTower(position) {
        // Check if on path
        if (this.isOnPath(position)) {
            return false;
        }
        
        // Check if overlapping another tower
        if (this.getTowerAt(position)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Check if position is too close to path
     * @param {Object} position - {x, y} position
     * @returns {boolean} - True if on path
     */
    isOnPath(position) {
        // Sample points on path to check distance
        const numPoints = 50;
        
        for (let i = 0; i < numPoints; i++) {
            const t = i / numPoints;
            const pathPoint = this.path.getPointAtPosition(t);
            
            const dx = position.x - pathPoint.x;
            const dy = position.y - pathPoint.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.pathBuffer) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Get tower at position
     * @param {Object} position - {x, y} position
     * @returns {Tower|null} - Tower at position or null
     */
    getTowerAt(position) {
        for (const tower of this.towers) {
            const dx = position.x - tower.position.x;
            const dy = position.y - tower.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < tower.size) {
                return tower;
            }
        }
        
        return null;
    }
    
    /**
     * Place a tower at position
     * @param {string} type - Tower type
     * @param {Object} position - {x, y} position
     * @returns {Tower|null} - Placed tower or null if failed
     */
    placeTower(type, position) {
        // Check if can afford
        const cost = Tower.getCost(type);
        if (!this.canAfford(cost)) {
            return null;
        }
        
        // Create tower
        const tower = new Tower(
            `tower_${this.towerIdCounter++}`,
            type,
            position
        );
        
        // Add to towers array
        this.towers.push(tower);
        
        // Deduct cost
        this.capital -= cost;
        
        return tower;
    }
    
    /**
     * Upgrade a tower
     * @param {Tower} tower - Tower to upgrade
     * @returns {boolean} - Success or failure
     */
    upgradeTower(tower) {
        const cost = tower.getUpgradeCost();
        
        if (!this.canAfford(cost)) {
            return false;
        }
        
        // Upgrade tower
        const success = tower.upgrade();
        
        if (success) {
            // Deduct cost
            this.capital -= cost;
            return true;
        }
        
        return false;
    }
    
    /**
     * Sell a tower
     * @param {Tower} tower - Tower to sell
     * @returns {boolean} - Success or failure
     */
    sellTower(tower) {
        // Find tower index
        const index = this.towers.indexOf(tower);
        
        if (index === -1) {
            return false;
        }
        
        // Get sell value
        const value = tower.getSellValue();
        
        // Remove tower
        this.towers.splice(index, 1);
        
        // Add value to capital
        this.capital += value;
        
        return true;
    }
    
    /**
     * Start a product upgrade
     * @returns {boolean} - Success or failure
     */
    startProductUpgrade() {
        // Can't start if already active
        if (this.productUpgradeActive) {
            return false;
        }
        
        // Calculate cost based on current ARR
        const arr = this.metrics.currentMetrics.arr;
        this.productUpgradeCost = Math.max(50000, arr * 0.2); // 20% of ARR or $50K minimum
        
        // Check if can afford
        if (!this.canAfford(this.productUpgradeCost)) {
            return false;
        }
        
        // Deduct cost
        this.capital -= this.productUpgradeCost;
        
        // Activate upgrade
        this.productUpgradeActive = true;
        this.productUpgradeProgress = 0;
        
        // Update UI
        this.ui.updateProductProgress(0, true);
        
        return true;
    }
    
    /**
     * Check if can afford an amount
     * @param {number} amount - Amount to check
     * @returns {boolean} - True if can afford
     */
    canAfford(amount) {
        return this.capital >= amount;
    }
}

// Modal functions to handle Start Game and Game Over screens

/**
 * Displays the Start Game modal and waits for the user to click "Start Game"
 */
function showStartModal() {
    const modal = document.createElement('div');
    modal.id = 'start-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h1>Welcome to SaaS Tower Defense</h1>
            <button id="start-game-btn" style="padding: 10px 20px; font-size: 16px;">Start Game</button>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('start-game-btn').addEventListener('click', () => {
        modal.remove();
        // Create a new Game instance and assign it to a global variable if needed
        window.game = new Game();
    });
}

/**
 * Displays the Game Over modal with a Restart button.
 * Restarting simply reloads the page.
 */
function showGameOverModal() {
    const modal = document.createElement('div');
    modal.id = 'game-over-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h1>Game Over</h1>
            <button id="restart-game-btn" style="padding: 10px 20px; font-size: 16px;">Restart Game</button>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('restart-game-btn').addEventListener('click', () => {
        // For simplicity, reload the page to restart the game
        location.reload();
    });
}

// Initialize game when DOM is loaded by showing the start modal
document.addEventListener('DOMContentLoaded', () => {
    // Assume we have a Path class implemented in path.js
    if (typeof InfinityPath === 'undefined') {
        // Placeholder for InfinityPath if not yet implemented
        window.InfinityPath = class InfinityPath {
            constructor(centerX, centerY, radiusX, radiusY) {
                this.centerX = centerX;
                this.centerY = centerY;
                this.radiusX = radiusX;
                this.radiusY = radiusY;
            }
            
            getPointAtPosition(t) {
                // Simple infinity curve parameterization
                const angle = t * Math.PI * 2;
                const x = this.centerX + this.radiusX * Math.sin(angle);
                const y = this.centerY + this.radiusY * Math.sin(angle) * Math.cos(angle);
                return { x, y };
            }
        };
    }
    
    // Show the Start Game modal; the Game instance is created after the user clicks "Start Game"
    showStartModal();
});