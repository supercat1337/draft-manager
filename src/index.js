// @ts-check

/**
 * @template {HTMLTextAreaElement | HTMLInputElement} T
 */
export class DraftManager {
    #isActive = false;
    #saveHistory = false;
    /** @type {string[]} */
    #history = [];
    /** @type {string} */
    #draftValue = '';
    /** @type {number} */
    #debounceTimer = 0;
    /** @type {number} */
    #historyLimit = 50;
    /** @type {T} */
    #inputElement;
    /** @type {number} */
    #minLengthToSave = 0;
    /** @type {boolean} */
    #isSaving = false;
    /** @type {boolean} */
    #isComposing = false;
    /** @type {boolean} */
    #trimOnSave = false;

    /** @type {number} */
    autosaveSeconds = 3;

    /** @type {(draftValue: string, draft: DraftManager<T>) => void} */
    onSaveCallback = (draftValue, draft) => {};

    /**
     * @param {T} inputElement
     * @param {(draftValue: string, draft: DraftManager<T>) => void} [onSaveCallback]
     *  * @param {Object} [options]
     * @param {number} [options.historyLimit]
     * @param {number} [options.autosaveSeconds]
     * @param {number} [options.minLengthToSave]
     * @param {boolean} [options.trimOnSave]
     */
    constructor(inputElement, onSaveCallback, options = {}) {
        this.#validateInputElement(inputElement);

        this.#inputElement = inputElement;
        this.#draftValue = this.#inputElement.value;

        if (onSaveCallback) {
            this.onSaveCallback = onSaveCallback;
        }

        this.#applyOptions(options);
    }

