/**
 * @template {HTMLTextAreaElement | HTMLInputElement} T
 */
export class DraftManager<T extends HTMLTextAreaElement | HTMLInputElement> {
    /**
     * @param {T} inputElement
     * @param {(draftValue: string, draft: DraftManager<T>) => void} [onSaveCallback]
     *  * @param {Object} [options]
     * @param {number} [options.historyLimit]
     * @param {number} [options.autosaveSeconds]
     * @param {number} [options.minLengthToSave]
     * @param {boolean} [options.trimOnSave]
     */
    constructor(inputElement: T, onSaveCallback?: (draftValue: string, draft: DraftManager<T>) => void, options?: {
        historyLimit?: number;
        autosaveSeconds?: number;
        minLengthToSave?: number;
        trimOnSave?: boolean;
    });
    /** @type {number} */
    autosaveSeconds: number;
    /** @type {(draftValue: string, draft: DraftManager<T>) => void} */
    onSaveCallback: (draftValue: string, draft: DraftManager<T>) => void;
    /**
     * @returns {T}
     */
    get inputElement(): T;
    /**
     * Get draft value
     * @returns {string}
     */
    get draftValue(): string;
    /**
     * Get history size
     * @returns {number}
     */
    get historySize(): number;
    /**
     * Checks if the history of inputs is not empty.
     * @returns {boolean}
     */
    get hasHistory(): boolean;
    /**
     * Gets whether the draft manager is currently listening for input events.
     * @returns {boolean} - Whether the draft manager is currently listening for input events.
     */
    get isActive(): boolean;
    /**
     * Starts listening for input events.
     * If the input element is already being listened to, this method does nothing.
     */
    start(): void;
    /**
     * Stop listening for input events.
     * If the input element is not currently being listened to, this method does nothing.
     */
    stop(): void;
    /**
     * Saves the current input to the history.
     * If saveHistory is false, the history will be cleared after retrieving it.
     */
    save(): void;
    /**
     * Forces the saving of the current input to the history.
     * Unlike save(), this method will not trigger a debounced save.
     * If saveHistory is false, the history will be cleared after retrieving it.
     * @param {string|null} [value] - The value to save to the history. If null, the current input value is used.
     */
    forceSave(value?: string | null): void;
    /**
     * Sets whether the history of inputs should be saved or not.
     * If set to false, the history will be cleared after retrieving it.
     * @param {boolean} value - Whether to save the history of inputs or not.
     */
    set saveHistory(value: boolean);
    /**
     * Gets whether the history of inputs should be saved or not.
     * If set to false, the history will be cleared after retrieving it.
     * @returns {boolean} - Whether the history of inputs should be saved or not.
     */
    get saveHistory(): boolean;
    /**
     * Clears the history of inputs.
     */
    clearHistory(): void;
    /**
     * Get the history of inputs.
     * If clearHistory is true, the history will be cleared after retrieving it.
     * @param {boolean} clearHistory - Whether to clear the history after retrieving it.
     * @returns {Array<string>} - The history of inputs.
     */
    getHistory(clearHistory?: boolean): Array<string>;
    /**
     * Cancels any pending save triggered by save().
     * If there is no pending save, this method does nothing.
     */
    cancelPendingSave(): void;
    destroy(): void;
    #private;
}
