// Setup event listeners
function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', handleKeyPress);
    
    // Action buttons
    document.getElementById('chop-btn').addEventListener('click', performAction.bind(null, 'chop'));
    document.getElementById('fish-btn').addEventListener('click', performAction.bind(null, 'fish'));
    document.getElementById('mine-btn').addEventListener('click', performAction.bind(null, 'mine'));
    document.getElementById('rest-btn').addEventListener('click', performAction.bind(null, 'rest'));
    
    // Mobile controls
    document.getElementById('up-btn').addEventListener('click', movePlayer.bind(null, 0, -1));
    document.getElementById('down-btn').addEventListener('click', movePlayer.bind(null, 0, 1));
    document.getElementById('left-btn').addEventListener('click', movePlayer.bind(null, -1, 0));
    document.getElementById('right-btn').addEventListener('click', movePlayer.bind(null, 1, 0));
    document.getElementById('action-btn').addEventListener('click', performCurrentAction);
    
    // Scroll controls
    document.getElementById('scroll-up').addEventListener('click', () => scrollPanel('up'));
    document.getElementById('scroll-down').addEventListener('click', () => scrollPanel('down'));
    
    // Scroll middle drag
    const scrollMiddle = document.getElementById('scroll-middle');
    let isDragging = false;
    let startY = 0;
    let startScroll = 0;
    
    scrollMiddle.addEventListener('mousedown', startDrag);
    scrollMiddle.addEventListener('touchstart', startDrag);
    
    function startDrag(e) {
        isDragging = true;
        startY = e.clientY || e.touches[0].clientY;
        startScroll = gameState.scrollPosition;
        e.preventDefault();
    }
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
    
    function drag(e) {
        if (!isDragging) return;
        const currentY = e.clientY || e.touches[0].clientY;
        const deltaY = currentY - startY;
        const scrollDelta = (deltaY / 2) * 3; // Multiply for better sensitivity
        
        gameState.scrollPosition = Math.max(0, Math.min(gameState.maxScrollPosition, startScroll + scrollDelta));
        
        const sidePanel = document.querySelector('.side-panel');
        sidePanel.scrollTop = gameState.scrollPosition;
    }
    
    function stopDrag() {
        isDragging = false;
    }
    
    // Class selection
    document.querySelectorAll('.class-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.class-option').forEach(opt => {
                opt.style.borderColor = 'transparent';
            });
            option.style.borderColor = 'var(--accent)';
            gameState.player.class = option.dataset.class;
        });
    });
    
    // Start game button
    document.getElementById('start-game').addEventListener('click', startGame);
    
    // Save/load buttons
    document.getElementById('save-btn').addEventListener('click', saveGame);
    document.getElementById('load-btn').addEventListener('click', loadGame);
    
    // Battle buttons
    document.getElementById('flee-btn').addEventListener('click', fleeBattle);
    
    // Restart buttons
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('win-restart-btn').addEventListener('click', restartGame);
}

// Handle keyboard controls
function handleKeyPress(e) {
    if (!gameState.gameActive || gameState.inBattle) return;
    
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            movePlayer(0, -1);
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            movePlayer(0, 1);
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            movePlayer(-1, 0);
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            movePlayer(1, 0);
            break;
        case ' ':
            performCurrentAction();
            break;
        case '1':
            performAction('chop');
            break;
        case '2':
            performAction('fish');
            break;
        case '3':
            performAction('mine');
            break;
        case '4':
            performAction('rest');
            break;
    }
}

// Move the player
function movePlayer(dx, dy) {
    if (!gameState.gameActive || gameState.inBattle) return;
    
    const newX = gameState.player.x + dx;
    const newY = gameState.player.y + dy;
    
    // Check boundaries
    if (newX < 0 || newX >= 20 || newY < 0 || newY >= 20) {
        showNotification('Вы достигли края мира!');
        return;
    }
    
    // Update player position
    gameState.player.x = newX;
    gameState.player.y = newY;
    
    // Discover cell
    gameState.world[newY][newX].discovered = true;
    
    // Consume energy
    gameState.player.energy = Math.max(0, gameState.player.energy - 2);
    
    // Random encounter check
    if (Math.random() < 0.1) { // 10% chance
        startRandomEncounter();
    }
    
    // Update UI and render
    updateUI();
    renderWorld();
}

