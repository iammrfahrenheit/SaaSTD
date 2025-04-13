/**
 * Base Tower class for SaaS Tower Defense
 */
class Tower {
    /**
     * Tower constructor
     * @param {string} id - Unique identifier
     * @param {string} type - SALES, CSM
     * @param {Object} position - {x, y} position on grid
     */
    constructor(id, type, position) {
        this.id = id;
        this.type = type;
        this.position = position;
        this.level = 1;
        
        // Base properties
        this.range = this.getBaseRange();
        this.attackSpeed = this.getBaseAttackSpeed();
        this.maxTargets = this.getBaseMaxTargets();
        this.maxValueManaged = this.getBaseMaxValueManaged();
        
        // Targeting properties
        this.currentTargets = [];
        this.targetingStrategy = 'DEFAULT';
        
        // Performance properties
        this.burnoutLevel = 0;
        this.attackCooldown = 0;
        
        // Visual properties
        this.size = 20;
        this.color = this.getColor();
    }
    
    /**
     * Get base range based on tower type
     * @returns {number} - Range in pixels
     */
    getBaseRange() {
        return this.type === 'SALES' ? 100 : 80;
    }
    
    /**
     * Get base attack speed based on tower type
     * @returns {number} - Attack cooldown in frames
     */
    getBaseAttackSpeed() {
        return this.type === 'SALES' ? 60 : 30; // Higher is slower
    }
    
    /**
     * Get base max targets based on tower type
     * @returns {number} - Max number of simultaneous targets
     */
    getBaseMaxTargets() {
        return this.type === 'SALES' ? 3 : 5;
    }
    
    /**
     * Get base max value managed based on tower type
     * @returns {number} - Max total spend value managed
     */
    getBaseMaxValueManaged() {
        return this.type === 'SALES' ? 1000000 : 2000000;
    }
    
    /**
     * Get tower color based on type
     * @returns {string} - CSS color
     */
    getColor() {
        return this.type === 'SALES' ? '#4285f4' : '#34a853';
    }
    
    /**
     * Get tower cost based on type
     * @returns {number} - Cost in dollars
     */
    static getCost(type) {
        return type === 'SALES' ? 75000 : 60000;
    }
    
    /**
     * Get upgrade cost based on current level
     * @returns {number} - Upgrade cost in dollars
     */
    getUpgradeCost() {
        const baseCost = Tower.getCost(this.type);
        return Math.round(baseCost * 0.75 * this.level);
    }
    
    /**
     * Get sell value based on total investment
     * @returns {number} - Sell value in dollars
     */
    getSellValue() {
        const baseCost = Tower.getCost(this.type);
        const totalInvested = baseCost + this.getUpgradeCostSum();
        return Math.round(totalInvested * 0.7); // 70% return
    }
    
    /**
     * Calculate sum of all previous upgrade costs
     * @returns {number} - Sum of upgrade costs
     */
    getUpgradeCostSum() {
        let sum = 0;
        for (let i = 1; i < this.level; i++) {
            const baseCost = Tower.getCost(this.type);
            sum += Math.round(baseCost * 0.75 * i);
        }
        return sum;
    }
    
    /**
     * Upgrade tower to next level
     * @returns {boolean} - Success or failure
     */
    upgrade() {
        this.level++;
        
        // Improve properties based on level
        this.range = this.getBaseRange() * (1 + 0.1 * (this.level - 1));
        this.attackSpeed = Math.max(10, this.getBaseAttackSpeed() * (1 - 0.05 * (this.level - 1)));
        this.maxTargets = this.getBaseMaxTargets() + Math.floor((this.level - 1) / 2);
        this.maxValueManaged = this.getBaseMaxValueManaged() * (1 + 0.2 * (this.level - 1));
        
        return true;
    }
    
    /**
     * Check if a customer is in range
     * @param {Customer} customer - Customer to check
     * @returns {boolean} - True if in range
     */
    isInRange(customer) {
        const dx = this.position.x - customer.position.x;
        const dy = this.position.y - customer.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= this.range;
    }
    
    /**
     * Calculate total value of current targets
     * @returns {number} - Total spend value
     */
    getCurrentManagedValue() {
        return this.currentTargets.reduce((sum, customer) => sum + customer.spend, 0);
    }
    
