/**
 * Customer class for SaaS Tower Defense
 * Represents customers moving around the infinity track
 */
class Customer {
    /**
     * Customer constructor
     * @param {string} id - Unique identifier
     * @param {string} type - SMALL, MEDIUM, ENTERPRISE
     * @param {Object} position - {x, y} starting position
     */
    constructor(id, type, position) {
        // Basic properties
        this.id = id;
        this.type = type; // SMALL, MEDIUM, ENTERPRISE
        this.status = 'PROSPECT'; // PROSPECT, ACTIVE, CHURNED, GOLD
        this.position = position || { x: 0, y: 0 };
        
        // Core metrics (visible to player)
        this.health = 100; // 0-100, affects color
        this.spend = this.calculateInitialSpend(); // Visible as size
        
        // Hidden metrics
        this.trust = 50; // 0-100, hidden from player
        
        // Movement properties
        this.lapCount = 0;
        this.pathPosition = 0; // Current position on the path (0 to 1)
        this.movementSpeed = this.calculateMovementSpeed();
        
        // Visual properties
        this.size = this.calculateSize();
        this.color = this.calculateColor();
        
        // New properties for off-track prospects
        this.isOnTrack = false;
        this.targetPoint = null; // Target point on the infinity track
        this.approachSpeed = 0.5 + Math.random() * 0.5; // Varies between prospects
        
        // New property: customers will not move toward the track unless engaged
        this.engaged = false;
    }
    
    /**
     * Calculate initial spend based on customer type
     * @returns {number} - Initial spend amount
     */
    calculateInitialSpend() {
        switch(this.type) {
            case 'SMALL':
                return 5000 + Math.random() * 5000; // $5K-10K
            case 'MEDIUM':
                return 20000 + Math.random() * 30000; // $20K-50K
            case 'ENTERPRISE':
                return 100000 + Math.random() * 400000; // $100K-500K
            default:
                return 10000;
        }
    }
    
    /**
     * Calculate movement speed based on customer type
     * @returns {number} - Movement speed (0-1 per frame)
     */
    calculateMovementSpeed() {
        switch(this.type) {
            case 'SMALL':
                return 0.001 + Math.random() * 0.0005; // Faster
            case 'MEDIUM':
                return 0.0008 + Math.random() * 0.0003;
            case 'ENTERPRISE':
                return 0.0005 + Math.random() * 0.0002; // Slower
            default:
                return 0.0008;
        }
    }
    
    /**
     * Calculate visual size based on spend
     * @returns {number} - Size in pixels
     */
    calculateSize() {
        // Base size plus logarithmic scale for spend
        return 5 + Math.log10(this.spend) * 2;
    }
    
    /**
     * Calculate color based on status and health
     * @returns {string} - CSS color
     */
    calculateColor() {
        switch(this.status) {
            case 'PROSPECT':
                return '#4285f4'; // Blue
            case 'ACTIVE':
                // Green to yellow to red based on health
                if (this.health > 75) {
                    return '#34a853'; // Green
                } else if (this.health > 50) {
                    return '#ffd700'; // Yellow
                } else if (this.health > 25) {
                    return '#ff9800'; // Orange
                } else {
                    return '#ea4335'; // Red
                }
            case 'CHURNED':
                return '#9e9e9e'; // Gray
            case 'GOLD':
                return '#ffab00'; // Gold
            default:
                return '#4285f4';
        }
    }
    
    /**
     * Update customer position
     * @param {Object} path - Path object with getPointAtPosition method
     * @param {Object} game - Game object for canvas dimensions
     */
    move(path, game) {
        // If not on track, check engagement status.
        if (!this.isOnTrack) {
            if (this.engaged) {
                this.moveTowardsTrack(path, game);
            } else {
                // While not engaged, wander along the edge
                this.wanderOnEdge(game);
            }
            return;
        }
        
        // Update path position if already on track
        this.pathPosition += this.movementSpeed;
        
        // Check if completed a lap
        if (this.pathPosition >= 1) {
            this.pathPosition = 0;
            this.lapCount++;
            this.onLapComplete();
        }
        
        // Get new position on path
        const newPosition = path.getPointAtPosition(this.pathPosition);
        this.position.x = newPosition.x;
        this.position.y = newPosition.y;
    }
    
    /**
     * Move prospect towards the infinity track
     * @param {Object} path - Path object
     * @param {Object} game - Game object
     */
    moveTowardsTrack(path, game) {
        if (!this.targetPoint) {
            // Choose a random point on the path as target
            const randomPosition = Math.random();
            this.pathPosition = randomPosition;
            this.targetPoint = path.getPointAtPosition(randomPosition);
        }
        
        // Calculate direction to target
        const dx = this.targetPoint.x - this.position.x;
        const dy = this.targetPoint.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Move towards target
        if (distance > 5) {
            this.position.x += (dx / distance) * this.approachSpeed;
            this.position.y += (dy / distance) * this.approachSpeed;
        } else {
            // Reached the track - only get on track if engaged
            this.isOnTrack = true;
            this.position.x = this.targetPoint.x;
            this.position.y = this.targetPoint.y;
        }
    }
    
