// DOM Elements
const currentCaloriesEl = document.getElementById('calories-total');
const consumedCaloriesEl = document.getElementById('calories-used');
const remainingCaloriesEl = document.getElementById('calories-remaining');
const totalSquaresEl = document.getElementById('squares-total');
const usedSquaresEl = document.getElementById('squares-used');
const remainingSquaresEl = document.getElementById('squares-remaining');
const calorieGridEl = document.getElementById('calorie-grid');

// Stepper Elements
const goodCount = document.getElementById('good-count');
const badCount = document.getElementById('bad-count');
const goodMinusBtn = document.querySelector('.stepper-green .btn-minus');
const goodPlusBtn = document.querySelector('.stepper-green .btn-plus');
const badMinusBtn = document.querySelector('.stepper-red .btn-minus');
const badPlusBtn = document.querySelector('.stepper-red .btn-plus');

// Bottom Sheet Elements
const overlay = document.getElementById('overlay');
const calorieSheet = document.getElementById('calorie-sheet');
const resetSheet = document.getElementById('reset-sheet');
const closeCalorieSheetBtn = document.getElementById('close-calorie-sheet');
const closeResetSheetBtn = document.getElementById('close-reset-sheet');
const calorieValue = document.getElementById('calorie-value');
const calorieMinusBtn = document.getElementById('calorie-minus');
const caloriePlusBtn = document.getElementById('calorie-plus');
const saveCaloriesBtn = document.getElementById('save-calories');
const resetBtn = document.getElementById('btn-reset');
const cancelResetBtn = document.getElementById('reset-cancel');
const confirmResetBtn = document.getElementById('reset-confirm');

// Constants
const SQUARE_VALUE = 50; // Each square represents 50 calories
const STORAGE_KEY = 'calorieGridData';

// State
let state = {
    targetCalories: 1500,
    goodCount: 0,
    badCount: 0,
    squareHistory: [], // Array to track order of squares (contains 'good' or 'bad')
    lastUpdated: new Date().toDateString()
};

// Load data from local storage
function loadStateFromStorage() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Check if the saved data is from today
        if (parsedData.lastUpdated === new Date().toDateString()) {
            state = parsedData;
            
            // Ensure squareHistory exists
            if (!state.squareHistory) {
                state.squareHistory = [];
            }
        } else {
            // If it's a new day, reset the counts but keep the target
            state.targetCalories = parsedData.targetCalories;
            state.goodCount = 0;
            state.badCount = 0;
            state.squareHistory = [];
            state.lastUpdated = new Date().toDateString();
            saveStateToStorage();
        }
    }
    updateUI();
}

// Save data to local storage
function saveStateToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Update UI based on state
function updateUI() {
    const totalConsumed = (state.goodCount + state.badCount) * SQUARE_VALUE;
    const totalSquares = Math.floor(state.targetCalories / SQUARE_VALUE);
    const usedSquares = state.goodCount + state.badCount;
    const remainingSquares = totalSquares - usedSquares;
    const remainingCalories = state.targetCalories - totalConsumed;

    // Update header values
    currentCaloriesEl.textContent = state.targetCalories;
    consumedCaloriesEl.textContent = totalConsumed;
    remainingCaloriesEl.textContent = `${remainingCalories} kcal`;
    totalSquaresEl.textContent = totalSquares;
    usedSquaresEl.textContent = `${usedSquares} squares`;
    remainingSquaresEl.textContent = `${remainingSquares} squares`;

    // Update stepper values
    goodCount.textContent = state.goodCount;
    badCount.textContent = state.badCount;

    // Update calorie sheet value
    calorieValue.textContent = state.targetCalories;

    // Update grid
    updateGrid(totalSquares);
}

