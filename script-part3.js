// Start a random encounter
function startRandomEncounter() {
    if (gameState.inBattle || Math.random() > 0.15) return; // 15% chance of battle
    
    const enemies = [
        { name: "Дикий кабан", health: 30, attack: 8, icon: "🐗" },
        { name: "Голодный волк", health: 25, attack: 10, icon: "🐺" },
        { name: "Разъяренный медведь", health: 50, attack: 15, icon: "🐻" },
        { name: "Ядовитая змея", health: 20, attack: 12, icon: "🐍" }
    ];
    
    gameState.battleEnemy = {...enemies[Math.floor(Math.random() * enemies.length)]};
    gameState.inBattle = true;
    
    // Setup battle UI
    document.getElementById('player-battle-name').textContent = 
        `${gameState.player.class} (Ур. ${gameState.player.level})`;
    document.getElementById('enemy-name').textContent = gameState.battleEnemy.name;
    document.getElementById('player-battle-health').style.width = '100%';
    document.getElementById('enemy-health').style.width = '100%';
    
    // Clear battle log
    document.getElementById('battle-log').innerHTML = '';
    addBattleLog(`На вас напал ${gameState.battleEnemy.name}!`);
    
    // Show battle screen
    document.getElementById('battle-screen').style.display = 'flex';
    
    // Update battle cards
    updateBattleCards();
}

// Update battle cards
function updateBattleCards() {
    const battleCards = document.getElementById('battle-cards');
    battleCards.innerHTML = '';
    
    gameState.cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.innerHTML = `
            <div class="card-cost">${card.cost}</div>
            <div class="card-icon">${card.icon}</div>
            <div class="card-name">${card.name}</div>
        `;
        cardElement.addEventListener('click', () => useCardInBattle(card));
        battleCards.appendChild(cardElement);
    });
}

// Use a card in battle
function useCardInBattle(card) {
    if (!gameState.inBattle) return;
    
    // Check if player has enough energy
    if (gameState.player.energy < card.cost) {
        addBattleLog('Недостаточно энергии для использования карты!');
        return;
    }
    
    // Use energy
    gameState.player.energy -= card.cost;
    
    // Apply card effect
    switch(card.type) {
        case 'attack':
            const damage = card.value + (gameState.player.class === 'warrior' ? Math.floor(card.value * 0.2) : 0);
            gameState.battleEnemy.health -= damage;
            addBattleLog(`Вы используете "${card.name}" и наносите ${damage} урона!`);
            break;
            
        case 'defense':
            // Defense logic would go here in a more complex implementation
            addBattleLog(`Вы используете "${card.name}" и готовитесь к защите!`);
            break;
            
        case 'heal':
            gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + card.value);
            addBattleLog(`Вы используете "${card.name}" и восстанавливаете ${card.value} здоровья!`);
            break;
    }
    
    // Update UI
    updateUI();
    document.getElementById('enemy-health').style.width = `${(gameState.battleEnemy.health / 50) * 100}%`;
    document.getElementById('player-battle-health').style.width = `${gameState.player.health}%`;
    
    // Check if enemy is defeated
    if (gameState.battleEnemy.health <= 0) {
        endBattle(true);
        return;
    }
    
    // Enemy attack
    setTimeout(enemyAttack, 1000);
}

// Enemy attack in battle
function enemyAttack() {
    if (!gameState.inBattle) return;
    
    const damage = gameState.battleEnemy.attack;
    gameState.player.health -= damage;
    
    addBattleLog(`${gameState.battleEnemy.name} атакует и наносит ${damage} урона!`);
    
    // Update UI
    updateUI();
    document.getElementById('player-battle-health').style.width = `${gameState.player.health}%`;
    
    // Check if player is defeated
    if (gameState.player.health <= 0) {
        endBattle(false);
    }
}

// Flee from battle
function fleeBattle() {
    if (!gameState.inBattle) return;
    
    const success = Math.random() < 0.7; // 70% chance to escape
    
    if (success) {
        addBattleLog('Вы успешно сбежали из боя!');
        endBattle(null);
    } else {
        addBattleLog('Вам не удалось сбежать!');
        setTimeout(enemyAttack, 1000);
    }
}

// End battle
function endBattle(playerWon) {
    if (playerWon) {
        const expGained = 20;
        gainExperience(expGained);
        addBattleLog(`Вы победили! Получено ${expGained} опыта.`);
        
        // Chance to get loot
        if (Math.random() < 0.5) {
            gameState.inventory.food += 1;
            addBattleLog('Вы нашли еду на теле врага!');
        }
    } else if (playerWon === false) {
        addBattleLog('Вы потерпели поражение!');
        gameOver();
    }
    
    // Hide battle screen after a delay
    setTimeout(() => {
        document.getElementById('battle-screen').style.display = 'none';
        gameState.inBattle = false;
        gameState.battleEnemy = null;
    }, 3000);
}

// Add message to battle log
function addBattleLog(message) {
    const log = document.getElementById('battle-log');
    const entry = document.createElement('div');
    entry.textContent = message;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}

// Use a card outside of battle
function useCard(card) {
    if (gameState.inBattle) return;
    
    // Check if player has enough energy
    if (gameState.player.energy < card.cost) {
        showNotification('Недостаточно энергии для использования карты!');
        return;
    }
    
    // Use energy
    gameState.player.energy -= card.cost;
    
    // Apply card effect
    switch(card.type) {
        case 'heal':
            gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + card.value);
            showNotification(`Вы используете "${card.name}" и восстанавливаете ${card.value} здоровья!`);
            break;
        default:
            showNotification(`Карта "${card.name}" можно использовать только в бою!`);
            // Refund energy
            gameState.player.energy += card.cost;
            break;
    }
    
    updateUI();
}

// Show notification
function showNotification(message) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    
    notificationText.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Start the game
function startGame() {
    if (!gameState.player.class) {
        showNotification('Пожалуйста, выберите класс!');
        return;
    }
    
    document.getElementById('class-modal').style.display = 'none';
    gameState.gameActive = true;
    
    // Start game loop
    gameLoop();
}

// Main game loop
function gameLoop() {
    if (!gameState.gameActive) return;
    
    // Update time
    gameState.time.secondsRemaining--;
    
    if (gameState.time.secondsRemaining <= 0) {
        // Switch between day and night
        gameState.time.isDay = !gameState.time.isDay;
        gameState.time.totalSeconds = gameState.time.isDay ? 60 : 40;
        gameState.time.secondsRemaining = gameState.time.totalSeconds;
        
        if (gameState.time.isDay) {
            // New day
            gameState.time.day++;
            
            // Check win condition
            if (gameState.time.day > 365) {
                winGame();
                return;
            }
            
            // Daily hunger and health effects
            gameState.player.hunger = Math.max(0, gameState.player.hunger - 20);
            
            if (gameState.player.hunger <= 0) {
                gameState.player.health -= 10;
                showNotification('Вы голодаете и теряете здоровье!');
            }
            
            // Random events
            if (Math.random() < 0.2) {
                showRandomEvent();
            }
        }
    }
    
    // Update UI
    updateUI();
    renderWorld();
    
    // Continue game loop
    setTimeout(gameLoop, 1000);
         }