// Perform current action based on cell type
function performCurrentAction() {
    if (!gameState.gameActive || gameState.inBattle) return;
    
    const currentCell = gameState.world[gameState.player.y][gameState.player.x];
    
    switch(currentCell.type) {
        case 'forest':
            performAction('chop');
            break;
        case 'water':
            performAction('fish');
            break;
        case 'mountain':
            performAction('mine');
            break;
        case 'base':
            performAction('rest');
            break;
        default:
            showNotification('Здесь нечего делать');
    }
}

// Perform a specific action
function performAction(action) {
    if (!gameState.gameActive || gameState.inBattle) return;
    
    const currentCell = gameState.world[gameState.player.y][gameState.player.x];
    let message = '';
    let success = false;
    
    // Check if player has enough energy
    if (gameState.player.energy < 10) {
        showNotification('Недостаточно энергии!');
        return;
    }
    
    switch(action) {
        case 'chop':
            if (currentCell.type === 'forest' && currentCell.resources.wood > 0) {
                const woodGained = calculateResourceGain('wood', 1);
                gameState.inventory.wood += woodGained;
                currentCell.resources.wood--;
                message = `Вы срубили дерево и получили ${woodGained} древесины`;
                success = true;
            } else {
                message = 'Здесь нет деревьев для рубки';
            }
            break;
            
        case 'fish':
            if (currentCell.type === 'water' && currentCell.resources.fish > 0) {
                const fishGained = calculateResourceGain('fish', 1);
                gameState.inventory.fish += fishGained;
                currentCell.resources.fish--;
                message = `Вы поймали ${fishGained} рыбы`;
                success = true;
            } else {
                message = 'Здесь нет рыбы';
            }
            break;
            
        case 'mine':
            if (currentCell.type === 'mountain' && (currentCell.resources.stone > 0 || currentCell.resources.gold > 0)) {
                let stoneGained = 0;
                let goldGained = 0;
                
                if (currentCell.resources.stone > 0) {
                    stoneGained = calculateResourceGain('stone', 1);
                    gameState.inventory.stone += stoneGained;
                    currentCell.resources.stone--;
                }
                
                if (currentCell.resources.gold > 0 && Math.random() < 0.3) {
                    goldGained = calculateResourceGain('gold', 1);
                    gameState.inventory.gold += goldGained;
                    currentCell.resources.gold--;
                }
                
                message = `Вы добыли ${stoneGained} камня` + 
                         (goldGained > 0 ? ` и ${goldGained} золота` : '');
                success = true;
            } else {
                message = 'Здесь нечего добывать';
            }
            break;
            
        case 'rest':
            if (currentCell.type === 'base') {
                gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + 20);
                gameState.player.energy = Math.min(gameState.player.maxEnergy, gameState.player.energy + 30);
                message = 'Вы отдохнули и восстановили силы';
                success = true;
            } else {
                message = 'Отдыхать можно только на базе';
            }
            break;
    }
    
    if (success) {
        // Consume energy
        gameState.player.energy = Math.max(0, gameState.player.energy - 10);
        
        // Consume hunger
        gameState.player.hunger = Math.max(0, gameState.player.hunger - 5);
        
        // Gain experience
        gainExperience(5);
    }
    
    showNotification(message);
    updateUI();
    renderWorld();
}

// Calculate resource gain with class bonuses
function calculateResourceGain(resourceType, baseAmount) {
    let multiplier = 1;
    
    switch(gameState.player.class) {
        case 'lumberjack':
            if (resourceType === 'wood') multiplier = 1.3;
            break;
        case 'fisher':
            if (resourceType === 'fish') multiplier = 1.4;
            break;
        case 'miner':
            if (resourceType === 'stone' || resourceType === 'gold') multiplier = 1.25;
            break;
    }
    
    return Math.floor(baseAmount * multiplier);
}

// Gain experience and level up
function gainExperience(amount) {
    gameState.player.experience += amount;
    
    if (gameState.player.experience >= gameState.player.nextLevelExp) {
        gameState.player.level++;
        gameState.player.experience = 0;
        gameState.player.nextLevelExp = Math.floor(gameState.player.nextLevelExp * 1.5);
        
        // Increase stats
        gameState.player.maxHealth += 10;
        gameState.player.health = gameState.player.maxHealth;
        gameState.player.maxEnergy += 5;
        gameState.player.energy = gameState.player.maxEnergy;
        
        showNotification(`Поздравляем! Вы достигли уровня ${gameState.player.level}!`);
    }
      }