    /**
     * @param {T} element
     */
    #validateInputElement(element) {
        if (!(element instanceof HTMLTextAreaElement) && !(element instanceof HTMLInputElement)) {
            throw new Error('Invalid input element');
        }
    }

    /**
     * @param {Object} options
     * @param {number} [options.historyLimit]
     * @param {number} [options.autosaveSeconds]
     * @param {number} [options.minLengthToSave]
     * @param {boolean} [options.trimOnSave]
     */
    #applyOptions(options) {
        const { historyLimit, autosaveSeconds, minLengthToSave } = options;

        if (historyLimit !== undefined) {
            if (historyLimit < 0) throw new Error('historyLimit must be non-negative');
            this.#historyLimit = historyLimit;
        }

        if (autosaveSeconds !== undefined) {
            if (autosaveSeconds < 0) throw new Error('autosaveSeconds must be non-negative');
            this.autosaveSeconds = autosaveSeconds;
        }

        if (minLengthToSave !== undefined) {
            if (minLengthToSave < 0) throw new Error('minLengthToSave must be non-negative');
            this.#minLengthToSave = minLengthToSave;
        }

        if (options.trimOnSave !== undefined) {
            this.#trimOnSave = options.trimOnSave;
        }
    }

    /**
     * @returns {T}
     */
    get inputElement() {
        return this.#inputElement;
    }

    /**
     * Get draft value
     * @returns {string}
     */
    get draftValue() {
        return this.#draftValue;
    }

    /**
     * Get history size
     * @returns {number}
     */
    get historySize() {
        return this.#history.length;
    }

    /**
     * Checks if the history of inputs is not empty.
     * @returns {boolean}
     */
    get hasHistory() {
        return this.#history.length > 0;
    }

    /**
     * Gets whether the draft manager is currently listening for input events.
     * @returns {boolean} - Whether the draft manager is currently listening for input events.
     */
    get isActive() {
        return this.#isActive;
    }

    /**
     * Starts listening for input events.
     * If the input element is already being listened to, this method does nothing.
     */
    start() {
        if (this.#isActive) {
            return;
        }

        this.#isActive = true;
        this.#inputElement.addEventListener('input', this.#handleInput);
        this.#inputElement.addEventListener('change', this.#handleInput);
        this.#inputElement.addEventListener('paste', this.#handlePaste);
        this.#inputElement.addEventListener('cut', this.#handleInput);
        this.#inputElement.addEventListener('compositionstart', this.#handleCompositionStart);
        this.#inputElement.addEventListener('compositionend', this.#handleCompositionEnd);
    }

    /**
     * Stop listening for input events.
     * If the input element is not currently being listened to, this method does nothing.
     */
    stop() {
        if (!this.#isActive) {
            return;
        }

        clearTimeout(this.#debounceTimer);
        this.#debounceTimer = 0;
        this.#isActive = false;
        this.#inputElement.removeEventListener('input', this.#handleInput);
        this.#inputElement.removeEventListener('change', this.#handleInput);
        this.#inputElement.removeEventListener('paste', this.#handlePaste);
        this.#inputElement.removeEventListener('cut', this.#handleInput);
        this.#inputElement.removeEventListener('compositionstart', this.#handleCompositionStart);
        this.#inputElement.removeEventListener('compositionend', this.#handleCompositionEnd);
    }

    /**
     * Saves the current input to the history.
     * If saveHistory is false, the history will be cleared after retrieving it.
     */
    save() {
        this.#saveInput();
    }

    /**
     * Forces the saving of the current input to the history.
     * Unlike save(), this method will not trigger a debounced save.
     * If saveHistory is false, the history will be cleared after retrieving it.
     * @param {string|null} [value] - The value to save to the history. If null, the current input value is used.
     */
    forceSave(value = null) {
        clearTimeout(this.#debounceTimer);
        this.#debounceTimer = 0;

        const newValue = value !== null ? value : this.inputElement.value;
        this.#draftValue = newValue;

        if (this.#saveHistory && newValue.length >= this.#minLengthToSave) {
            this.#history.push(newValue);
            if (this.#history.length > this.#historyLimit) {
                this.#history.shift();
            }
        }

        this.#triggerCallback();
    }

    /**
     * Sets whether the history of inputs should be saved or not.
     * If set to false, the history will be cleared after retrieving it.
     * @param {boolean} value - Whether to save the history of inputs or not.
     */
    set saveHistory(value) {
        this.#saveHistory = value;
        if (!value) {
            this.clearHistory();
        }
    }

    /**
     * Gets whether the history of inputs should be saved or not.
     * If set to false, the history will be cleared after retrieving it.
     * @returns {boolean} - Whether the history of inputs should be saved or not.
     */
    get saveHistory() {
        return this.#saveHistory;
    }

    /**
     * Clears the history of inputs.
     */
    clearHistory() {
        this.#history = [];
    }

    /**
     * Get the history of inputs.
     * If clearHistory is true, the history will be cleared after retrieving it.
     * @param {boolean} clearHistory - Whether to clear the history after retrieving it.
     * @returns {Array<string>} - The history of inputs.
     */
    getHistory(clearHistory = false) {
        if (clearHistory) {
            const historyCopy = this.#history;
            this.#history = [];
            return historyCopy;
        }
        return this.#history;
    }

    #handleInput = () => {
        if (this.#isComposing) return;
        this.#scheduleSave();
    };

    #handlePaste = () => {
        setTimeout(() => this.#scheduleSave(), 0);
    };

    #handleCompositionStart = () => {
        this.#isComposing = true;
    };

    #handleCompositionEnd = () => {
        this.#isComposing = false;
        this.#scheduleSave();
    };

    #scheduleSave = () => {
        clearTimeout(this.#debounceTimer);
        if (this.autosaveSeconds === 0) {
            this.#saveInput();
        } else {
            this.#debounceTimer = setTimeout(() => {
                this.#saveInput();
            }, this.autosaveSeconds * 1000);
        }
    };

    #saveInput() {
        if (this.#isSaving || !this.#inputElement) return;

        const rawValue = this.inputElement.value;
        const value = this.#trimOnSave ? rawValue.trim() : rawValue;

        // Skip if the value hasn't changed
        if (this.#draftValue === value) return;

        // Check if the value is too short
        if (value !== '' && value.length < this.#minLengthToSave) return;

        this.#isSaving = true;
        try {
            this.#draftValue = value;

            // Add to history
            if (this.#saveHistory) {
                const lastItem = this.#history[this.#history.length - 1];
                if (lastItem !== value) {
                    this.#history.push(value);

                    //Limit history size
                    if (this.#history.length > this.#historyLimit) {
                        this.#history.shift();
                    }
                }
            }

            // Trigger callback
            this.#triggerCallback();
        } finally {
            this.#isSaving = false;
        }
    }

    #triggerCallback() {
        try {
            this.onSaveCallback(this.#draftValue, this);
        } catch (error) {
            console.error('Error in onSaveCallback:', error);
        }
    }

    /**
     * Cancels any pending save triggered by save().
     * If there is no pending save, this method does nothing.
     */
    cancelPendingSave() {
        clearTimeout(this.#debounceTimer);
        this.#debounceTimer = 0;
    }

    destroy() {
        this.stop();
        clearTimeout(this.#debounceTimer);
        this.#debounceTimer = 0;
        // @ts-ignore
        this.#inputElement = null;
        this.#history = [];
        this.onSaveCallback = () => {};
    }
}
