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

// Reminders elements
const remindersBtn = document.getElementById('btn-reminders');
const remindersSheet = document.getElementById('reminders-sheet');
const closeRemindersSheetBtn = document.getElementById('close-reminders-sheet');
const remindersListEl = document.getElementById('reminders-list');
const reminderTimeInput = document.getElementById('reminder-time');
const addReminderBtn = document.getElementById('add-reminder-btn');
const reminderPermissionMsg = document.getElementById('reminder-permission-msg');

// Constants
const SQUARE_VALUE = 50; // Each square represents 50 calories
const STORAGE_KEY = 'calorieGridData';
const REMINDERS_KEY = 'calorieGridReminders';
const FIRED_TODAY_KEY = 'calorieGridFiredToday';

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

// ── Reminders ────────────────────────────────────────────────────────────────

function loadReminders() {
    const raw = localStorage.getItem(REMINDERS_KEY);
    return raw ? JSON.parse(raw) : [];
}

async function saveReminders(reminders) {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    // Sync to Cache Storage so the service worker can read it during periodic sync
    if ('caches' in window) {
        try {
            const cache = await caches.open('reminders-v1');
            await cache.put('/reminders-data', new Response(JSON.stringify(reminders), {
                headers: { 'Content-Type': 'application/json' }
            }));
        } catch (e) { /* non-critical */ }
    }
}

function formatTime(timeStr) {
    return timeStr; // already "HH:MM" in 24-hr format
}

function getFiredToday() {
    const raw = localStorage.getItem(FIRED_TODAY_KEY);
    return raw ? JSON.parse(raw) : {};
}

function wasAlreadyFiredToday(timeStr) {
    return getFiredToday()[timeStr] === new Date().toDateString();
}

function markFiredToday(timeStr) {
    const fired = getFiredToday();
    fired[timeStr] = new Date().toDateString();
    localStorage.setItem(FIRED_TODAY_KEY, JSON.stringify(fired));
}

async function fireReminderNotification(timeStr) {
    try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification('Time to track your meal!', {
            body: `It's ${formatTime(timeStr)} — don't forget to log what you ate.`,
            icon: '/icons/icon-256x256.png',
            badge: '/icons/icon-32x32.png',
            tag: 'meal-reminder',
            renotify: true,
            data: { url: '/' }
        });
    } catch (e) {
        // Fallback for environments where SW isn't controlling the page yet
        if (Notification.permission === 'granted') {
            new Notification('Time to track your meal!', {
                body: `It's ${formatTime(timeStr)} — don't forget to log what you ate.`,
                icon: '/icons/icon-256x256.png'
            });
        }
    }
}

function checkAndFireReminders() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const reminders = loadReminders();
    if (!reminders.length) return;
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    for (const reminder of reminders) {
        if (reminder.time === currentTime && !wasAlreadyFiredToday(reminder.time)) {
            markFiredToday(reminder.time);
            fireReminderNotification(reminder.time);
        }
    }
}

function renderRemindersList() {
    const reminders = loadReminders();
    if (!reminders.length) {
        remindersListEl.innerHTML = '<p class="reminders-empty">No reminders yet</p>';
        return;
    }
    remindersListEl.innerHTML = reminders.map(r => `
        <div class="reminder-item">
            <span class="reminder-time-label">${formatTime(r.time)}</span>
            <button class="reminder-delete-btn" data-id="${r.id}">Delete</button>
        </div>
    `).join('');
    remindersListEl.querySelectorAll('.reminder-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => handleDeleteReminder(btn.dataset.id));
    });
}

function updateTimePlaceholder() {
    reminderTimeInput.closest('.time-input-wrapper').dataset.empty = reminderTimeInput.value ? 'false' : 'true';
}

async function handleAddReminder() {
    const timeValue = reminderTimeInput.value;
    if (!timeValue) return;

    if (!('Notification' in window)) {
        reminderPermissionMsg.textContent = 'Notifications are not supported in this browser.';
        reminderPermissionMsg.style.display = 'block';
        return;
    }

    if (Notification.permission !== 'granted') {
        const result = await Notification.requestPermission();
        if (result !== 'granted') {
            reminderPermissionMsg.textContent = 'Enable notifications in your browser settings to use reminders.';
            reminderPermissionMsg.style.display = 'block';
            return;
        }
    }

    reminderPermissionMsg.style.display = 'none';

    const reminders = loadReminders();
    if (reminders.some(r => r.time === timeValue)) return; // no duplicates

    reminders.push({ id: Date.now().toString(), time: timeValue });
    reminders.sort((a, b) => a.time.localeCompare(b.time));
    await saveReminders(reminders);
    reminderTimeInput.value = '';
    updateTimePlaceholder();
    renderRemindersList();
    registerPeriodicSync();
}

async function handleDeleteReminder(id) {
    const reminders = loadReminders().filter(r => r.id !== id);
    await saveReminders(reminders);
    renderRemindersList();
}

async function registerPeriodicSync() {
    if (!('serviceWorker' in navigator)) return;
    try {
        const registration = await navigator.serviceWorker.ready;
        if ('periodicSync' in registration) {
            await registration.periodicSync.register('check-reminders', {
                minInterval: 60 * 60 * 1000
            });
        }
    } catch (e) { /* not supported or permission denied */ }
}

// ─────────────────────────────────────────────────────────────────────────────

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

remindersBtn.addEventListener('click', () => {
    renderRemindersList();
    reminderPermissionMsg.style.display = 'none';
    openBottomSheet(remindersSheet);
});
closeRemindersSheetBtn.addEventListener('click', () => closeBottomSheet(remindersSheet));
addReminderBtn.addEventListener('click', handleAddReminder);
reminderTimeInput.addEventListener('change', updateTimePlaceholder);
reminderTimeInput.addEventListener('input', updateTimePlaceholder);

overlay.addEventListener('click', () => {
    if (calorieSheet.classList.contains('show')) {
        closeBottomSheet(calorieSheet);
    } else if (resetSheet.classList.contains('show')) {
        closeBottomSheet(resetSheet);
    } else if (remindersSheet.classList.contains('show')) {
        closeBottomSheet(remindersSheet);
    }
});

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadStateFromStorage();
    updateTimePlaceholder();
    setInterval(checkAndFireReminders, 30_000);
    registerPeriodicSync();
});