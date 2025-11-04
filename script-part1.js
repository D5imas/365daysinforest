// Game State
const gameState = {
    // Player stats
    player: {
        x: 10,
        y: 10,
        health: 100,
        maxHealth: 100,
        energy: 100,
        maxEnergy: 100,
        hunger: 100,
        maxHunger: 100,
        class: null,
        level: 1,
        experience: 0,
        nextLevelExp: 100
    },
    
    // Game time
    time: {
        day: 1,
        isDay: true,
        secondsRemaining: 60, // 1 minute per day
        totalSeconds: 60
    },
    
    // Inventory
    inventory: {
        wood: 0,
        stone: 0,
        fish: 0,
        gold: 0,
        food: 5
    },
    
    // Cards
    cards: [
        { id: 1, name: "Удар", type: "attack", cost: 2, value: 10, icon: "⚔️" },
        { id: 2, name: "Защита", type: "defense", cost: 1, value: 5, icon: "🛡️" },
        { id: 3, name: "Исцеление", type: "heal", cost: 3, value: 15, icon: "❤️" },
        { id: 4, name: "Критический удар", type: "attack", cost: 4, value: 25, icon: "💥" }
    ],
    
    // World map
    world: [],
    
    // Game flags
    inBattle: false,
    battleEnemy: null,
    gameActive: false,
    
    // Scroll state
    scrollPosition: 0,
    maxScrollPosition: 0
};

// Initialize the game
function initGame() {
    generateWorld();
    renderWorld();
    updateUI();
    setupEventListeners();
    calculateMaxScroll();
    
    // Show class selection modal
    document.getElementById('class-modal').style.display = 'flex';
}

// Generate the game world
function generateWorld() {
    const gridSize = 20;
    gameState.world = [];
    
    for (let y = 0; y < gridSize; y++) {
        const row = [];
        for (let x = 0; x < gridSize; x++) {
            // Determine cell type based on probability
            let cellType;
            const rand = Math.random();
            
            if (rand < 0.7) {
                cellType = 'forest'; // 70% forests
            } else if (rand < 0.85) {
                cellType = 'mountain'; // 15% mountains
            } else if (rand < 0.95) {
                cellType = 'water'; // 10% water
            } else {
                cellType = 'base'; // 5% base
            }
            
            row.push({
                type: cellType,
                resources: getInitialResources(cellType),
                discovered: false
            });
        }
        gameState.world.push(row);
    }
    
    // Ensure player starts at a forest cell
    gameState.world[10][10].type = 'forest';
    gameState.world[10][10].discovered = true;
}

// Get initial resources for a cell type
function getInitialResources(cellType) {
    switch(cellType) {
        case 'forest':
            return { wood: Math.floor(Math.random() * 5) + 3 };
        case 'mountain':
            return { 
                stone: Math.floor(Math.random() * 4) + 2,
                gold: Math.random() < 0.2 ? 1 : 0
            };
        case 'water':
            return { fish: Math.floor(Math.random() * 3) + 1 };
        case 'base':
            return { safe: true };
        default:
            return {};
    }
}

// Render the world grid
function renderWorld() {
    const grid = document.getElementById('world-grid');
    grid.innerHTML = '';
    
    for (let y = 0; y < gameState.world.length; y++) {
        for (let x = 0; x < gameState.world[y].length; x++) {
            const cell = document.createElement('div');
            cell.className = `cell ${gameState.world[y][x].type} ${gameState.time.isDay ? '' : 'night'}`;
            cell.dataset.x = x;
            cell.dataset.y = y;
            
            // Add emoji based on cell type
            let emoji = '';
            switch(gameState.world[y][x].type) {
                case 'forest': emoji = '🌲'; break;
                case 'mountain': emoji = '🏔️'; break;
                case 'water': emoji = '🌊'; break;
                case 'base': emoji = '🏕️'; break;
            }
            
            cell.textContent = emoji;
            grid.appendChild(cell);
        }
    }
    
    // Position player
    const player = document.getElementById('player');
    const cellSize = 100 / 20; // 20 cells in 100%
    player.style.left = `calc(${gameState.player.x * cellSize}% + 2px)`;
    player.style.top = `calc(${gameState.player.y * cellSize}% + 2px)`;
}

