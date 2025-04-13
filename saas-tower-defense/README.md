# SaaS Tower Defense

A browser-based strategy game that simulates the customer lifecycle in a SaaS business through tower defense mechanics.

## Overview

SaaS Tower Defense lets players build and position Sales and Customer Success teams to convert prospects, retain customers, and maximize key SaaS metrics. The game features an infinity-shaped track where customers circulate, with each lap representing a renewal period.

## Game Mechanics

- **Infinity Path**: Customers travel on an infinity-shaped path with a renewal point at the center
- **Customers**: Vary by type (Small, Medium, Enterprise), status (Prospect, Active, Churned, Gold), and attributes (Health, Spend, Trust)
- **Towers**: Sales towers convert prospects and upsell, CSM towers maintain customer health
- **Product Upgrades**: Invest in product improvements that affect all customers
- **SaaS Metrics**: Track KPIs like ARR, NRR, GRR, CAC, and LTV

## Getting Started

1. Clone this repository
2. Open `index.html` in a web browser
3. Start playing!

## Controls

- Click tower buttons to select a tower type to place
- Click on the game area to place the selected tower
- Click on an existing tower to select it and see details
- Use the tower panel to upgrade or sell selected towers
- Use speed controls to adjust game speed

## Development

This project is structured as follows:

```
/
├── index.html               # Main HTML file
├── styles/
│   └── style.css            # Main CSS file
├── js/
│   ├── game.js              # Main game controller
│   ├── path.js              # Infinity path implementation
│   ├── customer.js          # Customer object definition
│   ├── tower.js             # Tower classes and logic
│   ├── metrics.js           # SaaS metrics calculation
│   └── ui.js                # UI elements and controls
└── README.md                # Project documentation
```

## Next Steps

Future enhancements planned:
- Additional tower types (Marketing, Community)
- Advanced metrics visualization
- Visual polish with SNES-style graphics
- Sound effects and music
- Tutorial system