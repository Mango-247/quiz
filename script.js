let foods = [];
let currentFood = null;
let inputsDisabled = false;

async function fetchFoods() {
    const response = await fetch('foods.json');
    foods = await response.json();
}

function getRandomFood() {
    const randomIndex = Math.floor(Math.random() * foods.length);
    return foods[randomIndex];
}

function displayFood(food) {
    const foodNameDiv = document.getElementById('food-name');
    foodNameDiv.textContent = food.food;
    const quantity = document.getElementById('quantity');
    quantity.textContent = `Quantity: ${food.quantity}`;
}

function lockInputs() {
    const inputs = document.querySelectorAll('.guess-input');
    inputs.forEach(input => input.disabled = true);
    inputsDisabled = true;
}

function unlockInputs() {
    const inputs = document.querySelectorAll('.guess-input');
    inputs.forEach(input => input.disabled = false);
    inputsDisabled = false;
}

function updateSubmitButtonState() {
    const inputs = document.querySelectorAll('.guess-input');
    const submitButton = document.getElementById('submit');
    const allFilled = Array.from(inputs).every(input => input.value.trim() !== '');
    submitButton.disabled = !allFilled;
}

function enforceCharacterLimit(event, maxLength = 8) {
    const element = event.target;
    const value = element.textContent;
    const key = event.key;

    if (value.length >= maxLength && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        event.preventDefault();
    }
}

function addPlayerInput() {
    const container = document.getElementById('players-container');
    const currentPlayers = container.children.length;

    if (currentPlayers < 8) {
        const newRow = document.createElement('div');
        newRow.classList.add('player-row');
        newRow.style.display = 'flex'; 
        newRow.style.alignItems = 'center'; 

        const newLabel = document.createElement('div');
        newLabel.classList.add('player-label');
        newLabel.contentEditable = "true";
        newLabel.textContent = `Player ${currentPlayers + 1}`;
        newLabel.addEventListener('keydown', event => enforceCharacterLimit(event));

        const newInput = document.createElement('input');
        newInput.type = 'number';
        newInput.classList.add('guess-input');
        newInput.placeholder = 'Enter guess (mg)';
        newInput.disabled = inputsDisabled;

        const addButton = createButton('+', 'add-button', addPlayerInput);
        const removeButton = createButton('-', 'remove-button', () => {
            newRow.remove();
            updateButtons();
            updateSubmitButtonState();
        });

        newInput.addEventListener('input', updateSubmitButtonState);

        newRow.appendChild(newLabel);
        newRow.appendChild(newInput);
        newRow.appendChild(addButton);
        newRow.appendChild(removeButton);
        container.appendChild(newRow);

        updateButtons();
        syncLeaderboardWithPlayers();
    }
}

function createButton(text, className, onClick) {
    const button = document.createElement('button');
    button.classList.add(className);
    button.textContent = text;
    button.style.width = '36px'; 
    button.style.height = '36px'; 
    button.style.display = 'flex';
    button.style.justifyContent = 'center';
    button.style.alignItems = 'center';
    button.style.fontSize = '16px'; 
    button.style.fontWeight = 'bold';
    button.style.border = 'none';
    button.style.borderRadius = '50%'; 
    button.style.backgroundColor = 'red';
    button.style.color = 'white';
    button.style.padding = '0'; 
    button.style.textAlign = 'center';
    button.style.boxSizing = 'border-box';
    button.style.cursor = 'pointer'; 
    button.addEventListener('click', onClick);
    return button;
}

function updateButtons() {
    const container = document.getElementById('players-container');
    const playerRows = container.children;

    Array.from(playerRows).forEach((row, index) => {
        const addButton = row.querySelector('.add-button');
        const removeButton = row.querySelector('.remove-button');
        console.log(index)
        if (index === playerRows.length - 1) {
            if (addButton) {
                addButton.style.display = playerRows.length < 8 ? 'inline-block' : 'none';
            }
            if (removeButton) {
                removeButton.style.display = playerRows.length > 1 ? 'inline-block' : 'none';
            }
        } else {

            addButton.style.display = 'none';
            if (removeButton) {
                removeButton.style.display = 'none';
            }
        }
    });
}

