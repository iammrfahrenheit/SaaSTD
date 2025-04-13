Original PRD:

# Product Requirements Document: SaaS Tower Defense Game

## Overview
SaaS Tower Defense is a browser-based strategy game that simulates the customer lifecycle in a SaaS business through tower defense mechanics. Players build and position Sales and Customer Success teams to convert prospects, retain customers, and maximize key SaaS metrics. The game features an infinity-shaped track where customers circulate, with each lap representing a renewal period.

## Target Platform
- Browser-based game using Java, HTML, and CSS
- Responsive design supporting desktop browsers primarily
- SNES-style pixel art aesthetic similar to Harvest Moon 64

## Core Game Mechanics

### Map Layout
- Infinity-shaped central track with a renewal point at center intersection
- Prospects (blue dots) initially populate the border regions
- Infinite track design allows for continuous customer journeys
- Grid-based placement system for towers

### Resources & Economy
- Starting capital: $500K seed funding
- Income sources:
  - Customer renewals (primary)
  - New customer acquisition (secondary)
  - Upsells and expansion revenue (tertiary)
- Resource expenditure:
  - Tower placement (Sales, CSM)
  - Tower upgrades (improving effectiveness)
  - Product upgrades (global effect with burn rate before release)
    - Chance to improve metrics across all customers
    - Small probability of negative impact on health/trust/spend
  - Emergency interventions for at-risk customers

### Customer Types
- Small customers: Move faster, easier to convert, lower spend
- Medium customers: Average speed, conversion difficulty, and spend
- Enterprise customers: Slow movement, difficult to convert, high spend
- Churned customers (gray): Require special winback strategy, become gold if recovered

### Customer Attributes
1. Health (visible as color)
   - Blue: Prospect
   - Green: Healthy customer
   - Yellow: At-risk customer
   - Red: Severe risk customer
   - Gray: Churned customer
   - Gold: Recovered customer with loyalty bonus

2. Spend (visible as size)
   - Increases slightly with each renewal based on probability
   - Can be actively increased through Sales tower upsell actions

3. Trust (hidden metric)
   - Decays over time at variable rates
   - Affected by CSM interactions
   - Increased when recovering customers from red status
   - Determines churn probability at renewal point
   - Gold customers have a trust aura affecting nearby customers

### Tower Types

#### Sales Tower
- Primary function: Convert prospects to customers
- Secondary function: Upsell existing customers
- Tertiary function: Win back churned customers
- Attributes:
  - Range: Medium
  - Attack speed: Slow
  - Cost: $75K
  - Targeting options:
    - By size (Small, Medium, Enterprise)
    - By status (Prospect, Current, Churned)
  - Limitations:
    - Max customers per rep (configurable: 1-5)
    - Max $ value under management
  - Burnout meter: Increases when overutilized, decreases performance

#### CSM Tower
- Primary function: Maintain customer health
- Secondary function: Build trust and reduce churn risk
- Attributes:
  - Range: Short
  - Attack speed: Medium
  - Cost: $60K
  - Targeting options:
    - By health (Red, Yellow, Green, Any)
  - Effects:
    - Slows customer movement when engaged
    - Improves health status
    - Builds trust
    - Creates "trust buffer" after successful intervention
  - Limitations:
    - Max customers per CSM (configurable: 3-10)
    - Max $ value under management
  - Burnout meter: Increases when overutilized, decreases performance

### Tower Upgrades
- Sales Tower:
  - Enterprise focus: Better at converting large prospects
  - SMB focus: Better at handling multiple small prospects
  - Winback specialist: Improved ability to recover churned customers
  - Increased range, attack speed, or capacity
  
- CSM Tower:
  - Onboarding specialist: Boosts initial customer health
  - Technical CSM: Better at recovering red customers
  - Strategic CSM: Improves expansion revenue growth
  - Increased range, attack speed, or capacity

- Product Upgrades:
  - Global effect on all customers after "release" period
  - Requires capital investment with burn down period
  - Carries small probability of negative effects on health/trust/spend
  - Upgrade types: Usability, Performance, Features, etc.

### Game Progression

#### Phases
1. Early stage (First 10 minutes)
   - Limited starting capital
   - Focus on initial customer acquisition
   - Introduction to basic mechanics

