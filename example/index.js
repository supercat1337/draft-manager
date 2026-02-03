import { DraftManager } from '../dist/draft-manager.esm.js';

// DOM Elements
const messageInput = document.getElementById('messageInput');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const forceSaveBtn = document.getElementById('forceSaveBtn');
const cancelSaveBtn = document.getElementById('cancelSaveBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const getHistoryBtn = document.getElementById('getHistoryBtn');
const clearLogBtn = document.getElementById('clearLogBtn');
const statusDiv = document.getElementById('status');
const currentDraft = document.getElementById('currentDraft');
const historySize = document.getElementById('historySize');
const lastSaved = document.getElementById('lastSaved');
const historyList = document.getElementById('historyList');
const eventLog = document.getElementById('eventLog');
const autosaveSecondsInput = document.getElementById('autosaveSeconds');
const historyLimitInput = document.getElementById('historyLimit');
const minLengthToSaveInput = document.getElementById('minLengthToSave');
const saveHistoryCheckbox = document.getElementById('saveHistory');

let draftManager = null;
let lastSaveTime = null;

// Initialize DraftManager
function initDraftManager() {
    if (draftManager) {
        draftManager.destroy();
    }

    const options = {
        historyLimit: parseInt(historyLimitInput.value) || 50,
        autosaveSeconds: parseFloat(autosaveSecondsInput.value) || 3,
        minLengthToSave: parseInt(minLengthToSaveInput.value) || 0,
    };

    draftManager = new DraftManager(
        messageInput,
        (draftValue, draft) => {
            // Callback when draft is saved
            lastSaveTime = new Date();
            updateStatus();
            logEvent(`Draft saved: "${truncateText(draftValue, 50)}"`);
        },
        options
    );

    draftManager.saveHistory = saveHistoryCheckbox.checked;
    updateStatus();
    logEvent('DraftManager initialized');
}

// Update status display
function updateStatus() {
    if (!draftManager) {
        statusDiv.textContent = 'DraftManager is NOT initialized';
        statusDiv.className = 'status status-inactive';
        return;
    }

    const isActive = draftManager.isActive;

    statusDiv.innerHTML = isActive
        ? '✅ DraftManager is ACTIVE and tracking input'
        : '❌ DraftManager is INACTIVE';
    statusDiv.className = isActive ? 'status status-active' : 'status status-inactive';

    // Update current draft
    currentDraft.textContent = draftManager.draftValue
        ? `"${truncateText(draftManager.draftValue, 30)}"`
        : 'Empty';

    // Update history size
    historySize.textContent = draftManager.historySize;

    // Update last saved time
    if (lastSaveTime) {
        lastSaved.textContent = formatTime(lastSaveTime);
    }

    updateHistoryList();

    startBtn.className = isActive ? 'secondary-btn' : 'primary-btn';
    stopBtn.className = isActive ? 'primary-btn' : 'secondary-btn';
}

// Update history list display
function updateHistoryList() {
    if (!draftManager) return;

    const history = draftManager.getHistory();
    historyList.innerHTML = '';

    if (history.length === 0) {
        historyList.innerHTML = '<div class="history-item">No draft history yet</div>';
        return;
    }

    // Show newest first
    history
        .slice()
        .reverse()
        .forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.textContent = `${history.length - index}. ${truncateText(item, 100)}`;
            historyList.appendChild(div);
        });
}

// Log events
function logEvent(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.innerHTML = `<span class="timestamp">[${timestamp}]</span> <span class="message">${message}</span>`;
    eventLog.appendChild(logEntry);
    eventLog.scrollTop = eventLog.scrollHeight;
}

// Utility functions
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

function formatTime(date) {
    return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

// Event Listeners
startBtn.addEventListener('click', () => {
    if (!draftManager) {
        initDraftManager();
    }
    draftManager.start();
    updateStatus();
    logEvent('Started tracking input');
});

stopBtn.addEventListener('click', () => {
    if (draftManager) {
        draftManager.stop();
        updateStatus();
        logEvent('Stopped tracking input');
    }
});

saveBtn.addEventListener('click', () => {
    if (draftManager) {
        draftManager.save();
        logEvent('Manual save triggered');
    }
});

forceSaveBtn.addEventListener('click', () => {
    if (draftManager) {
        draftManager.forceSave();
        logEvent('Force save triggered');
    }
});

cancelSaveBtn.addEventListener('click', () => {
    if (draftManager) {
        draftManager.cancelPendingSave();
        logEvent('Pending save cancelled');
    }
});

clearBtn.addEventListener('click', () => {
    messageInput.value = '';
    messageInput.focus();
    logEvent('Input cleared');
});

clearHistoryBtn.addEventListener('click', () => {
    if (draftManager) {
        draftManager.clearHistory();
        updateHistoryList();
        updateStatus();
        logEvent('History cleared');
    }
});

getHistoryBtn.addEventListener('click', () => {
    if (draftManager) {
        updateHistoryList();
        logEvent('History retrieved');
    }
});

clearLogBtn.addEventListener('click', () => {
    eventLog.innerHTML = '';
    logEvent('Log cleared');
});

// Configuration change listeners
[autosaveSecondsInput, historyLimitInput, minLengthToSaveInput].forEach(input => {
    input.addEventListener('change', () => {
        if (draftManager) {
            initDraftManager(); // Reinitialize with new settings
            logEvent('Configuration updated');
        }
    });
});

saveHistoryCheckbox.addEventListener('change', () => {
    if (draftManager) {
        draftManager.saveHistory = saveHistoryCheckbox.checked;
        logEvent(`Save history ${saveHistoryCheckbox.checked ? 'enabled' : 'disabled'}`);
    }
});

// Periodically update status
setInterval(() => {
    if (draftManager) {
        updateStatus();
        updateHistoryList();
    }
}, 1000);

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    initDraftManager();
    logEvent('Page loaded');
});
