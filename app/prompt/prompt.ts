import * as $ from "jquery";
import * as Mousetrap from "mousetrap";

import StateManager from "../src/sys/util/stateManager";

declare global {
    interface Window {
        stateManager: StateManager<any>;
        init: (state: Partial<any>) => void,
        connect: (callback: Function) => void
    }

    interface Array<T> {
        last(i?: number): T;
    }
}
Array.prototype.last = function (i: number = 0) {
    return this[this.length - (Math.max(i, 0) + 1)];
}

export const mousetrap = new Mousetrap();

mousetrap.bind('esc', () => window.close());

export const connect = window.connect = (callback: Function) => window.dispatchEvent(new CustomEvent('connect', {
    detail: window.init = function (state: Partial<any>) {
        callback(state);
    }.bind(window)
}));