function findClosestPlayer() {
    const inputs = document.querySelectorAll('.guess-input');
    const playerLabels = document.querySelectorAll('.player-label');
    const closestPlayerDiv = document.getElementById('closest-player');

    let closestPlayer = null;
    let closestDiff = Infinity;
    let isTie = false;

    const cleanOxalate = parseFloat(String(currentFood.oxalate).replace(/[^\d.-]/g, ''));

    inputs.forEach((input, index) => {
        const guess = parseFloat(input.value);
        if (!isNaN(guess)) {
            const diff = Math.abs(cleanOxalate - guess);
            if (diff < closestDiff) {
                closestPlayer = playerLabels[index].textContent;
                closestDiff = diff;
                isTie = false;
            } else if (diff === closestDiff) {
                isTie = true;
            }
        }
    });

    if (isTie) {
        closestPlayerDiv.textContent = "It's a tie!";
    } else if (closestDiff === 0) {
        closestPlayerDiv.textContent = `${closestPlayer} got it right!`;
    } else {
        closestPlayerDiv.textContent = `${closestPlayer} was the closest!`;
    }
}

let playerScores = {}; // Track player scores by name

function initializeLeaderboard() {
    const leaderboardDiv = document.getElementById('leaderboard');
    const playerLabels = document.querySelectorAll('.player-label');
    playerLabels.forEach(playerLabel => {
        const playerName = playerLabel.textContent.trim();
        playerScores[playerName] = 0; // Initialize all players with 0 points
    });
    updateLeaderboard();
}

function updateLeaderboard() {
    const leaderboardDiv = document.getElementById('leaderboard');
    leaderboardDiv.innerHTML = ''; // Clear current leaderboard

    Object.entries(playerScores)
        .sort(([, a], [, b]) => b - a) // Sort by scores, descending
        .forEach(([player, score]) => {
            const entry = document.createElement('div');
            entry.textContent = `${player}: ${score} points`;
            leaderboardDiv.appendChild(entry);
        });
}

function awardPoints() {
    const inputs = document.querySelectorAll('.guess-input');
    const playerLabels = document.querySelectorAll('.player-label');

    let closestPlayer = null;
    let closestDiff = Infinity;
    let isTie = false;

    const cleanOxalate = parseFloat(String(currentFood.oxalate).replace(/[^\d.-]/g, ''));

    inputs.forEach((input, index) => {
        const guess = parseFloat(input.value);
        if (!isNaN(guess)) {
            const diff = Math.abs(cleanOxalate - guess);
            if (diff < closestDiff) {
                closestPlayer = playerLabels[index].textContent.trim();
                closestDiff = diff;
                isTie = false;
            } else if (diff === closestDiff) {
                isTie = true;
            }
        }
    });

    if (closestDiff === 0) {
        // Exact match
        playerScores[closestPlayer] += 2;
    } else if (!isTie) {
        // Closest match
        playerScores[closestPlayer] += 1;
    }
    updateLeaderboard();
}

function syncLeaderboardWithPlayers() {
    const playerRows = document.querySelectorAll('.player-row');
    playerScores = {}; // Reset the scores

    playerRows.forEach(row => {
        const playerName = row.querySelector('.player-label').textContent.trim();
        playerScores[playerName] = playerScores[playerName] || 0; // Initialize new players with 0
    });

    updateLeaderboard();
}


document.addEventListener('DOMContentLoaded', () => {
    fetchFoods().then(() => {
        const rerollButton = document.getElementById('reroll');
        const submitButton = document.getElementById('submit');
        const resultDiv = document.getElementById('result');
        const input = document.querySelector('.guess-input');
        const firstPlayerLabel = document.querySelector('.player-label');

        currentFood = getRandomFood();
        displayFood(currentFood);
        initializeLeaderboard();

        firstPlayerLabel.addEventListener('keydown', event => enforceCharacterLimit(event));

        rerollButton.addEventListener('click', () => {
            resultDiv.textContent = '';
            document.getElementById('closest-player').textContent = '';
            currentFood = getRandomFood();
            displayFood(currentFood);
            unlockInputs();
            const inputs = document.querySelectorAll('.guess-input');
            inputs.forEach(input => input.value = '');
        });

        submitButton.addEventListener('click', () => {
            lockInputs();
            resultDiv.textContent = `Actual content: ${currentFood.oxalate}`;
            findClosestPlayer();
            awardPoints();
            submitButton.disabled = true;
        });

        input.addEventListener('input', updateSubmitButtonState);

        document.querySelector('.add-button').addEventListener('click', () => {
            addPlayerInput();
            syncLeaderboardWithPlayers();
        });

        updateSubmitButtonState();
    });
});
