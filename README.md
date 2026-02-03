# DraftManager

A lightweight, zero-dependency JavaScript library for managing input drafts with auto-save, history tracking, and composition (IME) support. Perfect for chat applications, forms, and any text input that needs persistent draft functionality.

## ✨ Features

- **Auto-save drafts** with configurable debounce timing
- **Draft history** with size limits and duplicate prevention
- **Composition (IME) support** for international input methods
- **TypeScript ready** with full type definitions
- **Zero dependencies** - lightweight and fast
- **Comprehensive event handling** (input, paste, cut, composition events)
- **Memory-safe** with proper cleanup and destruction
- **Configurable validation** (minimum length, trimming options)

## 📦 Installation

```bash
npm install https://github.com/supercat1337/draft-manager
```

## 🚀 Quick Start

```javascript
import { DraftManager } from 'draft-manager';

// Get your input element
const messageInput = document.querySelector('#message-input');

// Create a DraftManager instance
const draftManager = new DraftManager(messageInput, (draftValue, draft) => {
    console.log('Draft saved:', draftValue);
    // Save to localStorage or send to server
    localStorage.setItem('message-draft', draftValue);
});

// Start tracking input
draftManager.start();

// Configure as needed
draftManager.saveHistory = true;
draftManager.autosaveSeconds = 2;
```

## 📖 API Documentation

### Constructor

```typescript
new DraftManager(
  inputElement: HTMLTextAreaElement | HTMLInputElement,
  onSaveCallback?: (draftValue: string, draft: DraftManager) => void,
  options?: DraftManagerOptions
)
```

#### Options

| Option            | Type      | Default | Description                              |
| ----------------- | --------- | ------- | ---------------------------------------- |
| `historyLimit`    | `number`  | `50`    | Maximum number of history items to keep  |
| `autosaveSeconds` | `number`  | `3`     | Debounce delay for auto-save in seconds  |
| `minLengthToSave` | `number`  | `0`     | Minimum text length to trigger auto-save |
| `trimOnSave`      | `boolean` | `false` | Whether to trim whitespace before saving |

### Properties

#### Getters

- `inputElement` - Returns the managed input element
- `draftValue` - Returns the current draft value
- `historySize` - Returns the number of items in history
- `hasHistory` - Returns `true` if history is not empty
- `isActive` - Returns `true` if draft manager is currently tracking
- `saveHistory` - Gets/sets whether history should be saved

#### Setters

- `saveHistory` - Enable/disable history saving (clears history when disabled)
- `autosaveSeconds` - Change the auto-save debounce delay

### Methods

#### Core Methods

- `start()` - Start tracking input events
- `stop()` - Stop tracking input events
- `save()` - Trigger immediate save (respects debounce)
- `forceSave(value?)` - Force save, ignoring debounce and validations
- `cancelPendingSave()` - Cancel any pending auto-save

#### History Management

- `getHistory(clearHistory?)` - Get history array (optionally clear after)
- `clearHistory()` - Clear all history items
- `destroy()` - Clean up all resources and event listeners

## 💡 Usage Examples

### Chat Application

```javascript
class ChatInput {
    constructor() {
        this.input = document.getElementById('chat-input');
        this.draft = new DraftManager(this.input, this.onDraftSave.bind(this), {
            historyLimit: 20,
            autosaveSeconds: 1,
            minLengthToSave: 1,
        });

        this.draft.start();
        this.draft.saveHistory = true;

        // Restore from localStorage
        const saved = localStorage.getItem('chat-draft');
        if (saved) {
            this.input.value = saved;
            this.draft.forceSave(saved);
        }
    }

    onDraftSave(value) {
        // Save to localStorage
        localStorage.setItem('chat-draft', value);

        // Optionally sync with server
        if (value.length > 0) {
            this.syncDraftToServer(value);
        }
    }

    sendMessage() {
        const message = this.input.value.trim();
        if (message) {
            // Send message logic...
            this.input.value = '';
            this.draft.forceSave(''); // Save empty state
            localStorage.removeItem('chat-draft');
        }
    }
}
```

### Form with Draft History

