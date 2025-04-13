/**
 * SaaS Metrics Calculator
 * Calculates key SaaS metrics based on customer data
 */
class MetricsCalculator {
    constructor() {
        // Tracking history for metrics
        this.history = {
            arr: [],
            customers: [],
            churn: [],
            acquisitions: [],
            expansions: []
        };
        
        // Current metrics
        this.currentMetrics = {
            arr: 0,            // Annual Recurring Revenue
            mrr: 0,            // Monthly Recurring Revenue
            nrr: 0,            // Net Revenue Retention
            grr: 0,            // Gross Revenue Retention
            cac: 0,            // Customer Acquisition Cost
            ltv: 0,            // Lifetime Value
            customerCount: 0,  // Total active customers
            churnRate: 0       // Customer churn rate
        };
        
        // Totals for calculations
        this.totalCAC = 0;
        this.totalCustomersAcquired = 0;
    }
    
    /**
     * Format currency value for display
     * @param {number} value - Currency value
     * @returns {string} - Formatted currency string
     */
    static formatCurrency(value) {
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(1)}K`;
        } else {
            return `$${value.toFixed(0)}`;
        }
    }
    
    /**
     * Format percentage value for display
     * @param {number} value - Percentage value (0-1)
     * @returns {string} - Formatted percentage string
     */
    static formatPercentage(value) {
        return `${(value * 100).toFixed(1)}%`;
    }
    
    /**
     * Calculate all metrics based on customers
     * @param {Array<Customer>} customers - All customers
     * @param {number} spentOnTowers - Total spent on towers
     */
    calculateMetrics(customers, spentOnTowers) {
        // Count by status
        const activeCustomers = customers.filter(c => c.status === 'ACTIVE' || c.status === 'GOLD');
        const newCustomers = activeCustomers.filter(c => c.lapCount === 0);
        const churnedCustomers = customers.filter(c => c.status === 'CHURNED');
        
        // Calculate ARR (Annual Recurring Revenue)
        const currentARR = activeCustomers.reduce((sum, c) => sum + c.spend, 0);
        this.currentMetrics.arr = currentARR;
        this.currentMetrics.mrr = currentARR / 12;
        
        // Store history for retention calculations
        if (this.history.arr.length === 0) {
            this.history.arr.push(currentARR);
            this.history.customers.push(activeCustomers.map(c => ({id: c.id, spend: c.spend})));
        } else if (this.history.arr.length > 0 && this.history.arr[this.history.arr.length - 1] !== currentARR) {
            this.history.arr.push(currentARR);
            this.history.customers.push(activeCustomers.map(c => ({id: c.id, spend: c.spend})));
            
            // Keep only last 12 points
            if (this.history.arr.length > 12) {
                this.history.arr.shift();
                this.history.customers.shift();
            }
        }
        
        // Calculate NRR and GRR (if we have history)
        if (this.history.customers.length >= 2) {
            const prevCustomers = this.history.customers[this.history.customers.length - 2];
            const currCustomers = this.history.customers[this.history.customers.length - 1];
            
            // Find common customers (retained)
            const retainedCustomerIds = prevCustomers.map(c => c.id)
                .filter(id => currCustomers.some(cc => cc.id === id));
            
            // Calculate total spend for retained customers (prev period)
            const prevRetainedSpend = prevCustomers
                .filter(c => retainedCustomerIds.includes(c.id))
                .reduce((sum, c) => sum + c.spend, 0);
            
            // Calculate total spend for retained customers (current period)
            const currRetainedSpend = currCustomers
                .filter(c => retainedCustomerIds.includes(c.id))
                .reduce((sum, c) => sum + c.spend, 0);
            
            // Calculate total previous spend
            const totalPrevSpend = prevCustomers.reduce((sum, c) => sum + c.spend, 0);
            
            // Calculate retention rates
            if (totalPrevSpend > 0) {
                // GRR: How much revenue is retained without expansions
                this.currentMetrics.grr = Math.min(prevRetainedSpend / totalPrevSpend, 1);
                
                // NRR: How much revenue is retained including expansions
                this.currentMetrics.nrr = currRetainedSpend / totalPrevSpend;
            }
        }
        
        // Calculate customer count and churn rate
        this.currentMetrics.customerCount = activeCustomers.length;
        
        if (this.history.customers.length >= 2) {
            const prevCount = this.history.customers[this.history.customers.length - 2].length;
            const churnedCount = this.history.customers[this.history.customers.length - 2].length - 
                this.history.customers[this.history.customers.length - 1].length;
            
            this.currentMetrics.churnRate = prevCount > 0 ? Math.max(0, churnedCount) / prevCount : 0;
        }
        
        // Update totals for CAC and LTV
        this.totalCustomersAcquired += newCustomers.length;
        this.totalCAC = spentOnTowers;
        
        // Calculate CAC and LTV
        if (this.totalCustomersAcquired > 0) {
            this.currentMetrics.cac = this.totalCAC / this.totalCustomersAcquired;
            
            // Simplified LTV: Average customer value × average customer lifespan
            // Lifespan = 1 / churn rate
            const avgCustomerValue = this.currentMetrics.arr / Math.max(1, activeCustomers.length);
            const avgLifespanYears = this.currentMetrics.churnRate > 0 ? 
                1 / this.currentMetrics.churnRate : 
                5; // Default to 5 years if no churn data
            
            this.currentMetrics.ltv = avgCustomerValue * avgLifespanYears;
        }
        
        return this.currentMetrics;
    }
    
    /**
     * Update UI with current metrics
     */
    updateUI() {
        // Update resource panel
        document.getElementById('arr').textContent = 
            MetricsCalculator.formatCurrency(this.currentMetrics.arr);
        
        // Update metrics panel
        document.getElementById('nrr').textContent = 
            MetricsCalculator.formatPercentage(this.currentMetrics.nrr);
        document.getElementById('grr').textContent = 
            MetricsCalculator.formatPercentage(this.currentMetrics.grr);
        document.getElementById('arr-metric').textContent = 
            MetricsCalculator.formatCurrency(this.currentMetrics.arr);
        document.getElementById('cac').textContent = 
            MetricsCalculator.formatCurrency(this.currentMetrics.cac);
        document.getElementById('ltv').textContent = 
            MetricsCalculator.formatCurrency(this.currentMetrics.ltv);
    }
}