// Create and update grid
function updateGrid(totalSquares) {
    // The total squares in the grid are the largest of the totalSquares (calorie goal) 
    // or the state.squareHistory (how many squares you've added).
    // This means that if you add more squares than the budget, it will create an extra square!
    const requiredSquares = Math.max(totalSquares, state.squareHistory.length);

    // Clear the grid
    calorieGridEl.innerHTML = '';

    // Create grid squares based on history
    for (let i = 0; i < requiredSquares; i++) {
        const square = document.createElement('div');
        square.classList.add('grid-square');
        
        // Apply colors based on square history
        if (i < state.squareHistory.length) {
            if (state.squareHistory[i] === 'good') {
                square.classList.add('green');
            } else if (state.squareHistory[i] === 'bad') {
                square.classList.add('red');
            }
        }

        if (i >= totalSquares) {
            square.classList.add('extra'); // Apply special styling
        }
        
        calorieGridEl.appendChild(square);
    }
}


// Event Handlers
function handleGoodCountChange(change) {
    if (change > 0) {
        // Adding a good square
        state.goodCount += 1;
        state.squareHistory.push('good');
    } else if (change < 0 && state.goodCount > 0) {
        // Removing a square - find and remove the last 'good' square
        for (let i = state.squareHistory.length - 1; i >= 0; i--) {
            if (state.squareHistory[i] === 'good') {
                state.squareHistory.splice(i, 1);
                state.goodCount -= 1;
                break;
            }
        }
    }
    
    saveStateToStorage();
    updateUI();
}

function handleBadCountChange(change) {
    if (change > 0) {
        // Adding a bad square
        state.badCount += 1;
        state.squareHistory.push('bad');
    } else if (change < 0 && state.badCount > 0) {
        // Removing a square - find and remove the last 'bad' square
        for (let i = state.squareHistory.length - 1; i >= 0; i--) {
            if (state.squareHistory[i] === 'bad') {
                state.squareHistory.splice(i, 1);
                state.badCount -= 1;
                break;
            }
        }
    }
    
    saveStateToStorage();
    updateUI();
}

function handleCalorieTargetChange(change) {
    const newTarget = state.targetCalories + change;
    if (newTarget >= SQUARE_VALUE) { // Ensure minimum of one square
        state.targetCalories = newTarget;
        calorieValue.textContent = newTarget;
    }
}

function handleResetGrid() {
    state.goodCount = 0;
    state.badCount = 0;
    state.squareHistory = [];
    saveStateToStorage();
    updateUI();
    closeBottomSheet(resetSheet);
}

function openBottomSheet(sheet) {
    overlay.classList.add('show');
    sheet.classList.add('show');
}

function closeBottomSheet(sheet) {
    overlay.classList.remove('show');
    sheet.classList.remove('show');
}

// Event Listeners
goodMinusBtn.addEventListener('click', () => handleGoodCountChange(-1));
goodPlusBtn.addEventListener('click', () => handleGoodCountChange(1));
badMinusBtn.addEventListener('click', () => handleBadCountChange(-1));
badPlusBtn.addEventListener('click', () => handleBadCountChange(1));

calorieMinusBtn.addEventListener('click', () => handleCalorieTargetChange(-SQUARE_VALUE));
caloriePlusBtn.addEventListener('click', () => handleCalorieTargetChange(SQUARE_VALUE));

saveCaloriesBtn.addEventListener('click', () => {
    saveStateToStorage();
    updateUI();
    closeBottomSheet(calorieSheet);
});

currentCaloriesEl.addEventListener('click', () => openBottomSheet(calorieSheet));
remainingCaloriesEl.addEventListener('click', () => openBottomSheet(calorieSheet));

resetBtn.addEventListener('click', () => openBottomSheet(resetSheet));
confirmResetBtn.addEventListener('click', handleResetGrid);

closeCalorieSheetBtn.addEventListener('click', () => closeBottomSheet(calorieSheet));
closeResetSheetBtn.addEventListener('click', () => closeBottomSheet(resetSheet));
cancelResetBtn.addEventListener('click', () => closeBottomSheet(resetSheet));

overlay.addEventListener('click', () => {
    if (calorieSheet.classList.contains('show')) {
        closeBottomSheet(calorieSheet);
    } else if (resetSheet.classList.contains('show')) {
        closeBottomSheet(resetSheet);
    }
});

// Initialize app
document.addEventListener('DOMContentLoaded', loadStateFromStorage);