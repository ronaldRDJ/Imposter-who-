/* ==========================================================================
   📦 1. INITIAL APP STATE MODULES
   ========================================================================== */
let gameState = {
    players: [],
    selectedWordPair: null,
    currentPassIndex: 0,
    timerInterval: null,
    timerDuration: 60,
    timerRunning: false,
    availableWords: []
};

/* ==========================================================================
   🎯 2. DOM ELEMENT SELECTORS
   ========================================================================== */
const screens = {
    menu: document.getElementById('screen-menu'),
    setup: document.getElementById('screen-setup'),
    pass: document.getElementById('screen-pass'),
    reveal: document.getElementById('screen-reveal'),
    game: document.getElementById('screen-game')
};

// Form/Input Handlers
const playerForm = document.getElementById('player-form');
const playerInput = document.getElementById('player-input');
const playerList = document.getElementById('player-list');

// Functional Navigation Buttons
const btnMenuStart = document.getElementById('btn-menu-start');
const btnMenuRules = document.getElementById('btn-menu-rules');
const btnCloseRules = document.getElementById('btn-close-rules');
const btnSetupNext = document.getElementById('btn-setup-next');
const btnPassReveal = document.getElementById('btn-pass-reveal');
const btnRevealNext = document.getElementById('btn-reveal-next');
const btnGameRestart = document.getElementById('btn-game-restart');
const btnTimerToggle = document.getElementById('btn-timer-toggle');

// Dynamic Container Views
const rulesDrawer = document.getElementById('rules-drawer');
const gamePlayerGrid = document.getElementById('game-player-grid');
const passPlayerName = document.getElementById('pass-player-name');
const timerDisplay = document.getElementById('timer-display');

// Identity Display Selectors
const revealCardBody = document.getElementById('reveal-card-body');
const revealRoleTitle = document.getElementById('reveal-role-title');
const revealWordValue = document.getElementById('reveal-word-value');
const imposterHintContainer = document.getElementById('imposter-hint-container');
const hintWordValue = document.getElementById('hint-word-value');

/* ==========================================================================
   🔄 3. ROUTING & STATE CONTROLLERS
   ========================================================================== */
function changeScreen(targetScreenKey) {
    Object.keys(screens).forEach(key => {
        screens[key].classList.remove('active');
    });
    screens[targetScreenKey].classList.add('active');
}

// Back button handler
document.querySelectorAll('.btn-back').forEach(btn => {
    btn.addEventListener('click', () => {
        if (screens.setup.classList.contains('active')) changeScreen('menu');
    });
});

/* ==========================================================================
   👥 4. PLAYER SETUP MANAGEMENT INTERFACES
   ========================================================================== */
playerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = playerInput.value.trim();
    if (!name) return;

    const newPlayer = {
        id: Date.now() + Math.random(),
        name: name,
        role: 'innocent',
        isAlive: true
    };

    gameState.players.push(newPlayer);
    playerInput.value = '';
    renderPlayerList();
    validateSetupRequirement();
});

function renderPlayerList() {
    playerList.innerHTML = '';
    gameState.players.forEach((player) => {
        const li = document.createElement('li');
        li.className = 'player-row';
        li.innerHTML = `
            <div class="player-name-wrapper">
                <span>${player.name}</span>
            </div>
            <button class="btn-remove-player" data-id="${player.id}">Remove</button>
        `;
        playerList.appendChild(li);
    });

    document.querySelectorAll('.btn-remove-player').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseFloat(e.currentTarget.getAttribute('data-id'));
            gameState.players = gameState.players.filter(p => p.id !== id);
            renderPlayerList();
            validateSetupRequirement();
        });
    });
}

function validateSetupRequirement() {
    btnSetupNext.disabled = gameState.players.length < 3;
}

/* ==========================================================================
   🎭 5. THE GAME SYSTEM LOGIC LOOPS
   ========================================================================== */
function initializeGameRound() {
    if (typeof WORD_LIBRARY === 'undefined' || WORD_LIBRARY.length === 0) {
        alert("Error: Word library database file could not be found or is empty.");
        return;
    }

    // Refresh working copy from main database dictionary if it finishes
    if (gameState.availableWords.length === 0) {
        gameState.availableWords = [...WORD_LIBRARY];
    }

    const randomIndex = Math.floor(Math.random() * gameState.availableWords.length);
    // Splice out the picked element object array
    gameState.selectedWordPair = gameState.availableWords.splice(randomIndex, 1)[0];

    gameState.players.forEach(p => {
        p.role = 'innocent';
        p.isAlive = true;
    });

    const imposterIndex = Math.floor(Math.random() * gameState.players.length);
    gameState.players[imposterIndex].role = 'imposter';

    gameState.currentPassIndex = 0;
    startPassAndPlayCycle();
}

function startPassAndPlayCycle() {
    if (gameState.currentPassIndex < gameState.players.length) {
        const currentPlayer = gameState.players[gameState.currentPassIndex];
        passPlayerName.textContent = currentPlayer.name;
        changeScreen('pass');
    } else {
        launchLiveGameBoard();
    }
}

