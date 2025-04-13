/**
 * Path.js - Handles the infinity-shaped track for the SaaS Tower Defense game
 */

class Path {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        
        // Configure the infinity path
        this.pathWidth = 30;
        this.a = this.width * 0.25; // Horizontal scale
        this.b = this.height * 0.25; // Vertical scale
        
        // Store points along the path for customer movement
        this.pathPoints = [];
        this.generatePathPoints(500); // Generate 500 points along the path
        
        // Define the renewal point (center of the infinity)
        this.renewalPoint = {
            x: this.centerX,
            y: this.centerY
        };
        
        // Define path regions (for placement validation)
        this.pathRegions = [];
        this.generatePathRegions();
    }
    
    /**
     * Generate points along the infinity path
     * Uses parametric equation of lemniscate of Bernoulli
     */
    generatePathPoints(numPoints) {
        for (let i = 0; i < numPoints; i++) {
            const t = (i / numPoints) * Math.PI * 2;
            const denominator = 1 + Math.pow(Math.sin(t), 2);
            
            // Parametric equation for infinity curve (lemniscate of Bernoulli)
            const x = this.centerX + this.a * Math.cos(t) / denominator;
            const y = this.centerY + this.b * Math.sin(t) * Math.cos(t) / denominator;
            
            this.pathPoints.push({ x, y, t });
        }
    }
    
    /**
     * Generate path regions (areas that cannot be used for tower placement)
     */
    generatePathRegions() {
        const regionWidth = this.pathWidth + 10; // Add padding
        
        // Create regions based on path points
        for (let i = 0; i < this.pathPoints.length; i += 10) { // Sample every 10th point
            const point = this.pathPoints[i];
            this.pathRegions.push({
                x: point.x - regionWidth / 2,
                y: point.y - regionWidth / 2,
                width: regionWidth,
                height: regionWidth
            });
        }
    }
    
    /**
     * Draw the infinity path to the canvas
     */
    draw() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Start drawing the path
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(100, 149, 237, 0.3)'; // Cornflower blue with transparency
        this.ctx.lineWidth = this.pathWidth;
        this.ctx.lineCap = 'round';
        
        // Use a parametric approach to draw the infinity symbol
        const steps = 200;
        
        // Move to the first point
        const t0 = 0;
        const denominator0 = 1 + Math.pow(Math.sin(t0), 2);
        const x0 = this.centerX + this.a * Math.cos(t0) / denominator0;
        const y0 = this.centerY + this.b * Math.sin(t0) * Math.cos(t0) / denominator0;
        this.ctx.moveTo(x0, y0);
        
        // Draw the rest of the points
        for (let i = 1; i <= steps; i++) {
            const t = (i / steps) * Math.PI * 2;
            const denominator = 1 + Math.pow(Math.sin(t), 2);
            const x = this.centerX + this.a * Math.cos(t) / denominator;
            const y = this.centerY + this.b * Math.sin(t) * Math.cos(t) / denominator;
            this.ctx.lineTo(x, y);
        }
        
        this.ctx.stroke();
        
        // Draw the renewal point
        this.ctx.beginPath();
        this.ctx.arc(this.renewalPoint.x, this.renewalPoint.y, 8, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.6)'; // Gold with transparency
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    /**
     * Get a point along the path at a specific distance
     * @param {number} distance - Value from 0 to 1 representing position along path
     * @returns {Object} Point coordinates {x, y}
     */
    getPointAtDistance(distance) {
        // Normalize distance to be between 0 and 1
        distance = distance % 1;
        if (distance < 0) distance += 1;
        
        // Get the index corresponding to the distance
        const index = Math.floor(distance * this.pathPoints.length);
        return this.pathPoints[index];
    }
    
    /**
     * Check if a point is near the renewal point
     * @param {Object} point - The point to check {x, y}
     * @returns {boolean} True if point is near renewal point
     */
    isNearRenewalPoint(point, threshold = 20) {
        const dx = point.x - this.renewalPoint.x;
        const dy = point.y - this.renewalPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < threshold;
    }
    
    /**
     * Check if a position is valid for tower placement (not on path)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} size - Size of the tower
     * @returns {boolean} True if placement is valid
     */
    isValidPlacement(x, y, size = 30) {
        // Check if the tower would overlap with the path
        const halfSize = size / 2;
        
        // Check against all path regions
        for (const region of this.pathRegions) {
            // Check for rectangular overlap
            if (
                x + halfSize > region.x &&
                x - halfSize < region.x + region.width &&
                y + halfSize > region.y &&
                y - halfSize < region.y + region.height
            ) {
                return false;
            }
        }
        
        // Check if tower is too close to the renewal point
        const dx = x - this.renewalPoint.x;
        const dy = y - this.renewalPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < this.pathWidth + halfSize) {
            return false;
        }
        
        // Check if tower is within canvas bounds
        if (
            x - halfSize < 0 ||
            x + halfSize > this.width ||
            y - halfSize < 0 ||
            y + halfSize > this.height
        ) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Resize the path when canvas size changes
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        this.a = this.width * 0.25;
        this.b = this.height * 0.25;
        
        // Regenerate path points and regions
        this.pathPoints = [];
        this.generatePathPoints(500);
        
        this.pathRegions = [];
        this.generatePathRegions();
        
        // Update renewal point
        this.renewalPoint = {
            x: this.centerX,
            y: this.centerY
        };
        
        // Redraw
        this.draw();
    }
}