2. Growth stage (10-20 minutes)
   - Increasing customer base
   - Managing renewals becomes more complex
   - Introduction of churn and recovery mechanics

3. Scale stage (20+ minutes)
   - Full complexity unlocked
   - Balancing acquisition, retention, and expansion
   - Opportunity to convert customers to gold status

#### Game Continuation
- The game continues indefinitely until players lose
- No formal "win" condition, though players can set personal metric goals

#### Lose Conditions
- All customers churn and player runs out of money to acquire new ones

## User Interface

### Main HUD Elements
1. Resource display:
   - Current capital
   - Recurring revenue
   - Burn rate
   
2. Metrics dashboard (horizontal panel at bottom of screen):
   - NRR (Net Revenue Retention)
   - GRR (Gross Revenue Retention)
   - ARR (Annual Recurring Revenue)
   - CAC (Customer Acquisition Cost)
   - LTV (Customer Lifetime Value)
   
3. Tower management:
   - Selection menu
   - Upgrade options
   - Target priority settings
   
4. Product upgrade button:
   - Shows current progress when upgrade in development
   - Displays cost and estimated completion time
   
5. Game speed controls:
   - Normal
   - Fast
   - Pause

### Visual Indicators
- Customer health: Color coding (Blue→Green→Yellow→Red→Gray→Gold)
- Customer value: Size of dot
- Tower range: Transparent circle when tower selected
- Tower status: Color indicating normal/burnout risk
- Interaction: Visual beam between tower and target

## Technical Requirements

### Core Systems
1. Pathfinding system:
   - Customers follow infinity track
   - Variable movement speeds
   
2. Targeting system:
   - Line-of-sight detection
   - Priority-based targeting
   - Range limitations
   
3. Stat tracking:
   - Customer attribute management
   - SaaS metric calculations
   - Historical trend tracking
   
4. Economy system:
   - Resource generation
   - Cost management
   - Upgrade pathways

### Data Model

#### Customer Object
```java
class Customer {
  String id;
  CustomerType type; // SMALL, MEDIUM, ENTERPRISE
  CustomerStatus status; // PROSPECT, ACTIVE, CHURNED, GOLD
  float health; // 0-100
  float spend;
  float trust; // 0-100, hidden from player
  int lapCount;
  Position position;
  float movementSpeed;
  // methods for movement, attribute updates, etc.
}
```

#### Tower Object
```java
class Tower {
  String id;
  TowerType type; // SALES, CSM
  int level;
  Position position;
  float range;
  float attackSpeed;
  int maxTargets;
  float maxValueManaged;
  float burnoutLevel;
  TargetingStrategy strategy;
  // methods for attacking, upgrading, etc.
}
```

## Phase 1 Implementation Priorities

### MVP Features
1. Infinity-shaped track with renewal point at center
2. Customer simulation with 3 attributes (health, spend, trust)
3. Simple Sales and CSM towers with basic functionality
4. Core metrics tracking (NRR, GRR, ARR)
5. Basic tower placement and targeting
6. Product upgrade system with development burn-down
7. Tower upgrade system for Sales and CSM
8. Metrics display panel at bottom of screen
9. Lose condition when all customers churn and capital depleted

### Future Phase Considerations (Not for initial prototype)
1. Additional tower types (Marketing, Community, etc.)
2. Advanced metrics visualization
3. Visual polish and SNES-style graphics
4. Sound effects and music
5. Tutorial system

## Success Criteria
1. Players understand basic SaaS metrics through gameplay
2. Core loop of acquire→retain→expand is clear and engaging
3. Strategy emerges from tower placement and targeting decisions
4. Game difficulty progresses naturally
5. Players can discover the "secret" goal of maximizing gold customers
6. Game session lasts approximately 30-45 minutes

## Open Questions & Considerations
1. Balance between educational value and game enjoyment
2. Complexity of metric calculations vs. gameplay clarity
3. Tower upgrade paths and cost structure
4. Potential for additional tower types (Marketing, Product, Support)
5. Visualization of complex metrics in intuitive ways
6. Mobile adaptability considerations


### I use VS Code, git, and Ai development. I'm not a developer by trade so please make everything as easy as possible. Make no assumptions