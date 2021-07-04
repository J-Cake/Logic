import StateManager from './util/stateManager';
import {manager} from '../State';
import Timeout = NodeJS.Timeout;
import {Action} from "./Action";

export default class HistoryManager extends StateManager<{
    history: Action[][];
    historyIndex: number;
    timeout: Timeout | null;
}> {
    maxHistorySize: number;

    public static Timeout = 200; // Milliseconds;

    constructor() {
        super({
            history: [[]],
            historyIndex: 0
        });
        this.maxHistorySize = manager.setState().pref?.setState().undoSize;
    }

    push(action: Action) {
        const prev = this.setState(prev => ({
            history: [...prev.history.slice(0, prev.historyIndex), [...prev.history[prev.historyIndex], action]].slice(-this.maxHistorySize)
        }));

        if (prev.timeout)
            clearTimeout(prev.timeout)
        this.setState({
            timeout: setTimeout(() => this.setState(prev => ({
                history: [...prev.history, []],
                historyIndex: prev.history.length,
                timeout: null
            })), HistoryManager.Timeout)
        });
    }

    undo() {
        const {
            history,
            historyIndex
        } = this.setState(prev => ({historyIndex: Math.max(0, prev.historyIndex - 1)}));
        const globState = manager.setState();

        for (const i of history[historyIndex]) i.undo(globState)
    }

    redo() {
        const {
            history,
            historyIndex
        } = this.setState(prev => ({historyIndex: Math.min(prev.history.length, prev.historyIndex + 1)}));
        const globState = manager.setState();

        for (const i of history[historyIndex - 1]) i.redo(globState)
    }
}