```javascript
// Form with undo/redo functionality
const formInput = document.getElementById('description');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');

const draftManager = new DraftManager(formInput, null, {
    historyLimit: 100,
    autosaveSeconds: 2,
    trimOnSave: true,
});

draftManager.start();
draftManager.saveHistory = true;

// Simple undo/redo using history
let historyIndex = draftManager.historySize - 1;

undoBtn.addEventListener('click', () => {
    const history = draftManager.getHistory();
    if (historyIndex > 0) {
        historyIndex--;
        formInput.value = history[historyIndex];
        draftManager.forceSave(history[historyIndex]);
    }
});

redoBtn.addEventListener('click', () => {
    const history = draftManager.getHistory();
    if (historyIndex < history.length - 1) {
        historyIndex++;
        formInput.value = history[historyIndex];
        draftManager.forceSave(history[historyIndex]);
    }
});
```

### Auto-saving Form Field

```javascript
// Auto-save form field with minimum length requirement
const commentField = document.getElementById('comment');
const statusEl = document.getElementById('save-status');

const draftManager = new DraftManager(
    commentField,
    value => {
        statusEl.textContent = `Saved at ${new Date().toLocaleTimeString()}`;
        statusEl.style.color = 'green';

        // Clear status after 2 seconds
        setTimeout(() => {
            statusEl.textContent = 'All changes saved';
            statusEl.style.color = 'gray';
        }, 2000);
    },
    {
        minLengthToSave: 3, // Only save comments with 3+ characters
        trimOnSave: false, // Keep whitespace for formatting
    }
);

// Start when user focuses the field
commentField.addEventListener('focus', () => {
    draftManager.start();
});

// Stop when user leaves the field
commentField.addEventListener('blur', () => {
    draftManager.stop();
    draftManager.save(); // Final save on blur
});
```

## 🔧 Advanced Configuration

### Handling IME (International Input)

DraftManager automatically handles IME composition events for languages like Chinese, Japanese, and Korean:

```javascript
// No special configuration needed - it just works!
const draftManager = new DraftManager(inputElement);
draftManager.start();

// The library will:
// 1. Pause saving during composition (while user selects characters)
// 2. Resume saving when composition ends
// 3. Handle all IME events properly
```

### Integration with State Management

```javascript
// Example with Vue 3 Composition API
import { ref, watch, onUnmounted } from 'vue';
import { DraftManager } from 'draft-manager';

export function useDraftManager(inputRef, options = {}) {
    const draftValue = ref('');
    let draftManager = null;

    onMounted(() => {
        if (inputRef.value) {
            draftManager = new DraftManager(
                inputRef.value,
                value => {
                    draftValue.value = value;
                    // Additional logic...
                },
                options
            );

            draftManager.start();
        }
    });

    onUnmounted(() => {
        if (draftManager) {
            draftManager.destroy();
        }
    });

    return {
        draftValue,
        draftManager,
    };
}
```

### Server Synchronization

```javascript
const draftManager = new DraftManager(inputElement, async value => {
    try {
        // Debounce server calls to prevent flooding
        await api.saveDraft({
            userId: currentUser.id,
            field: 'message',
            content: value,
            timestamp: Date.now(),
        });
    } catch (error) {
        console.error('Failed to sync draft:', error);
        // Optionally retry or save locally
        localStorage.setItem('draft-backup', value);
    }
});

// Restore from server on page load
window.addEventListener('load', async () => {
    try {
        const savedDraft = await api.getDraft(currentUser.id, 'message');
        if (savedDraft) {
            inputElement.value = savedDraft.content;
            draftManager.forceSave(savedDraft.content);
        }
    } catch (error) {
        console.error('Failed to load draft:', error);
    }
});
```

## 📚 TypeScript Support

Full TypeScript definitions are included:

```typescript
import { DraftManager } from 'draft-manager';

const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
const draftManager = new DraftManager(
    textarea,
    (value: string, draft: DraftManager<HTMLTextAreaElement>) => {
        // Type-safe callback
    }
);

// Generic type inference
const input = document.querySelector('input') as HTMLInputElement;
const inputDraft = new DraftManager(input); // Inferred as DraftManager<HTMLInputElement>
```

## 🔍 Browser Support

DraftManager supports all modern browsers that implement:

- ES2020+ features (private class fields, optional chaining)
- DOM Event API
- Promise API (for async callbacks)

| Browser | Version |
| ------- | ------- |
| Chrome  | 84+     |
| Firefox | 90+     |
| Safari  | 14.1+   |
| Edge    | 90+     |

For older browsers, use a transpiler like Babel.

## 📄 License

MIT © [supercat1337](https://github.com/supercat1337)