// Update the UI with current game state
function updateUI() {
    // Update player stats
    document.getElementById('health-value').textContent = gameState.player.health;
    document.getElementById('energy-value').textContent = gameState.player.energy;
    document.getElementById('hunger-value').textContent = gameState.player.hunger;
    
    // Update progress bars
    document.querySelector('.health .progress-fill').style.width = `${gameState.player.health}%`;
    document.querySelector('.energy .progress-fill').style.width = `${gameState.player.energy}%`;
    document.querySelector('.hunger .progress-fill').style.width = `${gameState.player.hunger}%`;
    
    // Update time display
    document.getElementById('day-count').textContent = gameState.time.day;
    document.getElementById('time-of-day').textContent = gameState.time.isDay ? '🌞 День' : '🌙 Ночь';
    
    // Format timer
    const minutes = Math.floor(gameState.time.secondsRemaining / 60);
    const seconds = gameState.time.secondsRemaining % 60;
    document.getElementById('timer').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Update inventory
    updateInventory();
    
    // Update cards
    updateCards();
    
    // Update player name and class
    document.getElementById('player-name').textContent = gameState.player.class ? 
        `${gameState.player.class} (Ур. ${gameState.player.level})` : 'Не выбрано';
}

// Update inventory display
function updateInventory() {
    const inventory = document.getElementById('inventory');
    inventory.innerHTML = '';
    
    const items = [
        { id: 'wood', name: 'Дерево', icon: '🪵', count: gameState.inventory.wood },
        { id: 'stone', name: 'Камень', icon: '🪨', count: gameState.inventory.stone },
        { id: 'fish', name: 'Рыба', icon: '🐟', count: gameState.inventory.fish },
        { id: 'gold', name: 'Золото', icon: '🪙', count: gameState.inventory.gold },
        { id: 'food', name: 'Еда', icon: '🍖', count: gameState.inventory.food }
    ];
    
    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'inventory-item';
        itemElement.innerHTML = `
            <div class="item-icon">${item.icon}</div>
            <div class="item-name">${item.name}</div>
            <div class="item-count">${item.count}</div>
        `;
        inventory.appendChild(itemElement);
    });
}

// Update cards display
function updateCards() {
    const cardsContainer = document.getElementById('cards-container');
    cardsContainer.innerHTML = '';
    
    gameState.cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.innerHTML = `
            <div class="card-cost">${card.cost}</div>
            <div class="card-icon">${card.icon}</div>
            <div class="card-name">${card.name}</div>
        `;
        cardElement.addEventListener('click', () => useCard(card));
        cardsContainer.appendChild(cardElement);
    });
}

// Calculate maximum scroll position
function calculateMaxScroll() {
    const sidePanel = document.querySelector('.side-panel');
    const panelHeight = sidePanel.scrollHeight;
    const containerHeight = sidePanel.clientHeight;
    gameState.maxScrollPosition = Math.max(0, panelHeight - containerHeight);
}

// Scroll the side panel
function scrollPanel(direction) {
    const sidePanel = document.querySelector('.side-panel');
    const scrollAmount = 100; // pixels to scroll
    
    if (direction === 'up') {
        gameState.scrollPosition = Math.max(0, gameState.scrollPosition - scrollAmount);
    } else {
        gameState.scrollPosition = Math.min(gameState.maxScrollPosition, gameState.scrollPosition + scrollAmount);
    }
    
    sidePanel.scrollTo({
        top: gameState.scrollPosition,
        behavior: 'smooth'
    });
      }