    /**
     * Check if tower can handle more targets
     * @param {Customer} customer - Potential new target
     * @returns {boolean} - True if can handle
     */
    canHandleTarget(customer) {
        if (this.currentTargets.length >= this.maxTargets) {
            return false;
        }
        
        const potentialValue = this.getCurrentManagedValue() + customer.spend;
        if (potentialValue > this.maxValueManaged) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Filter customers based on targeting strategy
     * @param {Array<Customer>} customers - All customers
     * @returns {Array<Customer>} - Filtered customers
     */
    filterTargetsByStrategy(customers) {
        let targets = customers.filter(c => this.isInRange(c));
        
        // Apply tower-specific filtering
        if (this.type === 'SALES') {
            switch(this.targetingStrategy) {
                case 'PROSPECTS':
                    targets = targets.filter(c => c.status === 'PROSPECT');
                    break;
                case 'UPSELL':
                    targets = targets.filter(c => c.status === 'ACTIVE');
                    break;
                case 'WINBACK':
                    targets = targets.filter(c => c.status === 'CHURNED');
                    break;
                case 'ENTERPRISE':
                    targets = targets.filter(c => c.type === 'ENTERPRISE');
                    break;
                case 'SMB':
                    targets = targets.filter(c => c.type === 'SMALL' || c.type === 'MEDIUM');
                    break;
                // Default: any customer
            }
        } else if (this.type === 'CSM') {
            switch(this.targetingStrategy) {
                case 'RED':
                    targets = targets.filter(c => c.status === 'ACTIVE' && c.health <= 25);
                    break;
                case 'YELLOW':
                    targets = targets.filter(c => c.status === 'ACTIVE' && c.health > 25 && c.health <= 75);
                    break;
                case 'GREEN':
                    targets = targets.filter(c => c.status === 'ACTIVE' && c.health > 75);
                    break;
                // Default: any active customer
                default:
                    targets = targets.filter(c => c.status === 'ACTIVE');
            }
        }
        
        return targets;
    }
    
    /**
     * Get priority targets from filtered list
     * @param {Array<Customer>} filteredCustomers - Customers after strategy filtering
     * @returns {Array<Customer>} - Priority sorted customers
     */
    getPriorityTargets(filteredCustomers) {
        // Sort based on tower type
        if (this.type === 'SALES') {
            // Sort by value (enterprise first)
            return filteredCustomers.sort((a, b) => b.spend - a.spend);
        } else if (this.type === 'CSM') {
            // Sort by health (lowest first)
            return filteredCustomers.sort((a, b) => a.health - b.health);
        }
        
        return filteredCustomers;
    }
    
    /**
     * Update tower targeting
     * @param {Array<Customer>} customers - All customers
     */
    updateTargeting(customers) {
        // Reset burnout if no targets
        if (this.currentTargets.length === 0) {
            this.burnoutLevel = Math.max(0, this.burnoutLevel - 0.5);
        }
        
        // Remove targets that moved out of range
        this.currentTargets = this.currentTargets.filter(c => 
            this.isInRange(c) && 
            customers.includes(c)
        );
        
        // Don't add new targets if at capacity
        if (this.currentTargets.length >= this.maxTargets) {
            return;
        }
        
        // Filter by strategy and sort by priority
        const filteredCustomers = this.filterTargetsByStrategy(customers);
        const priorityTargets = this.getPriorityTargets(filteredCustomers);
        
        // Add new targets if possible
        for (const customer of priorityTargets) {
            if (!this.currentTargets.includes(customer) && this.canHandleTarget(customer)) {
                this.currentTargets.push(customer);
                
                // Break if at capacity
                if (this.currentTargets.length >= this.maxTargets) {
                    break;
                }
            }
        }
        
        // Increase burnout based on target count
        if (this.currentTargets.length > 0) {
            const burnoutRate = this.currentTargets.length / this.maxTargets * 0.1;
            this.burnoutLevel = Math.min(100, this.burnoutLevel + burnoutRate);
        }
    }
    
    /**
     * Update tower actions (attack)
     */
    update() {
        // Skip if no targets
        if (this.currentTargets.length === 0) {
            return;
        }
        
        // Decrease cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
            return;
        }
        
        // Attack targets
        this.attackTargets();
        
        // Reset cooldown (adjusted for burnout)
        const burnoutFactor = 1 + (this.burnoutLevel / 100);
        this.attackCooldown = Math.round(this.attackSpeed * burnoutFactor);
    }
    
    /**
     * Perform attack on current targets
     */
    attackTargets() {
        // Different effects based on tower type
        if (this.type === 'SALES') {
            for (const customer of this.currentTargets) {
                // Mark customer as engaged so it stops wandering
                customer.engaged = true;
                if (customer.status === 'PROSPECT') {
                    // Try to convert prospect
                    const conversionChance = 0.01 * (1 - this.burnoutLevel / 100);
                    if (Math.random() < conversionChance) {
                        customer.convert();
                    }
                } else if (customer.status === 'ACTIVE') {
                    // Try to upsell
                    const upsellChance = 0.005 * (1 - this.burnoutLevel / 100);
                    if (Math.random() < upsellChance) {
                        customer.increaseSpend(0.05); // 5% increase
                    }
                } else if (customer.status === 'CHURNED') {
                    // Try to win back
                    const winbackChance = 0.002 * (1 - this.burnoutLevel / 100);
                    if (Math.random() < winbackChance) {
                        customer.recoverToGold();
                    }
                }
            }
        } else if (this.type === 'CSM') {
            for (const customer of this.currentTargets) {
                // Mark customer as engaged for consistency
                customer.engaged = true;
                if (customer.status === 'ACTIVE') {
                    // Increase health and trust
                    const healthBoost = 1 * (1 - this.burnoutLevel / 100);
                    const trustBoost = 0.5 * (1 - this.burnoutLevel / 100);
                    
                    customer.increaseHealth(healthBoost);
                    customer.increaseTrust(trustBoost);
                }
            }
        }
    }
    
    /**
     * Draw tower on canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {boolean} selected - Whether tower is selected
     */
    draw(ctx, selected = false) {
        // Draw tower base
        ctx.beginPath();
        ctx.rect(
            this.position.x - this.size / 2,
            this.position.y - this.size / 2,
            this.size,
            this.size
        );
        
        // Set color based on burnout level
        if (this.burnoutLevel > 75) {
            ctx.fillStyle = '#ea4335'; // Red for high burnout
        } else if (this.burnoutLevel > 50) {
            ctx.fillStyle = '#fbbc05'; // Yellow for medium burnout
        } else {
            ctx.fillStyle = this.color; // Normal color
        }
        
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.closePath();
        
        // Draw tower level
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.level.toString(), this.position.x, this.position.y);
        
        // Draw range circle if selected
        if (selected) {
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.range, 0, Math.PI * 2);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = `${this.color}33`; // 20% opacity
            ctx.fill();
            ctx.closePath();
        }
        
        // Draw connections to targets
        for (const target of this.currentTargets) {
            ctx.beginPath();
            ctx.moveTo(this.position.x, this.position.y);
            ctx.lineTo(target.position.x, target.position.y);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.closePath();
        }
    }
}