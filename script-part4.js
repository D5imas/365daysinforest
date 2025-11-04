// Show random event
function showRandomEvent() {
    const events = [
        "Вы нашли заброшенную хижину с припасами! +5 еды",
        "На вас напали комары! -5 энергии",
        "Вы нашли целебные травы! +10 здоровья",
        "Прошел дождь, вы промокли! -5 здоровья",
        "Вы нашли блестящий камень! +1 золото"
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    
    // Apply event effects
    if (event.includes("+5 еды")) {
        gameState.inventory.food += 5;
    } else if (event.includes("-5 энергии")) {
        gameState.player.energy = Math.max(0, gameState.player.energy - 5);
    } else if (event.includes("+10 здоровья")) {
        gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + 10);
    } else if (event.includes("-5 здоровья")) {
        gameState.player.health = Math.max(0, gameState.player.health - 5);
    } else if (event.includes("+1 золото")) {
        gameState.inventory.gold += 1;
    }
    
    showNotification(`Событие: ${event}`);
}

// Game over
function gameOver() {
    gameState.gameActive = false;
    
    document.getElementById('game-over-title').textContent = 'Игра окончена';
    document.getElementById('game-over-message').textContent = 
        `Вы не смогли выжить 365 дней в лесу. Вы прожили ${gameState.time.day} дней.`;
    
    document.getElementById('game-stats').innerHTML = `
        <p>Дней выжито: ${gameState.time.day}</p>
        <p>Уровень: ${gameState.player.level}</p>
        <p>Древесины собрано: ${gameState.inventory.wood}</p>
        <p>Камня добыто: ${gameState.inventory.stone}</p>
        <p>Рыбы поймано: ${gameState.inventory.fish}</p>
        <p>Золота найдено: ${gameState.inventory.gold}</p>
    `;
    
    document.getElementById('game-over-modal').style.display = 'flex';
}

// Win game
function winGame() {
    gameState.gameActive = false;
    
    document.getElementById('win-stats').innerHTML = `
        <p>Поздравляем! Вы выжили 365 дней в лесу!</p>
        <p>Финальный уровень: ${gameState.player.level}</p>
        <p>Древесины собрано: ${gameState.inventory.wood}</p>
        <p>Камня добыто: ${gameState.inventory.stone}</p>
        <p>Рыбы поймано: ${gameState.inventory.fish}</p>
        <p>Золота найдено: ${gameState.inventory.gold}</p>
    `;
    
    document.getElementById('win-modal').style.display = 'flex';
}

// Restart game
function restartGame() {
    // Reset game state
    gameState.player = {
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
    };
    
    gameState.time = {
        day: 1,
        isDay: true,
        secondsRemaining: 60,
        totalSeconds: 60
    };
    
    gameState.inventory = {
        wood: 0,
        stone: 0,
        fish: 0,
        gold: 0,
        food: 5
    };
    
    gameState.inBattle = false;
    gameState.battleEnemy = null;
    gameState.scrollPosition = 0;
    
    // Hide modals
    document.getElementById('game-over-modal').style.display = 'none';
    document.getElementById('win-modal').style.display = 'none';
    
    // Regenerate world
    generateWorld();
    renderWorld();
    updateUI();
    
    // Reset scroll
    const sidePanel = document.querySelector('.side-panel');
    sidePanel.scrollTop = 0;
    calculateMaxScroll();
    
    // Show class selection
    document.getElementById('class-modal').style.display = 'flex';
}

// Save game
function saveGame() {
    const saveData = {
        player: gameState.player,
        time: gameState.time,
        inventory: gameState.inventory,
        world: gameState.world
    };
    
    localStorage.setItem('forestSurvivalSave', JSON.stringify(saveData));
    showNotification('Игра сохранена!');
}

// Load game
function loadGame() {
    const saveData = localStorage.getItem('forestSurvivalSave');
    
    if (saveData) {
        const loadedData = JSON.parse(saveData);
        
        gameState.player = loadedData.player;
        gameState.time = loadedData.time;
        gameState.inventory = loadedData.inventory;
        gameState.world = loadedData.world;
        
        gameState.gameActive = true;
        
        updateUI();
        renderWorld();
        calculateMaxScroll();
        
        showNotification('Игра загружена!');
        
        // Restart game loop
        if (!gameState.inBattle) {
            gameLoop();
        }
    } else {
        showNotification('Нет сохраненной игры!');
    }
}

// Initialize the game when page loads
window.addEventListener('load', initGame);