/* ==========================================================================
   👁️ 6. CARD REVEALS & AUTOMATIC HINT SYSTEMS
   ========================================================================== */
btnPassReveal.onclick = function() {
    const player = gameState.players[gameState.currentPassIndex];
    
    // Clean canvas presets
    revealCardBody.classList.remove('imposter-theme');
    imposterHintContainer.classList.add('hidden');

    if (player.role === 'imposter') {
        revealCardBody.classList.add('imposter-theme');
        revealRoleTitle.textContent = "YOU ARE THE IMPOSTER";
        revealWordValue.textContent = "???";
        
        // Instant visual update tracking maps
        hintWordValue.textContent = gameState.selectedWordPair.hint;
        imposterHintContainer.classList.remove('hidden');
    } else {
        revealRoleTitle.textContent = "SECRET WORD";
        revealWordValue.textContent = gameState.selectedWordPair.word;
    }

    changeScreen('reveal');
};

btnRevealNext.onclick = function() {
    revealWordValue.textContent = "";
    hintWordValue.textContent = "";

    gameState.currentPassIndex++;
    startPassAndPlayCycle();
};

/* ==========================================================================
   ⏱️ 7. DISCUSSION TIMER & BOARD WRAPPERS
   ========================================================================== */
function launchLiveGameBoard() {
    resetTimerSystem();
    renderVotingGrid();
    changeScreen('game');
}

function renderVotingGrid() {
    gamePlayerGrid.innerHTML = '';
    gameState.players.forEach(player => {
        const div = document.createElement('div');
        div.className = `vote-tile ${!player.isAlive ? 'eliminated' : ''}`;
        
        let subBadge = `<span class="status-pill">Active</span>`;
        if (!player.isAlive) {
            const styleClass = player.role === 'imposter' ? 'reveal-imposter' : 'reveal-innocent';
            const labelText = player.role === 'imposter' ? 'IMPOSTER 🟥' : 'ELIMINATED';
            subBadge = `<span class="status-pill ${styleClass}">${labelText}</span>`;
        }

        div.innerHTML = `
            <span class="player-name">${player.name}</span>
            ${subBadge}
        `;

        div.addEventListener('click', () => handlePlayerEliminationToggle(player));
        gamePlayerGrid.appendChild(div);
    });
}

function handlePlayerEliminationToggle(player) {
    if (!player.isAlive) return;

    player.isAlive = false;
    stopTimerSystem();
    renderVotingGrid();

    if (player.role === 'imposter') {
        setTimeout(() => {
            alert(`🎉 VICTORY FOR THE INNOCENTS!\n\nYou successfully caught the Imposter (${player.name})!\n\nThe secret word was indeed: ${gameState.selectedWordPair.word}.`);
        }, 100);
    } else {
        const aliveInnocents = gameState.players.filter(p => p.isAlive && p.role === 'innocent').length;
        
        if (aliveInnocents <= 1) {
            const imposterObj = gameState.players.find(p => p.role === 'imposter');
            setTimeout(() => {
                alert(`🟥 IMPOSTER VICTORY!\n\nThe Imposter (${imposterObj.name}) successfully outlasted the group!\n\nThe secret word was: ${gameState.selectedWordPair.word}.`);
            }, 100);
        }
    }
}

function resetTimerSystem() {
    stopTimerSystem();
    gameState.timerDuration = 60;
    timerDisplay.textContent = gameState.timerDuration;
    timerDisplay.classList.remove('warning');
    btnTimerToggle.textContent = "Start Timer";
}

function toggleTimerSystem() {
    if (gameState.timerRunning) {
        stopTimerSystem();
    } else {
        gameState.timerRunning = true;
        btnTimerToggle.textContent = "Pause";
        gameState.timerInterval = setInterval(() => {
            gameState.timerDuration--;
            timerDisplay.textContent = gameState.timerDuration;

            if (gameState.timerDuration <= 10) {
                timerDisplay.classList.add('warning');
            }

            if (gameState.timerDuration <= 0) {
                stopTimerSystem();
                alert("⏰ Time is up! Discuss and cast your votes immediately!");
            }
        }, 1000);
    }
}

function stopTimerSystem() {
    gameState.timerRunning = false;
    btnTimerToggle.textContent = "Start Timer";
    clearInterval(gameState.timerInterval);
}

/* ==========================================================================
   🏁 8. TOP LEVEL EVENT EVENT-LISTENER HOOKS
   ========================================================================== */
btnMenuStart.addEventListener('click', () => changeScreen('setup'));

btnMenuRules.addEventListener('click', () => rulesDrawer.classList.add('active'));
btnCloseRules.addEventListener('click', () => rulesDrawer.classList.remove('active'));
rulesDrawer.addEventListener('click', (e) => {
    if (e.target === rulesDrawer) rulesDrawer.classList.remove('active');
});

btnSetupNext.addEventListener('click', initializeGameRound);
btnTimerToggle.addEventListener('click', toggleTimerSystem);
btnGameRestart.addEventListener('click', () => {
    stopTimerSystem();
    changeScreen('menu');
});