    /**
     * New method: make the customer wander along the edge so they remain visible.
     * @param {Object} game - Game object for canvas dimensions
     */
    wanderOnEdge(game) {
        const wanderSpeed = 0.5; // Adjust this value as needed
        const canvasWidth = game.ui.canvas.width;
        const canvasHeight = game.ui.canvas.height;
        
        // Simply update position by a small random offset.
        this.position.x += (Math.random() - 0.5) * wanderSpeed;
        this.position.y += (Math.random() - 0.5) * wanderSpeed;
        
        // Optional: Clamp the position so the customer remains near the edge.
        // For example, if the customer is near the left edge, ensure x does not drift too far.
        if (this.position.x < 0) this.position.x = 20;
        if (this.position.x > canvasWidth) this.position.x = canvasWidth - 20;
        if (this.position.y < 0) this.position.y = 20;
        if (this.position.y > canvasHeight) this.position.y = canvasHeight - 20;
    }
    
    /**
     * Called when customer completes a lap (renewal point)
     */
    onLapComplete() {
        // Skip for prospects
        if (this.status === 'PROSPECT') {
            return;
        }
        
        // Check for renewal or churn
        if (this.status === 'ACTIVE') {
            this.decideRenewal();
        }
        
        // Natural trust decay
        this.trust = Math.max(0, this.trust - 5);
        
        // Health decay
        this.health = Math.max(0, this.health - 5);
        
        // Update visual properties
        this.updateVisuals();
    }
    
    /**
     * Decide if customer renews or churns
     */
    decideRenewal() {
        // Calculate churn probability based on trust and health
        const churnProbability = (100 - this.trust) * 0.01 * (100 - this.health) * 0.01;
        
        // Random chance to churn
        if (Math.random() < churnProbability) {
            this.status = 'CHURNED';
        } else {
            // If renewed, maybe increase spend
            if (Math.random() < 0.2) {
                this.spend *= (1 + Math.random() * 0.1); // 0-10% increase
            }
        }
    }
    
    /**
     * Update visual properties (color and size)
     */
    updateVisuals() {
        this.color = this.calculateColor();
        this.size = this.calculateSize();
    }
    
    /**
     * Convert prospect to active customer
     */
    convert() {
        if (this.status === 'PROSPECT') {
            this.status = 'ACTIVE';
            this.updateVisuals();
            return true;
        }
        return false;
    }
    
    /**
     * Increase customer health
     * @param {number} amount - Amount to increase (0-100)
     */
    increaseHealth(amount) {
        this.health = Math.min(100, this.health + amount);
        this.updateVisuals();
    }
    
    /**
     * Increase customer trust
     * @param {number} amount - Amount to increase (0-100)
     */
    increaseTrust(amount) {
        this.trust = Math.min(100, this.trust + amount);
    }
    
    /**
     * Increase customer spend
     * @param {number} percentage - Percentage to increase (0-1)
     */
    increaseSpend(percentage) {
        this.spend *= (1 + percentage);
        this.updateVisuals();
    }
    
    /**
     * Recover churned customer to gold status
     */
    recoverToGold() {
        if (this.status === 'CHURNED') {
            this.status = 'GOLD';
            this.health = 100;
            this.trust = 100;
            this.updateVisuals();
            return true;
        }
        return false;
    }
    
    /**
     * Draw customer on canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        // Draw customer as circle
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        
        // Draw gold aura for gold customers
        if (this.status === 'GOLD') {
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.size * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
            ctx.fill();
            ctx.closePath();
        }
        
        // For prospects not on track, optionally draw a line to show where they're heading
        if (this.status === 'PROSPECT' && !this.isOnTrack && this.targetPoint) {
            ctx.beginPath();
            ctx.moveTo(this.position.x, this.position.y);
            ctx.lineTo(this.targetPoint.x, this.targetPoint.y);
            ctx.strokeStyle = 'rgba(66, 133, 244, 0.3)'; // Light blue, semi-transparent
            ctx.setLineDash([2, 2]); // Dotted line
            ctx.stroke();
            ctx.setLineDash([]); // Reset dash pattern
        }
    }
    
    /**
     * Static method to create a new prospect at a random edge of the map
     * @param {Object} game - Game object with canvas dimensions
     * @param {string} id - Unique identifier
     * @param {string} type - Customer type
     * @returns {Customer} - New customer instance
     */
    static spawnAtMapEdge(game, id, type) {
        // Access canvas via game.ui
        const canvasWidth = game.ui.canvas.width;
        const canvasHeight = game.ui.canvas.height;

        // Check if canvas dimensions were found (optional but good for debugging)
        if (typeof canvasWidth === 'undefined' || typeof canvasHeight === 'undefined') {
            console.error("Could not get canvas dimensions from game.ui.canvas in spawnAtMapEdge");
            return null;
        }

        // Choose a random edge (0: top, 1: right, 2: bottom, 3: left)
        const edge = Math.floor(Math.random() * 4);
        let position;

        switch (edge) {
            case 0: // Top edge
                position = {
                    x: Math.random() * canvasWidth,
                    y: -20 // Slightly off-screen
                };
                break;
            case 1: // Right edge
                position = {
                    x: canvasWidth + 20,
                    y: Math.random() * canvasHeight
                };
                break;
            case 2: // Bottom edge
                position = {
                    x: Math.random() * canvasWidth,
                    y: canvasHeight + 20
                };
                break;
            case 3: // Left edge
                position = {
                    x: -20,
                    y: Math.random() * canvasHeight
                };
                break;
            default:
                position = { x: 0, y: 0 };
        }
        
        // Create new prospect
        const customer = new Customer(id, type || 'SMALL', position);
        customer.isOnTrack = false; // Ensure it starts off-track
        
        return customer;
    }
}