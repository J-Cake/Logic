import * as _ from 'lodash';

import StateManager from "./sys/util/stateManager";
import {State} from "./State";

export default class history extends StateManager<{
    history: Partial<State>[];
    historyIndex: number;
}> {

    maxHistorySize: number

    constructor(initial: State) {
        super({
            history: [initial],
            historyIndex: 0
        });
        this.maxHistorySize = 50;
    }

    undo() {
        const state = this.setState(prev => ({
            historyIndex: prev.historyIndex - 1
        }));

        this.recallState(state.history[state.historyIndex]);
    }

    redo() {
        const state = this.setState(prev => ({
            historyIndex: Math.min(prev.historyIndex + 1, prev.history.length - 1)
        }));

        this.recallState(state.history[state.historyIndex]);
    }

    pushState(state: Partial<State>) {
        this.setState(prev => ({
            history: prev.history.slice(0, prev.historyIndex).concat([this.getDiff(state, prev.history[history.length - 1])])
        }));
    }

    private recallState(state: Partial<State>) {
        // console.log()
    }

    private getDiff(object: any, base: any) {
        const changes = (object: any, base: any) => _.transform(object, (result: any, value: any, key: keyof any) => {
            if (!_.isEqual(value, base[key]))
                result[key] = (_.isObject(value) && _.isObject(base[key])) ? changes(value, base[key]) : value;
        });

        return changes(object, base);
    }
}